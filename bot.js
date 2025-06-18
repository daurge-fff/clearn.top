const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const User = require('./models/User');
const Lesson = require('./models/Lesson');

mongoose.connect(process.env.MONGO_URI).then(() => console.log('Telegram Bot: MongoDB Connected...')).catch(err => console.error(err));

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const userStates = {};
const BASE_URL = process.env.BASE_URL || 'https://clearn.top';

console.log('Telegram Bot has been started...');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/')) {
        delete userStates[chatId];
        if (text === '/start' || text === '/menu') return handleMenuCommand(msg);
        return;
    }
    
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return;

    if (userStates[chatId]) {
        return handleStatefulInput(chatId, user, text);
    }
    
    handleMenuButton(chatId, user, text);
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const [action, ...params] = query.data.split('_');

    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return bot.answerCallbackQuery(query.id, { text: "Account not found." });

    switch (action) {
        case 'cal': return handleCalendarCallback(query, user, params);
        case 'cancel': return handleCancellationCallback(query, user, params);
        case 'page': return handlePaginationCallback(query, user, params);
        case 'adjust': return handleAdjustmentCallback(query, user, params);
        case 'lesson':
            return handleLessonCallback(query, lessonId, params);
        default:
            return bot.answerCallbackQuery(query.id);
    }
});

async function handleLessonCallback(query, lessonId, params) {
    const chatId = query.message.chat.id;
    const actionType = params[0];

    try {
        if (actionType === 'completed') {
            await Lesson.findByIdAndUpdate(lessonId, { status: 'completed' });
            bot.editMessageText(`✅ Статус урока обновлен на "Проведен".`, {
                chat_id: chatId,
                message_id: query.message.message_id
            });
            userStates[chatId] = { type: 'awaiting_grade', lessonId: lessonId };
            bot.sendMessage(chatId, "Теперь, пожалуйста, введите оценку от 1 до 10.");

        } else if (actionType === 'noshow') {
            await Lesson.findByIdAndUpdate(lessonId, { status: 'no_show' });
            bot.editMessageText(`👻 Статус урока обновлен на "Неявка".`, {
                chat_id: chatId,
                message_id: query.message.message_id
            });
        }
        bot.answerCallbackQuery(query.id);
    } catch (error) {
        console.error("Lesson callback error:", error);
        bot.answerCallbackQuery(query.id, { text: "Произошла ошибка" });
    }
}

async function handleMenuCommand(msg) {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: String(chatId) });

    if (!user) {
        const response = `Welcome!\n\nTo connect your account, go to Settings on our website and enter this Chat ID: \`${chatId}\`\n\nThen use the /menu command.`;
        return bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    }

    let keyboard;
    let welcomeText = `Welcome, ${user.name}!`;

    if (user.role === 'student') {
        welcomeText += ' What would you like to do?';
        keyboard = [
            [{ text: "🗓️ My Schedule" }],
            [{ text: "💰 Lessons Balance" }],
        ];
    } else if (user.role === 'teacher') {
        welcomeText += ' (Teacher Panel)';
        keyboard = [
            [{ text: "TODAY'S LESSONS" }, { text: "🗓️ Full Schedule" }],
            [{ text: "FIND STUDENT" }],
        ];
    } else if (user.role === 'admin') {
        welcomeText += ' (Admin Panel)';
        keyboard = [
            [{ text: "DAILY SUMMARY" }, { text: "FIND USER" }],
            [{ text: "⚙️ ADJUST BALANCE" }, { text: "🗓️ Full Schedule" }],
        ];
    }
    keyboard.push([{ text: "👤 Set My Emoji" }]);

    bot.sendMessage(chatId, welcomeText, {
        reply_markup: { keyboard, resize_keyboard: true, one_time_keyboard: false }
    });
}

async function sendFilteredLessons(chatId, user, filterType, page = 1, messageId = null) {
    const limit = 5;
    const skip = (page - 1) * limit;
    const now = new Date();
    let startDate, endDate;

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

    const queryLessons = { lessonDate: { $gte: startDate, $lte: endDate } };
    if (user.role === 'student') queryLessons.student = user._id;
    if (user.role === 'teacher') queryLessons.teacher = user._id;

    const totalLessons = await Lesson.countDocuments(queryLessons);
    if (totalLessons === 0) {
        bot.answerCallbackQuery(query.id, { text: `You have no lessons for this ${filterType}.` });
        return;
    }
    
    const totalPages = Math.ceil(totalLessons / limit);
    const lessons = await Lesson.find(queryLessons).sort({ lessonDate: 1 }).limit(limit).skip(skip).populate('teacher', 'name').populate('student', 'name');

    let response = `*Lessons for this ${filterType} (Page ${page}/${totalPages}):*\n\n`;
    lessons.forEach(l => {
        const date = new Date(l.lessonDate).toLocaleDateString('en-GB');
        const time = new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        let lessonWith = user.role !== 'admin' ? (user.role === 'student' ? l.teacher.name : l.student.name) : `${l.student.name} / ${l.teacher.name}`;
        response += `*${date} ${time}* - ${lessonWith} (${getStatusEmoji(l.status)})\n`;
    });

    const keyboard = createPaginationKeyboard(`filter_${filterType}`, page, totalPages, '').inline_keyboard;

    bot.editMessageText(response, { 
        chat_id: chatId, 
        message_id: messageId, 
        parse_mode: 'Markdown', 
        reply_markup: { inline_keyboard: keyboard } 
    });
}

function handleMenuButton(chatId, user, text) {
    switch (text) {
        case '💰 Lessons Balance':
            bot.sendMessage(chatId, `You have *${user.lessonsPaid}* paid lessons remaining.`, { parse_mode: 'Markdown' });
            break;
        case '🗓️ My Schedule':
        case '🗓️ Full Schedule':
            sendCalendar(chatId, new Date(), user);
            break;
        case "TODAY'S LESSONS":
            sendTodaysLessons(chatId, user);
            break;
        case "FIND STUDENT":
            userStates[chatId] = { type: 'awaiting_student_name_search' };
            bot.sendMessage(chatId, "Type the name of the student you are looking for:");
            break;
        case "DAILY SUMMARY":
            sendDailySummary(chatId);
            break;
        case "FIND USER":
            userStates[chatId] = { type: 'awaiting_user_search' };
            bot.sendMessage(chatId, "Type the name or email of the user:");
            break;
        case "⚙️ ADJUST BALANCE":
            userStates[chatId] = { type: 'awaiting_user_for_adjustment' };
            bot.sendMessage(chatId, "Type the name or email of the user to adjust balance:");
            break;
        case '👤 Set My Emoji':
            userStates[chatId] = { type: 'awaiting_emoji' };
            bot.sendMessage(chatId, `Your current emoji is *${user.emojiAvatar}*. Send a new single emoji to change it.`, { parse_mode: 'Markdown' });
            break;
    }
}

async function handleStatefulInput(chatId, user, text) {
    const state = userStates[chatId];
    delete userStates[chatId];

    switch (state.type) {
        case 'awaiting_student_name_search':
            return findStudentForTeacher(chatId, user, text);
        case 'awaiting_user_search':
            return findUserForAdmin(chatId, text);
        case 'awaiting_user_for_adjustment':
            return findUserForAdjustment(chatId, text);
        case 'awaiting_adjustment_amount':
            state.amount = text;
            userStates[chatId] = { ...state, type: 'awaiting_adjustment_reason' };
            bot.sendMessage(chatId, "Amount set. Now, enter a brief reason:");
            break;
        case 'awaiting_adjustment_reason':
            state.reason = text;
            handleBalanceAdjustment(chatId, state);
            break;
        case 'awaiting_cancellation_reason':
            handleLessonCancellation(chatId, user, state.lessonId, text);
            break;
        case 'awaiting_emoji':
            return handleEmojiChange(chatId, user, text);
        case 'awaiting_grade':
            delete userStates[chatId];
            const grade = parseInt(text, 10);
            if (!isNaN(grade) && grade >= 1 && grade <= 10) {
                const lesson = await Lesson.findById(state.lessonId);
                await Grade.findOneAndUpdate(
                    { lesson: state.lessonId },
                    { 
                        lesson: state.lessonId,
                        student: lesson.student,
                        teacher: lesson.teacher,
                        score: grade,
                    },
                    { upsert: true, new: true }
                );
                bot.sendMessage(chatId, `✅ Оценка ${grade} успешно выставлена!`);
            } else {
                bot.sendMessage(chatId, "❌ Неверный формат оценки. Введите число от 1 до 10.");
            }
            break;
    }
}

function getStatusEmoji(status) {
    switch (status) {
        case 'scheduled': return '🗓️ Scheduled';
        case 'completed': return '✅ Completed';
        case 'cancelled_by_student': return '❌ Cancelled (Student)';
        case 'cancelled_by_teacher': return '❌ Cancelled (Teacher)';
        case 'no_show': return '👻 No Show';
        default: return status;
    }
}
function createPaginationKeyboard(prefix, currentPage, totalPages, searchTerm) {
    if (totalPages <= 1) return { inline_keyboard: [] };
    let row = [];
    if (currentPage > 1) {
        row.push({ text: '‹ Prev', callback_data: `page_${prefix}_${currentPage - 1}_${searchTerm}` });
    }
    row.push({ text: `${currentPage} / ${totalPages}`, callback_data: 'ignore' });
    if (currentPage < totalPages) {
        row.push({ text: 'Next ›', callback_data: `page_${prefix}_${currentPage + 1}_${searchTerm}` });
    }
    return { inline_keyboard: [row] };
}
function sendTodaysLessons(chatId, user){ /* ... без изменений, но теперь использует getStatusEmoji ... */ }
async function sendDailySummary(chatId) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const todaysLessons = await Lesson.find({ lessonDate: { $gte: startOfDay, $lte: endOfDay } });
    const scheduledCount = todaysLessons.filter(l => l.status === 'scheduled').length;
    const completedCount = todaysLessons.filter(l => l.status === 'completed').length;
    
    const activeTeachers = new Set(todaysLessons.map(l => l.teacher.toString())).size;

    const response = `*Daily Summary for ${new Date().toLocaleDateString('en-GB')}*\n\n` +
                     `- ${getStatusEmoji('scheduled')}: *${scheduledCount}*\n` +
                     `- ${getStatusEmoji('completed')}: *${completedCount}*\n` +
                     `- 👨‍🏫 Active Teachers Today: *${activeTeachers}*`;

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}
async function sendCalendar(chatId) {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return;
    const keyboard = await createCalendarKeyboard(user, new Date());
    bot.sendMessage(chatId, "Your schedule:", { reply_markup: keyboard });
}

async function createCalendarKeyboard(user, date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString('en-US', { month: 'long' });

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const query = { lessonDate: { $gte: startOfMonth, $lte: endOfMonth } };
    if (user.role === 'student') query.student = user._id;
    if (user.role === 'teacher') query.teacher = user._id;

    const userLessons = await Lesson.find(query);
    
    const lessonDays = {};
    userLessons.forEach(l => {
        const day = new Date(l.lessonDate).getDate();
        if (!lessonDays[day]) lessonDays[day] = [];
        lessonDays[day].push(l.status);
    });

    let keyboard = [];
    keyboard.push([
        { text: "‹", callback_data: `cal_nav_${year}_${month - 1}` },
        { text: `${monthName} ${year}`, callback_data: "cal_ignore" },
        { text: "›", callback_data: `cal_nav_${year}_${month + 1}` }
    ]);
    keyboard.push(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => ({ text: d, callback_data: "cal_ignore" })));

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    let row = [];
    for (let i = 0; i < firstDay; i++) row.push({ text: " ", callback_data: "cal_ignore" });
    
    for (let day = 1; day <= daysInMonth; day++) {
        let dayText = `${day}`;
        if (lessonDays[day]) {
            if (lessonDays[day].includes('scheduled')) dayText = `🔵`;
            else if (lessonDays[day].includes('completed')) dayText = `✅`;
            else dayText = `🔴`;
        }
        row.push({ text: dayText, callback_data: `cal_day_${year}_${month}_${day}` });
        if (row.length === 7) { keyboard.push(row); row = []; }
    }
    if (row.length > 0) keyboard.push(row);

    keyboard.push([
        { text: "This Week", callback_data: "cal_filter_week" },
        { text: "This Month", callback_data: "cal_filter_month" }
    ]);

    return { inline_keyboard: keyboard };
}

async function findUser(query, page = 1, limit = 5) {
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query).limit(limit).skip(skip);
    const totalPages = Math.ceil(total / limit);
    return { users, totalPages, currentPage: page };
}

async function findUserForAdmin(chatId, searchString, page = 1, messageId = null) {
    const searchRegex = new RegExp(searchString, 'i');
    const query = { $or: [{ name: searchRegex }, { email: searchRegex }] };
    const result = await findUser(query, page);

    if (result.users.length === 0) return bot.sendMessage(chatId, `No users found matching "${searchString}".`);

    let response = `*Found users (Page ${result.currentPage}/${result.totalPages}):*\n\n`;
    let keyboard = { inline_keyboard: [] };
    
    result.users.forEach(u => {
        response += `*${u.name}* (${u.role})\n- Email: ${u.email}\n- Status: ${u.status}\n`;
        keyboard.inline_keyboard.push([{ text: `View ${u.name.split(' ')[0]}'s Profile`, url: `${BASE_URL}/dashboard/user-profile/${u._id}` }]);
    });
    
    const paginationKeyboard = createPaginationKeyboard('user', result.currentPage, result.totalPages, searchString).inline_keyboard;
    if (paginationKeyboard.length > 0) keyboard.inline_keyboard.push(paginationKeyboard[0]);

    const options = { chat_id: chatId, parse_mode: 'Markdown', reply_markup: keyboard };
    if (messageId) {
        bot.editMessageText(response, { ...options, message_id: messageId });
    } else {
        bot.sendMessage(chatId, response, options);
    }
}

async function findStudentForTeacher(chatId, teacher, studentName, page = 1, messageId = null) {
    const limit = 5;
    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(studentName, 'i');

    const query = {
        _id: { $in: teacher.students },
        name: searchRegex
    };

    const totalStudents = await User.countDocuments(query);
    if (totalStudents === 0) {
        return bot.sendMessage(chatId, `No students found in your list matching "${studentName}".`);
    }

    const totalPages = Math.ceil(totalStudents / limit);
    const students = await User.find(query).limit(limit).skip(skip);

    let response = `*Found your students (Page ${page}/${totalPages}):*\n\n`;
    let keyboard = { inline_keyboard: [] };

    students.forEach(s => {
        response += `*${s.name}*\n- Balance: ${s.lessonsPaid} lessons\n- Contact: ${s.contact || 'not specified'}\n`;
        keyboard.inline_keyboard.push([{ text: `View ${s.name.split(' ')[0]}'s Profile`, url: `${BASE_URL}/dashboard/user-profile/${s._id}` }]);
    });

    const paginationKeyboard = createPaginationKeyboard('student', page, totalPages, studentName).inline_keyboard;
    if (paginationKeyboard.length > 0) {
        keyboard.inline_keyboard.push(paginationKeyboard[0]);
    }

    const options = {
        chat_id: chatId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
    };

    if (messageId) {
        bot.editMessageText(response, { ...options, message_id: messageId });
    } else {
        bot.sendMessage(chatId, response, options);
    }
}
async function sendTodaysLessons(chatId, user) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const lessons = await Lesson.find({
        teacher: user._id,
        lessonDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ lessonDate: 1 }).populate('student', 'name');

    let response = `*Your lessons for today, ${new Date().toLocaleDateString('en-GB')}:*\n\n`;
    if (lessons.length > 0) {
        lessons.forEach(l => {
            const time = new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            response += `*${time}* - ${l.student.name} (${getStatusEmoji(l.status)})\n`;
        });
    } else {
        response = "You have no lessons scheduled for today.";
    }
    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

async function findUserForAdjustment(chatId, searchString) {
    const searchRegex = new RegExp(searchString, 'i');
    const users = await User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] });

    if (users.length === 0) return bot.sendMessage(chatId, `No users found matching "${searchString}".`);
    if (users.length === 1) {
        userStates[chatId] = { type: 'awaiting_adjustment_amount', userId: users[0]._id };
        return bot.sendMessage(chatId, `Found *${users[0].name}*. Now, enter the adjustment amount (e.g., +5 or -1):`, { parse_mode: 'Markdown' });
    }

    const keyboard = {
        inline_keyboard: users.map(u => ([{ text: `${u.name} (${u.role})`, callback_data: `adjust_user_${u._id}` }]))
    };
    bot.sendMessage(chatId, "Found multiple users. Please choose one:", { reply_markup: keyboard });
}

async function handleAdjustmentCallback(query, user, params) {
    const [type, userId] = params;
    if (type === 'user') {
        userStates[user.telegramChatId] = { type: 'awaiting_adjustment_amount', userId: userId };
        bot.editMessageText("User selected. Now, enter the adjustment amount (e.g., +5 or -1):", {
            chat_id: user.telegramChatId,
            message_id: query.message.message_id
        });
    }
    bot.answerCallbackQuery(query.id);
}

async function handleBalanceAdjustment(chatId, state) {
    const { userId, amount, reason } = state;
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum)) return bot.sendMessage(chatId, "❌ Invalid amount. Operation cancelled.");

    const userToAdjust = await User.findById(userId);
    if (!userToAdjust) return bot.sendMessage(chatId, `❌ User not found. Operation cancelled.`);

    const newBalance = userToAdjust.lessonsPaid + amountNum;
    userToAdjust.lessonsPaid = newBalance;
    userToAdjust.balanceHistory.push({ change: amountNum, balanceAfter: newBalance, reason: `Manual Correction: ${reason}` });
    await userToAdjust.save();

    bot.sendMessage(chatId, `✅ Success! *${userToAdjust.name}*'s balance has been adjusted by *${amountNum}*.\nNew balance: *${newBalance}* lessons.`, { parse_mode: 'Markdown' });
}

async function handleCancellationCallback(query, user, params) {
    const [type, lessonId] = params;
    if (type === 'lesson') {
        userStates[user.telegramChatId] = { type: 'awaiting_cancellation_reason', lessonId };
        bot.editMessageText("Please type the reason for cancellation:", {
            chat_id: user.telegramChatId,
            message_id: query.message.message_id
        });
        bot.answerCallbackQuery(query.id);
    }
}

async function handleLessonCancellation(chatId, user, lessonId, reason) {
    if (!reason || reason.trim() === "") return bot.sendMessage(chatId, "Cancellation failed. Reason cannot be empty.");

    const lesson = await Lesson.findById(lessonId);
    if (!lesson || String(lesson.student) !== String(user._id) || lesson.status !== 'scheduled') return bot.sendMessage(chatId, "Error: Lesson cannot be cancelled anymore.");
    
    lesson.status = 'cancelled_by_student';
    lesson.cancellationReason = reason;
    await lesson.save();
    await User.findByIdAndUpdate(user._id, { $inc: { lessonsPaid: 1 } });

    bot.sendMessage(chatId, "✅ Lesson cancelled successfully!");
    
    const teacher = await User.findById(lesson.teacher);
    if (teacher && teacher.telegramChatId) {
        const date = new Date(lesson.lessonDate).toLocaleDateString('en-GB');
        const time = new Date(lesson.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const notification = `⚠️ *Lesson Cancellation*\n\nStudent *${user.name}* has cancelled the lesson scheduled for *${date} at ${time}*.\nReason: ${reason}`;
        bot.sendMessage(teacher.telegramChatId, notification, { parse_mode: 'Markdown' });
    }
}

async function handleCalendarCallback(query, user, params) {
    const messageId = query.message.message_id;
    const [type, ...rest] = params;

    if (type === 'nav') {
        const [year, month] = rest;
        const newDate = new Date(year, month);
        const keyboard = await createCalendarKeyboard(user, newDate);
        return bot.editMessageReplyMarkup(keyboard, { chat_id: user.telegramChatId, message_id: messageId });
    } 
    
    if (type === 'day') {
        const [year, month, day] = rest;
        const selectedDate = new Date(year, month, day);
        const startOfDay = new Date(new Date(selectedDate).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(selectedDate).setHours(23, 59, 59, 999));

        const queryLessons = { lessonDate: { $gte: startOfDay, $lte: endOfDay } };
        if (user.role === 'student') queryLessons.student = user._id;
        if (user.role === 'teacher') queryLessons.teacher = user._id;

        const lessons = await Lesson.find(queryLessons).populate('teacher', 'name').populate('student', 'name');

        let response = `*Lessons for ${selectedDate.toLocaleDateString('en-GB')}*\n\n`;
        let keyboard = [];

        if (lessons.length > 0) {
            lessons.forEach(l => {
                let lessonWith = user.role === 'student' ? l.teacher.name : l.student.name;
                const time = new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                response += `*${time}* - Lesson with ${lessonWith} (${getStatusEmoji(l.status)})\n`;
                if (l.status === 'scheduled' && user.role === 'student') {
                    keyboard.push([{ text: `❌ Cancel lesson at ${time}`, callback_data: `cancel_lesson_${l._id}` }]);
                }
            });
        } else {
            response = `You have no lessons on ${selectedDate.toLocaleDateString('en-GB')}.`;
        }
        
        bot.answerCallbackQuery(query.id);
        bot.sendMessage(user.telegramChatId, response, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } });
    }

    if (type === 'filter') {
        const [filterType, page = 1] = rest;
        return sendFilteredLessons(user.telegramChatId, user, filterType, parseInt(page, 10), messageId);
    }
    
    bot.answerCallbackQuery(query.id);
}

async function handleEmojiChange(chatId, user, newEmoji) {
    if (!newEmoji || newEmoji.length > 2) {
        return bot.sendMessage(chatId, "❌ Invalid input. Please send just one single emoji.");
    }

    const emojiInUse = await User.findOne({ emojiAvatar: newEmoji });
    if (emojiInUse && String(emojiInUse._id) !== String(user._id)) {
        return bot.sendMessage(chatId, `Sorry, the ${newEmoji} emoji is already taken by another user. Please choose another one.`);
    }

    user.emojiAvatar = newEmoji;
    await user.save();
    
    bot.sendMessage(chatId, `✅ Your new emoji avatar is now *${newEmoji}*! It will be updated in the CRM system.`, { parse_mode: 'Markdown' });
}

module.exports = bot;