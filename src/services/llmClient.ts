import type { LlmProvider } from '../types/durak';

export interface TokenMetrics {
  totalTokens: number;
  tokensPerSecond: number;
  durationMs: number;
  costUsd?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface StreamCallbacks {
  onThinkingChunk: (chunk: string, fullThinking: string) => void;
  onContentChunk: (chunk: string, fullContent: string) => void;
  onThinkingFinished: () => void;
  onStatusUpdate: (statusText: string) => void;
  onTokenMetrics?: (metrics: TokenMetrics) => void;
}

export interface StreamMoveResult {
  fullThinking: string;
  fullContent: string;
  rawResponse: string;
  tokenCount?: number;
  tokensPerSecond?: number;
  durationMs?: number;
  costUsd?: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface StreamMoveOptions {
  provider?: LlmProvider;
  baseUrl?: string;
  apiKey?: string;
  modelId: string;
  modelPricing?: { prompt?: string | number; completion?: string | number };
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  callbacks: StreamCallbacks;
  abortSignal?: AbortSignal;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

export interface LlmModel {
  id: string;
  name?: string;
  object?: string;
}

// Backward-compatible alias
export type LMStudioModel = LlmModel;

export const DEFAULT_MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'deepseek/deepseek-v4-flash-latest': { prompt: 0.0000001, completion: 0.0000002 },
  'deepseek-v4-flash-latest': { prompt: 0.0000001, completion: 0.0000002 },
  'deepseek/deepseek-r1': { prompt: 0.00000055, completion: 0.00000219 },
  'deepseek/deepseek-chat': { prompt: 0.00000014, completion: 0.00000028 },
  'anthropic/claude-3.7-sonnet': { prompt: 0.000003, completion: 0.000015 },
  'anthropic/claude-3.5-sonnet': { prompt: 0.000003, completion: 0.000015 },
  'openai/gpt-4o': { prompt: 0.0000025, completion: 0.00001 },
  'openai/gpt-4o-mini': { prompt: 0.00000015, completion: 0.0000006 },
  'google/gemini-2.0-flash-001': { prompt: 0.0000001, completion: 0.0000004 },
  'google/gemini-2.0-pro-exp-02-05:free': { prompt: 0, completion: 0 },
  'meta-llama/llama-3.3-70b-instruct': { prompt: 0.00000012, completion: 0.0000003 },
  'qwen/qwq-32b': { prompt: 0.00000015, completion: 0.0000006 },
  'qwen/qwen-2.5-72b-instruct': { prompt: 0.00000035, completion: 0.0000004 },
  'mistralai/mistral-large-2411': { prompt: 0.000002, completion: 0.000006 },
  'meta-llama/llama-3.2-3b-instruct:free': { prompt: 0, completion: 0 }
};

export const POPULAR_OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: 'deepseek/deepseek-v4-flash-latest', name: 'DeepSeek V4 Flash (Latest)', description: 'Новейшая сверхбыстрая модель DeepSeek V4 Flash', pricing: { prompt: '0.0000001', completion: '0.0000002' } },
  { id: 'deepseek-v4-flash-latest', name: 'DeepSeek V4 Flash Latest', description: 'Сверхбыстрая оптимизированная модель DeepSeek V4 Flash', pricing: { prompt: '0.0000001', completion: '0.0000002' } },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Deep Thinking)', description: 'Топовая reasoning-модель с глубоким расчетом ходов', pricing: { prompt: '0.00000055', completion: '0.00000219' } },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Chat)', description: 'Быстрая, мощная и экономичная модель', pricing: { prompt: '0.00000014', completion: '0.00000028' } },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', description: 'Флагман Anthropic с гибридным мышлением', pricing: { prompt: '0.000003', completion: '0.000015' } },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Выдающийся интеллект и гроссмейстерская точность', pricing: { prompt: '0.000003', completion: '0.000015' } },
  { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI)', description: 'Флагманская мультимодальная модель OpenAI', pricing: { prompt: '0.0000025', completion: '0.00001' } },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Очень быстрая и дешевая модель для блица', pricing: { prompt: '0.00000015', completion: '0.0000006' } },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Сверхбыстрая модель нового поколения от Google', pricing: { prompt: '0.0000001', completion: '0.0000004' } },
  { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Gemini 2.0 Pro (Free)', description: 'Экспериментальная мощная модель (бесплатно)', pricing: { prompt: '0', completion: '0' } },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', description: 'Открытая модель мирового уровня', pricing: { prompt: '0.00000012', completion: '0.0000003' } },
  { id: 'qwen/qwq-32b', name: 'QwQ 32B (Qwen Reasoning)', description: 'Специализированная модель для сложного анализа', pricing: { prompt: '0.00000015', completion: '0.0000006' } },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct', description: 'Мощнейшая модель от Alibaba Cloud', pricing: { prompt: '0.00000035', completion: '0.0000004' } },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2411', description: 'Флагманская европейская модель Mistral AI', pricing: { prompt: '0.000002', completion: '0.000006' } },
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', description: 'Легкая бесплатная модель для тестов', pricing: { prompt: '0', completion: '0' } }
];

export const DEFAULT_POLLINATIONS_API_KEY = 'sk_V7C0VjDS2bfJmP33NgZDBMHEU7bp4nBe';
export const DEFAULT_POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai/v1';

export const POPULAR_POLLINATIONS_MODELS: LlmModel[] = [
  { id: 'openai', name: 'GPT-5.4 / OpenAI (Рекомендуется)' },
  { id: 'deepseek-pro', name: 'DeepSeek Pro (Глубокий расчет)' },
  { id: 'claude', name: 'Claude 3.7 / Hybrid (Гроссмейстер)' },
  { id: 'gemini', name: 'Gemini 2.0 Flash (Быстрый)' },
  { id: 'mistral-large', name: 'Mistral Large (Тактик)' },
  { id: 'grok-large', name: 'Grok Large (Трэшток)' },
  { id: 'llama', name: 'Llama 3.3 70B' },
  { id: 'qwen3.8-2.4t-a95b', name: 'Qwen 3.8 / Alibaba' }
];

export interface CustomProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  description: string;
  needsKey: boolean;
}

export const POPULAR_CUSTOM_PRESETS: CustomProviderPreset[] = [
  { id: 'pollinations', name: '🌸 Pollinations AI (По умолчанию)', baseUrl: 'https://gen.pollinations.ai/v1', description: 'Официальный Pollinations API (180+ моделей)', needsKey: true },
  { id: 'ollama', name: '🦙 Ollama', baseUrl: 'http://localhost:11434/v1', description: 'Локальные модели через Ollama', needsKey: false },
  { id: 'deepseek', name: '⚡ DeepSeek API', baseUrl: 'https://api.deepseek.com/v1', description: 'Официальный API DeepSeek (V3, R1)', needsKey: true },
  { id: 'groq', name: '🚀 Groq Cloud', baseUrl: 'https://api.groq.com/openai/v1', description: 'Сверхбыстрый вывод моделей Llama/Qwen на LPU', needsKey: true },
  { id: 'vllm', name: '🤖 vLLM / Jan / LocalAI', baseUrl: 'http://localhost:8000/v1', description: 'Локальный или серверный vLLM', needsKey: false },
  { id: 'together', name: '🌌 Together AI', baseUrl: 'https://api.together.xyz/v1', description: 'Облачные открытые модели', needsKey: true },
  { id: 'custom', name: '⚙️ Свой URL', baseUrl: '', description: 'Любой OpenAI-совместимый сервер', needsKey: false }
];

export function getRefererUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.href || window.location.origin || 'http://localhost:5173/';
  }
  return 'http://localhost:5173/';
}

export class LlmClient {
  private defaultBaseUrl = 'http://localhost:1234/v1';

  public async fetchModels(baseUrl: string = this.defaultBaseUrl): Promise<LlmModel[]> {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    try {
      const response = await fetch(`${cleanUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`LM Studio fetchModels failed at ${cleanUrl}:`, msg);
      return [];
    }
  }

  public async fetchPollinationsModels(apiKey: string = DEFAULT_POLLINATIONS_API_KEY): Promise<LlmModel[]> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const response = await fetch('https://gen.pollinations.ai/v1/models', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawList = Array.isArray(data) ? data : data.data || [];
      if (Array.isArray(rawList)) {
        const fetched: LlmModel[] = rawList.map((m: any) => ({
          id: m.id || m.name || String(m),
          name: m.name || m.id || String(m),
          description: m.description
        }));
        const popIds = new Set(POPULAR_POLLINATIONS_MODELS.map(p => p.id));
        const rest = fetched.filter(f => !popIds.has(f.id));
        return [...POPULAR_POLLINATIONS_MODELS, ...rest];
      }
      return POPULAR_POLLINATIONS_MODELS;
    } catch (err: unknown) {
      console.warn('Pollinations models fetch failed, using popular presets:', err);
      return POPULAR_POLLINATIONS_MODELS;
    }
  }

  public async fetchOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
    try {
      const headers: Record<string, string> = {};
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers: Object.keys(headers).length > 0 ? headers : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const fetchedList: OpenRouterModel[] = data.data.map((m: { id: string; name?: string; description?: string; context_length?: number; pricing?: { prompt?: string; completion?: string } }) => ({
          id: m.id,
          name: m.name || m.id,
          description: m.description || '',
          context_length: m.context_length,
          pricing: m.pricing
        }));

        const popularIds = new Set(POPULAR_OPENROUTER_MODELS.map(p => p.id));
        const customFetched = fetchedList.filter(m => !popularIds.has(m.id));
        return [...POPULAR_OPENROUTER_MODELS, ...customFetched];
      }
      return POPULAR_OPENROUTER_MODELS;
    } catch (err: unknown) {
      console.warn('OpenRouter models fetch failed, using popular presets:', err);
      return POPULAR_OPENROUTER_MODELS;
    }
  }

  public async fetchCustomModels(baseUrl: string, apiKey?: string): Promise<LlmModel[]> {
    if (!baseUrl || !baseUrl.trim()) return [];
    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }
      const response = await fetch(`${cleanUrl}/models`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Custom OpenAI provider fetchModels failed at ${cleanUrl}:`, msg);
      return [];
    }
  }

  public async streamMove(options: StreamMoveOptions): Promise<StreamMoveResult> {
    const {
      provider = 'pollinations',
      baseUrl = this.defaultBaseUrl,
      apiKey,
      modelId = 'openai',
      modelPricing,
      systemPrompt,
      userPrompt,
      temperature = 0.6,
      maxTokens = -1,
      callbacks,
      abortSignal
    } = options;

    const isPollinations = provider === 'pollinations';
    const isLmStudio = provider === 'lmstudio';
    const isOpenRouter = provider === 'openrouter';
    const isCustom = provider === 'custom';

    const cleanBaseUrl = (baseUrl || this.defaultBaseUrl).trim().replace(/\/+$/, '');
    let endpoint = `${cleanBaseUrl}/chat/completions`;

    if (isPollinations) {
      endpoint = 'https://gen.pollinations.ai/v1/chat/completions';
    } else if (isOpenRouter) {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    } else if (isCustom) {
      endpoint = cleanBaseUrl.endsWith('/chat/completions') ? cleanBaseUrl : `${cleanBaseUrl}/chat/completions`;
    }

    if (isOpenRouter && (!apiKey || !apiKey.trim())) {
      throw new Error('Для игры через OpenRouter укажите ваш API-ключ в настройках (⚙️ -> вкладка Модели).');
    }

    callbacks.onStatusUpdate(
      isPollinations
        ? `Отправка запроса в Pollinations AI (${modelId})...`
        : isLmStudio
        ? 'Отправка запроса в LM Studio...'
        : isOpenRouter
        ? `Отправка запроса в OpenRouter (${modelId})...`
        : `Отправка запроса в Custom API (${modelId})...`
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (isPollinations) {
      headers['Authorization'] = `Bearer ${apiKey?.trim() || DEFAULT_POLLINATIONS_API_KEY}`;
    } else if (isOpenRouter) {
      headers['Authorization'] = `Bearer ${apiKey?.trim() || ''}`;
      headers['HTTP-Referer'] = getRefererUrl();
      headers['X-Title'] = 'LLM Durak';
    } else if (isCustom && apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const body: Record<string, any> = {
      model: modelId || (isPollinations ? 'openai' : 'default'),
      messages,
      temperature,
      stream: true,
      stream_options: { include_usage: true }
    };

    if (maxTokens && maxTokens > 0) {
      body.max_tokens = maxTokens;
    }

    const providerName = isLmStudio ? 'LM Studio' : isOpenRouter ? 'OpenRouter' : 'Custom OpenAI';

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortSignal
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Ошибка соединения с ${providerName}: ${msg}`);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      let cleanErrMsg = errBody;
      try {
        const parsedErr = JSON.parse(errBody);
        if (parsedErr.error?.message) {
          cleanErrMsg = parsedErr.error.message;
        }
      } catch {}

      if (response.status === 401) {
        throw new Error(`${providerName} 401: Неверный или недействительный API-ключ. Проверьте ключ в Настройках ⚙️.`);
      } else if (response.status === 402) {
        throw new Error(`${providerName} 402: Недостаточно средств на балансе аккаунта для модели ${modelId}.`);
      } else if (response.status === 429) {
        throw new Error(`${providerName} 429: Превышен лимит запросов (Rate limit). Попробуйте снова через несколько секунд.`);
      }

      throw new Error(`${providerName} HTTP ${response.status}: ${response.statusText} — ${cleanErrMsg}`);
    }

    if (!response.body) {
      throw new Error(`Ответ сервера ${providerName} не содержит потока данных (empty body).`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    let fullThinking = '';
    let fullContent = '';
    let rawResponse = '';
    let isInsideThinkTag = false;
    let thinkingFinishedEmitted = false;
    let buffer = '';

    const streamStartTime = Date.now();
    let tokenChunksCount = 0;
    let explicitPromptTokens: number | null = null;
    let explicitCompletionTokens: number | null = null;
    let explicitCostUsd: number | null = null;

    const estimatedPromptTokens = Math.max(150, Math.round((systemPrompt.length + userPrompt.length) / 3.2));
    
    const pricingFallback = DEFAULT_MODEL_PRICING[modelId] || { prompt: 0, completion: 0 };
    const pricePrompt = Number(modelPricing?.prompt ?? pricingFallback.prompt ?? 0);
    const priceCompletion = Number(modelPricing?.completion ?? pricingFallback.completion ?? 0);

    const calculateCurrentCost = (promptTok: number, compTok: number) => {
      if (!isOpenRouter) return 0;
      if (explicitCostUsd !== null) return explicitCostUsd;
      return (promptTok * pricePrompt) + (compTok * priceCompletion);
    };

    const emitTokenMetrics = () => {
      const durationMs = Date.now() - streamStartTime;
      const durationSec = durationMs / 1000;
      const currentPromptTokens = explicitPromptTokens ?? estimatedPromptTokens;
      const currentCompletionTokens =
        explicitCompletionTokens !== null
          ? explicitCompletionTokens
          : Math.max(tokenChunksCount, Math.round(rawResponse.length / 2.8));
      
      const speed = durationSec > 0.05 ? +(currentCompletionTokens / durationSec).toFixed(1) : 0;
      const currentCostUsd = calculateCurrentCost(currentPromptTokens, currentCompletionTokens);

      callbacks.onTokenMetrics?.({
        totalTokens: currentCompletionTokens,
        tokensPerSecond: speed,
        durationMs,
        costUsd: currentCostUsd,
        promptTokens: currentPromptTokens,
        completionTokens: currentCompletionTokens
      });
    };

    callbacks.onStatusUpdate('Генерация рассуждений...');

    try {
      while (true) {
        if (abortSignal?.aborted) {
          reader.cancel();
          throw new Error('Запрос отменен пользователем.');
        }

        const { done, value } = await reader.read();
        if (done) break;

        const decodedChunk = decoder.decode(value, { stream: true });
        buffer += decodedChunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') continue;

          // Check if response is raw JSON (non-streaming fallback)
          if (!trimmed.startsWith('data: ') && trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const nonStreamObj = JSON.parse(trimmed);
              const directContent = nonStreamObj.choices?.[0]?.message?.content || nonStreamObj.choices?.[0]?.text || '';
              if (directContent) {
                fullContent += directContent;
                rawResponse += directContent;
                callbacks.onContentChunk(directContent, fullContent);
              }
            } catch {}
            continue;
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6).trim();
            try {
              const parsed = JSON.parse(jsonStr);

              // Check for errors returned in stream
              if (parsed.error) {
                const errMsg = typeof parsed.error === 'string' ? parsed.error : parsed.error.message || JSON.stringify(parsed.error);
                throw new Error(`LLM ошибка: ${errMsg}`);
              }

              if (parsed.usage) {
                if (typeof parsed.usage.prompt_tokens === 'number') {
                  explicitPromptTokens = parsed.usage.prompt_tokens;
                }
                if (typeof parsed.usage.completion_tokens === 'number') {
                  explicitCompletionTokens = parsed.usage.completion_tokens;
                }
                if (typeof parsed.usage.cost === 'number') {
                  explicitCostUsd = parsed.usage.cost;
                }
                emitTokenMetrics();
              }

              const choice = parsed.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta || {};
              
              // 1. Reasoning chunk (DeepSeek R1 / QwQ format)
              const reasoningChunk = delta.reasoning_content || delta.reasoning || '';
              if (reasoningChunk) {
                fullThinking += reasoningChunk;
                rawResponse += reasoningChunk;
                tokenChunksCount++;
                callbacks.onThinkingChunk(reasoningChunk, fullThinking);
                emitTokenMetrics();
                continue;
              }

              // 2. Standard content chunk or fallback text
              const contentChunk = delta.content || delta.text || choice.text || (choice.message ? choice.message.content : '') || '';
              if (contentChunk) {
                rawResponse += contentChunk;
                tokenChunksCount++;
                emitTokenMetrics();
                let chunkText = contentChunk;

                if (!isInsideThinkTag && (chunkText.includes('<think>') || chunkText.includes('<thought>'))) {
                  isInsideThinkTag = true;
                  chunkText = chunkText.replace(/<think>|<thought>/g, '');
                }

                if (isInsideThinkTag && (chunkText.includes('</think>') || chunkText.includes('</thought>'))) {
                  const parts = chunkText.split(/<\/think>|<\/thought>/);
                  const thinkPart = parts[0];
                  const afterThinkPart = parts.slice(1).join('');

                  fullThinking += thinkPart;
                  callbacks.onThinkingChunk(thinkPart, fullThinking);

                  isInsideThinkTag = false;
                  if (!thinkingFinishedEmitted) {
                    thinkingFinishedEmitted = true;
                    callbacks.onThinkingFinished();
                    callbacks.onStatusUpdate('Формирование реплики и финального хода...');
                  }

                  if (afterThinkPart) {
                    fullContent += afterThinkPart;
                    callbacks.onContentChunk(afterThinkPart, fullContent);
                  }
                  continue;
                }

                if (isInsideThinkTag) {
                  fullThinking += chunkText;
                  callbacks.onThinkingChunk(chunkText, fullThinking);
                } else {
                  if (!thinkingFinishedEmitted && fullThinking.length > 0) {
                    thinkingFinishedEmitted = true;
                    callbacks.onThinkingFinished();
                    callbacks.onStatusUpdate('Формирование реплики и финального хода...');
                  }
                  fullContent += chunkText;
                  callbacks.onContentChunk(chunkText, fullContent);
                }
              }
            } catch (jsonErr) {
              // ignore json parse error on partial lines
            }
          }
        }
      }
    } finally {
      if (!thinkingFinishedEmitted) {
        callbacks.onThinkingFinished();
      }
    }

    const finalDurationMs = Date.now() - streamStartTime;
    const finalPromptTokens = explicitPromptTokens ?? estimatedPromptTokens;
    const finalCompletionTokens =
      explicitCompletionTokens !== null
        ? explicitCompletionTokens
        : Math.max(tokenChunksCount, Math.round(rawResponse.length / 2.8));
    const finalSpeed = finalDurationMs > 50 ? +((finalCompletionTokens / (finalDurationMs / 1000)).toFixed(1)) : 0;
    const finalCostUsd = calculateCurrentCost(finalPromptTokens, finalCompletionTokens);

    return {
      fullThinking,
      fullContent,
      rawResponse,
      tokenCount: finalCompletionTokens,
      tokensPerSecond: finalSpeed,
      durationMs: finalDurationMs,
      costUsd: finalCostUsd,
      promptTokens: finalPromptTokens,
      completionTokens: finalCompletionTokens
    };
  }

  public async simulateMockMove(
    state: any,
    playerIndex: number,
    legalActions: any[],
    characterName: string,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<StreamMoveResult> {
    callbacks.onStatusUpdate(`${characterName} оценивает карты на руках...`);

    const chosenAction = legalActions[Math.floor(Math.random() * legalActions.length)];
    let moveCommand = '';

    switch (chosenAction.type) {
      case 'ATTACK':
        moveCommand = `<move>ATTACK ${formatCard(chosenAction.card)}</move>`;
        break;
      case 'DEFEND': {
        const pair = state.table.find((p: any) => p.id === chosenAction.attackCardId);
        const attStr = pair ? formatCard(pair.attackCard) : '';
        moveCommand = `<move>DEFEND ${attStr} WITH ${formatCard(chosenAction.card)}</move>`;
        break;
      }
      case 'TRANSFER':
        moveCommand = `<move>TRANSFER ${formatCard(chosenAction.card)}</move>`;
        break;
      case 'PASS':
        moveCommand = `<move>PASS</move>`;
        break;
      case 'TAKE':
        moveCommand = `<move>TAKE</move>`;
        break;
    }

    const thoughts = [
      `Так, козырь — ${state.trumpSuit}. В колоде еще ${state.deck.length} карт.\n`,
      `Оцениваю доступные варианты: ${legalActions.length} допустимых действий.\n`,
      `Оптимальное решение для сохранения баланса — сделать ${chosenAction.type}!\n`
    ];

    let fullThinking = '';
    for (const chunk of thoughts) {
      if (abortSignal?.aborted) throw new Error('Ход отменен.');
      await new Promise(r => setTimeout(r, 180));
      fullThinking += chunk;
      callbacks.onThinkingChunk(chunk, fullThinking);
    }

    callbacks.onThinkingFinished();
    callbacks.onStatusUpdate(`${characterName} делает ход!`);

    const comments = [
      'Держи карту, не подавись!',
      'Так просто ты у меня не отделаешься!',
      'Шаг за шагом веду к победе!',
      'Посмотрим, чем ты на это ответишь!'
    ];
    const comment = comments[Math.floor(Math.random() * comments.length)];
    const fullContent = `<comment>${comment}</comment>\n${moveCommand}`;

    callbacks.onContentChunk(fullContent, fullContent);

    return {
      fullThinking,
      fullContent,
      rawResponse: `<think>${fullThinking}</think>\n${fullContent}`,
      tokenCount: 42,
      tokensPerSecond: 28.5,
      durationMs: 800
    };
  }
}

function formatCard(card: any): string {
  if (!card) return '';
  const suitSymbols: Record<string, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣'
  };
  return `${card.rank}${suitSymbols[card.suit] || ''}`;
}

export const llmService = new LlmClient();
export const lmStudioService = llmService;
export const LMStudioClient = LlmClient;
