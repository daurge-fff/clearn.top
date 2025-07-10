const User = require('../models/User');
const Payment = require('../models/Payment');
const { notifyAdmin } = require('./notificationService');

/**
 * Находит пользователя по email, telegram или имени, нечувствительно к регистру.
 * @param {string} identifier - email, telegram username или имя
 * @returns {Promise<User|null>}
 */
async function findUserByIdentifier(identifier) {
    if (!identifier) return null;

    const trimmedIdentifier = identifier.trim();

    const escapedIdentifier = trimmedIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    const searchRegex = new RegExp(`^${escapedIdentifier}$`, 'i');

    let contactIdentifier = trimmedIdentifier.toLowerCase();
    if (contactIdentifier.startsWith('@')) {
        contactIdentifier = contactIdentifier.substring(1);
    }
    const escapedContact = contactIdentifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const contactRegex = new RegExp(`^${escapedContact}$`, 'i');

    console.log(`[DEBUG] Исходный идентификатор: "${trimmedIdentifier}"`);
    console.log(`[DEBUG] Ищем по email/name: ${searchRegex}`);
    console.log(`[DEBUG] Ищем по contact: ${contactRegex}`);

    const user = await User.findOne({
        $or: [
            { email: searchRegex },
            { name: searchRegex },
            { contact: searchRegex }, // Ищет с @, если так сохранено
            { contact: contactRegex }  // Ищет без @
        ]
    });
    
    if (user) {
        console.log(`[DEBUG] Пользователь НАЙДЕН: ${user.name} (${user.email})`);
    } else {
        console.log(`[DEBUG] Пользователь НЕ НАЙДЕН.`);
    }

    return user;
}

/**
 * Начисляет уроки пользователю на основе данных из платежного документа
 * @param {Payment} payment - Документ платежа из Mongoose
 * @returns {Promise<void>}
 */
async function creditPaymentToUser(payment) {
    if (!payment.userId) return;
    
    const user = await User.findById(payment.userId);
    if (!user) {
        console.error(`User with ID ${payment.userId} not found for crediting payment ${payment._id}.`);
        return;
    }

    const newBalance = user.lessonsPaid + payment.lessonsPurchased;
    user.lessonsPaid = newBalance;
    
    user.balanceHistory.push({
        change: +payment.lessonsPurchased,
        balanceAfter: newBalance,
        reason: `Payment via ${payment.paymentSystem}`,
        amountPaid: payment.amountPaid,
        currency: payment.currency,
        transactionType: payment.transactionType,
        paymentId: payment._id
    });
    
    await user.save();
    console.log(`Credited ${payment.lessonsPurchased} lessons to user ${user.email}. New balance: ${newBalance}.`);
    return { success: true, user: user.toObject() };
}

/**
 * Ищет "ожидающие" платежи по данным нового пользователя и привязывает их
 * @param {User} user - Только что созданный пользователь
 * @returns {Promise<void>}
 */
async function claimPendingPaymentsForUser(user) {
    const identifiers = [user.email, user.contact].filter(Boolean).map(id => id.trim().toLowerCase().replace('@', ''));
    if (identifiers.length === 0) return;

    const pendingPayments = await Payment.find({
        userId: null,
        status: 'completed',
        pendingIdentifier: { $in: identifiers }
    });

    if (pendingPayments.length === 0) return;

    console.log(`Found ${pendingPayments.length} pending payment(s) for new user ${user.email}.`);

    for (const payment of pendingPayments) {
        payment.userId = user._id;
        await payment.save();
        await creditPaymentToUser(payment); 
    }
}

async function approvePayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) return { success: false, error: 'Payment not found.' };
    if (payment.status !== 'manual_review') return { success: false, error: `Payment is already in status: ${payment.status}` };
    
    let userWasFound = !!payment.userId;

    if (!userWasFound) {
        const user = await findUserByIdentifier(payment.pendingIdentifier);
        if (user) {
            payment.userId = user._id;
            userWasFound = true;
            console.log(`Auto-linked payment ${payment._id} for '${payment.pendingIdentifier}' to user ${user.email}`);
        } else {
            console.log(`Could not find a user for identifier '${payment.pendingIdentifier}' during approval.`);
        }
    }

    payment.status = 'completed';
    await payment.save();

    if (userWasFound) {
        const creditResult = await creditPaymentToUser(payment);
        if (!creditResult.success) throw new Error("Failed to credit payment to user.");
        const user = await User.findById(payment.userId).lean();
        await notifyAdmin(
            `✅ *Payment Approved & Linked*\n\n` +
            `*Client:* \`${payment.pendingIdentifier}\`\n` +
            `*User:* ${user.name}\n` +
            `*Amount:* ${payment.amountPaid} ${payment.currency}\n` +
            `*Action:* ${payment.lessonsPurchased} lesson(s) credited. New balance: *${user.lessonsPaid}* lessons.`
        );
    } else {
        await notifyAdmin(
            `⚠️ *Payment Approved, Linking FAILED*\n\n` +
            `*Client:* \`${payment.pendingIdentifier}\`\n` +
            `*Amount:* ${payment.amountPaid} ${payment.currency}\n` +
            `*Action:* Payment status is 'completed', but no user was found. *Please link it manually in the dashboard.*`
        );
    }

    return { success: true, payment };
}

/**
 * Отклоняет платеж, находящийся на ручной проверке.
 * @param {string} paymentId - ID платежа для отклонения.
 * @returns {Promise<{success: boolean, payment?: object, error?: string}>}
 */
async function declinePayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) return { success: false, error: 'Payment not found.' };
    if (payment.status !== 'manual_review') return { success: false, error: `Payment is already in status: ${payment.status}` };

    payment.status = 'failed';
    await payment.save();
    
    await notifyAdmin(`❌ *Payment Declined*\n\n*Client:* \`${payment.pendingIdentifier}\`\n*Amount:* ${payment.amountPaid} ${payment.currency}\n*Declined by:* Admin`);

    return { success: true, payment };
}

module.exports = { 
    findUserByIdentifier,
    creditPaymentToUser,
    claimPendingPaymentsForUser,
    approvePayment,
    declinePayment
};