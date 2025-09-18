const express = require('express');
const router = express.Router();
const { findUserByIdentifier, creditPaymentToUser } = require('../services/paymentService');
const { notifyAdmin } = require('../services/notificationService');
const Payment = require('../models/Payment');
const bot = require('../bot');
const { ensureAuth, ensureRole } = require('../middleware/auth');

// Lazy load PaymentManager to ensure environment variables are loaded
let paymentManager;
function getPaymentManager() {
    if (!paymentManager) {
        paymentManager = require('../services/payments/PaymentManager');
    }
    return paymentManager;
}

/**
 * Создание платежа через любую платежную систему
 * @route POST /api/payments/create
 */
router.post('/create', async (req, res) => {
    try {
        const { amount, currency, description, paymentSystem, identifier } = req.body;
        const pm = getPaymentManager();

        // Валидация входных данных
        if (!pm.validatePaymentData({ amount, currency, description, identifier, orderId: 'temp' })) {
            return res.status(400).json({ 
                error: 'Missing required fields: amount, currency, description, paymentSystem, identifier' 
            });
        }

        // Проверяем, что провайдер существует
        const provider = pm.getProvider(paymentSystem);
        if (!provider) {
            return res.status(400).json({ 
                error: `Payment system '${paymentSystem}' is not available` 
            });
        }

        // Получаем информацию о провайдере
        const providerInfo = provider.getProviderInfo();
        // Примечание: проверка валюты убрана, так как PaymentManager сам обрабатывает конвертацию

        // Создаем уникальный ID заказа
        const orderId = Date.now().toString();
        
        // Создаем запись о платеже в базе данных
        const pendingPayment = await createPendingPayment({
            amount,
            currency,
            description,
            identifier,
            paymentSystem,
            orderId
        });

        // Создаем платеж через провайдер
        const paymentResult = await pm.createPayment(paymentSystem, {
            amount,
            currency,
            description,
            orderId,
            identifier
        });

        // Уведомляем администратора
        await notifyAdmin(
            `🧾 *New Invoice Created*\n\n` +
            `💰 *Amount:* ${amount} ${currency}\n` +
            `💳 *System:* ${providerInfo.displayName}\n` +
            `👤 *Client:* \`${identifier}\`\n` +
            `📝 *Description:* ${description}\n` +
            `🆔 *Order ID:* \`${orderId}\``
        );

        // Обновляем запись платежа с внешним ID
        if (paymentResult.externalId) {
            pendingPayment.externalId = paymentResult.externalId;
            await pendingPayment.save();
        }

        // Формируем ответ
        const response = {
            success: true,
            orderId,
            provider: providerInfo.displayName,
            isManual: providerInfo.isManual
        };

        if (paymentResult.paymentUrl) {
            response.paymentUrl = paymentResult.paymentUrl;
        }

        if (paymentResult.instructions) {
            response.instructions = paymentResult.instructions;
        }

        if (providerInfo.isManual) {
            // Используем конвертированные данные из paymentResult, если они есть
            const instructionData = {
                amount: paymentResult.convertedAmount || amount,
                currency: paymentResult.convertedCurrency || currency,
                orderId,
                identifier,
                originalAmount: amount,
                originalCurrency: currency
            };
            response.manualInstructions = pm.getPaymentInstructions(
                paymentSystem, 
                instructionData,
                'en' // TODO: определять язык из запроса
            );
        }

        res.json(response);

    } catch (error) {
        console.error('[Payments] Error creating payment:', error);
        
        await notifyAdmin(
            `🔥 *Invoice Creation Failed*\n\n` +
            `💳 *System:* ${req.body.paymentSystem}\n` +
            `👤 *Client:* \`${req.body.identifier}\`\n` +
            `❗️ *Error:* \`${error.message}\``
        );

        res.status(500).json({ 
            error: 'Failed to create payment invoice',
            details: error.message 
        });
    }
});

/**
 * Получение списка доступных платежных систем
 * @route GET /api/payments/providers
 */
router.get('/providers', (req, res) => {
    try {
        const { currency } = req.query;
        const pm = getPaymentManager();
        
        let providers;
        if (currency) {
            providers = pm.getProvidersByCurrency(currency);
        } else {
            providers = pm.getAvailableProviders();
        }

        res.json({
            success: true,
            providers: providers.map(provider => ({
                name: provider.name,
                displayName: provider.displayName,
                supportedCurrencies: provider.supportedCurrencies,
                isManual: provider.isManual,
                requiresManualConfirmation: provider.requiresManualConfirmation
            }))
        });
    } catch (error) {
        console.error('[Payments] Error getting providers:', error);
        res.status(500).json({ error: 'Failed to get payment providers' });
    }
});

/**
 * Специальный обработчик для Betatransfer webhook
 * @route POST /api/payments/betatransfer/webhook
 */
router.post('/betatransfer/webhook', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        console.log('[Betatransfer] Received webhook notification:', req.body);
        
        // Обрабатываем уведомление через менеджер
        const pm = getPaymentManager();
        const result = await pm.handleNotification('betatransfer', req.body, req.headers);
        
        if (result.success && result.orderId) {
            // Находим платеж в базе данных
            const payment = await Payment.findOne({ 
                $or: [
                    { externalId: result.orderId },
                    { orderId: result.orderId }
                ]
            });
            
            if (payment && payment.status !== 'completed') {
                // Обновляем статус платежа
                payment.status = 'completed';
                
                // Привязываем к пользователю, если еще не привязан
                if (!payment.userId) {
                    const user = await findUserByIdentifier(payment.pendingIdentifier);
                    if (user) {
                        payment.userId = user._id;
                        console.log(`Auto-linked Betatransfer payment ${payment._id} to user ${user.email}`);
                    }
                }
                
                await payment.save();
                
                // Начисляем уроки пользователю
                if (payment.userId) {
                    await creditPaymentToUser(payment);
                    
                    await notifyAdmin(
                        `✅ *Successful Payment (Betatransfer)*\n\n` +
                        `💰 *Amount:* ${payment.amount} ${payment.currency}\n` +
                        `👤 *Client:* \`${payment.pendingIdentifier}\`\n` +
                        `🆔 *Order:* \`${result.orderId}\`\n` +
                        `✅ *Status:* Payment processed and lessons credited`
                    );
                } else {
                    await notifyAdmin(
                        `⚠️ *Successful Payment (Betatransfer) - Needs Linking*\n\n` +
                        `💰 *Amount:* ${payment.amount} ${payment.currency}\n` +
                        `👤 *Client:* \`${payment.pendingIdentifier}\`\n` +
                        `🆔 *Order:* \`${result.orderId}\`\n\n` +
                        `Please link this payment to a user manually.`
                    );
                }
            }
        }
        
        res.send('OK');
        
    } catch (error) {
        console.error('[Betatransfer] Webhook processing error:', error);
        res.status(500).send('ERROR');
    }
});

/**
 * Специальный обработчик для Robokassa Result URL
 * @route POST /api/payments/robokassa/result
 */
router.post('/robokassa/result', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const { OutSum, InvId, SignatureValue } = req.body;
        
        console.log('[Robokassa] Received result notification:', req.body);
        
        // Обрабатываем уведомление через менеджер
        const pm = getPaymentManager();
        const result = await pm.handleNotification('robokassa', req.body, req.headers);
        
        if (result.success && result.orderId) {
            // Находим платеж в базе данных
            const payment = await Payment.findOne({ 
                $or: [
                    { robokassaInvoiceId: result.orderId },
                    { externalId: result.orderId },
                    { orderId: result.orderId }
                ]
            });
            
            if (payment && payment.status !== 'completed') {
                // Обновляем статус платежа
                payment.status = 'completed';
                
                // Привязываем к пользователю, если еще не привязан
                if (!payment.userId) {
                    const user = await findUserByIdentifier(payment.pendingIdentifier);
                    if (user) {
                        payment.userId = user._id;
                        console.log(`Auto-linked Robokassa payment ${payment._id} to user ${user.email}`);
                    }
                }
                
                await payment.save();
                
                // Начисляем уроки пользователю
                if (payment.userId) {
                    await creditPaymentToUser(payment);
                    
                    await notifyAdmin(
                        `✅ *Successful Payment (Robokassa)*\n\n` +
                        `💰 *Amount:* ${result.amount} RUB\n` +
                        `👤 *Client:* \`${payment.pendingIdentifier}\`\n` +
                        `🆔 *Order:* \`${result.orderId}\`\n` +
                        `✅ *Status:* Payment processed and lessons credited`
                    );
                } else {
                    await notifyAdmin(
                        `⚠️ *Successful Payment (Robokassa) - Needs Linking*\n\n` +
                        `💰 *Amount:* ${payment.amount} ${payment.currency}\n` +
                        `👤 *Client:* \`${payment.pendingIdentifier}\`\n` +
                        `🆔 *Order:* \`${result.orderId}\`\n\n` +
                        `Please link this payment to a user manually.`
                    );
                }
            }
        }
        
        res.send('OK');
        
    } catch (error) {
        console.error('[Robokassa] Result processing error:', error);
        res.status(500).send('ERROR');
    }
});

/**
 * Обработка уведомлений от платежных систем
 * @route POST /api/payments/webhook/:provider
 */
router.post('/webhook/:provider', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const providerName = req.params.provider;
        const headers = req.headers;
        
        // Парсим данные в зависимости от типа контента
        let notificationData;
        if (req.headers['content-type']?.includes('application/json')) {
            notificationData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } else {
            notificationData = req.body;
        }

        console.log(`[Payments] Received webhook from ${providerName}:`, notificationData);

        // Обрабатываем уведомление через менеджер
        const pm = getPaymentManager();
        const result = await pm.handleNotification(providerName, notificationData, headers);

        if (result.success && result.orderId) {
            // Находим платеж в базе данных
            const payment = await Payment.findOne({ 
                $or: [
                    { robokassaInvoiceId: result.orderId },
                    { externalId: result.orderId },
                    { orderId: result.orderId }
                ]
            });

            if (payment && payment.status !== 'completed') {
                // Обновляем статус платежа
                payment.status = 'completed';
                
                // Привязываем к пользователю, если еще не привязан
                if (!payment.userId) {
                    const user = await findUserByIdentifier(payment.pendingIdentifier);
                    if (user) {
                        payment.userId = user._id;
                        console.log(`Auto-linked ${providerName} payment ${payment._id} to user ${user.email}`);
                    }
                }

                await payment.save();

                // Начисляем уроки пользователю
                if (payment.userId) {
                    const creditResult = await creditPaymentToUser(payment);
                    if (creditResult.success) {
                        const displayAmount = providerName === 'robokassa' ? `${result.amount} RUB` : `${result.amount} ${result.currency || payment.currency}`;
                        await notifyAdmin(
                            `✅ *Successful Payment (${pm.getProvider(providerName).getDisplayName()})*\n\n` +
                            `*Amount:* ${displayAmount}\n` +
                            `*Client:* \`${payment.pendingIdentifier}\`\n` +
                            `*User:* ${creditResult.user.name}\n` +
                            `*Action:* ${payment.lessonsPurchased} lesson(s) credited. New balance: *${creditResult.user.lessonsPaid}* lessons.`
                        );
                    }
                } else {
                    await notifyAdmin(
                        `⚠️ *Successful Payment (${pm.getProvider(providerName).getDisplayName()}) - Needs Linking*\n\n` +
                        `*Amount:* ${result.amount} ${result.currency || payment.currency}\n` +
                        `*Client:* \`${payment.pendingIdentifier}\`\n` +
                        `*Order:* \`${result.orderId}\`\n\n` +
                        `Please link this payment to a user manually.`
                    );
                }
            }
        }

        res.sendStatus(200);

    } catch (error) {
        console.error(`[Payments] Webhook error for ${req.params.provider}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

/**
 * Подтверждение ручного платежа
 * @route POST /api/payments/manual-confirm
 */
router.post('/manual-confirm', async (req, res) => {
    try {
        const { orderId, transactionId, paymentSystem, amount, currency, identifier } = req.body;

        if (!orderId || !transactionId || !paymentSystem || !amount || !identifier) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Проверяем, что это ручной провайдер
        const pm = getPaymentManager();
        if (!pm.isManualProvider(paymentSystem)) {
            return res.status(400).json({ error: 'This payment system does not support manual confirmation' });
        }

        // Проверяем, что платеж существует
        const existingPayment = await Payment.findOne({
            $or: [
                { robokassaInvoiceId: orderId },
                { externalId: orderId },
                { orderId: orderId }
            ]
        });

        if (!existingPayment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (existingPayment.status !== 'pending') {
            return res.status(400).json({ error: 'Payment is not in pending status' });
        }

        // Проверяем, что Transaction ID не использовался ранее
        const duplicatePayment = await Payment.findOne({
            paypalOrderID: transactionId,
            _id: { $ne: existingPayment._id }
        });

        if (duplicatePayment) {
            return res.status(400).json({ error: 'This Transaction ID has already been used' });
        }

        // Обновляем платеж
        existingPayment.status = 'manual_review';
        existingPayment.paypalOrderID = transactionId;
        existingPayment.paymentSystem = `${paymentSystem} (Manual)`;
        await existingPayment.save();

        // Отправляем уведомление администратору
        const provider = pm.getProvider(paymentSystem);
        const providerName = provider ? provider.getDisplayName() : paymentSystem;

        try {
            await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID,
                `⚠️ *Manual ${providerName} Confirmation*\n\n` +
                `A user claims to have paid. Please verify this transaction in your ${providerName} account.\n\n` +
                `💰 *Amount:* ${amount} ${currency}\n` +
                `👤 *Client:* \`${identifier}\`\n` +
                `🧾 *Transaction Ref:* \`${transactionId}\`\n` +
                `🆔 *Order ID:* \`${orderId}\``,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "✅ Approve", callback_data: `payment_approve_${existingPayment._id}` },
                                { text: "❌ Decline", callback_data: `payment_decline_${existingPayment._id}` }
                            ]
                        ]
                    }
                }
            );
        } catch (telegramError) {
            console.error('Failed to send manual payment notification to admin:', telegramError.message);
        }

        res.json({
            success: true,
            message: 'Your payment confirmation has been received and is awaiting review.',
            orderId,
            status: 'manual_review'
        });

    } catch (error) {
        console.error('[Payments] Error confirming manual payment:', error);
        
        await notifyAdmin(
            `🔥 *Error on Manual Payment Confirmation*\n\n` +
            `*System:* ${req.body.paymentSystem}\n` +
            `*Order ID:* \`${req.body.orderId}\`\n` +
            `*Transaction ID:* \`${req.body.transactionId}\`\n` +
            `*Error:* ${error.message}`
        );

        res.status(500).json({ 
            error: 'Server error while submitting your confirmation',
            details: error.message 
        });
    }
});

/**
 * Создает запись о платеже в базе данных
 */
async function createPendingPayment(details) {
    const { amount, currency, description, identifier, paymentSystem, orderId } = details;
    const user = await findUserByIdentifier(identifier);
    
    let lessonsPurchased = 0;
    if (description && !description.toLowerCase().includes('donation')) {
        const match = description.match(/x(\d+)/);
        lessonsPurchased = (match && match[1]) ? parseInt(match[1], 10) : 1;
    }
    
    const pricePerLesson = lessonsPurchased > 0 ? (parseFloat(amount) / lessonsPurchased) : 0;
    
    return await Payment.create({
        userId: user ? user._id : null,
        pendingIdentifier: identifier.trim().toLowerCase(),
        orderId: orderId, // Наш внутренний ID заказа
        robokassaInvoiceId: orderId, // Для обратной совместимости
        status: 'pending',
        amountPaid: amount,
        baseAmount: amount,
        currency: currency || 'EUR',
        lessonsPurchased: lessonsPurchased,
        pricePerLesson: pricePerLesson,
        paymentSystem: paymentSystem,
        transactionType: description.toLowerCase().includes('donation') ? 'Donation' : '50min'
    });
}

module.exports = router;