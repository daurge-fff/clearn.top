const User = require('../../models/User');
const Lesson = require('../../models/Lesson');
const { getStatusEmoji, escapeHtml } = require('../utils/helpers');
const { createCalendarKeyboard } = require('../keyboards/calendarKeyboards');
const stateService = require('../services/stateService');
const searchService = require('../services/searchService');
const analyticsService = require('../services/analyticsService');
const referralService = require('../services/referralService');
const moment = require('moment-timezone');

let BASE_URL;
let undoStack;

async function handleStartCommand(ctx) {
    const chatId = ctx.chat.id;
    const parts = ctx.message.text.split(' ');
    if (parts.length > 1) {
        const referralCode = parts[1];
        await referralService.handleReferral(ctx, referralCode);
    }
    await handleMenuCommand(ctx);
}

async function handleMenuCommand(ctx) {
    const chatId = ctx.chat.id;
    const user = await User.findOne({ telegramChatId: String(chatId) }).lean();

    if (!user) {
        const response = `👋 Welcome to Code & Learn!\n\nTo connect your account:\n1. Go to Settings on our website\n2. Enter this Chat ID: \`${chatId}\`\n3. Return here and use /menu`;
        return ctx.reply(response, { 
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
            [{ text: "👨‍🏫 My Teacher" }, { text: "🎁 Partner Program" }],
            [{ text: "⚙️ Settings" }]
        ];
    } else if (user.role === 'teacher') {
        welcomeText += '\nTeacher Panel:';
        keyboard = [
            [{ text: "📅 Today's Lessons" }, { text: "🗓️ Full Schedule" }],
            [{ text: "👨‍🎓 My Students" }, { text: "📊 Statistics" }],
            [{ text: "⚙️ Settings" }]
        ];
    } else if (user.role === 'admin') {
        welcomeText += '\n👑 Admin Panel:';
        keyboard = [
            [{ text: "📊 Reports" }, { text: "👤 Users" }],
            [{ text: "💳 Balance Adjustment" }],
            [{ text: "⚙️ Settings" }]
        ];
    } 
    if (undoStack.hasActions(chatId)) {
        if (keyboard.length > 0 && keyboard[keyboard.length - 1].length < 2) {
            keyboard[keyboard.length - 1].push({ text: "↩️ Undo" });
        } else {
            keyboard.push([{ text: "↩️ Undo" }]);
        }
    }
    keyboard.push([{ text: "❓ Help" }]);

    ctx.reply(welcomeText, {
        reply_markup: { keyboard, resize_keyboard: true }
    });
}

async function handleStatefulInput(ctx, user, text) {
    const chatId = ctx.chat.id;
    const state = await stateService.getState(chatId);
    if (!state || !state.name) return;

    await stateService.clearState(chatId);

    switch (state.name) {
        case 'awaiting_user_search':
            return searchService.findUserForAdmin(ctx, text);
        case 'awaiting_student_name_search':
            return searchService.findStudentForTeacher(ctx, user, text);
        case 'awaiting_user_for_adjustment':
            return findUserForAdjustment(ctx, text);
        case 'awaiting_adjustment_amount':
            const { userId } = state.context; 
            await stateService.setState(chatId, 'awaiting_adjustment_reason', { userId, amount: text });
            return ctx.reply("Amount set. Now, enter a brief reason for this adjustment (e.g., 'Gift' or 'Correction').");
        case 'awaiting_adjustment_reason':
            const { userId: adjUserId, amount } = state.context;
            return handleBalanceAdjustment(ctx, user, { userId: adjUserId, amount, reason: text });
        case 'awaiting_new_emoji':
            return handleEmojiChange(ctx, user._id, text);
        case 'awaiting_user_for_emoji_change':
            return findUserForEmojiChange(ctx, text);
        case 'awaiting_new_emoji_for_user':
            const { targetUserId } = state.context;
            return handleEmojiChange(ctx, targetUserId, text);
        case 'awaiting_cancellation_reason':
            const { lessonId } = state.context;
            return handleLessonCancellation(ctx, user, lessonId, text);
    }
}

async function findUserForEmojiChange(ctx, searchString) {
    const chatId = ctx.chat.id;
    const users = await User.find({
        $or: [{ name: new RegExp(searchString, 'i') }, { email: new RegExp(searchString, 'i') }]
    }).limit(10).lean();

    if (users.length === 0) {
        return ctx.reply(`No users found matching "${searchString}".`);
    }

    if (users.length === 1) {
        const targetUser = users[0];
        await stateService.setState(chatId, 'awaiting_new_emoji_for_user', { targetUserId: targetUser._id });
        return ctx.reply(`Found user *${targetUser.name}*. Send the new emoji for them.`, { parse_mode: 'Markdown' });
    }

    const keyboard = {
        inline_keyboard: users.map(u => ([{
            text: `${u.name} (${u.role})`,
            callback_data: `admin_select_user_emoji_${u._id}`
        }]))
    };
    ctx.reply("Found multiple users. Please choose one:", { reply_markup: keyboard });
}

async function handleLessonCancellation(ctx, user, lessonId, reason) {
    const chatId = ctx.chat.id;
    if (!reason || reason.trim().length < 5) {
        return ctx.reply("❌ Cancellation failed. Please provide a more detailed reason (at least 5 characters).");
    }

    const lesson = await Lesson.findById(lessonId).populate('student teacher', 'telegramChatId name');

    if (!lesson) return ctx.reply("❌ Error: Lesson not found.");
    if (lesson.status !== 'scheduled') return ctx.reply("❌ Error: This lesson cannot be cancelled as it's not in 'scheduled' status.");

    const isStudent = String(lesson.student._id) === String(user._id);
    const isTeacher = String(lesson.teacher._id) === String(user._id);

    if (!isStudent && !isTeacher) {
        return ctx.reply("❌ Error: You are not authorized to cancel this lesson.");
    }
    
    let newStatus = '';
    if (isStudent) {
        newStatus = 'cancelled_by_student';
        await User.findByIdAndUpdate(user._id, { $inc: { lessonsPaid: 1 } });
        
        const teacher = lesson.teacher;
        if (teacher && teacher.telegramChatId) {
            // Получаем часовой пояс учителя для отображения времени
            const teacherData = await User.findById(teacher._id).select('timeZone').lean();
            const teacherTz = teacherData?.timeZone || 'Europe/Moscow';
            const date = moment.utc(lesson.lessonDate).tz(teacherTz).format('DD/MM/YYYY');
            const time = moment.utc(lesson.lessonDate).tz(teacherTz).format('HH:mm');
            const notification = `⚠️ *Lesson Cancellation*\n\nStudent *${user.name}* has cancelled the lesson scheduled for *${date} at ${time}*.\n\n*Reason:* ${reason}`;
            ctx.telegram.sendMessage(teacher.telegramChatId, notification, { parse_mode: 'Markdown' });
        }
    } else if (isTeacher) {
        newStatus = 'cancelled_by_teacher';
    }

    lesson.status = newStatus;
    lesson.cancellationReason = reason;
    await lesson.save();

    await ctx.reply("✅ Lesson successfully cancelled.");
}

async function handleMenuButton(ctx, user, text) {
    const chatId = ctx.chat.id;
    switch (text) {
        case '📅 My Schedule': case '🗓️ Full Schedule':
            return sendCalendar(ctx, user);
        case '⚙️ Settings':
            return sendSettingsMenu(ctx, user);
        case '❓ Help':
            return sendHelpMessage(ctx);

        case '💳 Balance':
            return ctx.reply(`You have *${user.lessonsPaid}* paid lessons remaining.`, { 
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[{ text: "🔄 Refresh", callback_data: "refresh_balance" }]] }
            });
        case '👨‍🏫 My Teacher':
            return sendTeacherList(ctx, user);

        case "📅 Today's Lessons":
            return sendTodaysLessons(ctx, user);
        case '👨‍🎓 My Students':
            return searchService.listStudentsForTeacher(ctx, user);
        case '📊 Statistics':
            return analyticsService.sendTeacherStatistics(ctx, user);

        case '📊 Reports':
            return analyticsService.sendAdminReports(ctx);
        case '👤 Users':
            return searchService.listAllUsers(ctx);
        case '💳 Balance Adjustment':
            await stateService.setState(chatId, 'awaiting_user_for_adjustment');
            return ctx.reply("Enter name or email of the user to adjust their balance:");

        case '🎁 Partner Program':
            return referralService.showReferralInfo(ctx);

        case '↩️ Undo':
            const lastAction = undoStack.pop(chatId);
            if (!lastAction) {
                await ctx.reply("Nothing to undo.");
            } else {
                 if (lastAction.type === 'lesson_status') {
                    await Lesson.findByIdAndUpdate(lastAction.data.lessonId, { status: lastAction.data.previousStatus });
                    await ctx.reply(`✅ Action undone. Lesson status reverted to "${lastAction.data.previousStatus}".`);
                } else {
                    await ctx.reply("Sorry, this action cannot be undone.");
                }
            }
            return handleMenuCommand(ctx);
    }
}


function registerMessageHandler(bot, dependencies) {
    undoStack = dependencies.undoStack;
    BASE_URL = dependencies.BASE_URL;

    bot.command('start', (ctx) => handleStartCommand(ctx));
    bot.command('menu', (ctx) => handleMenuCommand(ctx));
    bot.command('partner', (ctx) => referralService.showReferralInfo(ctx));

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const text = ctx.message.text;

        if (text.startsWith('/')) {
            // Command handling is now explicit, so we can ignore text that looks like a command
            return;
        }

        const user = await User.findOne({ telegramChatId: String(chatId) }).lean();
        if (!user) {
            return ctx.reply(`👋 Welcome to Code & Learn!\n\nTo connect your account:\n1. Go to Settings on our website\n2. Enter this Chat ID: \`${chatId}\`\n3. Return here and use /menu`, {
                parse_mode: 'Markdown',
                reply_markup: { keyboard: [[{ text: "🌐 Open Website" }]], resize_keyboard: true }
            });
        }

        const state = await stateService.getState(chatId);
        if (state && state.name) {
            return handleStatefulInput(ctx, user, text);
        }

        return handleMenuButton(ctx, user, text);
    });
}

async function handleEmojiChange(ctx, targetUserId, newEmoji) {
    const chatId = ctx.chat.id;
    if (!newEmoji || newEmoji.length > 2) { // Allow for some variation in emoji length
        return ctx.reply("❌ Invalid input. Please send just one single emoji.");
    }

    const emojiInUse = await User.findOne({ emojiAvatar: newEmoji, _id: { $ne: targetUserId } });
    if (emojiInUse) {
        return ctx.reply(`Sorry, the ${newEmoji} emoji is already taken by *${emojiInUse.name}*. Please choose another one.`, { parse_mode: 'Markdown' });
    }

    const updatedUser = await User.findByIdAndUpdate(targetUserId, { $set: { emojiAvatar: newEmoji } }, { new: true });
    
    ctx.reply(`✅ Success! *${updatedUser.name}*'s new emoji avatar is now *${newEmoji}*!`, { parse_mode: 'Markdown' });
}

async function handleBalanceAdjustment(ctx, adminUser, state) {
    const chatId = ctx.chat.id;
    const { userId, amount, reason } = state;
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum)) return ctx.reply("❌ Invalid amount. Operation cancelled.");

    const userToAdjust = await User.findById(userId);
    if (!userToAdjust) return ctx.reply(`❌ User not found. Operation cancelled.`);

    const newBalance = userToAdjust.lessonsPaid + amountNum;
    userToAdjust.lessonsPaid = newBalance;
    userToAdjust.balanceHistory.push({
        change: amountNum, balanceAfter: newBalance, reason: `Manual Correction by ${adminUser.name}: ${reason}`, transactionType: 'Manual'
    });
    await userToAdjust.save();

    ctx.reply(`✅ Success! *${userToAdjust.name}*'s balance has been adjusted by *${amountNum}*.\nNew balance: *${newBalance}* lessons.`, { parse_mode: 'Markdown' });
}

async function findUserForAdjustment(ctx, searchString, context = {}) {
    const chatId = ctx.chat.id;
    const users = await User.find({
        $or: [{ name: new RegExp(searchString, 'i') }, { email: new RegExp(searchString, 'i') }],
        role: 'student'
    }).limit(10).lean();

    if (users.length === 0) return ctx.reply(`No students found matching "${searchString}".`);

    if (users.length === 1) {
        const user = users[0];
        if (context.preSetAmount) {
            await stateService.setState(chatId, 'awaiting_adjustment_reason', { userId: user._id, amount: context.preSetAmount });
            return ctx.reply(`Found *${user.name}*. Amount is preset to *${context.preSetAmount}*. Now, enter a brief reason for this adjustment:`, { parse_mode: 'Markdown' });
        }
        await stateService.setState(chatId, 'awaiting_adjustment_amount', { userId: user._id });
        return ctx.reply(`Found *${user.name}*. Now, enter the adjustment amount (e.g., +5 or -1):`, { parse_mode: 'Markdown' });
    }

    const keyboard = {
        inline_keyboard: users.map(u => ([{
            text: `${u.name} (Balance: ${u.lessonsPaid})`,
            callback_data: `admin_select_user_adjust_${u._id}`
        }]))
    };
    ctx.reply("Found multiple students. Please choose one:", { reply_markup: keyboard });
}

async function sendCalendar(ctx, user) {
    const chatId = ctx.chat.id;
    try {
        const userTz = user.timeZone || 'Europe/Moscow';
        const keyboard = await createCalendarKeyboard(user, moment.tz(userTz).toDate());
        ctx.reply("📅 Your schedule:", { reply_markup: keyboard });
    } catch (error) {
        console.error('Error creating calendar:', error);
        ctx.reply("❌ Sorry, there was an error loading your calendar. Please try again later.");
    }
}

async function sendTodaysLessons(ctx, user) {
    const chatId = ctx.chat.id;
    const userTz = user.timeZone || 'Europe/Moscow';
    const today = moment.tz(userTz);
    const startOfDay = today.clone().startOf('day').utc().toDate();
    const endOfDay = today.clone().endOf('day').utc().toDate();

    const lessons = await Lesson.find({
        teacher: user._id,
        lessonDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ lessonDate: 1 }).populate('student', 'name').populate('course', 'name').lean(); 

    const dateTitle = escapeHtml(today.format('DD/MM/YYYY'));
    let response = `<b>Your lessons for today, ${dateTitle}:</b>\n\n`;

    if (lessons.length > 0) {
        lessons.forEach(l => {
            const time = escapeHtml(moment.utc(l.lessonDate).tz(userTz).format('HH:mm'));
            const studentName = escapeHtml(l.student.name);
            const courseName = escapeHtml(l.course.name || 'General');
            const status = getStatusEmoji(l.status);

            response += `${status} <b>${time}</b> - ${studentName} <i>(${courseName.split(' ')[0]})</i>\n`;
        });
    } else {
        response = "You have no lessons scheduled for today.";
    }
    
    await ctx.reply(response, { parse_mode: 'HTML' });
}
async function sendTeacherList(ctx, user) {
    const chatId = ctx.chat.id;
    const teacherIds = user.teacher ? [user.teacher] : [];
    
    if (teacherIds.length === 0) {
        return ctx.reply("You don't have an assigned teacher yet.");
    }

    const teachers = await User.find({ _id: { $in: teacherIds } }).lean();
    if (!teachers || teachers.length === 0) {
         return ctx.reply("Could not find teacher details.");
    }

    let message = "👨‍🏫 *Your Teacher:*\n\n";
    teachers.forEach(teacher => {
        message += `- ${teacher.name} ${teacher.emojiAvatar || ''}\n  *Contact:* ${teacher.contact || teacher.email || 'Not provided'}\n\n`;
    });
    await ctx.reply(message, { parse_mode: 'Markdown' });
}


function sendSettingsMenu(ctx, user) {
    const chatId = ctx.chat.id;
    let message = "⚙️ *Settings*\n\nHere you can manage your bot preferences.";
    const keyboardRows = [
        [{ text: `Notifications: ${user.notifications && user.notifications.lessonReminders ? 'ON' : 'OFF'}`, callback_data: "settings_toggle_notifications" }],
        [{ text: `Change My Emoji: ${user.emojiAvatar || 'Not set'}`, callback_data: "settings_change_emoji" }]
    ];

    if (user.role === 'admin') {
        message += "\n\nAs an admin, you can also manage other users' settings.";
        keyboardRows.push([{ text: "👤 Set User Emoji", callback_data: "admin_set_user_emoji" }]);
    }

    ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboardRows }
    });
}

function sendHelpMessage(ctx) {
    const chatId = ctx.chat.id;
    const message = "❓ *Help & Commands*\n\n" +
        "You can use the menu buttons to navigate.\n" +
        "If you encounter an issue, try using /start to refresh the bot.\n\n" +
        "For technical support, please contact the administrator.\n\n";
    ctx.reply(message, { parse_mode: 'Markdown', disable_web_page_preview: true });
}

module.exports = { registerMessageHandler, handleStartCommand, handleMenuCommand };