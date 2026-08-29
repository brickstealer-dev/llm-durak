import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GameAction } from '../../types/durak';
import { Check, Hand, Pause, Play, RefreshCw, Settings, Volume2, VolumeX, Mic, MicOff, Send, MessageSquareQuote, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface GameControlsProps {
  legalActions: GameAction[];
  isHumanTurn: boolean;
  isTakingPhase?: boolean;
  onAction: (action: GameAction) => void;
  onNewGame: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isTtsEnabled: boolean;
  onToggleTts: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  isGameBusy?: boolean;
  playerComment?: string;
  onPlayerCommentChange?: (val: string) => void;
  onSendComment?: (text?: string) => void;
  className?: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  legalActions,
  isHumanTurn,
  isTakingPhase = false,
  onAction,
  onNewGame,
  onOpenSettings,
  isMuted,
  onToggleMute,
  isTtsEnabled,
  onToggleTts,
  isPaused = false,
  onTogglePause,
  isGameBusy = false,
  playerComment = '',
  onPlayerCommentChange,
  onSendComment,
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
    <div className={cn('w-full flex flex-col gap-1.5 px-2 py-1.5', className)}>
      {/* Top row of controls: Settings/New game on left, Human Action Buttons on right */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2">
      {/* Left: General controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewGame}
          className="font-semibold text-xs border-slate-700 bg-slate-900/80 h-8 hover:bg-amber-500/20 hover:text-amber-300 transition-colors"
          title="Начать новую партию (прервать текущий раунд)"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1 text-amber-400" />
          <span>Новая игра</span>
        </Button>

        {onTogglePause && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePause}
            className={cn(
              'font-semibold text-xs border-slate-700 bg-slate-900/80 h-8 transition-colors',
              isPaused && 'border-amber-400 bg-amber-500/20 text-amber-300 ring-1 ring-amber-400'
            )}
            title={isPaused ? 'Снять с паузы' : 'Поставить на паузу'}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 mr-1 text-emerald-400 fill-emerald-400" />
                <span>Пуск</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400" />
                <span>Пауза</span>
              </>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={onOpenSettings}
          className="h-8 w-8 border-slate-700 bg-slate-900/80"
          title="Настройки"
        >
          <Settings className="w-3.5 h-3.5 text-slate-300" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onToggleMute}
          className="h-8 w-8 border-slate-700 bg-slate-900/80"
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onToggleTts}
          className="h-8 w-8 border-slate-700 bg-slate-900/80"
          title={isTtsEnabled ? 'Озвучка включена' : 'Озвучка выключена'}
        >
          {isTtsEnabled ? <Mic className="w-3.5 h-3.5 text-amber-400" /> : <MicOff className="w-3.5 h-3.5 text-slate-500" />}
        </Button>
      </div>

      {/* Right: Human Action Buttons */}
      <div className="flex items-center gap-2">
        {passAction && (
          <Button
            variant="default"
            size="lg"
            disabled={!isHumanTurn || isGameBusy}
            onClick={() => onAction(passAction)}
            className={cn(
              'text-white font-bold text-xs sm:text-sm px-4 sm:px-5 h-9 shadow-lg',
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
            className="font-bold text-xs sm:text-sm px-4 sm:px-5 h-9 shadow-lg shadow-rose-950/50 animate-pulse"
          >
            <Hand className="w-4 h-4 mr-1.5" />
            ВЗЯТЬ КАРТЫ
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
