const User = require('../../models/User');
const Lesson = require('../../models/Lesson');
const Grade = require('../../models/Grade');
const { createCalendarKeyboard } = require('../keyboards/calendarKeyboards');
const { getStatusEmoji, createPaginationKeyboard, escapeHtml } = require('../utils/helpers');
const stateService = require('../services/stateService');
const searchService = require('../services/searchService');
const { approvePayment, declinePayment } = require('../../services/paymentService');

async function handleCancellationRequest(bot, query, user, params, { answer }) {
    const lessonId = query.data.split('_')[2];
    await stateService.setState(user.telegramChatId, 'awaiting_cancellation_reason', { lessonId });
    await bot.editMessageText("Please provide a brief reason for the cancellation:", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
    });
    await answer();
}

async function handleRefreshCallback(bot, query, user, params, { answer }) {
    if (params.join('_') === 'balance') {
        await answer({ text: "Refreshing..." });
        const updatedUser = await User.findById(user._id).lean();
        try {
            await bot.editMessageText(`You have *${updatedUser.lessonsPaid}* paid lessons remaining.`, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: query.message.reply_markup
            });
        } catch (error) {
            if (!error.response?.body?.description.includes('message is not modified')) {
                 console.error('Error editing message on refresh:', error);
            }
        }
    }
}

async function handleLessonCallback(bot, query, user, params, { undoStack, answer }) {
    const chatId = query.message.chat.id;
    const [lessonId, actionType] = params;
    const lesson = await Lesson.findById(lessonId).populate('student', 'name');
    if (!lesson) return answer({ text: "Lesson not found" });

    undoStack.push({ chatId, type: 'lesson_status', data: { lessonId, previousStatus: lesson.status } });

    if (actionType === 'completed') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'completed' });
        await bot.editMessageText(`✅ Lesson with ${lesson.student.name} marked as completed.`, { chat_id: chatId, message_id: query.message.message_id });
        const gradeKeyboard = { inline_keyboard: [ [1,2,3,4,5].map(g => ({ text: `${g} ⭐`, callback_data: `grade_${lessonId}_${g}` })), [6,7,8,9,10].map(g => ({ text: `${g} ⭐`, callback_data: `grade_${lessonId}_${g}` })) ] };
        await bot.sendMessage(chatId, "Please rate the lesson from 1 to 10:", { reply_markup: gradeKeyboard });
    } else if (actionType === 'noshow') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'no_show' });
        await bot.editMessageText(`👻 Lesson with ${lesson.student.name} marked as "no show".`, { chat_id: chatId, message_id: query.message.message_id });
    }
    
    await answer({ text: "Status updated. You can undo this from the main menu." });
}

async function handleCalendarCallback(bot, query, user, params, { answer }) {
    const messageId = query.message.message_id;
    const chatId = query.message.chat.id;
    const [type, ...rest] = params;
    
    if (type === 'ignore') return answer();

    if (type === 'nav') {
        const [year, month] = rest;
        const newDate = new Date(year, month);
        const keyboard = await createCalendarKeyboard(user, newDate);
        await bot.editMessageReplyMarkup(keyboard, { chat_id: chatId, message_id: messageId });
        return answer();
    } 

    if (type === 'day') {
        const [year, month, day] = rest;
        const selectedDate = new Date(year, month, day);
        const startOfDay = new Date(new Date(selectedDate).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(selectedDate).setHours(23, 59, 59, 999));
        const q = { lessonDate: { $gte: startOfDay, $lte: endOfDay } };
        if (user.role === 'student') q.student = user._id;
        if (user.role === 'teacher') q.teacher = user._id;
        const lessons = await Lesson.find(q).sort({lessonDate: 1}).populate('teacher student', 'name').populate('course', 'name').lean();
        let response = `<b>Lessons for ${selectedDate.toLocaleDateString('en-GB')}</b>\n\n`;
        let k = { inline_keyboard: [] };
        if (lessons.length > 0) {
            lessons.forEach(l => {
                let lw = escapeHtml(user.role === 'student' ? (l.teacher?.name || 'N/A') : (l.student?.name || 'N/A'));
                const courseName = escapeHtml(l.course?.name || 'General');
                const time = escapeHtml(new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
                const status = getStatusEmoji(l.status);
                response += `${status} <b>${time}</b> - ${lw} <i>(${courseName})</i>\n`;
                if (l.status === 'scheduled') {
                    if (user.role === 'teacher') {
                         k.inline_keyboard.push([{ text: `✅ Completed`, callback_data: `lesson_${l._id}_completed` }, { text: `👻 No Show`, callback_data: `lesson_${l._id}_noshow` }]);
                    }
                    k.inline_keyboard.push([{ text: `❌ Cancel Lesson at ${time}`, callback_data: `cancel_request_${l._id}` }]);
                }
            });
        } else { response = `You have no lessons on ${selectedDate.toLocaleDateString('en-GB')}.`; }
        await bot.sendMessage(chatId, response, { parse_mode: 'HTML', reply_markup: k });
        return answer();
    }
    
    if (type === 'filter') {
        const [filterType] = rest;
        await sendFilteredLessons(bot, query, user, filterType, 1);
        return answer();
    }
    
    await answer();
}

async function sendFilteredLessons(bot, query, user, filterType, page = 1) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const now = new Date();
    let startDate, endDate;
    const limit = 5;
    const skip = (page - 1) * limit;

    if (filterType === 'week') {
        const firstDayOfWeek = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        startDate = new Date(new Date(now).setDate(firstDayOfWeek));
        endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 6));
    } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    const q = { lessonDate: { $gte: startDate, $lte: endDate } };
    if (user.role === 'student') q.student = user._id;
    if (user.role === 'teacher') q.teacher = user._id;

    const totalLessons = await Lesson.countDocuments(q);
    if (totalLessons === 0) {
        return bot.answerCallbackQuery(query.id, { text: `You have no lessons for this ${filterType}.` });
    }
    
    const lessons = await Lesson.find(q).sort({ lessonDate: 1 }).limit(limit).skip(skip).populate('teacher student', 'name').populate('course', 'name').lean();
    const totalPages = Math.ceil(totalLessons / limit);

    let response = `<b>Lessons for this ${filterType} (Page ${page}/${totalPages}):</b>\n\n`;
    lessons.forEach(l => {
        const date = escapeHtml(new Date(l.lessonDate).toLocaleDateString('en-GB'));
        const time = escapeHtml(new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        const lessonWith = escapeHtml(user.role === 'student' ? (l.teacher?.name || 'N/A') : (l.student?.name || 'N/A'));
        const status = getStatusEmoji(l.status);

        response += `${status} <b>${date} (${time})</b> - ${lessonWith.split(' ')[0]} <i>(${escapeHtml(l.course?.name || 'General').split(' ')[0]})</i>\n`;
    });

    const keyboard = createPaginationKeyboard(`cal_filter_${filterType}`, page, totalPages, 'page');

    try {
        await bot.editMessageText(response, { 
            chat_id: chatId, 
            message_id: messageId, 
            parse_mode: 'HTML',
            reply_markup: keyboard 
        });
    } catch (error) {
        if (!error.response?.body?.description.includes('message is not modified')) {
            console.error("Error in sendFilteredLessons:", error.response?.body || error.message);
            await bot.sendMessage(chatId, "An error occurred while displaying lessons.");
        }
    }
}


async function handleSettingsCallback(bot, query, user, params, { answer }) {
    const chatId = query.message.chat.id;
    const action = params[0];

    if (action === 'toggle' && params[1] === 'notifications') {
        user.notifications.lessonReminders = !user.notifications.lessonReminders;
        await user.save();
        const newKeyboard = { inline_keyboard: [[{ text: `Notifications: ${user.notifications.lessonReminders ? 'ON' : 'OFF'}`, callback_data: "settings_toggle_notifications" }], [{ text: `Change My Emoji: ${user.emojiAvatar || 'Not set'}`, callback_data: "settings_change_emoji" }]] };
        if (user.role === 'admin') {
            newKeyboard.inline_keyboard.push([{ text: "👤 Set User Emoji", callback_data: "admin_set_user_emoji" }]);
        }
        try {
            await bot.editMessageReplyMarkup(newKeyboard, { chat_id: chatId, message_id: query.message.message_id });
        } catch (error) {
            if (!error.response?.body?.description.includes('message is not modified')) {
                console.error("Error in handleSettingsCallback:", error);
            }
        }
    }

    if (action === 'change' && params[1] === 'emoji') {
        await stateService.setState(chatId, 'awaiting_new_emoji');
        await bot.sendMessage(chatId, "OK, send me the new emoji you'd like to use as your avatar.");
    }
    await answer();
}

async function handleAdminCallback(bot, query, user, params, { answer }) {
    const chatId = query.message.chat.id;
    const [action, ...rest] = params;

    if (action === 'set' && rest[0] === 'user' && rest[1] === 'emoji') {
        await stateService.setState(chatId, 'awaiting_user_for_emoji_change');
        await bot.editMessageText("Enter the name or email of the user whose emoji you want to change:", {
            chat_id: chatId,
            message_id: query.message.message_id
        });
    }

    if (action === 'select' && rest[0] === 'user') {
        const targetUserId = rest[2];
        if (rest[1] === 'emoji') {
            await stateService.setState(chatId, 'awaiting_new_emoji_for_user', { targetUserId });
            await bot.editMessageText(`Send the new emoji for this user.`, {
                chat_id: chatId, message_id: query.message.message_id
            });
        }
        if (rest[1] === 'adjust') {
            await stateService.setState(chatId, 'awaiting_adjustment_amount', { userId: targetUserId });
            await bot.editMessageText(`Enter the adjustment amount for this user (e.g., +5 or -1):`, {
                 chat_id: chatId, message_id: query.message.message_id
            });
        }
    }

    await answer();
}

async function handlePaginationCallback(bot, query, user, params, { answer }) {
    const [prefix, ...rest] = params;
    try {
        if (prefix === 'cal' && rest[0] === 'filter') {
            const [_, filterType, pageStr] = rest;
            await sendFilteredLessons(bot, query, user, filterType, parseInt(pageStr, 10));
        } else if (prefix === 'teacher' && rest[0] === 'list' && rest[1] === 'students') {
            const page = parseInt(rest[2], 10);
            await searchService.listStudentsForTeacher(bot, query.message.chat.id, user, page, query.message.message_id);
        } 
        else if (prefix === 'admin' && rest[0] === 'list' && rest[1] === 'users') {
            const page = parseInt(rest[2], 10);
            await searchService.listAllUsers(bot, query.message.chat.id, page, query.message.message_id);
        }
    } catch (error) {
        if (!error.response?.body?.description.includes('message is not modified')) {
            console.error("Error during pagination callback:", error);
        }
    }
    await answer();
}


async function handleLessonGrade(bot, query, user, lessonId, grade, { answer }) {
    try {
        const lesson = await Lesson.findById(lessonId).populate('student', 'name');
        if (!lesson) return answer({ text: "Lesson not found" });
        await Grade.findOneAndUpdate({ lesson: lessonId }, { lesson: lessonId, student: lesson.student._id, teacher: lesson.teacher, score: parseInt(grade), date: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: query.message.chat.id, message_id: query.message.message_id });
        await bot.sendMessage(query.message.chat.id, `✅ You have graded the lesson with ${lesson.student.name} a ${grade}.`);
        await answer({ text: `Grade ${grade} saved` });
    } catch (error) {
        console.error("Grade error:", error);
        await answer({ text: "Error saving the grade" });
    }
}

function registerCallbackQueryHandler(botInstance, dependencies) {
    const bot = botInstance;

    bot.on('callback_query', async (query) => {
        const chatId = query.message?.chat.id;
        
        if (!query.data || !chatId) {
            return bot.answerCallbackQuery(query.id).catch(e => console.error("Safe answerCallbackQuery failed:", e.message));
        }

        try {
            const [action, ...params] = query.data.split('_');
            
            const user = await User.findOne({ telegramChatId: String(chatId) });
            if (!user) {
                return bot.answerCallbackQuery(query.id, { text: "Account not found. Use /start" });
            }

            let wasAnswered = false;
            const answer = (options) => {
                if (wasAnswered) return Promise.resolve();
                wasAnswered = true;
                return bot.answerCallbackQuery(query.id, options).catch(e => console.error("Error in answer function:", e.message));
            };

            const context = { ...dependencies, answer };

            switch (action) {
                case 'cancel':  await handleCancellationRequest(bot, query, user, params, context); break;
                case 'settings':await handleSettingsCallback(bot, query, user, params, context); break;
                case 'admin':   await handleAdminCallback(bot, query, user, params, context); break;
                case 'cal':     await handleCalendarCallback(bot, query, user, params, context); break;
                case 'page':    await handlePaginationCallback(bot, query, user, params, context); break;
                case 'lesson':  await handleLessonCallback(bot, query, user, params, context); break;
                case 'grade':   await handleLessonGrade(bot, query, user, params[0], params[1], context); break;
                case 'refresh': await handleRefreshCallback(bot, query, user, params, context); break;
                case 'payment':
                    const [actionType, paymentId] = params;
                    if (actionType === 'approve') {
                        const result = await approvePayment(paymentId);
                        if (result.success) {
                            await bot.editMessageText(`✅ Payment from \`${result.payment.pendingIdentifier}\` was *approved*.`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' });
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
                                        await bot.sendMessage(creditedUser.telegramChatId, successMessage, { parse_mode: 'Markdown' });
                                    } catch (e) {
                                        console.error(`Failed to send notification to user ${creditedUser._id}`, e);
                                    }
                                }
                            }
                        } else {
                            await bot.answerCallbackQuery(query.id, { text: `Error: ${result.error}`, show_alert: true });
                        }
                    } else if (actionType === 'decline') {
                        const result = await declinePayment(paymentId);
                        if (result.success) {
                            await bot.editMessageText(`❌ Payment from \`${result.payment.pendingIdentifier}\` was *declined*.`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' });
                        } else {
                            await bot.answerCallbackQuery(query.id, { text: `Error: ${result.error}`, show_alert: true });
                        }
                    }
                    await answer();
                    break;
                case 'ignore': break;
                default: 
                    console.warn(`Unknown action in callback_query: ${action}`);
                    await answer({ text: "Unknown command." });
                    return;
            }

            if (!wasAnswered) {
                await answer();
            }

        } catch (error) {
            console.error(`!!! CRITICAL ERROR processing callback_query:`, query.data, error);
            try {
                await bot.answerCallbackQuery(query.id, { text: 'An error occurred. Please try again later.', show_alert: true });
            } catch (e) {
                console.error("Failed to answer callback query with error alert:", e.message);
            }
        }
    });
}

module.exports = { registerCallbackQueryHandler };