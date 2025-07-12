const express = require('express');
const router = express.Router();
const { ensureGuest } = require('../middleware/auth');

const coursesData = {
    scratch: {},
    python: {},
    roblox: {},
    junior: {},
    minecraft: {},
};

router.get('/', (req, res) => {
    res.render('index', {
        layout: false,
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

router.get('/terms', (req, res) => {
    res.render('offer', {
        layout: false
    });
});

router.get('/privacy', (req, res) => {
    res.render('privacy', {
        layout: false
    });
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

router.get('/faq', (req, res) => {
    res.render('faq', {
        layout: false
    });
});

router.get('/cookie-policy', (req, res) => {
    res.render('cookie-policy', {
        layout: false
    });
});

module.exports = router;