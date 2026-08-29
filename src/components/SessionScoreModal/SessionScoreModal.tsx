import React from 'react';
import { GameState, SessionStats } from '../../types/durak';
import { CHARACTER_PROFILES } from '../../services/prompts';
import { CharacterStyle } from '../../types/durak';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { currencyService, CurrencyCode } from '../../services/currencyService';
import { Trophy, Coins, RotateCcw, Crown, ShieldAlert, Sparkles } from 'lucide-react';

export interface SessionScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  sessionStats: SessionStats;
  onResetSessionScore: () => void;
  sessionTotalCostUsd?: number;
  currencyCode?: CurrencyCode;
  playerCostsUsd?: Record<string, number>;
  onResetSessionCosts?: () => void;
}

export const SessionScoreModal: React.FC<SessionScoreModalProps> = ({
  isOpen,
  onClose,
  state,
  sessionStats,
  onResetSessionScore,
  sessionTotalCostUsd = 0,
  currencyCode = 'RUB',
  playerCostsUsd = {},
  onResetSessionCosts
}) => {
  if (!isOpen) return null;

  const gamesPlayed = sessionStats?.gamesPlayed || 0;

  // Find max wins to highlight current leader
  let maxWins = -1;
  state.players.forEach(p => {
    const sc = sessionStats?.scores[p.config.id];
    if (sc && sc.wins > maxWins) {
      maxWins = sc.wins;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] bg-slate-950 border border-amber-500/40 text-slate-100 p-4 sm:p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="text-center space-y-1.5">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-lg">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
            Счёт за сеанс
          </DialogTitle>
          <p className="text-xs text-slate-400 font-medium">
            Сыграно партий: <span className="font-bold text-amber-300 font-mono">#{gamesPlayed}</span>
          </p>
        </DialogHeader>

        {/* Players Detailed Stats Grid / List */}
        <div className="space-y-2 py-2">
          {state.players.map((player) => {
            const profile = CHARACTER_PROFILES[player.config.style as CharacterStyle] || CHARACTER_PROFILES.nikolaich;
            const avatar = player.isHuman ? '👤' : profile.avatar;
            const displayName = player.config.name || profile.name;
            const score = sessionStats?.scores[player.config.id] || { wins: 0, durakCount: 0 };
            const isLeader = maxWins > 0 && score.wins === maxWins;
            const playerCostUsd = playerCostsUsd[player.config.id] || 0;
            const winRate = gamesPlayed > 0 ? Math.round((score.wins / gamesPlayed) * 100) : 0;

            return (
              <div
                key={player.config.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
                  isLeader
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 border border-slate-700 text-base shrink-0 shadow-inner">
                    {avatar}
                    {isLeader && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow" title="Лидер сеанса">
                        <Crown className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                        {displayName}
                      </span>
                      {player.isHuman ? (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-slate-700 text-slate-300">
                          Ты
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[7.5px] px-1 py-0 h-3.5 border-amber-500/30 text-amber-300 font-mono truncate max-w-[80px]">
                          {player.config.provider === 'lmstudio' ? 'LM Studio' : player.config.modelId?.replace(/^.*\//, '') || 'LLM'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span>Винрейт: <strong className="text-amber-300">{winRate}%</strong></span>
                      {!player.isHuman && playerCostUsd > 0 && (
                        <span className="text-emerald-400 font-bold">
                          • {currencyService.formatCost(playerCostUsd, currencyCode)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Wins & Durak Count Badges */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <div
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 min-w-[42px]"
                    title={`Побед: ${score.wins}`}
                  >
                    <span className="text-[8px] uppercase font-bold text-amber-400/80 leading-none">Побед</span>
                    <span className="font-mono font-black text-xs sm:text-sm leading-tight flex items-center gap-0.5">
                      🏆 {score.wins}
                    </span>
                  </div>

                  <div
                    className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 min-w-[42px]"
                    title={`Дурак партии: ${score.durakCount}`}
                  >
                    <span className="text-[8px] uppercase font-bold text-rose-400/80 leading-none">Дурак</span>
                    <span className="font-mono font-black text-xs sm:text-sm leading-tight flex items-center gap-0.5">
                      💩 {score.durakCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total LLM Session Cost Summary */}
        {sessionTotalCostUsd > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              Расходы на LLM за сеанс:
            </span>
            <span className="font-bold text-emerald-400">
              {currencyService.formatCost(sessionTotalCostUsd, currencyCode)}
            </span>
          </div>
        )}

        {/* Footer Actions */}
        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetSessionScore}
              className="text-xs border-slate-700 hover:border-rose-500/50 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 flex-1 sm:flex-none"
            >
              <RotateCcw className="w-3 h-3 mr-1.5 text-rose-400" />
              Сброс счёта
            </Button>

            {onResetSessionCosts && sessionTotalCostUsd > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResetSessionCosts}
                className="text-xs border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 flex-1 sm:flex-none"
              >
                <Coins className="w-3 h-3 mr-1.5 text-emerald-400" />
                Сброс $
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionScoreModal;
