const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

dotenv.config({ path: './.env' });

const bot = require('./bot');
const { registerMessageHandler } = require('./bot/handlers/messageHandler');
const { registerCallbackQueryHandler } = require('./bot/handlers/callbackQueryHandler');
const { startScheduler } = require('./services/scheduler');
const UndoStack = require('./services/undoStack');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected via server.js...'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

    const app = express();
require('./config/passport')(passport);

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.BASE_URL && process.env.TELEGRAM_BOT_TOKEN) {
    const secretPath = `/telegram/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
    const webhookUrl = `${process.env.BASE_URL}${secretPath}`;
    
    bot.setWebHook(webhookUrl)
        .then(() => console.log(`Webhook successfully set to ${process.env.BASE_URL}`))
        .catch(err => console.error('Error setting webhook:', err.message));
    
    app.post(secretPath, (req, res) => {
        bot.processUpdate(req.body);
        res.sendStatus(200);
    });
} else {
    console.warn("WARNING: BASE_URL or TELEGRAM_BOT_TOKEN not set. Bot might not receive updates via webhook.");
}

const undoStack = new UndoStack();
const dependencies = {
    undoStack,
    BASE_URL: process.env.BASE_URL || 'https://clearn.top'
};
registerMessageHandler(bot, dependencies);
registerCallbackQueryHandler(bot, dependencies);

startScheduler(bot);

console.log('Telegram Bot logic has been initialized by the main server.');


app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/api', require('./routes/api'));


process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! UNHANDLED REJECTION !!!');
  console.error('Reason:', reason.stack || reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error('!!! UNCAUGHT EXCEPTION !!!');
  console.error('Error:', err.stack || err);
  console.error('Origin:', origin);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));