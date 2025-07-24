const RobokassaProvider = require('./RobokassaProvider');
const CryptocloudProvider = require('./CryptocloudProvider');
const MonobankProvider = require('./MonobankProvider');
const PaypalProvider = require('./PaypalProvider');
const PayoneerProvider = require('./PayoneerProvider');
const paymentConfig = require('../../config/payments');

/**
 * Менеджер платежных систем
 * Управляет всеми платежными провайдерами и предоставляет единый интерфейс
 */
class PaymentManager {
    constructor() {
        this.providers = new Map();
        this.config = paymentConfig;
        this.initializeProviders();
    }

    /**
     * Инициализирует все платежные провайдеры
     */
    initializeProviders() {
        // Инициализация провайдеров на основе конфигурации
        const { enabledProviders } = this.config.general;
        
        if (enabledProviders.includes('robokassa') && this.config.robokassa.enabled) {
            this.providers.set('robokassa', new RobokassaProvider(this.config.robokassa));
        }
        
        if (enabledProviders.includes('cryptocloud') && this.config.cryptocloud.enabled) {
            this.providers.set('cryptocloud', new CryptocloudProvider(this.config.cryptocloud));
        }
        
        if (enabledProviders.includes('monobank') && this.config.monobank.enabled) {
            this.providers.set('monobank', new MonobankProvider(this.config.monobank));
        }
        
        if (enabledProviders.includes('paypal') && this.config.paypal.enabled) {
            this.providers.set('paypal', new PaypalProvider(this.config.paypal));
        }
        
        if (enabledProviders.includes('payoneer') && this.config.payoneer.enabled) {
            this.providers.set('payoneer', new PayoneerProvider(this.config.payoneer));
        }
        


        console.log(`[PaymentManager] Initialized ${this.providers.size} payment providers:`, 
            Array.from(this.providers.keys()).join(', '));
    }

    /**
     * Получает провайдер по имени
     * @param {string} providerName
     * @returns {PaymentProvider|null}
     */
    getProvider(providerName) {
        return this.providers.get(providerName.toLowerCase()) || null;
    }

    /**
     * Получает список всех доступных провайдеров
     * @returns {Array}
     */
    getAvailableProviders() {
        return Array.from(this.providers.entries()).map(([name, provider]) => ({
            name,
            ...provider.getProviderInfo()
        }));
    }

    /**
     * Получает список провайдеров, поддерживающих определенную валюту
     * @param {string} currency
     * @returns {Array}
     */
    getProvidersByCurrency(currency) {
        return this.getAvailableProviders().filter(provider => 
            provider.supportedCurrencies.includes(currency.toUpperCase())
        );
    }

    /**
     * Создает платеж через указанный провайдер
     * @param {string} providerName
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async createPayment(providerName, paymentData) {
        const provider = this.getProvider(providerName);
        if (!provider) {
            throw new Error(`Payment provider '${providerName}' not found or not configured`);
        }

        try {
            const result = await provider.createPayment(paymentData);
            return {
                success: true,
                provider: providerName,
                ...result
            };
        } catch (error) {
            console.error(`[PaymentManager] Error creating payment with ${providerName}:`, error.message);
            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }

    /**
     * Обрабатывает уведомление о платеже
     * @param {string} providerName
     * @param {Object} notificationData
     * @param {Object} headers
     * @returns {Promise<Object>}
     */
    async handleNotification(providerName, notificationData, headers) {
        const provider = this.getProvider(providerName);
        if (!provider) {
            throw new Error(`Payment provider '${providerName}' not found`);
        }

        try {
            return await provider.handleNotification(notificationData, headers);
        } catch (error) {
            console.error(`[PaymentManager] Error handling notification from ${providerName}:`, error.message);
            throw error;
        }
    }

    /**
     * Проверяет статус платежа
     * @param {string} providerName
     * @param {string} externalId
     * @returns {Promise<Object>}
     */
    async checkPaymentStatus(providerName, externalId) {
        const provider = this.getProvider(providerName);
        if (!provider) {
            throw new Error(`Payment provider '${providerName}' not found`);
        }

        try {
            return await provider.checkPaymentStatus(externalId);
        } catch (error) {
            console.error(`[PaymentManager] Error checking payment status with ${providerName}:`, error.message);
            throw error;
        }
    }

    /**
     * Получает инструкции для ручного платежа
     * @param {string} providerName
     * @param {Object} paymentData
     * @param {string} language
     * @returns {Array|null}
     */
    getPaymentInstructions(providerName, paymentData, language = 'en') {
        const provider = this.getProvider(providerName);
        if (!provider || !provider.isManualProvider()) {
            return null;
        }

        if (typeof provider.getPaymentInstructions === 'function') {
            return provider.getPaymentInstructions(paymentData, language);
        }

        return null;
    }

    /**
     * Проверяет, является ли провайдер ручным
     * @param {string} providerName
     * @returns {boolean}
     */
    isManualProvider(providerName) {
        const provider = this.getProvider(providerName);
        return provider ? provider.isManualProvider() : false;
    }

    /**
     * Добавляет новый провайдер
     * @param {string} name
     * @param {PaymentProvider} provider
     */
    addProvider(name, provider) {
        this.providers.set(name.toLowerCase(), provider);
        console.log(`[PaymentManager] Added new provider: ${name}`);
    }

    /**
     * Удаляет провайдер
     * @param {string} name
     */
    removeProvider(name) {
        const removed = this.providers.delete(name.toLowerCase());
        if (removed) {
            console.log(`[PaymentManager] Removed provider: ${name}`);
        }
        return removed;
    }

    /**
     * Валидирует данные платежа для всех провайдеров
     * @param {Object} paymentData
     * @returns {boolean}
     */
    validatePaymentData(paymentData) {
        const required = ['amount', 'currency', 'description', 'orderId', 'identifier'];
        return required.every(field => 
            paymentData[field] !== undefined && 
            paymentData[field] !== null && 
            paymentData[field] !== ''
        );
    }
}

// Создаем единственный экземпляр менеджера
const paymentManager = new PaymentManager();

module.exports = paymentManager;