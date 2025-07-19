const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error('FATAL ERROR: TELEGRAM_BOT_TOKEN not found in .env file.');
}

const bot = new Telegraf(token);

module.exports = bot;