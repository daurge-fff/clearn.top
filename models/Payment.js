const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Сумма, которую фактически заплатил клиент
    amountPaid: { type: Number, required: true },
    // Сумма до применения скидки (для аналитики)
    baseAmount: { type: Number, required: true },
    // Размер скидки в процентах
    discountApplied: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    lessonsPurchased: { type: Number, required: true },
    // Цена за один урок в рамках этой транзакции
    pricePerLesson: { type: Number, required: true },
    paymentSystem: { type: String, required: true },
    transactionType: { type: String, enum: ['25min', '50min', 'Donation', 'Manual'] }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);