const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const path = require('path');
const expressLayouts = require('express-ejs-layouts');

dotenv.config({ path: './.env' });

const bot = require('./bot');
const messageHandler = require('./bot/handlers/messageHandler');
const { registerCallbackQueryHandler } = require('./bot/handlers/callbackQueryHandler');
const searchService = require('./bot/services/searchService');
const { startScheduler } = require('./services/scheduler');
const UndoStack = require('./services/undoStack');

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    bufferCommands: false // Disable mongoose buffering
})
    .then(async () => {
        console.log('MongoDB Connected via server.js...');
        
        // Инициализируем систему курсов
        const CourseInitializer = require('./scripts/initCourses');
        const initializer = new CourseInitializer();
        await initializer.initialize();
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

// Monitor MongoDB connection status
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

    const app = express();
app.set('trust proxy', true);
require('./config/passport')(passport);

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
// Реальный IP раньше всех роутов
app.set('trust proxy', true);
app.use((req, res, next) => {
    req.realIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
    next();
});
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.BASE_URL && process.env.TELEGRAM_BOT_TOKEN) {
    const secretPath = `/telegram/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
    const webhookUrl = `${process.env.BASE_URL}${secretPath}`;

    bot.telegram.setWebhook(webhookUrl);

    app.use(bot.webhookCallback(secretPath));

} else {
    console.warn("WARNING: BASE_URL or TELEGRAM_BOT_TOKEN not set. Bot might not receive updates via webhook.");
    bot.launch();
}

const undoStack = new UndoStack();
const dependencies = {
    undoStack,
    BASE_URL: process.env.BASE_URL || 'https://clearn.top'
};
messageHandler.registerMessageHandler(bot, dependencies);
registerCallbackQueryHandler(bot, dependencies);
searchService.init(dependencies);

startScheduler(bot);

console.log('Telegram Bot logic has been initialized by the main server.');


// Contact form submission route
app.post('/submit-form', async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }
        
        // Import notification service
        const { notifyAdmin } = require('./services/notificationService');
        
        // Create notification message
        const notificationMessage = `🔔 *New Contact Form Submission*\n\n` +
            `👤 *Name:* ${name}\n` +
            `📧 *Email:* ${email}\n` +
            `💬 *Message:* ${message || 'No message provided'}`;
        
        // Send notification to admin
        await notifyAdmin(notificationMessage);
        
        res.json({ success: true, message: 'Your request has been sent successfully!' });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ message: 'An error occurred while sending your request.' });
    }
});

// File download route
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    
    // Send file for download
    res.download(filePath, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Error downloading file');
        }
    });
});

app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/referral', require('./routes/referral'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/api', require('./routes/api'));

// Реальный IP в req.realIp (с учётом proxy)
app.use((req, res, next) => {
    req.realIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip;
    next();
});


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