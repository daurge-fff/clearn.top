const User = require('../../models/User');
const Lesson = require('../../models/Lesson');
const Course = require('../../models/Course');
const { getStatusEmoji, escapeHtml } = require('../utils/helpers');
const { createCalendarKeyboard } = require('../keyboards/calendarKeyboards');
const stateService = require('../services/stateService');
const searchService = require('../services/searchService');

let BASE_URL;
let undoStack;

async function handleMenuCommand(bot, msg) {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: String(chatId) }).lean();

    if (!user) {
        const response = `👋 Welcome to Code & Learn!\n\nTo connect your account:\n1. Go to Settings on our website\n2. Enter this Chat ID: \`${chatId}\`\n3. Return here and use /menu`;
        return bot.sendMessage(chatId, response, { 
            parse_mode: 'Markdown',
            reply_markup: { keyboard: [[{ text: "🌐 Open Website" }]], resize_keyboard: true }
        });
    }

    let keyboard = [];
    let welcomeText = `👋 Hello, ${user.name}!`;

    if (user.role === 'student') {
        welcomeText += '\nStudent Dashboard:';
        keyboard = [
            [{ text: "📅 My Schedule" }, { text: "💳 Balance" }],
            [{ text: "👨‍🏫 My Teachers" }, { text: "⚙️ Settings" }],
            [{ text: "❓ Help" }]
        ];
    } else if (user.role === 'teacher') {
        welcomeText += '\nTeacher Panel:';
        keyboard = [
            [{ text: "📅 Today's Lessons" }, { text: "🗓 Schedule" }],
            [{ text: "👨‍🎓 My Students" }, { text: "📊 Statistics" }],
            [{ text: "⚙️ Settings" }, { text: "❓ Help" }]
        ];
    } else if (user.role === 'admin') {
        welcomeText += '\nAdmin Panel:';
        keyboard = [
            [{ text: "📊 Reports" }, { text: "👤 Users" }],
            [{ text: "💳 Balance Adjustment" }, { text: "⚙️ Settings" }],
            [{ text: "❓ Help" }]
        ];
    } 
    if (undoStack.hasActions(chatId)) {
        if (keyboard.length > 0 && keyboard[keyboard.length - 1].length < 2) {
            keyboard[keyboard.length - 1].push({ text: "↩️ Undo" });
        } else {
            keyboard.push([{ text: "↩️ Undo" }]);
        }
    }

    bot.sendMessage(chatId, welcomeText, {
        reply_markup: { keyboard, resize_keyboard: true }
    });
}

async function handleStatefulInput(bot, chatId, user, text) {
    const state = user.botState;
    await stateService.clearState(chatId);

    switch (state.name) {
        case 'awaiting_user_search':
            return searchService.findUserForAdmin(bot, chatId, text);
        case 'awaiting_student_name_search':
            return searchService.findStudentForTeacher(bot, chatId, user, text);
        case 'awaiting_user_for_adjustment':
            return findUserForAdjustment(bot, chatId, text);
        case 'awaiting_adjustment_amount':
            const { userId } = state.context; 
            await stateService.setState(chatId, 'awaiting_adjustment_reason', { userId, amount: text });
            return bot.sendMessage(chatId, "Amount set. Now, enter a brief reason:");
        case 'awaiting_adjustment_reason':
            const { userId: adjUserId, amount } = state.context;
            return handleBalanceAdjustment(bot, chatId, user, { userId: adjUserId, amount, reason: text });
        case 'awaiting_new_emoji':
            return handleEmojiChange(bot, chatId, text);
            
        case 'awaiting_cancellation_reason':
            const { lessonId } = state.context;
            return handleLessonCancellation(bot, chatId, user, lessonId, text);
    }
}

async function handleLessonCancellation(bot, chatId, user, lessonId, reason) {
    if (!reason || reason.trim().length < 5) {
        return bot.sendMessage(chatId, "❌ Cancellation failed. Please provide a more detailed reason (at least 5 characters).");
    }

    const lesson = await Lesson.findById(lessonId).populate('student teacher', 'telegramChatId name');

    if (!lesson) return bot.sendMessage(chatId, "❌ Error: Lesson not found.");
    if (lesson.status !== 'scheduled') return bot.sendMessage(chatId, "❌ Error: This lesson cannot be cancelled as it's not in 'scheduled' status.");

    const isStudent = String(lesson.student._id) === String(user._id);
    const isTeacher = String(lesson.teacher._id) === String(user._id);

    if (!isStudent && !isTeacher) {
        return bot.sendMessage(chatId, "❌ Error: You are not authorized to cancel this lesson.");
    }
    
    let newStatus = '';
    if (isStudent) {
        newStatus = 'cancelled_by_student';
        await User.findByIdAndUpdate(user._id, { $inc: { lessonsPaid: 1 } });
        
        const teacher = lesson.teacher;
        if (teacher && teacher.telegramChatId) {
            const date = new Date(lesson.lessonDate).toLocaleDateString('en-GB');
            const time = new Date(lesson.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const notification = `⚠️ *Lesson Cancellation*\n\nStudent *${user.name}* has cancelled the lesson scheduled for *${date} at ${time}*.\n\n*Reason:* ${reason}`;
            bot.sendMessage(teacher.telegramChatId, notification, { parse_mode: 'Markdown' });
        }
    } else if (isTeacher) {
        newStatus = 'cancelled_by_teacher';
    }

    lesson.status = newStatus;
    lesson.cancellationReason = reason;
    await lesson.save();

    await bot.sendMessage(chatId, "✅ Lesson successfully cancelled.");
}

async function handleMenuButton(bot, chatId, user, text) {
    switch (text) {
        case '📅 My Schedule': case '🗓 Schedule':
            return sendCalendar(bot, chatId, user);
        case '⚙️ Settings':
            return sendSettingsMenu(bot, chatId, user);
        case '❓ Help':
            return sendHelpMessage(bot, chatId);

        // Student
        case '💳 Balance':
            return bot.sendMessage(chatId, `You have *${user.lessonsPaid}* paid lessons remaining.`, { 
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "refresh_balance" }]] }
            });
        case '👨‍🏫 My Teachers':
            return sendTeacherList(bot, chatId, user);

        // Teacher
        case "📅 Today's Lessons":
            return sendTodaysLessons(bot, chatId, user);
        case '👨‍🎓 My Students':
            return searchService.listStudentsForTeacher(bot, chatId, user);
        case '📊 Statistics':
            return bot.sendMessage(chatId, "Teacher statistics are under development.");

        // Admin
        case '📊 Reports':
            return bot.sendMessage(chatId, "Admin reports are under development.");
        case '👤 Users':
            return searchService.listAllUsers(bot, chatId);
        case '💳 Balance Adjustment':
            await stateService.setState(chatId, 'awaiting_user_for_adjustment');
            return bot.sendMessage(chatId, "Enter name or email of the user to adjust balance for:");

        case '↩️ Undo':
            const lastAction = undoStack.pop(chatId);
            if (!lastAction) {
                await bot.sendMessage(chatId, "Nothing to undo.");
            } else {
                 if (lastAction.type === 'lesson_status') {
                    await Lesson.findByIdAndUpdate(lastAction.data.lessonId, { status: lastAction.data.previousStatus });
                    await bot.sendMessage(chatId, `✅ Action undone. Lesson status reverted to "${lastAction.data.previousStatus}".`);
                } else {
                    await bot.sendMessage(chatId, "Sorry, this action cannot be undone.");
                }
            }
            return handleMenuCommand(bot, { chat: { id: chatId } });
    }
}


function registerMessageHandler(botInstance, dependencies) {
    const bot = botInstance;
    BASE_URL = dependencies.BASE_URL;
    undoStack = dependencies.undoStack;
    searchService.init(dependencies);

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text) return;

        if (text.startsWith('/')) {
            await stateService.clearState(chatId);
            if (text === '/start' || text === '/menu') {
                return handleMenuCommand(bot, msg);
            }
            return;
        }
        
        const user = await User.findOne({ telegramChatId: String(chatId) }).lean();
        
        if (!user) {
            const response = `👋 Welcome!\n\nYour chat is not linked to an account. Please go to the website settings to link it.\n\nYour Chat ID: \`${chatId}\``;
            return bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }

        if (user.botState && user.botState.name) {
            return handleStatefulInput(bot, chatId, user, text);
        }
        
        handleMenuButton(bot, chatId, user, text);
    });
}

async function handleEmojiChange(bot, chatId, newEmoji) {
    if (!newEmoji || newEmoji.length > 2) {
        return bot.sendMessage(chatId, "❌ Invalid input. Please send just one single emoji.");
    }

    const emojiInUse = await User.findOne({ emojiAvatar: newEmoji, telegramChatId: { $ne: String(chatId) } });
    if (emojiInUse) {
        return bot.sendMessage(chatId, `Sorry, the ${newEmoji} emoji is already taken. Please choose another one.`);
    }

    await User.updateOne({ telegramChatId: String(chatId) }, { $set: { emojiAvatar: newEmoji } });
    
    bot.sendMessage(chatId, `✅ Your new emoji avatar is now *${newEmoji}*!`, { parse_mode: 'Markdown' });
}

async function handleBalanceAdjustment(bot, chatId, adminUser, state) {
    const { userId, amount, reason } = state;
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum)) return bot.sendMessage(chatId, "❌ Invalid amount. Operation cancelled.");

    const userToAdjust = await User.findById(userId);
    if (!userToAdjust) return bot.sendMessage(chatId, `❌ User not found. Operation cancelled.`);

    const newBalance = userToAdjust.lessonsPaid + amountNum;
    userToAdjust.lessonsPaid = newBalance;
    userToAdjust.balanceHistory.push({
        change: amountNum, balanceAfter: newBalance, reason: `Manual Correction by ${adminUser.name}: ${reason}`
    });
    await userToAdjust.save();

    bot.sendMessage(chatId, `✅ Success! *${userToAdjust.name}*'s balance has been adjusted by *${amountNum}*.\nNew balance: *${newBalance}* lessons.`, { parse_mode: 'Markdown' });
}

async function findUserForAdjustment(bot, chatId, searchString) {
    const searchRegex = new RegExp(searchString, 'i');
    const users = await User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).limit(10).lean();

    if (users.length === 0) return bot.sendMessage(chatId, `No users found matching "${searchString}".`);
    if (users.length === 1) {
        const user = users[0];
        await stateService.setState(chatId, 'awaiting_adjustment_amount', { userId: user._id });
        return bot.sendMessage(chatId, `Found *${user.name}*. Now, enter the adjustment amount (e.g., +5 or -1):`, { parse_mode: 'Markdown' });
    }

    const keyboard = {
        inline_keyboard: users.map(u => ([{ text: `${u.name} (${u.role})`, callback_data: `adjust_user_${u._id}` }]))
    };
    bot.sendMessage(chatId, "Found multiple users. Please choose one:", { reply_markup: keyboard });
}

async function sendCalendar(bot, chatId, user) {
    const keyboard = await createCalendarKeyboard(user, new Date());
    bot.sendMessage(chatId, "📅 Your schedule:", { reply_markup: keyboard });
}

async function sendTodaysLessons(bot, chatId, user) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

    const lessons = await Lesson.find({
        teacher: user._id,
        lessonDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ lessonDate: 1 }).populate('student', 'name').populate('course', 'name').lean(); 

    const dateTitle = escapeHtml(new Date().toLocaleDateString('en-GB'));
    let response = `<b>Your lessons for today, ${dateTitle}:</b>\n\n`;

    if (lessons.length > 0) {
        lessons.forEach(l => {
            const time = escapeHtml(new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            const studentName = escapeHtml(l.student.name);
            const courseName = escapeHtml(l.course.name || 'General');
            const status = getStatusEmoji(l.status);

            response += `${status} <b>${time}</b> - ${studentName} <i>(${courseName.split(' ')[0]})</i>\n`;
        });
    } else {
        response = "You have no lessons scheduled for today.";
    }
    
    await bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
}
async function sendTeacherList(bot, chatId, user) {
    const teacherIds = user.teachers && user.teachers.length > 0 ? user.teachers : (user.teacher ? [user.teacher] : []);
    
    if (teacherIds.length === 0) {
        return bot.sendMessage(chatId, "You don't have any assigned teachers yet.");
    }

    const teachers = await User.find({ _id: { $in: teacherIds } }).lean();
    if (!teachers || teachers.length === 0) {
         return bot.sendMessage(chatId, "Could not find teacher details.");
    }

    let message = "👨‍🏫 *Your Teachers:*\n\n";
    teachers.forEach(teacher => {
        message += `- ${teacher.name} ${teacher.emojiAvatar || ''}\n  *Contact:* ${teacher.contact || teacher.email || 'Not provided'}\n\n`;
    });
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}


function sendSettingsMenu(bot, chatId, user) {
    const message = "⚙️ *Settings*\n\nHere you can manage your bot preferences.";
    const keyboard = {
        inline_keyboard: [
            [{ text: `Notifications: ${user.notifications && user.notifications.lessonReminders ? 'ON' : 'OFF'}`, callback_data: "settings_toggle_notifications" }],
            [{ text: `Change Emoji Avatar: ${user.emojiAvatar || 'Not set'}`, callback_data: "settings_change_emoji" }]
        ]
    };
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown', reply_markup: keyboard });
}

function sendHelpMessage(bot, chatId) {
    const message = "❓ *Help Section*\n\n" +
        "You can use the menu buttons to navigate.\n" +
        "If you encounter an issue, try using /start to refresh the bot.\n\n" +
        `For technical support, please contact us through our website: ${BASE_URL}`;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });
}

module.exports = { registerMessageHandler };