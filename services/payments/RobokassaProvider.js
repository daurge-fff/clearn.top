const PaymentProvider = require('./PaymentProvider');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Провайдер для интеграции с Robokassa
 * Поддерживает автоматическое создание платежей и обработку уведомлений
 * Полностью переписан согласно официальной документации Robokassa
 */
class RobokassaProvider extends PaymentProvider {
    constructor(config = {}) {
        super();
        this.config = config;
        this.merchantLogin = config.merchantLogin;
        this.testMode = config.testMode || false;
        
        // Правильная логика выбора паролей согласно документации
        if (this.testMode) {
            // В тестовом режиме используем тестовые пароли
            this.password1 = config.testPassword1 || process.env.ROBOKASSA_TEST_PASS_1;
            this.password2 = config.testPassword2 || process.env.ROBOKASSA_TEST_PASS_2;
        } else {
            // В боевом режиме используем боевые пароли
            this.password1 = config.password1 || process.env.ROBOKASSA_PASS_1;
            this.password2 = config.password2 || process.env.ROBOKASSA_PASS_2;
        }
        
        this.hashAlgorithm = 'md5'; // Robokassa использует только MD5
        this.baseUrl = 'https://auth.robokassa.ru/Merchant';
        
        // Robokassa provider initialized
        
        if (!this.merchantLogin || !this.password1 || !this.password2) {
            throw new Error('Robokassa: merchantLogin, password1 and password2 are required');
        }
    }

    getDisplayName() {
        return this.config.name || 'Robokassa';
    }

    getSupportedCurrencies() {
        return this.config.currencies || ['RUB'];
    }

    isManualProvider() {
        return this.config.type === 'manual';
    }

    async createPayment(paymentData) {
        if (!this.validatePaymentData(paymentData)) {
            throw new Error('Invalid payment data');
        }

        console.log(`[Robokassa] Received payment data:`, {
            amount: paymentData.amount,
            currency: paymentData.currency,
            originalAmount: paymentData.originalAmount,
            originalCurrency: paymentData.originalCurrency
        });

        const orderId = this.generateOrderId();
        const amount = this.formatAmount(paymentData.amount);
        const currency = paymentData.currency || 'RUB'; // Используем RUB по умолчанию
        const description = paymentData.description || `Оплата ${paymentData.lessonsPurchased || 1} уроков`;
        
        console.log(`[Robokassa] Using amount: ${amount}, currency: ${currency}`);
        
        // Creating Robokassa payment
        
        // Создание подписи согласно документации Robokassa
        // Формат для создания платежа: MerchantLogin:OutSum:InvId:Пароль#1
        const signatureString = `${this.merchantLogin}:${amount}:${orderId}:${this.password1}`;
        const signature = this.createHash(signatureString);
        
        // Signature generated
        
        // Параметры для URL согласно документации
        const urlParams = {
            MerchantLogin: this.merchantLogin,
            OutSum: amount,
            InvId: orderId,
            Description: description, // Не кодируем здесь, будем кодировать при формировании URL
            SignatureValue: signature,
            Culture: 'ru',
            Encoding: 'utf-8',
            SuccessURL: `${process.env.BASE_URL || 'https://clearn.top'}/successful-payment`,
            FailURL: `${process.env.BASE_URL || 'https://clearn.top'}/failed-payment`
        };
        
        // Добавляем OutSumCurrency только если валюта не RUB (по умолчанию RUB)
        if (currency && currency !== 'RUB') {
            urlParams.OutSumCurrency = currency;
        }
        
        // В боевом режиме НЕ добавляем IsTest
        // В тестовом режиме добавляем IsTest=1
        if (this.testMode) {
            urlParams.IsTest = '1';
        }
        
        // Формируем URL вручную для правильного кодирования
        const params = Object.entries(urlParams)
            .map(([key, value]) => {
                // Кодируем значения, особенно Description
                const encodedValue = key === 'Description' ? encodeURIComponent(value) : value;
                return `${key}=${encodedValue}`;
            })
            .join('&');
        const paymentUrl = `${this.baseUrl}/Index.aspx?${params}`;
        
        console.log(`[Robokassa] Payment URL: ${paymentUrl}`);

        return {
            success: true,
            orderId: orderId,
            externalId: orderId,
            paymentUrl: paymentUrl,
            amount: amount,
            currency: currency,
            metadata: {
                merchantLogin: this.merchantLogin,
                signature: signature,
                testMode: this.testMode
            }
        };
    }

    async handleNotification(data) {
        try {
            const { OutSum, InvId, SignatureValue } = data;
            
            if (!OutSum || !InvId || !SignatureValue) {
                throw new Error('Missing required notification parameters: OutSum, InvId, SignatureValue');
            }
            
            // Проверка подписи для Result URL согласно документации
            // Формат для уведомлений: OutSum:InvId:Пароль#2
            const signatureString = `${OutSum}:${InvId}:${this.password2}`;
            const expectedSignature = this.createHash(signatureString);
            
            if (!SignatureValue || SignatureValue.toLowerCase() !== expectedSignature.toLowerCase()) {
                console.error(`[Robokassa] Signature mismatch! Expected: ${expectedSignature}, Got: ${SignatureValue}`);
                throw new Error(`Invalid signature. Expected: ${expectedSignature}, Got: ${SignatureValue}`);
            }

            return {
                success: true,
                orderId: InvId,
                externalId: InvId,
                amount: parseFloat(OutSum),
                status: 'completed',
                transactionId: InvId,
                metadata: {
                    robokassaData: data,
                    testMode: this.testMode
                }
            };
        } catch (error) {
            console.error('[Robokassa] Notification error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkPaymentStatus(externalId) {
        // Robokassa не предоставляет простой API для проверки статуса
        // Статус обновляется только через уведомления
        return {
            success: true,
            status: 'pending',
            message: 'Status updates only via notifications'
        };
    }

    validatePaymentData(data) {
        return data && 
               typeof data.amount === 'number' && 
               data.amount > 0 &&
               data.currency &&
               data.description;
    }

    formatAmount(amount) {
        return parseFloat(amount).toFixed(2);
    }

    generateOrderId() {
        return Date.now().toString();
    }

    createHash(data) {
        return crypto.createHash(this.hashAlgorithm).update(data, 'utf8').digest('hex');
    }


}

module.exports = RobokassaProvider;