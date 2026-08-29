import React, { useEffect, useRef, useState } from 'react';
import { MoveLogItem } from '../../types/durak';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertTriangle, ArrowDown, Coins, History, MessageSquareQuote, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { currencyService, CurrencyCode } from '../../services/currencyService';

export interface MoveHistoryProps {
  history: MoveLogItem[];
  currencyCode?: CurrencyCode;
  className?: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  currencyCode = 'RUB',
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollActiveRef = useRef<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Handle scroll detection
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 40;
    isAutoScrollActiveRef.current = isAtBottom;
    setShowScrollBottomBtn(!isAtBottom);
  };

  // Smart Auto scroll on new move
  useEffect(() => {
    if (isAutoScrollActiveRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

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

  return (
    <div
      className={cn(
        'w-full h-full flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 select-none shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs sm:text-sm text-slate-200">Лог партии и реплики</span>
        </div>
        <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 bg-slate-900">
          Ходов: {history.length}
        </Badge>
      </div>

      {/* Content area with Smart Scroll */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-slate-950/30">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full w-full p-2.5 overflow-y-auto space-y-2 scroll-smooth"
        >
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
              <History className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
              <span>История ходов пуста</span>
              <span className="text-[10px] text-slate-600 mt-1">Здесь будут записываться все ходы, реплики и расходы токенов</span>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex flex-col gap-1 p-2 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs transition-colors hover:bg-slate-900/95"
              >
                {/* Header: player & action */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="font-bold text-amber-300 text-[11px] truncate">{item.playerName}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.errorsCount && item.errorsCount > 0 ? (
                      <span
                        className="text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 flex items-center gap-0.5 shadow-sm"
                        title={item.errorReasons?.join('\n') || `${item.errorsCount} ошибок хода`}
                      >
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                        <span>{item.errorsCount} {item.errorsCount === 1 ? 'ошибка' : 'ошибки'}</span>
                      </span>
                    ) : null}
                    <Badge variant="outline" className="text-[10px] py-0 border-slate-700 bg-slate-800/80 font-medium">
                      {item.actionText}
                    </Badge>
                  </div>
                </div>

                {/* Comment / Trash talk */}
                {item.comment && (
                  <div className="flex items-start gap-1 text-[11px] text-slate-300 italic pl-1.5 border-l-2 border-amber-500/50 mt-0.5 leading-snug">
                    <MessageSquareQuote className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <span>«{item.comment}»</span>
                  </div>
                )}

                {/* Error reasons detail in move log */}
                {item.errorReasons && item.errorReasons.length > 0 && (
                  <div className="text-[9.5px] text-rose-300/80 font-mono bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/50 mt-0.5 space-y-0.5">
                    {item.errorReasons.map((reason, rIdx) => (
                      <div key={rIdx} className="truncate">
                        <span className="text-rose-400 font-bold">⚠️ Попытка #{rIdx + 1}:</span> {reason}
                      </div>
                    ))}
                  </div>
                )}

                {/* Metrics & Money spent for this move */}
                <div className="flex items-center justify-end gap-2 text-[9px] font-mono text-slate-500 mt-0.5">
                  {item.tokensPerSecond && item.tokensPerSecond > 0 ? (
                    <span className="flex items-center gap-0.5 text-amber-400/90">
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      {item.tokensPerSecond} т/с ({item.tokenCount} ток.)
                    </span>
                  ) : null}

                  {item.costUsd !== undefined && item.costUsd > 0 && (
                    <span
                      className="flex items-center gap-0.5 text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded border border-emerald-500/20"
                      title={`Стоимость хода: $${item.costUsd.toFixed(5)} USD`}
                    >
                      <Coins className="w-2.5 h-2.5 text-emerald-400" />
                      +{currencyService.formatCost(item.costUsd, currencyCode)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottomBtn && history.length > 0 && (
          <Button
            size="sm"
            variant="default"
            onClick={scrollToBottom}
            className="absolute bottom-3 right-3 h-7 text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold shadow-lg px-2 py-0 rounded-full flex items-center gap-1 animate-bounce z-20"
          >
            <ArrowDown className="w-3 h-3" />
            Вниз к последнему ходу
          </Button>
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
