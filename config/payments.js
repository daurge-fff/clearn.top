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
        currencies: ['RUB', 'USD', 'EUR'],
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
        enabled: true,
        type: 'manual',
        currencies: ['UAH'],
        name: 'Monobank',
        description: 'Перевод на карту Monobank (копилка)'
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

    // Настройки ручных банковских переводов
    manual_bank: {
        enabled: true,
        type: 'manual',
        currencies: ['UAH', 'EUR', 'USD', 'RUB'],
        name: 'Bank Transfer',
        displayName: 'Банковский перевод',
        description: 'Ручной банковский перевод с подтверждением администратора',
        paymentMethods: [
            {
                name: 'Monobank Jar',
                description: 'Копилка Monobank',
                url: 'https://send.monobank.ua/jar/5LRNnQJPXQ',
                currencies: ['UAH', 'EUR', 'USD'],
                customInstructions: {
                    ua: [
                        '1. Перейдіть за посиланням: {url}',
                        '2. Переведіть {amount} {currency}',
                        '3. В коментарі обов\'язково вкажіть: {orderId}',
                        '4. Після переказу напишіть в Telegram @your_bot_username для підтвердження'
                    ],
                    en: [
                        '1. Follow the link: {url}',
                        '2. Transfer {amount} {currency}',
                        '3. In the comment, be sure to specify: {orderId}',
                        '4. After transfer, write to Telegram @your_bot_username for confirmation'
                    ],
                    ru: [
                        '1. Перейдите по ссылке: {url}',
                        '2. Переведите {amount} {currency}',
                        '3. В комментарии обязательно укажите: {orderId}',
                        '4. После перевода напишите в Telegram @your_bot_username для подтверждения'
                    ]
                }
            },
            {
                name: 'PrivatBank',
                description: 'Карта PrivatBank',
                url: 'https://privatbank.ua',
                currencies: ['UAH'],
                customInstructions: {
                    ua: [
                        '1. Переведіть {amount} {currency} на карту: 4149 4991 0123 4567',
                        '2. В коментарі вкажіть: {orderId}',
                        '3. Надішліть скріншот переказу в Telegram @your_bot_username'
                    ],
                    en: [
                        '1. Transfer {amount} {currency} to card: 4149 4991 0123 4567',
                        '2. In comment specify: {orderId}',
                        '3. Send transfer screenshot to Telegram @your_bot_username'
                    ],
                    ru: [
                        '1. Переведите {amount} {currency} на карту: 4149 4991 0123 4567',
                        '2. В комментарии укажите: {orderId}',
                        '3. Отправьте скриншот перевода в Telegram @your_bot_username'
                    ]
                }
            },
            {
                name: 'IBAN Transfer',
                description: 'IBAN перевод',
                url: '#',
                currencies: ['EUR', 'USD'],
                customInstructions: {
                    ua: [
                        '1. Переведіть {amount} {currency} на IBAN: UA123456789012345678901234567',
                        '2. Отримувач: ФОП Іваненко І.І.',
                        '3. Призначення платежу: {orderId}',
                        '4. Надішліть підтвердження в Telegram @your_bot_username'
                    ],
                    en: [
                        '1. Transfer {amount} {currency} to IBAN: UA123456789012345678901234567',
                        '2. Recipient: FOP Ivanenko I.I.',
                        '3. Payment purpose: {orderId}',
                        '4. Send confirmation to Telegram @your_bot_username'
                    ],
                    ru: [
                        '1. Переведите {amount} {currency} на IBAN: UA123456789012345678901234567',
                        '2. Получатель: ФОП Иваненко И.И.',
                        '3. Назначение платежа: {orderId}',
                        '4. Отправьте подтверждение в Telegram @your_bot_username'
                    ]
                }
            }
        ]
    },

    // Общие настройки
    general: {
        defaultCurrency: 'EUR',
        manualPaymentTimeout: 24 * 60 * 60 * 1000, // 24 часа в миллисекундах
        automaticPaymentTimeout: 30 * 60 * 1000, // 30 минут в миллисекундах
        enabledProviders: ['robokassa', 'cryptocloud', 'monobank', 'paypal', 'payoneer', 'manual_bank']
    }
};