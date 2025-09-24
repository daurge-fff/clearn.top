const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const { Parser } = require('json2csv');
const { findUserByIdentifier, creditPaymentToUser, approvePayment, declinePayment } = require('../services/paymentService');
const bot = require('../bot');
const { notifyAdmin } = require('../services/notificationService');
const { ensureAuth, ensureRole } = require('../middleware/auth');

const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Payment = require('../models/Payment');

// DEPRECATED: use /api/payments/create
router.post('/create-payment', async (req, res) => {
    const { amount, currency, description, paymentSystem, identifier } = req.body;
    try {
        if (!amount || !paymentSystem || !identifier) {
            return res.status(400).json({ error: 'Amount, payment system, and identifier are required.' });
        }
        const robokassaInvoiceId = Date.now();
        const pendingPayment = await createPendingPayment({
            ...req.body,
            robokassaInvoiceId: robokassaInvoiceId
        });
        // Удалено дублирующее уведомление админа, чтобы избежать повторов
        if (paymentSystem === 'robokassa') {
            const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
            const isTest = process.env.ROBOKASSA_IS_TEST === '1';
            const pass1 = isTest ? process.env.ROBOKASSA_TEST_PASS_1 : process.env.ROBOKASSA_PASS_1;
            const formattedAmount = Number(amount).toFixed(2);
            const stringForHashing = `${merchantLogin}:${formattedAmount}:${robokassaInvoiceId}:${pass1}`;
            const signature = crypto.createHash('md5').update(stringForHashing).digest('hex');
            const paymentUrl = `https://auth.robokassa.ru/Merchant/Index.aspx?` +
                `MerchantLogin=${merchantLogin}&` +
                `OutSum=${formattedAmount}&` +
                `InvId=${robokassaInvoiceId}&` +
                `Description=${encodeURIComponent(description)}&` +
                `SignatureValue=${signature}&` +
                `Culture=ru&` +
                `Encoding=utf-8` +
                (isTest ? '&IsTest=1' : '');
            console.log(`[DEBUG] Payment URL: ${paymentUrl}`);
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

async function createPendingPayment(details) {
    const { amount, currency, description, identifier, paymentSystem, robokassaInvoiceId } = details;
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
        robokassaInvoiceId: robokassaInvoiceId,
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

router.post('/payment/robokassa/result', async (req, res) => {
    try {
        const { OutSum, InvId, SignatureValue } = req.body;
        const isTest = process.env.ROBOKASSA_IS_TEST === '1';
        const pass2 = isTest ? process.env.ROBOKASSA_TEST_PASS_2 : process.env.ROBOKASSA_PASS_2;
        const payment = await Payment.findOne({ robokassaInvoiceId: Number(InvId) });
        
        if (!payment) {
            console.error(`Robokassa: Payment with ID ${InvId} not found.`);
            return res.status(404).send('Payment not found');
        }

        if (payment.status === 'completed') {
            return res.send(`OK${InvId}`);
        }

        const signatureString = `${OutSum}:${InvId}:${pass2}`;
        const mySignature = crypto.createHash('md5').update(signatureString).digest('hex');
        
        if (mySignature.toLowerCase() !== SignatureValue.toLowerCase()) {
            console.error(`Robokassa: Invalid signature for order ${InvId}.`);
            return res.status(400).send('Invalid signature');
        }
        
        payment.status = 'completed';
        if (!payment.userId) {
            const user = await findUserByIdentifier(payment.pendingIdentifier);
            if (user) {
                payment.userId = user._id;
                console.log(`Auto-linked Robokassa payment ${payment._id} to user ${user.email}`);
            }
        }
        
        await payment.save();
        if (payment.userId) {
            const creditResult = await creditPaymentToUser(payment);
            if(creditResult.success) {
                 await notifyAdmin(
                    `✅ *Successful Payment (Robokassa)*\n\n` +
                    `*Amount:* ${OutSum} ${payment.currency}\n` +
                    `*Client:* \`${payment.pendingIdentifier}\`\n` +
                    `*User:* ${creditResult.user.name}\n`+
                    `*Action:* ${payment.lessonsPurchased} lesson(s) credited. New balance: *${creditResult.user.lessonsPaid}* lessons.`
                );
            }
        } else {
            await notifyAdmin(`⚠️ *Successful Payment (Robokassa) - Needs Linking*\n\n*Amount:* ${OutSum} ${payment.currency}\n*Client:* \`${payment.pendingIdentifier}\`\n*Order:* \`${InvId}\`\n\nPlease link this payment to a user manually.`);
        }
        
        res.send(`OK${InvId}`);
    } catch (error) {
        console.error(`Robokassa result processing error for order ${req.body.InvId}:`, error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/payments/:paymentId/link-user', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { userId } = req.body;
        const payment = await Payment.findById(req.params.paymentId);

        if (!userId || !payment) {
            return res.status(404).json({ msg: 'Payment or User not found' });
        }

        payment.userId = userId;
        await payment.save();
        
        if (payment.status === 'completed') {
            await creditPaymentToUser(payment);
        }

        await notifyAdmin(`🔗 *Payment Linked*\n\nPayment from \`${payment.pendingIdentifier}\` has been manually linked to user ID \`${userId}\`.`);

        res.json({ msg: 'Payment linked successfully.', payment });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/manual-payment/submit', async (req, res) => {
    try {
        const { transactionId, paymentSystem, amount, currency, lessonsPurchased, description, identifier } = req.body;

        if (!transactionId || !amount || !identifier || !paymentSystem) {
            return res.status(400).json({ msg: 'Missing required details.' });
        }

        const existingPayment = await Payment.findOne({
             $or: [{ 'paypalOrderID': transactionId }, { 'robokassaInvoiceId': transactionId }] 
        });
        if (existingPayment) {
            return res.status(400).json({ msg: 'This Transaction ID has already been submitted.' });
        }
        const user = await findUserByIdentifier(identifier);
        
        const pricePerLesson = lessonsPurchased > 0 ? (parseFloat(amount) / lessonsPurchased) : 0;
        
        const newPayment = await Payment.create({
            userId: user ? user._id : null,
            pendingIdentifier: identifier.trim().toLowerCase(),
            status: 'manual_review',
            amountPaid: parseFloat(amount),
            baseAmount: parseFloat(amount),
            currency: currency,
            lessonsPurchased: parseInt(lessonsPurchased, 10),
            pricePerLesson: pricePerLesson,
            paymentSystem: `${paymentSystem} (Manual)`,
            transactionType: description.toLowerCase().includes('donation') ? 'Donation' : '50min',
            paypalOrderID: transactionId
        });

        const systemName = paymentSystem.charAt(0).toUpperCase() + paymentSystem.slice(1);

        try {
            await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID,
                `⚠️ *Manual ${systemName} Confirmation*\n\n` +
                `A user claims to have paid. Please verify this transaction in your ${systemName} account.\n\n` +
                `💰 *Amount:* ${amount} ${currency}\n` +
                `👤 *Client:* \`${identifier}\`\n` +
                `🧾 *Transaction Ref:* \`${transactionId}\``,
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "✅ Approve", callback_data: `payment_approve_${newPayment._id}` },
                                { text: "❌ Decline", callback_data: `payment_decline_${newPayment._id}` }
                            ]
                        ]
                    }
                }
            );
        } catch (telegramError) {
            console.error('Failed to send manual payment notification to admin:', telegramError.message);
        }

        res.status(200).json({ 
            msg: 'Your payment confirmation has been received and is awaiting review.',
            payment: newPayment
        });
    } catch (error) {
        console.error('Error recording manual payment:', error);
        await notifyAdmin(`🔥 *Error on Manual ${req.body.paymentSystem} Submission*\n\n*Ref:* \`${req.body.transactionId}\`\n*Error:* ${error.message}`);
        res.status(500).json({ msg: 'Server error while submitting your confirmation.' });
    }
});

// @desc    Update the status of a payment by an admin
// @route   PUT /api/payments/:id/status
router.put('/payments/:id/status', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { status: newStatus } = req.body;
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ msg: 'Payment not found.' });
        }
        const oldStatus = payment.status;
        if (oldStatus === newStatus) {
            return res.status(200).json({ msg: 'Status is already the same.', payment });
        }
        if (oldStatus === 'manual_review' && newStatus === 'completed') {
            if (payment.userId) {
                await creditPaymentToUser(payment);
            }
        }
        payment.status = newStatus;
        await payment.save();

        await notifyAdmin(
            `🔄 *Payment Status Changed*\n\n` +
            `*Client:* \`${payment.pendingIdentifier}\`\n` +
            `*Amount:* ${payment.amountPaid} ${payment.currency}\n` +
            `*Status changed:* from \`${oldStatus}\` to \`${newStatus}\`\n` +
            `*Changed by:* Admin`
        );

        res.json({ msg: 'Payment status updated successfully.', payment });

    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @desc    Delete a payment record
// @route   DELETE /api/payments/:id
router.delete('/payments/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ msg: 'Payment not found' });
        }
        await payment.deleteOne();
        res.json({ msg: 'Payment record deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @desc    Export payments to CSV
// @route   GET /api/payments/export
router.get('/payments/export', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status) filter.status = status;

        const payments = await Payment.find(filter)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const fields = [
            { label: 'Date', value: 'createdAt' },
            { label: 'Client Identifier', value: 'pendingIdentifier' },
            { label: 'User Name', value: 'userId.name' },
            { label: 'User Email', value: 'userId.email' },
            { label: 'Amount', value: 'amountPaid' },
            { label: 'Currency', value: 'currency' },
            { label: 'Payment System', value: 'paymentSystem' },
            { label: 'Status', value: 'status' },
            { label: 'Transaction ID', value: 'paypalOrderID' }
        ];

        const parser = new Parser({ fields, withBOM: true });
        const csv = parser.parse(payments);

        res.header('Content-Type', 'text/csv; charset=UTF-8');
        res.attachment('payments_export.csv');
        res.send(csv);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.use('/payment/cryptocloud/notification', express.raw({ type: 'application/json' }));
router.post('/payment/cryptocloud/notification', async (req, res) => {
    try {
        const signature = req.headers['sign'];
        const apiKey = process.env.CRYPTO_CLOUD_API_KEY;

        // Проверяем подпись
        const calculatedSignature = crypto.createHmac('sha256', apiKey).update(req.body).digest('hex');
        if (signature !== calculatedSignature) {
            console.error('CryptoCloud: Invalid signature.');
            return res.status(403).send('Invalid signature');
        }
        
        const data = JSON.parse(req.body.toString());
        const payment = await Payment.findById(data.order_id);

        if (!payment) {
            console.error(`CryptoCloud: Payment with ID ${data.order_id} not found.`);
            return res.status(404).send('Payment not found');
        }
        
        if (payment.status === 'completed') {
            return res.sendStatus(200);
        }

        if (data.status === 'success') {
            payment.status = 'completed';
            
            if (!payment.userId) {
                const user = await findUserByIdentifier(payment.pendingIdentifier);
                if (user) {
                    payment.userId = user._id;
                    console.log(`Auto-linked CryptoCloud payment ${payment._id} to user ${user.email}`);
                }
            }

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

// @desc Search for users by admin
// @route POST /api/users/search
router.post('/users/search', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { searchTerm } = req.body;
        if (!searchTerm) return res.json([]);
            const searchRegex = new RegExp(searchTerm, 'i');
            const users = await User.find({
                $or: [{ name: searchRegex }, { email: searchRegex }]
            }).select('name email role').limit(5).lean();
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/lessons', ensureAuth, async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'student') query.student = req.user.id;
        else if (req.user.role === 'teacher') query.teacher = req.user.id;

        const lessons = await Lesson.find(query)
            .populate('student', 'name emojiAvatar timeZone')
            .populate('teacher', 'name emojiAvatar timeZone')
            .populate('course', 'name');

        const userTz = req.user.timeZone || 'Europe/Moscow';

        const events = lessons.map(lesson => {
            const isStudentRole = req.user.role === 'student';
            const otherParty = isStudentRole ? lesson.teacher : lesson.student;

            // Конвертируем время урока в часовой пояс пользователя
            const lessonStart = moment.tz(lesson.lessonDate, userTz).toDate();
            const lessonEnd = moment.tz(lesson.lessonDate, userTz).add(lesson.duration, 'minutes').toDate();

            return {
                title: otherParty ? `Lesson with ${otherParty.name}` : 'Lesson',
                start: lessonStart,
                end: lessonEnd,
                backgroundColor: lesson.status === 'completed' ? '#2ecc71' : (lesson.status.startsWith('cancelled') ? '#e74c3c' : '#3498db'),
                borderColor: lesson.status === 'completed' ? '#2ecc71' : (lesson.status.startsWith('cancelled') ? '#e74c3c' : '#3498db'),
                id: lesson._id,
                url: isStudentRole ? `/dashboard/lessons/view/${lesson._id}` : `/dashboard/lessons/manage/${lesson._id}`,
                status: lesson.status,
                topic: lesson.topic,
                student: lesson.student ? { 
                    name: lesson.student.name, 
                    emojiAvatar: lesson.student.emojiAvatar,
                    id: lesson.student._id,
                    profileUrl: `/dashboard/user-profile/${lesson.student._id}`
                } : { name: 'N/A' },
                course: lesson.course ? { name: lesson.course.name } : { name: 'N/A' }
            };
        });
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
            return res.json({ totalRevenue: 0, paymentCount: 0, totalLessonsSold: 0, averageCheck: 0, chartData: { labels: [], data: [] } });
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
            totalRevenue: Math.round(totalRevenue),
            paymentCount: payments.length,
            totalLessonsSold: totalLessonsSold,
            averageCheck: Math.round(totalRevenue / payments.length),
            chartData: { labels: Object.keys(dailyRevenue), data: Object.values(dailyRevenue) }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/progress/:userId/:type?', ensureAuth, async (req, res) => {
    try {
        const { userId, type } = req.params;
        if (req.user.role === 'student' && req.user.id !== userId) {
            return res.status(403).json({ msg: 'Forbidden' });
        }
        const isProjectQuery = type === 'projects'
            ? { isProjectGrade: true }
            : { isProjectGrade: { $ne: true } };

        const grades = await Grade.find({
            student: userId,
            ...isProjectQuery
        })
        .sort({ createdAt: 'asc' })
        .lean();

        if (!grades || grades.length === 0) {
            return res.json({ labels: [], scores: [] });
        }

        const labels = grades.map(g => new Date(g.createdAt).toLocaleDateString('en-GB'));
        const scores = grades.map(g => g.score);

        res.json({ labels, scores });

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
        const lessons = await Lesson.find({}).populate('student', 'name timeZone').populate('teacher', 'name timeZone').populate('course', 'name').lean();
        const userTz = req.user.timeZone || 'Europe/Moscow';
        const lessonsData = lessons.map(l => ({
            lesson_date: moment.tz(l.lessonDate, userTz).format('DD/MM/YYYY HH:mm'),
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
            return res.json({ totalRevenue: 0, paymentCount: 0, totalLessonsSold: 0, averageCheck: 0, chartData: { labels: [], data: [] } });
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
            totalRevenue: Math.round(totalRevenue),
            paymentCount: payments.length,
            totalLessonsSold: totalLessonsSold,
            averageCheck: Math.round(totalRevenue / payments.length),
            chartData: { labels: Object.keys(dailyRevenue), data: Object.values(dailyRevenue) }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.get('/lessons/form-data', ensureAuth, ensureRole('admin', 'teacher'), async (req, res) => {
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

router.get('/lessons/:id', ensureAuth, ensureRole('admin', 'teacher'), async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).lean();
        if (!lesson) {
            return res.status(404).json({ msg: 'Lesson not found' });
        }

        if (req.user.role === 'teacher' && String(lesson.teacher) !== String(req.user._id)) {
            return res.status(403).json({ msg: 'Forbidden: You are not the teacher for this lesson.' });
        }

        res.json(lesson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/lessons', ensureAuth, ensureRole('admin', 'teacher'), async (req, res) => {
    const { student, teacher, course, lessonDate, duration, topic } = req.body;
    if (!student || !teacher || !course || !lessonDate) {
        return res.status(400).json({ msg: 'Please fill all required fields.' });
    }
    try {
        // Интерпретируем дату как MSK время и конвертируем в UTC для хранения
        const moscowDate = moment.tz(lessonDate, 'Europe/Moscow');
        const utcDate = moscowDate.utc().toDate();
        
        // Calculate lesson number for this student
        const completedLessonsCount = await Lesson.countDocuments({
            student: student,
            status: 'completed'
        });
        const lessonNumber = completedLessonsCount + 1;
        const defaultTopic = `Lesson ${lessonNumber}`;

        const newLesson = await Lesson.create({
            student, teacher, course,
            lessonDate: utcDate,
            duration: Number(duration),
            topic: topic || defaultTopic
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
        const updateData = { ...req.body };
        
        // Если обновляется дата урока, конвертируем из MSK в UTC
        if (updateData.lessonDate) {
            const moscowDate = moment.tz(updateData.lessonDate, 'Europe/Moscow');
            updateData.lessonDate = moscowDate.utc().toDate();
        }
        
        const updatedLesson = await Lesson.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
        // Always return lesson to balance when deleting
        await User.findByIdAndUpdate(lesson.student, { $inc: { lessonsPaid: 1 } });
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

        const lesson = await Lesson.findById(req.params.id).populate('student');
        if (!lesson) {
            return res.status(404).json({ msg: 'Lesson not found' });
        }

        const user = lesson.student;
        const oldStatus = lesson.status;

        // Use LessonBalanceService for consistent balance management
        if (newStatus !== oldStatus) {
            const LessonBalanceService = require('../services/lessonBalanceService');
            const balanceResult = await LessonBalanceService.changeLessonStatus(
                req.params.id,
                newStatus,
                oldStatus,
                req.user
            );

            if (!balanceResult.success) {
                return res.status(500).json({ msg: 'Failed to update balance: ' + balanceResult.error });
            }

            lesson.status = newStatus;
            await lesson.save();

            res.json({ msg: 'Status updated successfully', lesson });
        } else {
            res.json({ msg: 'Status is already the same.', lesson });
        }
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
        try {
            await bot.telegram.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
        } catch (telegramError) {
            console.error(`Failed to send password reset message to user ${user.name}:`, telegramError.message);
            return res.status(500).json({ msg: 'Failed to send Telegram message.' });
        }
        res.json({ msg: `A new temporary password has been sent to ${user.name} via Telegram.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

const feedbackRateLimit = new Map();

router.post('/feedback', async (req, res) => {
    const { name, email, message, timezone } = req.body;
    console.log('Feedback request headers:', req.headers);
    console.log('req.ip:', req.ip);
    console.log('req.connection.remoteAddress:', req.connection.remoteAddress);
    let ip = req.headers['cf-connecting-ip'] ||
           req.headers['x-real-ip'] ||
           (req.headers['x-forwarded-for'] || '').split(',').shift().trim() ||
           req.ip ||
           req.connection.remoteAddress || 'unknown';
    if (ip.startsWith('::ffff:')) {
        ip = ip.slice(7);
    }
    console.log('Calculated IP:', ip);
    if (!name || !email || !message) {
        return res.status(400).json({ msg: 'All fields are required' });
    }
    if (feedbackRateLimit.has(ip) && Date.now() - feedbackRateLimit.get(ip) < 60000) {
        return res.status(429).json({ msg: 'Please wait a minute before sending another feedback.' });
    }
    try {
        let timezoneDisplay = 'Unknown';
        if (timezone) {
            const dateStr = new Date().toLocaleString('en', { timeZone: timezone, timeZoneName: 'short' });
            const utcOffset = dateStr.split(' ').pop().replace('GMT', 'UTC');
            timezoneDisplay = `${timezone} (${utcOffset})`;
        }
        const telegramMessage = `🆕 *New Feedback Received* \n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n🕒 *Timezone:* ${timezoneDisplay}\n🌐 *IP:* ${ip}\n\n💬 *Message:* \n${message}`;
        try {
            await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, telegramMessage, { parse_mode: 'Markdown' });
        } catch (telegramError) {
            console.error('Failed to send feedback notification to admin:', telegramError.message);
        }
        feedbackRateLimit.set(ip, Date.now());
        res.json({ msg: 'Feedback sent successfully' });
    } catch (err) {
        console.error(err);
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
        try {
            await bot.telegram.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
            res.json({ msg: `Message successfully sent to ${user.name}.` });
        } catch (telegramError) {
            console.error(`Failed to send Telegram notification to user ${user.name}:`, telegramError.message);
            return res.status(500).json({ msg: 'Failed to send Telegram message.' });
        }
    } catch (error) {
        console.error("Telegram notification error:", error);
        res.status(500).json({ msg: "Failed to send Telegram message." });
    }
});

// Подключаем маршруты платежей
router.use('/payments', require('./payments'));

module.exports = router;