const User = require('../models/User');
const Payment = require('../models/Payment');

/**
 * Обрабатывает успешный платеж, обновляет баланс и историю пользователя.
 * @param {object} paymentDetails - Объект с деталями платежа.
 * @param {string} paymentDetails.userId - ID пользователя, совершившего платеж.
 * @param {number} paymentDetails.amountPaid - Фактически уплаченная сумма.
 * @param {number} paymentDetails.lessonsPurchased - Количество купленных уроков.
 * @param {string} paymentDetails.paymentSystem - Название платежной системы (e.g., 'PayPal', 'Robokassa').
 * @param {number} [paymentDetails.baseAmount] - Сумма до скидки (опционально).
 * @param {number} [paymentDetails.discountApplied] - Скидка в % (опционально).
 */
async function processSuccessfulPayment(paymentDetails) {
    try {
        const { userId, amountPaid, lessonsPurchased, paymentSystem, baseAmount, discountApplied } = paymentDetails;

        const user = await User.findById(userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found.`);
        }

        const newBalance = user.lessonsPaid + lessonsPurchased;
        user.lessonsPaid = newBalance;
        user.balanceHistory.push({
            change: +lessonsPurchased,
            balanceAfter: newBalance,
            reason: `Payment: +${lessonsPurchased} lessons via ${paymentSystem}`
        });
        await user.save();

        await Payment.create({
            userId,
            amountPaid,
            lessonsPurchased,
            paymentSystem,
            baseAmount: baseAmount || amountPaid,
            discountApplied: discountApplied || 0,
            pricePerLesson: amountPaid / lessonsPurchased
        });

        console.log(`Successfully processed payment for user ${userId}.`);
        return { success: true };

    } catch (error) {
        console.error("Error processing payment:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { processSuccessfulPayment };