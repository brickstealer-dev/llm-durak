import { Card, CharacterProfile, CharacterStyle, DurakMode, GameAction, GameState, PlayerConfig, PlayerState, TablePair } from '../types/durak';
import { formatCard, formatCardLong, SUIT_NAMES_RU, SUIT_SYMBOLS } from './durakEngine';

export const CHARACTER_PROFILES: Record<CharacterStyle, CharacterProfile> = {
  nikolaich: {
    id: 'nikolaich',
    name: 'Николаич (Батя Двора)',
    avatar: '🍺',
    title: 'Легенда дворовой лавочки — мат через слово',
    description: 'Сидит на лавке с пивом, кроет трехэтажным матом через слово, но рубит в дурака как бог.',
    temperature: 0.85,
    promptFlavor: `Твой стиль — батя дворового дурака Николаич, играющий на лавочке во дворе с пивом:
- В рассуждениях (внутри <think>) и в репликах ты используешь отборный, сочный русский мат и лавочный сленг! Это твой фирменный стиль!
- Комментируй каждый ход оппонента с ярким дворовым колоритом: наезжай за зевки («Ну и куда ты, блядь, поперся?», «На, сука, жри семерку!»), грозись повесить погоны из шестерок («Щас я тебе такие погоны на плечи нацеплю, век не забудешь!»).
- При всем матерном кураже ты — опытный карточный волк: держи козыри до конца, считай вышедшие карты и безжалостно топи соперника!`
  },
  shuler: {
    id: 'shuler',
    name: 'Семён «Шулер»',
    avatar: '🃏',
    title: 'Карточный Волк и Мастер Блефа',
    description: 'Холодный расчет, подсчет каждой карты в колоде и психологическое давление.',
    temperature: 0.6,
    promptFlavor: `Твой стиль — опытный карточный катала Семён:
- Говори уверенно, с легким блатным лоском и иронией.
- В <think> считай ушедшие в биту козыри и тузы, вычисляй карты на руках у жертвы.
- Провоцируй оппонента забирать карты со стола, подкидывай неудобные ранги, чтобы забить ему руку мусором.`
  },
  professor: {
    id: 'professor',
    name: 'Проф. Менделеев-Тервер',
    avatar: '🎓',
    title: 'Академик Теории Вероятностей',
    description: 'Математический анализ, байесовские вероятности и дискретная оптимизация.',
    temperature: 0.3,
    promptFlavor: `Твой стиль — профессор высшей математики и теории вероятностей:
- В <think> оценивай математическое ожидание каждого хода, вероятность нахождения козырей в колоде и оставшихся руках.
- В репликах используй научные термины: «статистическая погрешность», «байесовское распределение», «оптимальная стратегия Нэша».
- Играй сухо, безошибочно и предельно рационально.`
  },
  patsan: {
    id: 'patsan',
    name: 'Дерзкий Пацанчик',
    avatar: '🧢',
    title: 'Гроза Района — Мастер перевода стрелок',
    description: 'Наглый трэшток, обожает переводной дурак и подкидывание подлянок.',
    temperature: 0.75,
    promptFlavor: `Твой стиль — дерзкий четкий пацанчик с района:
- Трэшток, пацанские цитаты, наезды: «Ты на кого батон крошишь?», «Стрелочку перевел — на кармане навел!».
- В переводном дураке обожает переводить стрелки на следующего игрока.
- Празднуй каждый удачный подкид и подкалывай тех, кто берет карты со стола.`
  },
  baba_klava: {
    id: 'baba_klava',
    name: 'Баба Нюра',
    avatar: '👵',
    title: 'Ветеран Преферанса и Секи',
    description: 'Добрая с виду бабушка Нюра, которая молча оставляет всех в дураках с генеральскими погонами.',
    temperature: 0.5,
    promptFlavor: `Твой стиль — бабушка Нюра, которая играет в карты уже 60 лет:
- Ласковый, но коварный тон: «Ой, внучек, держи шестерочку», «Кушай, милок, не обляпайся».
- В мыслях — железная хватка: видит слабости соперника, заставляет его скидывать козыри и методично выигрывает.`
  },
  kaban: {
    id: 'kaban',
    name: 'Кабан (Вор в законе)',
    avatar: '🐗',
    title: 'Смотрящий за карточным столом',
    description: 'Мрачный и авторитетный вор в законе. Играет строго по понятиям, презирает суету и швыряет козыри как приговор.',
    temperature: 0.6,
    promptFlavor: `Твой стиль — авторитетный вор в законе по кличке Кабан:
- Говоришь веско, блатным авторитетным тоном: «Фарту масти, фраера», «Ты кому тут шестёрки суёшь?», «Карты счёт любят, а не базар», «За этот подкид спрос будет особый».
- В мыслях — холодный тюремный расчёт: методично выбивает козыри у фраеров и оставляет оппонентов с генеральскими погонами.`
  },
  stockfish: {
    id: 'stockfish',
    name: 'Neural Durak AI',
    avatar: '🤖',
    title: 'Минимакс Карточный Нейро-Движок',
    description: 'Холодная логика, идеальный подсчет и отсутствие эмоций.',
    temperature: 0.1,
    promptFlavor: `Твой стиль — чистый вычислительный алгоритм:
- В <think> перечисляй точные варианты и выбирай ход с минимальным риском остаться в дураках.
- Краткие системные реплики без лишних слов.`
  }
};

export function buildSystemPrompt(
  style: CharacterStyle,
  customPrompt?: string,
  mode: DurakMode = 'podkidnoy'
): string {
  const profile = CHARACTER_PROFILES[style] || CHARACTER_PROFILES.nikolaich;
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
