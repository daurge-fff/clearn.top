const axios = require('axios');

class CurrencyService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000;
        
        // Несколько API источников для надежности
        this.apiSources = [
            {
                name: 'exchangerate-api',
                url: (base) => `https://api.exchangerate-api.com/v4/latest/${base}`,
                parseResponse: (data) => data.rates
            },
            {
                name: 'fixer',
                url: (base) => `https://api.fixer.io/latest?base=${base}`,
                parseResponse: (data) => data.rates
            },
            {
                name: 'currencyapi',
                url: (base) => `https://api.currencyapi.com/v3/latest?base_currency=${base}`,
                parseResponse: (data) => {
                    const rates = {};
                    for (const [currency, info] of Object.entries(data.data || {})) {
                        rates[currency] = info.value;
                    }
                    return rates;
                }
            }
        ];
        
        // Обновленные fallback курсы (актуальные на декабрь 2024)
        this.fallbackRates = {
            'USD': { 'RUB': 98, 'EUR': 0.92, 'UAH': 41 },
            'EUR': { 'RUB': 107, 'USD': 1.09, 'UAH': 45 },
            'RUB': { 'USD': 0.0102, 'EUR': 0.0093, 'UAH': 0.42 },
            'UAH': { 'USD': 0.024, 'EUR': 0.022, 'RUB': 2.39 }
        };
    }

    async getExchangeRates(baseCurrency) {
        const cacheKey = baseCurrency.toUpperCase();
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`[CurrencyService] Используем кэшированные курсы для ${baseCurrency}`);
            return cached.rates;
        }

        // Пробуем каждый API источник по очереди
        for (const source of this.apiSources) {
            try {
                console.log(`[CurrencyService] Пробуем API: ${source.name}`);
                const response = await axios.get(source.url(baseCurrency), {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'CurrencyService/1.0'
                    }
                });
                
                const rates = source.parseResponse(response.data);
                
                if (rates && Object.keys(rates).length > 0) {
                    console.log(`[CurrencyService] Успешно получены курсы от ${source.name}`);
                    
                    this.cache.set(cacheKey, {
                        rates,
                        timestamp: Date.now(),
                        source: source.name
                    });
                    
                    return rates;
                }
            } catch (error) {
                console.warn(`[CurrencyService] API ${source.name} недоступен:`, error.message);
                continue;
            }
        }
        
        // Если все API недоступны, используем fallback курсы
        console.warn(`[CurrencyService] Все API недоступны, используем fallback курсы для ${baseCurrency}`);
        const fallbackRates = this.fallbackRates[baseCurrency.toUpperCase()] || {};
        
        // Кэшируем fallback курсы на короткое время
        this.cache.set(cacheKey, {
            rates: fallbackRates,
            timestamp: Date.now(),
            source: 'fallback'
        });
        
        return fallbackRates;
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        fromCurrency = fromCurrency.toUpperCase();
        toCurrency = toCurrency.toUpperCase();
        
        console.log(`[CurrencyService] Конвертация: ${amount} ${fromCurrency} -> ${toCurrency}`);
        
        if (fromCurrency === toCurrency) {
            console.log(`[CurrencyService] Валюты одинаковые, возвращаем исходную сумму`);
            return parseFloat(amount);
        }
        
        try {
            const rates = await this.getExchangeRates(fromCurrency);
            const rate = rates[toCurrency];
            
            console.log(`[CurrencyService] Курс ${fromCurrency}/${toCurrency}:`, rate);
            
            if (!rate || rate <= 0) {
                // Пробуем обратную конвертацию
                console.log(`[CurrencyService] Прямой курс не найден, пробуем обратную конвертацию`);
                const reverseRates = await this.getExchangeRates(toCurrency);
                const reverseRate = reverseRates[fromCurrency];
                
                if (reverseRate && reverseRate > 0) {
                    const convertedAmount = parseFloat(amount) / reverseRate;
                    const result = Math.round(convertedAmount * 100) / 100;
                    console.log(`[CurrencyService] Обратная конвертация успешна: ${result} ${toCurrency}`);
                    return result;
                }
                
                throw new Error(`Курс для ${fromCurrency} -> ${toCurrency} не найден`);
            }
            
            const convertedAmount = parseFloat(amount) * rate;
            const result = Math.round(convertedAmount * 100) / 100;
            console.log(`[CurrencyService] Результат конвертации: ${result} ${toCurrency}`);
            return result;
        } catch (error) {
            console.error(`[CurrencyService] Ошибка конвертации ${fromCurrency} -> ${toCurrency}:`, error.message);
            throw error;
        }
    }

    getSupportedCurrencies() {
        return ['USD', 'EUR', 'RUB', 'UAH', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'SEK'];
    }
    
    // Метод для тестирования конвертации
    async testConversion() {
        console.log('[CurrencyService] Тестирование конвертации...');
        try {
            const eurToRub = await this.convertCurrency(10, 'EUR', 'RUB');
            const eurToUah = await this.convertCurrency(10, 'EUR', 'UAH');
            console.log(`[CurrencyService] Тест: 10 EUR = ${eurToRub} RUB, ${eurToUah} UAH`);
            return { eurToRub, eurToUah };
        } catch (error) {
            console.error('[CurrencyService] Ошибка тестирования:', error.message);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = new CurrencyService();