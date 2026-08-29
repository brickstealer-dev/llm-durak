import React, { useState, useRef, useEffect } from 'react';
import { Card, GameState, TablePair } from '../../types/durak';
import { PlayingCard } from '../Cards/PlayingCard';
import { OpponentSeat } from '../OpponentSeat/OpponentSeat';
import { Badge } from '../ui/badge';
import { SUIT_NAMES_RU, SUIT_SYMBOLS } from '../../services/durakEngine';
import { cn } from '../../lib/utils';
import { Layers } from 'lucide-react';

import { CurrencyCode } from '../../services/currencyService';
import { Pause, Play } from 'lucide-react';

export interface CardTableProps {
  state: GameState;
  activePlayerIndex: number;
  thinkingPlayerIndex: number | null;
  tokensPerSecond?: number;
  speechBubbles: Record<number, string>;
  selectedTablePairId: string | null;
  onSelectTablePair?: (pairId: string) => void;
  playerCostsUsd?: Record<string, number>;
  currencyCode?: CurrencyCode;
  isPaused?: boolean;
  onTogglePause?: () => void;
  className?: string;
}

export const CardTable: React.FC<CardTableProps> = ({
  state,
  activePlayerIndex,
  thinkingPlayerIndex = null,
  tokensPerSecond = 0,
  speechBubbles = {},
  selectedTablePairId = null,
  onSelectTablePair,
  playerCostsUsd = {},
  currencyCode = 'RUB',
  isPaused = false,
  onTogglePause,
  className
}) => {
  const trumpSuit = state.trumpSuit;
  const opponents = state.players.filter(p => p.index !== 0); // Player 0 is bottom human

  // Track deck changes to trigger flying card animation
  const prevDeckCountRef = useRef(state.deck.length);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (state.deck.length < prevDeckCountRef.current) {
      setIsDrawing(true);
      const timer = setTimeout(() => setIsDrawing(false), 420);
      prevDeckCountRef.current = state.deck.length;
      return () => clearTimeout(timer);
    }
    prevDeckCountRef.current = state.deck.length;
  }, [state.deck.length]);

  return (
    <div
      className={cn(
        'relative w-full flex-1 min-h-0 h-full rounded-2xl sm:rounded-3xl felt-table wood-rail p-2 sm:p-3.5 pt-2 sm:pt-3.5 md:pt-4 flex flex-col justify-between overflow-hidden select-none border-2 sm:border-4 border-[#24130a] shadow-2xl',
        className
      )}
    >
      {/* Top Section: Opponents (Adaptive grid/flex that always fits 1, 2, or 3 opponents) */}
      <div
        className={cn(
          'relative z-10 w-full flex items-center pt-0.5 sm:pt-1 shrink-0 px-0.5 sm:px-2',
          opponents.length >= 3 ? 'justify-between gap-1 sm:gap-2' : 'justify-around gap-2'
        )}
      >
        {opponents.map((opp, oppIndex) => {
          const alignSpeech =
            opponents.length > 1
              ? oppIndex === 0
                ? 'left'
                : oppIndex === opponents.length - 1
                ? 'right'
                : 'center'
              : 'center';

          return (
            <OpponentSeat
              key={opp.id}
              player={opp}
              isAttacker={opp.index === state.attackerIndex}
              isDefender={opp.index === state.defenderIndex}
              isCurrentTurn={opp.index === activePlayerIndex}
              isThinking={opp.index === thinkingPlayerIndex}
              tokensPerSecond={opp.index === thinkingPlayerIndex ? tokensPerSecond : undefined}
              speechText={speechBubbles[opp.index]}
              totalCostUsd={playerCostsUsd[opp.config.id] || 0}
              currencyCode={currencyCode}
              compact={opponents.length >= 3}
              alignSpeech={alignSpeech}
            />
          );
        })}
      </div>

      {/* Middle Center Section: Table Battle Ground & Deck/Discard */}
      <div className="relative z-10 w-full flex-1 min-h-0 flex items-center justify-between gap-1 sm:gap-3 px-0.5 sm:px-2 mt-2 sm:mt-5 mb-1 overflow-hidden">
        {/* Left Side: Deck & Trump Card (Compact and positioned with safe margin from table border) */}
        <div className="relative flex items-center justify-center shrink-0 w-16 sm:w-20 md:w-24 h-16 sm:h-22 ml-2 sm:ml-4">
          {state.trumpCard && (
            <div className="relative flex items-center justify-center scale-90 sm:scale-100 origin-center">
              {/* Trump Card lying face up perpendicular under deck */}
              <div className="absolute rotate-90 shadow-2xl -left-1 sm:-left-2 z-0 origin-center">
                <PlayingCard
                  card={state.trumpCard}
                  isTrump
                  size="sm"
                  disabled
                />
              </div>

              {/* Remaining Deck stack on top */}
              {state.deck.length > 0 && (
                <div className={cn("relative z-10 transition-transform ml-3 sm:ml-4", isDrawing && "animate-deck-recoil")}>
                  {/* Flying ghost card escaping from deck */}
                  {isDrawing && (
                    <div className="absolute inset-0 z-30 pointer-events-none animate-fly-off-deck">
                      <PlayingCard faceDown disabled size="sm" />
                    </div>
                  )}

                  <PlayingCard
                    faceDown
                    disabled
                    size="sm"
                  />
                  <div className="absolute -top-2 -right-2 z-30 bg-slate-950/95 text-amber-300 border border-amber-400/60 text-[9px] sm:text-xs font-black px-1.5 py-0.2 rounded-full shadow-xl flex items-center gap-0.5">
                    <Layers className="w-3 h-3 text-amber-400" />
                    {state.deck.length}
                  </div>
                </div>
              )}

              {/* If deck is empty, show badge that deck is out */}
              {state.deck.length === 0 && (
                <div className="relative z-10 bg-slate-950/90 border border-amber-500/50 text-amber-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-lg shadow-lg">
                  Колода пуста
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Active Cards on Table (Battle Field with Ultra Dense Packing) */}
        <div className="flex-1 min-h-0 h-full flex items-center justify-center px-0.5 overflow-hidden max-w-full">
          {state.table.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-emerald-300/40 border border-dashed border-emerald-500/20 rounded-xl p-3 sm:p-4 max-w-xs">
              <span className="text-xl sm:text-2xl mb-0.5">🃏</span>
              <span className="text-[11px] sm:text-xs font-medium">Стол пуст. Ожидание первого хода...</span>
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center justify-center py-1 transition-all duration-300 origin-center select-none',
                state.table.length <= 2 && 'gap-2 sm:gap-4 scale-100',
                state.table.length === 3 && '-space-x-2 sm:space-x-1 scale-95 sm:scale-100',
                state.table.length === 4 && '-space-x-5 sm:-space-x-3 scale-90 sm:scale-95',
                state.table.length === 5 && '-space-x-8 sm:-space-x-6 scale-80 sm:scale-88',
                state.table.length >= 6 && '-space-x-10 sm:-space-x-8 scale-75 sm:scale-82'
              )}
            >
              {state.table.map((pair, idx) => {
                const isSelected = selectedTablePairId === pair.id;
                const isUncovered = !pair.defendCard;
                const isTrump = pair.attackCard.suit === trumpSuit;
                const isDense = state.table.length >= 5;

                return (
                  <div
                    key={pair.id}
                    onClick={() => isUncovered && onSelectTablePair?.(pair.id)}
                    style={{ zIndex: isSelected ? 40 : idx + 2 }}
                    className={cn(
                      'relative transition-all duration-200 cursor-pointer shrink-0',
                      isSelected && 'ring-4 ring-amber-400 rounded-xl scale-105 shadow-2xl z-40'
                    )}
                  >
                    {/* Attack Card (with dynamic throw animation out of human hand or opponent seat) */}
                    <div className={cn(
                      'relative',
                      state.attackerIndex === 0 ? 'animate-card-throw-human' : 'animate-card-throw-opponent'
                    )}>
                      <PlayingCard
                        card={pair.attackCard}
                        isTrump={isTrump}
                        rotation={-4 + (idx % 3) * 2}
                        size={isDense ? 'md' : 'md'}
                      />
                    </div>

                    {/* Defending / Covering Card on top (with directional slam out of hand) */}
                    {pair.defendCard && (
                      <div className={cn(
                        'absolute z-20',
                        isDense ? '-top-2.5 -right-2.5 sm:-top-3.5 sm:-right-3.5' : '-top-3 sm:-top-4 -right-3 sm:-right-4',
                        state.defenderIndex === 0 ? 'animate-card-defend-human' : 'animate-card-defend-opponent'
                      )}>
                        <PlayingCard
                          card={pair.defendCard}
                          isTrump={pair.defendCard.suit === trumpSuit}
                          rotation={6 - (idx % 2) * 3}
                          size={isDense ? 'md' : 'md'}
                        />
                      </div>
                    )}

                    {/* Uncovered Warning Pulse */}
                    {isUncovered && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow animate-pulse z-30">
                        БЕЙ!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Discard Pile (Бито) */}
        <div className="relative flex flex-col items-center justify-center shrink-0 w-20 sm:w-24 h-28 sm:h-36">
          {state.discardPile.length > 0 ? (
            <div className="relative scale-80 sm:scale-90">
              <PlayingCard
                faceDown
                disabled
                size="sm"
                rotation={-8}
              />
              <div className="absolute -top-2 -right-2 bg-slate-900/90 text-slate-300 border border-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                Бито: {state.discardPile.length}
              </div>
            </div>
          ) : (
            <div className="text-[10px] sm:text-xs text-emerald-400/30 text-center font-medium">
              Бита пуста
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Info: Trump indicator & Mode */}
      <div className="relative z-10 w-full flex items-center justify-between px-2 text-[11px] sm:text-xs text-emerald-200/60 font-medium">
        <div className="flex items-center gap-2">
          <span>Режим: <strong className="text-amber-300">{state.mode === 'perevodnoy' ? 'Переводной' : 'Подкидной'}</strong></span>
          <span>•</span>
          <span>Раунд: <strong className="text-slate-200">#{state.roundNumber}</strong></span>
        </div>
        {trumpSuit && (
          <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-amber-500/30">
            <span className="text-amber-400">Козырь:</span>
            <span className="font-bold text-amber-300">{SUIT_NAMES_RU[trumpSuit]}</span>
          </div>
        )}
      </div>

      {/* Pause Overlay Indicator */}
      {isPaused && (
        <div className="absolute inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto animate-in fade-in-0 duration-200">
          <div className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-slate-900/95 border border-amber-500/50 shadow-2xl animate-in zoom-in-95 max-w-xs text-center">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm sm:text-base tracking-wide">
              <Pause className="w-5 h-5 fill-amber-400 animate-pulse" />
              <span>ИГРА НА ПАУЗЕ</span>
            </div>
            <p className="text-xs text-slate-300">
              Ходы ботов приостановлены. Вы можете спокойно почитать мысли и лог партии.
            </p>
            {onTogglePause && (
              <button
                onClick={onTogglePause}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Продолжить игру</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
