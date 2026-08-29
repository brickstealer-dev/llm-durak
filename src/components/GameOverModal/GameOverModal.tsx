import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { GameState, SessionStats } from '../../types/durak';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { sounds } from '../../services/soundEffects';
import { Award, Crown, MessageSquareQuote, RotateCcw, ShieldAlert, Trophy } from 'lucide-react';

export interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  onNewGame: () => void;
  gameOverSpeech?: string;
  sessionStats?: SessionStats;
  onResetSessionScore?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  state,
  onNewGame,
  gameOverSpeech,
  sessionStats,
  onResetSessionScore
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const durakPlayer = state.durakIndex !== null ? state.players[state.durakIndex] : null;
  const winnerPlayer = state.winnerOrder.length > 0 ? state.players[state.winnerOrder[0]] : null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto my-2 w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-4xl shadow-xl">
            🃏
          </div>
          <DialogTitle className="text-2xl font-black text-amber-400">
            Партия окончена!
          </DialogTitle>
        </DialogHeader>

        {/* Durak Box */}
        {durakPlayer && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/40 text-slate-100 space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-rose-400 font-extrabold text-sm uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> Дурак партии:
            </div>
            <div className="text-xl font-black text-rose-200">
              {durakPlayer.config.name}
            </div>

            {/* Epaulettes Badge */}
            {state.isEpaulettes && (
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 flex items-center justify-center gap-2 animate-bounce">
                <span className="text-xl">🎖️</span>
                <span className="font-black text-xs uppercase tracking-wide">
                  ОСТАЛСЯ С ШЕСТЕРОЧНЫМИ ПОГОНАМИ!
                </span>
                <span className="text-xl">🎖️</span>
              </div>
            )}
          </div>
        )}

        {/* Winner Order Table */}
        <div className="space-y-1.5 py-1 text-xs">
          <span className="font-semibold text-slate-400 block mb-1">Итоги партии:</span>
          {state.winnerOrder.map((pIdx, rank) => {
            const p = state.players[pIdx];
            return (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="font-black text-amber-400">#{rank + 1}</span>
                  <span className="font-bold text-slate-200">{p.config.name}</span>
                </div>
                <Badge variant={rank === 0 ? 'default' : 'secondary'} className="text-[10px]">
                  {rank === 0 ? '👑 Победитель' : `${rank + 1}-е место`}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Session Scoreboard */}
        {sessionStats && sessionStats.gamesPlayed > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-left text-xs space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11.5px]">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Счёт за сеанс ({sessionStats.gamesPlayed} {sessionStats.gamesPlayed === 1 ? 'партия' : sessionStats.gamesPlayed < 5 ? 'партии' : 'партий'}):
              </span>
              {onResetSessionScore && (
                <button
                  type="button"
                  onClick={onResetSessionScore}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors underline"
                >
                  Сброс счёта
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {state.players.map(p => {
                const sc = sessionStats.scores[p.config.id] || { wins: 0, durakCount: 0 };
                return (
                  <div
                    key={p.config.id}
                    className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px]"
                  >
                    <span className="font-bold text-slate-200 truncate pr-1">{p.config.name}</span>
                    <span className="font-mono font-bold text-amber-300 shrink-0">
                      🏆{sc.wins} <span className="text-slate-500">|</span> 💩{sc.durakCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Final Speech */}
        {gameOverSpeech && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-left text-xs space-y-1">
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wide">
              <MessageSquareQuote className="w-3.5 h-3.5" /> Последнее слово:
            </span>
            <p className="text-slate-300 italic whitespace-pre-wrap">«{gameOverSpeech}»</p>
          </div>
        )}

        <DialogFooter className="sm:justify-center pt-2">
          <Button
            variant="default"
            size="lg"
            onClick={onNewGame}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base shadow-lg shadow-amber-500/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Сыграть реванш
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
