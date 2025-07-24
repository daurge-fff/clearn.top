const PaymentProvider = require('./PaymentProvider');

class ManualBankProvider extends PaymentProvider {
    constructor(config = {}) {
        super();
        this.config = config;
        this.paymentMethods = config.paymentMethods || [];
        
        if (!this.paymentMethods.length) {
            throw new Error('ManualBank: At least one payment method is required');
        }
    }

    getDisplayName() {
        return this.config.displayName || 'Manual Bank Transfer';
    }

    getSupportedCurrencies() {
        return this.config.currencies || ['UAH', 'EUR', 'USD', 'RUB'];
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

        const selectedMethod = this.selectPaymentMethod(paymentData.currency);
        if (!selectedMethod) {
            throw new Error(`No payment method available for currency: ${paymentData.currency}`);
        }

        return {
            paymentUrl: selectedMethod.url,
            externalId: paymentData.orderId,
            method: selectedMethod,
            instructions: this.generateInstructions(paymentData, selectedMethod)
        };
    }

    selectPaymentMethod(currency) {
        const availableMethods = this.paymentMethods.filter(method => 
            !method.currencies || method.currencies.includes(currency)
        );
        
        return availableMethods.length > 0 ? availableMethods[0] : this.paymentMethods[0];
    }

    generateInstructions(paymentData, method) {
        const baseInstructions = {
            ua: [
                `1. Перейдіть за посиланням: ${method.url}`,
                `2. Переведіть ${paymentData.amount} ${paymentData.currency}`,
                `3. В коментарі обов'язково вкажіть: ${paymentData.orderId}`,
                `4. Після переказу поверніться на сайт та підтвердіть платіж`
            ],
            en: [
                `1. Follow the link: ${method.url}`,
                `2. Transfer ${paymentData.amount} ${paymentData.currency}`,
                `3. In the comment, be sure to specify: ${paymentData.orderId}`,
                `4. After the transfer, return to the site and confirm the payment`
            ],
            ru: [
                `1. Перейдите по ссылке: ${method.url}`,
                `2. Переведите ${paymentData.amount} ${paymentData.currency}`,
                `3. В комментарии обязательно укажите: ${paymentData.orderId}`,
                `4. После перевода вернитесь на сайт и подтвердите платеж`
            ]
        };

        if (method.customInstructions) {
            Object.keys(baseInstructions).forEach(lang => {
                if (method.customInstructions[lang]) {
                    baseInstructions[lang] = method.customInstructions[lang]
                        .map(instruction => instruction
                            .replace('{amount}', paymentData.amount)
                            .replace('{currency}', paymentData.currency)
                            .replace('{orderId}', paymentData.orderId)
                            .replace('{url}', method.url)
                        );
                }
            });
        }

        return baseInstructions;
    }

    async handleNotification(notificationData, headers) {
        throw new Error('Manual bank transfers require manual confirmation');
    }

    async checkPaymentStatus(externalId) {
        throw new Error('Manual bank transfers require manual status verification');
    }

    getPaymentInstructions(paymentData, language = 'en') {
        const selectedMethod = this.selectPaymentMethod(paymentData.currency);
        const instructions = this.generateInstructions(paymentData, selectedMethod);
        return instructions[language] || instructions.en;
    }

    validatePaymentComment(comment, orderId) {
        if (!comment || !orderId) return false;
        return comment.toLowerCase().includes(orderId.toLowerCase());
    }

    getProviderInfo() {
        return {
            id: 'manual_bank',
            name: this.config.name || 'Manual Bank Transfer',
            type: 'manual',
            currencies: this.getSupportedCurrencies(),
            description: this.config.description || 'Manual bank transfer with admin confirmation',
            paymentMethods: this.paymentMethods.map(method => ({
                name: method.name,
                description: method.description,
                currencies: method.currencies
            }))
        };
    }

    getAvailablePaymentMethods(currency = null) {
        if (!currency) {
            return this.paymentMethods;
        }
        
        return this.paymentMethods.filter(method => 
            !method.currencies || method.currencies.includes(currency)
        );
    }
}

module.exports = ManualBankProvider;