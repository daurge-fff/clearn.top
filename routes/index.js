const express = require('express');
const router = express.Router();

// Эти данные можно будет потом подгружать из базы данных
const coursesData = {
    scratch: {},
    python: {},
    roblox: {},
    junior: {},
    minecraft: {},
};

// Главная страница
router.get('/', (req, res) => {
    res.render('index', {
        layout: false,
        courses: coursesData,
    });
});

// Страница "Условия предоставления услуг"
router.get('/terms', (req, res) => {
    res.render('offer', { layout: false }); // Используем ваш файл offer.ejs.txt
});

// Страница "Политика конфиденциальности"
router.get('/privacy', (req, res) => {
    res.render('privacy', { layout: false });
});

// Страница "Политика Cookie"
router.get('/cookie-policy', (req, res) => {
    res.render('cookie-policy', { layout: false });
});

// Страница "Политика возврата"
router.get('/refund', (req, res) => {
    res.render('refund', { layout: false });
});

// Страница FAQ
router.get('/faq', (req, res) => {
    res.render('faq', { layout: false });
});

router.get('/successful-payment', (req, res) => {
    res.render('successful-payment', {
        layout: false,
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
        layout: false,
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