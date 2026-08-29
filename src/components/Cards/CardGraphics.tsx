import React from 'react';
import { Suit } from '../../types/durak';

export const SuitSvg: React.FC<{ suit: Suit; size?: number; className?: string }> = ({
  suit,
  size = 18,
  className = ''
}) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const fill = isRed ? '#e11d48' : '#0f172a';

  switch (suit) {
    case 'spades':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill={fill}>
          <path d="M16 2C13.5 8 5 15.5 5 21C5 24.5 7.5 27 11 27C13 27 14.8 26 15.5 24.5C14.5 28 12.5 30 11 30H21C19.5 30 17.5 28 16.5 24.5C17.2 26 19 27 21 27C24.5 27 27 24.5 27 21C27 15.5 18.5 8 16 2Z" />
        </svg>
      );
    case 'hearts':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill={fill}>
          <path d="M16 29C14 27 4 19 4 11C4 6.5 7.5 3 12 3C14.5 3 15.5 4.5 16 5.5C16.5 4.5 17.5 3 20 3C24.5 3 28 6.5 28 11C28 19 18 27 16 29Z" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill={fill}>
          <polygon points="16,2 29,16 16,30 3,16" />
        </svg>
      );
    case 'clubs':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} className={className} fill={fill}>
          <circle cx="16" cy="9" r="6" />
          <circle cx="9.5" cy="18.5" r="6" />
          <circle cx="22.5" cy="18.5" r="6" />
          <circle cx="16" cy="15" r="4.5" />
          <path d="M14.5 17H17.5L19 30H13L14.5 17Z" />
        </svg>
      );
  }
};

/**
 * Clean & Crisp Number Pips Layout (6, 7, 8, 9, 10)
 */
export const PipGrid: React.FC<{ rank: string; suit: Suit }> = ({ rank, suit }) => {
  const pipSize = 13;

  switch (rank) {
    case '6':
      return (
        <div className="w-full h-full flex justify-between px-2 py-1">
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
        </div>
      );

    case '7':
      return (
        <div className="w-full h-full flex justify-between px-2 py-1 relative">
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="absolute top-[28%] left-1/2 -translate-x-1/2">
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
        </div>
      );

    case '8':
      return (
        <div className="w-full h-full flex justify-between px-2 py-1 relative">
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex flex-col justify-around h-full py-2">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
        </div>
      );

    case '9':
      return (
        <div className="w-full h-full flex justify-between px-2 py-0.5 relative">
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex items-center justify-center">
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
        </div>
      );

    case '10':
    default:
      return (
        <div className="w-full h-full flex justify-between px-2 py-0.5 relative">
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex flex-col justify-around h-full py-2">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
          <div className="flex flex-col justify-between h-full">
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
            <SuitSvg suit={suit} size={pipSize} />
          </div>
        </div>
      );
  }
};

/**
 * Royal Court Face Cards Art (J, Q, K, A)
 */
export const CourtCardFace: React.FC<{ rank: string; suit: Suit }> = ({ rank, suit }) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const mainColor = isRed ? '#dc2626' : '#1e3a8a';
  const goldColor = '#f59e0b';

  if (rank === 'A') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative flex items-center justify-center p-2 rounded-full bg-slate-50 border border-slate-200/80 shadow-inner">
          <SuitSvg suit={suit} size={36} className="drop-shadow-sm" />
        </div>
      </div>
    );
  }

  const title = rank === 'K' ? 'King' : rank === 'Q' ? 'Queen' : 'Jack';

  return (
    <div className="w-full h-full flex flex-col items-center justify-between border border-slate-300/80 rounded bg-slate-50/90 overflow-hidden py-0.5">
      {/* Top half */}
      <div className="flex-1 w-full flex items-center justify-around px-1">
        <div className="flex flex-col items-center">
          {rank === 'K' && (
            <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10">
              <path d="M8,14 L8,8 L14,12 L20,4 L26,12 L32,8 L32,14 Z" fill={goldColor} stroke="#b45309" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="8" fill="#fed7aa" />
              <path d="M12,22 Q20,32 28,22" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="17" cy="19" r="1" fill="#0f172a" />
              <circle cx="23" cy="19" r="1" fill="#0f172a" />
              <path d="M10,28 L30,28 L27,38 L13,38 Z" fill={mainColor} />
            </svg>
          )}
          {rank === 'Q' && (
            <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10">
              <polygon points="12,14 10,8 16,11 20,6 24,11 30,8 28,14" fill={goldColor} stroke="#b45309" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="7.5" fill="#fed7aa" />
              <path d="M12,16 Q9,28 14,32" stroke="#fcd34d" strokeWidth="2.5" fill="none" />
              <path d="M28,16 Q31,28 26,32" stroke="#fcd34d" strokeWidth="2.5" fill="none" />
              <circle cx="17" cy="19" r="1" fill="#0f172a" />
              <circle cx="23" cy="19" r="1" fill="#0f172a" />
              <path d="M11,28 L29,28 L26,38 L14,38 Z" fill={mainColor} />
            </svg>
          )}
          {rank === 'J' && (
            <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10">
              <ellipse cx="20" cy="12" rx="11" ry="5" fill={mainColor} />
              <path d="M21,7 Q27,2 30,8" stroke={goldColor} strokeWidth="1.5" fill="none" />
              <circle cx="20" cy="20" r="7.5" fill="#fed7aa" />
              <circle cx="17" cy="19" r="1" fill="#0f172a" />
              <circle cx="23" cy="19" r="1" fill="#0f172a" />
              <path d="M11,28 L29,28 L25,38 L15,38 Z" fill={mainColor} />
              <line x1="8" y1="10" x2="8" y2="38" stroke="#94a3b8" strokeWidth="1.5" />
            </svg>
          )}
        </div>
        <SuitSvg suit={suit} size={13} />
      </div>

      <div className="w-4/5 h-[1px] bg-slate-300/80" />

      {/* Bottom half rotated */}
      <div className="flex-1 w-full flex items-center justify-around px-1 rotate-180">
        <div className="flex flex-col items-center">
          {rank === 'K' && (
            <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10">
              <path d="M8,14 L8,8 L14,12 L20,4 L26,12 L32,8 L32,14 Z" fill={goldColor} stroke="#b45309" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="8" fill="#fed7aa" />
              <path d="M12,22 Q20,32 28,22" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
              <circle cx="17" cy="19" r="1" fill="#0f172a" />
              <circle cx="23" cy="19" r="1" fill="#0f172a" />
              <path d="M10,28 L30,28 L27,38 L13,38 Z" fill={mainColor} />
            </svg>
          )}
          {rank === 'Q' && (
            <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10">
              <polygon points="12,14 10,8 16,11 20,6 24,11 30,8 28,14" fill={goldColor} stroke="#b45309" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="7.5" fill="#fed7aa" />
              <path d="M12,16 Q9,28 14,32" stroke="#fcd34d" strokeWidth="2.5" fill="none" />
              <path d="M28,16 Q31,28 26,32" stroke="#fcd34d" strokeWidth="2.5" fill="none" />
              <circle cx="17" cy="19" r="1" fill="#0f172a" />
              <circle cx="23" cy="19" r="1" fill="#0f172a" />
              <path d="M11,28 L29,28 L26,38 L14,38 Z" fill={mainColor} />
            </svg>
          )}
          {rank === 'J' && (
            <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10">
              <ellipse cx="20" cy="12" rx="11" ry="5" fill={mainColor} />
              <path d="M21,7 Q27,2 30,8" stroke={goldColor} strokeWidth="1.5" fill="none" />
              <circle cx="20" cy="20" r="7.5" fill="#fed7aa" />
              <circle cx="17" cy="19" r="1" fill="#0f172a" />
              <circle cx="23" cy="19" r="1" fill="#0f172a" />
              <path d="M11,28 L29,28 L25,38 L15,38 Z" fill={mainColor} />
              <line x1="8" y1="10" x2="8" y2="38" stroke="#94a3b8" strokeWidth="1.5" />
            </svg>
          )}
        </div>
        <SuitSvg suit={suit} size={13} />
      </div>
    </div>
  );
};

/**
 * Authentic Red Casino Deck Pattern Back
 */
export const CardBackGraphic: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#881337] border-2 border-white rounded-lg p-1 flex items-center justify-center shadow-inner relative overflow-hidden">
      <div className="w-full h-full rounded border border-amber-300/50 bg-[#4c0519] flex items-center justify-center relative">
        {/* Diamond Lattice Pattern */}
        <svg className="w-full h-full opacity-40" viewBox="0 0 40 60">
          <pattern id="lattice" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="none" stroke="#fde047" strokeWidth="0.6" />
            <polygon points="4,0 8,4 4,8 0,4" fill="#fde047" opacity="0.3" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#lattice)" />
        </svg>

        {/* Center Emblem */}
        <div className="absolute w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border border-amber-200 flex items-center justify-center shadow-md">
          <span className="text-slate-950 text-xs sm:text-sm font-black">♠</span>
        </div>
      </div>
    </div>
  );
};
