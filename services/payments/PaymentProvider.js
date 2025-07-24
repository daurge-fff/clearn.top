/**
 * Базовый класс для всех платежных провайдеров
 * Определяет общий интерфейс для работы с платежными системами
 */
class PaymentProvider {
    constructor(config) {
        this.config = config;
        this.name = this.constructor.name.replace('Provider', '').toLowerCase();
    }

    /**
     * Создает платежную ссылку
     * @param {Object} paymentData - Данные платежа
     * @param {number} paymentData.amount - Сумма платежа
     * @param {string} paymentData.currency - Валюта
     * @param {string} paymentData.description - Описание платежа
     * @param {string} paymentData.orderId - ID заказа
     * @param {string} paymentData.identifier - Идентификатор клиента
     * @returns {Promise<{paymentUrl: string, externalId?: string}>}
     */
    async createPayment(paymentData) {
        throw new Error('createPayment method must be implemented by subclass');
    }

    /**
     * Обрабатывает уведомление о платеже
     * @param {Object} notificationData - Данные уведомления
     * @param {Object} headers - Заголовки запроса
     * @returns {Promise<{success: boolean, orderId?: string, amount?: number}>}
     */
    async handleNotification(notificationData, headers) {
        throw new Error('handleNotification method must be implemented by subclass');
    }

    /**
     * Проверяет статус платежа
     * @param {string} externalId - Внешний ID платежа
     * @returns {Promise<{status: string, amount?: number}>}
     */
    async checkPaymentStatus(externalId) {
        throw new Error('checkPaymentStatus method must be implemented by subclass');
    }

    /**
     * Возвращает информацию о провайдере
     * @returns {Object}
     */
    getProviderInfo() {
        return {
            name: this.name,
            displayName: this.getDisplayName(),
            supportedCurrencies: this.getSupportedCurrencies(),
            isManual: this.isManualProvider(),
            requiresManualConfirmation: this.requiresManualConfirmation()
        };
    }

    /**
     * Возвращает отображаемое имя провайдера
     * @returns {string}
     */
    getDisplayName() {
        return this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }

    /**
     * Возвращает поддерживаемые валюты
     * @returns {string[]}
     */
    getSupportedCurrencies() {
        return ['EUR', 'USD'];
    }

    /**
     * Является ли провайдер ручным (требует ручного подтверждения)
     * @returns {boolean}
     */
    isManualProvider() {
        return false;
    }

    /**
     * Требует ли провайдер ручного подтверждения платежей
     * @returns {boolean}
     */
    requiresManualConfirmation() {
        return this.isManualProvider();
    }

    /**
     * Валидирует данные платежа
     * @param {Object} paymentData
     * @returns {boolean}
     */
    validatePaymentData(paymentData) {
        const required = ['amount', 'currency', 'description', 'orderId', 'identifier'];
        return required.every(field => paymentData[field] !== undefined && paymentData[field] !== null);
    }

    /**
     * Форматирует сумму для провайдера
     * @param {number} amount
     * @returns {string|number}
     */
    formatAmount(amount) {
        return Number(amount).toFixed(2);
    }
}

module.exports = PaymentProvider;