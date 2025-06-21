const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    pendingIdentifier: { type: String, trim: true, lowercase: true, index: true },
    paypalOrderID: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    amountPaid: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    lessonsPurchased: { type: Number, required: true },
    pricePerLesson: { type: Number, required: true },
    paymentSystem: { type: String, required: true },
    transactionType: { type: String, enum: ['25min', '50min', 'Donation', 'Manual'] }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);