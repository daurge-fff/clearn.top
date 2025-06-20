const User = require('../models/User');
const Payment = require('../models/Payment');

/**
 * Обрабатывает успешный платеж, обновляет баланс уроков пользователя и создает запись о транзакции.
 * @param {object} paymentDetails - Объект с деталями платежа.
 * @param {string} paymentDetails.userId - ID пользователя, совершившего платеж.
 * @param {number} paymentDetails.amountPaid - Фактически уплаченная сумма.
 * @param {number} paymentDetails.lessonsPurchased - Количество купленных уроков.
 * @param {string} paymentDetails.paymentSystem - Название платежной системы (e.g., 'PayPal', 'Robokassa', 'Manual').
 * @param {string} [paymentDetails.transactionType] - Тип транзакции, соответствует enum в модели Payment.
 * @param {number} [paymentDetails.baseAmount] - Сумма до применения скидки (опционально).
 * @param {number} [paymentDetails.discountApplied] - Размер скидки в процентах (опционально).
 * @returns {Promise<{success: boolean, error?: string}>} - Возвращает объект с результатом операции.
 */
async function processSuccessfulPayment(paymentDetails) {
    try {
        const { 
            userId, 
            amountPaid, 
            lessonsPurchased, 
            paymentSystem,
            transactionType = 'Manual',
            baseAmount, 
            discountApplied 
        } = paymentDetails;

        if (!userId || !amountPaid || !lessonsPurchased || !paymentSystem) {
            throw new Error('Missing required payment details: userId, amountPaid, lessonsPurchased, or paymentSystem.');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found during payment processing.`);
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
            transactionType,
            baseAmount: baseAmount || amountPaid,
            discountApplied: discountApplied || 0,
            pricePerLesson: lessonsPurchased > 0 ? (amountPaid / lessonsPurchased) : 0
        });

        console.log(`Successfully processed payment for user ${userId}.`);
        return { success: true };

    } catch (error) {
        console.error("Error processing payment:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { processSuccessfulPayment };