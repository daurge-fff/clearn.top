const PaymentProvider = require('./PaymentProvider');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Провайдер для CryptoCloud
 */
class CryptocloudProvider extends PaymentProvider {
    constructor(config = {}) {
        super();
        this.config = config;
        this.shopId = config.shopId;
        this.apiKey = config.apiKey;
        this.baseUrl = 'https://api.cryptocloud.plus/v1';
        
        if (!this.shopId || !this.apiKey) {
            throw new Error('CryptoCloud: shopId and apiKey are required');
        }
    }

    getDisplayName() {
        return 'CryptoCloud';
    }

    getSupportedCurrencies() {
        return ['EUR', 'USD', 'RUB'];
    }

    getProviderInfo() {
        return {
            name: this.config.name || 'cryptocloud',
            displayName: this.getDisplayName(),
            supportedCurrencies: this.getSupportedCurrencies(),
            isManual: this.isManualProvider(),
            requiresManualConfirmation: this.requiresManualConfirmation()
        };
    }

    async createPayment(paymentData) {
        if (!this.validatePaymentData(paymentData)) {
            throw new Error('Invalid payment data');
        }

        try {
            const response = await axios.post(`${this.baseUrl}/invoice/create`, {
                shop_id: this.shopId,
                amount: this.formatAmount(paymentData.amount),
                order_id: String(paymentData.orderId),
                currency: paymentData.currency,
                email: paymentData.identifier.includes('@') ? paymentData.identifier : undefined
            }, {
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                return {
                    paymentUrl: response.data.pay_url,
                    externalId: response.data.invoice_id
                };
            } else {
                throw new Error(response.data.message || 'CryptoCloud API returned an error');
            }
        } catch (error) {
            if (error.response) {
                throw new Error(`CryptoCloud API error: ${error.response.data.message || error.response.statusText}`);
            }
            throw new Error(`CryptoCloud request failed: ${error.message}`);
        }
    }

    async handleNotification(notificationData, headers) {
        try {
            const signature = headers['sign'];
            if (!signature) {
                throw new Error('Missing signature header');
            }

            // Проверяем подпись
            const calculatedSignature = crypto
                .createHmac('sha256', this.apiKey)
                .update(JSON.stringify(notificationData))
                .digest('hex');

            if (signature !== calculatedSignature) {
                throw new Error('Invalid signature');
            }

            if (notificationData.status === 'success') {
                return {
                    success: true,
                    orderId: notificationData.order_id,
                    amount: parseFloat(notificationData.amount_crypto),
                    currency: notificationData.currency,
                    externalId: notificationData.invoice_id
                };
            }

            return {
                success: false,
                orderId: notificationData.order_id,
                status: notificationData.status
            };
        } catch (error) {
            throw new Error(`CryptoCloud notification processing failed: ${error.message}`);
        }
    }

    async checkPaymentStatus(externalId) {
        try {
            const response = await axios.get(`${this.baseUrl}/invoice/info`, {
                params: {
                    shop_id: this.shopId,
                    invoice_id: externalId
                },
                headers: {
                    'Authorization': `Token ${this.apiKey}`
                }
            });

            if (response.data.status === 'success') {
                const invoice = response.data.invoice;
                return {
                    status: invoice.status,
                    amount: parseFloat(invoice.amount),
                    currency: invoice.currency
                };
            } else {
                throw new Error(response.data.message || 'Failed to get invoice info');
            }
        } catch (error) {
            if (error.response) {
                throw new Error(`CryptoCloud API error: ${error.response.data.message || error.response.statusText}`);
            }
            throw new Error(`CryptoCloud status check failed: ${error.message}`);
        }
    }
}

module.exports = CryptocloudProvider;