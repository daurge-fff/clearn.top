const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth');
const { claimPendingPaymentsForUser } = require('../services/paymentService');

// Login Page
router.get('/login', ensureGuest, (req, res) => {
    res.render('login', { layout: false });
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// Register Page
router.get('/register', ensureGuest, (req, res) => {
    res.render('register', { layout: false, name: '', email: '', contact: '' });
});

// Register Handle
router.post('/register', (req, res) => {
    const { name, email, password, password2, contact } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) errors.push({ msg: 'Please enter all required fields' });
    if (password != password2) errors.push({ msg: 'Passwords do not match' });
    if (password.length < 6) errors.push({ msg: 'Password must be at least 6 characters' });

    if (errors.length > 0) {
        errors.forEach(err => req.flash('error_msg', err.msg));
        res.redirect('/users/register');
    } else {
        User.findOne({ email: email.toLowerCase() }).then(user => {
            if (user) {
                req.flash('error_msg', 'Email already exists');
                res.redirect('/users/register');
            } else {
                const newUser = new User({ name, email: email.toLowerCase(), password, contact });
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                        .then(async user => {
                            await claimPendingPaymentsForUser(user);
                            req.flash('success_msg', 'You are now registered and can log in');
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err));
                    });
                });
            }
        });
    }
});

// Google Auth
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/users/login' }), (req, res) => {
    res.redirect('/dashboard');
});

// Logout Handle
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
});

module.exports = router;