import React, { useState, useEffect } from 'react';
import {
  CharacterStyle,
  DurakMode,
  LlmProvider,
  PlayerConfig,
  PlayerType
} from '../../types/durak';
import { CHARACTER_PROFILES } from '../../services/prompts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ModelCombobox } from '../ModelSelector/ModelCombobox';
import {
  lmStudioService,
  OpenRouterModel,
  POPULAR_OPENROUTER_MODELS
} from '../../services/lmStudioClient';
import { currencyService, CurrencyCode } from '../../services/currencyService';
import { speechService } from '../../services/speechService';
import { PlayingCard } from '../Cards/PlayingCard';
import { cn } from '../../lib/utils';
import { Coins, Cpu, FastForward, Gauge, Globe, Loader2, Play, RefreshCw, Sparkles, Trash2, User, Users, Volume2, Zap } from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DurakMode;
  onSaveMode: (mode: DurakMode) => void;
  playersConfig: PlayerConfig[];
  onSavePlayers: (players: PlayerConfig[]) => void;
  lmStudioBaseUrl: string;
  onSaveLmStudioUrl: (url: string) => void;
  openRouterApiKey: string;
  onSaveOpenRouterKey: (key: string) => void;
  currencyCode?: CurrencyCode;
  onSaveCurrency?: (code: CurrencyCode) => void;
  onResetSessionCosts?: () => void;
  sessionTotalCostUsd?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mode,
  onSaveMode,
  playersConfig,
  onSavePlayers,
  lmStudioBaseUrl,
  onSaveLmStudioUrl,
  openRouterApiKey,
  onSaveOpenRouterKey,
  currencyCode = 'RUB',
  onSaveCurrency,
  onResetSessionCosts,
  sessionTotalCostUsd = 0
}) => {
  const [localMode, setLocalMode] = useState<DurakMode>(mode);
  const [localPlayers, setLocalPlayers] = useState<PlayerConfig[]>(playersConfig);
  const [localLmUrl, setLocalLmUrl] = useState(lmStudioBaseUrl);
  const [localApiKey, setLocalApiKey] = useState(openRouterApiKey);
  const [localAnimSpeed, setLocalAnimSpeed] = useState<string>(() => {
    try {
      return localStorage.getItem('durak_anim_speed') || '1';
    } catch {}
    return '1';
  });
  const [isTestingAnim, setIsTestingAnim] = useState(false);

  // Sync CSS variable when animation speed changes
  const handleAnimSpeedChange = (speed: string) => {
    setLocalAnimSpeed(speed);
    try {
      localStorage.setItem('durak_anim_speed', speed);
    } catch {}
    const durationMap: Record<string, number> = {
      '0.25': 1.4,
      '0.5': 0.8,
      '1': 0.45,
      '1.5': 0.25,
      '0': 0.01
    };
    const dur = durationMap[speed] ?? 0.45;
    document.documentElement.style.setProperty('--card-anim-duration', `${dur}s`);
  };

  const handleTestAnimation = () => {
    setIsTestingAnim(false);
    setTimeout(() => setIsTestingAnim(true), 30);
  };
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currencyCode || currencyService.getCurrency());
  const [currentRate, setCurrentRate] = useState<number>(currencyService.getRate(currencyCode || 'RUB'));
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [rateUpdateMsg, setRateUpdateMsg] = useState('');

  // Update rate when currency changes
  useEffect(() => {
    setCurrentRate(currencyService.getRate(selectedCurrency));
  }, [selectedCurrency]);

  const handleUpdateRatesOnline = async () => {
    setIsUpdatingRates(true);
    setRateUpdateMsg('');
    const res = await currencyService.fetchExchangeRates();
    setIsUpdatingRates(false);
    if (res.success) {
      setCurrentRate(currencyService.getRate(selectedCurrency));
      setRateUpdateMsg('✅ Курсы валют успешно обновлены через онлайн API!');
    } else {
      setRateUpdateMsg(`⚠️ Не удалось получить свежий курс: ${res.message || 'ошибка сети'}`);
    }
  };

  const handleCurrencySelect = (code: CurrencyCode) => {
    setSelectedCurrency(code);
    currencyService.setCurrency(code);
    onSaveCurrency?.(code);
  };

  // Models state
  const [lmStudioModels, setLmStudioModels] = useState<{ id: string; name?: string }[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(POPULAR_OPENROUTER_MODELS);
  const [isLoadingLm, setIsLoadingLm] = useState(false);
  const [isLoadingOpenRouter, setIsLoadingOpenRouter] = useState(false);
  const [lmStatus, setLmStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [openRouterStatus, setOpenRouterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lmErrorMsg, setLmErrorMsg] = useState('');
  const [orErrorMsg, setOrErrorMsg] = useState('');

  // Fetch LM Studio Models
  const fetchLmModels = async () => {
    setIsLoadingLm(true);
    setLmErrorMsg('');
    try {
      const models = await lmStudioService.fetchModels(localLmUrl);
      setLmStudioModels(models);
      setLmStatus(models.length > 0 ? 'success' : 'error');
      if (models.length === 0) {
        setLmErrorMsg('В LM Studio не загружены модели. Запустите модель в LM Studio.');
      }
    } catch (err: any) {
      setLmStatus('error');
      setLmErrorMsg(err?.message || 'Не удалось подключиться к LM Studio');
    } finally {
      setIsLoadingLm(false);
    }
  };

  // Fetch OpenRouter Models
  const fetchOrModels = async () => {
    setIsLoadingOpenRouter(true);
    setOrErrorMsg('');
    try {
      const models = await lmStudioService.fetchOpenRouterModels(localApiKey);
      setOpenRouterModels(models);
      setOpenRouterStatus('success');
    } catch (err: any) {
      setOpenRouterStatus('error');
      setOrErrorMsg(err?.message || 'Ошибка загрузки OpenRouter моделей');
    } finally {
      setIsLoadingOpenRouter(false);
    }
  };

  // Initial fetch on open
  useEffect(() => {
    if (isOpen) {
      setLocalMode(mode);
      setLocalPlayers(playersConfig);
      setLocalLmUrl(lmStudioBaseUrl);
      setLocalApiKey(openRouterApiKey);
      fetchLmModels();
      fetchOrModels();
    }
  }, [isOpen]);

  const handlePlayerChange = (index: number, updates: Partial<PlayerConfig>) => {
    const updated = [...localPlayers];
    const prev = updated[index];
    const next = { ...prev, ...updates };

    // If style (personality) changed, automatically apply personality name
    if (updates.style && updates.style !== prev.style) {
      const profile = CHARACTER_PROFILES[updates.style];
      if (profile) {
        next.name = profile.name;
      }
    }

    // If player type changed:
    // human -> llm: save human name, apply LLM character name
    // llm -> human: restore saved human name
    if (updates.type && updates.type !== prev.type) {
      if (updates.type === 'llm') {
        next.savedHumanName = prev.savedHumanName || prev.name;
        const profile = CHARACTER_PROFILES[next.style];
        next.name = profile ? profile.name : 'Нейросеть';
      } else if (updates.type === 'human') {
        next.name = prev.savedHumanName || (index === 0 ? 'Семён' : `Игрок ${index + 1}`);
      }
    }

    // If user edited name while in human mode, save it as their human name
    if (updates.name !== undefined && next.type === 'human') {
      next.savedHumanName = updates.name;
    }

    // If provider changed, pick first available model or keep valid
    if (updates.provider && updates.provider !== prev.provider) {
      if (updates.provider === 'lmstudio') {
        next.modelId = 'default';
      } else if (updates.provider === 'openrouter') {
        next.modelId = 'deepseek/deepseek-r1';
      }
    }

    updated[index] = next;
    setLocalPlayers(updated);
  };

  const handleAddPlayer = () => {
    if (localPlayers.length >= 4) return;
    const newIdx = localPlayers.length + 1;
    const styles: CharacterStyle[] = ['shuler', 'professor', 'patsan', 'baba_klava'];
    const style = styles[(newIdx - 1) % styles.length];
    const profile = CHARACTER_PROFILES[style];

    setLocalPlayers([
      ...localPlayers,
      {
        id: `player_${newIdx}`,
        name: profile.name,
        type: 'llm',
        provider: 'lmstudio',
        modelId: 'mock-ai',
        style
      }
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    if (localPlayers.length <= 2) return;
    setLocalPlayers(localPlayers.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSaveMode(localMode);
    onSavePlayers(localPlayers);
    onSaveLmStudioUrl(localLmUrl);
    onSaveOpenRouterKey(localApiKey);

    // Persist in localStorage
    try {
      localStorage.setItem('durak_mode', localMode);
      localStorage.setItem('durak_lm_url', localLmUrl);
      localStorage.setItem('durak_or_key', localApiKey);
      localStorage.setItem('durak_players', JSON.stringify(localPlayers));
    } catch {}

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[88vh] overflow-y-auto p-3.5 sm:p-6 rounded-2xl border-slate-800 bg-slate-900/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-amber-400">
            ⚙️ Настройки игры и LLM
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="game" className="w-full">
          {/* Responsive Tabs List: smooth horizontal scroll on mobile, clean 4-col grid on desktop */}
          <TabsList className="flex sm:grid sm:grid-cols-4 w-full overflow-x-auto p-1 gap-1 bg-slate-950/90 border border-slate-800 rounded-xl h-auto shrink-0 justify-start sm:justify-center scrollbar-none">
            <TabsTrigger
              value="game"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold transition-all"
            >
              <span>👥</span>
              <span className="sm:hidden">Игроки</span>
              <span className="hidden sm:inline">Режим и Игроки</span>
            </TabsTrigger>

            <TabsTrigger
              value="models"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold transition-all"
            >
              <span>🤖</span>
              <span className="sm:hidden">Модели</span>
              <span className="hidden sm:inline">Запрос Моделей</span>
            </TabsTrigger>

            <TabsTrigger
              value="characters"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold transition-all"
            >
              <span>🎭</span>
              <span>Персонажи</span>
            </TabsTrigger>

            <TabsTrigger
              value="currency"
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 data-[state=active]:font-bold transition-all"
            >
              <Coins className="w-3.5 h-3.5" />
              <span className="sm:hidden">Валюта</span>
              <span className="hidden sm:inline">Валюта и Расходы</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Game & Players */}
          <TabsContent value="game" className="space-y-4 py-2">
            {/* Durak Mode Switch */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-slate-200">Переводной дурак</span>
                <span className="text-xs text-slate-400">
                  Разрешить защитнику переводить стрелки картой того же достоинства
                </span>
              </div>
              <Switch
                checked={localMode === 'perevodnoy'}
                onCheckedChange={checked => setLocalMode(checked ? 'perevodnoy' : 'podkidnoy')}
              />
            </div>

            {/* Animation Speed & Live Test */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FastForward className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-sm text-slate-200">Скорость анимации полета карт</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestAnimation}
                  className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20 px-2.5 font-bold flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>Тест броска</span>
                </Button>
              </div>

              {/* Speed Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '0.25', label: '0.25x (Slow-Mo)', desc: 'Замедленно' },
                  { id: '0.5', label: '0.5x', desc: 'Плавная' },
                  { id: '1', label: '1x (Норма)', desc: 'Стандарт' },
                  { id: '1.5', label: '1.5x (Быстро)', desc: 'Динамично' }
                ].map(spd => (
                  <button
                    key={spd.id}
                    type="button"
                    onClick={() => handleAnimSpeedChange(spd.id)}
                    className={cn(
                      'flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer',
                      localAnimSpeed === spd.id
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    )}
                  >
                    <span className="text-[11px] font-bold">{spd.label}</span>
                    <span className="text-[9px] opacity-75">{spd.desc}</span>
                  </button>
                ))}
              </div>

              {/* Test Animation Arena */}
              {isTestingAnim && (
                <div className="relative w-full h-24 rounded-xl bg-[#0e4c3a]/70 border border-emerald-500/30 overflow-hidden flex items-center justify-center shadow-inner mt-2">
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-emerald-300/40 font-mono pointer-events-none">
                    Траектория полета карты из руки на сукно стола
                  </div>
                  <div className="relative animate-card-throw-human">
                    <PlayingCard
                      card={{ id: 'test-card', suit: 'hearts', rank: 'A', value: 14 }}
                      isTrump
                      size="md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Players List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-400 uppercase tracking-wider">
                  Игроки за столом ({localPlayers.length}/4)
                </span>
                {localPlayers.length < 4 && (
                  <Button variant="outline" size="sm" onClick={handleAddPlayer} className="h-7 text-xs border-slate-700">
                    + Добавить игрока
                  </Button>
                )}
              </div>

              {localPlayers.map((player, idx) => {
                const isLlm = player.type === 'llm';
                const provider = player.provider || 'lmstudio';
                const availableModels = provider === 'openrouter' ? openRouterModels : lmStudioModels;

                return (
                  <div
                    key={player.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">
                        Слот #{idx + 1} {idx === 0 ? '(Ты / Основной слот)' : ''}
                      </span>
                      {idx >= 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePlayer(idx)}
                          className="h-6 text-rose-400 hover:text-rose-300 px-2 text-[11px]"
                        >
                          Удалить
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Name */}
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Имя игрока</label>
                        <Input
                          value={player.name}
                          onChange={e => handlePlayerChange(idx, { name: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Тип управления</label>
                        <select
                          value={player.type}
                          onChange={e => handlePlayerChange(idx, { type: e.target.value as PlayerType })}
                          className="h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200"
                        >
                          <option value="human">Человек (Кожаный мешок)</option>
                          <option value="llm">Нейросеть (LLM Бот)</option>
                        </select>
                      </div>

                      {/* Style / Character */}
                      {isLlm && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Персонаж</label>
                          <select
                            value={player.style}
                            onChange={e => handlePlayerChange(idx, { style: e.target.value as CharacterStyle })}
                            className="h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200"
                          >
                            {Object.values(CHARACTER_PROFILES).map(cp => (
                              <option key={cp.id} value={cp.id}>
                                {cp.avatar} {cp.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {isLlm && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Провайдер</label>
                          <select
                            value={provider}
                            onChange={e => handlePlayerChange(idx, { provider: e.target.value as LlmProvider })}
                            className="h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200"
                          >
                            <option value="lmstudio">LM Studio (Локально)</option>
                            <option value="openrouter">OpenRouter (Облако)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Модель нейросети</label>
                          <ModelCombobox
                            value={player.modelId || 'mock-ai'}
                            onChange={modelId => handlePlayerChange(idx, { modelId })}
                            provider={provider}
                            models={availableModels}
                            isLoading={provider === 'openrouter' ? isLoadingOpenRouter : isLoadingLm}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab 2: Providers & Model Fetching */}
          <TabsContent value="models" className="space-y-4 py-2">
            {/* LM Studio Section */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Cpu className="w-4 h-4 text-emerald-400" /> LM Studio (Локальный сервер)
                </div>
                {lmStatus === 'success' && (
                  <Badge variant="success" className="text-[10px]">
                    🟢 Доступно ({lmStudioModels.length} моделей)
                  </Badge>
                )}
                {lmStatus === 'error' && (
                  <Badge variant="destructive" className="text-[10px]">
                    🔴 Сервер недоступен
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Запустите локальный сервер в приложении LM Studio (обычно на порту 1234) и загрузите модель в память.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-300 block mb-1">Base URL</label>
                  <Input
                    value={localLmUrl}
                    onChange={e => setLocalLmUrl(e.target.value)}
                    placeholder="http://localhost:1234/v1"
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLmModels}
                  disabled={isLoadingLm}
                  className="mt-5 h-9 text-xs border-slate-700 shrink-0"
                >
                  {isLoadingLm ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1 text-emerald-400" />}
                  Запросить модели
                </Button>
              </div>

              {lmErrorMsg && (
                <p className="text-[11px] text-rose-400 font-medium">{lmErrorMsg}</p>
              )}
            </div>

            {/* OpenRouter Section */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Globe className="w-4 h-4 text-amber-400" /> OpenRouter API (Облачные модели)
                </div>
                {openRouterStatus === 'success' && (
                  <Badge variant="trump" className="text-[10px]">
                    🟢 Готово ({openRouterModels.length} моделей)
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Позволяет подключать сотни передовых моделей: DeepSeek-R1, Claude 3.7 Sonnet Thinking, GPT-4o, Gemini 2.0 Flash.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-slate-300 block mb-1">API Key (OpenRouter)</label>
                  <Input
                    type="password"
                    value={localApiKey}
                    onChange={e => setLocalApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchOrModels}
                  disabled={isLoadingOpenRouter}
                  className="mt-5 h-9 text-xs border-slate-700 shrink-0"
                >
                  {isLoadingOpenRouter ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1 text-amber-400" />}
                  Обновить каталог
                </Button>
              </div>

              {orErrorMsg && (
                <p className="text-[11px] text-rose-400 font-medium">{orErrorMsg}</p>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Character Profiles */}
          <TabsContent value="characters" className="space-y-3 py-2">
            {Object.values(CHARACTER_PROFILES).map(cp => (
              <div
                key={cp.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3"
              >
                <span className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-900 border border-slate-700">
                  {cp.avatar}
                </span>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-100">{cp.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => speechService.testVoice(cp.id as CharacterStyle)}
                      className="h-6 text-[11px] border-slate-700 bg-slate-900 text-amber-300 flex items-center gap-1 hover:bg-slate-800 shrink-0"
                      title="Прослушать голос персонажа через браузерный синтезатор"
                    >
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      Тест голоса
                    </Button>
                  </div>
                  <span className="text-xs text-amber-400/90 font-medium">{cp.title}</span>
                  <span className="text-xs text-slate-400 mt-1">{cp.description}</span>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Tab 4: Currency & Cost Settings */}
          <TabsContent value="currency" className="space-y-4 py-2">
            {/* Currency Selector */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    Отображаемая валюта
                  </span>
                  <span className="text-xs text-slate-400">
                    В этой валюте будет рассчитываться стоимость токенов OpenRouter
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {(['RUB', 'USD', 'EUR', 'KZT', 'CNY'] as CurrencyCode[]).map(cCode => (
                  <button
                    key={cCode}
                    type="button"
                    onClick={() => handleCurrencySelect(cCode)}
                    className={cn(
                      'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all',
                      selectedCurrency === cCode
                        ? 'border-amber-400 bg-amber-500/15 text-amber-300 shadow-md ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    )}
                  >
                    <span className="text-base">{currencyService.getCurrencySymbol(cCode)}</span>
                    <span className="text-[11px] mt-0.5">{cCode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Exchange Rate Info & Public API fetch */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                  Курс конвертации (Онлайн API)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdateRatesOnline}
                  disabled={isUpdatingRates}
                  className="h-7 text-xs border-slate-700 bg-slate-900 flex items-center gap-1.5"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5 text-amber-400', isUpdatingRates && 'animate-spin')} />
                  <span>{isUpdatingRates ? 'Запрос курса...' : 'Обновить курс онлайн'}</span>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <span className="text-slate-300">
                  Текущий курс к доллару США:
                </span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  1 USD = {currentRate} {currencyService.getCurrencySymbol(selectedCurrency)}
                </span>
              </div>

              {rateUpdateMsg && (
                <p className="text-[11px] text-emerald-400 font-medium">{rateUpdateMsg}</p>
              )}
            </div>

            {/* Session Costs & Reset */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                    Расходы за текущий сеанс
                  </span>
                  <span className="text-xs text-slate-400">
                    Сумма всех расходов на LLM модели в рамках сеанса
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-base text-emerald-400">
                    {currencyService.formatCost(sessionTotalCostUsd || 0, selectedCurrency)}
                  </span>
                  {selectedCurrency !== 'USD' && (
                    <span className="block text-[10px] font-mono text-slate-500">
                      (${(sessionTotalCostUsd || 0).toFixed(5)} USD)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onResetSessionCosts?.()}
                  className="h-8 text-xs flex items-center gap-1.5 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Сбросить счётчики расходов сеанса
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-slate-700">
            Отмена
          </Button>
          <Button variant="default" onClick={handleSave} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
            Сохранить настройки
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
