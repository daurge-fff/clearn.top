const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
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
    course: {
        type: String, 
        required: true 
    },
    lessonNumber: {
        type: Number, 
        required: true 
    },
    topic: {
        type: String, 
        required: true 
    },
    date: {
        type: Date, 
        required: true 
    },
    duration: {
        type: Number, 
        enum: [25, 50], 
        required: true 
    },
    homework: {
        type: String 
    },
    teacherNotes: {
        type: String 
    },
    recordingUrl: {
        type: String 
    },
    status: {
        type: String, 
        enum: ['completed', 'scheduled', 'cancelled_by_student', 'cancelled_by_teacher'], 
        default: 'scheduled' 
    }
});

module.exports = mongoose.model('Lesson', LessonSchema);