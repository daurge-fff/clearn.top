const bot = require('../bot');

async function notifyAdmin(message) {
    const adminChatId = process.env.TELEGRAM_CHAT_ID;
    if (!adminChatId) {
        console.log("WARNING: TELEGRAM_CHAT_ID not set. Admin notifications will not be sent.");
        return;
    }

    try {
        await bot.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error(`Error sending admin notification to ${adminChatId}:`, error.message);
    }
}

module.exports = { notifyAdmin };