const cron = require('node-cron');
const Lesson = require('../models/Lesson');

/**
 * Initializes and starts all cron jobs for the application.
 * @param {object} bot - The initialized Telegram Bot instance.
 */
function startScheduler(bot) {
    console.log('Scheduler started using node-cron.');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const oneHourLessons = await Lesson.find({
                status: 'scheduled',
                'remindersSent.oneHour': { $ne: true },
                lessonDate: {
                    $gte: new Date(now.getTime() + 59 * 60 * 1000),
                    $lte: new Date(now.getTime() + 61 * 60 * 1000)
                }
            }).populate('student teacher', 'name telegramChatId notifications');

            for (const lesson of oneHourLessons) {
                await sendReminder(bot, lesson, 'in ~1 hour');
                await Lesson.updateOne({ _id: lesson._id }, { 'remindersSent.oneHour': true });
            }
        } catch (error) {
            console.error('Scheduler (1-hour reminder) error:', error);
        }
    });

    cron.schedule('*/10 * * * *', async () => {
        try {
            const now = new Date();
            const twentyFourHourLessons = await Lesson.find({
                status: 'scheduled',
                'remindersSent.twentyFourHour': { $ne: true },
                lessonDate: {
                    $gte: new Date(now.getTime() + (24 * 60 - 5) * 60 * 1000),
                    $lte: new Date(now.getTime() + (24 * 60 + 5) * 60 * 1000)
                }
            }).populate('student teacher', 'name telegramChatId notifications');

            for (const lesson of twentyFourHourLessons) {
                await sendReminder(bot, lesson, 'in ~24 hours');
                await Lesson.updateOne({ _id: lesson._id }, { 'remindersSent.twentyFourHour': true });
            }
        } catch (error) {
            console.error('Scheduler (24-hour reminder) error:', error);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            const postLessonLessons = await Lesson.find({
                status: 'scheduled',
                postLessonPrompt: { $ne: true },
                lessonDate: {
                    $gte: new Date(now.getTime() - 60 * 60 * 1000),
                    $lt: new Date(now.getTime() - 50 * 60 * 1000)
                }
            }).populate('teacher student', 'name telegramChatId');

            for (const lesson of postLessonLessons) {
                if (lesson.teacher?.telegramChatId) {
                    await sendPostLessonPrompt(bot, lesson);
                    await Lesson.updateOne({ _id: lesson._id }, { $set: { postLessonPrompt: true } });
                }
            }
        } catch (error) {
            console.error('Scheduler (post-lesson prompt) error:', error);
        }
    });
}

async function sendReminder(bot, lesson, time) {
    const lessonTime = new Date(lesson.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const topicText = lesson.topic ? `\n📝 Topic: *${lesson.topic}*` : '';

    if (lesson.student?.telegramChatId && lesson.student.notifications?.lessonReminders) {
        const studentMsg = `🔔 *Reminder!* Your lesson with ${lesson.teacher.name} starts ${time}.\n⏰ Time: *${lessonTime}*${topicText}`;
        await bot.sendMessage(lesson.student.telegramChatId, studentMsg, { parse_mode: 'Markdown' });
    }

    if (lesson.teacher?.telegramChatId && lesson.teacher.notifications?.lessonReminders) {
        const teacherMsg = `🔔 *Reminder!* Your lesson with ${lesson.student.name} starts ${time}.\n⏰ Time: *${lessonTime}*${topicText}`;
        await bot.sendMessage(lesson.teacher.telegramChatId, teacherMsg, { parse_mode: 'Markdown' });
    }
}

async function sendPostLessonPrompt(bot, lesson) {
    const message = `📝 The lesson with *${lesson.student.name}* should be finished. Please update its status.`;
    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                { text: "✅ Completed", callback_data: `lesson_${lesson._id}_completed` },
                { text: "👻 No Show", callback_data: `lesson_${lesson._id}_noshow` }
            ]]
        }
    };
    await bot.sendMessage(lesson.teacher.telegramChatId, message, options);
}

module.exports = { startScheduler };