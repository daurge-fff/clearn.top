const express = require('express');
const router = express.Router();

// Эти данные можно будет потом подгружать из базы данных
const coursesData = {
    scratch: {},
    python: {},
    roblox: {},
    junior: {},
    minecraft: {},
    '3ddesigner': {},
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

// Удален дублирующийся роут - используется роут ниже с переводами

// @route   GET /failed-payment
// @desc    Display failed payment page
// @access  Public
router.get('/failed-payment', (req, res) => {
    const lang = req.query.lang || 'en';
    const currentLang = lang;
    const translations = require('../public/js/translations');
    
    res.render('failed-payment', {
        layout: false,
        lang: translations[lang] || translations['en'],
        currentLang
    });
});

// @route   GET /successful-payment
// @desc    Display successful payment page
// @access  Public
router.get('/successful-payment', (req, res) => {
    const lang = req.query.lang || 'en';
    const currentLang = lang;
    const translations = require('../public/js/translations');
    
    // Создаем пример данных платежа для демонстрации
    const paymentDetails = {
        amount: req.query.amount || '5000',
        currency: req.query.currency || 'RUB',
        orderId: req.query.orderId || 'ORDER-' + Date.now(),
        date: new Date().toLocaleDateString('ru-RU')
    };
    
    res.render('successful-payment', {
        layout: false,
        lang: translations[lang] || translations['en'],
        currentLang,
        paymentDetails
    });
});

module.exports = router;