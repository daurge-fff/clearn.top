const PaymentProvider = require('./PaymentProvider');

/**
 * Провайдер для Monobank (копилки)
 * Это ручной провайдер, так как копилки Monobank не имеют автоматических уведомлений
 */
class MonobankProvider extends PaymentProvider {
    constructor(config = {}) {
        super();
        this.config = config;
        this.jarUrl = config.jarUrl;
        
        if (!this.jarUrl) {
            throw new Error('Monobank: jarUrl is required');
        }
    }

    getDisplayName() {
        return 'Monobank';
    }

    getSupportedCurrencies() {
        return ['UAH', 'EUR', 'USD'];
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

        if (!this.jarUrl) {
            throw new Error('Monobank jar URL is not configured');
        }

        // Для Monobank копилок мы просто возвращаем URL копилки
        // Пользователь должен будет вручную отправить деньги и указать reference
        return {
            paymentUrl: this.jarUrl,
            externalId: paymentData.orderId,
            instructions: {
                ua: `Переведіть ${paymentData.amount} ${paymentData.currency} на копилку Monobank та вкажіть в коментарі: ${paymentData.orderId}`,
                en: `Transfer ${paymentData.amount} ${paymentData.currency} to Monobank jar and specify in comment: ${paymentData.orderId}`,
                ru: `Переведите ${paymentData.amount} ${paymentData.currency} на копилку Monobank и укажите в комментарии: ${paymentData.orderId}`
            }
        };
    }

    async handleNotification(notificationData, headers) {
        // Monobank копилки не отправляют автоматические уведомления
        // Все платежи должны обрабатываться вручную
        throw new Error('Monobank jar payments require manual confirmation');
    }

    async checkPaymentStatus(externalId) {
        // Для копилок Monobank нет API для проверки статуса
        // Все проверки должны выполняться вручную администратором
        throw new Error('Monobank jar payments require manual status verification');
    }

    /**
     * Генерирует инструкции для пользователя
     * @param {Object} paymentData
     * @param {string} language - Язык инструкций (ua, en, ru)
     * @returns {string}
     */
    getPaymentInstructions(paymentData, language = 'en') {
        const instructions = {
            ua: [
                `1. Перейдіть за посиланням: ${this.jarUrl}`,
                `2. Переведіть ${paymentData.amount} ${paymentData.currency}`,
                `3. В коментарі обов'язково вкажіть: ${paymentData.orderId}`,
                `4. Після переказу поверніться на сайт та підтвердіть платіж`
            ],
            en: [
                `1. Follow the link: ${this.jarUrl}`,
                `2. Transfer ${paymentData.amount} ${paymentData.currency}`,
                `3. In the comment, be sure to specify: ${paymentData.orderId}`,
                `4. After the transfer, return to the site and confirm the payment`
            ],
            ru: [
                `1. Перейдите по ссылке: ${this.jarUrl}`,
                `2. Переведите ${paymentData.amount} ${paymentData.currency}`,
                `3. В комментарии обязательно укажите: ${paymentData.orderId}`,
                `4. После перевода вернитесь на сайт и подтвердите платеж`
            ]
        };

        return instructions[language] || instructions.en;
    }

    /**
     * Проверяет, содержит ли комментарий правильный ID заказа
     * @param {string} comment - Комментарий к переводу
     * @param {string} orderId - ID заказа
     * @returns {boolean}
     */
    validatePaymentComment(comment, orderId) {
        if (!comment || !orderId) return false;
        return comment.toLowerCase().includes(orderId.toLowerCase());
    }

    getProviderInfo() {
        return {
            id: 'monobank',
            name: this.config.name || 'Monobank',
            type: this.config.type || 'manual',
            currencies: this.config.currencies || ['UAH'],
            description: this.config.description || 'Перевод на карту Monobank (копилка)'
        };
    }
}

module.exports = MonobankProvider;