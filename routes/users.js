const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { ensureGuest } = require('../middleware/auth'); // Middleware для гостей

// @desc    Страница входа
// @route   GET /users/login
router.get('/login', ensureGuest, (req, res) => {
    res.render('login', {
        layout: false // <-- ВОТ РЕШЕНИЕ
    });
});

// @desc    Обработка входа
// @route   POST /users/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        // failureFlash: true // Для этого нужно подключить connect-flash
    })(req, res, next);
});

// @desc    Страница регистрации
// @route   GET /users/register
router.get('/register', ensureGuest, (req, res) => {
    res.render('register', {
        layout: false, // <-- И ЗДЕСЬ ТОЖЕ
        // Передаем пустые значения для EJS шаблона
        name: '',
        email: '',
        contact: ''
    });
});

// @desc    Обработка регистрации
// @route   POST /users/register
router.post('/register', (req, res) => {
    const { name, email, password, password2, contact } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all required fields' });
    }
    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { layout: false, errors, name, email, contact });
    } else {
        User.findOne({ email: email.toLowerCase() }).then(user => {
            if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', { layout: false, errors, name, email, contact });
            } else {
                const newUser = new User({ name, email: email.toLowerCase(), password, contact });
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => {
                                res.redirect('/users/login');
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
    }
});

// @desc    Аутентификация через Google
// @route   GET /users/auth/google
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


// @desc    Callback от Google
// @route   GET /users/auth/google/callback
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/users/login' }),
    (req, res) => {
        res.redirect('/dashboard');
    }
);

// @desc    Выход из системы
// @route   GET /users/logout
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/users/login');
      });
});


module.exports = router;