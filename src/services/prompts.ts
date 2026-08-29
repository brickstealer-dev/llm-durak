import { Card, CharacterProfile, CharacterStyle, DurakMode, GameAction, GameState, PlayerConfig, PlayerState, TablePair } from '../types/durak';
import { formatCard, formatCardLong, SUIT_NAMES_RU, SUIT_SYMBOLS } from './durakEngine';

import { characterService } from './characterService';

export const CHARACTER_PROFILES: Record<string, CharacterProfile> = new Proxy({} as Record<string, CharacterProfile>, {
  get: (_target, prop: string) => {
    return characterService.getCharacter(prop);
  },
  ownKeys: () => {
    return Object.keys(characterService.getCharacters());
  },
  getOwnPropertyDescriptor: (_target, prop: string) => {
    const chars = characterService.getCharacters();
    if (prop in chars) {
      return {
        value: chars[prop],
        writable: true,
        enumerable: true,
        configurable: true
      };
    }
    return undefined;
  }
});

export function buildSystemPrompt(
  style: CharacterStyle,
  customPrompt?: string,
  mode: DurakMode = 'podkidnoy'
): string {
  const profile = characterService.getCharacter(style);
  const modeName = mode === 'perevodnoy' ? 'ПЕРЕВОДНОЙ ДУРАК' : 'ПОДКИДНОЙ ДУРАК';

  return `Ты играешь в русскую карточную игру «${modeName}».
Твоя цель — избавиться от всех карт и не остаться «в дураках».

${profile.promptFlavor}
${customPrompt ? `\n# ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${customPrompt}\n` : ''}

# АЛГОРИТМ ТВОЕГО МЫШЛЕНИЯ (Chain-of-Thought):
В каждом ходе ты ОБЯЗАН провести анализ в своем неповторимом характере:
1. Оцени козыри, расклад на столе и количество карт у соперников.
2. Выбери оптимальный ход из списка доступных легальных действий.

# ЖЕСТКИЙ ФОРМАТ ОТВЕТА:
- Рассуждения и расчет карт помести внутрь <think>...</think>.
- После рассуждений ОБЯЗАТЕЛЬНО добавь КОРОТКУЮ едкую реплику оппоненту (СТРОГО до 6-10 слов в твоем стиле/характере, 1 короткая фраза без поэтических мемуаров) в теге <comment>Твоя реплика</comment>.
- В самом конце ответа выведи выбранный ход СТРОГО в теге <move>ХОД</move> (например: <move>ATTACK 6♠</move>, <move>DEFEND 7♦ WITH 10♦</move>, <move>TRANSFER 7♠</move>, <move>PASS</move> или <move>TAKE</move>).
- ВНИМАНИЕ: Ход ОБЯЗАН быть строго из предоставленного списка легальных ходов!

Пример идеального ответа:
<think>
Козырь — пики. Оппонент пошел семеркой бубей. У меня есть десятка бубей и козырный туз. Бью десяткой бубей.
</think>
<comment>На, получай десятку, не подавись!</comment>
<move>DEFEND 7♦ WITH 10♦</move>`;
}

export function buildUserMovePrompt(
  state: GameState,
  playerIndex: number,
  legalActions: GameAction[],
  lastErrorReason?: string,
  lastOpponentComment?: string
): string {
  const player = state.players[playerIndex];
  const trumpSuit = state.trumpSuit!;
  const isDefender = playerIndex === state.defenderIndex;
  const isAttacker = playerIndex === state.attackerIndex;
  const defender = state.players[state.defenderIndex];

  let roleText = 'Атакующий (первый ход в раунде)';
  if (isDefender) {
    roleText = 'Защитник (ты должен отбиться, перевести или взять карты)';
  } else if (!isAttacker) {
    roleText = 'Подкидывающий (можешь подкинуть карты тех же рангов, что на столе, или сказать PASS)';
  }

  const handCardsStr = player.hand
    .map(c => formatCardLong(c, c.suit === trumpSuit))
    .join(', ');

  const tableStr = state.table.length === 0
    ? 'Стол пуст.'
    : state.table
        .map((p, i) => {
          const defStr = p.defendCard
            ? ` — покрыта картой ${formatCardLong(p.defendCard, p.defendCard.suit === trumpSuit)}`
            : ' — ⚠️ НЕ ПОКРЫТА!';
          return `${i + 1}. Нападение: ${formatCardLong(p.attackCard, p.attackCard.suit === trumpSuit)}${defStr}`;
        })
        .join('\n');

  const opponentsStr = state.players
    .filter(p => p.index !== playerIndex)
    .map(p => {
      const isDef = p.index === state.defenderIndex ? ' [ЗАЩИТНИК]' : '';
      const isAtt = p.index === state.attackerIndex ? ' [АТАКУЮЩИЙ]' : '';
      const out = p.isOut ? ' (ВЫШЕЛ ИЗ ИГРЫ / ПОБЕДИЛ)' : ` (${p.hand.length} карт в руке)`;
      return `- ${p.config.name}${isAtt}${isDef}: ${out}`;
    })
    .join('\n');

  const legalActionsList = legalActions
    .map((action, idx) => {
      switch (action.type) {
        case 'ATTACK':
          return `${idx + 1}. ATTACK ${formatCard(action.card)} (Пойти картой ${formatCardLong(action.card, action.card.suit === trumpSuit)})`;
        case 'DEFEND': {
          const pair = state.table.find(p => p.id === action.attackCardId);
          const attCardStr = pair ? formatCard(pair.attackCard) : 'карту';
          return `${idx + 1}. DEFEND ${attCardStr} WITH ${formatCard(action.card)} (Побить ${attCardStr} картой ${formatCardLong(action.card, action.card.suit === trumpSuit)})`;
        }
        case 'TRANSFER':
          return `${idx + 1}. TRANSFER ${formatCard(action.card)} (Перевести картой ${formatCardLong(action.card, action.card.suit === trumpSuit)})`;
        case 'PASS':
          return `${idx + 1}. PASS (Бито / пас — закончить атаку)`;
        case 'TAKE':
          return `${idx + 1}. TAKE (Беру — забрать все карты со стола)`;
      }
    })
    .join('\n');

  let prompt = `ТЕКУЩЕЕ СОСТОЯНИЕ ИГРЫ:
- Режим: ${state.mode === 'perevodnoy' ? 'Переводной дурак' : 'Подкидной дурак'}
- Козырь: ${SUIT_NAMES_RU[trumpSuit]} (открытая карта под колодой: ${state.trumpCard ? formatCard(state.trumpCard) : 'нет'})
- Карт в колоде: ${state.deck.length}
- Карт в бите: ${state.discardPile.length}
- Твоя роль: ${roleText}

ТВОЯ РУКА (${player.hand.length} карт):
${handCardsStr || '(пусто)'}

КАРТЫ НА СТОЛЕ:
${tableStr}

ДРУГИЕ ИГРОКИ:
${opponentsStr}
`;

  if (lastOpponentComment) {
    prompt += `\nРеплика соперника: «${lastOpponentComment}»\n`;
  }

  if (lastErrorReason) {
    prompt += `\n🚨 ПРЕДЫДУЩАЯ ОШИБКА: ${lastErrorReason}\nВыбери строго один ход из списка ниже!\n`;
  }

  prompt += `\nДОСТУПНЫЕ ЛЕГАЛЬНЫЕ ХОДЫ (выбери СТРОГО один из них):
${legalActionsList}

ИНСТРУКЦИЯ ПО ВЫБОРУ ХОДА:
1. В тегах <think>...</think> оцени карты и выбери лучший ход.
2. В тегах <comment>...</comment> напиши 1 короткую реплику оппоненту в своем характере.
3. В теге <move>...</move> напиши точное действие или номер хода (например: <move>1</move> или <move>DEFEND WITH ${legalActions.find(a => a.type === 'DEFEND')?.card ? formatCard(legalActions.find(a => a.type === 'DEFEND')!.card) : 'K♣'}</move> или <move>TAKE</move>).`;

  return prompt;
}

export function buildGameOverSpeechPrompt(
  style: CharacterStyle,
  isWinner: boolean,
  isDurak: boolean,
  isEpaulettes: boolean,
  durakName: string
): { systemPrompt: string; userPrompt: string } {
  const profile = CHARACTER_PROFILES[style] || CHARACTER_PROFILES.nikolaich;

  const systemPrompt = `Партия в дурака завершена!
${profile.promptFlavor}

ТРЕБОВАНИЯ К РЕЧИ:
1. Выдай яркую, эмоциональную речь (2-4 предложения) от первого лица в своем неповторимом стиле.
2. Если ты выиграл и повесил погоны: ликуй, насмехайся над дураком с погонами!
3. Если ты остался дураком: буря эмоций, возмущение, оправдания или обещание отомстить!
4. Никаких тегов — только чистая речь персонажа на русском языке.`;

  let outcomeDesc = isDurak
    ? `Ты проиграл и остался ДУРАКОМ${isEpaulettes ? ' С ПОГОНАМИ!' : '!'}`
    : isWinner
      ? `Ты ПОБЕДИЛ в партии${isEpaulettes ? `, повесив погоны на игрока ${durakName}!` : '!'}`
      : `Партия окончена. Дураком остался ${durakName}.`;

  const userPrompt = `Итог партии: ${outcomeDesc}
Произнеси свое финальное послематчевое слово:`;

  return { systemPrompt, userPrompt };
}
