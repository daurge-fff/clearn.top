const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

router.post('/register', async (req, res) => {
    const { name, email, password, password2, contact } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }
    if (password != password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, name, email, contact });
    } else {
        try {
            const user = await User.findOne({ email: email });
            if (user) {
                errors.push({ msg: 'Email already exists' });
                res.render('register', { errors, name, email, contact });
            } else {
                const newUser = new User({ name, email, password, contact });
                const savedUser = await newUser.save();
                if(savedUser.role === 'student') {
                    const newProfile = new StudentProfile({ user: savedUser._id });
                    await newProfile.save();
                }
                // TODO: Добавить сообщение об успешной регистрации (flash-сообщения)
                res.redirect('/users/login');
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        // failureFlash: true // flash-сообщения
    })(req, res, next);
});

router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        // TODO: Добавить сообщение "You are logged out"
        res.redirect('/users/login');
    });
});

module.exports = router;