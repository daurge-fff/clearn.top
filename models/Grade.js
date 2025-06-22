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
    },
    comment: {
        type: String
    },
    isProjectGrade: { type: Boolean, default: false }
}, { timestamps: true });

const Grade = mongoose.model('Grade', GradeSchema);

module.exports = Grade;