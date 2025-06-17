const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const User = require('./models/User');
const Lesson = require('./models/Lesson');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Telegram Bot: MongoDB Connected...'))
    .catch(err => console.error(err));

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log('Telegram Bot has been started...');

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const response = `Welcome to Code & Learn Bot! 
    
To connect your account, please go to your profile settings on our website and enter this Chat ID: \`${chatId}\`

After connecting, you can use the /menu command.`;

    bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const user = await User.findOne({ telegramChatId: String(chatId) });

    if (!user) {
        return bot.sendMessage(chatId, "Your Telegram account is not connected. Please use /start to get your Chat ID.");
    }

    const menuOptions = {
        reply_markup: {
            keyboard: [
                [{ text: "🗓️ My Schedule" }],
                [{ text: "💰 Lessons Balance" }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };

    bot.sendMessage(chatId, `Welcome, ${user.name}! Choose an option:`, menuOptions);
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/')) return;

    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return;

    switch (text) {
        case "💰 Lessons Balance":
            bot.sendMessage(chatId, `You have *${user.lessonsPaid}* paid lessons remaining.`, { parse_mode: 'Markdown' });
            break;
        case "🗓️ My Schedule":
            sendCalendar(chatId);
            break;
    }
});

async function sendCalendar(chatId, date = new Date()) {
    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return;
    const keyboard = await createCalendarKeyboard(user, date);
    bot.sendMessage(chatId, "Your schedule:", { reply_markup: keyboard });
}

async function createCalendarKeyboard(user, date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString('en-US', { month: 'long' });

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const userLessons = await Lesson.find({ 
        student: user._id,
        lessonDate: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
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
        if (row.length === 7) {
            keyboard.push(row);
            row = [];
        }
    }
    if (row.length > 0) keyboard.push(row);

    keyboard.push([
        { text: "This Week", callback_data: "cal_filter_week" },
        { text: "This Month", callback_data: "cal_filter_month" }
    ]);

    return { inline_keyboard: keyboard };
}

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;
    const [action, ...params] = data.split('_');

    const user = await User.findOne({ telegramChatId: String(chatId) });
    if (!user) return bot.answerCallbackQuery(query.id, { text: "Account not found." });

    switch (action) {
        case 'cal':
            handleCalendarCallback(query, user, action, params);
            break;
        case 'cancel':
            handleCancellationCallback(query, user, action, params);
            break;
        default:
            bot.answerCallbackQuery(query.id);
    }
});

async function handleCalendarCallback(query, user, action, params) {
    const [type, year, month, day] = params;
    const messageId = query.message.message_id;

    if (type === 'nav') {
        const newDate = new Date(year, month);
        const keyboard = await createCalendarKeyboard(user, newDate);
        bot.editMessageReplyMarkup(keyboard, { chat_id: user.telegramChatId, message_id: messageId });
    } 
    else if (type === 'day') {
        const selectedDate = new Date(year, month, day);
        const startOfDay = new Date(new Date(selectedDate).setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date(selectedDate).setHours(23, 59, 59, 999));

        const lessons = await Lesson.find({
            student: user._id,
            lessonDate: { $gte: startOfDay, $lte: endOfDay }
        }).populate('teacher', 'name');

        let response = `*Lessons for ${selectedDate.toLocaleDateString('en-GB')}*\n\n`;
        let keyboard = [];

        if (lessons.length > 0) {
            lessons.forEach(l => {
                const time = new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                response += `*${time}* - Lesson with ${l.teacher.name} (${l.status})\n`;
                if (l.status === 'scheduled') {
                    keyboard.push([{ text: `❌ Cancel lesson at ${time}`, callback_data: `cancel_lesson_${l._id}` }]);
                }
            });
        } else {
            response = `You have no lessons on ${selectedDate.toLocaleDateString('en-GB')}.`;
        }
        
        bot.answerCallbackQuery(query.id);
        bot.sendMessage(user.telegramChatId, response, { 
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    else if (type === 'filter') {
        const [filterType] = params.slice(1);
        const now = new Date();
        let startDate, endDate;

        if (filterType === 'week') {
            startDate = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 6));
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        
        const lessons = await Lesson.find({
            student: user._id,
            lessonDate: { $gte: startDate, $lte: endDate }
        }).sort({ lessonDate: 1 }).populate('teacher', 'name');

        let response = `*Lessons for ${filterType}*:\n\n`;
        if (lessons.length > 0) {
            lessons.forEach(l => {
                const date = new Date(l.lessonDate).toLocaleDateString('en-GB');
                const time = new Date(l.lessonDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                response += `*${date} ${time}* - Lesson with ${l.teacher.name} (${l.status})\n`;
            });
        } else {
            response = `You have no lessons for this ${filterType}.`;
        }
        bot.answerCallbackQuery(query.id);
        bot.sendMessage(user.telegramChatId, response, { parse_mode: 'Markdown' });
    }
    else if (type === 'ignore') {
        bot.answerCallbackQuery(query.id);
    }
}

async function handleCancellationCallback(query, user, action, params) {
    const [type, lessonId] = params;
    const chatId = user.telegramChatId;

    if (type === 'lesson') {
        bot.sendMessage(chatId, "Please type the reason for cancellation for this lesson:");
        bot.once('message', async (reasonMsg) => {
            if (reasonMsg.chat.id.toString() !== chatId) return; 

            const reason = reasonMsg.text;
            if (!reason || reason.trim() === "") {
                return bot.sendMessage(chatId, "Cancellation failed. Reason cannot be empty.");
            }

            const lesson = await Lesson.findById(lessonId);
            if (!lesson || String(lesson.student) !== String(user._id) || lesson.status !== 'scheduled') {
                return bot.sendMessage(chatId, "Error: Lesson cannot be cancelled anymore.");
            }

            lesson.status = 'cancelled_by_student';
            lesson.cancellationReason = reason;
            await lesson.save();
            await User.findByIdAndUpdate(user._id, { $inc: { lessonsPaid: 1 } });

            bot.sendMessage(chatId, "✅ Lesson cancelled successfully!");
        });

        bot.answerCallbackQuery(query.id);
    }
}

module.exports = bot;