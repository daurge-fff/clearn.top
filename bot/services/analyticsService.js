const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Payment = require('../models/Payment');
const Grade = require('../models/Grade');

function init(dependencies) {
    // Placeholder for future dependencies, if any
}

async function sendAdminReports(bot, chatId) {
    const [
        totalStudents,
        totalTeachers,
        totalLessons,
        completedLessons,
        totalRevenue,
        totalPayments
    ] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        Lesson.countDocuments(),
        Lesson.countDocuments({ status: 'completed' }),
        Payment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amountPaid' } } }
        ]),
        Payment.countDocuments({ status: 'completed' })
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total.toFixed(2) : '0.00';

    const message = `👑 *Admin Financial & Activity Report*\n\n` +
                    `*Users:*\n` +
                    `  - Students: ${totalStudents}\n` +
                    `  - Teachers: ${totalTeachers}\n\n` +
                    `*Lessons:*\n` +
                    `  - Total Scheduled: ${totalLessons}\n` +
                    `  - Completed: ${completedLessons}\n\n` +
                    `*Finances:*\n` +
                    `  - Total Revenue: €${revenue}\n` +
                    `  - Total Payments: ${totalPayments}`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

async function sendTeacherStatistics(bot, chatId, teacher) {
    const [
        studentCount,
        lessonsThisMonth,
        avgGrade
    ] = await Promise.all([
        User.countDocuments({ _id: { $in: teacher.students } }),
        Lesson.countDocuments({
            teacher: teacher._id,
            lessonDate: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
        }),
        Grade.aggregate([
            { $match: { teacher: teacher._id } },
            { $group: { _id: null, average: { $avg: '$score' } } }
        ])
    ]);

    const averageScore = avgGrade.length > 0 ? avgGrade[0].average.toFixed(2) : 'N/A';

    const message = `👨‍🏫 *Your Teacher Statistics*\n\n` +
                    `  - Active Students: ${studentCount}\n` +
                    `  - Lessons this month: ${lessonsThisMonth}\n` +
                    `  - Average grade given: ${averageScore} / 10`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}

module.exports = {
    init,
    sendAdminReports,
    sendTeacherStatistics
};