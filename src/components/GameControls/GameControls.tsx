import React from 'react';
import { Button } from '../ui/button';
import { GameAction } from '../../types/durak';
import { Check, Hand, Pause, Play, RefreshCw, Settings, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
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
  className
}) => {
  const passAction = legalActions.find(a => a.type === 'PASS');
  const takeAction = legalActions.find(a => a.type === 'TAKE');

  return (
    <div className={cn('w-full flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-2 py-2', className)}>
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
  );
};

export default GameControls;
