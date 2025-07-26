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
        this.cardNumber = config.cardNumber;
        this.email = config.email;
        
        if (!this.jarUrl && !this.cardNumber) {
            throw new Error('Monobank: jarUrl or cardNumber is required');
        }
    }

    getDisplayName() {
        return 'Monobank';
    }

    getSupportedCurrencies() {
        return this.config.currencies || ['UAH'];
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
        const amount = paymentData.amount;
        const currency = paymentData.currency;
        const originalInfo = paymentData.originalAmount && paymentData.originalCurrency 
            ? ` (${paymentData.originalAmount} ${paymentData.originalCurrency})` 
            : '';
            
        return {
            paymentUrl: this.jarUrl,
            externalId: paymentData.orderId,
            cardNumber: this.cardNumber,
            email: this.email,
            instructions: {
                ua: `Переведіть ${amount} ${currency}${originalInfo} на карту Monobank або за посиланням та вкажіть в коментарі: ${paymentData.orderId}`,
                en: `Transfer ${amount} ${currency}${originalInfo} to Monobank card or via link and specify in comment: ${paymentData.orderId}`,
                ru: `Переведите ${amount} ${currency}${originalInfo} на карту Monobank или по ссылке и укажите в комментарии: ${paymentData.orderId}`
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
        // Используем конвертированную сумму, если она есть, иначе исходную
        const amount = paymentData.amount;
        const currency = paymentData.currency;
        const originalInfo = paymentData.originalAmount && paymentData.originalCurrency 
            ? ` (${paymentData.originalAmount} ${paymentData.originalCurrency})` 
            : '';
        
        const instructions = {
            ua: [
                `Переведіть ${amount} ${currency}${originalInfo} на карту:`,
                this.cardNumber,
                `Або скористайтеся посиланням:`,
                this.jarUrl,
                `В коментарі обов'язково вкажіть: ${paymentData.orderId}`,
                `Після переказу підтвердіть платіж, вказавши Transaction ID`
            ],
            en: [
                `Transfer ${amount} ${currency}${originalInfo} to card:`,
                this.cardNumber,
                `Or use the link:`,
                this.jarUrl,
                `In the comment, be sure to specify: ${paymentData.orderId}`,
                `After the transfer, confirm the payment by specifying the Transaction ID`
            ],
            ru: [
                `Переведите ${amount} ${currency}${originalInfo} на карту:`,
                this.cardNumber,
                `Или воспользуйтесь ссылкой:`,
                this.jarUrl,
                `В комментарии обязательно укажите: ${paymentData.orderId}`,
                `После перевода подтвердите платеж, указав Transaction ID`
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
            description: this.config.description || 'Перевод на карту Monobank'
        };
    }
}

module.exports = MonobankProvider;