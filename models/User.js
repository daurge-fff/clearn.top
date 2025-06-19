const mongoose = require('mongoose');

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
        date: { type: Date, default: Date.now },
        change: Number,
        balanceAfter: Number,
        reason: String
    }],
    date_registered: {
        type: Date,
        default: Date.now
    }
});

UserSchema.pre('save', function(next) {
    if (this.isModified('botState') && this.botState.name) {
        this.botState.updatedAt = new Date();
    }
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;