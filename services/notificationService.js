const bot = require('../bot');
const User = require('../models/User');

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

async function notifyAllAdmins(message) {
    try {
        // Find all admin users with Telegram chat IDs
        const admins = await User.find({ 
            role: 'admin', 
            telegramChatId: { $exists: true, $ne: null } 
        }).select('telegramChatId name').lean();

        if (admins.length === 0) {
            console.log('No admin users with Telegram chat IDs found.');
            return;
        }

        // Send message to each admin
        const promises = admins.map(async (admin) => {
            try {
                await bot.telegram.sendMessage(admin.telegramChatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
                console.error(`Failed to send notification to admin ${admin.name} (${admin.telegramChatId}):`, error.message);
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Failed to notify all admins:', error.message);
        // Fallback to single admin notification
        await notifyAdmin(message);
    }
}

module.exports = { notifyAdmin, notifyAllAdmins };