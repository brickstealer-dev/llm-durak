import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GameAction } from '../../types/durak';
import {
  Check,
  Hand,
  MessageSquareQuote,
  PanelRight,
  Send,
  X,
  Zap
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface GameControlsProps {
  legalActions: GameAction[];
  isHumanTurn: boolean;
  isTakingPhase?: boolean;
  onAction: (action: GameAction) => void;
  onNewGame: () => void;
  onOpenSettings?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isTtsEnabled?: boolean;
  onToggleTts?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  isGameBusy?: boolean;
  playerComment?: string;
  onPlayerCommentChange?: (val: string) => void;
  onSendComment?: (text?: string) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  className?: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  legalActions,
  isHumanTurn,
  isTakingPhase = false,
  onAction,
  isGameBusy = false,
  playerComment = '',
  onPlayerCommentChange,
  onSendComment,
  isSidebarOpen = false,
  onToggleSidebar,
  className
}) => {
  const passAction = legalActions.find(a => a.type === 'PASS');
  const takeAction = legalActions.find(a => a.type === 'TAKE');

  const QUICK_REMARKS = [
    'Жри козыря!',
    'Бито, фраера',
    'Не спасёт!',
    'Стрелочку перевёл!',
    'Чистый расчёт',
    'Забирай макулатуру!'
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSendComment?.();
    }
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5 px-2 py-1 relative', className)}>
      {/* Action Buttons Row (Only when player needs to act: PASS or TAKE) */}
      {(passAction || (takeAction && !isTakingPhase)) && (
        <div className="w-full flex items-center justify-between gap-2 min-h-[36px] animate-in fade-in-0 slide-in-from-bottom-1">
          {/* Status / Guidance info */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
              {isTakingPhase ? (
                <span className="animate-pulse text-amber-400">⚠️ Подкидывай вдогонку!</span>
              ) : (
                <span>⚔️ Твой ход — выбери карту для хода</span>
              )}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {passAction && (
              <Button
                variant="default"
                size="lg"
                disabled={!isHumanTurn || isGameBusy}
                onClick={() => onAction(passAction)}
                className={cn(
                  'text-white font-bold text-xs sm:text-sm px-4 sm:px-5 h-9 shadow-lg active:scale-95 transition-all',
                  isTakingPhase
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                )}
              >
                <Check className="w-4 h-4 mr-1.5" />
                {isTakingPhase ? 'ОТДАТЬ КАРТЫ (БИТО)' : 'БИТО / ПАС'}
              </Button>
            )}

            {takeAction && !isTakingPhase && (
              <Button
                variant="destructive"
                size="lg"
                disabled={!isHumanTurn || isGameBusy}
                onClick={() => onAction(takeAction)}
                className="font-bold text-xs sm:text-sm px-4 sm:px-5 h-9 shadow-lg shadow-rose-950/50 animate-pulse active:scale-95 transition-all"
              >
                <Hand className="w-4 h-4 mr-1.5" />
                ВЗЯТЬ КАРТЫ
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bottom row: Trash-talk comment input & quick chips */}
      <div className="w-full flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
        <div
          className={cn(
            'flex-1 flex items-center gap-1.5 px-2.5 h-8 rounded-xl border transition-all min-w-0',
            playerComment
              ? 'bg-amber-950/30 border-amber-500/50 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/20'
              : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/20'
          )}
        >
          <MessageSquareQuote
            className={cn('w-3.5 h-3.5 shrink-0 transition-colors', playerComment ? 'text-amber-400' : 'text-slate-500')}
          />

          {playerComment && (
            <span className="shrink-0 flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 select-none">
              <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              В очереди:
            </span>
          )}

          <input
            type="text"
            value={playerComment}
            onChange={e => onPlayerCommentChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={playerComment ? '' : '💬 Трэшток: фраза будет отправляться с каждым ходом...'}
            className={cn(
              'flex-1 min-w-0 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 text-[11px] sm:text-xs placeholder:text-slate-500 transition-colors',
              playerComment ? 'text-amber-200 font-medium' : 'text-slate-100'
            )}
          />

          {playerComment && (
            <div className="flex items-center gap-0.5 shrink-0 pl-1">
              <button
                type="button"
                onClick={() => onPlayerCommentChange?.('')}
                className="p-1 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-md transition-colors"
                title="Отменить фразу (очистить очередь ходов)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSendComment?.()}
                className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-md transition-colors"
                title="Сказать сейчас (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Quick remark chips */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_REMARKS.map(phrase => (
            <button
              key={phrase}
              type="button"
              onClick={() => {
                onPlayerCommentChange?.(phrase);
                onSendComment?.(phrase);
              }}
              className={cn(
                'px-2 py-0.5 rounded-md text-[10px] border transition-colors whitespace-nowrap',
                playerComment === phrase
                  ? 'bg-amber-500/30 text-amber-200 border-amber-500/50 font-semibold shadow-sm'
                  : 'bg-slate-800/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border-slate-700/60'
              )}
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameControls;

