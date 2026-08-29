import React, { useState, useEffect } from 'react';
import {
  CharacterProfile,
  CharacterStyle,
  DurakMode,
  LlmProvider,
  PlayerConfig,
  PlayerType
} from '../../types/durak';
import { characterService } from '../../services/characterService';
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
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ModelCombobox } from '../ModelSelector/ModelCombobox';
import {
  DEFAULT_MODEL_PRICING,
  DEFAULT_POLLINATIONS_API_KEY,
  LlmModel,
  OpenRouterModel,
  POPULAR_CUSTOM_PRESETS,
  POPULAR_OPENROUTER_MODELS,
  POPULAR_POLLINATIONS_MODELS,
  llmService
} from '../../services/llmClient';
import { currencyService, CurrencyCode } from '../../services/currencyService';
import { speechService } from '../../services/speechService';
import { PlayingCard } from '../Cards/PlayingCard';
import { cn } from '../../lib/utils';
import { Coins, Cpu, Edit3, FastForward, Gauge, Globe, Loader2, Play, Plus, RefreshCw, RotateCcw, Save, Server, Sparkles, Trash2, User, Users, Volume2, Wand2, X, Zap } from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DurakMode;
  onSaveMode: (mode: DurakMode) => void;
  playersConfig: PlayerConfig[];
  onSavePlayers: (players: PlayerConfig[]) => void;
  pollinationsApiKey?: string;
  onSavePollinationsKey?: (key: string) => void;
  lmStudioBaseUrl: string;
  onSaveLmStudioUrl: (url: string) => void;
  openRouterApiKey: string;
  onSaveOpenRouterKey: (key: string) => void;
  customBaseUrl?: string;
  onSaveCustomBaseUrl?: (url: string) => void;
  customApiKey?: string;
  onSaveCustomApiKey?: (key: string) => void;
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
  pollinationsApiKey = DEFAULT_POLLINATIONS_API_KEY,
  onSavePollinationsKey,
  lmStudioBaseUrl,
  onSaveLmStudioUrl,
  openRouterApiKey,
  onSaveOpenRouterKey,
  customBaseUrl = 'https://gen.pollinations.ai/v1',
  onSaveCustomBaseUrl,
  customApiKey = DEFAULT_POLLINATIONS_API_KEY,
  onSaveCustomApiKey,
  currencyCode = 'RUB',
  onSaveCurrency,
  onResetSessionCosts,
  sessionTotalCostUsd = 0
}) => {
  const [localMode, setLocalMode] = useState<DurakMode>(mode);
  const [localPlayers, setLocalPlayers] = useState<PlayerConfig[]>(playersConfig);
  const [localPollinationsKey, setLocalPollinationsKey] = useState(pollinationsApiKey);
  const [localLmUrl, setLocalLmUrl] = useState(lmStudioBaseUrl);
  const [localApiKey, setLocalApiKey] = useState(openRouterApiKey);
  const [localCustomUrl, setLocalCustomUrl] = useState(customBaseUrl);
  const [localCustomKey, setLocalCustomKey] = useState(customApiKey);
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

  // Dynamic Characters State
  const [charactersMap, setCharactersMap] = useState<Record<string, CharacterProfile>>(() => characterService.getCharacters());
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null);
  const [isNewCharacter, setIsNewCharacter] = useState(false);

  const [isGeneratingAiCharacter, setIsGeneratingAiCharacter] = useState(false);

  // AI Generator provider & model selection
  const [aiGenProvider, setAiGenProvider] = useState<LlmProvider>(() => {
    try {
      return (localStorage.getItem('durak_ai_gen_provider') as LlmProvider) || 'pollinations';
    } catch {
      return 'pollinations';
    }
  });
  const [aiGenModelId, setAiGenModelId] = useState<string>(() => {
    try {
      return localStorage.getItem('durak_ai_gen_model') || 'openai';
    } catch {
      return 'openai';
    }
  });

  const handleSetAiGenProvider = (p: LlmProvider) => {
    setAiGenProvider(p);
    try {
      localStorage.setItem('durak_ai_gen_provider', p);
    } catch {}
  };

  const handleSetAiGenModelId = (m: string) => {
    setAiGenModelId(m);
    try {
      localStorage.setItem('durak_ai_gen_model', m);
    } catch {}
  };

  const handleOpenEditCharacter = (char: CharacterProfile, isNew = false) => {
    setEditingCharacter({ ...char });
    setIsNewCharacter(isNew);
  };

  const handleGenerateWithAi = async () => {
    if (!editingCharacter) return;
    setIsGeneratingAiCharacter(true);

    try {
      const generated = await characterService.generateCharacterWithAi({
        currentName: editingCharacter.name === 'Новый игрок' ? '' : editingCharacter.name,
        currentAvatar: editingCharacter.avatar === '😎' ? '' : editingCharacter.avatar,
        currentTitle: editingCharacter.title === 'Карточный мастер' ? '' : editingCharacter.title,
        currentDescription: editingCharacter.description,
        currentPrompt: editingCharacter.promptFlavor,
        pollinationsApiKey: localPollinationsKey,
        lmStudioBaseUrl: localLmUrl,
        openRouterApiKey: localApiKey,
        customBaseUrl: localCustomUrl,
        customApiKey: localCustomKey,
        provider: aiGenProvider,
        modelId: aiGenModelId
      });

      setEditingCharacter({
        ...editingCharacter,
        name: generated.name,
        avatar: generated.avatar,
        title: generated.title,
        description: generated.description,
        temperature: generated.temperature,
        promptFlavor: generated.promptFlavor
      });
    } catch (e: any) {
      console.error('[SettingsModal] AI Generation failed:', e);
      alert(`⚠️ Не удалось сгенерировать персонажа через LLM:\n${e?.message || e}\n\nУбедитесь, что выбранный сервер (Pollinations / LM Studio / OpenRouter / Custom OpenAI) доступен и настроен.`);
    } finally {
      setIsGeneratingAiCharacter(false);
    }
  };

  const handleCreateNewCharacter = () => {
    const newId = `custom_${Date.now()}`;
    const newChar: CharacterProfile = {
      id: newId,
      name: '',
      avatar: '😎',
      title: '',
      description: '',
      temperature: 0.7,
      promptFlavor: '',
      isCustom: true
    };
    handleOpenEditCharacter(newChar, true);
  };

  const handleSaveEditedCharacter = () => {
    if (!editingCharacter || !editingCharacter.name.trim()) return;
    const finalId = editingCharacter.id.trim() || `custom_${Date.now()}`;
    const toSave: CharacterProfile = {
      ...editingCharacter,
      id: finalId,
      isCustom: true
    };
    characterService.saveCharacter(toSave);
    const updatedMap = { ...characterService.getCharacters() };
    setCharactersMap(updatedMap);

    // Auto-update players if their character profile changed
    setLocalPlayers(prev => prev.map(p => {
      if (p.style === toSave.id) {
        return {
          ...p,
          name: p.type === 'llm' ? toSave.name : p.name
        };
      }
      return p;
    }));

    setEditingCharacter(null);
    setIsNewCharacter(false);
  };

  const handleDeleteCharacter = (charId: string) => {
    if (Object.keys(charactersMap).length <= 1) return;
    characterService.deleteCharacter(charId);
    const updatedMap = { ...characterService.getCharacters() };
    setCharactersMap(updatedMap);

    // Fallback to nikolaich if player had this deleted character
    setLocalPlayers(prev => prev.map(p => {
      if (p.style === charId) {
        return {
          ...p,
          style: 'nikolaich',
          name: p.type === 'llm' ? updatedMap.nikolaich?.name || 'Николаич (Батя Двора)' : p.name
        };
      }
      return p;
    }));
  };

  const handleResetCharacters = () => {
    const fresh = characterService.resetToDefaults();
    setCharactersMap({ ...fresh });
  };

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
  const [pollinationsModels, setPollinationsModels] = useState<{ id: string; name?: string }[]>(POPULAR_POLLINATIONS_MODELS);
  const [lmStudioModels, setLmStudioModels] = useState<{ id: string; name?: string }[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>(POPULAR_OPENROUTER_MODELS);
  const [customModels, setCustomModels] = useState<{ id: string; name?: string }[]>([]);
  const [isLoadingPollinations, setIsLoadingPollinations] = useState(false);
  const [isLoadingLm, setIsLoadingLm] = useState(false);
  const [isLoadingOpenRouter, setIsLoadingOpenRouter] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [pollinationsStatus, setPollinationsStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lmStatus, setLmStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [openRouterStatus, setOpenRouterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [customStatus, setCustomStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pollinationsErrorMsg, setPollinationsErrorMsg] = useState('');
  const [lmErrorMsg, setLmErrorMsg] = useState('');
  const [orErrorMsg, setOrErrorMsg] = useState('');
  const [customErrorMsg, setCustomErrorMsg] = useState('');

  // Fetch Pollinations AI Models
  const fetchPollinationsList = async () => {
    setIsLoadingPollinations(true);
    setPollinationsErrorMsg('');
    try {
      const models = await llmService.fetchPollinationsModels(localPollinationsKey);
      setPollinationsModels(models);
      setPollinationsStatus('success');
    } catch (err: any) {
      setPollinationsStatus('error');
      setPollinationsErrorMsg(err?.message || 'Ошибка загрузки моделей Pollinations');
    } finally {
      setIsLoadingPollinations(false);
    }
  };

  // Fetch LM Studio Models
  const fetchLmModels = async () => {
    setIsLoadingLm(true);
    setLmErrorMsg('');
    try {
      const models = await llmService.fetchModels(localLmUrl);
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
      const models = await llmService.fetchOpenRouterModels(localApiKey);
      setOpenRouterModels(models);
      setOpenRouterStatus('success');
    } catch (err: any) {
      setOpenRouterStatus('error');
      setOrErrorMsg(err?.message || 'Ошибка загрузки OpenRouter моделей');
    } finally {
      setIsLoadingOpenRouter(false);
    }
  };

  // Fetch Custom OpenAI Provider Models
  const fetchCustomModelsList = async () => {
    if (!localCustomUrl || !localCustomUrl.trim()) return;
    setIsLoadingCustom(true);
    setCustomErrorMsg('');
    try {
      const models = await llmService.fetchCustomModels(localCustomUrl, localCustomKey);
      setCustomModels(models);
      setCustomStatus(models.length > 0 ? 'success' : 'error');
      if (models.length === 0) {
        setCustomErrorMsg('Сервер ответил, но список моделей пуст.');
      }
    } catch (err: any) {
      setCustomStatus('error');
      setCustomErrorMsg(err?.message || 'Не удалось подключиться к OpenAI-серверу');
    } finally {
      setIsLoadingCustom(false);
    }
  };

  // Initial fetch on open
  useEffect(() => {
    if (isOpen) {
      setLocalMode(mode);
      setLocalPlayers(playersConfig);
      setLocalPollinationsKey(pollinationsApiKey);
      setLocalLmUrl(lmStudioBaseUrl);
      setLocalApiKey(openRouterApiKey);
      setLocalCustomUrl(customBaseUrl);
      setLocalCustomKey(customApiKey);
      fetchPollinationsList();
      fetchLmModels();
      fetchOrModels();
      fetchCustomModelsList();
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
      if (updates.provider === 'pollinations') {
        next.modelId = 'openai';
      } else if (updates.provider === 'lmstudio') {
        next.modelId = 'default';
      } else if (updates.provider === 'openrouter') {
        next.modelId = 'deepseek/deepseek-r1';
      }
    }

    updated[index] = next;
    setLocalPlayers(updated);
  };

  const handleAddPlayer = () => {
    if (localPlayers.length >= 6) return;
    const newIdx = localPlayers.length + 1;
    const style: CharacterStyle = newIdx % 2 === 0 ? 'shuler' : 'professor';
    const profile = CHARACTER_PROFILES[style] || { name: `Бот ${newIdx}` };

    setLocalPlayers([
      ...localPlayers,
      {
        id: `player_${newIdx}`,
        name: profile.name,
        type: 'llm',
        provider: 'pollinations',
        modelId: 'openai',
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
    onSavePollinationsKey?.(localPollinationsKey);
    onSaveLmStudioUrl(localLmUrl);
    onSaveOpenRouterKey(localApiKey);
    onSaveCustomBaseUrl?.(localCustomUrl);
    onSaveCustomApiKey?.(localCustomKey);

    // Persist in localStorage
    try {
      localStorage.setItem('durak_mode', localMode);
      localStorage.setItem('durak_pollinations_key', localPollinationsKey);
      localStorage.setItem('durak_lm_url', localLmUrl);
      localStorage.setItem('durak_or_key', localApiKey);
      localStorage.setItem('durak_custom_base_url', localCustomUrl);
      localStorage.setItem('durak_custom_api_key', localCustomKey);
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
                const provider = player.provider || 'pollinations';
                const availableModels =
                  provider === 'pollinations'
                    ? pollinationsModels
                    : provider === 'openrouter'
                    ? openRouterModels
                    : provider === 'custom'
                    ? customModels
                    : lmStudioModels;
                const isLoadingModels =
                  provider === 'pollinations'
                    ? isLoadingPollinations
                    : provider === 'openrouter'
                    ? isLoadingOpenRouter
                    : provider === 'custom'
                    ? isLoadingCustom
                    : isLoadingLm;

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
                            {(Object.values(charactersMap) as CharacterProfile[]).map(cp => (
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
                            <option value="pollinations">🌸 Pollinations AI (По умолчанию)</option>
                            <option value="lmstudio">💻 LM Studio (Локально)</option>
                            <option value="openrouter">🌐 OpenRouter (Облако)</option>
                            <option value="custom">⚙️ Custom OpenAI API (Ollama/DeepSeek/Groq)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Модель нейросети</label>
                          <ModelCombobox
                            value={player.modelId || 'mock-ai'}
                            onChange={modelId => handlePlayerChange(idx, { modelId })}
                            provider={provider}
                            models={availableModels}
                            isLoading={isLoadingModels}
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
            {/* Pollinations AI Section (Default) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-pink-950/40 to-slate-950/80 border border-pink-900/50 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-pink-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" /> 🌸 Pollinations AI (Провайдер по умолчанию)
                </div>
                {pollinationsStatus === 'success' && (
                  <Badge variant="outline" className="text-[10px] bg-pink-950/80 border-pink-500/40 text-pink-300">
                    🟢 Готово ({pollinationsModels.length} моделей)
                  </Badge>
                )}
                {pollinationsStatus === 'error' && (
                  <Badge variant="destructive" className="text-[10px]">
                    🔴 Ошибка загрузки
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Бесплатный облачный доступ к 180+ передовым моделям: OpenAI GPT-5/GPT-4o, DeepSeek Pro/R1, Claude 3.7 Hybrid, Gemini 2.0 Flash, Llama 3.3. Ключ уже активирован и готов к игре!
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-pink-200 block mb-1">API Key (Pollinations)</label>
                  <Input
                    type="password"
                    value={localPollinationsKey}
                    onChange={e => setLocalPollinationsKey(e.target.value)}
                    placeholder="sk_V7C0VjDS2bfJmP33NgZDBMHEU7bp4nBe"
                    className="h-9 text-xs font-mono border-pink-800/60 bg-slate-900/90 text-pink-200"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPollinationsList}
                  disabled={isLoadingPollinations}
                  className="mt-5 h-9 text-xs border-pink-700/60 bg-pink-950/40 hover:bg-pink-900/50 text-pink-200 shrink-0"
                >
                  {isLoadingPollinations ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1 text-pink-400" />}
                  Обновить каталог
                </Button>
              </div>

              {pollinationsErrorMsg && (
                <p className="text-[11px] text-rose-400 font-medium">{pollinationsErrorMsg}</p>
              )}
            </div>
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
                  Обновить модели
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
                  <Globe className="w-4 h-4 text-sky-400" /> OpenRouter (Облачные модели)
                </div>
                {openRouterStatus === 'success' && (
                  <Badge variant="success" className="text-[10px]">
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

            {/* Custom OpenAI-compatible Provider Section */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Server className="w-4 h-4 text-purple-400" /> OpenAI-совместимый API (Свой провайдер)
                </div>
                {customStatus === 'success' && (
                  <Badge variant="success" className="text-[10px]">
                    🟢 Подключено ({customModels.length} моделей)
                  </Badge>
                )}
                {customStatus === 'error' && (
                  <Badge variant="destructive" className="text-[10px]">
                    🔴 Ошибка связи
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-400">
                Подключайте Ollama, официальный DeepSeek API, Groq Cloud, Together AI, vLLM, Jan или любой свой прокси-сервер.
              </p>

              {/* Quick Presets */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-medium">Быстрые пресеты:</label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CUSTOM_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        if (preset.baseUrl) setLocalCustomUrl(preset.baseUrl);
                      }}
                      className={cn(
                        'px-2 py-1 rounded-md text-[11px] font-semibold border transition-all',
                        localCustomUrl === preset.baseUrl
                          ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      )}
                      title={`${preset.description} ${preset.needsKey ? '(Нужен API-ключ)' : ''}`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Base URL (эндпоинт /v1)</label>
                  <Input
                    value={localCustomUrl}
                    onChange={e => setLocalCustomUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">API Key (если требуется)</label>
                  <Input
                    type="password"
                    value={localCustomKey}
                    onChange={e => setLocalCustomKey(e.target.value)}
                    placeholder="sk-... (для DeepSeek/Groq) или пусто"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchCustomModelsList}
                  disabled={isLoadingCustom}
                  className="h-8 text-xs border-slate-700 bg-slate-900"
                >
                  {isLoadingCustom ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1 text-purple-400" />}
                  Проверить и обновить модели
                </Button>

                {customModels.length > 0 && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Загружено моделей: <b className="text-purple-300">{customModels.length}</b>
                  </span>
                )}
              </div>

              {customErrorMsg && (
                <p className="text-[11px] text-rose-400 font-medium">{customErrorMsg}</p>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Character Profiles (Create / Edit / Delete) */}
          <TabsContent value="characters" className="space-y-3 py-2">
            {/* Header with Add & Reset Actions */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-200">
                  Управление персонажами ({Object.keys(charactersMap).length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Создавайте своих ботов, настраивайте характер и стиль трэштока
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetCharacters}
                  className="h-7 text-xs border-slate-700 text-slate-400 hover:text-slate-200 px-2"
                  title="Восстановить изначальных персонажей"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Сброс</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const newId = `custom_${Date.now()}`;
                    const newChar: CharacterProfile = {
                      id: newId,
                      name: '',
                      avatar: '🎭',
                      title: '',
                      description: '',
                      temperature: 0.7,
                      promptFlavor: '',
                      isCustom: true
                    };
                    handleOpenEditCharacter(newChar, true);
                    setTimeout(() => handleGenerateWithAi(), 50);
                  }}
                  className="h-7 text-xs border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold px-2 flex items-center gap-1 shadow-sm"
                  title="Сгенерировать случайного колоритного персонажа через ИИ"
                >
                  <Wand2 className="w-3 h-3 text-amber-400" />
                  <span>✨ ИИ Герой</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreateNewCharacter}
                  className="h-7 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>+ Создать</span>
                </Button>
              </div>
            </div>

            {/* Character Edit Form Modal / Panel */}
            {editingCharacter && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/50 shadow-xl space-y-3 animate-in fade-in-0 zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1 rounded-lg bg-slate-900 border border-slate-700 shadow-inner">
                      {editingCharacter.avatar || '👤'}
                    </span>
                    <span className="font-bold text-sm text-amber-400">
                      {isNewCharacter ? 'Создание нового персонажа' : `Редактирование: ${editingCharacter.name || 'Без имени'}`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingCharacter(null)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* AI Generator Model & Provider Configuration Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">ИИ Генератор:</span>
                    <select
                      value={aiGenProvider}
                      onChange={e => handleSetAiGenProvider(e.target.value as LlmProvider)}
                      className="h-7 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs text-amber-300 font-semibold shrink-0"
                    >
                      <option value="pollinations">🌸 Pollinations AI (По умолчанию)</option>
                      <option value="lmstudio">💻 LM Studio</option>
                      <option value="openrouter">🌐 OpenRouter</option>
                      <option value="custom">⚙️ Custom OpenAI</option>
                    </select>

                    <div className="w-44 sm:w-60 min-w-[140px]">
                      <ModelCombobox
                        value={aiGenModelId}
                        onChange={handleSetAiGenModelId}
                        provider={aiGenProvider}
                        models={
                          aiGenProvider === 'pollinations'
                            ? pollinationsModels
                            : aiGenProvider === 'openrouter'
                            ? openRouterModels
                            : aiGenProvider === 'custom'
                            ? customModels
                            : lmStudioModels
                        }
                        isLoading={
                          aiGenProvider === 'pollinations'
                            ? isLoadingPollinations
                            : aiGenProvider === 'openrouter'
                            ? isLoadingOpenRouter
                            : aiGenProvider === 'custom'
                            ? isLoadingCustom
                            : isLoadingLm
                        }
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateWithAi}
                    disabled={isGeneratingAiCharacter}
                    className="h-7 text-xs bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-sky-500/20 hover:from-amber-500/30 hover:via-purple-500/30 hover:to-sky-500/30 border-amber-500/50 text-amber-300 font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 ml-auto"
                    title="Запустить генерацию через выбранную модель"
                  >
                    {isGeneratingAiCharacter ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    )}
                    <span>{isGeneratingAiCharacter ? 'ИИ думает...' : '✨ Волшебная палочка (ИИ)'}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {/* Avatar Picker */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Эмодзи аватар</label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={editingCharacter.avatar}
                        onChange={e => setEditingCharacter({ ...editingCharacter, avatar: e.target.value })}
                        className="h-8 text-center text-base w-14 font-emoji"
                        maxLength={4}
                      />
                      <div className="flex items-center gap-0.5 overflow-x-auto p-1 bg-slate-900 rounded-md border border-slate-800 scrollbar-none flex-1">
                        {['🍺', '🃏', '🎓', '🧢', '👵', '🐗', '🤖', '🤠', '🧙', '👑', '🐱', '🚀'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setEditingCharacter({ ...editingCharacter, avatar: emoji })}
                            className="w-6 h-6 flex items-center justify-center text-xs hover:bg-slate-800 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Имя персонажа</label>
                    <Input
                      value={editingCharacter.name}
                      onChange={e => setEditingCharacter({ ...editingCharacter, name: e.target.value })}
                      placeholder="Например: Дядя Миша"
                      className="h-8 text-xs font-semibold"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Титул / Роль</label>
                    <Input
                      value={editingCharacter.title}
                      onChange={e => setEditingCharacter({ ...editingCharacter, title: e.target.value })}
                      placeholder="Например: Смотрящий за двором"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Краткое описание</label>
                  <Input
                    value={editingCharacter.description}
                    onChange={e => setEditingCharacter({ ...editingCharacter, description: e.target.value })}
                    placeholder="Пара слов о персонаже..."
                    className="h-8 text-xs"
                  />
                </div>

                {/* Temperature Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-300 font-medium">Креативность (Temperature): {editingCharacter.temperature}</span>
                    <span className="text-slate-500 text-[10px]">0.1 = точный расчет | 0.8+ = кураж и трэшток</span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={editingCharacter.temperature}
                    onChange={e => setEditingCharacter({ ...editingCharacter, temperature: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Prompt Flavor (System Prompt instructions) */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Инструкции характера и стиля игры (Промпт для LLM)
                  </label>
                  <Textarea
                    value={editingCharacter.promptFlavor}
                    onChange={e => setEditingCharacter({ ...editingCharacter, promptFlavor: e.target.value })}
                    placeholder="Твой стиль — ... Опиши характер, любимые реплики, стратегию..."
                    className="h-28 text-xs font-mono resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCharacter(null)}
                    className="h-8 text-xs border-slate-700"
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveEditedCharacter}
                    className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Сохранить персонажа
                  </Button>
                </div>
              </div>
            )}

            {/* List of Characters */}
            <div className="space-y-2.5">
              {(Object.values(charactersMap) as CharacterProfile[]).map(cp => (
                <div
                  key={cp.id}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-colors"
                >
                  <span className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-inner">
                    {cp.avatar}
                  </span>
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-sm text-slate-100 truncate">{cp.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-300 font-mono">
                          T: {cp.temperature}
                        </Badge>
                        {cp.isCustom && (
                          <Badge variant="default" className="text-[8px] px-1 py-0 bg-emerald-600/80 text-white font-bold">
                            Свой
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditCharacter(cp)}
                          className="h-6 px-2 text-[10px] border-slate-700 bg-slate-900 text-slate-300 hover:text-amber-300 flex items-center gap-0.5"
                          title="Редактировать персонажа"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Изменить</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => speechService.testVoice(cp.id as CharacterStyle)}
                          className="h-6 px-2 text-[10px] border-slate-700 bg-slate-900 text-amber-300 flex items-center gap-0.5 hover:bg-slate-800"
                          title="Прослушать голос"
                        >
                          <Volume2 className="w-2.5 h-2.5 text-amber-400" />
                          <span className="hidden sm:inline">Голос</span>
                        </Button>

                        {Object.keys(charactersMap).length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Удалить персонажа «${cp.name}»?`)) {
                                handleDeleteCharacter(cp.id);
                              }
                            }}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-rose-400"
                            title="Удалить персонажа"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-amber-400/90 font-medium truncate mt-0.5">{cp.title}</span>
                    <span className="text-xs text-slate-400 mt-1 line-clamp-2">{cp.description}</span>
                  </div>
                </div>
              ))}
            </div>
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
