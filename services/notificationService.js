const bot = require('../bot');

async function notifyAdmin(message) {
    const adminChatId = process.env.TELEGRAM_CHAT_ID;
    if (!adminChatId) {
        console.log("WARNING: TELEGRAM_CHAT_ID not set. Admin notifications will not be sent.");
        return;
    }

    try {
        await bot.telegram.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Failed to send admin notification:', error.message);
        // Don't throw the error to prevent breaking the calling function
    }
}

module.exports = { notifyAdmin };