// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const crypto =require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

const coursesData = { roblox: {}, scratch: {}, junior: {}, minecraft: {}, python: {} };

// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ОТПРАВКИ СООБЩЕНИЙ В TELEGRAM ---
async function sendTelegramNotification(text) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) {
        console.error("Telegram bot token or chat ID is not configured.");
        return;
    }
    try {
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            disable_web_page_preview: true // Отключаем превью ссылок для компактности
        });
    } catch (error) {
        console.error("Error sending Telegram notification:", error.response ? error.response.data : error.message);
    }
}

// --- ФУНКЦИЯ ДЛЯ АВТОРИЗАЦИИ В PAYPAL ---
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    try {
        const response = await axios.post(`${process.env.PAYPAL_API_URL}/v1/oauth2/token`, 'grant_type=client_credentials', {
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to get PayPal access token:', error.response ? error.response.data : error.message);
        throw new Error('PayPal Auth Failed');
    }
}


// === ОСНОВНЫЕ МАРШРУТЫ ===

app.get('/', (req, res) => {
    res.render('index', { 
        courses: coursesData,
        paypalClientId: process.env.PAYPAL_CLIENT_ID 
    });
});
app.get('/successful-payment', (req, res) => res.render('successful-payment'));
app.get('/failed-payment', (req, res) => res.render('failed-payment'));

// === МАРШРУТЫ ДЛЯ ОБРАБОТКИ ДАННЫХ ===

// Обработка колбэков от платежных систем
app.post('/callback', (req, res) => {
    console.log('Received callback:', req.body);
    let notificationText = `<b>🔔 Payment Callback Received</b>\n\n`;

    // Проверка на успешную оплату Robokassa
    if (req.body.SignatureValue && req.body.OutSum && req.body.InvId) {
        const password_2 = process.env.ROBOKASSA_IS_TEST === '1' ? process.env.ROBOKASSA_TEST_PASS_2 : process.env.ROBOKASSA_PASS_2;
        const signatureString = `${req.body.OutSum}:${req.body.InvId}:${password_2}`;
        const mySignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

        if (mySignature === req.body.SignatureValue.toUpperCase()) {
            notificationText += `<b>✅ Robokassa Payment SUCCESS</b>\n`;
            notificationText += `<b>Amount:</b> ${req.body.OutSum}\n`;
            notificationText += `<b>Order ID:</b> ${req.body.InvId}\n`;
            notificationText += `<a href="${process.env.ROBOKASSA_TRANSACTION_URL}${req.body.InvId}">View in Robokassa</a>\n`;
        } else {
            notificationText += `<b>❌ Robokassa Payment FAILED (Signature Mismatch)</b>\n`;
        }
    }
    // Проверка на успешную оплату CryptoCloud
    else if (req.body.status === 'paid' && req.body.invoice_id) {
         notificationText += `<b>✅ CryptoCloud Payment SUCCESS</b>\n`;
         notificationText += `<b>Amount:</b> ${req.body.amount} ${req.body.currency}\n`;
         notificationText += `<b>Order ID:</b> ${req.body.order_id}\n`;
         notificationText += `<a href="${process.env.CRYPTO_CLOUD_TRANSACTION_URL}${req.body.invoice_id}">View in CryptoCloud</a>\n`;
    }
    
    notificationText += `\n<pre>${JSON.stringify(req.body, null, 2)}</pre>`;
    sendTelegramNotification(notificationText);
    res.sendStatus(200);
});

// Обработка формы обратной связи
app.post('/submit-form', async (req, res) => {
    const { name, contact, message } = req.body;
    if (!name || !contact) return res.status(400).json({ success: false, message: 'Имя и контакт обязательны.' });
    const clientIp = req.ip;
    let text = `<b>👋 New Feedback Form Submission</b>\n\n`;
    text += `<b>Name:</b> ${name}\n`;
    text += `<b>Contact:</b> ${contact}\n`;
    text += `<b>Message:</b>\n${message || 'No message provided.'}\n\n`;
    text += `<b>IP:</b> ${clientIp}\n`;
    await sendTelegramNotification(text);
    res.status(200).json({ success: true, message: 'Feedback sent successfully!' });
});


// === МАРШРУТЫ ДЛЯ PAYPAL ===

app.post("/api/orders", async (req, res) => {
    const { amount, currency, description } = req.body;
    if (!amount || !currency || !description) return res.status(400).send("Missing order details");
    try {
        const accessToken = await getPayPalAccessToken();
        const url = `${process.env.PAYPAL_API_URL}/v2/checkout/orders`;
        const payload = { intent: "CAPTURE", purchase_units: [{ amount: { currency_code: currency.toUpperCase(), value: amount.toFixed(2) }, description: description }], application_context: { return_url: `https://clearn.top/successful-payment`, cancel_url: `https://clearn.top/failed-payment`, brand_name: "Code & Learn", shipping_preference: "NO_SHIPPING" } };
        const response = await axios.post(url, payload, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } });
        
        const notificationText = `<b>🅿️ PayPal Order Created</b>\n\n<b>Order ID:</b> ${response.data.id}\n<b>Amount:</b> ${amount.toFixed(2)} ${currency}\n<b>IP:</b> ${req.ip}`;
        await sendTelegramNotification(notificationText);
        res.json(response.data);
    } catch (error) {
        res.status(500).send("Failed to create order");
    }
});

app.post("/api/orders/:orderID/capture", async (req, res) => {
    const { orderID } = req.params;
    try {
        const accessToken = await getPayPalAccessToken();
        const url = `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`;
        const response = await axios.post(url, {}, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } });
        
        const payment = response.data.purchase_units[0].payments.captures[0];
        const payer = response.data.payer;
        let notificationText = `<b>✅ PayPal Payment Captured!</b>\n\n`;
        notificationText += `<b>Amount:</b> ${payment.amount.value} ${payment.amount.currency_code}\n`;
        notificationText += `<b>Payer:</b> ${payer.name.given_name} ${payer.name.surname} (${payer.email_address})\n`;
        notificationText += `<a href="${process.env.PAYPAL_TRANSACTION_URL}${payment.id}">View in PayPal</a>\n`;
        notificationText += `<b>IP:</b> ${req.ip}`;
        await sendTelegramNotification(notificationText);
        res.json(response.data);
    } catch (error) {
        const errorText = `<b>❌ PayPal Capture FAILED</b>\n\n<b>Order ID:</b> ${orderID}\n<b>Error:</b> ${error.message}\n<b>IP:</b> ${req.ip}`;
        await sendTelegramNotification(errorText);
        res.status(500).send("Failed to capture payment");
    }
});


// === ЕДИНЫЙ МАРШРУТ ДЛЯ СОЗДАНИЯ СЧЕТОВ ===

app.post('/create-payment', async (req, res) => {
    const { amount, currency, description, orderId, paymentSystem } = req.body;
    const clientIp = req.ip;

    if (!amount || !paymentSystem) return res.status(400).json({ error: 'Amount and payment system are required' });

    await sendTelegramNotification(`<b>⏳ Invoice Creation Attempt</b>\n\n<b>System:</b> ${paymentSystem}\n<b>Amount:</b> ${amount} ${currency}\n<b>Order ID:</b> ${orderId}\n<b>IP:</b> ${clientIp}`);

    switch (paymentSystem) {
        case 'paypal':
            res.json({ success: true, paymentSystem: 'paypal' });
            break;

        case 'cryptocloud':
            try {
                const response = await axios.post('https://api.cryptocloud.plus/v2/invoice/create', {
                    shop_id: process.env.CRYPTO_CLOUD_SHOP_ID,
                    amount: amount, order_id: orderId, currency: currency.toUpperCase(),
                    description: description, url_success: 'https://clearn.top/successful-payment', url_fail: 'https://clearn.top/failed-payment'
                }, { headers: { 'Authorization': `Token ${process.env.CRYPTO_CLOUD_API_KEY}` } });

                if (response.data.status === 'success') {
                    const successText = `<b>✅ CryptoCloud Invoice Created</b>\n\n<b>Order ID:</b> ${orderId}\n<b>Amount:</b> ${amount} ${currency}\n<b>Client Link:</b> <a href="${response.data.result.link}">Pay Now</a>\n<b>Admin Link:</b> <a href="${process.env.CRYPTO_CLOUD_TRANSACTION_URL}${response.data.result.uuid}">View Invoice</a>\n<b>IP:</b> ${clientIp}`;
                    await sendTelegramNotification(successText);
                    res.json({ paymentUrl: response.data.result.link });
                } else {
                    await sendTelegramNotification(`<b>❌ CryptoCloud Invoice FAILED</b>\n\n<b>Order ID:</b> ${orderId}\n<b>Reason:</b> ${JSON.stringify(response.data)}\n<b>IP:</b> ${clientIp}`);
                    res.status(500).json({ error: 'Failed to create CryptoCloud invoice' });
                }
            } catch (error) {
                await sendTelegramNotification(`<b>❌ CryptoCloud API Request FAILED</b>\n\n<b>Order ID:</b> ${orderId}\n<b>Error:</b> ${error.message}\n<b>IP:</b> ${clientIp}`);
                res.status(500).json({ error: 'CryptoCloud API request failed' });
            }
            break;

        case 'robokassa':
            const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
            const isTest = process.env.ROBOKASSA_IS_TEST === '1';
            const password_1 = isTest ? process.env.ROBOKASSA_TEST_PASS_1 : process.env.ROBOKASSA_PASS_1;

            if (!merchantLogin || !password_1) {
                await sendTelegramNotification(`<b>❌ Robokassa FAILED (Server Config)</b>\n\n<b>Order ID:</b> ${orderId}\n<b>Reason:</b> Not configured on server.`);
                return res.status(500).json({ error: 'Robokassa is not configured on the server.' });
            }
            
            const signatureString = `${merchantLogin}:${amount}:${orderId}:${password_1}`;
            const signatureValue = crypto.createHash('md5').update(signatureString).digest('hex');
            let paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${merchantLogin}&OutSum=${amount}&InvId=${orderId}&Description=${encodeURIComponent(description)}&SignatureValue=${signatureValue}`;
            if (isTest) paymentUrl += '&IsTest=1';
            
            const successText = `<b>✅ Robokassa Invoice Created</b>\n\n<b>Order ID:</b> ${orderId}\n<b>Amount:</b> ${amount} ${currency}\n<b>Client Link:</b> <a href="${paymentUrl}">Pay Now</a>\n<b>Admin Link:</b> <a href="${process.env.ROBOKASSA_TRANSACTION_URL}${orderId}">View Operation</a>\n<b>IP:</b> ${clientIp}`;
            await sendTelegramNotification(successText);
            res.json({ paymentUrl: paymentUrl });
            break;

        default:
            res.status(400).json({ error: 'Unsupported payment system' });
            break;
    }
});

app.listen(port, () => console.log(`Server is running at http://localhost:${port}`));