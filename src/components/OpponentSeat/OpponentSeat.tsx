import { CharacterStyle, PlayerSessionScore, PlayerState } from '../../types/durak';
import { CHARACTER_PROFILES } from '../../services/prompts';
import { PlayingCard } from '../Cards/PlayingCard';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { Coins, Loader2, MessageSquareQuote } from 'lucide-react';
import { currencyService, CurrencyCode } from '../../services/currencyService';

export interface OpponentSeatProps {
  player: PlayerState;
  isAttacker?: boolean;
  isDefender?: boolean;
  isCurrentTurn?: boolean;
  speechText?: string;
  isThinking?: boolean;
  tokensPerSecond?: number;
  totalCostUsd?: number;
  currencyCode?: CurrencyCode;
  sessionScore?: PlayerSessionScore;
  compact?: boolean;
  alignSpeech?: 'left' | 'center' | 'right';
  className?: string;
}

export const OpponentSeat: React.FC<OpponentSeatProps> = ({
  player,
  isAttacker = false,
  isDefender = false,
  isCurrentTurn = false,
  speechText,
  isThinking = false,
  tokensPerSecond,
  totalCostUsd = 0,
  currencyCode = 'RUB',
  sessionScore,
  compact = false,
  alignSpeech = 'center',
  className
}) => {
  const profile = CHARACTER_PROFILES[player.config.style as CharacterStyle] || CHARACTER_PROFILES.nikolaich;
  const avatar = player.isHuman ? '👤' : profile.avatar;
  const displayName = player.config.name || profile.name;
  const isLocalLlm = player.config.provider === 'lmstudio';
  const formattedCost = currencyService.formatCost(totalCostUsd, currencyCode);

  return (
    <div className={cn('relative flex flex-col items-center gap-1 min-w-0 flex-1 max-w-[140px] sm:max-w-[185px]', className)}>
      {/* Opponent cards in hand (face down) */}
      {!player.isOut && player.hand.length > 0 && (
        <div className={cn(
          'flex items-center justify-center -space-x-7 sm:-space-x-8 h-8 sm:h-11 mb-0.5 origin-bottom transition-transform',
          compact ? 'scale-55 sm:scale-75' : 'scale-65 sm:scale-75'
        )}>
          {Array.from({ length: Math.min(player.hand.length, 6) }).map((_, i) => (
            <PlayingCard
              key={i}
              faceDown
              disabled
              size="sm"
              rotation={-10 + i * (20 / Math.max(player.hand.length - 1, 1))}
            />
          ))}
          {player.hand.length > 6 && (
            <div className="relative -ml-3 z-30 bg-amber-500 text-slate-950 text-[8px] sm:text-[9px] font-black px-1 py-0.2 rounded-full shadow">
              +{player.hand.length - 6}
            </div>
          )}
        </div>
      )}

      {/* Speech bubble with edge-aware smart positioning */}
      {speechText && (
        <div
          className={cn(
            'absolute top-full mt-1.5 z-40 px-2 py-1 bg-slate-950/95 text-amber-200 border border-amber-500/50 rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 backdrop-blur-md flex items-start gap-1 pointer-events-none',
            'w-[155px] sm:w-[210px] md:w-[240px] max-w-[85vw]',
            alignSpeech === 'left' && 'left-0 translate-x-0',
            alignSpeech === 'right' && 'right-0 translate-x-0',
            alignSpeech === 'center' && 'left-1/2 -translate-x-1/2'
          )}
        >
          <MessageSquareQuote className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-amber-400 mt-0.5" />
          <span className="text-[8.5px] sm:text-[10px] md:text-[11px] italic leading-tight break-words line-clamp-4 sm:line-clamp-3">
            «{speechText}»
          </span>
          <div
            className={cn(
              'absolute -top-1 w-2.5 h-2.5 bg-slate-950 border-l border-t border-amber-500/50 rotate-45',
              alignSpeech === 'left' && 'left-6 translate-x-0',
              alignSpeech === 'right' && 'right-6 translate-x-0',
              alignSpeech === 'center' && 'left-1/2 -translate-x-1/2'
            )}
          />
        </div>
      )}

      {/* Player Card (Avatar + Card Count on left, 3-line info on right) */}
      <div
        className={cn(
          'relative w-full flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 border backdrop-blur-md transition-all duration-200 shadow-md min-w-0',
          isCurrentTurn
            ? 'border-amber-400 ring-1 sm:ring-2 ring-amber-400/40 shadow-amber-500/20 scale-[1.02] sm:scale-105'
            : 'border-slate-800'
        )}
      >
        {/* Left Column: Avatar + Card Count Badge underneath */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 text-sm sm:text-base shadow-inner">
            {avatar}
            {isThinking && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-slate-950 p-0.5 rounded-full animate-spin">
                <Loader2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              </div>
            )}
          </div>

          {/* Cards Count Badge directly under avatar */}
          <div className="mt-0.5 px-1 py-0.2 rounded bg-slate-800/90 border border-slate-700/80 text-[7.5px] sm:text-[8.5px] font-mono font-bold text-slate-200 shadow-sm leading-none whitespace-nowrap">
            {player.isOut ? '🎉' : `${player.hand.length} к.`}
          </div>
        </div>

        {/* Right Column: 3-Line Info Section */}
        <div className="flex flex-col min-w-0 flex-1 leading-tight gap-0.5">
          {/* Строка 1: Имя + Счёт сеанса */}
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-[9.5px] sm:text-xs text-slate-100 truncate">
              {displayName}
            </span>
            {sessionScore && (sessionScore.wins > 0 || sessionScore.durakCount > 0) && (
              <span
                className="shrink-0 text-[7.5px] sm:text-[8.5px] font-mono px-1 py-0 rounded bg-slate-800 border border-slate-700/80 text-amber-300 font-bold flex items-center gap-0.5"
                title={`Счёт за сеанс — Побед: ${sessionScore.wins}, Дурак: ${sessionScore.durakCount}`}
              >
                🏆{sessionScore.wins} {sessionScore.durakCount > 0 && `💩${sessionScore.durakCount}`}
              </span>
            )}
          </div>

          {/* Строка 2: Модель */}
          {!player.isHuman ? (
            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono text-amber-400/90 truncate">
              <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0 inline-block" />
              <span
                className="truncate"
                title={`${player.config.provider === 'lmstudio' ? 'LM Studio' : 'OpenRouter'}: ${player.config.modelId || 'auto'}`}
              >
                {player.config.modelId && player.config.modelId !== 'default' && player.config.modelId !== 'auto'
                  ? player.config.modelId.replace(/^.*\//, '')
                  : isLocalLlm
                  ? 'LM Studio (авто)'
                  : 'OpenRouter (авто)'}
              </span>
            </div>
          ) : (
            <div className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate">Человек</div>
          )}

          {/* Строка 3: Расходы слева + Роль / Думает справа */}
          <div className="flex items-center justify-between gap-1 text-[8px] sm:text-[9px] font-mono w-full mt-0.5">
            {/* Left: Money cost */}
            {!player.isHuman ? (
              <span
                className={cn(
                  'shrink-0 font-bold px-1 py-0 rounded flex items-center gap-0.5',
                  isLocalLlm ? 'text-slate-400 bg-slate-800/80 border border-slate-700/50' : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                )}
                title={isLocalLlm ? 'Локально (0.00)' : `Потрачено: $${(totalCostUsd || 0).toFixed(5)} USD`}
              >
                <Coins className="w-2 h-2 text-emerald-400" />
                {isLocalLlm ? '0.00' : formattedCost}
              </span>
            ) : (
              <span className="text-[8px] text-slate-500">—</span>
            )}

            {/* Right: Role / Thinking status */}
            <div className="flex items-center justify-end shrink-0 ml-auto">
              {isThinking && (
                <span className="text-amber-300 font-bold animate-pulse truncate flex items-center gap-0.5 text-[7.5px] sm:text-[8.5px]">
                  {tokensPerSecond ? `⚡${tokensPerSecond}` : 'Думает...'}
                </span>
              )}
              {isAttacker && !isThinking && (
                <Badge variant="destructive" className="text-[7px] sm:text-[8px] px-1 py-0 h-3.5 leading-none">
                  Атака
                </Badge>
              )}
              {isDefender && !isThinking && (
                <Badge variant="default" className="text-[7px] sm:text-[8px] bg-amber-500 text-slate-950 font-bold px-1 py-0 h-3.5 leading-none">
                  Защита
                </Badge>
              )}
              {player.isOut && !isThinking && (
                <Badge variant="success" className="text-[7px] sm:text-[8px] px-1 py-0 h-3.5 leading-none">
                  {player.outRank ? `${player.outRank}-е` : 'Победил'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentSeat;
