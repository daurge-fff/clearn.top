const PaymentProvider = require('./PaymentProvider');

/**
 * Провайдер для PayPal (ручные платежи)
 * Используется для обработки ручных переводов через PayPal
 */
class PaypalProvider extends PaymentProvider {
    constructor(config = {}) {
        super();
        this.config = config;
        this.email = config.email;
        
        if (!this.email) {
            throw new Error('PayPal: email is required');
        }
    }

    getDisplayName() {
        return 'PayPal';
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
            throw new Error('PayPal email is not configured');
        }

        // Создаем ссылку для отправки денег через PayPal
        const paypalUrl = `https://www.paypal.com/paypalme/${this.email.replace('@', '').replace('.', '')}/${paymentData.amount}${paymentData.currency}`;
        
        return {
            paymentUrl: paypalUrl,
            externalId: paymentData.orderId,
            instructions: {
                ua: `Переведіть ${paymentData.amount} ${paymentData.currency} на PayPal ${this.email} та вкажіть в коментарі: ${paymentData.orderId}`,
                en: `Transfer ${paymentData.amount} ${paymentData.currency} to PayPal ${this.email} and specify in comment: ${paymentData.orderId}`,
                ru: `Переведите ${paymentData.amount} ${paymentData.currency} на PayPal ${this.email} и укажите в комментарии: ${paymentData.orderId}`
            },
            email: this.email
        };
    }

    async handleNotification(notificationData, headers) {
        // PayPal ручные платежи не отправляют автоматические уведомления
        // Все платежи должны обрабатываться вручную
        throw new Error('PayPal manual payments require manual confirmation');
    }

    async checkPaymentStatus(externalId) {
        // Для ручных PayPal платежей нет API для проверки статуса
        // Все проверки должны выполняться вручную администратором
        throw new Error('PayPal manual payments require manual status verification');
    }

    /**
     * Генерирует инструкции для пользователя
     * @param {Object} paymentData
     * @param {string} language - Язык инструкций (ua, en, ru)
     * @returns {string[]}
     */
    getPaymentInstructions(paymentData, language = 'en') {
        const paypalUrl = `https://www.paypal.com/paypalme/${this.email.replace('@', '').replace('.', '')}/${paymentData.amount}${paymentData.currency}`;
        
        const instructions = {
            ua: [
                `1. Перейдіть за посиланням: ${paypalUrl}`,
                `2. Або переведіть ${paymentData.amount} ${paymentData.currency} на email: ${this.email}`,
                `3. В коментарі обов'язково вкажіть: ${paymentData.orderId}`,
                `4. Після переказу поверніться на сайт та підтвердіть платіж, вказавши Transaction ID`
            ],
            en: [
                `1. Follow the link: ${paypalUrl}`,
                `2. Or transfer ${paymentData.amount} ${paymentData.currency} to email: ${this.email}`,
                `3. In the comment, be sure to specify: ${paymentData.orderId}`,
                `4. After the transfer, return to the site and confirm the payment by specifying Transaction ID`
            ],
            ru: [
                `1. Перейдите по ссылке: ${paypalUrl}`,
                `2. Или переведите ${paymentData.amount} ${paymentData.currency} на email: ${this.email}`,
                `3. В комментарии обязательно укажите: ${paymentData.orderId}`,
                `4. После перевода вернитесь на сайт и подтвердите платеж, указав Transaction ID`
            ]
        };

        return instructions[language] || instructions.en;
    }

    /**
     * Валидирует Transaction ID PayPal
     * @param {string} transactionId
     * @returns {boolean}
     */
    validateTransactionId(transactionId) {
        if (!transactionId) return false;
        // PayPal Transaction ID обычно имеет формат: 1AB23456CD789012E
        return /^[A-Z0-9]{17}$/.test(transactionId.toUpperCase());
    }

    getProviderInfo() {
        return {
            id: 'paypal',
            name: this.config.name || 'PayPal',
            type: this.config.type || 'manual',
            currencies: this.config.currencies || ['USD', 'EUR'],
            description: this.config.description || 'Перевод через PayPal'
        };
    }
}

module.exports = PaypalProvider;