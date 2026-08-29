export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'KZT' | 'CNY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToUsd: number; // e.g. 92.5 for RUB (1 USD = 92.5 RUB)
  lastUpdated?: number;
}

const DEFAULT_RATES: Record<CurrencyCode, { symbol: string; name: string; rateToUsd: number }> = {
  RUB: { symbol: '₽', name: 'Российский рубль', rateToUsd: 92.5 },
  USD: { symbol: '$', name: 'Доллар США', rateToUsd: 1.0 },
  EUR: { symbol: '€', name: 'Евро', rateToUsd: 0.92 },
  KZT: { symbol: '₸', name: 'Казахстанский тенге', rateToUsd: 485.0 },
  CNY: { symbol: '¥', name: 'Китайский юань', rateToUsd: 7.24 }
};

const STORAGE_KEY_CURRENCY = 'durak_currency_code';
const STORAGE_KEY_RATES = 'durak_currency_rates';

class CurrencyService {
  private currentCurrency: CurrencyCode = 'RUB';
  private rates: Record<CurrencyCode, number> = {
    RUB: 92.5,
    USD: 1.0,
    EUR: 0.92,
    KZT: 485.0,
    CNY: 7.24
  };
  private isFetching = false;

  constructor() {
    this.loadSettings();
    this.fetchExchangeRates().catch(() => {});
  }

  private loadSettings(): void {
    try {
      const savedCode = localStorage.getItem(STORAGE_KEY_CURRENCY) as CurrencyCode;
      if (savedCode && DEFAULT_RATES[savedCode]) {
        this.currentCurrency = savedCode;
      }
      const savedRates = localStorage.getItem(STORAGE_KEY_RATES);
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        this.rates = { ...this.rates, ...parsed };
      }
    } catch {}
  }

  public getCurrency(): CurrencyCode {
    return this.currentCurrency;
  }

  public setCurrency(code: CurrencyCode): void {
    if (DEFAULT_RATES[code]) {
      this.currentCurrency = code;
      localStorage.setItem(STORAGE_KEY_CURRENCY, code);
    }
  }

  public getCurrencySymbol(code: CurrencyCode = this.currentCurrency): string {
    return DEFAULT_RATES[code]?.symbol || '$';
  }

  public getRate(code: CurrencyCode = this.currentCurrency): number {
    return this.rates[code] || DEFAULT_RATES[code]?.rateToUsd || 1.0;
  }

  public setCustomRate(code: CurrencyCode, rate: number): void {
    if (rate > 0) {
      this.rates[code] = rate;
      try {
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(this.rates));
      } catch {}
    }
  }

  public async fetchExchangeRates(): Promise<{ success: boolean; rates: Record<CurrencyCode, number>; message?: string }> {
    if (this.isFetching) return { success: true, rates: this.rates };
    this.isFetching = true;

    try {
      // Free public exchange rates API (Open Exchange Rates / exchangerate-api.com)
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.rates) {
        const newRates: Partial<Record<CurrencyCode, number>> = {};
        if (data.rates.RUB) newRates.RUB = +(data.rates.RUB.toFixed(2));
        if (data.rates.EUR) newRates.EUR = +(data.rates.EUR.toFixed(4));
        if (data.rates.KZT) newRates.KZT = +(data.rates.KZT.toFixed(2));
        if (data.rates.CNY) newRates.CNY = +(data.rates.CNY.toFixed(3));
        newRates.USD = 1.0;

        this.rates = { ...this.rates, ...(newRates as Record<CurrencyCode, number>) };
        localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(this.rates));
        return { success: true, rates: this.rates };
      }
      throw new Error('Invalid rate response format');
    } catch (err: unknown) {
      // Fallback secondary public API
      try {
        const fallbackRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          if (fbData && fbData.rates) {
            if (fbData.rates.RUB) this.rates.RUB = +(fbData.rates.RUB.toFixed(2));
            if (fbData.rates.EUR) this.rates.EUR = +(fbData.rates.EUR.toFixed(4));
            if (fbData.rates.KZT) this.rates.KZT = +(fbData.rates.KZT.toFixed(2));
            if (fbData.rates.CNY) this.rates.CNY = +(fbData.rates.CNY.toFixed(3));
            localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(this.rates));
            return { success: true, rates: this.rates };
          }
        }
      } catch {}

      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, rates: this.rates, message: msg };
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Formats cost in USD to the selected currency string with symbol
   */
  public formatCost(costUsd: number = 0, currency: CurrencyCode = this.currentCurrency): string {
    const symbol = this.getCurrencySymbol(currency);
    const rate = this.getRate(currency);
    const converted = costUsd * rate;

    if (converted === 0) {
      return currency === 'USD' ? '$0.00' : `0.00 ${symbol}`;
    }

    if (converted < 0.01) {
      // Show 4 decimals for tiny amounts (e.g. 0.0035 ₽ or $0.0003)
      const valStr = converted.toFixed(4);
      return currency === 'USD' ? `${symbol}${valStr}` : `${valStr} ${symbol}`;
    }

    if (converted < 1.0) {
      const valStr = converted.toFixed(3);
      return currency === 'USD' ? `${symbol}${valStr}` : `${valStr} ${symbol}`;
    }

    const valStr = converted.toFixed(2);
    return currency === 'USD' ? `${symbol}${valStr}` : `${valStr} ${symbol}`;
  }

  /**
   * Helper to format both USD and chosen currency
   */
  public formatCostDetailed(costUsd: number = 0, currency: CurrencyCode = this.currentCurrency): string {
    const main = this.formatCost(costUsd, currency);
    if (currency === 'USD') return main;
    const usd = `$${costUsd.toFixed(4)}`;
    return `${main} (${usd})`;
  }
}

export const currencyService = new CurrencyService();
