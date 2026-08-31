import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, Brain, Coins, Sparkles, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { currencyService, CurrencyCode } from '../../services/currencyService';
import type { LlmProvider } from '../../types/durak';

export interface ThinkingSpoilerProps {
  thinkingText: string;
  isStreaming?: boolean;
  tokensPerSecond?: number;
  tokenCount?: number;
  costUsd?: number;
  currencyCode?: CurrencyCode;
  characterName?: string;
  modelId?: string;
  provider?: LlmProvider;
  errorsCount?: number;
  errorReasons?: string[];
  className?: string;
}

export const ThinkingSpoiler: React.FC<ThinkingSpoilerProps> = ({
  thinkingText,
  isStreaming = false,
  tokensPerSecond = 0,
  tokenCount = 0,
  costUsd = 0,
  currencyCode = 'RUB',
  characterName,
  modelId,
  provider = 'openrouter',
  errorsCount = 0,
  errorReasons = [],
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollActiveRef = useRef<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Handle user scroll detection
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 40;
    isAutoScrollActiveRef.current = isAtBottom;
    setShowScrollBottomBtn(!isAtBottom);
  };

  // Smart Auto scroll: only stick to bottom if user hasn't scrolled up
  useEffect(() => {
    if (isAutoScrollActiveRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thinkingText, isStreaming]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      isAutoScrollActiveRef.current = true;
      setShowScrollBottomBtn(false);
    }
  };

  const formattedCost = currencyService.formatCost(costUsd, currencyCode);

  const isLocalLlm = provider === 'lmstudio';
  const displayModelName =
    modelId && modelId !== 'default' && modelId !== 'auto'
      ? modelId.replace(/^.*\//, '')
      : provider === 'pollinations'
      ? '🌸 Pollinations'
      : provider === 'custom'
      ? 'Custom'
      : isLocalLlm
      ? 'LM Studio'
      : 'OpenRouter';

  const providerTitle =
    provider === 'pollinations'
      ? 'Pollinations AI'
      : provider === 'custom'
      ? 'Custom OpenAI'
      : provider === 'openrouter'
      ? 'OpenRouter'
      : 'LM Studio';

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col rounded-2xl border border-amber-500/30 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-b border-slate-800 select-none shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={cn('p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 shadow-sm transition-all', isStreaming && 'ring-1 ring-amber-400/50 bg-amber-500/30')}>
            <Brain className={cn('w-4 h-4 text-amber-400', isStreaming && 'animate-spin')} />
          </div>
          <div className="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
            {/* Строка 1: Имя и титул персонажа в скобках (белым цветом) */}
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1 min-w-0 truncate">
                <span className="font-bold text-xs sm:text-sm text-slate-100 truncate" title={characterName}>
                  {characterName || 'Ожидание хода'}
                </span>
              </div>
              {errorsCount > 0 && (
                <span
                  className="flex items-center gap-1 text-[9.5px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded animate-pulse shrink-0"
                  title={errorReasons.length > 0 ? errorReasons.join('\n') : `${errorsCount} повторных попыток`}
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                  <span>{errorsCount} {errorsCount === 1 ? 'ошибка' : errorsCount < 5 ? 'ошибки' : 'ошибок'}</span>
                </span>
              )}
            </div>

            {/* Строка 2: modelid токены деньги (в стиле карточек игроков) */}
            <div className="flex items-center justify-between gap-2 min-w-0 text-[10px] sm:text-[11px] font-mono">
              <div
                className="flex items-center gap-1 text-amber-400/90 truncate min-w-0 flex-1"
                title={`${providerTitle}: ${modelId || 'openai'}`}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0 inline-block',
                    provider === 'pollinations'
                      ? 'bg-pink-400'
                      : provider === 'custom'
                      ? 'bg-purple-400'
                      : provider === 'openrouter'
                      ? 'bg-sky-400'
                      : 'bg-emerald-400'
                  )}
                />
                <span className="truncate">
                  {displayModelName}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {tokensPerSecond > 0 && (
                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    {tokensPerSecond} т/с
                  </span>
                )}
                <span className="text-slate-400">
                  {tokenCount > 0 ? `${tokenCount} ток.` : '0 ток.'}
                </span>
                <span
                  className="text-[10px] sm:text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shadow-sm"
                  title={`Стоимость текущего хода: $${(costUsd || 0).toFixed(5)} USD`}
                >
                  <Coins className="w-2.5 h-2.5 text-emerald-400" />
                  <span>{formattedCost}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Smart Scroll */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-slate-950/40">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full w-full p-3 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30 scroll-smooth"
        >
          {/* Error Banner if model had retries */}
          {errorReasons && errorReasons.length > 0 && (
            <div className="mb-2.5 p-2 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 shadow-sm animate-in fade-in-0 slide-in-from-top-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300 text-[11px] mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Ошибки модели в текущем ходе ({errorReasons.length}):</span>
              </div>
              <div className="space-y-1 text-[10.5px] font-mono pl-1.5 border-l-2 border-rose-500/60">
                {errorReasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <span className="text-rose-400 shrink-0 font-bold">Попытка #{i + 1}:</span>
                    <span className="text-rose-200/90">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {thinkingText ? (
            <>
              {thinkingText}
              {isStreaming && (
                <span className="inline-block w-2 h-3.5 ml-1 bg-amber-400 animate-pulse align-middle" />
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
              <Brain className="w-8 h-8 mb-2 opacity-30 text-amber-400" />
              <span>Ожидание начала рассуждений...</span>
              <span className="text-[10px] text-slate-600 mt-1">Здесь в реальном времени будут транслироваться мысли ИИ и стоимость хода</span>
            </div>
          )}
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottomBtn && thinkingText && (
          <Button
            size="sm"
            variant="default"
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 h-7 text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30 px-2 py-0 rounded-full flex items-center gap-1 animate-bounce z-20"
          >
            <ArrowDown className="w-3 h-3" />
            Вниз к новым мыслям
          </Button>
        )}
      </div>
    </div>
  );
};

export default ThinkingSpoiler;
