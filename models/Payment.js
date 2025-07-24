const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    pendingIdentifier: { type: String, trim: true, lowercase: true, index: true },
    
    // Универсальные поля для всех платежных систем
    externalId: { type: String, sparse: true, index: true }, // Внешний ID от платежной системы
    orderId: { type: String, unique: true, sparse: true, index: true }, // Наш внутренний ID заказа
    
    // Устаревшие поля (для обратной совместимости)
    paypalOrderID: { type: String, unique: true, sparse: true }, // Can be Transaction ID for manual payments
    robokassaInvoiceId: { type: String, unique: true, sparse: true },
    
    status: { type: String, enum: ['pending', 'completed', 'failed', 'manual_review'], default: 'pending' },
    amountPaid: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    lessonsPurchased: { type: Number, required: true },
    pricePerLesson: { type: Number, required: true },
    paymentSystem: { type: String, required: true },
    transactionType: { type: String, enum: ['25min', '50min', 'Donation', 'Manual'] },
    
    // Дополнительные метаданные
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Для хранения специфичных данных провайдера
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Кто обработал платеж (для ручных)
    notes: { type: String } // Заметки администратора
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);