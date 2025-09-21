const cron = require('node-cron');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

/**
 * Initializes and starts all cron jobs for the application.
 * @param {object} bot - The initialized Telegram Bot instance.
 */
function startScheduler(bot) {
    console.log('Scheduler started using node-cron.');

    cron.schedule('* * * * *', async () => {
        try {
            await processReminders(bot, 'oneHour', 60);
        } catch (error) {
            console.error('Scheduler (oneHour reminder) error:', error);
        }
    });

    cron.schedule('*/10 * * * *', async () => {
        try {
            await processReminders(bot, 'twentyFourHour', 1440);
        } catch (error) {
            console.error('Scheduler (twentyFourHour reminder) error:', error);
        }
    });

    cron.schedule('*/5 * * * *', async () => {
        try {
            // Check if MongoDB is connected
            if (mongoose.connection.readyState !== 1) {
                console.log('Skipping post-lesson prompt - MongoDB not connected');
                return;
            }
            
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

    // Balance reminder check every hour
    cron.schedule('0 * * * *', async () => {
        try {
            // Check if MongoDB is connected
            if (mongoose.connection.readyState !== 1) {
                console.log('Skipping balance reminders - MongoDB not connected');
                return;
            }
            await processBalanceReminders(bot);
        } catch (error) {
            console.error('Scheduler (balance reminders) error:', error);
        }
    });
}

async function processReminders(bot, reminderType, minutesBefore) {
        try {
            // Check if MongoDB is connected
            if (mongoose.connection.readyState !== 1) {
                console.log(`Skipping ${reminderType} reminder - MongoDB not connected`);
                return;
            }
            
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
                        
                        try {
                            await bot.telegram.sendMessage(user.telegramChatId, msg, { parse_mode: 'Markdown' });
                            lesson.remindersSent[role][reminderType] = true;
                            await lesson.save();
                        } catch (telegramError) {
                            console.error(`Failed to send ${reminderType} reminder to ${role} ${user.name}:`, telegramError.message);
                            // Don't mark as sent if message failed to send
                        }
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

async function processBalanceReminders(bot) {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('Skipping balance reminders - MongoDB not connected');
            return;
        }
        
        const students = await User.find({
            role: 'student',
            telegramChatId: { $exists: true, $ne: null },
            lessonsPaid: { $in: [1, 2] }
        });

        for (const student of students) {
            const lessonsPaid = student.lessonsPaid;
            let shouldSend = false;
            let reminderType = '';
            let message = '';

            if (lessonsPaid === 2 && !student.balanceReminders?.twoLessonsRemaining) {
                shouldSend = true;
                reminderType = 'twoLessonsRemaining';
                message = '⚠️ *Reminder!* You have only *2 lessons* remaining.\n\n💡 Consider purchasing more lessons to continue your learning journey!';
            } else if (lessonsPaid === 1 && !student.balanceReminders?.oneLessonRemaining) {
                shouldSend = true;
                reminderType = 'oneLessonRemaining';
                message = '🚨 *Important!* You have only *1 lesson* remaining.\n\n📚 Don\'t let your learning stop - purchase more lessons today!';
            }

            if (shouldSend) {
                try {
                    await bot.telegram.sendMessage(student.telegramChatId, message, { parse_mode: 'Markdown' });
                    
                    // Mark reminder as sent
                    const updateField = `balanceReminders.${reminderType}`;
                    await User.updateOne(
                        { _id: student._id },
                        { $set: { [updateField]: true } }
                    );
                } catch (telegramError) {
                    console.error(`Failed to send balance reminder to student ${student.name}:`, telegramError.message);
                }
            }
        }
    } catch (error) {
        console.error('Balance reminders processing error:', error);
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
    
    try {
        await bot.telegram.sendMessage(lesson.teacher.telegramChatId, message, options);
    } catch (telegramError) {
        console.error(`Failed to send post-lesson prompt for lesson ${lesson._id}:`, telegramError.message);
        throw telegramError; // Re-throw to be caught by the calling function
    }
}

module.exports = { startScheduler };