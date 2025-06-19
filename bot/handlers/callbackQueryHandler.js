const User = require('../../models/User');
const Lesson = require('../../models/Lesson');
const Grade = require('../../models/Grade');
const { createCalendarKeyboard } = require('../keyboards/calendarKeyboards');
const { getStatusEmoji, createPaginationKeyboard } = require('../utils/helpers'); // Ensure createPaginationKeyboard is imported
const stateService = require('../services/stateService');
const searchService = require('../services/searchService');

let BASE_URL;
let undoStack;

async function handleCancellationRequest(bot, query, user) {
    const lessonId = query.data.split('_')[2];
    await stateService.setState(user.telegramChatId, 'awaiting_cancellation_reason', { lessonId });
    await bot.answerCallbackQuery(query.id);
    await bot.editMessageText("Please provide a brief reason for the cancellation:", {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id
    });
}

async function handleRefreshCallback(bot, query, user, params) {
    if (params.join('_') === 'balance') {
        await bot.answerCallbackQuery(query.id, { text: "Refreshing..." });
        const updatedUser = await User.findById(user._id).lean();
        try {
            await bot.editMessageText(`You have *${updatedUser.lessonsPaid}* paid lessons remaining.`, {
                chat_id: query.message.chat.id, message_id: query.message.message_id,
                parse_mode: 'Markdown', reply_markup: query.message.reply_markup
            });
        } catch (error) {
            console.error('Error editing message');
        }
    }
}

async function handleLessonCallback(bot, query, user, params) {
    const chatId = query.message.chat.id;
    const [lessonId, actionType] = params;

    const lesson = await Lesson.findById(lessonId).populate('student', 'name');
    if (!lesson) return bot.answerCallbackQuery(query.id, { text: "Lesson not found" });

    undoStack.push({
        chatId: chatId,
        type: 'lesson_status',
        data: {
            lessonId: lessonId,
            previousStatus: lesson.status
        }
    });

    if (actionType === 'completed') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'completed' });
        await bot.editMessageText(`✅ Lesson with ${lesson.student.name} marked as completed.`, { chat_id: chatId, message_id: query.message.message_id });
        const gradeKeyboard = { inline_keyboard: [ [1,2,3,4,5].map(g => ({ text: `${g} ⭐`, callback_data: `grade_${lessonId}_${g}` })), [6,7,8,9,10].map(g => ({ text: `${g} ⭐`, callback_data: `grade_${lessonId}_${g}` })) ] };
        await bot.sendMessage(chatId, "Please rate the lesson from 1 to 10:", { reply_markup: gradeKeyboard });
    } else if (actionType === 'noshow') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'no_show' });
        await bot.editMessageText(`👻 Lesson with ${lesson.student.name} marked as "no show".`, { chat_id: chatId, message_id: query.message.message_id });
    }
    
    await bot.answerCallbackQuery(query.id, { text: "Status updated. You can undo this from the main menu." });
}

async function handleCalendarCallback(bot, query, user, params) {
    const messageId = query.message.message_id;
    const chatId = query.message.chat.id;
    const [type, ...rest] = params;
    
    if (type === 'ignore') return bot.answerCallbackQuery(query.id);
    if (type === 'nav') {
        await bot.answerCallbackQuery(query.id);
        const [year, month] = rest;
        const newDate = new Date(year, month);
        const keyboard = await createCalendarKeyboard(user, newDate);
        return bot.editMessageReplyMarkup(keyboard, { chat_id: chatId, message_id: messageId });
    } 

    if (type === 'day') {
        await bot.answerCallbackQuery(query.id, `Loading lessons...`);
        const [year, month, day] = rest;
        const selectedDate = new Date(year, month, day);
        const startOfDay = new Date(new Date(selectedDate).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(selectedDate).setHours(23, 59, 59, 999));
        const q = { lessonDate: { $gte: startOfDay, $lte: endOfDay } };
        if (user.role === 'student') q.student = user._id;
        if (user.role === 'teacher') q.teacher = user._id;
        const lessons = await Lesson.find(q).sort({lessonDate: 1}).populate('teacher student', 'name').lean();
        let response = `*Lessons for ${selectedDate.toLocaleDateString('en-GB')}*\n\n`;
        let k = { inline_keyboard: [] };
        if (lessons.length > 0) {
            lessons.forEach(l => {
                let lw = user.role === 'student' ? l.teacher.name : l.student.name;
                const time = new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                response += `*${time}* - Lesson with ${lw} (${getStatusEmoji(l.status)})\n`;
                if (l.status === 'scheduled' && user.role === 'teacher') {
                     k.inline_keyboard.push([
                        { text: `✅ Completed`, callback_data: `lesson_${l._id}_completed` },
                        { text: `👻 No Show`, callback_data: `lesson_${l._id}_noshow` }
                    ]);
                }
                if (l.status === 'scheduled') {
                    k.inline_keyboard.push([{ text: `❌ Cancel Lesson at ${time}`, callback_data: `cancel_request_${l._id}` }]);
                }
            });
        } else { response = `You have no lessons on ${selectedDate.toLocaleDateString('en-GB')}.`; }
        return bot.sendMessage(chatId, response, { parse_mode: 'Markdown', reply_markup: k });
    } if (type === 'filter') {
        const [filterType] = rest;
        await bot.answerCallbackQuery(query.id);
        return sendFilteredLessons(bot, query, user, filterType, 1);
    }
    await bot.answerCallbackQuery(query.id);
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
    
    const lessons = await Lesson.find(q).sort({ lessonDate: 1 }).limit(limit).skip(skip).populate('teacher student', 'name').lean();
    const totalPages = Math.ceil(totalLessons / limit);

    let response = `*Lessons for this ${filterType} (Page ${page}/${totalPages}):*\n\n`;
    lessons.forEach(l => {
        const date = new Date(l.lessonDate).toLocaleDateString('en-GB');
        const time = new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        let lessonWith = user.role === 'student' ? (l.teacher ? l.teacher.name : 'N/A') : (l.student ? l.student.name : 'N/A');
        response += `*${date} ${time}* - ${lessonWith} (${getStatusEmoji(l.status)})\n`;
    });

    const keyboard = createPaginationKeyboard(`cal_filter_${filterType}`, page, totalPages, 'page');

    return bot.editMessageText(response, { 
        chat_id: chatId, message_id: messageId, 
        parse_mode: 'Markdown', reply_markup: keyboard
    });
}

async function handleSettingsCallback(bot, query, user, params) {
    const chatId = query.message.chat.id;
    const action = params[0];
    
    await bot.answerCallbackQuery(query.id);

    if (action === 'toggle' && params[1] === 'notifications') {
        user.notifications.lessonReminders = !user.notifications.lessonReminders;
        await user.save();
        
        const newKeyboard = {
            inline_keyboard: [
                [{ text: `Notifications: ${user.notifications.lessonReminders ? 'ON' : 'OFF'}`, callback_data: "settings_toggle_notifications" }],
                [{ text: `Change Emoji Avatar: ${user.emojiAvatar || 'Not set'}`, callback_data: "settings_change_emoji" }]
            ]
        };
        try {
            await bot.editMessageReplyMarkup(newKeyboard, { chat_id: chatId, message_id: query.message.message_id });
        } catch (error) {
            if (error.response && error.response.body.description.includes('message is not modified')) {
                console.log("Ignored 'message is not modified' error in settings.");
            } else {
                console.error("Error in handleSettingsCallback:", error);
            }
        }
    }

    if (action === 'change' && params[1] === 'emoji') {
        await stateService.setState(chatId, 'awaiting_new_emoji');
        await bot.sendMessage(chatId, "OK, send me the new emoji you'd like to use as your avatar.");
    }
}

async function handlePaginationCallback(bot, query, user, params) {
    const [prefix, ...rest] = params;
    await bot.answerCallbackQuery(query.id);
    try {
        if (prefix === 'cal' && rest[0] === 'filter') {
            const [_, filterType, pageStr] = rest;
            return await sendFilteredLessons(bot, query, user, filterType, parseInt(pageStr, 10));
        }
        
        if (prefix === 'teacher' && rest[0] === 'list' && rest[1] === 'students') {
            const page = parseInt(rest[3], 10);
            return await searchService.listStudentsForTeacher(bot, query.message.chat.id, user, page, query.message.message_id);
        }

        if (prefix === 'admin' && rest[0] === 'user' && rest[1] === 'search') {
            const [__, pageStr, ...searchTermParts] = rest;
            const searchTerm = searchTermParts.join('_');
            const page = parseInt(pageStr, 10);
            return await searchService.findUserForAdmin(bot, query.message.chat.id, searchTerm, page, query.message.message_id);
        }
    } catch (error) {
        if (error.response && error.response.body.description.includes('message is not modified')) {
            console.log("Ignored 'message is not modified' error during pagination.");
        } else {
            console.error("Error during pagination callback:", error);
        }
    }
}

async function handleLessonGrade(bot, query, user, lessonId, grade) {
    try {
        const lesson = await Lesson.findById(lessonId).populate('student', 'name');
        if (!lesson) return bot.answerCallbackQuery(query.id, { text: "Lesson not found" });
        await Grade.findOneAndUpdate({ lesson: lessonId }, { lesson: lessonId, student: lesson.student._id, teacher: lesson.teacher, score: parseInt(grade), date: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: query.message.chat.id, message_id: query.message.message_id });
        await bot.sendMessage(query.message.chat.id, `✅ You have graded the lesson with ${lesson.student.name} a ${grade}.`);
        await bot.answerCallbackQuery(query.id, { text: `Grade ${grade} saved` });
    } catch (error) {
        console.error("Grade error:", error);
        await bot.answerCallbackQuery(query.id, { text: "Error saving the grade" });
    }
}

function registerCallbackQueryHandler(botInstance, dependencies) {
    const bot = botInstance;
    BASE_URL = dependencies.BASE_URL;
    undoStack = dependencies.undoStack;
    searchService.init(dependencies);

    bot.on('callback_query', async (query) => {
        if (!query.data) return bot.answerCallbackQuery(query.id);
        const chatId = query.message.chat.id;
        const [action, ...params] = query.data.split('_');
        const user = await User.findOne({ telegramChatId: String(chatId) });
        if (!user) return bot.answerCallbackQuery(query.id, { text: "Account not found." });

        try {
            switch (action) {
                case 'cancel': return handleCancellationRequest(bot, query, user);
                case 'settings': return handleSettingsCallback(bot, query, user, params); 
                case 'cal': return handleCalendarCallback(bot, query, user, params);
                case 'page': return handlePaginationCallback(bot, query, user, params);
                case 'adjust': return handleAdjustmentCallback(bot, query, user, params);
                case 'lesson': return handleLessonCallback(bot, query, user, params);
                case 'grade': return handleLessonGrade(bot, query, user, params[0], params[1]);
                case 'refresh': return handleRefreshCallback(bot, query, user, params);
                case 'ignore': return bot.answerCallbackQuery(query.id);
                
                default: 
                    console.warn(`Unknown action in callback_query: ${action}`);
                    return bot.answerCallbackQuery(query.id);
            }
        } catch (error) {
            console.error(`Error processing callback_query ${query.id} for action ${action}:`, error);
            await bot.answerCallbackQuery(query.id, { text: 'An internal error occurred.' });
        }
    });
}


module.exports = { registerCallbackQueryHandler };