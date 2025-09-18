const PaymentProvider = require('./PaymentProvider');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Провайдер для интеграции с Betatransfer
 * Поддерживает автоматическое создание платежей для европейского рынка
 * Документация: https://docs.betatransfer.io/api/v-1
 */
class BetatransferProvider extends PaymentProvider {
    constructor(config = {}) {
        super();
        this.config = config;
        this.publicKey = config.publicKey || process.env.BETATRANSFER_PUBLIC_KEY;
        this.secretKey = config.secretKey || process.env.BETATRANSFER_SECRET_KEY;
        this.paymentSystem = config.paymentSystem || process.env.PAYMENT_SYSTEM || 'Card8';
        this.currency = config.currency || process.env.CURRENCY || 'EUR';
        this.baseUrl = 'https://merchant.betatransfer.io/api';
        
        if (!this.publicKey || !this.secretKey) {
            throw new Error('Betatransfer: publicKey and secretKey are required');
        }
    }

    getDisplayName() {
        return 'Betatransfer';
    }

    getSupportedCurrencies() {
        return ['EUR', 'USD'];
    }

    isManualProvider() {
        return false;
    }

    async createPayment(paymentData) {
        if (!this.validatePaymentData(paymentData)) {
            throw new Error('Invalid payment data');
        }

        const amount = Math.max(10, Math.min(15000, parseFloat(paymentData.amount)));
        const orderId = paymentData.orderId;
        const payerId = paymentData.identifier || `user_${Date.now()}`;
        
        console.log(`[Betatransfer] Creating payment:`, {
            amount,
            currency: this.currency,
            paymentSystem: this.paymentSystem,
            orderId,
            payerId
        });

        try {
            const requestData = {
                amount: amount.toString(),
                currency: paymentData.currency || this.currency,
                orderId: orderId,
                paymentSystem: this.paymentSystem,
                payerId: payerId
            };

            // Создание подписи согласно документации Betatransfer
            const signature = this.createSignature(requestData);
            requestData.sign = signature;

            console.log(`[Betatransfer] Request data:`, requestData);

            const response = await axios({
                method: 'post',
                url: `${this.baseUrl}/payment`,
                data: requestData,
                params: {
                    token: this.publicKey
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000
            });

            console.log(`[Betatransfer] Response:`, response.data);

            if (response.data && response.data.url) {
                return {
                    paymentUrl: response.data.url,
                    externalId: response.data.id || orderId,
                    convertedAmount: amount,
                    convertedCurrency: this.currency
                };
            } else {
                throw new Error(`Betatransfer API error: ${response.data?.error || 'Unknown error'}`);
            }

        } catch (error) {
            console.error('[Betatransfer] Payment creation error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers,
                params: error.config?.params
            });
            
            // Показываем детали ошибки
            if (error.response?.data?.errors) {
                console.error('[Betatransfer] Detailed errors:', error.response.data.errors);
            }
            
            // Если это ошибка с валютами, показываем понятное сообщение
            if (error.response?.status === 422 && error.response?.data?.errors?.currency) {
                const currencyError = error.response.data.errors.currency[0];
                if (currencyError.includes('No available payment system for currency')) {
                    throw new Error('Betatransfer account is not configured for any currencies. Please contact your account manager to enable payment processing.');
                }
            }
            
            throw new Error(`Failed to create Betatransfer payment: ${error.response?.status} ${error.response?.statusText}`);
        }
    }

    async handleNotification(data, headers) {
        console.log('[Betatransfer] Received notification:', data);
        
        try {
            // Проверяем подпись уведомления
            const expectedSignature = this.createNotificationSignature(data);
            
            if (data.signature !== expectedSignature) {
                console.error('[Betatransfer] Invalid signature in notification');
                return { success: false, error: 'Invalid signature' };
            }

            // Проверяем статус платежа
            if (data.status === 'success' || data.status === 'completed') {
                return {
                    success: true,
                    orderId: data.order_id,
                    amount: parseFloat(data.amount),
                    currency: data.currency,
                    externalId: data.payment_id
                };
            } else {
                console.log(`[Betatransfer] Payment not completed, status: ${data.status}`);
                return { success: false, status: data.status };
            }

        } catch (error) {
            console.error('[Betatransfer] Notification handling error:', error);
            return { success: false, error: error.message };
        }
    }

    async checkPaymentStatus(externalId) {
        try {
            const requestData = {
                public_key: this.publicKey,
                payment_id: externalId
            };

            const signature = this.createSignature(requestData);
            requestData.signature = signature;

            const response = await axios.post(`${this.baseUrl}/payment-status`, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            if (response.data.status === 'success') {
                return {
                    status: response.data.payment_status === 'completed' ? 'completed' : 'pending',
                    amount: parseFloat(response.data.amount)
                };
            } else {
                return { status: 'failed' };
            }

        } catch (error) {
            console.error('[Betatransfer] Status check error:', error);
            return { status: 'unknown' };
        }
    }

    /**
     * Создает подпись для запроса согласно документации Betatransfer
     * @param {Object} data - Данные для подписи
     * @returns {string} - Подпись
     */
    createSignature(data) {
        // Создаем строку для подписи согласно документации Betatransfer
        const values = Object.keys(data).filter(key => key !== 'sign').map(key => data[key]);
        const signatureString = values.join('') + this.secretKey;
        
        return crypto.createHash('md5').update(signatureString).digest('hex');
    }

    /**
     * Создает подпись для уведомления
     * @param {Object} data - Данные уведомления
     * @returns {string} - Подпись
     */
    createNotificationSignature(data) {
        const signatureString = `${data.order_id}${data.amount}${data.currency}${data.status}${this.secretKey}`;
        return crypto.createHash('sha256').update(signatureString).digest('hex');
    }

    validatePaymentData(data) {
        const required = ['amount', 'orderId', 'identifier'];
        const isValid = required.every(field => data[field] !== undefined && data[field] !== null);
        
        if (isValid) {
            const amount = parseFloat(data.amount);
            if (amount < 10 || amount > 15000) {
                console.warn(`[Betatransfer] Amount ${amount} is outside allowed range (10-15000)`);
                return false;
            }
        }
        
        return isValid;
    }

    formatAmount(amount) {
        return Math.round(parseFloat(amount) * 100) / 100; // Округляем до 2 знаков
    }

    getProviderInfo() {
        return {
            ...super.getProviderInfo(),
            regions: ['EU', 'IN', 'JP', 'KR', 'BR', 'MX', 'AR', 'CIS', 'UA', 'KG', 'KZ', 'AZ', 'TJ', 'UZ'],
            preferredRegion: 'EU',
            minAmount: 10,
            maxAmount: 15000
        };
    }
}

module.exports = BetatransferProvider;