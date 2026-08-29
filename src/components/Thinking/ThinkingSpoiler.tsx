import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, Brain, Coins, Sparkles, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { currencyService, CurrencyCode } from '../../services/currencyService';

export interface ThinkingSpoilerProps {
  thinkingText: string;
  isStreaming?: boolean;
  tokensPerSecond?: number;
  tokenCount?: number;
  costUsd?: number;
  currencyCode?: CurrencyCode;
  characterName?: string;
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

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col rounded-2xl border border-amber-500/30 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-b border-slate-800 select-none shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn('p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 shadow-sm', isStreaming && 'animate-pulse')}>
            <Brain className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            {/* 1 - рассуждения модели */}
            <span className="font-bold text-xs sm:text-sm text-slate-100 truncate">
              Рассуждения модели
            </span>
            {/* 2 - имя человечка поменьше шрифт */}
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {characterName ? (
                <span className="text-[11px] text-amber-400 font-semibold truncate">
                  {characterName}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 truncate">
                  Ожидание хода
                </span>
              )}
              {isStreaming && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-300 font-mono animate-pulse shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  Генерация...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Token Metrics & Real-time Cost (2 Lines) */}
        <div className="flex flex-col items-end shrink-0 leading-tight">
          {/* Line 1: Tokens and Speed */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono">
            {tokensPerSecond > 0 && (
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                {tokensPerSecond} т/с
              </span>
            )}
            <span className="text-slate-400">
              {tokenCount > 0 ? `${tokenCount} ток.` : '0 ток.'}
            </span>
          </div>

          {/* Line 2: Money / Currency */}
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="text-[11px] sm:text-xs font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow-sm"
              title={`Стоимость текущего хода: $${(costUsd || 0).toFixed(5)} USD`}
            >
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>{formattedCost}</span>
            </span>
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
