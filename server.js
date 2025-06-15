const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

// Load config
dotenv.config({ path: './.env' });

// Passport Config
require('./config/passport')(passport);

const app = express();

// EJS Setup
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Body Parser Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // You should also configure a session store for production, e.g., connect-mongo
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Set global variable for logged in user
app.use(function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});

// Static Folder
app.use(express.static(path.join(__dirname, 'public')));


// --- ROUTES ---
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/api', require('./routes/api'));

// Database Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB connection error:', err));


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});