require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose'); // <-- ДОБАВЛЕНО

// --- ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ ---
// Эта функция будет выполняться при старте сервера
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1); // Выход из приложения, если не удалось подключиться к БД
    }
}
connectDB();
// ------------------------------------

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


const coursesData = { roblox: {}, scratch: {}, junior: {}, minecraft: {}, python: {} };


const serverTranslations = {
    en: {
        dir: 'ltr',
        paymentSuccessTitle: "Payment Successful!",
        paymentSuccessMsg: "Your payment was processed successfully. Thank you for your purchase!",
        paymentBack: "Back to site",
        paymentFailTitle: "Payment Failed",
        paymentFailMsg: "There was an issue processing your payment. Please try again or contact support.",
        paymentRetry: "Try again"
    },
    ru: {
        dir: 'ltr',
        paymentSuccessTitle: "Оплата прошла успешно!",
        paymentSuccessMsg: "Ваш платеж был успешно обработан. Спасибо за покупку!",
        paymentBack: "Вернуться на сайт",
        paymentFailTitle: "Ошибка оплаты",
        paymentFailMsg: "Произошла проблема при обработке вашего платежа. Пожалуйста, попробуйте еще раз или свяжитесь со службой поддержки.",
        paymentRetry: "Попробовать снова"
    },
    de: {
        dir: 'ltr',
        paymentSuccessTitle: "Zahlung erfolgreich!",
        paymentSuccessMsg: "Ihre Zahlung wurde erfolgreich verarbeitet. Vielen Dank für Ihren Einkauf!",
        paymentBack: "Zurück zur Website",
        paymentFailTitle: "Zahlung fehlgeschlagen",
        paymentFailMsg: "Es gab ein Problem bei der Bearbeitung Ihrer Zahlung. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.",
        paymentRetry: "Erneut versuchen"
    },
    uk: { 
        dir: 'ltr',
        paymentSuccessTitle: "Оплата успішна!",
        paymentSuccessMsg: "Ваш платіж було успішно оброблено. Дякуємо за покупку!",
        paymentBack: "Повернутися на сайт",
        paymentFailTitle: "Помилка оплати",
        paymentFailMsg: "Виникла проблема при обробці вашого платежу. Будь ласка, спробуйте ще раз або зверніться до служби підтримки.",
        paymentRetry: "Спробувати знову"
    },
    es: {
        dir: 'ltr',
        paymentSuccessTitle: "¡Pago realizado con éxito!",
        paymentSuccessMsg: "Su pago se procesó correctamente. ¡Gracias por su compra!",
        paymentBack: "Volver al sitio",
        paymentFailTitle: "Pago fallido",
        paymentFailMsg: "Hubo un problema al procesar su pago. Por favor, inténtelo de nuevo o póngase en contacto con el soporte.",
        paymentRetry: "Reintentar"
    },
    it: {
        dir: 'ltr',
        paymentSuccessTitle: "Pagamento riuscito!",
        paymentSuccessMsg: "Il tuo pagamento è stato elaborato con successo. Grazie per il tuo acquisto!",
        paymentBack: "Torna al sito",
        paymentFailTitle: "Pagamento fallito",
        paymentFailMsg: "Si è verificato un problema durante l'elaborazione del pagamento. Riprova o contatta l'assistenza.",
        paymentRetry: "Riprova"
    },
    he: {
        dir: 'rtl', 
        paymentSuccessTitle: "התשלום בוצע בהצלחה!",
        paymentSuccessMsg: "התשלום שלך עובד בהצלחה. תודה על רכישתך!",
        paymentBack: "חזרה לאתר",
        paymentFailTitle: "התשלום נכשל",
        paymentFailMsg: "אירעה שגיאה בעיבוד התשלום שלך. אנא נסה שוב או צור קשר עם התמיכה.",
        paymentRetry: "נסה שוב"
    },
    pl: {
        dir: 'ltr',
        paymentSuccessTitle: "Płatność zakończona sukcesem!",
        paymentSuccessMsg: "Twoja płatność została przetworzona pomyślnie. Dziękujemy za zakup!",
        paymentBack: "Wróć do strony",
        paymentFailTitle: "Płatność nieudana",
        paymentFailMsg: "Wystąpił problem z przetworzeniem płatności. Spróbuj ponownie lub skontaktuj się z obsługą.",
        paymentRetry: "Spróbuj ponownie"
    },
    nl: {
        dir: 'ltr',
        paymentSuccessTitle: "Betaling succesvol!",
        paymentSuccessMsg: "Uw betaling is succesvol verwerkt. Bedankt voor uw aankoop!",
        paymentBack: "Terug naar de site",
        paymentFailTitle: "Betaling mislukt",
        paymentFailMsg: "Er is een probleem opgetreden bij het verwerken van uw betaling. Probeer het opnieuw of neem contact op met de ondersteuning.",
        paymentRetry: "Opnieuw proberen"
    },
};


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
            disable_web_page_preview: true 
        });
    } catch (error) {
        console.error("Error sending Telegram notification:", error.response ? error.response.data : error.message);
    }
}


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


app.get('/', (req, res) => {
    res.render('index', { 
        courses: coursesData,
        paypalClientId: process.env.PAYPAL_CLIENT_ID 
    });
});

app.get('/successful-payment', (req, res) => {
    const requestedLang = req.query.lang || 'en'; 
    const currentLang = serverTranslations[requestedLang] ? requestedLang : 'en'; 
    const lang = serverTranslations[currentLang]; 
    res.render('successful-payment', { currentLang: currentLang, lang: lang });
});

app.get('/failed-payment', (req, res) => {
    const requestedLang = req.query.lang || 'en'; 
    const currentLang = serverTranslations[requestedLang] ? requestedLang : 'en'; 
    const lang = serverTranslations[currentLang]; 
    res.render('failed-payment', { currentLang: currentLang, lang: lang });
});

app.get('/offer', (req, res) => {
    res.render('offer'); 
});
app.get('/terms', (req, res) => {
    res.render('offer'); 
});
app.get('/privacy', (req, res) => {
    res.render('privacy'); 
});




app.post('/callback', (req, res) => {
    console.log('Received callback:', req.body);
    let notificationText = `<b>🔔 Payment Callback Received</b>\n\n`;

    
    if (req.body.SignatureValue && req.body.OutSum && req.body.InvId) {
        const password_2 = process.env.ROBOKASSA_IS_TEST === '1' ? process.env.ROBOKASSA_TEST_PASS_2 : process.env.ROBOKASSA_PASS_2;
        const signatureString = `${req.body.OutSum}:${req.body.InvId}:${password_2}`;
        const mySignature = crypto.createHash('md5').update(signatureString).digest('hex').toUpperCase();

        if (mySignature === req.body.SignatureValue.toUpperCase()) {
            notificationText += `<b>✅ Robokassa Payment SUCCESS</b>\n`;
            notificationText += `<b>Amount:</b> ${req.body.OutSum}\n`;
            notificationText += `<b>Order ID:</b> ${req.body.InvId}\n`;
            notificationText += `<b>Admin Link:</b> <a href="${process.env.ROBOKASSA_TRANSACTION_URL}${req.body.InvId}">View in Robokassa</a>\n`;
        } else {
            notificationText += `<b>❌ Robokassa Payment FAILED (Signature Mismatch)</b>\n`;
        }
    }
    
    else if (req.body.status === 'paid' && req.body.invoice_id) {
         
         const clientLang = 'en'; 
         notificationText += `<b>✅ CryptoCloud Payment SUCCESS</b>\n`;
         
         notificationText += `<b>Amount:</b> ${req.body.amount_in_fiat || req.body.amount} ${req.body.amount_in_fiat_currency || req.body.currency}\n`;
         notificationText += `<b>Order ID:</b> ${req.body.order_id}\n`;
         notificationText += `<b>Client Link:</b> <a href="https://pay.cryptocloud.plus/${req.body.invoice_id}?lang=${clientLang}">Pay Now</a>\n`;
         notificationText += `<b>Admin Link:</b> <a href="https://app.cryptocloud.plus/payment/transaction/INV-${req.body.invoice_id}">View in CryptoCloud</a>\n`;
    }
    
    sendTelegramNotification(notificationText);
    res.sendStatus(200);
});


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




app.post("/api/orders", async (req, res) => {
    const { amount, currency, description } = req.body;
    if (!amount || !currency || !description) return res.status(400).send("Missing order details");
    
    
    const clientLang = req.query.lang || req.headers['accept-language']?.split(',')[0].split('-')[0] || 'en';
    
    try {
        const accessToken = await getPayPalAccessToken();
        const url = `${process.env.PAYPAL_API_URL}/v2/checkout/orders`;
        const payload = { intent: "CAPTURE", purchase_units: [{ amount: { currency_code: currency.toUpperCase(), value: amount.toFixed(2) }, description: description }], application_context: { return_url: `https://clearn.top/successful-payment?lang=${clientLang}`, cancel_url: `https://clearn.top/failed-payment?lang=${clientLang}`, brand_name: "Code & Learn", shipping_preference: "NO_SHIPPING" } };
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
        notificationText += `<b>Admin Link:</b> <a href="${process.env.PAYPAL_TRANSACTION_URL}${payment.id}">View in PayPal</a>\n`;
        notificationText += `<b>IP:</b> ${req.ip}`;
        await sendTelegramNotification(notificationText);
        res.json(response.data);
    } catch (error) {
        const errorText = `<b>❌ PayPal Capture FAILED</b>\n\n<b>Order ID:</b> ${orderID}\n<b>Error:</b> ${error.message}\n<b>IP:</b> ${req.ip}`;
        await sendTelegramNotification(errorText);
        res.status(500).send("Failed to capture payment");
    }
});




app.post('/create-payment', async (req, res) => {
    const { amount, currency, description, orderId, paymentSystem } = req.body;
    const clientIp = req.ip;

    if (!amount || !paymentSystem) return res.status(400).json({ error: 'Amount and payment system are required' });

    
    const clientLang = req.query.lang || req.headers['accept-language']?.split(',')[0].split('-')[0] || 'en';
    
    const actualClientLang = serverTranslations[clientLang] ? clientLang : 'en';

    await sendTelegramNotification(`<b>⏳ Invoice Creation Attempt</b>\n\n<b>System:</b> ${paymentSystem}\n<b>Amount:</b> ${amount} ${currency}\n<b>Order ID:</b> ${orderId}\n<b>IP:</b> ${clientIp}`);

    switch (paymentSystem) {
        case 'paypal':
            
            
            res.json({ success: true, paymentSystem: 'paypal' });
            break;

        case 'cryptocloud':
            try {
                const response = await axios.post('https://api.cryptocloud.plus/v2/invoice/create', {
                    shop_id: process.env.CRYPTO_CLOUD_SHOP_ID,
                    amount: amount, 
                    order_id: orderId, 
                    currency: currency.toUpperCase(),
                    description: description, 
                    url_success: `https://clearn.top/successful-payment?lang=${actualClientLang}`, 
                    url_fail: `https://clearn.top/failed-payment?lang=${actualClientLang}` 
                }, { headers: { 'Authorization': `Token ${process.env.CRYPTO_CLOUD_API_KEY}` } });

                if (response.data.status === 'success') {
                    const successText = `<b>✅ CryptoCloud Invoice Created</b>\n\n<b>Order ID:</b> ${orderId}\n<b>Amount:</b> ${amount} ${currency}\n<b>Client Link:</b> <a href="${response.data.result.link}?lang=${actualClientLang}">Pay Now</a>\n<b>Admin Link:</b> <a href="https://app.cryptocloud.plus/payment/transaction/INV-${response.data.result.uuid}">View Invoice</a>\n<b>IP:</b> ${clientIp}`;
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
            
            paymentUrl += `&Culture=${actualClientLang}`; 
            paymentUrl += `&SuccessURL=${encodeURIComponent(`https://clearn.top/successful-payment?lang=${actualClientLang}`)}`;
            paymentUrl += `&FailURL=${encodeURIComponent(`https://clearn.top/failed-payment?lang=${actualClientLang}`)}`;
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