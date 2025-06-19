const Lesson = require('../models/Lesson');
const User = require('../models/User');

function startScheduler(bot) {
    console.log('Scheduler started. Checking for reminders every minute.');

    setInterval(async () => {
        try {
            const now = new Date();
            
            const oneHourLessons = await Lesson.find({
                status: 'scheduled',
                'remindersSent.oneHour': { $ne: true },
                lessonDate: {
                    $gte: new Date(now.getTime() + 55 * 60 * 1000),
                    $lte: new Date(now.getTime() + 65 * 60 * 1000)
                }
            }).populate('student teacher');

            const twentyFourHourLessons = await Lesson.find({
                status: 'scheduled',
                'remindersSent.twentyFourHour': { $ne: true },
                lessonDate: {
                    $gte: new Date(now.getTime() + 23.5 * 60 * 60 * 1000),
                    $lte: new Date(now.getTime() + 24.5 * 60 * 60 * 1000)
                }
            }).populate('student teacher');

            for (const lesson of oneHourLessons) {
                if (shouldSendReminder(lesson)) {
                    await sendReminder(bot, lesson, '1 hour');
                    await Lesson.updateOne({ _id: lesson._id }, { 'remindersSent.oneHour': true });
                }
            }

            for (const lesson of twentyFourHourLessons) {
                if (shouldSendReminder(lesson)) {
                    await sendReminder(bot, lesson, '24 hours');
                    await Lesson.updateOne({ _id: lesson._id }, { 'remindersSent.twentyFourHour': true });
                }
            }

            const postLessonLessons = await Lesson.find({
                status: 'scheduled',
                'remindersSent.postLessonPrompt': { $ne: true },
                lessonDate: {
                    $lt: new Date(now.getTime() - 50 * 60 * 1000)
                }
            }).populate('student teacher');

            for (const lesson of postLessonLessons) {
                if (lesson.teacher?.telegramChatId) {
                    await sendPostLessonPrompt(bot, lesson);
                    await Lesson.updateOne({ _id: lesson._id }, { 
                        'remindersSent.postLessonPrompt': true,
                        status: 'awaiting_confirmation'
                    });
                }
            }

        } catch (error) {
            console.error('Scheduler error:', error);
        }
    }, 60 * 1000);
}

function shouldSendReminder(lesson) {
    return (
        (lesson.student?.telegramChatId && lesson.student.notifications?.lessonReminders) ||
        (lesson.teacher?.telegramChatId && lesson.teacher.notifications?.lessonReminders)
    );
}

async function sendReminder(bot, lesson, time) {
    const lessonTime = new Date(lesson.lessonDate).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
    });

    const topicText = lesson.topic ? `\n📝 Topic: *${lesson.topic}*` : '';

    if (lesson.student?.telegramChatId && lesson.student.notifications?.lessonReminders) {
        const studentMsg = `🔔 *Reminder!* Your lesson with ${lesson.teacher.name} starts in ~${time}.\n⏰ Time: *${lessonTime}*${topicText}`;
        await bot.sendMessage(lesson.student.telegramChatId, studentMsg, { parse_mode: 'Markdown' });
    }

    if (lesson.teacher?.telegramChatId && lesson.teacher.notifications?.lessonReminders) {
        const teacherMsg = `🔔 *Reminder!* Your lesson with ${lesson.student.name} starts in ~${time}.\n⏰ Time: *${lessonTime}*${topicText}`;
        await bot.sendMessage(lesson.teacher.telegramChatId, teacherMsg, { parse_mode: 'Markdown' });
    }
}

async function sendPostLessonPrompt(bot, lesson) {
    const message = `📝 Lesson with *${lesson.student.name}* should be finished. How did it go?`;
    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { 
                        text: "✅ Completed successfully", 
                        callback_data: `lesson_${lesson._id}_completed` 
                    },
                ],
                [
                    { 
                        text: "👻 Student no-show", 
                        callback_data: `lesson_${lesson._id}_noshow` 
                    }
                ],
                [
                    {
                        text: "🚫 Cancel (undo)",
                        callback_data: `undo_${lesson._id}`
                    }
                ]
            ]
        }
    };
    await bot.sendMessage(lesson.teacher.telegramChatId, message, options);
}

module.exports = { startScheduler };