const express = require('express');
const router = express.Router();
const { ensureGuest } = require('../middleware/auth');

// Твои курсы
const coursesData = {
    scratch: {},
    python: {},
    roblox: {},
    junior: {},
    minecraft: {},
};

// @desc    Главная страница
// @route   GET /
router.get('/', (req, res) => {
    res.render('index', {
        layout: false, // <-- ВОТ РЕШЕНИЕ: не использовать шаблон для этой страницы
        courses: coursesData,
        currentLang: 'en',
        lang: {
            dir: 'ltr',
            paymentSuccessTitle: 'Payment Successful',
            paymentSuccessMsg: 'We will contact you shortly.',
            paymentBack: 'Back to Main Page',
            paymentFailTitle: 'Payment Failed',
            paymentFailMsg: 'Please try again.',
            paymentRetry: 'Try Again'
        }
    });
});

// @desc    Страница Условий обслуживания
// @route   GET /terms
router.get('/terms', (req, res) => {
    res.render('offer', {
        layout: false // <-- И здесь тоже
    });
});

// @desc    Страница Политики конфиденциальности
// @route   GET /privacy
router.get('/privacy', (req, res) => {
    res.render('privacy', {
        layout: false // <-- И здесь
    });
});

// @desc    Страницы успешной/неуспешной оплаты
// @route   GET /successful-payment, /failed-payment
router.get('/successful-payment', (req, res) => {
    res.render('successful-payment', {
        layout: false, // <-- И здесь
        currentLang: 'en',
        lang: {
            dir: 'ltr',
            paymentSuccessTitle: 'Payment Successful!',
            paymentSuccessMsg: 'Thank you! We have received your payment and will contact you shortly to schedule the lessons.',
            paymentBack: 'Back to Main Page'
        }
    });
});

router.get('/failed-payment', (req, res) => {
     res.render('failed-payment', {
        layout: false, // <-- И здесь
        currentLang: 'en',
        lang: {
            dir: 'ltr',
            paymentFailTitle: 'Payment Failed',
            paymentFailMsg: 'Unfortunately, the payment could not be processed. Please try again or use a different payment method.',
            paymentRetry: 'Try Again'
        }
    });
});

module.exports = router;