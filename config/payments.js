module.exports = {
    // Настройки Robokassa
    robokassa: {
        merchantLogin: process.env.ROBOKASSA_MERCHANT_LOGIN,
        password1: process.env.ROBOKASSA_PASS_1,
        password2: process.env.ROBOKASSA_PASS_2,
        hashAlgorithm: 'md5',
        testMode: process.env.ROBOKASSA_IS_TEST === '1',
        enabled: true,
        type: 'automatic',
        currencies: ['RUB'], // Robokassa работает в рублях
        name: 'Robokassa',
        description: 'Оплата через Robokassa'
    },

    // Настройки CryptoCloud
    cryptocloud: {
        shopId: process.env.CRYPTOCLOUD_SHOP_ID,
        apiKey: process.env.CRYPTOCLOUD_API_KEY,
        enabled: true,
        type: 'automatic', // automatic | manual
        currencies: ['USD', 'EUR', 'RUB'],
        name: 'CryptoCloud',
        description: 'Оплата криптовалютой'
    },

    // Настройки Monobank
    monobank: {
        jarUrl: process.env.MONOBANK_JAR_URL || 'https://send.monobank.ua/jar/5LRNnQJPXQ',
        cardNumber: '4441 1111 2641 9468',
        email: 'admin@clearn.top',
        enabled: true,
        type: 'manual',
        currencies: ['UAH'], // Monobank работает в гривнах
        name: 'Monobank',
        description: 'Transfer via Monobank card or jar link'
    },

    // Настройки PayPal
    paypal: {
        email: process.env.PAYPAL_EMAIL,
        enabled: true,
        type: 'manual',
        currencies: ['USD', 'EUR'],
        name: 'PayPal',
        description: 'Перевод через PayPal'
    },

    // Настройки Payoneer
    payoneer: {
        email: process.env.PAYONEER_EMAIL,
        enabled: true,
        type: 'manual',
        currencies: ['USD', 'EUR'],
        name: 'Payoneer',
        description: 'Перевод через Payoneer'
    },



    // Общие настройки
    general: {
        defaultCurrency: 'EUR',
        manualPaymentTimeout: 24 * 60 * 60 * 1000, // 24 часа в миллисекундах
        automaticPaymentTimeout: 30 * 60 * 1000, // 30 минут в миллисекундах
        enabledProviders: ['robokassa', 'cryptocloud', 'monobank', 'paypal', 'payoneer']
    }
};