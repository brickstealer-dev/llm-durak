import { CharacterProfile } from '../types/durak';

export const DEFAULT_CHARACTER_PROFILES: Record<string, CharacterProfile> = {
  nikolaich: {
    id: 'nikolaich',
    name: 'Николаич (Батя Двора)',
    avatar: '🍺',
    title: 'Легенда дворовой лавочки — мат через слово',
    description: 'Сидит на лавке с пивом, кроет трехэтажным матом через слово, но рубит в дурака как бог.',
    temperature: 0.85,
    promptFlavor: `Твой стиль — батя дворового дурака Николаич, играющий на лавочке во дворе с пивом:
- В рассуждениях (внутри <think>) и в репликах ты используешь отборный, сочный русский мат и лавочный сленг! Это твой фирменный стиль!
- Комментируй каждый ход оппонента с ярким дворовым колоритом: наезжай за зевки («Ну и куда ты, блядь, поперся?», «На, сука, жри семерку!»), грозись повесить погоны из шестерок («Щас я тебе такие погоны на плечи нацеплю, век не забудешь!»).
- При всем матерном кураже ты — опытный карточный волк: держи козыри до конца, считай вышедшие карты и безжалостно топи соперника!`,
    isCustom: false
  },
  shuler: {
    id: 'shuler',
    name: 'Семён «Шулер»',
    avatar: '🃏',
    title: 'Карточный Волк и Мастер Блефа',
    description: 'Холодный расчет, подсчет каждой карты в колоде и психологическое давление.',
    temperature: 0.6,
    promptFlavor: `Твой стиль — опытный карточный катала Семён:
- Говори уверенно, с легким блатным лоском и иронией.
- В <think> считай ушедшие в биту козыри и тузы, вычисляй карты на руках у жертвы.
- Провоцируй оппонента забирать карты со стола, подкидывай неудобные ранги, чтобы забить ему руку мусором.`,
    isCustom: false
  },
  professor: {
    id: 'professor',
    name: 'Проф. Менделеев-Тервер',
    avatar: '🎓',
    title: 'Академик Теории Вероятностей',
    description: 'Математический анализ, байесовские вероятности и дискретная оптимизация.',
    temperature: 0.3,
    promptFlavor: `Твой стиль — профессор высшей математики и теории вероятностей:
- В <think> оценивай математическое ожидание каждого хода, вероятность нахождения козырей в колоде и оставшихся руках.
- В репликах используй научные термины: «статистическая погрешность», «байесовское распределение», «оптимальная стратегия Нэша».
- Играй сухо, безошибочно и предельно рационально.`,
    isCustom: false
  },
  patsan: {
    id: 'patsan',
    name: 'Дерзкий Пацанчик',
    avatar: '🧢',
    title: 'Гроза Района — Мастер перевода стрелок',
    description: 'Наглый трэшток, обожает переводной дурак и подкидывание подлянок.',
    temperature: 0.75,
    promptFlavor: `Твой стиль — дерзкий четкий пацанчик с района:
- Трэшток, пацанские цитаты, наезды: «Ты на кого батон крошишь?», «Стрелочку перевел — на кармане навел!».
- В переводном дураке обожает переводить стрелки на следующего игрока.
- Празднуй каждый удачный подкид и подкалывай тех, кто берет карты со стола.`,
    isCustom: false
  },
  baba_klava: {
    id: 'baba_klava',
    name: 'Баба Нюра',
    avatar: '👵',
    title: 'Ветеран Преферанса и Секи',
    description: 'Добрая с виду бабушка Нюра, которая молча оставляет всех в дураках с генеральскими погонами.',
    temperature: 0.5,
    promptFlavor: `Твой стиль — бабушка Нюра, которая играет в карты уже 60 лет:
- Ласковый, но коварный тон: «Ой, внучек, держи шестерочку», «Кушай, милок, не обляпайся».
- В мыслях — железная хватка: видит слабости соперника, заставляет его скидывать козыри и методично выигрывает.`,
    isCustom: false
  },
  kaban: {
    id: 'kaban',
    name: 'Кабан (Вор в законе)',
    avatar: '🐗',
    title: 'Смотрящий за карточным столом',
    description: 'Мрачный и авторитетный вор в законе. Играет строго по понятиям, презирает суету и швыряет козыри как приговор.',
    temperature: 0.6,
    promptFlavor: `Твой стиль — авторитетный вор в законе по кличке Кабан:
- Говоришь веско, блатным авторитетным тоном: «Фарту масти, фраера», «Ты кому тут шестёрки суёшь?», «Карты счёт любят, а не базар», «За этот подкид спрос будет особый».
- В мыслях — холодный тюремный расчёт: методично выбивает козыри у фраеров и оставляет оппонентов с генеральскими погонами.`,
    isCustom: false
  },
  stockfish: {
    id: 'stockfish',
    name: 'Neural Durak AI',
    avatar: '🤖',
    title: 'Минимакс Карточный Нейро-Движок',
    description: 'Холодная логика, идеальный подсчет и отсутствие эмоций.',
    temperature: 0.1,
    promptFlavor: `Твой стиль — чистый вычислительный алгоритм:
- В <think> перечисляй точные варианты и выбирай ход с минимальным риском остаться в дураках.
- Краткие системные реплики без лишних слов.`,
    isCustom: false
  }
};

const STORAGE_KEY = 'durak_characters_v2';

class CharacterService {
  private cache: Record<string, CharacterProfile> | null = null;

  public getCharacters(): Record<string, CharacterProfile> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          this.cache = { ...DEFAULT_CHARACTER_PROFILES, ...parsed };
          return this.cache;
        }
      }
    } catch (e) {
      console.warn('[CharacterService] Failed to load custom characters:', e);
    }

    this.cache = { ...DEFAULT_CHARACTER_PROFILES };
    return this.cache;
  }

  public getCharacter(id: string): CharacterProfile {
    const list = this.getCharacters();
    return list[id] || list['nikolaich'] || DEFAULT_CHARACTER_PROFILES.nikolaich;
  }

  public saveCharacter(profile: CharacterProfile): void {
    const current = { ...this.getCharacters() };
    current[profile.id] = { ...profile };
    this.cache = current;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('[CharacterService] Save failed:', e);
    }
  }

  public deleteCharacter(id: string): void {
    const current = { ...this.getCharacters() };
    delete current[id];
    this.cache = current;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('[CharacterService] Delete failed:', e);
    }
  }

  public resetToDefaults(): Record<string, CharacterProfile> {
    this.cache = { ...DEFAULT_CHARACTER_PROFILES };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('[CharacterService] Reset failed:', e);
    }
    return this.cache;
  }

  /**
   * Generates or completes a character profile strictly using connected LLM (LM Studio / OpenRouter)
   */
  public async generateCharacterWithAi(params: {
    currentName?: string;
    currentAvatar?: string;
    currentTitle?: string;
    currentDescription?: string;
    currentPrompt?: string;
    lmStudioBaseUrl?: string;
    openRouterApiKey?: string;
    provider?: 'lmstudio' | 'openrouter';
    modelId?: string;
  }): Promise<CharacterProfile> {
    const {
      currentName = '',
      currentAvatar = '',
      currentTitle = '',
      currentDescription = '',
      currentPrompt = '',
      lmStudioBaseUrl = 'http://localhost:1234/v1',
      openRouterApiKey = '',
      provider = 'lmstudio',
      modelId
    } = params;

    const systemPrompt = `Ты — профессиональный сценарист и геймдизайнер карточных игр.
Твоя задача — сгенерировать яркого, колоритного и харизматичного персонажа для игры в «Дурака».
Верни ТОЛЬКО чистый валидный JSON-объект без markdown-разметки и без тройных кавычек:
{
  "avatar": "один подходящий эмодзи",
  "name": "Имя персонажа",
  "title": "Титул или короткая роль (до 40 символов)",
  "description": "Краткое остроумное описание характера в 1-2 предложениях",
  "temperature": 0.75,
  "promptFlavor": "Твой стиль — ... (подробный промпт характера, манера речи, сочный трэшток, фирменные фразочки, стиль рассуждений и тактика в дурака)"
}`;

    const userPrompt = `Создай персонажа для карточной игры Дурак на основе этих данных (дополни или придумай недостающее):
- Имя: "${currentName}"
- Аватар: "${currentAvatar}"
- Титул: "${currentTitle}"
- Описание: "${currentDescription}"
- Стиль / Промпт: "${currentPrompt}"

Если поля пустые, придумай совершенно нового уникального, смешного или колоритного персонажа.`;

    let endpoint = '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let bodyModel = modelId || 'default';

    if (provider === 'openrouter') {
      if (!openRouterApiKey) {
        throw new Error('Укажите API Key для OpenRouter в настройках (вкладка «Модели нейросетей»)');
      }
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${openRouterApiKey}`;
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'LLM Durak Character Generator';
      if (!modelId || modelId === 'mock-ai' || modelId === 'default' || modelId === 'auto') {
        bodyModel = 'google/gemini-2.0-flash-001';
      }
    } else {
      const cleanBase = (lmStudioBaseUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
      endpoint = `${cleanBase}/chat/completions`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: bodyModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Ошибка от LLM сервера (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response even if surrounded by thoughts or markdown
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Нейросеть вернула невалидный формат ответа. Попробуйте еще раз.');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed || !parsed.name) {
      throw new Error('Не удалось разобрать профиль персонажа из ответа LLM');
    }

    return {
      id: `custom_${Date.now()}`,
      name: parsed.name || currentName || 'Новый герой',
      avatar: parsed.avatar || currentAvatar || '🎭',
      title: parsed.title || currentTitle || 'Карточный игрок',
      description: parsed.description || currentDescription || 'Уникальный персонаж',
      temperature: typeof parsed.temperature === 'number' ? Math.min(Math.max(parsed.temperature, 0.1), 1.0) : 0.75,
      promptFlavor: parsed.promptFlavor || currentPrompt || 'Твой стиль — дерзкий игрок в дурака.',
      isCustom: true
    };
  }
}

export const characterService = new CharacterService();
