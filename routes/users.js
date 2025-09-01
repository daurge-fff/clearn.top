const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');
const { claimPendingPaymentsForUser } = require('../services/paymentService');
const { notifyAllAdmins } = require('../services/notificationService');

// Login Page
router.get('/login', ensureGuest, (req, res) => {
    res.render('login', { layout: false, errors: [], email: '' });
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { return next(err); }
        if (!user) {
            const errors = [{ msg: 'Invalid email or password. Please try again.' }];
            return res.render('login', { layout: false, errors, email: req.body.email || '' });
        }
        req.logIn(user, async (err) => {
            if (err) { return next(err); }
            
            await claimPendingPaymentsForUser(user);
            user.timeZone = req.body.timeZone || user.timeZone || 'Europe/Moscow';
            await user.save();
            
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Register Page
router.get('/register', ensureGuest, (req, res) => {
    res.render('register', { layout: false, name: '', email: '', contact: '' });
});

// Register Handle
router.post('/register', async (req, res) => {
    const { name, email, password, password2, contact, referralCode, timeZone } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) errors.push({ msg: 'Please enter all required fields' });
    if (password != password2) errors.push({ msg: 'Passwords do not match' });
    if (password.length < 6) errors.push({ msg: 'Password must be at least 6 characters' });

    if (errors.length > 0) {
        return res.render('register', { errors, name, email, contact, referralCode, layout: false });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            errors.push({ msg: 'Email is already registered' });
            return res.render('register', { errors, name, email, contact, referralCode, layout: false });
        }

        let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ referralCode: referralCode.trim() });
            if (!referrer) {
                errors.push({ msg: 'Invalid referral code' });
                return res.render('register', { errors, name, email, contact, referralCode, layout: false });
            }
        }

        const newUser = new User({ 
            name, 
            email: email.toLowerCase(), 
            password, 
            contact,
            timeZone: timeZone || 'Europe/Moscow'
        });

        if (referrer) {
            newUser.referredBy = referrer._id;
        }

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        const savedUser = await newUser.save();

        if (referrer) {
            referrer.referralBonuses = (referrer.referralBonuses || 0) + 1;
            await referrer.save();
        }

        // Notify admins about new user registration
        const adminMessage = `🆕 *Новая регистрация пользователя*\n\n` +
            `👤 *Имя:* ${savedUser.name}\n` +
            `📧 *Email:* ${savedUser.email}\n` +
            `📱 *Контакт:* ${savedUser.contact || 'Не указан'}\n` +
            `🕒 *Дата регистрации:* ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}\n` +
            `🌐 *Часовой пояс:* ${savedUser.timeZone}\n` +
            `🎁 *Реферал:* ${referrer ? `Да (${referrer.name})` : 'Нет'}`;
        
        try {
            await notifyAllAdmins(adminMessage);
        } catch (error) {
            console.error('Failed to send admin notification for new user registration:', error);
        }

        await claimPendingPaymentsForUser(savedUser);
        res.redirect('/users/login');

    } catch (err) {
        console.log(err);
        res.redirect('/users/register');
    }
});

// Google Auth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/users/login' }), async (req, res) => {
    await claimPendingPaymentsForUser(req.user);
    res.redirect('/dashboard');
});

// Logout Handle
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        
        res.redirect('/users/login');
    });
});

module.exports = router;