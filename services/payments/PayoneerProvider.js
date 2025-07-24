const PaymentProvider = require('./PaymentProvider');

/**
 * Провайдер для Payoneer (ручные платежи)
 * Используется для обработки ручных переводов через Payoneer
 */
class PayoneerProvider extends PaymentProvider {
    constructor(config = {}) {
        super();
        this.config = config;
        this.email = config.email;
        
        if (!this.email) {
            throw new Error('Payoneer: email is required');
        }
    }

    getDisplayName() {
        return 'Payoneer';
    }

    getProviderInfo() {
        return {
            id: 'payoneer',
            name: this.config.name || 'Payoneer',
            type: this.config.type || 'manual',
            currencies: this.config.currencies || ['USD', 'EUR'],
            description: this.config.description || 'Перевод через Payoneer'
        };
    }

    getSupportedCurrencies() {
        return ['EUR', 'USD', 'GBP'];
    }

    isManualProvider() {
        return true;
    }

    requiresManualConfirmation() {
        return true;
    }

    async createPayment(paymentData) {
        if (!this.validatePaymentData(paymentData)) {
            throw new Error('Invalid payment data');
        }

        if (!this.email) {
            throw new Error('Payoneer email is not configured');
        }

        // Для Payoneer нет прямых ссылок, только инструкции
        return {
            paymentUrl: null, // Нет прямой ссылки
            externalId: paymentData.orderId,
            instructions: {
                ua: `Переведіть ${paymentData.amount} ${paymentData.currency} на Payoneer ${this.email} та вкажіть в коментарі: ${paymentData.orderId}`,
                en: `Transfer ${paymentData.amount} ${paymentData.currency} to Payoneer ${this.email} and specify in comment: ${paymentData.orderId}`,
                ru: `Переведите ${paymentData.amount} ${paymentData.currency} на Payoneer ${this.email} и укажите в комментарии: ${paymentData.orderId}`
            },
            email: this.email
        };
    }

    async handleNotification(notificationData, headers) {
        // Payoneer ручные платежи не отправляют автоматические уведомления
        // Все платежи должны обрабатываться вручную
        throw new Error('Payoneer manual payments require manual confirmation');
    }

    async checkPaymentStatus(externalId) {
        // Для ручных Payoneer платежей нет API для проверки статуса
        // Все проверки должны выполняться вручную администратором
        throw new Error('Payoneer manual payments require manual status verification');
    }

    /**
     * Генерирует инструкции для пользователя
     * @param {Object} paymentData
     * @param {string} language - Язык инструкций (ua, en, ru)
     * @returns {string[]}
     */
    getPaymentInstructions(paymentData, language = 'en') {
        const instructions = {
            ua: [
                `1. Увійдіть в свій акаунт Payoneer`,
                `2. Переведіть ${paymentData.amount} ${paymentData.currency} на email: ${this.email}`,
                `3. В коментарі обов'язково вкажіть: ${paymentData.orderId}`,
                `4. Після переказу поверніться на сайт та підтвердіть платіж, вказавши Transaction ID`
            ],
            en: [
                `1. Log in to your Payoneer account`,
                `2. Transfer ${paymentData.amount} ${paymentData.currency} to email: ${this.email}`,
                `3. In the comment, be sure to specify: ${paymentData.orderId}`,
                `4. After the transfer, return to the site and confirm the payment by specifying Transaction ID`
            ],
            ru: [
                `1. Войдите в свой аккаунт Payoneer`,
                `2. Переведите ${paymentData.amount} ${paymentData.currency} на email: ${this.email}`,
                `3. В комментарии обязательно укажите: ${paymentData.orderId}`,
                `4. После перевода вернитесь на сайт и подтвердите платеж, указав Transaction ID`
            ]
        };

        return instructions[language] || instructions.en;
    }

    /**
     * Валидирует Transaction ID Payoneer
     * @param {string} transactionId
     * @returns {boolean}
     */
    validateTransactionId(transactionId) {
        if (!transactionId) return false;
        // Payoneer Transaction ID может иметь различные форматы
        // Обычно это числовой ID или буквенно-цифровой код
        return transactionId.length >= 6 && /^[A-Z0-9]+$/i.test(transactionId);
    }
}

module.exports = PayoneerProvider;