const axios = require('axios');

class CurrencyService {
    constructor() {
        this.apiKey = process.env.EXCHANGE_RATE_API_KEY || 'free';
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000;
        
        this.fallbackRates = {
            'USD': { 'RUB': 95, 'EUR': 0.85 },
            'EUR': { 'RUB': 105, 'USD': 1.18 },
            'RUB': { 'USD': 0.011, 'EUR': 0.0095 }
        };
    }

    async getExchangeRates(baseCurrency) {
        const cacheKey = baseCurrency.toUpperCase();
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.rates;
        }

        try {
            const response = await axios.get(`${this.baseUrl}/${baseCurrency}`, {
                timeout: 5000
            });
            
            const rates = response.data.rates;
            
            this.cache.set(cacheKey, {
                rates,
                timestamp: Date.now()
            });
            
            return rates;
        } catch (error) {
            console.warn(`[CurrencyService] API недоступен, используем fallback курсы:`, error.message);
            return this.fallbackRates[baseCurrency.toUpperCase()] || {};
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        fromCurrency = fromCurrency.toUpperCase();
        toCurrency = toCurrency.toUpperCase();
        
        if (fromCurrency === toCurrency) {
            return parseFloat(amount);
        }
        
        try {
            const rates = await this.getExchangeRates(fromCurrency);
            const rate = rates[toCurrency];
            
            if (!rate) {
                throw new Error(`Курс для ${fromCurrency} -> ${toCurrency} не найден`);
            }
            
            const convertedAmount = parseFloat(amount) * rate;
            return Math.round(convertedAmount * 100) / 100;
        } catch (error) {
            console.error(`[CurrencyService] Ошибка конвертации:`, error.message);
            throw error;
        }
    }

    getSupportedCurrencies() {
        return ['USD', 'EUR', 'RUB', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'SEK'];
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = new CurrencyService();