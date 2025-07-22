const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    googleId: {
        type: String
    },
    timeZone: {
        type: String,
        default: 'Europe/Moscow'
    },
    contact: {
        type: String
    },
    role: {
        type: String,
        enum: ['student', 'teacher', 'admin'],
        default: 'student'
    },
    status: {
        type: String,
        default: 'active'
    },
    lessonsPaid: {
        type: Number,
        default: 0
    },
    stars: {
        type: Number,
        default: 0
    },
    teacher: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    specialization: [String],
    telegramChatId: {
        type: String,
        unique: true,
        sparse: true
    },
    botState: {
        name: { type: String },
        context: { type: mongoose.Schema.Types.Mixed, default: {} },
        updatedAt: { type: Date }
    },
    notifications: {
        lessonReminders: { type: Boolean, default: true }
    },
    emojiAvatar: {
        type: String
    },
    balanceHistory: [{
        isStarAdjustment: { type: Boolean },
        starsBalanceAfter: { type: Number },
        lessonsBalanceAfter: { type: Number },
        date: { type: Date, default: Date.now },
        change: Number,
        balanceAfter: Number, // Legacy, to be deprecated
        reason: String,
        amountPaid: Number,
        currency: String,
        transactionType: String,
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }
    }],
    date_registered: {
        type: Date,
        default: Date.now
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralBonuses: {
        type: Number,
        default: 0
    },
    freeReferralLessons: {
        type: Number,
        default: 0
    }
});

UserSchema.pre('save', function(next) {
    if (this.isNew && !this.referralCode) {
        this.referralCode = crypto.randomBytes(5).toString('hex');
    }
    if (this.isModified('botState') && this.botState.name) {
        this.botState.updatedAt = new Date();
    }
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;