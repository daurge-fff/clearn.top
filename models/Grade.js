const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
    lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true,
        unique: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    comment: {
        type: String
    }
}, { timestamps: true });

const Grade = mongoose.model('Grade', GradeSchema);

module.exports = Grade;