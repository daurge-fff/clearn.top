const User = require('../../models/User');
const Lesson = require('../../models/Lesson');
const Grade = require('../../models/Grade');
const { createCalendarKeyboard } = require('../keyboards/calendarKeyboards');
const { getStatusEmoji, createPaginationKeyboard, escapeHtml } = require('../utils/helpers');
const stateService = require('../services/stateService');
const searchService = require('../services/searchService');
const { approvePayment, declinePayment } = require('../../services/paymentService');
const moment = require('moment-timezone');

// Function to calculate stars based on grade
function calculateStarsFromGrade(score, isProject) {
    if (isProject) {
        // For projects (max 25 points)
        if (score >= 23) return 10; // Excellent (23-25)
        if (score >= 20) return 8;  // Very good (20-22)
        if (score >= 17) return 6;  // Good (17-19)
        if (score >= 14) return 4;  // Satisfactory (14-16)
        if (score >= 10) return 2;  // Basic (10-13)
        return 1; // Participation (1-9)
    } else {
        // For regular lessons (max 10 points)
        if (score >= 9) return 5;   // Excellent (9-10)
        if (score >= 8) return 4;   // Very good (8)
        if (score >= 7) return 3;   // Good (7)
        if (score >= 6) return 2;   // Satisfactory (6)
        if (score >= 4) return 1;   // Basic (4-5)
        return 1; // Participation (1-3)
    }
}

async function handleCancellationRequest(ctx, user, params) {
    const lessonId = ctx.callbackQuery.data.split('_')[2];
    await stateService.setState(user.telegramChatId, 'awaiting_cancellation_reason', { lessonId });
    await ctx.editMessageText("Please provide a brief reason for the cancellation:");
    await ctx.answerCbQuery();
}

async function handleRefreshCallback(ctx, user, params) {
    if (params.join('_') === 'balance') {
        await ctx.answerCbQuery("Refreshing...");
        const updatedUser = await User.findById(user._id).lean();
        try {
            await ctx.editMessageText(`You have *${updatedUser.lessonsPaid}* paid lessons remaining.`, {
                parse_mode: 'Markdown',
                reply_markup: ctx.callbackQuery.message.reply_markup
            });
        } catch (error) {
            if (!error.message.includes('message is not modified')) {
                 console.error('Error editing message on refresh:', error);
            }
        }
    }
}

async function handleLessonCallback(ctx, user, params, { undoStack }) {
    const chatId = ctx.chat.id;
    const [lessonId, actionType] = params;
    const lesson = await Lesson.findById(lessonId).populate('student', 'name');
    if (!lesson) return ctx.answerCbQuery("Lesson not found");

    undoStack.push({ chatId, type: 'lesson_status', data: { lessonId, previousStatus: lesson.status } });

    if (actionType === 'completed') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'completed' });
        
        // Award stars for completing lesson
        const student = await User.findById(lesson.student._id);
        if (student) {
            // Check if completion stars were already awarded for this specific lesson
            const alreadyAwarded = student.balanceHistory.some(entry => 
                entry.reason && entry.reason.includes('completing') && 
                entry.reason.includes(`(ID: ${lessonId})`)
            );
            
            if (!alreadyAwarded) {
                const completionStars = lesson.isProject ? 5 : 2; // More stars for project completion
                const newStarsBalance = (student.stars || 0) + completionStars;
                student.stars = newStarsBalance;
                
                student.balanceHistory.push({
                    date: new Date(),
                    change: completionStars,
                    starsBalanceAfter: Number(newStarsBalance),
                    lessonsBalanceAfter: Number(student.lessonsPaid || 0),
                    reason: `Stars earned for completing ${lesson.isProject ? 'project' : 'lesson'} (ID: ${lessonId})`,
                    isStarAdjustment: true
                });
                
                await student.save();
            }
        }
        
        const completionMessage = alreadyAwarded ? 
            `✅ Lesson with ${lesson.student.name} marked as completed.` :
            `✅ Lesson with ${lesson.student.name} marked as completed. Student earned ${lesson.isProject ? 5 : 2} stars! ⭐`;
        await ctx.editMessageText(completionMessage);
        const gradeKeyboard = { inline_keyboard: [ [1,2,3,4,5].map(g => ({ text: `${g} ⭐`, callback_data: `grade_${lessonId}_${g}` })), [6,7,8,9,10].map(g => ({ text: `${g} ⭐`, callback_data: `grade_${lessonId}_${g}` })) ] };
        await ctx.reply("Please rate the lesson from 1 to 10:", { reply_markup: gradeKeyboard });
    } else if (actionType === 'noshow') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'no_show' });
        await ctx.editMessageText(`👻 Lesson with ${lesson.student.name} marked as "no show".`);
    }
    
    await ctx.answerCbQuery("Status updated. You can undo this from the main menu.");
}

async function handleCalendarCallback(ctx, user, params) {
    const [type, ...rest] = params;
    
    if (type === 'ignore') return ctx.answerCbQuery();

    if (type === 'nav') {
        try {
            const [year, month] = rest.map(Number);
            
            if (isNaN(year) || isNaN(month) || year < 1900 || year > 2100 || month < 0 || month > 11) {
                throw new Error(`Invalid calendar navigation parameters: year=${year}, month=${month}`);
            }
            
            const userTz = user.timeZone || 'Europe/Moscow';
            const newDate = moment.tz({year, month, day: 1}, userTz).toDate();
            const keyboard = await createCalendarKeyboard(user, newDate);
            await ctx.editMessageReplyMarkup(keyboard);
            return ctx.answerCbQuery();
        } catch (error) {
            console.error('Error creating calendar navigation:', error);
            await ctx.answerCbQuery("❌ Error loading calendar. Please try again.");
            return;
        }
    } 

    if (type === 'day') {
        const [year, month, day] = rest.map(Number);
        
        if (isNaN(year) || isNaN(month) || isNaN(day) || 
            year < 1900 || year > 2100 || 
            month < 0 || month > 11 || 
            day < 1 || day > 31) {
            return ctx.answerCbQuery("❌ Invalid date selected.");
        }

        const userTz = user.timeZone || 'Europe/Moscow';

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayMoment = moment.tz(dateString, 'YYYY-MM-DD', userTz);

        if (!dayMoment.isValid()) {
            console.error(`Invalid moment created: ${dateString} for TZ ${userTz}`);
            return ctx.answerCbQuery("❌ Invalid date selected.");
        }

        const startOfDay = dayMoment.clone().startOf('day').utc().toDate();
        const nextDayStart = dayMoment.clone().add(1, 'days').startOf('day').utc().toDate();

        const q = { lessonDate: { $gte: startOfDay, $lt: nextDayStart } };
        if (user.role === 'student') q.student = user._id;
        if (user.role === 'teacher') q.teacher = user._id;
        const lessons = await Lesson.find(q).sort({lessonDate: 1}).populate('teacher student', 'name').populate('course', 'name').lean();
        
        const formattedDate = dayMoment.format('DD/MM/YYYY');
        let response = `<b>Lessons for ${formattedDate}</b>\n\n`;
        let k = { inline_keyboard: [] };
        if (lessons.length > 0) {
            lessons.forEach(l => {
                let lw = escapeHtml(user.role === 'student' ? (l.teacher?.name || 'N/A') : (l.student?.name || 'N/A'));
                const courseName = escapeHtml(l.course?.name || 'General');
                const time = escapeHtml(moment.utc(l.lessonDate).tz(userTz).format('HH:mm'));
                const status = getStatusEmoji(l.status);
                response += `${status} <b>${time}</b> - ${lw} <i>(${courseName})</i>\n`;
                if (l.status === 'scheduled') {
                    if (user.role === 'teacher') {
                         k.inline_keyboard.push([{ text: `✅ Completed`, callback_data: `lesson_${l._id}_completed` }, { text: `👻 No Show`, callback_data: `lesson_${l._id}_noshow` }]);
                    }
                    k.inline_keyboard.push([{ text: `❌ Cancel Lesson at ${time}`, callback_data: `cancel_request_${l._id}` }]);
                }
            });
        } else { response = `You have no lessons on ${formattedDate}.`; }
        await ctx.reply(response, { parse_mode: 'HTML', reply_markup: k });
        return ctx.answerCbQuery();
    }
    
    if (type === 'filter') {
        const [filterType] = rest;
        await sendFilteredLessons(ctx, user, filterType, 1);
        return ctx.answerCbQuery();
    }
    
    await ctx.answerCbQuery();
}

async function sendFilteredLessons(ctx, user, filterType, page = 1) {
    const userTz = user.timeZone || 'Europe/Moscow';
    const now = moment.tz(userTz);
    let startDate, endDate;
    const limit = 5;
    const skip = (page - 1) * limit;

    if (filterType === 'week') {
        startDate = now.clone().startOf('week').utc().toDate();
        endDate = now.clone().endOf('week').utc().toDate();
    } else {
        startDate = now.clone().startOf('month').utc().toDate();
        endDate = now.clone().endOf('month').utc().toDate();
    }

    const q = { lessonDate: { $gte: startDate, $lte: endDate } };
    if (user.role === 'student') q.student = user._id;
    if (user.role === 'teacher') q.teacher = user._id;

    const totalLessons = await Lesson.countDocuments(q);
    if (totalLessons === 0) {
        return ctx.answerCbQuery(`You have no lessons for this ${filterType}.`);
    }
    
    const lessons = await Lesson.find(q).sort({ lessonDate: 1 }).limit(limit).skip(skip).populate('teacher student', 'name').populate('course', 'name').lean();
    const totalPages = Math.ceil(totalLessons / limit);

    let response = `<b>Lessons for this ${filterType} (Page ${page}/${totalPages}):</b>\n\n`;
    lessons.forEach(l => {
        const date = escapeHtml(moment.utc(l.lessonDate).tz(userTz).format('DD/MM/YYYY'));
        const time = escapeHtml(moment.utc(l.lessonDate).tz(userTz).format('HH:mm'));
        const lessonWith = escapeHtml(user.role === 'student' ? (l.teacher?.name || 'N/A') : (l.student?.name || 'N/A'));
        const status = getStatusEmoji(l.status);

        response += `${status} <b>${date} (${time})</b> - ${lessonWith.split(' ')[0]} <i>(${escapeHtml(l.course?.name || 'General').split(' ')[0]})</i>\n`;
    });

    const keyboard = createPaginationKeyboard(`cal_filter_${filterType}`, page, totalPages, 'page');

    try {
        await ctx.editMessageText(response, { 
            parse_mode: 'HTML',
            reply_markup: keyboard 
        });
    } catch (error) {
        if (!error.message.includes('message is not modified')) {
            console.error("Error in sendFilteredLessons:", error.message);
            await ctx.reply("An error occurred while displaying lessons.");
        }
    }
}


async function handleSettingsCallback(ctx, user, params) {
    const chatId = ctx.chat.id;
    const action = params[0];

    if (action === 'toggle' && params[1] === 'notifications') {
        user.notifications.lessonReminders = !user.notifications.lessonReminders;
        await user.save();
        const newKeyboard = { inline_keyboard: [[{ text: `Notifications: ${user.notifications.lessonReminders ? 'ON' : 'OFF'}`, callback_data: "settings_toggle_notifications" }], [{ text: `Change My Emoji: ${user.emojiAvatar || 'Not set'}`, callback_data: "settings_change_emoji" }]] };
        if (user.role === 'admin') {
            newKeyboard.inline_keyboard.push([{ text: "👤 Set User Emoji", callback_data: "admin_set_user_emoji" }]);
        }
        try {
            await ctx.editMessageReplyMarkup(newKeyboard);
        } catch (error) {
            if (!error.message.includes('message is not modified')) {
                console.error("Error in handleSettingsCallback:", error);
            }
        }
    }

    if (action === 'change' && params[1] === 'emoji') {
        await stateService.setState(chatId, 'awaiting_new_emoji');
        await ctx.reply("OK, send me the new emoji you'd like to use as your avatar.");
    }
    await ctx.answerCbQuery();
}

async function handleAdminCallback(ctx, user, params) {
    const chatId = ctx.chat.id;
    const [action, ...rest] = params;

    if (action === 'set' && rest[0] === 'user' && rest[1] === 'emoji') {
        await stateService.setState(chatId, 'awaiting_user_for_emoji_change');
        await ctx.editMessageText("Enter the name or email of the user whose emoji you want to change:");
    }

    if (action === 'select' && rest[0] === 'user') {
        const targetUserId = rest[2];
        if (rest[1] === 'emoji') {
            await stateService.setState(chatId, 'awaiting_new_emoji_for_user', { targetUserId });
            await ctx.editMessageText(`Send the new emoji for this user.`);
        }
        if (rest[1] === 'adjust') {
            await stateService.setState(chatId, 'awaiting_adjustment_amount', { userId: targetUserId });
            await ctx.editMessageText(`Enter the adjustment amount for this user (e.g., +5 or -1):`);
        }
    }

    await ctx.answerCbQuery();
}

async function handlePaginationCallback(ctx, user, params) {
    const [prefix, ...rest] = params;
    try {
        if (prefix === 'cal' && rest[0] === 'filter') {
            const [_, filterType, pageStr] = rest;
            await sendFilteredLessons(ctx, user, filterType, parseInt(pageStr, 10));
        } else if (prefix === 'teacher' && rest[0] === 'list' && rest[1] === 'students') {
            const page = parseInt(rest[2], 10);
            await searchService.listStudentsForTeacher(ctx, user, page);
        } 
        else if (prefix === 'admin' && rest[0] === 'list' && rest[1] === 'users') {
            const page = parseInt(rest[2], 10);
            await searchService.listAllUsers(ctx, page);
        }
    } catch (error) {
        if (!error.message.includes('message is not modified')) {
            console.error("Error during pagination callback:", error);
        }
    }
    await ctx.answerCbQuery();
}


async function handleLessonGrade(ctx, user, lessonId, grade) {
    try {
        const lesson = await Lesson.findById(lessonId).populate('student', 'name');
        if (!lesson) return ctx.answerCbQuery("Lesson not found");
        
        const finalScore = parseInt(grade);
        await Grade.findOneAndUpdate(
            { lesson: lessonId }, 
            { 
                lesson: lessonId, 
                student: lesson.student._id, 
                teacher: lesson.teacher, 
                score: finalScore, 
                date: new Date(),
                isProjectGrade: lesson.isProject || false
            }, 
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        // Award stars based on grade
        const starsToAward = calculateStarsFromGrade(finalScore, lesson.isProject);
        if (starsToAward > 0) {
            const User = require('../../models/User');
            const student = await User.findById(lesson.student._id);
            if (student) {
                // Check if grade stars were already awarded for this specific lesson
                const gradeAlreadyAwarded = student.balanceHistory.some(entry => 
                    entry.reason && entry.reason.includes('lesson grade') && 
                    entry.reason.includes(`(ID: ${lessonId})`)
                );
                
                if (!gradeAlreadyAwarded) {
                    const newStarsBalance = (student.stars || 0) + starsToAward;
                    student.stars = newStarsBalance;
                    
                    student.balanceHistory.push({
                        date: new Date(),
                        change: starsToAward,
                        starsBalanceAfter: Number(newStarsBalance),
                        lessonsBalanceAfter: Number(student.lessonsPaid || 0),
                        reason: `Stars earned for lesson grade: ${finalScore}/${lesson.isProject ? 25 : 10} (ID: ${lessonId})`,
                        isStarAdjustment: true
                    });
                    
                    await student.save();
                }
            }
        }
        
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        const gradeMessage = gradeAlreadyAwarded ? 
            `✅ Grade ${finalScore}/${lesson.isProject ? 25 : 10} set for lesson with ${lesson.student.name}.` :
            `✅ Grade ${finalScore}/${lesson.isProject ? 25 : 10} set for lesson with ${lesson.student.name}. Student earned ${starsToAward} stars! ⭐`;
        await ctx.reply(gradeMessage);
        await ctx.answerCbQuery(`Grade ${grade} saved`);
    } catch (error) {
        console.error("Grade error:", error);
        await ctx.answerCbQuery("Error saving the grade");
    }
}

function registerCallbackQueryHandler(bot, dependencies) {
    bot.on('callback_query', async (ctx) => {
        const chatId = ctx.callbackQuery.message?.chat.id;
        
        if (!ctx.callbackQuery.data || !chatId) {
            return ctx.answerCbQuery().catch(e => console.error("Safe answerCbQuery failed:", e.message));
        }

        try {
            const [action, ...params] = ctx.callbackQuery.data.split('_');
            
            const user = await User.findOne({ telegramChatId: String(chatId) });
            if (!user) {
                return ctx.answerCbQuery("Account not found. Use /start");
            }

            switch (action) {
                case 'cancel':  await handleCancellationRequest(ctx, user, params); break;
                case 'settings':await handleSettingsCallback(ctx, user, params); break;
                case 'admin':   await handleAdminCallback(ctx, user, params); break;
                case 'cal':     await handleCalendarCallback(ctx, user, params); break;
                case 'page':    await handlePaginationCallback(ctx, user, params); break;
                case 'lesson':  await handleLessonCallback(ctx, user, params, dependencies); break;
                case 'grade':   await handleLessonGrade(ctx, user, params[0], params[1]); break;
                case 'refresh': await handleRefreshCallback(ctx, user, params); break;
                case 'payment':
                    const [actionType, paymentId] = params;
                    if (actionType === 'approve') {
                        const result = await approvePayment(paymentId);
                        if (result.success) {
                            await ctx.editMessageText(`✅ Payment from \`${result.payment.pendingIdentifier}\` was *approved*.`, { parse_mode: 'Markdown' });
                            if (result.payment.userId) {
                                const creditedUser = await User.findById(result.payment.userId).lean();
                                if (creditedUser && creditedUser.telegramChatId) {
                                    const successMessage = 
                                        `🎉 *Payment Confirmed!* 🎉\n\n` +
                                        `Your payment of *${result.payment.amountPaid.toFixed(2)} ${result.payment.currency}* has been successfully processed.\n\n` +
                                        `*${result.payment.lessonsPurchased}* lesson(s) have been added to your account.\n\n` +
                                        `Your new balance is: *${creditedUser.lessonsPaid}* lessons.\n\n` +
                                        `Thank you!`;
                                    try {
                                        await bot.telegram.sendMessage(creditedUser.telegramChatId, successMessage, { parse_mode: 'Markdown' });
                                    } catch (e) {
                                        console.error(`Failed to send notification to user ${creditedUser._id}`, e);
                                    }
                                }
                            }
                        } else {
                            await ctx.answerCbQuery(`Error: ${result.error}`, { show_alert: true });
                        }
                    } else if (actionType === 'decline') {
                        const result = await declinePayment(paymentId);
                        if (result.success) {
                            await ctx.editMessageText(`❌ Payment from \`${result.payment.pendingIdentifier}\` was *declined*.`, { parse_mode: 'Markdown' });
                        } else {
                            await ctx.answerCbQuery(`Error: ${result.error}`, { show_alert: true });
                        }
                    }
                    await ctx.answerCbQuery();
                    break;
                case 'ignore': 
                    await ctx.answerCbQuery();
                    break;
                default: 
                    console.warn(`Unknown action in callback_query: ${action}`);
                    await ctx.answerCbQuery("Unknown command.");
                    return;
            }

        } catch (error) {
            console.error(`!!! CRITICAL ERROR processing callback_query:`, ctx.callbackQuery.data, error);
            try {
                await ctx.answerCbQuery('An error occurred. Please try again later.', { show_alert: true });
            } catch (e) {
                console.error("Failed to answer callback query with error alert:", e.message);
            }
        }
    });
}

module.exports = { registerCallbackQueryHandler };