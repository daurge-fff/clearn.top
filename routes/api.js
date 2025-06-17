const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const Grade = require('../models/Grade');
const { Parser } = require('json2csv');
const { ensureAuth, ensureRole } = require('../middleware/auth');
const { processSuccessfulPayment } = require('../services/paymentService');
const Payment = require('../models/Payment');

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
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Получение данных об успеваемости для графика
// @route   GET /api/progress/:studentId
router.get('/progress/:studentId', ensureAuth, async (req, res) => {
    try {
        if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const grades = await Grade.find({ student: req.params.studentId })
            .sort({ createdAt: 1 })
            .populate({ path: 'lesson', select: 'lessonDate' });

        const labels = grades.map(g => new Date(g.lesson.lessonDate).toLocaleDateString('en-GB'));
        const scores = grades.map(g => g.score);

        res.json({ labels, scores });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Экспорт пользователей в CSV
// @route   GET /api/users/export
router.get('/users/export', ensureAuth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
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
        res.status(500).send('Server Error');
    }
});

// @desc    Экспорт уроков в CSV
// @route   GET /api/lessons/export
router.get('/lessons/export', ensureAuth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
    try {
        const lessons = await Lesson.find({})
            .populate('student', 'name')
            .populate('teacher', 'name')
            .populate('course', 'name')
            .lean();

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
        res.status(500).send('Server Error');
    }
});

// @desc    Получение данных о проектных работах
// @route   GET /api/progress/:studentId/projects
router.get('/progress/:studentId/projects', ensureAuth, async (req, res) => {
    const grades = await Grade.find({ student: req.params.studentId, isProjectGrade: true }).sort({ createdAt: 1 }).populate('lesson', 'projectDetails.title');
    const labels = grades.map(g => g.lesson.projectDetails.title);
    const scores = grades.map(g => g.score);
    res.json({ labels, scores });
});
// @desc    Получение данных для финансовой аналитики
// @route   GET /api/analytics
router.get('/analytics', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const payments = await Payment.find({}).sort({ createdAt: 1 });

        if (payments.length === 0) {
            return res.json({
                totalRevenue: '0.00',
                paymentCount: 0,
                totalLessonsSold: 0,
                averageCheck: '0.00',
                chartData: { labels: [], data: [] }
            });
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
            chartData: {
                labels: Object.keys(dailyRevenue),
                data: Object.values(dailyRevenue)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;