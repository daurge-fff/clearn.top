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
        default: 'active' // e.g., active, inactive, paused
    },
    lessonsPaid: {
        type: Number,
        default: 0
    },
    teacher: { // The primary teacher assigned to the student
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // --- Teacher-specific fields ---
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    specialization: [String],

    date_registered: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;