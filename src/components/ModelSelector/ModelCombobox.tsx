import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LlmProvider } from '../../types/durak';
import { OpenRouterModel } from '../../services/llmClient';
import { Badge } from '../ui/badge';
import {
  Check,
  ChevronDown,
  Cpu,
  Globe,
  PlusCircle,
  Search,
  Server,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModelComboboxProps {
  value?: string;
  onChange: (modelId: string) => void;
  provider: LlmProvider;
  models: OpenRouterModel[] | { id: string; name?: string }[];
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

type ModelCategory = 'all' | 'reasoning' | 'free' | 'fast' | 'flagship';

export const ModelCombobox: React.FC<ModelComboboxProps> = ({
  value,
  onChange,
  provider,
  models,
  isLoading = false,
  disabled = false,
  placeholder = 'Выберите или введите модель...',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModelCategory>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedModel = useMemo(() => {
    return models.find(m => m.id === value);
  }, [models, value]);

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const idMatch = m.id.toLowerCase().includes(q);
      const nameMatch = (m.name || '').toLowerCase().includes(q);
      const descMatch = ((m as OpenRouterModel).description || '').toLowerCase().includes(q);
      const matchesSearch = !q || idMatch || nameMatch || descMatch;

      if (!matchesSearch) return false;
      if (provider !== 'openrouter') return true;

      const lowerId = m.id.toLowerCase();
      if (selectedCategory === 'reasoning') {
        return lowerId.includes('r1') || lowerId.includes('qwq') || lowerId.includes('thinking') || lowerId.includes('sonnet');
      }
      if (selectedCategory === 'free') {
        return lowerId.includes(':free');
      }
      if (selectedCategory === 'fast') {
        return lowerId.includes('flash') || lowerId.includes('mini') || lowerId.includes('chat') || lowerId.includes('3b');
      }
      if (selectedCategory === 'flagship') {
        return lowerId.includes('claude-3.7') || lowerId.includes('gpt-4o') || lowerId.includes('gemini-2.0-pro') || lowerId.includes('70b') || lowerId.includes('72b');
      }

      return true;
    });
  }, [models, searchQuery, selectedCategory, provider]);

  const handleSelect = (modelId: string) => {
    onChange(modelId);
    setIsOpen(false);
  };

  const isExactMatch = models.some(m => m.id.toLowerCase() === searchQuery.toLowerCase().trim());
  const isDefaultAuto = !value || value === 'default' || value === 'auto';

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/90 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-sm hover:border-slate-600',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'border-amber-400 ring-1 ring-amber-400'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {provider === 'openrouter' ? (
            <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Server className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}

          <div className="min-w-0 flex-1 truncate">
            {isDefaultAuto ? (
              <span className="text-amber-300 text-xs font-semibold truncate flex items-center gap-1 font-mono">
                <Zap className="w-3 h-3 text-amber-400" />
                {provider === 'lmstudio' ? 'Первая доступная (активная в LM Studio)' : 'Автовыбор модели'}
              </span>
            ) : selectedModel ? (
              <span className="text-slate-100 text-xs font-semibold truncate block font-mono">
                {selectedModel.name || selectedModel.id}
              </span>
            ) : value ? (
              <span className="text-slate-100 text-xs font-semibold truncate block font-mono">
                {value === 'mock-ai' ? '⚡ Быстрый Mock-AI (Без ключей)' : value}
              </span>
            ) : (
              <span className="text-slate-500 text-xs truncate block">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-amber-400'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[380px] animate-in fade-in-0 zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск модели (DeepSeek, Claude, Llama)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categories (OpenRouter) */}
            {provider === 'openrouter' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'reasoning', label: '🧠 Reasoning' },
                  { id: 'free', label: '🆓 Free' },
                  { id: 'fast', label: '⚡ Flash' },
                  { id: 'flagship', label: '👑 Флагманы' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as ModelCategory)}
                    className={cn(
                      'px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 cursor-pointer',
                      selectedCategory === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-100'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List of Models */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            {/* 1. First Available Model Option (Auto-detect active model) */}
            <button
              type="button"
              onClick={() => handleSelect('default')}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer',
                isDefaultAuto
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                  : 'hover:bg-slate-900 border border-transparent'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-amber-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {provider === 'lmstudio'
                      ? 'Первая доступная (активная в LM Studio)'
                      : 'Автовыбор модели'}
                  </span>
                  <Badge variant="trump" className="text-[9px] py-0 px-1 font-mono">
                    Рекомендуется
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {provider === 'lmstudio'
                    ? 'Автоматически использовать модель, которая запущена в LM Studio'
                    : 'Автоматически выбрать лучшую доступную модель'}
                </p>
              </div>
              {isDefaultAuto && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
            </button>

            {/* Quick Mock AI option */}
            <button
              type="button"
              onClick={() => handleSelect('mock-ai')}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer',
                value === 'mock-ai'
                  ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                  : 'hover:bg-slate-900 border border-transparent'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-amber-300">⚡ Быстрый Mock-AI</span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/40 text-amber-300">
                    Offline
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Локальный эмулятор ходов без API ключей и серверов
                </p>
              </div>
              {value === 'mock-ai' && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
            </button>

            {/* Filtered Models */}
            {filteredModels.length > 0 ? (
              filteredModels.map(m => {
                const isSelected = m.id === value;
                const isFree = m.id.toLowerCase().includes(':free');
                const isReasoning =
                  m.id.toLowerCase().includes('r1') ||
                  m.id.toLowerCase().includes('qwq') ||
                  m.id.toLowerCase().includes('sonnet');

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                        : 'hover:bg-slate-900 border border-transparent'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-100 truncate">
                          {m.name && m.name !== m.id ? m.name : m.id}
                        </span>

                        {isFree && (
                          <Badge variant="success" className="text-[9px] py-0 px-1 font-mono">
                            FREE
                          </Badge>
                        )}

                        {isReasoning && (
                          <Badge variant="trump" className="text-[9px] py-0 px-1 font-mono flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> CoT
                          </Badge>
                        )}
                      </div>

                      {m.name && m.name !== m.id && (
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {m.id}
                        </p>
                      )}

                      {(m as OpenRouterModel).description && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5 opacity-80">
                          {(m as OpenRouterModel).description}
                        </p>
                      )}
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="py-4 px-3 text-center text-slate-500 text-xs">
                Модели по запросу «{searchQuery}» не найдены.
              </div>
            )}

            {/* Custom Model ID Entry */}
            {searchQuery.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="w-full text-left p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-200 transition-colors flex items-center gap-2 text-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Использовать модель: «{searchQuery.trim()}»</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelCombobox;
