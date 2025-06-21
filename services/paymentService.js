const User = require('../models/User');
const Payment = require('../models/Payment');

/**
 * Находит пользователя по email или telegram
 * @param {string} identifier - email или telegram username
 * @returns {Promise<User|null>}
 */
async function findUserByIdentifier(identifier) {
    if (!identifier) return null;
    const normalizedIdentifier = identifier.trim().toLowerCase().replace('@', '');
    
    return await User.findOne({
        $or: [
            { email: normalizedIdentifier },
            { contact: normalizedIdentifier }
        ]
    });
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
        reason: `Payment: +${payment.lessonsPurchased} lessons via ${payment.paymentSystem}`
    });
    
    await user.save();
    console.log(`Credited ${payment.lessonsPurchased} lessons to user ${user.email}. New balance: ${newBalance}.`);
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


module.exports = { 
    findUserByIdentifier,
    creditPaymentToUser,
    claimPendingPaymentsForUser 
};