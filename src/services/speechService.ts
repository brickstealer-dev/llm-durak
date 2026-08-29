import { CharacterStyle } from '../types/durak';

export interface VoiceOption {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
  isRussian: boolean;
}

class SpeechService {
  private enabled: boolean = false;
  private volume: number = 1.0;
  private rate: number = 1.05;
  private pitch: number = 1.0;
  private selectedVoiceName: string = '';
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const load = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        this.voices = allVoices;
        this.voicesLoaded = true;
      }
    };

    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  public getAvailableVoices(): VoiceOption[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }

    const currentVoices = this.voices.length > 0 ? this.voices : window.speechSynthesis.getVoices();
    return currentVoices.map(v => ({
      name: v.name,
      lang: v.lang,
      voice: v,
      isRussian: v.lang.toLowerCase().startsWith('ru') || v.name.toLowerCase().includes('russian')
    })).sort((a, b) => (b.isRussian ? 1 : 0) - (a.isRussian ? 1 : 0));
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    } else if (enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  public setVoice(voiceName: string): void {
    this.selectedVoiceName = voiceName;
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2, rate));
  }

  public setPitch(pitch: number): void {
    this.pitch = Math.max(0.5, Math.min(2, pitch));
  }

  private findBestVoice(style?: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const allVoices = this.voices.length > 0 ? this.voices : window.speechSynthesis.getVoices();

    // 1. If user explicitly picked a voice
    if (this.selectedVoiceName) {
      const chosen = allVoices.find(v => v.name === this.selectedVoiceName);
      if (chosen) return chosen;
    }

    // 2. Filter Russian voices
    const ruVoices = allVoices.filter(
      v => v.lang.toLowerCase().startsWith('ru') || v.name.toLowerCase().includes('russian')
    );

    if (ruVoices.length === 0) {
      return allVoices.find(v => v.default) || allVoices[0] || null;
    }

    // 3. Match character gender preference
    if (style === 'baba_klava') {
      // Female preference
      const female = ruVoices.find(v => 
        /svetlana|milena|tatyana|irina|victoria|daria|female|woman/i.test(v.name)
      );
      if (female) return female;
    } else {
      // Male preference (Nikolaich, Patsan, Shuler, Professor)
      const male = ruVoices.find(v => 
        /dmitry|pavel|alexander|maxim|male|man/i.test(v.name)
      );
      if (male) return male;
    }

    // 4. Fallback to Natural / Google / First Russian voice
    const naturalRu = ruVoices.find(v => /natural|online|google/i.test(v.name));
    return naturalRu || ruVoices[0];
  }

  public speak(text: string, style?: CharacterStyle | string): void {
    if (!this.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      // Clean markdown, code, prompt tags
      const cleanText = text
        .replace(/<[^>]+>/g, '')
        .replace(/[*_#`~[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ru-RU';
      utterance.volume = this.volume;

      // Character-specific pitch and rate modifications
      let charPitch = this.pitch;
      let charRate = this.rate;

      switch (style) {
        case 'nikolaich':
          // Дворовый батя — басовитый, хриплый, напористый
          charPitch = 0.78;
          charRate = 1.12;
          break;
        case 'shuler':
          // Семён Шулер — вкрадчивый, ровный, хитрый
          charPitch = 0.92;
          charRate = 1.05;
          break;
        case 'professor':
          // Профессор — высокий, манерный, чуть медленный
          charPitch = 1.15;
          charRate = 0.95;
          break;
        case 'patsan':
          // Дерзкий пацан — быстрый, резкий
          charPitch = 0.98;
          charRate = 1.25;
          break;
        case 'baba_klava':
          // Баба Клава — высокий бабушкин тон
          charPitch = 1.3;
          charRate = 0.92;
          break;
        case 'stockfish':
          // Робот — монотонный
          charPitch = 0.6;
          charRate = 1.25;
          break;
      }

      utterance.pitch = charPitch;
      utterance.rate = charRate;

      const voice = this.findBestVoice(style);
      if (voice) {
        utterance.voice = voice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[SpeechService] Speak failed:', err);
    }
  }

  public testVoice(style: CharacterStyle = 'nikolaich'): void {
    const testPhrases: Record<string, string> = {
      nikolaich: 'Ну и куда ты попёрся со своей шестёркой? Щас я тебе покажу настоящий дворовый дурак!',
      shuler: 'Карты любят счёт, а не суету. Следи за тузами, милок.',
      professor: 'Теория вероятностей с математической точностью предсказывает твое поражение.',
      patsan: 'Слышь, ты че тут мастями раскидался? На, держи ответку!',
      baba_klava: 'Ох, внучек, в мои годы в преферанс так не позорились. Бери карты, не стесняйся.',
      stockfish: 'Оценка позиции: плюс пять целых три десятых. Ход детерминирован.'
    };

    const text = testPhrases[style] || 'Проверка озвучки синтезатора речи.';
    const wasEnabled = this.enabled;
    this.enabled = true;
    this.speak(text, style);
    if (!wasEnabled) {
      // restore state after test
      setTimeout(() => {
        this.enabled = wasEnabled;
      }, 5000);
    }
  }
}

export const speechService = new SpeechService();
