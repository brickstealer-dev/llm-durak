import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GameAction } from '../../types/durak';
import {
  Check,
  Hand,
  MessageSquareQuote,
  PanelRight,
  Send
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
    <div className={cn('w-full flex flex-col gap-1.5 px-2 py-1.5 relative', className)}>
      {/* Main Actions Row (Clean, dedicated to gameplay actions & sidebar trigger) */}
      <div className="w-full flex items-center justify-between gap-2 min-h-[36px]">
        {/* Left Side: Status / Turn guidance info */}
        <div className="flex items-center gap-1.5 min-w-0">
          {isHumanTurn ? (
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
              {isTakingPhase ? (
                <span className="animate-pulse text-amber-400">⚠️ Подкидывай вдогонку!</span>
              ) : (
                <span>⚔️ Твой ход — выбери карту для хода</span>
              )}
            </span>
          ) : (
            <span className="text-[10.5px] text-slate-400 italic truncate">
              {isGameBusy ? '🤖 Нейросеть обдумывает ход...' : 'Ожидание хода соперника...'}
            </span>
          )}
        </div>

        {/* Right Side: Human Action Buttons & Sidebar Trigger Button */}
        <div className="flex items-center gap-2 shrink-0">
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

          {/* Sidebar Trigger Button */}
          {onToggleSidebar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleSidebar}
              className={cn(
                'font-bold text-xs border-slate-700 bg-slate-900/90 h-9 px-2.5 sm:px-3 text-slate-300 hover:text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all shadow-sm flex items-center gap-1.5',
                isSidebarOpen && 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400'
              )}
              title="Открыть боковое меню (Раздать / Пауза). Также работает свайп влево."
            >
              <PanelRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Меню</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Trash-talk comment input & quick chips */}
      <div className="w-full flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
        <div className="relative flex-1 flex items-center">
          <MessageSquareQuote className="absolute left-2.5 w-3.5 h-3.5 text-amber-400/80 pointer-events-none" />
          <Input
            value={playerComment}
            onChange={e => onPlayerCommentChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="💬 Трэшток к ходу: напиши фразу (отправится с ходом или Enter)..."
            className="h-7.5 pl-7 pr-7 text-[11px] sm:text-xs bg-slate-950/90 border-slate-800 focus:border-amber-400 text-slate-100 placeholder:text-slate-500 rounded-lg"
          />
          {playerComment && (
            <button
              type="button"
              onClick={() => onSendComment?.()}
              className="absolute right-1.5 p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
              title="Отправить реплику сейчас"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
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
              className="px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-amber-500/20 text-[10px] text-slate-300 hover:text-amber-300 border border-slate-700/60 transition-colors whitespace-nowrap"
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
