import React from 'react';
import { CharacterStyle, PlayerSessionScore, PlayerState } from '../../types/durak';
import { CHARACTER_PROFILES } from '../../services/prompts';
import { PlayingCard } from '../Cards/PlayingCard';
import { cn } from '../../lib/utils';
import { Coins, Loader2, MessageSquareQuote, Shield, Swords, Zap, Crown } from 'lucide-react';
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
    <div className={cn('relative flex flex-col items-center gap-1 min-w-0 flex-1', className)}>
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
          'relative w-full flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:py-1.5 rounded-xl bg-slate-900/90 border backdrop-blur-md transition-all duration-200 shadow-md min-w-0',
          isCurrentTurn
            ? 'border-amber-400 ring-1 sm:ring-2 ring-amber-400/40 shadow-amber-500/20 scale-[1.02] sm:scale-105'
            : 'border-slate-800'
        )}
      >
        {/* Left Column: Avatar + Card Count Badge underneath (hidden on mobile) */}
        <div className="hidden sm:flex flex-col items-center shrink-0">
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

        {/* Right Column: Info Section */}
        <div className="flex flex-col min-w-0 flex-1 leading-tight gap-0.5">
          {/* Строка 1: Имя на всю ширину (100% ширины) */}
          <div className="w-full flex items-center min-w-0">
            <span className="font-bold text-[10px] sm:text-xs text-slate-100 truncate w-full" title={displayName}>
              {displayName}
            </span>
          </div>

          {/* Строка 2: Модель / Провайдер слева + Токены/сек (мышление) справа */}
          <div className="flex items-center justify-between gap-1 w-full mt-0.5">
            {!player.isHuman ? (
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-mono text-amber-400/90 truncate min-w-0 flex-1">
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0 inline-block',
                    player.config.provider === 'pollinations'
                      ? 'bg-pink-400'
                      : player.config.provider === 'custom'
                      ? 'bg-purple-400'
                      : player.config.provider === 'openrouter'
                      ? 'bg-sky-400'
                      : 'bg-emerald-400'
                  )}
                />
                <span
                  className="truncate"
                  title={`${
                    player.config.provider === 'pollinations'
                      ? 'Pollinations AI'
                      : player.config.provider === 'custom'
                      ? 'Custom OpenAI'
                      : player.config.provider === 'openrouter'
                      ? 'OpenRouter'
                      : 'LM Studio'
                  }: ${player.config.modelId || 'openai'}`}
                >
                  {player.config.modelId && player.config.modelId !== 'default' && player.config.modelId !== 'auto'
                    ? player.config.modelId.replace(/^.*\//, '')
                    : player.config.provider === 'pollinations'
                    ? '🌸 Pollinations'
                    : player.config.provider === 'custom'
                    ? 'Custom'
                    : isLocalLlm
                    ? 'LM Studio'
                    : 'OpenRouter'}
                </span>
              </div>
            ) : (
              <div className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate min-w-0 flex-1">Человек</div>
            )}

            {/* Thinking / Tokens per second on 2nd row next to model */}
            {isThinking && (
              <span className="text-amber-300 font-bold animate-pulse truncate flex items-center gap-0.5 text-[7.5px] sm:text-[8.5px] ml-auto shrink-0 font-mono">
                <Zap className="w-2 h-2 text-amber-400 animate-bounce shrink-0" />
                {tokensPerSecond ? `${tokensPerSecond.toFixed(0)} т/с` : 'Думает...'}
              </span>
            )}
          </div>

          {/* Строка 3: Карты (на мобиле) + Расходы слева + Иконка роли (Меч/Щит/Корона) справа */}
          <div className="flex items-center justify-between gap-1 text-[8px] sm:text-[9px] font-mono w-full mt-0.5">
            <div className="flex items-center gap-1 min-w-0">
              {/* Mobile-only cards count badge */}
              <span className="sm:hidden font-mono font-bold text-[7.5px] px-1 py-0.2 rounded bg-slate-800 border border-slate-700/80 text-slate-200 shadow-sm leading-none whitespace-nowrap shrink-0">
                {player.isOut ? '🎉' : `${player.hand.length} к.`}
              </span>

              {/* Money cost */}
              {!player.isHuman ? (
                <span
                  className={cn(
                    'shrink-0 font-bold px-1 py-0 rounded flex items-center gap-0.5 text-[7.5px] sm:text-[8.5px]',
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
            </div>

            {/* Attack / Defend / Winner Role Icons on 3rd row */}
            <div className="flex items-center shrink-0 ml-auto">
              {isAttacker && !isThinking && (
                <span
                  className="flex items-center justify-center w-4 h-4 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                  title="Атакует"
                >
                  <Swords className="w-2.5 h-2.5" />
                </span>
              )}
              {isDefender && !isThinking && (
                <span
                  className="flex items-center justify-center w-4 h-4 rounded bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm"
                  title="Защищается"
                >
                  <Shield className="w-2.5 h-2.5" />
                </span>
              )}
              {player.isOut && !isThinking && (
                <span
                  className="flex items-center gap-0.5 px-1 h-3.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[7px] sm:text-[8px] font-bold font-mono"
                  title={player.outRank ? `${player.outRank}-е место` : 'Победил'}
                >
                  <Crown className="w-2 h-2" />
                  <span>{player.outRank || '1'}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentSeat;
