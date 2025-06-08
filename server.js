// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.set('trust proxy', true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

const coursesData = { roblox: {}, scratch: {}, junior: {}, minecraft: {}, python: {} };

app.get('/', (req, res) => res.render('index', { courses: coursesData }));
app.get('/successful-payment', (req, res) => res.render('successful-payment'));
app.get('/failed-payment', (req, res) => res.render('failed-payment'));
app.post('/callback', (req, res) => { console.log('Callback:', req.body); res.sendStatus(200); });

app.post('/submit-form', async (req, res) => {
    const { name, contact, message } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!name || !contact) { return res.status(400).json({ success: false, message: 'Имя и контакт обязательны.' }); }

    // После включения trust proxy, req.ip будет пытаться получить реальный IP из X-Forwarded-For
    const clientIp = req.ip;

    let text = `<b>👋 Feedback from ${name}</b>\n`;
    text += `<b>📞 Contact:</b> ${contact}\n`;
    text += `<b>📝 Message:</b>\n${message || 'No message provided.'}\n`;
    text += `<b>📅 Date:</b> ${new Date().toLocaleString()}\n\n`;
    text += `<b>🌐 IP:</b> ${clientIp}\n`;
    text += `<b>📱 Browser:</b> ${req.headers['user-agent']}\n`;

    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, { chat_id: chatId, text: text, parse_mode: 'HTML' });
        res.status(200).json({ success: true, message: 'Feedback sent successfully!' });
    } catch (error) {
        console.error("Error sending Telegram message:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: 'Error sending feedback. Please try again later.' });
    }
});

app.post('/create-payment', async (req, res) => {
    const { amount, currency, description, orderId, paymentSystem } = req.body;

    if (!amount || !paymentSystem) {
        return res.status(400).json({ error: 'Amount and payment system are required' });
    }

    switch (paymentSystem) {

        case 'cryptocloud':
            try {
                const response = await axios.post('https://api.cryptocloud.plus/v2/invoice/create', {
                    shop_id: process.env.CRYPTO_CLOUD_SHOP_ID,
                    amount: amount, order_id: orderId, currency: currency.toUpperCase(),
                    description: description, url_success: 'https://clearn.top/successful-payment', url_fail: 'https://clearn.top/failed-payment'
                }, { headers: { 'Authorization': `Token ${process.env.CRYpto_CLOUD_API_KEY}` } });

                if (response.data.status === 'success') {
                    res.json({ paymentUrl: response.data.result.link });
                } else {
                    console.error('CryptoCloud API error:', response.data);
                    res.status(500).json({ error: 'Failed to create CryptoCloud invoice' });
                }
            } catch (error) {
                console.error('CryptoCloud API request failed:', error.message);
                res.status(500).json({ error: 'CryptoCloud API request failed' });
            }
            break;

        case 'robokassa':
            const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
            const isTest = process.env.ROBOKASSA_IS_TEST === '1';

            const password_1 = isTest
                ? process.env.ROBOKASSA_TEST_PASS_1
                : process.env.ROBOKASSA_PASS_1;

            if (!merchantLogin || !password_1) {
                return res.status(500).json({ error: 'Robokassa is not configured on the server.' });
            }

            const signatureString = `${merchantLogin}:${amount}:${orderId}:${password_1}`;
            const signatureValue = crypto.createHash('md5').update(signatureString).digest('hex');

            let paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?` +
                             `MerchantLogin=${merchantLogin}` +
                             `&OutSum=${amount}` +
                             `&InvId=${orderId}` +
                             `&Description=${encodeURIComponent(description)}` +
                             `&SignatureValue=${signatureValue}`;

            if (isTest) {
                paymentUrl += '&IsTest=1';
            }

            res.json({ paymentUrl: paymentUrl });
            break;

        default:
            res.status(400).json({ error: 'Unsupported payment system' });
            break;
    }
});

app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));