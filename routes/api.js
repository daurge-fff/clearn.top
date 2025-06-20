const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Parser } = require('json2csv');

// --- Middleware ---
const { ensureAuth, ensureRole } = require('../middleware/auth');

// --- Models ---
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Grade = require('../models/Grade');
const Course = require('../models/Course');
const Payment = require('../models/Payment');

// --- Services & Bot ---
const bot = require('../bot');

// @desc    Получение уроков для FullCalendar
// @route   GET /api/lessons
router.get('/lessons', ensureAuth, async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'student') {
            query.student = req.user.id;
        } else if (req.user.role === 'teacher') {
            query.teacher = req.user.id;
        }

        const lessons = await Lesson.find(query)
            .populate('student', 'name')
            .populate('teacher', 'name');

        const events = lessons.map(lesson => {
            let eventColor = '#3498db'; // scheduled
            if (lesson.status === 'completed') eventColor = '#2ecc71'; // completed
            if (lesson.status.startsWith('cancelled')) eventColor = '#e74c3c'; // cancelled

            let title = '';
            let url = null;

            if (req.user.role === 'student') {
                title = `Lesson with ${lesson.teacher.name}`;
                url = `/dashboard/lessons/view/${lesson._id}`;
            } else if (req.user.role === 'teacher') {
                title = `Lesson with ${lesson.student.name}`;
                url = `/dashboard/lessons/manage/${lesson._id}`;
            } else { // Admin
                title = `${lesson.teacher.name} - ${lesson.student.name}`;
                url = `/dashboard/lessons/manage/${lesson._id}`;
            }

            return {
                title: title,
                start: lesson.lessonDate,
                end: new Date(new Date(lesson.lessonDate).getTime() + lesson.duration * 60000),
                backgroundColor: eventColor,
                borderColor: eventColor,
                id: lesson._id,
                url: url
            };
        });

        res.json(events);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @desc    Получение данных об успеваемости для графика
// @route   GET /api/progress/:studentId
router.get('/progress/:studentId', ensureAuth, async (req, res) => {
    try {
        if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
            return res.status(403).json({ msg: 'Forbidden' });
        }
        const grades = await Grade.find({ student: req.params.studentId }).sort({ createdAt: 1 }).populate({ path: 'lesson', select: 'lessonDate' });
        const labels = grades.map(g => new Date(g.lesson.lessonDate).toLocaleDateString('en-GB'));
        const scores = grades.map(g => g.score);
        res.json({ labels, scores });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});


// @desc    Экспорт пользователей в CSV
// @route   GET /api/users/export
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


// @desc    Экспорт уроков в CSV
// @route   GET /api/lessons/export
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


// @desc    Получение данных для финансовой аналитики
// @route   GET /api/analytics
router.get('/analytics', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const payments = await Payment.find({}).sort({ createdAt: 1 });
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

// === CRUD & Actions for Lessons (for Modals) ===

// @desc    Получение данных для форм (студенты, учителя, курсы)
// @route   GET /api/lessons/form-data
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

// @desc    Получение данных одного урока для редактирования
// @route   GET /api/lessons/:id
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

// @desc    Создание нового урока
// @route   POST /api/lessons
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

// @desc    Обновление существующего урока
// @route   PUT /api/lessons/:id
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

// @desc    Удаление урока
// @route   DELETE /api/lessons/:id
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

// @desc    Обновление статуса урока
// @route   PUT /api/lessons/:id/status
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

// === Actions for Users (for Modals & Bot) ===

// @desc    Сброс пароля пользователя
// @route   POST /api/users/:id/reset-password
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

// @desc    Отправка сообщения в телеграм
// @route   POST /api/notify/telegram
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