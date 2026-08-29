import {
  Card,
  DurakMode,
  GameAction,
  GamePhase,
  GameState,
  PlayerConfig,
  PlayerState,
  Rank,
  Suit,
  TablePair
} from '../types/durak';

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

export const SUIT_NAMES_RU: Record<Suit, string> = {
  spades: 'Пики (♠)',
  hearts: 'Черви (♥)',
  diamonds: 'Бубны (♦)',
  clubs: 'Трефы (♣)'
};

export const RANK_NAMES_RU: Record<Rank, string> = {
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'Валет (J)',
  'Q': 'Дама (Q)',
  'K': 'Король (K)',
  'A': 'Туз (A)'
};

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES: Record<Rank, number> = {
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}_${suit}`,
        suit,
        rank,
        value: RANK_VALUES[rank]
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function formatCard(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function formatCardLong(card: Card, isTrump: boolean = false): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]} (${RANK_NAMES_RU[card.rank]} ${SUIT_NAMES_RU[card.suit]}${isTrump ? ' — КОЗЫРЬ' : ''})`;
}

export class DurakEngine {
  private state: GameState;

  constructor(playersConfig: PlayerConfig[], mode: DurakMode = 'podkidnoy') {
    this.state = this.initGame(playersConfig, mode);
  }

  public static fromState(state: GameState): DurakEngine {
    const engine = Object.create(DurakEngine.prototype) as DurakEngine;
    engine.state = JSON.parse(JSON.stringify(state));
    return engine;
  }

  public setState(state: GameState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  public getState(): GameState {
    return this.state;
  }

  public initGame(playersConfig: PlayerConfig[], mode: DurakMode = 'podkidnoy'): GameState {
    const deck = shuffleDeck(createDeck());
    const trumpCard = deck[0]; // First card at bottom is trump
    const trumpSuit = trumpCard.suit;

    const players: PlayerState[] = playersConfig.map((config, index) => ({
      id: config.id,
      index,
      config,
      hand: [],
      isHuman: config.type === 'human',
      hasPassed: false,
      isOut: false
    }));

    // Deal 6 cards to each player
    for (let c = 0; c < 6; c++) {
      for (const p of players) {
        if (deck.length > 0) {
          const card = deck.pop()!;
          p.hand.push(card);
        }
      }
    }

    // Sort hands: non-trumps first (by suit and rank), then trumps by rank
    players.forEach(p => this.sortHand(p.hand, trumpSuit));

    // Find who has lowest trump to move first
    let firstPlayerIdx = 0;
    let lowestTrumpVal = 999;
    let lowestAnyVal = 999;
    let lowestAnyIdx = 0;

    players.forEach((p, idx) => {
      p.hand.forEach(c => {
        if (c.suit === trumpSuit && c.value < lowestTrumpVal) {
          lowestTrumpVal = c.value;
          firstPlayerIdx = idx;
        }
        if (c.value < lowestAnyVal) {
          lowestAnyVal = c.value;
          lowestAnyIdx = idx;
        }
      });
    });

    if (lowestTrumpVal === 999) {
      firstPlayerIdx = lowestAnyIdx;
    }

    const defenderIndex = this.getNextActivePlayerIndex(players, firstPlayerIdx);

    return {
      mode,
      deck,
      trumpCard,
      trumpSuit,
      discardPile: [],
      players,
      attackerIndex: firstPlayerIdx,
      defenderIndex,
      table: [],
      phase: 'attacking',
      firstMovePlayerIndex: firstPlayerIdx,
      winnerOrder: [],
      durakIndex: null,
      isEpaulettes: false,
      moveNumber: 1,
      roundNumber: 1
    };
  }

  public updatePlayersConfig(configs: PlayerConfig[]): void {
    configs.forEach((cfg, idx) => {
      if (this.state.players[idx]) {
        this.state.players[idx].config = cfg;
        this.state.players[idx].isHuman = cfg.type === 'human';
      }
    });
  }

  public sortHand(hand: Card[], trumpSuit: Suit | null): void {
    hand.sort((a, b) => {
      const aIsTrump = a.suit === trumpSuit;
      const bIsTrump = b.suit === trumpSuit;
      if (aIsTrump && !bIsTrump) return 1;
      if (!aIsTrump && bIsTrump) return -1;
      if (a.suit !== b.suit) {
        return a.suit.localeCompare(b.suit);
      }
      return a.value - b.value;
    });
  }

  public canBeat(attackCard: Card, defendCard: Card, trumpSuit: Suit): boolean {
    if (defendCard.suit === attackCard.suit) {
      return defendCard.value > attackCard.value;
    }
    if (defendCard.suit === trumpSuit && attackCard.suit !== trumpSuit) {
      return true;
    }
    return false;
  }

  public getNextActivePlayerIndex(players: PlayerState[], currentIndex: number): number {
    const total = players.length;
    for (let i = 1; i < total; i++) {
      const idx = (currentIndex + i) % total;
      if (!players[idx].isOut && players[idx].hand.length > 0) {
        return idx;
      }
    }
    return currentIndex;
  }

  public getTableRanks(): Set<Rank> {
    const ranks = new Set<Rank>();
    for (const pair of this.state.table) {
      ranks.add(pair.attackCard.rank);
      if (pair.defendCard) {
        ranks.add(pair.defendCard.rank);
      }
    }
    return ranks;
  }

  public getUncoveredPairs(): TablePair[] {
    return this.state.table.filter(p => !p.defendCard);
  }

  public getLegalActions(playerIndex: number): GameAction[] {
    const actions: GameAction[] = [];
    const state = this.state;
    if (state.phase === 'game_over' || state.phase === 'round_end') return actions;

    const player = state.players[playerIndex];
    if (!player || player.isOut) return actions;

    // If player has 0 cards but table has cards and player is not defender -> allow PASS (Bito)
    if (player.hand.length === 0) {
      if (state.table.length > 0 && playerIndex !== state.defenderIndex) {
        actions.push({ type: 'PASS', playerIndex });
      }
      return actions;
    }

    const isAttacker = playerIndex === state.attackerIndex;
    const isDefender = playerIndex === state.defenderIndex;
    const isTossingAttacker = !isDefender && !player.isOut;
    const defender = state.players[state.defenderIndex];
    const uncoveredPairs = this.getUncoveredPairs();
    const trumpSuit = state.trumpSuit || 'spades';

    // 1. Initial Attack
    if (state.table.length === 0 && isAttacker) {
      player.hand.forEach(card => {
        actions.push({ type: 'ATTACK', playerIndex, card });
      });
      return actions;
    }

    // 2. Defender's Turn: Defend, Transfer, or Take
    if (isDefender && uncoveredPairs.length > 0) {
      // Defend action for each uncovered card
      uncoveredPairs.forEach(uncovered => {
        player.hand.forEach(card => {
          if (this.canBeat(uncovered.attackCard, card, trumpSuit)) {
            actions.push({
              type: 'DEFEND',
              playerIndex,
              attackCardId: uncovered.id,
              card
            });
          }
        });
      });

      // Transfer action (Perevodnoy mode)
      if (state.mode === 'perevodnoy') {
        const hasAnyDefended = state.table.some(p => !!p.defendCard);
        if (!hasAnyDefended) {
          const tableRank = state.table[0].attackCard.rank;
          const nextDefenderIdx = this.getNextActivePlayerIndex(state.players, playerIndex);
          const nextDefender = state.players[nextDefenderIdx];
          
          // Next defender must have enough cards to defend against table + 1
          if (nextDefender && nextDefender.hand.length > state.table.length) {
            player.hand.forEach(card => {
              if (card.rank === tableRank) {
                actions.push({
                  type: 'TRANSFER',
                  playerIndex,
                  card
                });
              }
            });
          }
        }
      }

      // Defender can always choose to TAKE
      actions.push({ type: 'TAKE', playerIndex });
      return actions;
    }

    // 3. Tossing (Attackers / Other players tossing cards)
    if (isTossingAttacker && state.table.length > 0 && !player.hasPassed) {
      const tableRanks = this.getTableRanks();

      if (state.table.length < 6 && defender.hand.length > 0) {
        player.hand.forEach(card => {
          if (tableRanks.has(card.rank)) {
            actions.push({ type: 'ATTACK', playerIndex, card });
          }
        });
      }

      // Attacker can always pass
      actions.push({ type: 'PASS', playerIndex });
      return actions;
    }

    return actions;
  }

  public applyAction(action: GameAction): { success: boolean; message?: string } {
    const state = this.state;
    const player = state.players[action.playerIndex];
    if (!player) return { success: false, message: 'Игрок не найден' };

    switch (action.type) {
      case 'ATTACK': {
        const cardIndex = player.hand.findIndex(c => c.id === action.card.id);
        if (cardIndex === -1) {
          return { success: false, message: `Карты ${formatCard(action.card)} нет на руке` };
        }

        const defender = state.players[state.defenderIndex];
        if (state.table.length >= 6 || defender.hand.length === 0) {
          return { success: false, message: 'Достигнут лимит карт на столе для этого раунда' };
        }

        if (state.table.length > 0) {
          const ranks = this.getTableRanks();
          if (!ranks.has(action.card.rank)) {
            return { success: false, message: `Нельзя подкинуть ${formatCard(action.card)}: этого достоинства нет на столе` };
          }
        }

        const [card] = player.hand.splice(cardIndex, 1);
        state.table.push({
          id: `pair_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          attackCard: card,
          attackerIndex: action.playerIndex,
          defenderIndex: state.defenderIndex
        });

        // Reset pass status of other attackers
        state.players.forEach(p => {
          if (p.index !== state.defenderIndex) {
            p.hasPassed = false;
          }
        });

        if (state.phase !== 'taking') {
          state.phase = 'defending';
        }
        state.moveNumber++;
        return { success: true };
      }

      case 'DEFEND': {
        if (action.playerIndex !== state.defenderIndex) {
          return { success: false, message: 'Только защитник может отбиваться' };
        }

        const cardIndex = player.hand.findIndex(c => c.id === action.card.id);
        if (cardIndex === -1) {
          return { success: false, message: `Карты ${formatCard(action.card)} нет на руке` };
        }

        const trumpSuit = state.trumpSuit || 'spades';
        const targetPair = state.table.find(p => p.id === action.attackCardId);
        if (!targetPair) {
          return { success: false, message: 'Атакующая карта не найдена на столе' };
        }
        if (targetPair.defendCard) {
          return { success: false, message: 'Эта карта уже покрыта' };
        }

        if (!this.canBeat(targetPair.attackCard, action.card, trumpSuit)) {
          return {
            success: false,
            message: `Карта ${formatCard(action.card)} не может побить ${formatCard(targetPair.attackCard)}`
          };
        }

        const [card] = player.hand.splice(cardIndex, 1);
        targetPair.defendCard = card;

        // Reset attackers' pass flags so they can toss more
        state.players.forEach(p => {
          if (p.index !== state.defenderIndex) {
            p.hasPassed = false;
          }
        });

        // Check if any attackers can toss cards
        const remainingAttackersWithCards = state.players.filter(
          p => p.index !== state.defenderIndex && !p.isOut && p.hand.length > 0
        );

        if (remainingAttackersWithCards.length === 0 && this.getUncoveredPairs().length === 0) {
          // All attackers have 0 cards and all table cards are covered -> Auto BITO!
          this.finishRound(true);
        } else {
          state.phase = 'tossing';
        }
        state.moveNumber++;
        return { success: true };
      }

      case 'TRANSFER': {
        if (state.mode !== 'perevodnoy') {
          return { success: false, message: 'Переводной режим отключен' };
        }
        if (action.playerIndex !== state.defenderIndex) {
          return { success: false, message: 'Только защитник может переводить' };
        }
        if (state.table.some(p => !!p.defendCard)) {
          return { success: false, message: 'Нельзя переводить, если карты уже покрыты' };
        }

        const cardIndex = player.hand.findIndex(c => c.id === action.card.id);
        if (cardIndex === -1) {
          return { success: false, message: `Карты ${formatCard(action.card)} нет на руке` };
        }

        const tableRank = state.table[0].attackCard.rank;
        if (action.card.rank !== tableRank) {
          return { success: false, message: `Для перевода нужна карта ранга ${tableRank}` };
        }

        const nextDefenderIdx = this.getNextActivePlayerIndex(state.players, action.playerIndex);
        const nextDefender = state.players[nextDefenderIdx];
        if (nextDefender.hand.length <= state.table.length) {
          return { success: false, message: 'У следующего игрока не хватает карт для перевода' };
        }

        const [card] = player.hand.splice(cardIndex, 1);
        state.table.push({
          id: `pair_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          attackCard: card,
          attackerIndex: action.playerIndex,
          defenderIndex: nextDefenderIdx
        });

        // Defender transferred successfully!
        state.attackerIndex = action.playerIndex;
        state.defenderIndex = nextDefenderIdx;

        state.players.forEach(p => {
          p.hasPassed = false;
        });

        state.phase = 'defending';
        state.moveNumber++;
        return { success: true };
      }

      case 'PASS': {
        player.hasPassed = true;

        // Check if all attackers have passed
        const activeAttackers = state.players.filter(
          p => p.index !== state.defenderIndex && !p.isOut && p.hand.length > 0
        );
        const allPassed = activeAttackers.every(p => p.hasPassed);
        const allCovered = this.getUncoveredPairs().length === 0;

        if (allPassed && state.table.length > 0) {
          if (allCovered) {
            this.finishRound(true); // BITO
          } else if (state.phase === 'taking') {
            this.finishRound(false); // TAKEN (after tossers finish tossing)
          }
        }

        state.moveNumber++;
        return { success: true };
      }

      case 'TAKE': {
        if (action.playerIndex !== state.defenderIndex) {
          return { success: false, message: 'Только защитник может взять карты' };
        }

        // Set phase to 'taking' to allow attackers to toss cards in chase
        state.phase = 'taking';
        state.players.forEach(p => {
          if (p.index !== state.defenderIndex) {
            p.hasPassed = false;
          }
        });

        state.moveNumber++;
        return { success: true };
      }
    }
  }

  public finishRound(isBito: boolean): void {
    const state = this.state;
    const defender = state.players[state.defenderIndex];

    if (isBito) {
      // Move table cards to discardPile
      for (const pair of state.table) {
        state.discardPile.push(pair.attackCard);
        if (pair.defendCard) {
          state.discardPile.push(pair.defendCard);
        }
      }
    } else {
      // Defender takes all cards from table
      for (const pair of state.table) {
        defender.hand.push(pair.attackCard);
        if (pair.defendCard) {
          defender.hand.push(pair.defendCard);
        }
      }
      this.sortHand(defender.hand, state.trumpSuit);
    }

    state.table = [];

    // Deal cards from deck to players who need them (up to 6)
    // Order of replenishment: attacker -> other attackers -> defender
    const replenishOrder: number[] = [];
    replenishOrder.push(state.attackerIndex);
    state.players.forEach(p => {
      if (p.index !== state.attackerIndex && p.index !== state.defenderIndex) {
        replenishOrder.push(p.index);
      }
    });
    replenishOrder.push(state.defenderIndex);

    for (const pIdx of replenishOrder) {
      const p = state.players[pIdx];
      while (p.hand.length < 6 && state.deck.length > 0) {
        const card = state.deck.pop()!;
        p.hand.push(card);
      }
      this.sortHand(p.hand, state.trumpSuit);
    }

    // Check who exited the game (won)
    state.players.forEach(p => {
      if (!p.isOut && p.hand.length === 0 && state.deck.length === 0) {
        p.isOut = true;
        state.winnerOrder.push(p.index);
        p.outRank = state.winnerOrder.length;
      }
    });

    // Check for Game Over
    const activePlayers = state.players.filter(p => !p.isOut && p.hand.length > 0);
    if (activePlayers.length <= 1) {
      state.phase = 'game_over';
      if (activePlayers.length === 1) {
        state.durakIndex = activePlayers[0].index;
        this.checkEpaulettes(state.durakIndex);
      }
      return;
    }

    // Determine next attacker and defender
    let nextAttackerIdx: number;
    if (isBito) {
      // Defender who successfully defended becomes the new attacker (or next active if defender is out)
      nextAttackerIdx = defender.isOut
        ? this.getNextActivePlayerIndex(state.players, state.defenderIndex)
        : state.defenderIndex;
    } else {
      // Defender took cards, so they skip attack. Next player becomes attacker
      nextAttackerIdx = this.getNextActivePlayerIndex(state.players, state.defenderIndex);
    }

    const nextDefenderIdx = this.getNextActivePlayerIndex(state.players, nextAttackerIdx);

    state.attackerIndex = nextAttackerIdx;
    state.defenderIndex = nextDefenderIdx;
    state.players.forEach(p => {
      p.hasPassed = false;
    });
    state.phase = 'attacking';
    state.roundNumber++;
  }

  private checkEpaulettes(durakIdx: number): void {
    const state = this.state;
    // Epaulettes check: did the winner finish the final round with sixes ('6')?
    if (state.discardPile.length >= 2) {
      const lastCards = state.discardPile.slice(-2);
      const isSixes = lastCards.every(c => c.rank === '6');
      if (isSixes) {
        state.isEpaulettes = true;
        state.epaulettesRanks = ['6'];
      }
    }
  }

  /**
   * Generates Fog of War state for a specific player (masking other players' hands)
   */
  public getPlayerView(playerIndex: number) {
    const state = this.state;
    return {
      mode: state.mode,
      trumpCard: state.trumpCard,
      trumpSuit: state.trumpSuit,
      deckCount: state.deck.length,
      discardCount: state.discardPile.length,
      table: state.table,
      phase: state.phase,
      attackerIndex: state.attackerIndex,
      defenderIndex: state.defenderIndex,
      myHand: state.players[playerIndex]?.hand || [],
      opponents: state.players
        .filter(p => p.index !== playerIndex)
        .map(p => ({
          index: p.index,
          name: p.config.name,
          cardCount: p.hand.length,
          isOut: p.isOut,
          outRank: p.outRank
        }))
    };
  }
}
