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
        type: String, // e.g., "5-7", "8-12"
    },
    tools: [String] // e.g., ["Scratch", "Miro"]
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;