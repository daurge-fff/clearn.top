const User = require('../../models/User');
const Lesson = require('../../models/Lesson');
const Grade = require('../../models/Grade');
const { createCalendarKeyboard } = require('../keyboards/calendarKeyboards');
const { getStatusEmoji, createPaginationKeyboard, escapeHtml } = require('../utils/helpers');
const stateService = require('../services/stateService');
const searchService = require('../services/searchService');
const { approvePayment, declinePayment } = require('../../services/paymentService');
const moment = require('moment-timezone');

// Stars are now awarded directly based on the grade score (1:1 ratio)

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
            await ctx.editMessageText(`You have *${updatedUser.lessonsPaid || 0}* 📚 lessons remaining and *${updatedUser.stars || 0}* ⭐ stars.`, {
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

    const oldStatus = lesson.status;
    undoStack.push({ chatId, type: 'lesson_status', data: { lessonId, previousStatus: oldStatus } });

    if (actionType === 'completed') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'completed' });
        
        // Adjust lessonsPaid based on status change
        if (oldStatus === 'scheduled') {
            // Lesson was scheduled and now completed - no refund needed
        } else if (oldStatus.startsWith('cancelled_')) {
            // Lesson was cancelled and now marked as completed - deduct from balance
            await User.findByIdAndUpdate(lesson.student._id, { $inc: { lessonsPaid: -1 } });
        }
        
        await ctx.editMessageText(`✅ Lesson with ${lesson.student.name} marked as completed.`);
        const maxGrade = lesson.isProject ? 25 : 10;
        const gradeKeyboard = { inline_keyboard: [] };
        
        if (lesson.isProject) {
            // For projects: 1-25 scale
            gradeKeyboard.inline_keyboard = [
                [1,2,3,4,5].map(g => ({ text: `${g}`, callback_data: `grade_${lessonId}_${g}` })),
                [6,7,8,9,10].map(g => ({ text: `${g}`, callback_data: `grade_${lessonId}_${g}` })),
                [11,12,13,14,15].map(g => ({ text: `${g}`, callback_data: `grade_${lessonId}_${g}` })),
                [16,17,18,19,20].map(g => ({ text: `${g}`, callback_data: `grade_${lessonId}_${g}` })),
                [21,22,23,24,25].map(g => ({ text: `${g}`, callback_data: `grade_${lessonId}_${g}` }))
            ];
        } else {
            // For regular lessons: 1-10 scale
            gradeKeyboard.inline_keyboard = [
                [1,2,3,4,5].map(g => ({ text: `${g}`, callback_data: `grade_${lessonId}_${g}` })),
                [6,7,8,9,10].map(g => ({ text: `${g}`, callback_data: `grade_${lessonId}_${g}` }))
            ];
        }
        
        await ctx.reply(`Please rate the ${lesson.isProject ? 'project' : 'lesson'} from 1 to ${maxGrade}:`, { reply_markup: gradeKeyboard });
    } else if (actionType === 'noshow') {
        await Lesson.findByIdAndUpdate(lessonId, { status: 'no_show' });
        
        // Adjust lessonsPaid based on status change
        if (oldStatus === 'scheduled') {
            // Lesson was scheduled and now no-show - no refund (lesson is consumed)
        } else if (oldStatus.startsWith('cancelled_')) {
            // Lesson was cancelled and now marked as no-show - deduct from balance
            await User.findByIdAndUpdate(lesson.student._id, { $inc: { lessonsPaid: -1 } });
        }
        
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
        if (rest[1] === 'notification') {
            await stateService.setState(chatId, 'awaiting_notification_for_user', { targetUserId });
            await ctx.editMessageText(`Enter the message you want to send to this user:`);
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


async function handleConfirmMessage(ctx, user, params) {
    try {
        const [type, ...rest] = params;
        
        if (type === 'broadcast') {
            const [role, encodedMessage] = rest;
            
            // Validate base64 encoded message
            let message;
            try {
                message = Buffer.from(encodedMessage, 'base64').toString('utf-8');
            } catch (decodeError) {
                console.error('Failed to decode broadcast message:', decodeError);
                return ctx.editMessageText('❌ Error: Invalid message format. Please try again.');
            }
            
            let query = { telegramChatId: { $exists: true, $ne: null } };
            if (role !== 'all') {
                query.role = role;
            }
            
            const users = await User.find(query, 'telegramChatId name').lean();
            
            if (users.length === 0) {
                return ctx.editMessageText('❌ No users found to send message to.');
            }
            
            let successCount = 0;
            let failCount = 0;
            const failedUsers = [];
            
            // Show progress for large broadcasts
            if (users.length > 10) {
                await ctx.editMessageText(`📤 Sending broadcast to ${users.length} users...`);
            }
            
            for (const targetUser of users) {
                try {
                    await ctx.telegram.sendMessage(targetUser.telegramChatId, message);
                    successCount++;
                } catch (error) {
                    failCount++;
                    failedUsers.push(targetUser.name);
                    console.error(`Failed to send broadcast to ${targetUser.name} (ID: ${targetUser._id}):`, {
                        error: error.message,
                        chatId: targetUser.telegramChatId,
                        messageLength: message.length
                    });
                }
            }
            
            // Detailed delivery report
            let reportMessage = `✅ Broadcast completed!\n\n📊 Delivery Statistics:\n✅ Successfully delivered: ${successCount}\n❌ Failed deliveries: ${failCount}\n👥 Total recipients: ${users.length}`;
            
            if (failCount > 0 && failCount <= 5) {
                reportMessage += `\n\n❌ Failed to deliver to: ${failedUsers.join(', ')}`;
            } else if (failCount > 5) {
                reportMessage += `\n\n❌ Multiple delivery failures (check logs for details)`;
            }
            
            await ctx.editMessageText(reportMessage);
            
            // Log broadcast summary
            console.log(`Broadcast completed - Role: ${role}, Success: ${successCount}, Failed: ${failCount}, Total: ${users.length}`);
            
        } else if (type === 'personal') {
            const [userId, encodedMessage] = rest;
            const message = Buffer.from(encodedMessage, 'base64').toString('utf-8');
            
            const targetUser = await User.findById(userId, 'telegramChatId name').lean();
            if (!targetUser || !targetUser.telegramChatId) {
                return ctx.editMessageText('❌ User not found or has no Telegram connection.');
            }
            
            await ctx.telegram.sendMessage(targetUser.telegramChatId, message);
            await ctx.editMessageText(`✅ Message sent successfully to ${targetUser.name}!`);
        }
        
        await ctx.answerCbQuery();
    } catch (error) {
        console.error('Confirm message error:', error);
        await ctx.answerCbQuery('❌ Error sending message.');
    }
}

async function handleLessonGrade(ctx, user, lessonId, grade) {
    try {
        const lesson = await Lesson.findById(lessonId).populate('student', 'name');
        if (!lesson) return ctx.answerCbQuery("Lesson not found");
        
        const finalScore = parseInt(grade);
        const maxScore = lesson.isProject ? 25 : 10;
        
        // Validate grade range
        if (finalScore < 1 || finalScore > maxScore) {
            return ctx.answerCbQuery(`Invalid grade. Must be between 1 and ${maxScore}`);
        }
        
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
        
        // Award stars equal to the grade score
        const starsToAward = finalScore;
        const User = require('../../models/User');
        const student = await User.findById(lesson.student._id);
        if (student) {
            // Check if grade stars were already awarded for this specific lesson
            const existingGradeEntry = student.balanceHistory.find(entry => 
                entry.reason && entry.reason.includes('lesson grade') && 
                entry.reason.includes(`(ID: ${lessonId})`)
            );
            
            if (existingGradeEntry) {
                // Update existing grade entry
                const starsDifference = starsToAward - existingGradeEntry.change;
                const newStarsBalance = (student.stars || 0) + starsDifference;
                student.stars = Math.max(0, newStarsBalance); // Prevent negative stars
                
                // Update the existing entry
                existingGradeEntry.change = starsToAward;
                existingGradeEntry.starsBalanceAfter = Number(student.stars);
                existingGradeEntry.reason = `Stars earned for lesson grade: ${finalScore}/${maxScore} (ID: ${lessonId})`;
                existingGradeEntry.date = new Date();
            } else {
                // Create new grade entry
                const newStarsBalance = (student.stars || 0) + starsToAward;
                student.stars = newStarsBalance;
                
                student.balanceHistory.push({
                    date: new Date(),
                    change: starsToAward,
                    starsBalanceAfter: Number(newStarsBalance),
                    lessonsBalanceAfter: Number((student.lessonsPaid || 0) + (student.freeReferralLessons || 0)),
                    reason: `Stars earned for lesson grade: ${finalScore}/${maxScore} (ID: ${lessonId})`,
                    isStarAdjustment: true
                });
            }
            
            await student.save();
        }
        
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        await ctx.reply(`✅ Grade ${finalScore}/${maxScore} set for lesson with ${lesson.student.name}. ${finalScore} stars awarded.`);
        await ctx.answerCbQuery(`Grade ${grade} saved`);
    } catch (error) {
        console.error("Grade error:", error);
        await ctx.answerCbQuery("Error saving the grade");
    }
}

function registerCallbackQueryHandler(bot, dependencies) {
    bot.on('callback_query', async (ctx) => {
        const chatId = ctx.callbackQuery.message?.chat.id;
        const telegramUsername = ctx.from.username;
        
        if (!ctx.callbackQuery.data || !chatId) {
            return ctx.answerCbQuery().catch(e => console.error("Safe answerCbQuery failed:", e.message));
        }

        try {
            const [action, ...params] = ctx.callbackQuery.data.split('_');
            
            // Update user's telegram username if they exist and have username
            if (telegramUsername) {
                await User.findOneAndUpdate(
                    { telegramChatId: String(chatId) },
                    { telegramUsername: telegramUsername },
                    { new: true }
                );
            }
            
            const user = await User.findOne({ telegramChatId: String(chatId) });
            if (!user) {
                return ctx.answerCbQuery("Account not found. Use /start");
            }

            switch (action) {
                case 'cancel':  
                    if (params[0] === 'broadcast') {
                        const [, role, encodedMessage] = params;
                        let messagePreview = '';
                        
                        // Try to decode message for preview
                        try {
                            const message = Buffer.from(encodedMessage, 'base64').toString('utf-8');
                            messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
                        } catch (error) {
                            messagePreview = 'Unable to decode message';
                        }
                        
                        const roleText = role === 'all' ? 'all users' : `users with role "${role}"`;
                        
                        await ctx.editMessageText(
                            `❌ Broadcast cancelled\n\n` +
                            `📝 Message: "${messagePreview}"\n` +
                            `👥 Recipients: ${roleText}\n\n` +
                            `✅ Nothing was sent to anyone.`
                        );
                        await ctx.answerCbQuery('Broadcast cancelled');
                    } else if (params[0] === 'personal') {
                        const [, userId, encodedMessage] = params;
                        let messagePreview = '';
                        
                        // Try to decode message for preview
                        try {
                            const message = Buffer.from(encodedMessage, 'base64').toString('utf-8');
                            messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
                        } catch (error) {
                            messagePreview = 'Unable to decode message';
                        }
                        
                        const targetUser = await User.findById(userId, 'name').lean();
                        const userName = targetUser ? targetUser.name : 'Unknown user';
                        
                        await ctx.editMessageText(
                            `❌ Personal message cancelled\n\n` +
                            `📝 Message: "${messagePreview}"\n` +
                            `👤 Recipient: ${userName}\n\n` +
                            `✅ Nothing was sent.`
                        );
                        await ctx.answerCbQuery('Message cancelled');
                    } else {
                        await handleCancellationRequest(ctx, user, params);
                    }
                    break;
                case 'settings':await handleSettingsCallback(ctx, user, params); break;
                case 'admin':   await handleAdminCallback(ctx, user, params); break;
                case 'cal':     await handleCalendarCallback(ctx, user, params); break;
                case 'page':    await handlePaginationCallback(ctx, user, params); break;
                case 'lesson':  await handleLessonCallback(ctx, user, params, dependencies); break;
                case 'grade':   await handleLessonGrade(ctx, user, params[0], params[1]); break;
                case 'refresh': await handleRefreshCallback(ctx, user, params); break;
                case 'admin_select_user_notification': await handleAdminCallback(ctx, user, params); break;
                case 'confirm': await handleConfirmMessage(ctx, user, params); break;
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