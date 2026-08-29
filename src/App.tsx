import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  CharacterStyle,
  DurakMode,
  GameAction,
  GameState,
  MoveLogItem,
  PlayerConfig,
  PlayerState,
  TablePair
} from './types/durak';
import { DurakEngine, formatCard } from './services/durakEngine';
import { durakJudge } from './services/durakJudge';
import { buildGameOverSpeechPrompt, CHARACTER_PROFILES } from './services/prompts';
import { lmStudioService } from './services/lmStudioClient';
import { sounds } from './services/soundEffects';
import { speechService } from './services/speechService';
import { currencyService, CurrencyCode } from './services/currencyService';
import { CardTable } from './components/CardTable/CardTable';
import { PlayerHand } from './components/PlayerHand/PlayerHand';
import { GameControls } from './components/GameControls/GameControls';
import { ThinkingSpoiler } from './components/Thinking/ThinkingSpoiler';
import { MoveHistory } from './components/MoveHistory/MoveHistory';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { GameOverModal } from './components/GameOverModal/GameOverModal';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { cn } from './lib/utils';
import { Brain, Coins, History, Loader2, Mic, MicOff, Pause, Play, RefreshCw, Settings, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';

const DEFAULT_PLAYERS: PlayerConfig[] = [
  {
    id: 'player_human',
    name: 'Кожаный мешок',
    type: 'human',
    style: 'nikolaich'
  },
  {
    id: 'player_bot_1',
    name: 'Николаич (Батя Двора)',
    type: 'llm',
    provider: 'lmstudio',
    modelId: 'default',
    style: 'nikolaich'
  }
];

export const App: React.FC = () => {
  const initialPlayers = (() => {
    try {
      const saved = localStorage.getItem('durak_players');
      if (saved) {
        const parsed: PlayerConfig[] = JSON.parse(saved);
        return parsed.map(p => {
          if (p.style === 'baba_klava' && (p.name === 'Баба Клава' || p.name.includes('Клава'))) {
            return { ...p, name: 'Баба Нюра' };
          }
          return p;
        });
      }
    } catch {}
    return DEFAULT_PLAYERS;
  })();

  const initialMode = (() => {
    try {
      const saved = localStorage.getItem('durak_mode');
      if (saved === 'podkidnoy' || saved === 'perevodnoy') return saved;
    } catch {}
    return 'podkidnoy';
  })();

  const [mode, setMode] = useState<DurakMode>(initialMode);
  const [playersConfig, setPlayersConfig] = useState<PlayerConfig[]>(initialPlayers);

  const [lmStudioBaseUrl, setLmStudioBaseUrl] = useState(() => {
    try {
      const saved = localStorage.getItem('durak_lm_url');
      if (saved) return saved;
    } catch {}
    return 'http://localhost:1234/v1';
  });

  const [openRouterApiKey, setOpenRouterApiKey] = useState(() => {
    try {
      const saved = localStorage.getItem('durak_or_key');
      if (saved) return saved;
    } catch {}
    return '';
  });

  // Currency & Session cost tracking
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => currencyService.getCurrency());
  const [sessionTotalCostUsd, setSessionTotalCostUsd] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('durak_session_cost');
      if (saved) return parseFloat(saved) || 0;
    } catch {}
    return 0;
  });
  const [playerCostsUsd, setPlayerCostsUsd] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('durak_player_costs');
      if (saved) return JSON.parse(saved) || {};
    } catch {}
    return {};
  });
  const [currentMoveCostUsd, setCurrentMoveCostUsd] = useState<number>(0);

  // Engine instance & state with full persistence restoration
  const savedStateJson = useMemo(() => {
    try {
      return localStorage.getItem('durak_saved_state');
    } catch {}
    return null;
  }, []);

  const restoredState = useMemo<GameState | null>(() => {
    if (!savedStateJson) return null;
    try {
      const parsed = JSON.parse(savedStateJson);
      if (parsed && parsed.players && parsed.players.length > 0 && parsed.deck) {
        return parsed;
      }
    } catch {}
    return null;
  }, [savedStateJson]);

  const engineRef = useRef<DurakEngine>(
    restoredState
      ? DurakEngine.fromState(restoredState)
      : new DurakEngine(initialPlayers, initialMode)
  );

  const [gameState, setGameState] = useState<GameState>(
    () => restoredState || engineRef.current.getState()
  );

  // Interactive selection state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedTablePairId, setSelectedTablePairId] = useState<string | null>(null);

  // Live LLM state
  const [thinkingPlayerIndex, setThinkingPlayerIndex] = useState<number | null>(null);
  const [lastThinkingPlayerName, setLastThinkingPlayerName] = useState<string>('');
  const [liveThinkingText, setLiveThinkingText] = useState('');
  const [isStreamingThinking, setIsStreamingThinking] = useState(false);
  const [tokensPerSecond, setTokensPerSecond] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);

  const [speechBubbles, setSpeechBubbles] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('durak_saved_speech');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [moveHistory, setMoveHistory] = useState<MoveLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('durak_saved_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [statusMessage, setStatusMessage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('durak_saved_status');
      if (saved) return saved;
    } catch {}
    return 'Игра готова к продолжению';
  });

  // UI state
  const [isMuted, setIsMuted] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(() => {
    try {
      return localStorage.getItem('durak_tts') === 'true';
    } catch {}
    return false;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [gameOverSpeech, setGameOverSpeech] = useState<string | undefined>();
  const [isGameBusy, setIsGameBusy] = useState(false);
  
  // Mobile Tab state ('game' | 'thinking' | 'history')
  const [mobileTab, setMobileTab] = useState<'game' | 'thinking' | 'history'>('game');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-save game state on every change so F5 preserves the full game seamlessly
  useEffect(() => {
    try {
      if (gameState) {
        localStorage.setItem('durak_saved_state', JSON.stringify(gameState));
        localStorage.setItem('durak_saved_history', JSON.stringify(moveHistory));
        localStorage.setItem('durak_saved_speech', JSON.stringify(speechBubbles));
        localStorage.setItem('durak_saved_status', statusMessage);
      }
    } catch {}
  }, [gameState, moveHistory, speechBubbles, statusMessage]);

  // Sync speech service & animation speed initial state
  useEffect(() => {
    speechService.setEnabled(isTtsEnabled);
    try {
      const savedSpeed = localStorage.getItem('durak_anim_speed') || '1';
      const durationMap: Record<string, number> = {
        '0.25': 1.4,
        '0.5': 0.8,
        '1': 0.45,
        '1.5': 0.25,
        '0': 0.01
      };
      const dur = durationMap[savedSpeed] ?? 0.45;
      document.documentElement.style.setProperty('--card-anim-duration', `${dur}s`);
    } catch {}
  }, []);

  // Sync sounds & speech state
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
  };

  const handleToggleTts = () => {
    const next = !isTtsEnabled;
    setIsTtsEnabled(next);
    speechService.setEnabled(next);
    try {
      localStorage.setItem('durak_tts', String(next));
    } catch {}
    if (next) {
      speechService.speak('Озвучка включена! Ну держись, Кожаный мешок!', 'nikolaich');
    }
  };

  const handleTogglePause = () => {
    setIsPaused(prev => {
      const next = !prev;
      setStatusMessage(next ? '⏸️ Игра на паузе' : 'Игра продолжается');
      return next;
    });
  };

  // Reset Session Costs
  const handleResetSessionCosts = () => {
    setSessionTotalCostUsd(0);
    setPlayerCostsUsd({});
    setCurrentMoveCostUsd(0);
    localStorage.removeItem('durak_session_cost');
    localStorage.removeItem('durak_player_costs');
  };

  // Start / Restart Game (Preserves cumulative session costs)
  const startNewGame = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    try {
      localStorage.removeItem('durak_saved_state');
      localStorage.removeItem('durak_saved_history');
      localStorage.removeItem('durak_saved_speech');
      localStorage.removeItem('durak_saved_status');
    } catch {}

    const newEngine = new DurakEngine(playersConfig, mode);
    engineRef.current = newEngine;
    const freshState = newEngine.getState();
    setGameState({ ...freshState });
    setSelectedCard(null);
    setSelectedTablePairId(null);
    setThinkingPlayerIndex(null);
    setLiveThinkingText('');
    setIsStreamingThinking(false);
    setTokensPerSecond(0);
    setTokenCount(0);
    setCurrentMoveCostUsd(0);
    setSpeechBubbles({});
    setMoveHistory([]);
    setIsGameOverOpen(false);
    setGameOverSpeech(undefined);
    setIsGameBusy(false);

    sounds.playCardDrop();
    const firstPlayer = freshState.players[freshState.attackerIndex];
    setStatusMessage(`Первый ход: ${firstPlayer.config.name}`);
  }, [playersConfig, mode]);

  // Determine active player
  const getCurrentTurnPlayerIndex = useCallback((): number => {
    const state = gameState;
    if (state.phase === 'game_over') return -1;

    // If defender is taking cards in chase
    if (state.phase === 'taking') {
      const activeAttackers = state.players.filter(
        p => p.index !== state.defenderIndex && !p.isOut && p.hand.length > 0
      );
      const unpassed = activeAttackers.find(p => !p.hasPassed);
      if (unpassed) return unpassed.index;
      return state.attackerIndex;
    }

    const uncovered = state.table.filter(p => !p.defendCard);
    if (uncovered.length > 0) return state.defenderIndex;
    if (state.table.length === 0) return state.attackerIndex;

    const activeAttackers = state.players.filter(
      p => p.index !== state.defenderIndex && !p.isOut && p.hand.length > 0
    );
    const unpassed = activeAttackers.find(p => !p.hasPassed);
    if (unpassed) return unpassed.index;

    return state.attackerIndex;
  }, [gameState]);

  const activePlayerIndex = getCurrentTurnPlayerIndex();
  const activePlayer = gameState.players[activePlayerIndex];
  const isHumanTurn = activePlayer?.isHuman ?? false;
  const legalActions = activePlayerIndex >= 0 ? engineRef.current.getLegalActions(activePlayerIndex) : [];

  // Dedicated LLM turn trigger (robust and non-aborting on re-renders)
  const triggerLlmMove = useCallback(
    async (turnPlayerIndex: number) => {
      const engine = engineRef.current;
      const state = engine.getState();
      if (state.phase === 'game_over') return;

      const player = state.players[turnPlayerIndex];
      if (!player || player.isHuman) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsGameBusy(true);
      setThinkingPlayerIndex(turnPlayerIndex);
      setLastThinkingPlayerName(player.config.name);
      setLiveThinkingText('');
      setIsStreamingThinking(true);
      setCurrentMoveCostUsd(0);

      try {
        const lastComment = Object.values(speechBubbles).slice(-1)[0];
        console.log(`[App] Triggering LLM move for ${player.config.name} (${player.config.modelId})`);

        const result = await durakJudge.executeLlmTurn({
          engine,
          playerIndex: turnPlayerIndex,
          playerConfig: player.config,
          lastOpponentComment: lastComment,
          lmStudioBaseUrl,
          openRouterApiKey,
          maxRetries: 3,
          callbacks: {
            onThinkingChunk: (_chunk, full) => {
              setLiveThinkingText(full);
            },
            onContentChunk: (_chunk, full) => {
              setLiveThinkingText(prev => prev ? prev : full);
            },
            onThinkingFinished: () => {
              setIsStreamingThinking(false);
            },
            onStatusUpdate: status => {
              setStatusMessage(status);
            },
            onTokenMetrics: m => {
              setTokensPerSecond(m.tokensPerSecond);
              setTokenCount(m.totalTokens);
              if (m.costUsd !== undefined) {
                setCurrentMoveCostUsd(m.costUsd);
              }
            }
          },
          abortSignal: controller.signal
        });

        const nextState = engine.getState();
        setGameState({ ...nextState });

        const moveCost = result.costUsd || 0;
        setCurrentMoveCostUsd(moveCost);

        // Accumulate session and player costs
        if (moveCost > 0) {
          setSessionTotalCostUsd(prev => {
            const next = prev + moveCost;
            localStorage.setItem('durak_session_cost', String(next));
            return next;
          });
          setPlayerCostsUsd(prev => {
            const next = { ...prev, [player.config.id]: (prev[player.config.id] || 0) + moveCost };
            localStorage.setItem('durak_player_costs', JSON.stringify(next));
            return next;
          });
        }

        if (result.comment) {
          setSpeechBubbles(prev => ({ ...prev, [turnPlayerIndex]: result.comment! }));
          if (isTtsEnabled) {
            speechService.speak(result.comment, player.config.style);
          }
        }

        setMoveHistory(prev => [
          ...prev,
          {
            id: `move_${Date.now()}`,
            moveNumber: nextState.moveNumber,
            roundNumber: nextState.roundNumber,
            playerIndex: turnPlayerIndex,
            playerName: player.config.name,
            action: result.action,
            actionText: result.actionText,
            comment: result.comment,
            thoughtText: result.thoughtText,
            timestamp: Date.now(),
            tokensPerSecond: result.tokensPerSecond,
            tokenCount: result.tokenCount,
            costUsd: result.costUsd
          }
        ]);

        setStatusMessage(`${player.config.name}: ${result.actionText}`);

        if (nextState.phase === 'game_over') {
          handleGameOver(nextState);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          console.log('[App] LLM move was aborted.');
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[App] LLM move failed:', err);
        setStatusMessage(`Ошибка хода: ${msg}`);
      } finally {
        setIsGameBusy(false);
        setThinkingPlayerIndex(null);
        setIsStreamingThinking(false);
      }
    },
    [gameState.phase, gameState.moveNumber, lmStudioBaseUrl, openRouterApiKey, isTtsEnabled, speechBubbles]
  );

  // Auto-play trigger for LLM turns
  const autoTurnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPaused || isGameBusy || gameState.phase === 'game_over') return;
    if (!activePlayer || activePlayer.isHuman) return;

    if (autoTurnTimeoutRef.current) {
      clearTimeout(autoTurnTimeoutRef.current);
    }

    autoTurnTimeoutRef.current = setTimeout(() => {
      triggerLlmMove(activePlayerIndex);
    }, 400);

    return () => {
      if (autoTurnTimeoutRef.current) {
        clearTimeout(autoTurnTimeoutRef.current);
      }
    };
  }, [activePlayerIndex, activePlayer, isGameBusy, isPaused, gameState.phase, gameState.moveNumber, triggerLlmMove]);

  // Handle Game Over
  const handleGameOver = async (finalState: GameState) => {
    sounds.playVictory();
    setIsGameOverOpen(true);

    const durak = finalState.durakIndex !== null ? finalState.players[finalState.durakIndex] : null;
    const winner = finalState.winnerOrder.length > 0 ? finalState.players[finalState.winnerOrder[0]] : null;

    if (durak && !durak.isHuman) {
      try {
        const speechPrompt = buildGameOverSpeechPrompt(
          durak.config.style,
          false,
          true,
          finalState.isEpaulettes,
          durak.config.name
        );
        const res = await lmStudioService.streamMove({
          provider: durak.config.provider,
          baseUrl: lmStudioBaseUrl,
          apiKey: openRouterApiKey,
          modelId: durak.config.modelId || 'mock-ai',
          systemPrompt: speechPrompt.systemPrompt,
          userPrompt: speechPrompt.userPrompt,
          callbacks: {
            onThinkingChunk: () => {},
            onContentChunk: () => {},
            onThinkingFinished: () => {},
            onStatusUpdate: () => {}
          }
        });
        const cleanSpeech = res.fullContent.replace(/<[^>]+>/g, '').trim();
        setGameOverSpeech(cleanSpeech);
        if (isTtsEnabled) {
          speechService.speak(cleanSpeech, durak.config.style);
        }
      } catch {
        setGameOverSpeech(
          finalState.isEpaulettes
            ? 'Да как так-то?! Мало того что в дураках, так еще и с погонами оставили!'
            : 'В следующий раз я обязательно отыграюсь!'
        );
      }
    } else if (winner && !winner.isHuman) {
      setGameOverSpeech(
        finalState.isEpaulettes
          ? 'Ха! Получай шестерочные погоны, юный гроссмейстер!'
          : 'Чистая и безоговорочная победа по всем статьям!'
      );
    }
  };

  // Auto-detect game over phase
  useEffect(() => {
    if (gameState.phase === 'game_over' && !isGameOverOpen) {
      handleGameOver(gameState);
    }
  }, [gameState.phase, isGameOverOpen]);

  // Human card click handler
  const handleSelectCard = (card: Card) => {
    if (isGameBusy) return;

    const state = gameState;
    const uncovered = state.table.filter(p => !p.defendCard);
    const trumpSuit = state.trumpSuit || 'spades';
    const isDefender = state.defenderIndex === 0;

    // 1. Initial Attack (Human starts round)
    if (state.table.length === 0 && state.attackerIndex === 0) {
      const action: GameAction = { type: 'ATTACK', playerIndex: 0, card };
      const res = engineRef.current.applyAction(action);
      if (res.success) {
        sounds.playCardDrop();
        setGameState({ ...engineRef.current.getState() });
        setSelectedCard(null);
      } else {
        sounds.playError();
        setStatusMessage(res.message || 'Нельзя сделать этот ход');
      }
      return;
    }

    // 2. Defend / Transfer (Human defends against attacker's cards)
    if (isDefender && uncovered.length > 0) {
      if (state.mode === 'perevodnoy' && state.table.every(p => !p.defendCard)) {
        const tableRank = state.table[0].attackCard.rank;
        if (card.rank === tableRank) {
          const action: GameAction = { type: 'TRANSFER', playerIndex: 0, card };
          const res = engineRef.current.applyAction(action);
          if (res.success) {
            sounds.playCardDrop();
            setGameState({ ...engineRef.current.getState() });
            setSelectedCard(null);
            setSelectedTablePairId(null);
            return;
          }
        }
      }

      let targetPair = selectedTablePairId ? state.table.find(p => p.id === selectedTablePairId) : null;
      if (!targetPair || targetPair.defendCard) {
        targetPair = uncovered.find(p => engineRef.current.canBeat(p.attackCard, card, trumpSuit)) || null;
      }

      if (targetPair && engineRef.current.canBeat(targetPair.attackCard, card, trumpSuit)) {
        const action: GameAction = {
          type: 'DEFEND',
          playerIndex: 0,
          attackCardId: targetPair.id,
          card
        };
        const res = engineRef.current.applyAction(action);
        if (res.success) {
          sounds.playCardDefend();
          setGameState({ ...engineRef.current.getState() });
          setSelectedCard(null);
          setSelectedTablePairId(null);
        } else {
          sounds.playError();
          setStatusMessage(res.message || 'Не удалось побить');
        }
      } else {
        sounds.playError();
        setStatusMessage(`Карта ${formatCard(card)} не может побить выбранную карту!`);
      }
      return;
    }

    // 3. Tossing (Human tosses cards - either initial attacker or other tosser)
    if (!isDefender && state.table.length > 0) {
      const ranks = engineRef.current.getTableRanks();
      if (ranks.has(card.rank)) {
        const action: GameAction = { type: 'ATTACK', playerIndex: 0, card };
        const res = engineRef.current.applyAction(action);
        if (res.success) {
          sounds.playCardDrop();
          setGameState({ ...engineRef.current.getState() });
          setSelectedCard(null);
          setStatusMessage(`Подкинута карта ${formatCard(card)}`);
        } else {
          sounds.playError();
          setStatusMessage(res.message || `Нельзя подкинуть карту!`);
        }
      } else {
        sounds.playError();
        setStatusMessage(`Нельзя подкинуть ${formatCard(card)}: этого достоинства нет на столе!`);
      }
      return;
    }
  };

  // Human Action (Pass / Take)
  const handleHumanAction = (action: GameAction) => {
    if (!isHumanTurn || isGameBusy) return;

    const res = engineRef.current.applyAction(action);
    if (res.success) {
      if (action.type === 'PASS') sounds.playPass();
      if (action.type === 'TAKE') sounds.playTake();

      const nextState = engineRef.current.getState();
      setGameState({ ...nextState });
      setSelectedCard(null);
      setSelectedTablePairId(null);

      if (nextState.phase === 'game_over') {
        handleGameOver(nextState);
      }
    }
  };

  const humanPlayer = gameState.players[0];

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Top Header */}
      <header className="h-11 sm:h-12 w-full border-b border-slate-800/80 bg-slate-950/95 px-3 sm:px-4 py-1.5 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20">
            🃏
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-100 flex items-center">
              LLM ДУРАК
            </h1>
          </div>
        </div>

        {/* Session Cost & Status Message */}
        <div className="flex items-center gap-2">
          {/* Cumulative Session Cost */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 font-bold hover:bg-emerald-900/60 transition-colors shadow-sm"
            title="Нажмите, чтобы настроить валюту или сбросить расходы"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Сеанс: {currencyService.formatCost(sessionTotalCostUsd, currencyCode)}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] sm:text-xs text-amber-300 font-medium max-w-[200px] sm:max-w-md truncate shadow-inner">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
            <span className="truncate">{statusMessage}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Pause / Resume Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTogglePause}
            className={cn(
              'h-7 text-xs border-slate-700 bg-slate-900/80 px-2 sm:px-2.5 font-bold transition-all',
              isPaused && 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400 animate-pulse'
            )}
            title={isPaused ? 'Снять с паузы (Продолжить игру)' : 'Поставить игру на паузу'}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3 mr-1 text-emerald-400 fill-emerald-400" />
                <span>Пуск</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 mr-1 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">Пауза</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={startNewGame}
            disabled={isGameBusy}
            className="h-7 text-xs border-slate-700 bg-slate-900/80 px-2 sm:px-3"
            title="Раздать карты на новый раунд (расходы сеанса сохраняются)"
          >
            <RefreshCw className="w-3 h-3 mr-1 text-amber-400" />
            <span className="hidden sm:inline">Раздать</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="h-7 w-7 border-slate-700 bg-slate-900/80"
            title="Настройки игры, валюты и моделей"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleMute}
            className="h-7 w-7 border-slate-700 bg-slate-900/80"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleTts}
            className="h-7 w-7 border-slate-700 bg-slate-900/80"
          >
            {isTtsEnabled ? <Mic className="w-3.5 h-3.5 text-amber-400" /> : <MicOff className="w-3.5 h-3.5 text-slate-500" />}
          </Button>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="flex lg:hidden items-center justify-center w-full px-2 py-1 bg-slate-950/90 border-b border-slate-800/80 shrink-0">
        <div className="grid grid-cols-3 w-full max-w-md bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setMobileTab('thinking')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all',
              mobileTab === 'thinking'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Мысли</span>
            {isStreamingThinking && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setMobileTab('game')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all',
              mobileTab === 'game'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <span>🃏</span>
            <span>Игра</span>
          </button>

          <button
            onClick={() => setMobileTab('history')}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all',
              mobileTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Лог</span>
            {moveHistory.length > 0 && (
              <span
                className={cn(
                  'text-[9px] px-1 py-0 rounded-full font-bold',
                  mobileTab === 'history' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-300'
                )}
              >
                {moveHistory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Full-Screen 3-Column Arena & Mobile Tabs View */}
      <main className="flex-1 min-h-0 w-full px-2 sm:px-3 py-1.5 sm:py-2 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 overflow-hidden items-stretch">
        
        {/* Left Column (3 cols on lg): Thinking Stream Panel */}
        <div
          className={cn(
            'flex-col h-full min-h-0 overflow-hidden',
            mobileTab === 'thinking' ? 'flex col-span-1' : 'hidden',
            'lg:flex lg:col-span-3 xl:col-span-3'
          )}
        >
          <ThinkingSpoiler
            thinkingText={liveThinkingText}
            isStreaming={isStreamingThinking}
            tokensPerSecond={tokensPerSecond}
            tokenCount={tokenCount}
            costUsd={currentMoveCostUsd}
            currencyCode={currencyCode}
            characterName={
              thinkingPlayerIndex !== null
                ? gameState.players[thinkingPlayerIndex]?.config.name
                : lastThinkingPlayerName || gameState.players.find(p => !p.isHuman)?.config.name
            }
            className="h-full"
          />
        </div>

        {/* Center Column (6 cols on lg): Card Table + Hand + Controls */}
        <div
          className={cn(
            'flex-col justify-between gap-1.5 h-full min-h-0 overflow-hidden',
            mobileTab === 'game' ? 'flex col-span-1' : 'hidden',
            'lg:flex lg:col-span-6 xl:col-span-6'
          )}
        >
          {/* Card Table */}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <CardTable
              state={gameState}
              activePlayerIndex={activePlayerIndex}
              thinkingPlayerIndex={thinkingPlayerIndex}
              tokensPerSecond={tokensPerSecond}
              speechBubbles={speechBubbles}
              selectedTablePairId={selectedTablePairId}
              onSelectTablePair={pairId => setSelectedTablePairId(pairId)}
              playerCostsUsd={playerCostsUsd}
              currencyCode={currencyCode}
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
            />
          </div>

          {/* Player Hand & Controls Box */}
          <div className="shrink-0 w-full rounded-2xl bg-slate-900/90 border border-slate-800/90 p-2 backdrop-blur-md shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between px-2 pb-0.5 border-b border-slate-800/60 text-[11px]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {humanPlayer?.config.type === 'llm' ? (
                  <>
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <span>🤖 {humanPlayer.config.name}</span>
                    </span>
                    <Badge variant="outline" className="text-[8.5px] px-1.5 py-0 border-amber-500/40 text-amber-300 font-mono">
                      {humanPlayer.config.modelId && humanPlayer.config.modelId !== 'default'
                        ? humanPlayer.config.modelId.replace(/^.*\//, '')
                        : humanPlayer.config.provider === 'lmstudio'
                        ? 'LM Studio'
                        : 'OpenRouter'}
                    </Badge>
                    <span
                      className={cn(
                        'text-[8.5px] font-mono font-bold px-1.5 py-0 rounded border flex items-center gap-0.5 shrink-0',
                        humanPlayer.config.provider === 'lmstudio'
                          ? 'text-slate-400 bg-slate-800/80 border-slate-700/50'
                          : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                      )}
                    >
                      💸 {currencyService.formatCost(playerCostsUsd[humanPlayer.config.id] || 0, currencyCode)}
                    </span>
                    {thinkingPlayerIndex === humanPlayer.index && (
                      <span className="text-[8.5px] font-mono text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1 rounded animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
                        {tokensPerSecond > 0 ? `${tokensPerSecond.toFixed(1)} т/с` : 'Думает...'}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="font-bold text-slate-200">👤 {humanPlayer?.config.name}</span>
                )}

                {isHumanTurn && (
                  <Badge variant="default" className="text-[9px] bg-amber-500 text-slate-950 font-black animate-pulse py-0 px-1">
                    {humanPlayer?.config.type === 'llm' ? 'ХОД БОТА' : 'ТВОЙ ХОД!'}
                  </Badge>
                )}
                {gameState.phase === 'taking' && isHumanTurn && (
                  <Badge variant="destructive" className="text-[9px] font-black animate-pulse py-0 px-1">
                    ПОДКИДЫВАНИЕ ВДОГОНКУ
                  </Badge>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {humanPlayer?.hand.length || 0} карт на руках
              </span>
            </div>

            <PlayerHand
              hand={humanPlayer?.hand || []}
              trumpSuit={gameState.trumpSuit}
              legalActions={isHumanTurn ? legalActions : []}
              selectedCard={selectedCard}
              onSelectCard={handleSelectCard}
              disabled={isGameBusy}
              isMyTurn={isHumanTurn}
            />

            <GameControls
              legalActions={isHumanTurn ? legalActions : []}
              isHumanTurn={isHumanTurn}
              isTakingPhase={gameState.phase === 'taking'}
              onAction={handleHumanAction}
              onNewGame={startNewGame}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              isTtsEnabled={isTtsEnabled}
              onToggleTts={handleToggleTts}
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              isGameBusy={isGameBusy}
            />
          </div>
        </div>

        {/* Right Column (3 cols on lg): Move History & Dialogues Panel */}
        <div
          className={cn(
            'flex-col h-full min-h-0 overflow-hidden',
            mobileTab === 'history' ? 'flex col-span-1' : 'hidden',
            'lg:flex lg:col-span-3 xl:col-span-3'
          )}
        >
          <MoveHistory history={moveHistory} currencyCode={currencyCode} className="h-full" />
        </div>
      </main>

      {/* Settings & Game Over Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mode={mode}
        onSaveMode={m => setMode(m)}
        playersConfig={playersConfig}
        onSavePlayers={p => {
          setPlayersConfig(p);
          engineRef.current.updatePlayersConfig(p);
          setGameState({ ...engineRef.current.getState() });
        }}
        lmStudioBaseUrl={lmStudioBaseUrl}
        onSaveLmStudioUrl={url => setLmStudioBaseUrl(url)}
        openRouterApiKey={openRouterApiKey}
        onSaveOpenRouterKey={k => setOpenRouterApiKey(k)}
        currencyCode={currencyCode}
        onSaveCurrency={c => setCurrencyCode(c)}
        onResetSessionCosts={handleResetSessionCosts}
        sessionTotalCostUsd={sessionTotalCostUsd}
      />

      <GameOverModal
        isOpen={isGameOverOpen}
        onClose={() => setIsGameOverOpen(false)}
        state={gameState}
        onNewGame={startNewGame}
        gameOverSpeech={gameOverSpeech}
      />
    </div>
  );
};

export default App;
