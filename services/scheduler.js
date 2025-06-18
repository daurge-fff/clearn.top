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
            const postLessonPrompts = await Lesson.find({
                status: 'scheduled',
                'remindersSent.postLessonPrompt': { $ne: true },
                lessonDate: {
                    $lt: new Date(now.getTime() - 50 * 60 * 1000)
                }
            }).populate('student', 'name').populate('teacher', 'name telegramChatId');
            
            for (const lesson of postLessonPrompts) {
                sendPostLessonPrompt(bot, lesson);
                await Lesson.updateOne({ _id: lesson._id }, { 'remindersSent.postLessonPrompt': true });
            }

        } catch (error) {
            console.error('Scheduler error:', error);
        }
    }, 60 * 1000);
}

function sendReminder(bot, lesson, time) {
    const lessonTime = new Date(lesson.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (lesson.student?.telegramChatId && lesson.student.notifications?.lessonReminders) {
        const studentMsg = `🔔 *Reminder!* Your lesson with *${lesson.teacher.name}* is in ~${time}.\n\n🗓️ Topic: *${lesson.topic}*\n⏰ Time: *${lessonTime}*`;
        bot.sendMessage(lesson.student.telegramChatId, studentMsg, { parse_mode: 'Markdown' });
    }

    if (lesson.teacher?.telegramChatId && lesson.teacher.notifications?.lessonReminders) {
        const teacherMsg = `🔔 *Reminder!* Your lesson with *${lesson.student.name}* is in ~${time}.\n\n🗓️ Topic: *${lesson.topic}*\n⏰ Time: *${lessonTime}*`;
        bot.sendMessage(lesson.teacher.telegramChatId, teacherMsg, { parse_mode: 'Markdown' });
    }
}

function sendPostLessonPrompt(bot, lesson) {
    if (lesson.teacher?.telegramChatId) {
        const message = `💬 Урок с *${lesson.student.name}* должен был закончиться. Как все прошло?`;
        const options = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Проведен успешно", callback_data: `lesson_completed_${lesson._id}` },
                        { text: "👻 Студент не пришел", callback_data: `lesson_noshow_${lesson._id}` }
                    ]
                ]
            }
        };
        bot.sendMessage(lesson.teacher.telegramChatId, message, options);
    }
}

module.exports = { startScheduler };