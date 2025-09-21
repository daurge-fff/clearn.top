const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    ageGroup: {
        type: String,
    },
    tools: [String],
    visible: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 999
    },
    key: {
        type: String,
        unique: true,
        sparse: true
    }
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;