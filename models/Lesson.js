const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
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
    lessonDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 50
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled_by_student', 'cancelled_by_teacher', 'no_show'],
        default: 'scheduled'
    },
    topic: {
        type: String,
        default: 'Scheduled Lesson'
    },
    homework: {
        type: String
    },
    notes: { 
        type: String
    },
    recordingUrl: {
        type: String
    },
    cancellationReason: {
        type: String
    },
    homework: { type: String },
    teacherAttachment: {
        path: String,
        filename: String
    },
    studentAttachment: {
        path: String,
        filename: String
    },
    homeworkStatus: {
        type: String,
        enum: ['pending', 'submitted', 'checked'],
        default: 'pending'
    },
    difficulty: String 
}, { timestamps: true }); 

const Lesson = mongoose.model('Lesson', LessonSchema);

module.exports = Lesson;