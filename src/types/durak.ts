export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string; // e.g. "6_spades"
  suit: Suit;
  rank: Rank;
  value: number; // 6..14 for ranking
}

export interface TablePair {
  id: string;
  attackCard: Card;
  defendCard?: Card;
  attackerIndex: number;
  defenderIndex: number;
}

export type DurakMode = 'podkidnoy' | 'perevodnoy';

export type GamePhase =
  | 'idle'
  | 'dealing'
  | 'attacking'       // Waiting for initial attack
  | 'defending'       // Defender is defending or transferring
  | 'tossing'         // Attackers are tossing cards after defense
  | 'taking'          // Defender announced TAKE, attackers tossing in chase
  | 'round_end'       // Round finished (bito or taken)
  | 'game_over';

export type PlayerType = 'human' | 'llm';
export type LlmProvider = 'pollinations' | 'openrouter' | 'lmstudio' | 'custom' | (string & {});

export type CharacterStyle =
  | 'nikolaich'    // Дворовый батя с пивом и матом
  | 'shuler'       // Семён Шулер, считает все карты
  | 'professor'    // Профессор тервера
  | 'patsan'       // Пацанчик с района
  | 'baba_klava'   // Баба Нюра, ветеран преферанса
  | 'kaban'        // Вор в законе Кабан, авторитет
  | 'stockfish'    // Робот-вычислитель
  | (string & {});

export interface CharacterProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  description: string;
  temperature: number;
  promptFlavor: string;
  isCustom?: boolean;
}

export interface PlayerConfig {
  id: string;
  name: string;
  savedHumanName?: string;
  type: PlayerType;
  provider?: LlmProvider;
  modelId?: string;
  pollinationsApiKey?: string;
  customBaseUrl?: string;
  customApiKey?: string;
  style: CharacterStyle;
  temperature?: number;
  maxTokens?: number;
  systemPromptCustom?: string;
  bio?: string;
}

export interface PlayerState {
  id: string;
  index: number;
  config: PlayerConfig;
  hand: Card[];
  isHuman: boolean;
  hasPassed: boolean;     // For tossing phase
  isOut: boolean;         // Has emptied hand after deck is empty
  outRank?: number;       // 1st place, 2nd place, etc.
}

export interface GameState {
  mode: DurakMode;
  deck: Card[];
  trumpCard: Card | null;
  trumpSuit: Suit | null;
  discardPile: Card[];
  players: PlayerState[];
  attackerIndex: number;
  defenderIndex: number;
  table: TablePair[];
  phase: GamePhase;
  firstMovePlayerIndex: number;
  winnerOrder: number[];   // player indices in order of winning
  durakIndex: number | null;
  isEpaulettes: boolean;   // Победа "с погонами"
  epaulettesRanks?: Rank[];
  moveNumber: number;
  roundNumber: number;
}

export type ActionType = 'ATTACK' | 'DEFEND' | 'TRANSFER' | 'PASS' | 'TAKE';

export interface BaseAction {
  type: ActionType;
  playerIndex: number;
}

export interface AttackAction extends BaseAction {
  type: 'ATTACK';
  card: Card;
}

export interface DefendAction extends BaseAction {
  type: 'DEFEND';
  attackCardId: string;
  card: Card;
}

export interface TransferAction extends BaseAction {
  type: 'TRANSFER';
  card: Card;
}

export interface PassAction extends BaseAction {
  type: 'PASS';
}

export interface TakeAction extends BaseAction {
  type: 'TAKE';
}

export type GameAction = AttackAction | DefendAction | TransferAction | PassAction | TakeAction;

export interface MoveLogItem {
  id: string;
  moveNumber: number;
  roundNumber: number;
  playerIndex: number;
  playerName: string;
  action: GameAction;
  actionText: string;
  comment?: string;
  thoughtText?: string;
  timestamp: number;
  tokensPerSecond?: number;
  tokenCount?: number;
  costUsd?: number;
  errorsCount?: number;
  errorReasons?: string[];
}

export interface RetryLog {
  attempt: number;
  rawResponse: string;
  errorReason?: string;
  timestamp: number;
}

export interface PlayerSessionScore {
  wins: number;
  durakCount: number;
}

export interface SessionStats {
  gamesPlayed: number;
  scores: Record<string, PlayerSessionScore>;
}
