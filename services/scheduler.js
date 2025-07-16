const cron = require('node-cron');
const moment = require('moment-timezone');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

/**
 * Initializes and starts all cron jobs for the application.
 * @param {object} bot - The initialized Telegram Bot instance.
 */
function startScheduler(bot) {
    console.log('Scheduler started using node-cron.');

    cron.schedule('* * * * *', async () => {
        await processReminders(bot, 'oneHour', 60);
    });

    cron.schedule('*/10 * * * *', async () => {
        await processReminders(bot, 'twentyFourHour', 1440);
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

async function processReminders(bot, reminderType, minutesBefore) {
        try {
            const nowUtc = moment.utc();
            const lessons = await Lesson.find({ status: 'scheduled' }).populate('student teacher', 'name telegramChatId notifications timeZone');

            for (const lesson of lessons) {
                const lessonUtc = moment.utc(lesson.lessonDate);

                for (const role of ['student', 'teacher']) {
                    const user = lesson[role];
                    if (!user || !user.telegramChatId || !user.notifications?.lessonReminders || lesson.remindersSent[role][reminderType]) continue;

                    const userTz = user.timeZone || 'Europe/Moscow';
                    const nowLocal = nowUtc.tz(userTz);
                    const lessonLocal = lessonUtc.tz(userTz);

                    const minutesUntil = lessonLocal.diff(nowLocal, 'minutes');

                    const windowStart = minutesBefore - 1;
                    const windowEnd = minutesBefore + 1;

                    if (minutesUntil >= windowStart && minutesUntil <= windowEnd) {
                        const timeText = reminderType === 'oneHour' ? 'in ~1 hour' : 'in ~24 hours';
                        const lessonTime = lessonLocal.format('HH:mm');
                        const topicText = lesson.topic ? `\n📝 Topic: *${lesson.topic}*` : '';
                        const msg = `🔔 *Reminder!* Your lesson with ${lesson[role === 'student' ? 'teacher' : 'student'].name} starts ${timeText}.\n⏰ Time: *${lessonTime}*${topicText}`;
                        await bot.sendMessage(user.telegramChatId, msg, { parse_mode: 'Markdown' });

                        lesson.remindersSent[role][reminderType] = true;
                        await lesson.save();
                    }
                }
            }
        } catch (error) {
            console.error(`Scheduler (${reminderType} reminder) error:`, error);
        }
    }

    async function sendPostLessonPrompt(bot, lesson) {
        // existing function
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