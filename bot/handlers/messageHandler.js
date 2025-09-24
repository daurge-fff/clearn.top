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
    const telegramUsername = ctx.from.username;
    
    // Update user's telegram username if they exist
    if (telegramUsername) {
        await User.findOneAndUpdate(
            { telegramChatId: String(chatId) },
            { telegramUsername: telegramUsername },
            { new: true }
        );
    }
    
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
            [{ text: "💳 Balance Adjustment" }, { text: "📢 Notifications" }],
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

    // Handle "Back to Menu" button
    if (text === '↩️ Back to Menu') {
        await stateService.clearState(chatId);
        return handleMenuCommand(ctx);
    }

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
            const { targetUserId: emojiTargetUserId } = state.context;
            return handleEmojiChange(ctx, emojiTargetUserId, text);
        case 'awaiting_cancellation_reason':
            const { lessonId } = state.context;
            return handleLessonCancellation(ctx, user, lessonId, text);
        
        // Notification states
        case 'awaiting_broadcast_message':
            await stateService.clearState(chatId);
            return sendBroadcastMessage(ctx, text, 'all');
        case 'awaiting_students_message':
            await stateService.clearState(chatId);
            return sendBroadcastMessage(ctx, text, 'student');
        case 'awaiting_teachers_message':
            await stateService.clearState(chatId);
            return sendBroadcastMessage(ctx, text, 'teacher');
        case 'awaiting_specific_user_for_notification':
            return findUserForNotification(ctx, text);
        case 'awaiting_notification_message':
            const { targetUserId: notificationTargetUserId } = state.context;
            await stateService.clearState(chatId);
            return sendNotificationToUser(ctx, notificationTargetUserId, text);
        case 'awaiting_notification_for_user':
            const { targetUserId: selectedUserId } = state.context;
            await stateService.clearState(chatId);
            return sendNotificationToUser(ctx, selectedUserId, text);
        case 'awaiting_lesson_reminder_message':
            await stateService.clearState(chatId);
            return sendLessonReminderBroadcast(ctx, text);
        case 'awaiting_promotion_message':
            await stateService.clearState(chatId);
            return sendBroadcastMessage(ctx, text, 'all', '🎉 PROMOTION');
        case 'awaiting_announcement_message':
            await stateService.clearState(chatId);
            return sendBroadcastMessage(ctx, text, 'all', '📢 ANNOUNCEMENT');
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
    } else if (isTeacher) {
        newStatus = 'cancelled_by_teacher';
    }
    
    // Use LessonBalanceService for consistent balance management
    const LessonBalanceService = require('../services/lessonBalanceService');
    const balanceResult = await LessonBalanceService.changeLessonStatus(
        lessonId,
        newStatus,
        lesson.status,
        user
    );
    
    if (!balanceResult.success) {
        console.error('Balance change failed during cancellation:', balanceResult.error);
        // Continue execution even if balance fails
    }
    
    if (isStudent) {
        const teacher = lesson.teacher;
        if (teacher && teacher.telegramChatId) {
            // Получаем часовой пояс учителя для отображения времени
            const teacherData = await User.findById(teacher._id).select('timeZone').lean();
            const teacherTz = teacherData?.timeZone || 'Europe/Moscow';
            const date = moment.tz(lesson.lessonDate, teacherTz).format('DD/MM/YYYY');
            const time = moment.tz(lesson.lessonDate, teacherTz).format('HH:mm');
            const notification = `⚠️ *Lesson Cancellation*\n\nStudent *${user.name}* has cancelled the lesson scheduled for *${date} at ${time}*.\n\n*Reason:* ${reason}`;
            try {
                ctx.telegram.sendMessage(teacher.telegramChatId, notification, { parse_mode: 'Markdown' });
            } catch (telegramError) {
                console.error(`Failed to send lesson notification to teacher ${teacher.name}:`, telegramError.message);
            }
        }
    } else if (isTeacher) {
        
        const student = lesson.student;
        if (student && student.telegramChatId) {
            // Получаем часовой пояс студента для отображения времени
            const studentData = await User.findById(student._id).select('timeZone').lean();
            const studentTz = studentData?.timeZone || 'Europe/Moscow';
            const date = moment.tz(lesson.lessonDate, studentTz).format('DD/MM/YYYY');
            const time = moment.tz(lesson.lessonDate, studentTz).format('HH:mm');
            const notification = `⚠️ *Lesson Cancellation*\n\nYour teacher *${user.name}* has cancelled the lesson scheduled for *${date} at ${time}*.\n\n*Reason:* ${reason}\n\nThe lesson has been returned to your balance.`;
            try {
                ctx.telegram.sendMessage(student.telegramChatId, notification, { parse_mode: 'Markdown' });
            } catch (telegramError) {
                console.error(`Failed to send lesson notification to student ${student.name}:`, telegramError.message);
            }
        }
    }

    lesson.status = newStatus;
    lesson.cancellationReason = reason;
    await lesson.save();

    await ctx.reply("✅ Lesson successfully cancelled.");

    // Audit
    try {
        const { logLessonCancelled } = require('../services/auditService');
        const moment = require('moment-timezone');
        await logLessonCancelled({
            lessonId,
            byRole: isStudent ? 'student' : 'teacher',
            reason,
            actor: user,
            ip: ctx?.state?.ip || null,
            time: moment.tz(lesson.lessonDate, 'Europe/Moscow').format('YYYY-MM-DD HH:mm'),
            withUser: isStudent ? (lesson.teacher?.name || '') : (lesson.student?.name || '')
        });
    } catch (e) { console.error('[audit] lesson cancel:', e.message); }
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
            return ctx.reply(`You have *${user.lessonsPaid || 0}* 📚 lessons remaining and *${user.stars || 0}* ⭐ stars.`, { 
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

        case '📢 Notifications':
            return showNotificationMenu(ctx);

        case '🎁 Partner Program':
            return referralService.showReferralInfo(ctx);

        // Notification handlers
        case '📤 Send to All Users':
            await stateService.setState(chatId, 'awaiting_broadcast_message');
            return ctx.reply("📝 Enter the message to send to all users:");

        case '👤 Send to Specific User':
            await stateService.setState(chatId, 'awaiting_specific_user_for_notification');
            return ctx.reply("👤 Enter name or email of the user to send notification to:");

        case '👨‍🎓 Send to All Students':
            await stateService.setState(chatId, 'awaiting_students_message');
            return ctx.reply("📝 Enter the message to send to all students:");

        case '👨‍🏫 Send to All Teachers':
            await stateService.setState(chatId, 'awaiting_teachers_message');
            return ctx.reply("📝 Enter the message to send to all teachers:");

        case '⚠️ Low Balance Alert':
            return sendLowBalanceAlert(ctx);

        case '📚 Lesson Reminder':
            await stateService.setState(chatId, 'awaiting_lesson_reminder_message');
            return ctx.reply("📝 Enter custom lesson reminder message (or type 'default' for standard message):");

        case '🎉 Promotion Alert':
            await stateService.setState(chatId, 'awaiting_promotion_message');
            return ctx.reply("📝 Enter promotion message:");

        case '📢 General Announcement':
            await stateService.setState(chatId, 'awaiting_announcement_message');
            return ctx.reply("📝 Enter general announcement message:");

        case '↩️ Back to Menu':
            return handleMenuCommand(ctx);

        case '↩️ Undo':
            const lastAction = undoStack.pop(chatId);
            if (!lastAction) {
                await ctx.reply("Nothing to undo.");
            } else {
                 if (lastAction.type === 'lesson_status') {
                    const lesson = await Lesson.findById(lastAction.data.lessonId).populate('student', '_id');
                    if (lesson) {
                        const currentStatus = lesson.status;
                        const previousStatus = lastAction.data.previousStatus;
                        
                        // Update lesson status
                        await Lesson.findByIdAndUpdate(lastAction.data.lessonId, { status: previousStatus });
                        
                        // Use LessonBalanceService for consistent balance management
                        const LessonBalanceService = require('../services/lessonBalanceService');
                        const balanceResult = await LessonBalanceService.changeLessonStatus(
                            lastAction.data.lessonId,
                            previousStatus,
                            currentStatus,
                            user
                        );
                        
                        if (!balanceResult.success) {
                            console.error('Balance change failed during undo:', balanceResult.error);
                        }
                        
                        await ctx.reply(`✅ Action undone. Lesson status reverted to "${previousStatus}".`);
                    } else {
                        await ctx.reply("❌ Error: Lesson not found.");
                    }
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
    // /cancel — сброс любого ожидания состояния
    bot.command('cancel', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            await stateService.clearState(chatId);
        await ctx.reply('✅ Cancelled. Returning to menu.');
            try {
                const { logEvent } = require('../../services/auditService');
            await logEvent({
                    tags: ['bot','command','cancel'],
                    title: 'Bot Command /cancel',
                    lines: [],
                actor: { name: ctx.from.first_name || ctx.from.username || 'Telegram User', _id: ctx.from.id, telegramUsername: ctx.from.username },
                ip: null,
                    emoji: '🛑'
                });
            } catch (e) { /* silent */ }
            return handleMenuCommand(ctx);
        } catch (e) {
            return ctx.reply('❌ Error while cancelling.');
        }
    });

    bot.on('text', async (ctx) => {
        const chatId = ctx.chat.id;
        const text = ctx.message.text;
        const telegramUsername = ctx.from.username;

        if (text.startsWith('/')) {
            // Command handling is now explicit, so we can ignore text that looks like a command
            return;
        }

        // Update user's telegram username if they exist and have username
        if (telegramUsername) {
            await User.findOneAndUpdate(
                { telegramChatId: String(chatId) },
                { telegramUsername: telegramUsername },
                { new: true }
            );
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
    // clear any pending state related to emoji
    await stateService.clearState(chatId);
    // Audit: emoji change
    try {
        const { logEvent } = require('../../services/auditService');
        await logEvent({
            tags: ['bot','user','emoji','update'],
            title: 'User Emoji Updated',
            lines: [ `User: ${updatedUser.name} <${updatedUser.email}>`, `UserID: ${updatedUser._id}`, `Emoji: ${newEmoji}` ],
            actor: { name: ctx.from.first_name || ctx.from.username || 'Telegram User', _id: ctx.from.id, telegramUsername: ctx.from.username },
            ip: null,
            emoji: '😀'
        });
    } catch (e) { /* silent */ }
    
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
    
    // Сбросить флаги уведомлений о низком балансе при увеличении баланса
    if (amountNum > 0) {
        userToAdjust.balanceReminders = {
            twoLessonsRemaining: false,
            oneLessonRemaining: false
        };
    }
    
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
            const time = escapeHtml(moment.tz(l.lessonDate, userTz).format('HH:mm'));
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

async function showNotificationMenu(ctx) {
    const keyboard = [
        [{ text: "📤 Send to All Users" }, { text: "👤 Send to Specific User" }],
        [{ text: "👨‍🎓 Send to All Students" }, { text: "👨‍🏫 Send to All Teachers" }],
        [{ text: "⚠️ Low Balance Alert" }, { text: "📚 Lesson Reminder" }],
        [{ text: "🎉 Promotion Alert" }, { text: "📢 General Announcement" }],
        [{ text: "↩️ Back to Menu" }]
    ];

    await ctx.reply(
        "📢 *Notification Center*\n\nChoose notification type:",
        {
            parse_mode: 'Markdown',
            reply_markup: { keyboard, resize_keyboard: true }
        }
    );
}

async function sendBroadcastMessage(ctx, message, role = 'all', prefix = '') {
    try {
        // Validate message length
        if (!message || message.trim().length === 0) {
            return ctx.reply('❌ Message cannot be empty.');
        }
        
        if (message.length > 4000) {
            return ctx.reply('❌ Message is too long. Please keep it under 4000 characters.');
        }

        let query = { telegramChatId: { $exists: true, $ne: null } };
        if (role !== 'all') {
            query.role = role;
        }

        const users = await User.find(query, 'telegramChatId name').lean();
        const finalMessage = prefix ? `${prefix}\n\n${message}` : message;
        
        // Additional validation for final message length after prefix
        if (finalMessage.length > 4000) {
            return ctx.reply('❌ Message with prefix is too long. Please shorten your message.');
        }
        
        // Show confirmation before sending
        const roleText = role === 'all' ? 'all users' : `all ${role}s`;
        const confirmationMessage = `📋 *Message Preview*\n\n*Recipients:* ${roleText} (${users.length} users)\n\n*Message:*\n${finalMessage}\n\n✅ Confirm sending this message?`;
        
        // Store message temporarily and get ID
        const messageId = stateService.storeMessage(finalMessage, { type: 'broadcast', role });
        
        const keyboard = {
            inline_keyboard: [
                [{ text: '✅ Send Message', callback_data: `confirm_broadcast_${messageId}` }],
                [{ text: '❌ Cancel', callback_data: `cancel_broadcast_${messageId}` }]
            ]
        };
        
        return ctx.reply(confirmationMessage, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
        console.error('Broadcast error:', error);
        await ctx.reply('❌ Error sending broadcast message.');
    }
}

async function findUserForNotification(ctx, searchString) {
    const chatId = ctx.chat.id;
    const users = await User.find({
        $or: [{ name: new RegExp(searchString, 'i') }, { email: new RegExp(searchString, 'i') }]
    }).limit(10).lean();

    if (users.length === 0) {
        return ctx.reply(`No users found matching "${searchString}".`);
    }

    if (users.length === 1) {
        const targetUser = users[0];
        await stateService.setState(chatId, 'awaiting_notification_message', { targetUserId: targetUser._id });
        return ctx.reply(`Found user *${targetUser.name}*. Now enter the message to send:`, { parse_mode: 'Markdown' });
    }

    const keyboard = {
        inline_keyboard: users.map(u => ([{
            text: `${u.name} (${u.role})`,
            callback_data: `admin_select_user_notification_${u._id}`
        }]))
    };
    ctx.reply("Found multiple users. Please choose one:", { reply_markup: keyboard });
}

async function sendNotificationToUser(ctx, userId, message) {
    try {
        const user = await User.findById(userId, 'telegramChatId name').lean();
        if (!user || !user.telegramChatId) {
            return ctx.reply('❌ User not found or has no Telegram connection.');
        }

        const finalMessage = `📢 Personal notification:\n\n${message}`;
        
        // Show confirmation before sending
        const confirmationMessage = `📋 *Message Preview*\n\n*Recipient:* ${user.name}\n\n*Message:*\n${finalMessage}\n\n✅ Confirm sending this message?`;
        
        // Store message temporarily and get ID
        const messageId = stateService.storeMessage(finalMessage, { type: 'personal', userId });
        
        const keyboard = {
            inline_keyboard: [
                [{ text: '✅ Send Message', callback_data: `confirm_personal_${messageId}` }],
                [{ text: '❌ Cancel', callback_data: `cancel_personal_${messageId}` }]
            ]
        };
        
        return ctx.reply(confirmationMessage, { parse_mode: 'Markdown', reply_markup: keyboard });
    } catch (error) {
        console.error('Send notification error:', error);
        await ctx.reply('❌ Error sending notification.');
    }
}

async function sendLowBalanceAlert(ctx) {
    try {
        // Найти студентов с низким балансом, которым еще не отправлялись уведомления
        const lowBalanceUsers = await User.find({
            role: 'student',
            lessonsPaid: { $lt: 2 },
            telegramChatId: { $exists: true, $ne: null },
            $or: [
                { 'balanceReminders.twoLessonsRemaining': { $ne: true }, lessonsPaid: { $lt: 2, $gte: 0 } },
                { 'balanceReminders.oneLessonRemaining': { $ne: true }, lessonsPaid: { $lt: 1 } }
            ]
        }, 'telegramChatId name lessonsPaid balanceReminders');

        if (lowBalanceUsers.length === 0) {
            return ctx.reply('ℹ️ No students with low balance (less than 2 lessons) found or all have already been notified.');
        }

        let successCount = 0;
        let failCount = 0;

        for (const user of lowBalanceUsers) {
            try {
                // Проверить, нужно ли отправлять уведомление
                let shouldSend = false;
                let reminderField = null;
                
                if (user.lessonsPaid < 1 && !user.balanceReminders?.oneLessonRemaining) {
                    shouldSend = true;
                    reminderField = 'balanceReminders.oneLessonRemaining';
                } else if (user.lessonsPaid < 2 && user.lessonsPaid >= 0 && !user.balanceReminders?.twoLessonsRemaining) {
                    shouldSend = true;
                    reminderField = 'balanceReminders.twoLessonsRemaining';
                }
                
                if (shouldSend) {
                    const message = `⚠️ Low Balance Alert\n\nHi ${user.name}!\n\nYou have only ${user.lessonsPaid} lesson${user.lessonsPaid > 1 ? 's' : ''} remaining. Consider purchasing more lessons to continue your learning journey!\n\n💡 Contact your teacher or visit our website to top up your balance.`;
                    await ctx.telegram.sendMessage(user.telegramChatId, message);
                    
                    // Отметить, что уведомление отправлено
                    await User.findByIdAndUpdate(user._id, {
                        $set: { [reminderField]: true }
                    });
                    
                    successCount++;
                }
            } catch (error) {
                failCount++;
                console.error(`Failed to send low balance alert to ${user.name}:`, error.message);
            }
        }

        await ctx.reply(`✅ Low balance alerts sent!\n\n📊 Statistics:\n✅ Delivered: ${successCount}\n❌ Failed: ${failCount}\n👥 Total students with low balance: ${lowBalanceUsers.length}`);
        
        return handleMenuCommand(ctx);
    } catch (error) {
        console.error('Low balance alert error:', error);
        await ctx.reply('❌ Error sending low balance alerts.');
    }
}

async function sendLessonReminderBroadcast(ctx, message) {
    try {
        const defaultMessage = "📚 Lesson Reminder\n\nDon't forget about your upcoming lessons! Check your schedule and be prepared.\n\nGood luck with your studies! 🎓";
        const finalMessage = message.toLowerCase() === 'default' ? defaultMessage : `📚 Lesson Reminder\n\n${message}`;
        
        return sendBroadcastMessage(ctx, finalMessage, 'student', '📚 Lesson Reminder');
    } catch (error) {
        console.error('Lesson reminder error:', error);
        await ctx.reply('❌ Error sending lesson reminders.');
    }
}

module.exports = { registerMessageHandler, handleStartCommand, handleMenuCommand };