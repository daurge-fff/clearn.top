const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('FATAL ERROR: TELEGRAM_BOT_TOKEN not found in .env file.');
}

const bot = new TelegramBot(token);

module.exports = bot;