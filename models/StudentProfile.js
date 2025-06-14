const mongoose = require('mongoose');

const StudentProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    age: { 
        type: Number 
    },
    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    paidLessons: {
        '25': { type: Number, default: 0 },
        '50': { type: Number, default: 0 }
    },
    completedLessons: {
        '25': { type: Number, default: 0 },
        '50': { type: Number, default: 0 }
    },
});

module.exports = mongoose.model('StudentProfile', StudentProfileSchema);