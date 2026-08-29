import React from 'react';
import { Card, Suit } from '../../types/durak';
import { cn } from '../../lib/utils';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  isTrump?: boolean;
  isPlayable?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  rotation?: number;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function getCardAssetUrl(card?: Card, faceDown?: boolean): string {
  if (faceDown || !card) {
    return '/cards/Red_Back.svg';
  }
  const suitLetterMap: Record<Suit, string> = {
    spades: 'S',
    hearts: 'H',
    diamonds: 'D',
    clubs: 'C'
  };
  const suitLetter = suitLetterMap[card.suit] || 'S';
  return `/cards/${card.rank}${suitLetter}.svg`;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  faceDown = false,
  isTrump = false,
  isPlayable = false,
  isSelected = false,
  disabled = false,
  rotation = 0,
  onClick,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-12 sm:w-14 md:w-16 aspect-[2.5/3.5]',
    md: 'w-16 sm:w-20 md:w-22 lg:w-24 aspect-[2.5/3.5]',
    lg: 'w-20 sm:w-24 md:w-28 lg:w-32 aspect-[2.5/3.5]'
  };

  const assetUrl = getCardAssetUrl(card, faceDown);

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{ transform: `rotate(${rotation}deg)` }}
      className={cn(
        'relative select-none overflow-hidden shrink-0 transition-all duration-150 rounded-[6px] sm:rounded-[8px]',
        sizeClasses[size],
        isTrump && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 shadow-lg shadow-amber-500/30',
        isSelected && '-translate-y-4 ring-4 ring-amber-400 shadow-2xl scale-105 z-30',
        isPlayable && !isSelected && 'hover:-translate-y-3 hover:shadow-2xl hover:scale-105 cursor-pointer',
        !isPlayable && !disabled && 'cursor-pointer hover:-translate-y-1',
        className
      )}
    >
      {/* Real Authentic SVG Card Image */}
      <img
        src={assetUrl}
        alt={card ? `${card.rank} of ${card.suit}` : 'Card Back'}
        className="w-full h-full object-contain pointer-events-none drop-shadow-md rounded-[6px] sm:rounded-[8px]"
        loading="eager"
        draggable={false}
      />

      {/* Trump Star Badge */}
      {isTrump && !faceDown && (
        <div className="absolute top-0.5 right-0.5 bg-amber-500 text-slate-950 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md border border-amber-300 pointer-events-none">
          ★
        </div>
      )}
    </div>
  );
};

export default PlayingCard;
