import React, { useMemo } from 'react';
import { Card, GameAction, Suit } from '../../types/durak';
import { PlayingCard } from '../Cards/PlayingCard';
import { cn } from '../../lib/utils';

export interface PlayerHandProps {
  hand: Card[];
  trumpSuit: Suit | null;
  legalActions: GameAction[];
  selectedCard: Card | null;
  onSelectCard: (card: Card) => void;
  disabled?: boolean;
  isMyTurn?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  trumpSuit,
  legalActions,
  selectedCard,
  onSelectCard,
  disabled = false,
  isMyTurn = false
}) => {
  const playableCardIds = useMemo(() => {
    const set = new Set<string>();
    legalActions.forEach(action => {
      if ('card' in action && action.card) {
        set.add(action.card.id);
      }
    });
    return set;
  }, [legalActions]);

  if (hand.length === 0) {
    return (
      <div className="flex items-center justify-center p-3 text-slate-400 font-medium text-xs sm:text-sm">
        Рука пуста (ты сбросил все карты!) 🎉
      </div>
    );
  }

  const total = hand.length;

  // Dynamic fan angles
  const maxAngle = total <= 6 ? Math.min(total * 1.6, 9) : Math.min(total * 0.8, 8);
  const angleStep = total > 1 ? (maxAngle * 2) / (total - 1) : 0;

  // Ultra-precise dynamic overlap calculation based on card count
  // Card base width is 56px on mobile and 64px on sm+
  const getMarginLeft = (index: number): number => {
    if (index === 0) return 0;
    if (total <= 4) return -18;
    if (total <= 6) return -26;
    if (total <= 9) return -34;
    if (total <= 12) return -39;
    if (total <= 15) return -42;
    if (total <= 18) return -45;
    return -47; // ultra-dense, 9px visible corner
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center pt-0.5 pb-0.5 shrink-0 overflow-hidden select-none">
      {/* Cards container with dynamic overlap */}
      <div className="relative flex items-center justify-center w-full max-w-4xl min-h-[90px] sm:min-h-[110px] px-1 sm:px-2 overflow-x-auto overflow-y-visible no-scrollbar py-1">
        <div
          className={cn(
            'flex items-center justify-center py-1.5 transition-all duration-200 origin-bottom',
            total >= 16 ? 'scale-90 sm:scale-95' : total >= 13 ? 'scale-95 sm:scale-100' : 'scale-100'
          )}
        >
          {hand.map((card, index) => {
            const rotation = total > 1 ? -maxAngle + index * angleStep : 0;
            const isSelected = selectedCard?.id === card.id;
            const isPlayable = playableCardIds.has(card.id);
            const marginLeft = getMarginLeft(index);

            return (
              <div
                key={card.id}
                style={{
                  marginLeft: `${marginLeft}px`,
                  zIndex: isSelected ? 50 : index + 1
                }}
                className={cn(
                  'transition-all duration-200 ease-out origin-bottom transform-gpu shrink-0 animate-card-deal-in',
                  isSelected && '-translate-y-3.5 sm:-translate-y-4 scale-105',
                  !isSelected && isPlayable && isMyTurn && 'hover:-translate-y-2 hover:scale-102 hover:z-40'
                )}
              >
                <PlayingCard
                  card={card}
                  isTrump={card.suit === trumpSuit}
                  isPlayable={isPlayable}
                  isSelected={isSelected}
                  disabled={disabled}
                  rotation={rotation}
                  onClick={() => onSelectCard(card)}
                  size="md"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerHand;
