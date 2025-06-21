const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');

const { findUserByIdentifier, creditPaymentToUser } = require('../services/paymentService');
const { notifyAdmin } = require('../services/notificationService');
const { ensureAuth, ensureRole } = require('../middleware/auth');

const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Payment = require('../models/Payment');

async function createPendingPayment(details) {
    const { amount, currency, description, identifier, paymentSystem } = details;
    const user = await findUserByIdentifier(identifier);
    let lessonsPurchased = 0;
    if (description && !description.toLowerCase().includes('donation')) {
        const match = description.match(/x(\d+)/);
        lessonsPurchased = (match && match[1]) ? parseInt(match[1], 10) : 1;
    }
    const pricePerLesson = lessonsPurchased > 0 ? (parseFloat(amount) / lessonsPurchased) : 0;
    return await Payment.create({
        userId: user ? user._id : null,
        pendingIdentifier: identifier.trim().toLowerCase(),
        status: 'pending',
        amountPaid: amount,
        baseAmount: amount,
        currency: currency || 'EUR',
        lessonsPurchased: lessonsPurchased,
        pricePerLesson: pricePerLesson,
        paymentSystem: paymentSystem,
        transactionType: description.toLowerCase().includes('donation') ? 'Donation' : '50min'
    });
}

router.post('/create-payment', async (req, res) => {
    const { amount, currency, description, paymentSystem, identifier } = req.body;
    try {
        if (!amount || !paymentSystem || !identifier) {
            return res.status(400).json({ error: 'Amount, payment system, and identifier are required.' });
        }
        const pendingPayment = await createPendingPayment(req.body);
        const orderId = pendingPayment._id;
        
        await notifyAdmin(
            `🧾 *New Invoice Created*\n\n` +
            `💰 *Amount:* ${amount} ${currency || 'EUR'}\n` +
            `💳 *System:* ${paymentSystem}\n` +
            `👤 *Client:* \`${identifier}\`\n` +
            `📝 *Description:* ${description}`
        );

        if (paymentSystem === 'robokassa') {
            const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
            const isTest = process.env.ROBOKASSA_IS_TEST === '1';
            const pass1 = isTest ? process.env.ROBOKASSA_TEST_PASS_1 : process.env.ROBOKASSA_PASS_1;
            const signature = crypto.createHash('md5').update(`${merchantLogin}:${amount}:${orderId}:${pass1}`).digest('hex');
            const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${merchantLogin}&OutSum=${amount}&InvId=${orderId}&Description=${encodeURIComponent(description)}&SignatureValue=${signature}${isTest ? '&isTest=1' : ''}`;
            return res.json({ paymentUrl });
        } else if (paymentSystem === 'cryptocloud') {
            const shopId = process.env.CRYPTO_CLOUD_SHOP_ID;
            const apiKey = process.env.CRYPTO_CLOUD_API_KEY;
            const response = await axios.post('https://api.cryptocloud.plus/v1/invoice/create', { shop_id: shopId, amount: amount, order_id: String(orderId) }, { headers: { 'Authorization': `Token ${apiKey}` } });
            if (response.data.status === 'success') {
                return res.json({ paymentUrl: response.data.pay_url });
            } else {
                throw new Error(response.data.message || 'CryptoCloud API returned an error');
            }
        } else {
            return res.status(400).json({ error: 'Unsupported payment system' });
        }
    } catch (error) {
        await notifyAdmin(
            `🔥 *Invoice Creation Failed*\n\n` +
            `💳 *System:* ${paymentSystem}\n` +
            `👤 *Client:* \`${identifier}\`\n` +
            `❗️ *Error:* \`${error.message}\``
        );
        return res.status(500).json({ error: 'Failed to create payment invoice.' });
    }
});

router.post('/paypal/record-payment', async (req, res) => {
    try {
        const { paypalOrderID, amount, currency, lessonsPurchased, description, identifier } = req.body;
        if (!paypalOrderID || !amount || !identifier) return res.status(400).json({ msg: 'Missing required payment details.' });

        const existingPayment = await Payment.findOne({ 'paypalOrderID': paypalOrderID });
        if (existingPayment) return res.status(200).json({ msg: 'Payment already recorded.' });
        
        const user = await findUserByIdentifier(identifier);
        const pricePerLesson = lessonsPurchased > 0 ? (parseFloat(amount) / lessonsPurchased) : 0;
        
        const newPayment = await Payment.create({
            userId: user ? user._id : null,
            pendingIdentifier: identifier.trim().toLowerCase(),
            status: 'completed',
            amountPaid: parseFloat(amount),
            baseAmount: parseFloat(amount),
            currency: currency,
            lessonsPurchased: parseInt(lessonsPurchased, 10),
            pricePerLesson: pricePerLesson,
            paymentSystem: 'PayPal',
            transactionType: description.toLowerCase().includes('donation') ? 'Donation' : '50min',
            paypalOrderID: paypalOrderID
        });

        if (user) {
            await creditPaymentToUser(newPayment);
        }
        await notifyAdmin(`✅ *Successful Payment (PayPal)*\n\n*Amount:* ${amount} ${currency}\n*Client:* \`${identifier}\`\n*Order ID:* \`${paypalOrderID}\``);
        res.status(200).json({ msg: 'Payment recorded successfully.' });
    } catch (error) {
        await notifyAdmin(`🔥 *PayPal Record Failed*\n\n*Order ID:* \`${req.body.paypalOrderID}\`\n*Error:* ${error.message}`);
        res.status(500).json({ msg: 'Server error while recording payment.' });
    }
});

router.use('/payment/cryptocloud/notification', express.raw({ type: 'application/json' }));
router.post('/payment/cryptocloud/notification', async (req, res) => {
    try {
        const signature = req.headers['sign'];
        const apiKey = process.env.CRYPTO_CLOUD_API_KEY;
        const calculatedSignature = crypto.createHmac('sha256', apiKey).update(req.body).digest('hex');
        if (signature !== calculatedSignature) return res.status(403).send('Invalid signature');
        
        const data = JSON.parse(req.body.toString());
        const payment = await Payment.findById(data.order_id);
        if (!payment) return res.status(404).send('Payment not found');
        if (payment.status === 'completed') return res.sendStatus(200);

        if (data.status === 'success') {
            payment.status = 'completed';
            await payment.save();
            if (payment.userId) {
                await creditPaymentToUser(payment);
            }
            await notifyAdmin(`✅ *Successful Payment (CryptoCloud)*\n\n*Amount:* ${data.amount_crypto} ${data.currency}\n*Client:* \`${payment.pendingIdentifier}\`\n*Invoice:* \`${data.invoice_id}\``);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('CryptoCloud notification processing error:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/payment/robokassa/result', async (req, res) => {
    try {
        const { OutSum, InvId, SignatureValue } = req.body;
        const isTest = process.env.ROBOKASSA_IS_TEST === '1';
        const pass2 = isTest ? process.env.ROBOKASSA_TEST_PASS_2 : process.env.ROBOKASSA_PASS_2;
        
        const payment = await Payment.findById(InvId);
        if (!payment) return res.status(404).send('Payment not found');
        if (payment.status === 'completed') return res.send(`OK${InvId}`);

        const signatureString = `${OutSum}:${InvId}:${pass2}`;
        const mySignature = crypto.createHash('md5').update(signatureString).digest('hex');
        if (mySignature.toLowerCase() !== SignatureValue.toLowerCase()) {
            return res.status(400).send('Invalid signature');
        }

        payment.status = 'completed';
        await payment.save();
        if (payment.userId) {
            await creditPaymentToUser(payment);
        }
        await notifyAdmin(`✅ *Successful Payment (Robokassa)*\n\n*Amount:* ${OutSum} ${payment.currency}\n*Client:* \`${payment.pendingIdentifier}\`\n*Order:* \`${InvId}\``);
        res.send(`OK${InvId}`);
    } catch (error) {
        console.error(`Robokassa result processing error for order ${req.body.InvId}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/lessons', ensureAuth, async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'student') query.student = req.user.id;
        else if (req.user.role === 'teacher') query.teacher = req.user.id;
        const lessons = await Lesson.find(query).populate('student', 'name').populate('teacher', 'name');
        const events = lessons.map(lesson => ({
            title: req.user.role === 'student' ? `Lesson with ${lesson.teacher.name}` : `Lesson with ${lesson.student.name}`,
            start: lesson.lessonDate,
            end: new Date(new Date(lesson.lessonDate).getTime() + lesson.duration * 60000),
            backgroundColor: lesson.status === 'completed' ? '#2ecc71' : (lesson.status.startsWith('cancelled') ? '#e74c3c' : '#3498db'),
            borderColor: lesson.status === 'completed' ? '#2ecc71' : (lesson.status.startsWith('cancelled') ? '#e74c3c' : '#3498db'),
            id: lesson._id,
            url: req.user.role === 'student' ? `/dashboard/lessons/view/${lesson._id}` : `/dashboard/lessons/manage/${lesson._id}`
        }));
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/analytics', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const payments = await Payment.find({ status: 'completed' }).sort({ createdAt: 1 });
        if (payments.length === 0) {
            return res.json({ totalRevenue: '0.00', paymentCount: 0, totalLessonsSold: 0, averageCheck: '0.00', chartData: { labels: [], data: [] } });
        }
        const dailyRevenue = {};
        payments.forEach(p => {
            const day = new Date(p.createdAt).toISOString().split('T')[0];
            if (!dailyRevenue[day]) dailyRevenue[day] = 0;
            dailyRevenue[day] += p.amountPaid;
        });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const totalLessonsSold = payments.reduce((sum, p) => sum + p.lessonsPurchased, 0);
        res.json({
            totalRevenue: totalRevenue.toFixed(2),
            paymentCount: payments.length,
            totalLessonsSold: totalLessonsSold,
            averageCheck: (totalRevenue / payments.length).toFixed(2),
            chartData: { labels: Object.keys(dailyRevenue), data: Object.values(dailyRevenue) }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/users/export', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { role, status } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        const users = await User.find(filter).lean();
        const fields = ['name', 'email', 'role', 'status', 'contact', 'lessonsPaid', 'date_registered'];
        const parser = new Parser({ fields, withBOM: true });
        const csv = parser.parse(users);
        res.header('Content-Type', 'text/csv; charset=UTF-8');
        res.attachment('users_export.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/lessons/export', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const lessons = await Lesson.find({}).populate('student', 'name').populate('teacher', 'name').populate('course', 'name').lean();
        const lessonsData = lessons.map(l => ({
            lesson_date: new Date(l.lessonDate).toLocaleString('ru-RU'),
            student_name: l.student.name,
            teacher_name: l.teacher.name,
            course_name: l.course.name,
            topic: l.topic,
            status: l.status,
            homework: l.homework,
            recording_url: l.recordingUrl
        }));
        const fields = ['lesson_date', 'student_name', 'teacher_name', 'course_name', 'topic', 'status', 'homework', 'recording_url'];
        const parser = new Parser({ fields, withBOM: true });
        const csv = parser.parse(lessonsData);
        res.header('Content-Type', 'text/csv; charset=UTF-8');
        res.attachment('lessons_export.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/analytics', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const payments = await Payment.find({ status: 'completed' }).sort({ createdAt: 1 });
        if (payments.length === 0) {
            return res.json({ totalRevenue: '0.00', paymentCount: 0, totalLessonsSold: 0, averageCheck: '0.00', chartData: { labels: [], data: [] } });
        }
        const dailyRevenue = {};
        payments.forEach(p => {
            const day = new Date(p.createdAt).toISOString().split('T')[0];
            if (!dailyRevenue[day]) dailyRevenue[day] = 0;
            dailyRevenue[day] += p.amountPaid;
        });
        const totalRevenue = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const totalLessonsSold = payments.reduce((sum, p) => sum + p.lessonsPurchased, 0);
        res.json({
            totalRevenue: totalRevenue.toFixed(2),
            paymentCount: payments.length,
            totalLessonsSold: totalLessonsSold,
            averageCheck: (totalRevenue / payments.length).toFixed(2),
            chartData: { labels: Object.keys(dailyRevenue), data: Object.values(dailyRevenue) }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/lessons/form-data', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const [students, teachers, courses] = await Promise.all([
            User.find({ role: 'student', status: 'active' }).select('name lessonsPaid').sort({ name: 1 }).lean(),
            User.find({ role: 'teacher', status: 'active' }).select('name').sort({ name: 1 }).lean(),
            Course.find().select('name').sort({ name: 1 }).lean()
        ]);
        res.json({ students, teachers, courses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/lessons/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).lean();
        if (!lesson) {
            return res.status(404).json({ msg: 'Lesson not found' });
        }
        res.json(lesson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/lessons', ensureAuth, ensureRole('admin'), async (req, res) => {
    const { student, teacher, course, lessonDate, duration, topic } = req.body;
    if (!student || !teacher || !course || !lessonDate) {
        return res.status(400).json({ msg: 'Please fill all required fields.' });
    }
    try {
        const newLesson = await Lesson.create({
            student, teacher, course, lessonDate,
            duration: Number(duration),
            topic: topic || 'Scheduled Lesson'
        });
        await User.findByIdAndUpdate(student, { $inc: { lessonsPaid: -1 } });
        res.status(201).json(newLesson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.put('/lessons/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const updatedLesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedLesson) {
            return res.status(404).json({ msg: 'Lesson not found' });
        }
        res.json(updatedLesson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.delete('/lessons/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ msg: 'Lesson not found' });
        }
        if (lesson.status === 'scheduled') {
            await User.findByIdAndUpdate(lesson.student, { $inc: { lessonsPaid: 1 } });
        }
        await lesson.deleteOne();
        res.json({ msg: 'Lesson removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.put('/lessons/:id/status', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { status: newStatus } = req.body;
        if (!newStatus) {
            return res.status(400).json({ msg: 'New status is required' });
        }
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ msg: 'Lesson not found' });
        }
        const oldStatus = lesson.status;
        if (oldStatus !== 'scheduled' && newStatus === 'scheduled') {
            await User.findByIdAndUpdate(lesson.student, { $inc: { lessonsPaid: -1 } });
        } else if (oldStatus === 'scheduled' && (newStatus.startsWith('cancelled_'))) {
            await User.findByIdAndUpdate(lesson.student, { $inc: { lessonsPaid: 1 } });
        }
        lesson.status = newStatus;
        await lesson.save();
        res.json({ msg: 'Status updated successfully', lesson });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/users/:id/reset-password', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!user.telegramChatId) return res.status(400).json({ msg: 'User has not linked their Telegram account.' });
        const newPassword = crypto.randomBytes(4).toString('hex');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        const message = `🔑 *Password Reset*\n\nHi ${user.name}! An administrator has reset your password.\n\nYour new temporary password is: \`${newPassword}\`\n\nPlease log in and change it in your settings as soon as possible.`;
        await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
        res.json({ msg: `A new temporary password has been sent to ${user.name} via Telegram.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/notify/telegram', ensureAuth, ensureRole('admin'), async (req, res) => {
    const { userId, message } = req.body;
    if (!userId || !message) {
        return res.status(400).json({ msg: 'User ID and message are required.' });
    }
    try {
        const user = await User.findById(userId).select('telegramChatId name').lean();
        if (!user) {
            return res.status(404).json({ msg: 'User not found.' });
        }
        if (!user.telegramChatId) {
            return res.status(400).json({ msg: `User ${user.name} has not linked their Telegram account.` });
        }
        await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
        res.json({ msg: `Message successfully sent to ${user.name}.` });
    } catch (error) {
        console.error("Telegram notification error:", error);
        res.status(500).json({ msg: "Failed to send Telegram message." });
    }
});

module.exports = router;