import { DurakEngine, formatCard } from './durakEngine';
import { Card, GameAction, MoveLogItem, PlayerConfig, RetryLog } from '../types/durak';
import { llmService, StreamCallbacks, DEFAULT_POLLINATIONS_API_KEY } from './llmClient';
import { buildSystemPrompt, buildUserMovePrompt, CHARACTER_PROFILES } from './prompts';
import { sounds } from './soundEffects';

export interface ExecuteDurakTurnParams {
  engine: DurakEngine;
  playerIndex: number;
  playerConfig: PlayerConfig;
  lastOpponentComment?: string;
  pollinationsApiKey?: string;
  lmStudioBaseUrl: string;
  openRouterApiKey?: string;
  customBaseUrl?: string;
  customApiKey?: string;
  maxRetries?: number;
  callbacks: StreamCallbacks & {
    onRetry?: (retry: RetryLog, totalRetries: number) => void;
  };
  abortSignal?: AbortSignal;
}

export interface DurakTurnResult {
  success: boolean;
  action: GameAction;
  actionText: string;
  comment?: string;
  thoughtText?: string;
  tokenCount?: number;
  tokensPerSecond?: number;
  costUsd?: number;
  retries: RetryLog[];
}

export class DurakJudge {
  /**
   * Ultra-robust multi-strategy parser for LLM moves in Durak
   */
  public parseAction(
    fullContent: string,
    rawResponse: string,
    fullThinking: string,
    legalActions: GameAction[],
    engine: DurakEngine
  ): { action?: GameAction; comment?: string; rawMoveStr: string; error?: string } {
    let comment: string | undefined;
    let rawMoveStr = '';

    const combinedText = `${fullContent}\n${rawResponse}`.trim();

    // 1. Extract comment from <comment>...</comment>
    const commentMatch = combinedText.match(/<comment>\s*([\s\S]*?)\s*<\/comment>/i) ||
      fullThinking.match(/<comment>\s*([\s\S]*?)\s*<\/comment>/i);
    if (commentMatch && commentMatch[1]) {
      comment = commentMatch[1].trim().replace(/^["'`]|["'`]$/g, '');
    }

    // 2. Extract move content from <move>...</move>
    const moveMatch = combinedText.match(/<move>\s*([\s\S]*?)\s*<\/move>/i) ||
      fullThinking.match(/<move>\s*([\s\S]*?)\s*<\/move>/i);
    
    if (moveMatch && moveMatch[1]) {
      rawMoveStr = moveMatch[1].trim();
    } else {
      // Fallback A: JSON {"move": "..."}
      const jsonMatch = combinedText.match(/"move"\s*:\s*"([^"\n\r]+)"/i);
      if (jsonMatch && jsonMatch[1]) {
        rawMoveStr = jsonMatch[1].trim();
      } else {
        // Fallback B: Look for explicit lines starting with ATTACK/DEFEND/TRANSFER/PASS/TAKE or "Ход:" in non-thinking content
        const lines = combinedText.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (/^(ATTACK|DEFEND|TRANSFER|PASS|TAKE|БИТО|ПАС|БЕРУ|ВЗЯТЬ|ХОД:|\d+\.)/i.test(trimmed)) {
            rawMoveStr = trimmed.replace(/^ХОД:\s*/i, '').trim();
            break;
          }
        }
      }
    }

    // If still no move string, check if content has just 1-2 words
    if (!rawMoveStr && combinedText) {
      const clean = combinedText.replace(/<[^>]+>/g, '').trim();
      if (clean.length < 50) {
        rawMoveStr = clean;
      }
    }

    const moveUpper = rawMoveStr.toUpperCase().trim();

    // 3. Strategy 1: Explicit numbered choice (e.g. "1", "2", "3", "1.", "#2")
    const numMatch = moveUpper.match(/^#?(\d+)\b/);
    if (numMatch && numMatch[1]) {
      const optionIndex = parseInt(numMatch[1], 10) - 1;
      if (optionIndex >= 0 && optionIndex < legalActions.length) {
        return { action: legalActions[optionIndex], comment, rawMoveStr };
      }
    }

    // 4. Strategy 2: Match PASS / TAKE ONLY inside rawMoveStr (NEVER from general thoughts!)
    if (
      /^PASS\b|^БИТО\b|^ПАС\b|^ОТБОЙ\b/i.test(moveUpper) ||
      moveUpper === 'PASS' ||
      moveUpper === 'БИТО' ||
      moveUpper === 'ПАС'
    ) {
      const passAction = legalActions.find(a => a.type === 'PASS');
      if (passAction) return { action: passAction, comment, rawMoveStr };
    }

    if (
      /^TAKE\b|^БЕРУ\b|^ВЗЯТЬ\b|^ЗАБИРАЮ\b/i.test(moveUpper) ||
      moveUpper === 'TAKE' ||
      moveUpper === 'БЕРУ' ||
      moveUpper === 'ВЗЯТЬ'
    ) {
      const takeAction = legalActions.find(a => a.type === 'TAKE');
      if (takeAction) return { action: takeAction, comment, rawMoveStr };
    }

    // 5. Strategy 3: Detailed card matching for DEFEND, ATTACK, TRANSFER
    const state = engine.getState();
    const trumpSuit = state.trumpSuit || 'spades';

    // Parse cards mentioned in moveUpper
    // Helper to check if a specific card is referenced in a text snippet
    const matchesCard = (card: Card, text: string): boolean => {
      const symbol = formatCard(card).toUpperCase(); // e.g. "7♣", "K♣", "10♦"
      const rank = card.rank.toUpperCase(); // "7", "K", "10"
      const suitRu = card.suit === 'spades' ? 'ПИК' : card.suit === 'hearts' ? 'ЧЕРВ' : card.suit === 'diamonds' ? 'БУБ' : 'ТРЕФ';
      const suitEn = card.suit.toUpperCase();
      const cardId = card.id.toUpperCase();

      if (text.includes(symbol)) return true;
      if (text.includes(cardId)) return true;
      if (text.includes(rank) && (text.includes(suitRu) || text.includes(suitEn))) return true;

      return false;
    };

    // If DEFEND action: look for the defense card (often after "WITH" or "КАРТОЙ" or the second card mentioned)
    if (moveUpper.includes('DEFEND') || moveUpper.includes('БЬЮ') || moveUpper.includes('ПОБИТЬ') || moveUpper.includes('WITH') || state.phase === 'defending') {
      const defendActions = legalActions.filter(a => a.type === 'DEFEND') as Extract<GameAction, { type: 'DEFEND' }>[];
      
      // Look for target card after "WITH" or "КАРТОЙ"
      const withPart = moveUpper.split(/WITH|КАРТОЙ|ПОБИТЬ|БЬЮ/i).slice(-1)[0] || moveUpper;
      
      // Check defense cards in withPart first
      for (const act of defendActions) {
        if (matchesCard(act.card, withPart)) {
          return { action: act, comment, rawMoveStr };
        }
      }

      // Check defense cards in full moveUpper
      for (const act of defendActions) {
        if (matchesCard(act.card, moveUpper)) {
          return { action: act, comment, rawMoveStr };
        }
      }
    }

    // If TRANSFER action
    if (moveUpper.includes('TRANSFER') || moveUpper.includes('ПЕРЕВОД')) {
      const transferActions = legalActions.filter(a => a.type === 'TRANSFER') as Extract<GameAction, { type: 'TRANSFER' }>[];
      for (const act of transferActions) {
        if (matchesCard(act.card, moveUpper)) {
          return { action: act, comment, rawMoveStr };
        }
      }
    }

    // If ATTACK action
    if (moveUpper.includes('ATTACK') || moveUpper.includes('ПОЙТИ') || moveUpper.includes('ХОД') || moveUpper.includes('ПОДКИД')) {
      const attackActions = legalActions.filter(a => a.type === 'ATTACK') as Extract<GameAction, { type: 'ATTACK' }>[];
      for (const act of attackActions) {
        if (matchesCard(act.card, moveUpper)) {
          return { action: act, comment, rawMoveStr };
        }
      }
    }

    // General matching: check any legal action that matches card in rawMoveStr
    for (const action of legalActions) {
      if ('card' in action && action.card) {
        if (matchesCard(action.card, moveUpper)) {
          return { action, comment, rawMoveStr };
        }
      }
    }

    // Strategy 4: Match by card rank only if unambiguous
    for (const action of legalActions) {
      if ('card' in action && action.card) {
        const rankStr = action.card.rank.toUpperCase();
        // Check word boundary rank e.g. "K", "10", "7"
        const regex = new RegExp(`\\b${rankStr}\\b`, 'i');
        if (regex.test(moveUpper)) {
          return { action, comment, rawMoveStr };
        }
      }
    }

    // Strategy 5: If moveUpper explicitly says "TAKE" or "PASS" as fallback
    if (moveUpper.includes('TAKE') || moveUpper.includes('БЕРУ')) {
      const takeAction = legalActions.find(a => a.type === 'TAKE');
      if (takeAction) return { action: takeAction, comment, rawMoveStr };
    }

    if (moveUpper.includes('PASS') || moveUpper.includes('БИТО') || moveUpper.includes('ПАС')) {
      const passAction = legalActions.find(a => a.type === 'PASS');
      if (passAction) return { action: passAction, comment, rawMoveStr };
    }

    if (!rawMoveStr) {
      return { rawMoveStr: '', error: 'Не найден тег <move> с выбранным ходом.' };
    }

    return {
      rawMoveStr,
      error: `Ход "${rawMoveStr}" не соответствует ни одному из доступных легальных ходов.`
    };
  }

  public async executeLlmTurn(params: ExecuteDurakTurnParams): Promise<DurakTurnResult> {
    const {
      engine,
      playerIndex,
      playerConfig,
      lastOpponentComment,
      lmStudioBaseUrl,
      openRouterApiKey,
      maxRetries = 3,
      callbacks,
      abortSignal
    } = params;

    const profile = CHARACTER_PROFILES[playerConfig.style] || CHARACTER_PROFILES.nikolaich;
    const systemPrompt = buildSystemPrompt(playerConfig.style, playerConfig.systemPromptCustom, engine.getState().mode);

    const retries: RetryLog[] = [];
    let currentAttempt = 1;
    let lastErrorReason: string | undefined;

    let finalThinking = '';
    let finalContent = '';
    let finalTokenCount = 0;
    let finalTokensPerSecond = 0;
    let finalCostUsd = 0;
    let finalChosenAction: GameAction | undefined;
    let finalComment: string | undefined;

    while (currentAttempt <= maxRetries) {
      if (abortSignal?.aborted) throw new Error('Ход отменен.');

      const legalActions = engine.getLegalActions(playerIndex);
      if (legalActions.length === 0) {
        throw new Error('Нет доступных легальных ходов для этого игрока.');
      }

      callbacks.onStatusUpdate(
        currentAttempt === 1
          ? `Думает ${profile.name}...`
          : `⚠️ Попытка ${currentAttempt}/${maxRetries}: исправление хода...`
      );

      const userPrompt = buildUserMovePrompt(
        engine.getState(),
        playerIndex,
        legalActions,
        lastErrorReason,
        lastOpponentComment
      );

      let fullThinking = '';
      let fullContent = '';
      let rawResponse = '';
      let tokenCount = 0;
      let tokensPerSecond = 0;
      let costUsd = 0;

      try {
        const provider = playerConfig.provider || 'lmstudio';
        const isExplicitMock = playerConfig.modelId === 'mock-ai' && provider !== 'lmstudio' && provider !== 'openrouter';

        if (isExplicitMock) {
          const result = await llmService.simulateMockMove(
            engine.getState(),
            playerIndex,
            legalActions,
            profile.name,
            callbacks,
            abortSignal
          );
          fullThinking = result.fullThinking;
          fullContent = result.fullContent;
          rawResponse = result.rawResponse;
          tokenCount = result.tokenCount || 0;
          tokensPerSecond = result.tokensPerSecond || 0;
          costUsd = result.costUsd || 0;
        } else {
          let targetModelId = playerConfig.modelId || '';
          let targetUrl = lmStudioBaseUrl;
          let targetKey = openRouterApiKey;

          if (provider === 'pollinations') {
            targetUrl = 'https://gen.pollinations.ai/v1';
            targetKey = playerConfig.pollinationsApiKey || params.pollinationsApiKey || DEFAULT_POLLINATIONS_API_KEY;
            if (!targetModelId || targetModelId === 'default' || targetModelId === 'auto') {
              targetModelId = 'openai';
            }
          } else if (provider === 'lmstudio') {
            targetUrl = lmStudioBaseUrl;
            if (!targetModelId || targetModelId === 'default' || targetModelId === 'auto' || targetModelId === 'first_available') {
              try {
                const loadedModels = await llmService.fetchModels(lmStudioBaseUrl);
                if (loadedModels && loadedModels.length > 0) {
                  targetModelId = loadedModels[0].id;
                }
              } catch (e) {
                console.warn('[DurakJudge] Could not fetch models from LM Studio, falling back to default:', e);
              }
              if (!targetModelId || targetModelId === 'auto' || targetModelId === 'first_available') {
                targetModelId = 'default';
              }
            }
          } else if (provider === 'openrouter') {
            targetKey = openRouterApiKey;
            if (!targetModelId || targetModelId === 'default' || targetModelId === 'auto') {
              targetModelId = 'deepseek/deepseek-r1';
            }
          } else if (provider === 'custom') {
            targetUrl = playerConfig.customBaseUrl || params.customBaseUrl || 'https://gen.pollinations.ai/v1';
            targetKey = playerConfig.customApiKey || params.customApiKey || DEFAULT_POLLINATIONS_API_KEY;
            if (!targetModelId || targetModelId === 'default' || targetModelId === 'auto') {
              try {
                const loaded = await llmService.fetchCustomModels(targetUrl, targetKey);
                if (loaded && loaded.length > 0) {
                  targetModelId = loaded[0].id;
                }
              } catch {}
              if (!targetModelId || targetModelId === 'auto') {
                targetModelId = 'default';
              }
            }
          }

          console.log(`[DurakJudge] Requesting ${provider} completions at ${targetUrl} with model ${targetModelId}`);

          const result = await llmService.streamMove({
            provider,
            baseUrl: targetUrl,
            apiKey: targetKey,
            modelId: targetModelId,
            systemPrompt,
            userPrompt,
            temperature: playerConfig.temperature ?? profile.temperature,
            maxTokens: playerConfig.maxTokens,
            callbacks,
            abortSignal
          });
          fullThinking = result.fullThinking;
          fullContent = result.fullContent;
          rawResponse = result.rawResponse;
          tokenCount = result.tokenCount || 0;
          tokensPerSecond = result.tokensPerSecond || 0;
          costUsd = result.costUsd || 0;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (abortSignal?.aborted) throw err;
        callbacks.onStatusUpdate(`Ошибка: ${msg}`);

        const retryEntry: RetryLog = {
          attempt: currentAttempt,
          rawResponse: '',
          errorReason: msg,
          timestamp: Date.now()
        };
        retries.push(retryEntry);
        callbacks.onRetry?.(retryEntry, retries.length);

        if (currentAttempt >= maxRetries) {
          throw new Error(`Превышено число попыток. Ошибка: ${msg}`);
        }
        currentAttempt++;
        continue;
      }

      finalThinking = fullThinking;
      finalContent = fullContent;
      finalTokenCount = tokenCount;
      finalTokensPerSecond = tokensPerSecond;
      finalCostUsd = costUsd;

      const parseResult = this.parseAction(
        fullContent,
        rawResponse,
        fullThinking,
        legalActions,
        engine
      );

      if (parseResult.action) {
        finalChosenAction = parseResult.action;
        finalComment = parseResult.comment;
        break;
      } else {
        sounds.playError();
        lastErrorReason = parseResult.error || (parseResult.rawMoveStr ? `Нелегальный ход "${parseResult.rawMoveStr}"` : 'Не удалось распознать формат хода');
        const retryEntry: RetryLog = {
          attempt: currentAttempt,
          rawResponse,
          errorReason: lastErrorReason,
          timestamp: Date.now()
        };
        retries.push(retryEntry);
        callbacks.onRetry?.(retryEntry, retries.length);

        callbacks.onStatusUpdate(`🚨 Ошибка хода: ${lastErrorReason}. Повтор...`);
        currentAttempt++;
        if (currentAttempt <= maxRetries) {
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }

    // Fail explicitly if model failed all retries
    if (!finalChosenAction) {
      throw new Error(
        `Модель не смогла сделать легальный ход после ${maxRetries} попыток. ${lastErrorReason ? `Причина: ${lastErrorReason}` : ''}`
      );
    }

    // Apply action to engine
    const applyRes = engine.applyAction(finalChosenAction);
    if (!applyRes.success) {
      throw new Error(`Ошибка применения хода: ${applyRes.message}`);
    }

    // Sound trigger
    if (finalChosenAction.type === 'ATTACK' || finalChosenAction.type === 'TRANSFER') {
      sounds.playCardDrop();
    } else if (finalChosenAction.type === 'DEFEND') {
      sounds.playCardDefend();
    } else if (finalChosenAction.type === 'TAKE') {
      sounds.playTake();
    } else if (finalChosenAction.type === 'PASS') {
      sounds.playPass();
    }

    let actionText = '';
    switch (finalChosenAction.type) {
      case 'ATTACK':
        actionText = `Пошел картой ${formatCard(finalChosenAction.card)}`;
        break;
      case 'DEFEND':
        actionText = `Побил картой ${formatCard(finalChosenAction.card)}`;
        break;
      case 'TRANSFER':
        actionText = `Перевел картой ${formatCard(finalChosenAction.card)}`;
        break;
      case 'PASS':
        actionText = 'Бито / Пас';
        break;
      case 'TAKE':
        actionText = 'Взял карты';
        break;
    }

    return {
      success: true,
      action: finalChosenAction,
      actionText,
      comment: finalComment,
      thoughtText: finalThinking,
      tokenCount: finalTokenCount,
      tokensPerSecond: finalTokensPerSecond,
      costUsd: finalCostUsd,
      retries
    };
  }
}

export const durakJudge = new DurakJudge();
