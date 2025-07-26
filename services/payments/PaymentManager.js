const RobokassaProvider = require('./RobokassaProvider');
const CryptocloudProvider = require('./CryptocloudProvider');
const MonobankProvider = require('./MonobankProvider');
const PaypalProvider = require('./PaypalProvider');
const PayoneerProvider = require('./PayoneerProvider');
const ManualBankProvider = require('./ManualBankProvider');
const paymentConfig = require('../../config/payments');
const currencyService = require('../currencyService');

class PaymentManager {
    constructor() {
        this.providers = new Map();
        this.config = paymentConfig;
        this.initializeProviders();
    }

    initializeProviders() {
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
        
        // manual_bank provider removed

        console.log(`[PaymentManager] Initialized ${this.providers.size} payment providers:`, 
            Array.from(this.providers.keys()).join(', '));
    }

    getProvider(providerName) {
        return this.providers.get(providerName.toLowerCase()) || null;
    }

    getAvailableProviders() {
        return Array.from(this.providers.entries()).map(([name, provider]) => ({
            name,
            ...provider.getProviderInfo()
        }));
    }

    getProvidersByCurrency(currency) {
        return this.getAvailableProviders().filter(provider => 
            provider.supportedCurrencies.includes(currency.toUpperCase())
        );
    }

    async createPayment(providerName, paymentData) {
        const provider = this.getProvider(providerName);
        if (!provider) {
            throw new Error(`Payment provider '${providerName}' not found or not configured`);
        }

        try {
            const supportedCurrencies = provider.getSupportedCurrencies();
            let processedPaymentData = { ...paymentData };
            
            console.log(`[PaymentManager] Provider ${providerName} supports currencies:`, supportedCurrencies);
            console.log(`[PaymentManager] Payment currency: ${paymentData.currency}`);
            
            if (!supportedCurrencies.includes(paymentData.currency)) {
                const targetCurrency = supportedCurrencies[0];
                
                console.log(`[PaymentManager] Converting ${paymentData.amount} ${paymentData.currency} to ${targetCurrency}`);
                
                const convertedAmount = await currencyService.convertCurrency(
                    paymentData.amount,
                    paymentData.currency,
                    targetCurrency
                );
                
                processedPaymentData.amount = convertedAmount;
                processedPaymentData.currency = targetCurrency;
                processedPaymentData.originalAmount = paymentData.amount;
                processedPaymentData.originalCurrency = paymentData.currency;
                
                console.log(`[PaymentManager] Converted to ${convertedAmount} ${targetCurrency}`);
            }

            const result = await provider.createPayment(processedPaymentData);
            const response = {
                success: true,
                provider: providerName,
                ...result
            };
            
            // Добавляем информацию о конвертации, если она была выполнена
            if (processedPaymentData.originalAmount && processedPaymentData.originalCurrency) {
                response.convertedAmount = processedPaymentData.amount;
                response.convertedCurrency = processedPaymentData.currency;
                response.originalAmount = processedPaymentData.originalAmount;
                response.originalCurrency = processedPaymentData.originalCurrency;
            }
            
            return response;
        } catch (error) {
            console.error(`[PaymentManager] Error creating payment with ${providerName}:`, error.message);
            throw new Error(`Failed to create payment: ${error.message}`);
        }
    }

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

    isManualProvider(providerName) {
        const provider = this.getProvider(providerName);
        return provider ? provider.isManualProvider() : false;
    }

    addProvider(name, provider) {
        this.providers.set(name.toLowerCase(), provider);
        console.log(`[PaymentManager] Added new provider: ${name}`);
    }

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