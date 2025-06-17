const Lesson = require('../models/Lesson');
const User = require('../models/User');

function startScheduler(bot) {
    console.log('Scheduler started. Checking for reminders every minute.');

    setInterval(async () => {
        try {
            const now = new Date();
            
            const oneHourReminders = await Lesson.find({
                status: 'scheduled',
                'remindersSent.oneHour': false,
                lessonDate: {
                    $gte: new Date(now.getTime() + 59 * 60 * 1000),
                    $lte: new Date(now.getTime() + 61 * 60 * 1000)
                }
            }).populate('student', 'name telegramChatId notifications').populate('teacher', 'name telegramChatId notifications');

            const twentyFourHourReminders = await Lesson.find({
                status: 'scheduled',
                'remindersSent.twentyFourHour': false,
                lessonDate: {
                    $gte: new Date(now.getTime() + (24 * 60 - 1) * 60 * 1000),
                    $lte: new Date(now.getTime() + (24 * 60 + 1) * 60 * 1000)
                }
            }).populate('student', 'name telegramChatId notifications').populate('teacher', 'name telegramChatId notifications');

            for (const lesson of oneHourReminders) {
                sendReminder(bot, lesson, '1 hour');
                await Lesson.updateOne({ _id: lesson._id }, { 'remindersSent.oneHour': true });
            }

            for (const lesson of twentyFourHourReminders) {
                sendReminder(bot, lesson, '24 hours');
                await Lesson.updateOne({ _id: lesson._id }, { 'remindersSent.twentyFourHour': true });
            }

        } catch (error) {
            console.error('Scheduler error:', error);
        }
    }, 60 * 1000);
}

function sendReminder(bot, lesson, time) {
    const lessonTime = new Date(lesson.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    // Уведомление для ученика
    if (lesson.student?.telegramChatId && lesson.student.notifications?.lessonReminders) {
        const studentMsg = `🔔 *Reminder!* Your lesson with *${lesson.teacher.name}* is in ~${time}.\n\n🗓️ Topic: *${lesson.topic}*\n⏰ Time: *${lessonTime}*`;
        bot.sendMessage(lesson.student.telegramChatId, studentMsg, { parse_mode: 'Markdown' });
    }

    // Уведомление для учителя
    if (lesson.teacher?.telegramChatId && lesson.teacher.notifications?.lessonReminders) {
        const teacherMsg = `🔔 *Reminder!* Your lesson with *${lesson.student.name}* is in ~${time}.\n\n🗓️ Topic: *${lesson.topic}*\n⏰ Time: *${lessonTime}*`;
        bot.sendMessage(lesson.teacher.telegramChatId, teacherMsg, { parse_mode: 'Markdown' });
    }
}

module.exports = { startScheduler };