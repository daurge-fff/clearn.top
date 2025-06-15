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
    tools: [String]
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;