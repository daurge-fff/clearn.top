const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ensureAuth, ensureRole } = require('../middleware/auth');
const fs = require('fs');
const moment = require('moment-timezone');

const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const upload = require('../middleware/upload');
const Payment = require('../models/Payment');
const paymentService = require('../services/paymentService');
const { notifyAllAdmins } = require('../services/notificationService');
const LessonBalanceService = require('../services/lessonBalanceService');

// Stars are now awarded directly based on the grade score (1:1 ratio)

// @desc    Главная страница личного кабинета
// @route   GET /dashboard
router.get('/', ensureAuth, async (req, res) => {
    try {
        let stats = {};
        const now = new Date();

        if (req.user.role === 'student') {
            const upcomingLesson = await Lesson.findOne({
                student: req.user.id,
                status: 'scheduled',
                lessonDate: { $gte: now }
            }).sort({ lessonDate: 1 }).populate('teacher', 'name').lean();
            
            const userTz = req.user.timeZone || 'Europe/Moscow';
            
            if (upcomingLesson) {
                upcomingLesson.localLessonDate = moment.tz(upcomingLesson.lessonDate, userTz).toDate();
            }
            
            stats = {
                lessonsPaid: req.user.lessonsPaid,
                upcomingLesson: upcomingLesson
            };
        } 
        else if (req.user.role === 'teacher') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); // Monday
            startOfWeek.setHours(0, 0, 0, 0);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 7);

            const lessonsThisWeek = await Lesson.find({ teacher: req.user.id, lessonDate: { $gte: startOfWeek, $lt: endOfWeek } }).populate('student', 'name').populate('course', 'name').sort({ lessonDate: 1 }).lean();
            
            const userTz = req.user.timeZone || 'Europe/Moscow';
            const lessonsThisWeekWithLocalTime = lessonsThisWeek.map(lesson => ({
                ...lesson,
                localLessonDate: moment.tz(lesson.lessonDate, userTz).toDate()
            }));

            stats = {
                lessonsThisWeek: lessonsThisWeekWithLocalTime.length,
                lessonsThisWeekList: lessonsThisWeekWithLocalTime,
                studentCount: req.user.students.length
            };
        } 
        else if (req.user.role === 'admin') {
            stats = {
                studentCount: await User.countDocuments({ role: 'student' }),
                teacherCount: await User.countDocuments({ role: 'teacher' }),
                lessonsScheduled: await Lesson.countDocuments({ status: 'scheduled', lessonDate: { $gte: new Date() } })
            };
        }

        res.render('dashboard', {
            layout: 'layouts/dashboard',
            user: req.user,
            stats: stats,
            page_name: 'dashboard'
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Update payment status
// @route   POST /dashboard/payments/:id/status
router.post('/payments/:id/status', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const payment = await paymentService.updatePaymentStatus(req.params.id, status, req.user._id);
        
        if (req.headers['content-type'] === 'application/json') {
            res.status(200).json({ success: true, message: 'Payment status updated successfully', payment });
        } else {
            res.redirect('/dashboard/payments');
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        if (req.headers['content-type'] === 'application/json') {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.status(500).send('Server error');
        }
    }
});

// @desc    Страница управления пользователями (с фильтрацией и сортировкой)
// @route   GET /dashboard/users
router.get('/users', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { role, status } = req.query;
        let filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        let sort = {};
        if (req.query.sort) {
            sort[req.query.sort] = req.query.order === 'desc' ? -1 : 1;
        } else {
            sort.name = 1;
        }

        const users = await User.find(filter).sort(sort).lean();

        // Calculate lesson counts for each user based on their role
        const usersWithLessonCounts = await Promise.all(users.map(async (user) => {
            let lessonCount = 0;
            
            if (user.role === 'student') {
                lessonCount = user.lessonsPaid || 0;
            } else if (user.role === 'teacher') {
                // Count lessons where this user is the teacher
                const teacherLessons = await Lesson.countDocuments({ teacher: user._id });
                lessonCount = teacherLessons;
            } else if (user.role === 'admin') {
                // Count all lessons for admins
                const adminLessons = await Lesson.countDocuments({});
                lessonCount = adminLessons;
            }

            return {
                ...user,
                lessonCount: lessonCount
            };
        }));

        res.render('admin/users', {
            layout: 'layouts/dashboard',
            user: req.user,
            users: usersWithLessonCounts,
            query: req.query,
            page_name: 'users'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/users/add', ensureAuth, ensureRole('admin'), (req, res) => { res.render('admin/user_add', { layout: 'layouts/dashboard', user: req.user, page_name: 'users' }); });
router.post('/users/add', ensureAuth, ensureRole('admin'), async (req, res) => { const { name, email, password, role, contact, lessonsPaid } = req.body; if (!name || !email || !password || !role) return res.status(400).send('Please fill all required fields.'); try { if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).send('User with this email already exists.'); const newUser = new User({ name, email: email.toLowerCase(), password, role, contact, lessonsPaid: role === 'student' ? Number(lessonsPaid) : 0 }); const salt = await bcrypt.genSalt(10); newUser.password = await bcrypt.hash(password, salt); await newUser.save(); res.redirect('/dashboard/users'); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/users/edit/:id', ensureAuth, ensureRole('admin'), async (req, res) => { try { const userToEdit = await User.findById(req.params.id).lean(); if (!userToEdit) return res.status(404).send('User not found'); const teachers = await User.find({ role: 'teacher' }).lean(); res.render('admin/user_edit', { layout: 'layouts/dashboard', user: req.user, userToEdit: userToEdit, teachers: teachers, page_name: 'users', timeZones: (() => {
    const zones = moment.tz.names()
      .filter(tz => tz.includes('/'))
      .map(tz => {
        const offset = moment.tz(tz).utcOffset();
        const hours = Math.floor(offset / 60);
        const minutes = Math.abs(offset % 60);
        let offsetStr = (offset >= 0 ? '+' : '-') + Math.abs(hours);
        if (minutes) offsetStr += `:${minutes.toString().padStart(2, '0')}`;
        return { value: tz, label: `${tz} (UTC${offsetStr})`, offset };
      });
    const grouped = zones.reduce((acc, zone) => {
      const groupKey = zone.offset;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(zone);
      return acc;
    }, {});
    return Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map(offset => {
        const hours = Math.floor(Number(offset) / 60);
        const minutes = Math.abs(Number(offset) % 60);
        let offsetStr = (Number(offset) >= 0 ? '+' : '-') + Math.abs(hours);
        if (minutes) offsetStr += `:${minutes.toString().padStart(2, '0')}`;
        return {
          offset: Number(offset),
          label: `UTC ${offsetStr}`,
          zones: grouped[offset].sort((a, b) => a.value.localeCompare(b.value))
        };
      });
  })() }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.post('/users/edit/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, role, contact, lessonsPaid, stars, status, teacher: newTeacherId, timeZone } = req.body;
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) return res.status(404).send('User not found');
        
        const oldTeacherId = userToUpdate.teacher ? String(userToUpdate.teacher) : null;
        const newTeacherIdStr = newTeacherId || null;
        
        if (oldTeacherId !== newTeacherIdStr) {
            if (oldTeacherId) {
                await User.updateOne({ _id: oldTeacherId }, { $pull: { students: userId } });
            }
            if (newTeacherIdStr && role === 'student') {
                await User.updateOne({ _id: newTeacherIdStr }, { $addToSet: { students: userId } });
            }
        }
        
        userToUpdate.name = name;
        userToUpdate.email = email.toLowerCase();
        userToUpdate.contact = contact;
        userToUpdate.timeZone = timeZone || userToUpdate.timeZone;
        userToUpdate.status = status;
        
        if (userToUpdate.role !== 'student' && role === 'student') {
            userToUpdate.teacher = newTeacherIdStr;
        } else if (userToUpdate.role === 'student' && role !== 'student') {
            if(oldTeacherId) {
                await User.updateOne({ _id: oldTeacherId }, { $pull: { students: userId } });
            }
            userToUpdate.teacher = null;
        }
        
        userToUpdate.role = role;
        
        if (role === 'student') {
            userToUpdate.lessonsPaid = Number(lessonsPaid) || 0;
            userToUpdate.stars = Number(stars) || 0;
            userToUpdate.teacher = newTeacherIdStr;
        } else {
            userToUpdate.lessonsPaid = 0;
            userToUpdate.stars = 0;
            userToUpdate.teacher = null;
        }
        
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            userToUpdate.password = await bcrypt.hash(req.body.password, salt);
        }
        
        await userToUpdate.save();
        res.redirect('/dashboard/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/users/delete/:id', ensureAuth, ensureRole('admin'), async (req, res) => { try { await User.findByIdAndDelete(req.params.id); res.redirect('/dashboard/users'); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });

// @desc    Редактирование записи в истории баланса
// @route   POST /dashboard/users/balance/edit/:id
router.post('/users/balance/edit/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { change, reason } = req.body;
        const { userId } = req.query;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        const balanceEntry = user.balanceHistory.id(req.params.id);
        if (!balanceEntry) {
            return res.status(404).send('Balance entry not found');
        }
        
        balanceEntry.change = Number(change);
        balanceEntry.reason = reason;

        user.balanceHistory.sort((a, b) => a.date - b.date);
        let currentBalance = 0;
        user.balanceHistory.forEach(entry => {
            currentBalance += entry.change;
            entry.balanceAfter = currentBalance;
        });
        user.lessonsPaid = currentBalance;

        await user.save();
        res.redirect(`/dashboard/user-profile/${user._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Удаление записи из истории баланса
// @route   POST /dashboard/users/balance/delete/:id
router.post('/users/balance/delete/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { userId } = req.query;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Просто удаляем запись из истории без пересчета баланса
        user.balanceHistory.pull({ _id: req.params.id });

        // Обновляем только поле balanceAfter для оставшихся записей для корректного отображения
        user.balanceHistory.sort((a, b) => a.date - b.date);
        let runningBalance = 0;
        user.balanceHistory.forEach(entry => {
            runningBalance += entry.change;
            entry.balanceAfter = runningBalance;
        });
        
        // НЕ изменяем lessonsPaid и stars - они остаются как есть

        await user.save();
        
        res.redirect(`/dashboard/user-profile/${user._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Редактирование платежа в истории баланса
// @route   POST /dashboard/users/balance/edit-payment/:id
router.post('/users/balance/edit-payment/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { amountPaid, currency, lessonsPurchased, paymentSystem, transactionType, status, pendingIdentifier, description } = req.body;
        const { userId } = req.query;
        
        if (!amountPaid || !currency || !lessonsPurchased || !paymentSystem) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        const balanceEntry = user.balanceHistory.id(req.params.id);
        if (!balanceEntry) {
            return res.status(404).json({ 
                success: false, 
                message: 'Balance entry not found' 
            });
        }

        
        // Обновляем поля платежа
        balanceEntry.amountPaid = parseFloat(amountPaid);
        balanceEntry.currency = currency;
        balanceEntry.lessonsPurchased = parseInt(lessonsPurchased);
        balanceEntry.paymentSystem = paymentSystem;
        balanceEntry.transactionType = transactionType || '50min';
        balanceEntry.status = status || 'completed';
        balanceEntry.pendingIdentifier = pendingIdentifier || '';
        balanceEntry.description = description || '';
        // НЕ изменяем balanceEntry.change - оставляем как было
        // НЕ пересчитываем баланс пользователя
        
        // Обновляем reason с новой платежной системой
        balanceEntry.reason = `Payment via ${paymentSystem}`;

        await user.save();
        
        // Если есть связанный платеж в Payment модели, обновляем его тоже
        if (balanceEntry.paymentId) {
            const Payment = require('../models/Payment');
            const payment = await Payment.findById(balanceEntry.paymentId);
            if (payment) {
                payment.amountPaid = parseFloat(amountPaid);
                payment.currency = currency;
                payment.lessonsPurchased = parseInt(lessonsPurchased);
                payment.paymentSystem = paymentSystem;
                payment.transactionType = transactionType || '50min';
                payment.status = status || 'completed';
                payment.pendingIdentifier = pendingIdentifier || '';
                payment.notes = description || '';
                payment.pricePerLesson = lessonsPurchased > 0 ? (parseFloat(amountPaid) / lessonsPurchased) : 0;
                await payment.save();
            }
        }

        res.json({ 
            success: true, 
            message: 'Payment updated successfully' 
        });
        
    } catch (err) {
        console.error('Error editing payment:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating payment' 
        });
    }
});
// @desc    Страница просмотра всех уроков (с поиском, фильтрацией и сортировкой)
// @route   GET /dashboard/lessons
router.get('/lessons', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { search, teacher, student, status, dateFrom, dateTo } = req.query;
        let filter = {};
        if (teacher) filter.teacher = teacher;
        if (student) filter.student = student;
        if (status) filter.status = status;

        if (dateFrom || dateTo) {
            filter.lessonDate = {};
            if (dateFrom) filter.lessonDate.$gte = new Date(dateFrom);
            if (dateTo) {
                const to = new Date(dateTo);
                filter.lessonDate.$lte = new Date(to.setDate(to.getDate() + 1));
            }
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            
            const matchingUsers = await User.find({ name: searchRegex }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            
            const matchingCourses = await Course.find({ name: searchRegex }).select('_id');
            const courseIds = matchingCourses.map(c => c._id);

            filter.$or = [
                { topic: searchRegex },
                { teacher: { $in: userIds } },
                { student: { $in: userIds } },
                { course: { $in: courseIds } }
            ];
        }

        let sort = {};
        if (req.query.sort) {
            if (req.query.sort === 'course.name') {
                // Handle course name sorting separately
                sort = {}; // Will be handled after population
            } else {
                sort[req.query.sort] = req.query.order === 'desc' ? -1 : 1;
            }
        } else {
            sort.lessonDate = -1;
        }

        let lessons = await Lesson.find(filter)
            .populate('student', 'name')
            .populate('teacher', 'name')
            .populate('course', 'name')
            .sort(sort)
            .lean();

        // Handle course name sorting after population
        if (req.query.sort === 'course.name') {
            lessons.sort((a, b) => {
                const courseA = a.course ? a.course.name : '';
                const courseB = b.course ? b.course.name : '';
                if (req.query.order === 'desc') {
                    return courseB.localeCompare(courseA);
                } else {
                    return courseA.localeCompare(courseB);
                }
            });
        }

        const userTz = req.user.timeZone || 'Europe/Moscow';
        const lessonsWithLocalTime = lessons.map(lesson => ({
            ...lesson,
            localLessonDate: moment.tz(lesson.lessonDate, userTz).toDate()
        }));
        
        const allTeachers = await User.find({ role: 'teacher' }).sort({ name: 1 }).lean();
        const allStudents = await User.find({ role: 'student' }).sort({ name: 1 }).lean();

        res.render('admin/lessons', {
            layout: 'layouts/dashboard',
            user: req.user,
            lessons: lessonsWithLocalTime,
            teachers: allTeachers,
            students: allStudents,
            query: req.query,
            page_name: 'lessons'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/lessons/add', ensureAuth, ensureRole('admin'), async (req, res) => { try { const students = await User.find({ role: 'student', status: 'active' }).lean(); const teachers = await User.find({ role: 'teacher', status: 'active' }).lean(); const courses = await Course.find().lean(); res.render('admin/lesson_add', { layout: 'layouts/dashboard', user: req.user, students, teachers, courses, page_name: 'lessons' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.post('/lessons/add', ensureAuth, ensureRole('admin'), async (req, res) => {
    const { student, teacher, course, lessonDate, duration, topic } = req.body;
    if (!student || !teacher || !course || !lessonDate) {
        return res.redirect('/dashboard/lessons/add');
    }
    try {
        const adminTz = req.user.timeZone || 'Europe/Moscow';
        const lessonMoment = moment.tz(lessonDate, adminTz);
        const lessonDateUTC = lessonMoment.toDate();

        // Calculate lesson number for this student
        const completedLessonsCount = await Lesson.countDocuments({
            student: student,
            status: 'completed'
        });
        const lessonNumber = completedLessonsCount + 1;
        const defaultTopic = `Lesson ${lessonNumber}`;

        const newLesson = await Lesson.create({
            student,
            teacher,
            course,
            lessonDate: lessonDateUTC,
            duration: Number(duration),
            topic: topic || defaultTopic
        });
        await User.findByIdAndUpdate(student, { $inc: { lessonsPaid: -1 } });
        
        // Audit: lesson creation
        try {
            const { logEvent } = require('../services/auditService');
            const studentData = await User.findById(student).lean();
            const teacherData = await User.findById(teacher).lean();
            const courseData = await Course.findById(course).lean();
            await logEvent({
                tags: ['dashboard', 'lessons', 'create'],
                title: 'Lesson Created',
                lines: [
                    `Student: ${studentData?.name || 'Unknown'} (${student})`,
                    `Teacher: ${teacherData?.name || 'Unknown'} (${teacher})`,
                    `Course: ${courseData?.name || 'Unknown'} (${course})`,
                    `Date: ${lessonMoment.format('YYYY-MM-DD HH:mm')}`,
                    `Duration: ${duration} min`,
                    `Topic: ${topic || defaultTopic}`
                ],
                actor: req.user,
                ip: req.realIp,
                emoji: '📚'
            });
        } catch (e) { console.error('[audit] lesson create:', e.message); }
        
        res.redirect('/dashboard/lessons');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/lessons/add');
    }
});
router.get('/schedule', ensureAuth, ensureRole('teacher'), async (req, res) => {
    try {
        const lessons = await Lesson.find({ teacher: req.user.id })
            .populate('student', 'name')
            .populate('course', 'name')
            .sort({ lessonDate: -1 })
            .lean();
        
        const userTz = req.user.timeZone || 'Europe/Moscow';
        const lessonsWithLocalTime = lessons.map(lesson => ({
            ...lesson,
            localLessonDate: moment.tz(lesson.lessonDate, userTz).toDate()
        }));
        
        // Добавляем номера уроков для каждого ученика
        for (let lesson of lessonsWithLocalTime) {
            if (lesson.student && lesson.status === 'completed') {
                const completedLessons = await Lesson.find({
                    student: lesson.student._id,
                    status: 'completed'
                }).sort({ lessonDate: 1 }).lean();
                
                const lessonIndex = completedLessons.findIndex(l => String(l._id) === String(lesson._id));
                if (lessonIndex !== -1) {
                    lesson.lessonNumber = lessonIndex + 1;
                }
            }
        }
        
        res.render('teacher/schedule', {
            layout: 'layouts/dashboard',
            user: req.user,
            lessons: lessonsWithLocalTime,
            page_name: 'schedule'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/my-students', ensureAuth, ensureRole('teacher'), async (req, res) => { try { const teacher = await User.findById(req.user.id).populate('students'); res.render('teacher/my_students', { layout: 'layouts/dashboard', user: req.user, students: teacher.students, page_name: 'students' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/lessons/manage/:id', ensureAuth, async (req, res) => { try { const lesson = await Lesson.findById(req.params.id).populate('student', 'name').populate('course', 'name').lean(); if (!lesson) return res.status(404).send('Lesson not found'); if (req.user.role !== 'admin' && String(lesson.teacher) !== String(req.user.id)) { return res.status(403).send('Forbidden: You are not authorized to manage this lesson.'); } const userTimeZone = req.user.timeZone || 'Europe/Moscow'; lesson.localLessonDate = moment.tz(lesson.lessonDate, userTimeZone).toDate(); res.render('teacher/lesson_manage', { layout: 'layouts/dashboard', user: req.user, lesson: lesson, page_name: req.user.role === 'admin' ? 'lessons' : 'schedule' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
// @desc    Просмотр профиля ученика учителем
// @route   GET /dashboard/student/:id
router.get('/student/:id', ensureAuth, ensureRole('teacher'), async (req, res) => {
    try {
        const isMyStudent = req.user.students.some(studentId => studentId.toString() === req.params.id);
        if (!isMyStudent) return res.status(403).send('This is not your student.');

        const student = await User.findById(req.params.id).lean();
        const lessons = await Lesson.find({ student: req.params.id, teacher: req.user.id }).sort({ lessonDate: -1 }).lean();

        // Use teacher's timezone (viewer's timezone)
        const userTz = req.user.timeZone || 'Europe/Moscow';
        const lessonsWithLocalTime = lessons.map(lesson => ({
            ...lesson,
            localLessonDate: moment.tz(lesson.lessonDate, userTz).toDate()
        }));

        res.render('teacher/student_profile', {
            layout: 'layouts/dashboard',
            user: req.user,
            student: student,
            lessons: lessonsWithLocalTime,
            page_name: 'students'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// @desc    Обработка формы управления уроком (с файлами и проектами)
// @route   POST /lessons/manage/:id
router.post('/lessons/manage/:id', ensureAuth, upload, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).send('Lesson not found');
        if (req.user.role !== 'admin' && String(lesson.teacher) !== String(req.user.id)) { return res.status(403).send('Forbidden'); }

        const { status, topic, homework, recordingUrl, notes, score, comment, homeworkStatus, isProject, projectDetails, projectDefenseRecordingUrl } = req.body;
        const originalStatus = lesson.status;
        const originalTopic = lesson.topic;

        // Безопасное изменение статуса урока с управлением балансом
        const balanceResult = await LessonBalanceService.changeLessonStatus(
            req.params.id, 
            status, 
            originalStatus, 
            req.user
        );

        if (!balanceResult.success) {
            console.error('Balance change failed:', balanceResult.error);
            // Продолжаем выполнение, но логируем ошибку
        }

        lesson.status = status;
        lesson.topic = topic;
        lesson.homework = homework;
        lesson.recordingUrl = recordingUrl;
        lesson.notes = notes;
        if (homeworkStatus) lesson.homeworkStatus = homeworkStatus;

        lesson.isProject = !!isProject;
        if (lesson.isProject) {
            lesson.projectDetails = projectDetails;
            lesson.projectDefenseRecordingUrl = projectDefenseRecordingUrl;
        } else {
            lesson.projectDetails = undefined;
            lesson.projectDefenseRecordingUrl = undefined;
        }
        if (req.files && req.files.teacherAttachment) {
            lesson.teacherAttachment = { path: req.files.teacherAttachment[0].path, filename: req.files.teacherAttachment[0].originalname };
        }
        if (score) {
            const maxScore = lesson.isProject ? 25 : 10;
            const finalScore = Math.min(Number(score), maxScore);

            await Grade.findOneAndUpdate(
                { lesson: lesson._id },
                { 
                    lesson: lesson._id,
                    student: lesson.student,
                    teacher: lesson.teacher,
                    score: finalScore,
                    comment: comment,
                    isProjectGrade: lesson.isProject
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            // Award stars equal to the grade score
            const starsToAward = finalScore;
            const student = await User.findById(lesson.student);
            if (student) {
                // Check if grade stars were already awarded for this specific lesson
                const existingGradeEntry = student.balanceHistory.find(entry => 
                    entry.reason && entry.reason.includes('lesson grade') && 
                    entry.reason.includes(`(ID: ${lesson._id})`)
                );
                
                if (existingGradeEntry) {
                    // Update existing grade entry
                    const starsDifference = starsToAward - existingGradeEntry.change;
                    const newStarsBalance = (student.stars || 0) + starsDifference;
                    student.stars = Math.max(0, newStarsBalance); // Prevent negative stars
                    
                    // Update the existing entry
                    existingGradeEntry.change = starsToAward;
                    existingGradeEntry.starsBalanceAfter = Number(student.stars);
                    existingGradeEntry.reason = `Stars earned for lesson grade: ${finalScore}/${maxScore} (ID: ${lesson._id})`;
                    existingGradeEntry.date = new Date();
                } else {
                    // Create new grade entry
                    const newStarsBalance = (student.stars || 0) + starsToAward;
                    student.stars = newStarsBalance;
                    
                    student.balanceHistory.push({
                        date: new Date(),
                        change: starsToAward,
                        starsBalanceAfter: Number(newStarsBalance),
                        lessonsBalanceAfter: Number(student.lessonsPaid || 0),
                        reason: `Stars earned for lesson grade: ${finalScore}/${maxScore} (ID: ${lesson._id})`,
                        isStarAdjustment: true
                    });
                }
                
                await student.save();
            }
        }

        // Stars are now only awarded through grading, not for lesson completion

        await lesson.save();
        
        // Audit: lesson update
        try {
            const { logEvent } = require('../services/auditService');
            const studentData = await User.findById(lesson.student).lean();
            const teacherData = await User.findById(lesson.teacher).lean();
            const courseData = await Course.findById(lesson.course).lean();
            
            const changes = [];
            if (originalStatus !== status) changes.push(`Status: ${originalStatus} → ${status}`);
            if (originalTopic !== topic) changes.push(`Topic: "${originalTopic}" → "${topic}"`);
            if (homework) changes.push(`Homework: ${homework.substring(0, 50)}${homework.length > 50 ? '...' : ''}`);
            if (recordingUrl) changes.push(`Recording: ${recordingUrl}`);
            if (notes) changes.push(`Notes: ${notes.substring(0, 50)}${notes.length > 50 ? '...' : ''}`);
            if (score) changes.push(`Score: ${score}/${lesson.isProject ? 25 : 10}`);
            if (isProject) changes.push(`Project: ${projectDetails ? 'Yes' : 'No'}`);
            if (balanceResult.balanceChange !== 0) {
                changes.push(`Balance: ${balanceResult.balanceChange > 0 ? '+' : ''}${balanceResult.balanceChange} (New: ${balanceResult.newBalance})`);
            }
            
            if (changes.length > 0) {
                await logEvent({
                    tags: ['dashboard', 'lessons', 'update'],
                    title: 'Lesson Updated',
                    lines: [
                        `Student: ${studentData?.name || 'Unknown'} (${lesson.student})`,
                        `Teacher: ${teacherData?.name || 'Unknown'} (${lesson.teacher})`,
                        `Course: ${courseData?.name || 'Unknown'} (${lesson.course})`,
                        `Changes: ${changes.join(', ')}`
                    ],
                    actor: req.user,
                    ip: req.realIp,
                    emoji: '📝'
                });
            }
        } catch (e) { console.error('[audit] lesson update:', e.message); }
        
        res.redirect(req.user.role === 'admin' ? '/dashboard/lessons' : '/dashboard/schedule');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.post('/lessons/submit-hw/:id', ensureAuth, ensureRole('student'), upload, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson || String(lesson.student) !== String(req.user.id)) return res.status(403).send('Forbidden');

        if (req.files && req.files.studentAttachment) {
            lesson.studentAttachment = {
                path: req.files.studentAttachment[0].path,
                filename: req.files.studentAttachment[0].originalname
            };
            lesson.homeworkStatus = 'submitted';
            await lesson.save();
        }
        res.redirect(`/dashboard/lessons/view/${lesson._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// @desc    Удаление прикрепленного файла
// @route   GET /dashboard/lessons/delete-attachment/:lessonId/:userType
router.get('/lessons/delete-attachment/:lessonId/:userType', ensureAuth, async (req, res) => {
    try {
        const { lessonId, userType } = req.params;
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) return res.status(404).send('Not found');

        let fieldToClear = '';
        let attachmentPath = '';

        if (userType === 'teacher' && (req.user.role === 'admin' || String(lesson.teacher) === String(req.user.id))) {
            fieldToClear = 'teacherAttachment';
            attachmentPath = lesson.teacherAttachment.path;
        } else if (userType === 'student' && String(lesson.student) === String(req.user.id)) {
            fieldToClear = 'studentAttachment';
            attachmentPath = lesson.studentAttachment.path;
            lesson.homeworkStatus = 'pending';
        } else {
            return res.status(403).send('Forbidden');
        }

        if (attachmentPath && fs.existsSync(attachmentPath)) {
            fs.unlinkSync(attachmentPath);
        }

        lesson[fieldToClear] = { path: undefined, filename: undefined };
        await lesson.save();

        if (req.user.role === 'student') {
            res.redirect(`/dashboard/lessons/view/${lessonId}`);
        } else {
            res.redirect(`/dashboard/lessons/manage/${lessonId}`);
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/my-lessons', ensureAuth, ensureRole('student'), async (req, res) => {
    try {
        const lessons = await Lesson.find({ student: req.user.id }).populate('teacher', 'name').populate('course', 'name').sort({ lessonDate: 1 }).lean();
        
        const payments = await Payment.find({ userId: req.user.id, status: 'completed' }).sort({ createdAt: -1 }).lean();

        const userTz = req.user.timeZone || 'Europe/Moscow';
        
        // Добавляем номер урока для проведенных уроков
        let completedLessonNumber = 0;
        const lessonsWithLocalTime = lessons.map(lesson => {
            const lessonWithTime = { ...lesson, localLessonDate: moment.tz(lesson.lessonDate, userTz).toDate() };
            
            // Увеличиваем счетчик только для проведенных уроков
            if (lesson.status === 'completed') {
                completedLessonNumber++;
                lessonWithTime.lessonNumber = completedLessonNumber;
            }
            
            return lessonWithTime;
        });
        
        // Сортируем обратно по убыванию даты для отображения
        lessonsWithLocalTime.sort((a, b) => new Date(b.lessonDate) - new Date(a.lessonDate));

        res.render('student/my_lessons', {
            layout: 'layouts/dashboard',
            user: req.user,
            lessons: lessonsWithLocalTime,
            payments: payments,
            page_name: 'my-lessons'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.post('/lessons/cancel/:id', ensureAuth, ensureRole('student'), async (req, res) => { 
    try { 
        const lesson = await Lesson.findById(req.params.id); 
        if (!lesson) { 
            return res.status(404).send('Lesson not found.'); 
        } 
        if (String(lesson.student) !== String(req.user.id)) { 
            return res.status(403).send('Forbidden.'); 
        } 
        if (lesson.status !== 'scheduled') { 
            return res.status(400).send('This lesson cannot be cancelled.'); 
        } 
        // Безопасная отмена урока студентом
        const balanceResult = await LessonBalanceService.changeLessonStatus(
            req.params.id,
            'cancelled_by_student',
            lesson.status,
            req.user
        );

        if (!balanceResult.success) {
            console.error('Balance change failed during cancellation:', balanceResult.error);
            // Продолжаем выполнение даже при ошибке баланса
        }

        await Lesson.findByIdAndUpdate(req.params.id, { 
            status: 'cancelled_by_student', 
            cancellationReason: req.body.reason || 'Cancelled by student' 
        });
        
        // Audit: lesson cancellation by student
        try {
            const { logEvent } = require('../services/auditService');
            const teacherData = await User.findById(lesson.teacher).lean();
            const courseData = await Course.findById(lesson.course).lean();
            await logEvent({
                tags: ['dashboard', 'lessons', 'cancel', 'student'],
                title: 'Lesson Cancelled by Student',
                lines: [
                    `Student: ${req.user.name} (${req.user._id})`,
                    `Teacher: ${teacherData?.name || 'Unknown'} (${lesson.teacher})`,
                    `Course: ${courseData?.name || 'Unknown'} (${lesson.course})`,
                    `Date: ${lesson.lessonDate.toISOString()}`,
                    `Reason: ${req.body.reason || 'Cancelled by student'}`,
                    `Balance Change: ${balanceResult.balanceChange > 0 ? '+' : ''}${balanceResult.balanceChange} (New: ${balanceResult.newBalance})`
                ],
                actor: req.user,
                ip: req.realIp,
                emoji: '❌'
            });
        } catch (e) { console.error('[audit] lesson cancel student:', e.message); }
        
        res.redirect('/dashboard/my-lessons');
    } catch (err) { 
        console.error(err); 
        res.status(500).send('Server Error'); 
    } 
});
router.get('/lessons/view/:id', ensureAuth, ensureRole('student'), async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('teacher', 'name').populate('course', 'name').lean();
        if (!lesson) return res.status(404).send('Lesson not found');
        if (String(lesson.student) !== String(req.user.id)) return res.status(403).send('Forbidden');

        const grade = await Grade.findOne({ lesson: lesson._id }).lean();

        // Convert lesson date to user's local time
        const userTimeZone = req.user.timeZone || 'Europe/Moscow';
        lesson.localLessonDate = moment.tz(lesson.lessonDate, userTimeZone).toDate();

        // Add lesson number for completed lessons
        if (lesson.status === 'completed') {
            const completedLessons = await Lesson.find({
                student: req.user.id,
                status: 'completed'
            }).sort({ lessonDate: 1 }).lean();
            
            const lessonIndex = completedLessons.findIndex(l => String(l._id) === String(lesson._id));
            if (lessonIndex !== -1) {
                lesson.lessonNumber = lessonIndex + 1;
            }
        }

        res.render('student/lesson_view', {
            layout: 'layouts/dashboard',
            user: req.user,
            lesson: lesson,
            grade: grade,
            page_name: 'my-lessons'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// @desc    Универсальный маршрут для просмотра профиля пользователя
// @route   GET /dashboard/user-profile/:id
router.get('/user-profile/:id', ensureAuth, async (req, res) => {
    // Если учитель пытается открыть профиль ученика, перенаправляем на student/:id
    if (req.user.role === 'teacher') {
        const targetUser = await User.findById(req.params.id).lean();
        if (targetUser && targetUser.role === 'student') {
            // Проверяем, является ли этот ученик студентом данного учителя
            const isMyStudent = req.user.students.some(studentId => studentId.toString() === req.params.id);
            if (isMyStudent) {
                return res.redirect(`/dashboard/student/${req.params.id}`);
            } else {
                return res.status(403).send('Access denied: This is not your student.');
            }
        }
        return res.status(403).send('Access denied.');
    }
    
    // Только админы могут использовать этот маршрут напрямую
    if (req.user.role !== 'admin') {
        return res.status(403).send('Access denied.');
    }
    try {
        const userProfile = await User.findById(req.params.id).lean();
        if (!userProfile) return res.status(404).send('User not found');
        

        let lessons = [];
        const lessonQuery = {};
        if (userProfile.role === 'student') {
            lessonQuery.student = userProfile._id;
        } else if (userProfile.role === 'teacher') {
            lessonQuery.teacher = userProfile._id;
        }
        
        if (userProfile.role !== 'admin') {
            lessons = await Lesson.find(lessonQuery)
                .populate('teacher', 'name')
                .populate('student', 'name')
                .sort({ lessonDate: -1 })
                .lean();
            
            // Convert lesson dates to viewer's timezone
            const userTimeZone = req.user.timeZone || 'Europe/Moscow';
            lessons.forEach(lesson => {
                // Конвертируем в нужный часовой пояс и создаем объект Date
                const momentInTz = moment.utc(lesson.lessonDate).tz(userTimeZone);
                lesson.localLessonDate = momentInTz.toDate();
            });
        }

        res.render('admin/user_profile', {
            layout: 'layouts/dashboard',
            user: req.user,
            userProfile: userProfile,
            lessons: lessons,
            page_name: 'users',
            scripts: ['/js/user_profile.js'] 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// @desc    ОТОБРАЖЕНИЕ страницы настроек
// @route   GET /dashboard/settings
router.get('/settings', ensureAuth, (req, res) => {
    res.render('settings', {
        layout: 'layouts/dashboard',
        user: req.user,
        page_name: 'settings',
        timeZones: (() => {
    const zones = moment.tz.names()
      .filter(tz => tz.includes('/'))
      .map(tz => {
        const offset = moment.tz(tz).utcOffset();
        const hours = Math.floor(offset / 60);
        const minutes = Math.abs(offset % 60);
        let offsetStr = (offset >= 0 ? '+' : '-') + Math.abs(hours);
        if (minutes) offsetStr += `:${minutes.toString().padStart(2, '0')}`;
        return { value: tz, label: `${tz} (UTC${offsetStr})`, offset };
      });
    const grouped = zones.reduce((acc, zone) => {
      const groupKey = zone.offset;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(zone);
      return acc;
    }, {});
    return Object.keys(grouped).sort((a, b) => Number(a) - Number(b)).map(offset => {
        const hours = Math.floor(Number(offset) / 60);
        const minutes = Math.abs(Number(offset) % 60);
        let offsetStr = (Number(offset) >= 0 ? '+' : '-') + Math.abs(hours);
        if (minutes) offsetStr += `:${minutes.toString().padStart(2, '0')}`;
        return {
          offset: Number(offset),
          label: `UTC ${offsetStr}`,
          zones: grouped[offset].sort((a, b) => a.value.localeCompare(b.value))
        };
      });
  })()
    });
});

// @desc    ОБРАБОТКА формы настроек
// @route   POST /dashboard/settings
router.post('/settings', ensureAuth, async (req, res) => {
    try {
        const { name, password, telegramChatId, timeZone } = req.body;
        const receiveReminders = !!req.body['notifications[lessonReminders]'];

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.redirect('/settings');
        }

        user.name = name;
        user.telegramChatId = telegramChatId;
        user.notifications.lessonReminders = receiveReminders;
        user.timeZone = timeZone || user.timeZone;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.redirect('/dashboard/settings');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/settings');
    }
});
// @desc    Страница финансовой аналитики
// @route   GET /dashboard/analytics
router.get('/analytics', ensureAuth, ensureRole('admin'), (req, res) => {
    res.render('admin/analytics', {
        layout: 'layouts/dashboard',
        user: req.user,
        page_name: 'analytics'
    });
});
// @desc    Ручная корректировка баланса
// @route   POST /dashboard/user-profile/:id/adjust-balance
router.post('/user-profile/:id/adjust-balance', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { adjustment, reason } = req.body;
        const amount = parseInt(adjustment, 10);

        if (!amount || !reason) {
            return res.redirect(`/dashboard/user-profile/${req.params.id}`);
        }

        const user = await User.findById(req.params.id);
        const newBalance = user.lessonsPaid + amount;

        user.lessonsPaid = newBalance;
        
        // Сбросить флаги уведомлений о низком балансе при увеличении баланса
        if (amount > 0) {
            user.balanceReminders = {
                twoLessonsRemaining: false,
                oneLessonRemaining: false
            };
        }
        
        user.balanceHistory.push({
            change: amount,
            balanceAfter: newBalance,
            lessonsBalanceAfter: user.lessonsPaid,
            reason: `Manual Correction: ${reason}`,
            transactionType: 'Manual Correction'
        });
        await user.save();

        res.redirect(`/dashboard/user-profile/${req.params.id}`);

    } catch (err) {
        console.error(err);
        res.redirect(`/dashboard/user-profile/${req.params.id}`);
    }
});
router.post('/users/add', ensureAuth, ensureRole('admin'), async (req, res) => {
    const { name, email, password, role, contact, lessonsPaid, stars } = req.body;
    
    if (!name || !email || !password || !role) {
        return res.redirect('/dashboard/users/add');
    }
    
    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.redirect('/dashboard/users/add');
        }
        
        const getRandomEmoji = () => {
            const ranges = [[0x1F600, 0x1F64F], [0x2700, 0x27BF], [0x1F300, 0x1F5FF]];
            let emoji;
            do {
                const [min, max] = ranges[Math.floor(Math.random() * ranges.length)];
                emoji = String.fromCodePoint(Math.floor(Math.random() * (max - min + 1)) + min);
            } while (!/[\p{Emoji}]/gu.test(emoji));
            return emoji;
        };

        let randomEmoji;
        let isUnique = false;
        let attempts = 0;
        const usedEmojis = await User.find({ emojiAvatar: { $ne: null } }).distinct('emojiAvatar');
        
        while (!isUnique && attempts < 100) {
            randomEmoji = getRandomEmoji();
            if (!usedEmojis.includes(randomEmoji)) {
                isUnique = true;
            }
            attempts++;
        }
        if (!isUnique) randomEmoji = '🤖';


        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            role,
            contact,
            lessonsPaid: role === 'student' ? Number(lessonsPaid) || 0 : 0,
            stars: role === 'student' ? Number(stars) || 0 : 0,
            emojiAvatar: randomEmoji
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        
        const savedUser = await newUser.save();

        // Notify admins about new user creation by admin
        const adminMessage = `🆕 *New User Created by Admin*\n\n` +
            `👤 *Name:* ${savedUser.name}\n` +
            `📧 *Email:* ${savedUser.email}\n` +
            `👥 *Role:* ${savedUser.role}\n` +
            `📱 *Contact:* ${savedUser.contact || 'Not specified'}\n` +
            `💰 *Lessons Paid:* ${savedUser.lessonsPaid}\n` +
            `⭐ *Stars:* ${savedUser.stars || 0}\n` +
            `🕒 *Creation Date:* ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })}\n` +
            `👨‍💼 *Created by Admin:* ${req.user.name}`;
        
        try {
            await notifyAllAdmins(adminMessage);
        } catch (error) {
            console.error('Failed to send admin notification for user creation:', error);
        }

        res.redirect('/dashboard/users');

    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/users/add');
    }
});
// @desc    Admin adjusts student's stars balance
// @route   POST /dashboard/user-profile/:id/adjust-stars
router.post('/user-profile/:id/adjust-stars', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { starsAdjustment, adjustmentReason } = req.body;
        const stars = parseInt(starsAdjustment, 10);

        if (!stars || !adjustmentReason) {
            req.flash('error_msg', 'Please fill in all fields.');
            return res.redirect(`/dashboard/user-profile/${req.params.id}`);
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/dashboard/users');
        }

        const newStarsBalance = (user.stars || 0) + stars;
        user.stars = newStarsBalance;

        // Optionally, keep a history of star adjustments if needed
        // This could be a new field in the User model or part of balanceHistory
        user.balanceHistory.push({
            date: new Date(),
            change: stars,
            starsBalanceAfter: Number(newStarsBalance),
            lessonsBalanceAfter: Number(user.lessonsPaid || 0),
            reason: `Stars Adjustment: ${adjustmentReason}`,
            isStarAdjustment: true
        });

        await user.save();

        req.flash('success_msg', 'Stars balance updated successfully.');
        res.redirect(`/dashboard/user-profile/${req.params.id}`);

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'An error occurred while adjusting stars.');
        res.redirect('/dashboard');
    }
});

// @desc    Admin adjusts student's paid lessons balance
// @route   POST /dashboard/user-profile/:id/adjust-lessons
router.post('/user-profile/:id/adjust-lessons', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { lessonsAdjustment, adjustmentReason } = req.body;
        const lessons = parseInt(lessonsAdjustment, 10);

        if (!lessons || !adjustmentReason) {
            req.flash('error_msg', 'Please fill in all fields.');
            return res.redirect(`/dashboard/user-profile/${req.params.id}`);
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/dashboard/users');
        }

        const newLessonsPaidBalance = (user.lessonsPaid || 0) + lessons;
        user.lessonsPaid = newLessonsPaidBalance;

        user.balanceHistory.push({
            date: new Date(),
            change: lessons,
            starsBalanceAfter: Number(user.stars || 0),
            lessonsBalanceAfter: Number(newLessonsPaidBalance),
            reason: `Paid Lessons Adjustment: ${adjustmentReason}`,
            isStarAdjustment: false
        });

        await user.save();

        req.flash('success_msg', 'Paid lessons balance updated successfully.');
        res.redirect(`/dashboard/user-profile/${req.params.id}`);

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'An error occurred while adjusting paid lessons.');
        res.redirect('/dashboard');
    }
});


router.get('/progress', ensureAuth, ensureRole('student'), async (req, res) => {
    try {
        res.render('student/progress', {
            layout: 'layouts/dashboard',
            user: req.user,
            page_name: 'progress'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
router.get('/payments', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { status, search, period, user, amountMin, amountMax } = req.query;
        let filter = {};
        
        // Status filter
        if (status) filter.status = status;
        
        // User filter
        if (user) filter.userId = user;
        
        // Amount range filter
        if (amountMin || amountMax) {
            filter.amount = {};
            if (amountMin) filter.amount.$gte = parseFloat(amountMin);
            if (amountMax) filter.amount.$lte = parseFloat(amountMax);
        }
        
        // Period filter
        if (period) {
            const now = new Date();
            let startDate, endDate;
            
            switch (period) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    endDate = now;
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    break;
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    endDate = new Date(now.getFullYear(), quarter * 3 + 3, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear() + 1, 0, 1);
                    break;
                case 'custom':
                    if (req.query.dateFrom) startDate = new Date(req.query.dateFrom);
                    if (req.query.dateTo) {
                        endDate = new Date(req.query.dateTo);
                        endDate.setDate(endDate.getDate() + 1); // Include the end date
                    }
                    break;
            }
            
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = startDate;
                if (endDate) filter.createdAt.$lt = endDate;
            }
        }

        let sort = {};
        if (req.query.sort) {
            if (req.query.sort === 'userId') {
                // Handle user sorting separately after population
                sort = {};
            } else {
                sort[req.query.sort] = req.query.order === 'desc' ? -1 : 1;
            }
        } else {
            sort.createdAt = -1;
        }

        let payments = await Payment.find(filter)
            .populate('userId', 'name email')
            .sort(sort)
            .lean();
        
        // Handle user name sorting after population
        if (req.query.sort === 'userId') {
            payments.sort((a, b) => {
                const nameA = a.userId ? a.userId.name : '';
                const nameB = b.userId ? b.userId.name : '';
                if (req.query.order === 'desc') {
                    return nameB.localeCompare(nameA);
                } else {
                    return nameA.localeCompare(nameB);
                }
            });
        }
        
        // Search filter (applied after population)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            payments = payments.filter(payment => {
                return (
                    (payment.userId && payment.userId.name && searchRegex.test(payment.userId.name)) ||
                    (payment.userId && payment.userId.email && searchRegex.test(payment.userId.email)) ||
                    (payment.paymentId && searchRegex.test(payment.paymentId)) ||
                    (payment.status && searchRegex.test(payment.status)) ||
                    (payment.amount && searchRegex.test(payment.amount.toString())) ||
                    (payment.currency && searchRegex.test(payment.currency))
                );
            });
        }
        
        // Get all users for filter dropdown
        const allUsers = await User.find({ role: 'student' }).sort({ name: 1 }).lean();

        res.render('admin/payments', {
            layout: 'layouts/dashboard',
            user: req.user,
            payments: payments,
            allUsers: allUsers,
            query: req.query,
            page_name: 'payments'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Update lesson status
// @route   POST /dashboard/lessons/:id/status
router.post('/lessons/:id/status', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { status: newStatus } = req.body;
        
        // Получаем урок с текущим статусом
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found' });
        }
        
        const oldStatus = lesson.status;
        
        // Используем LessonBalanceService для правильного управления балансом
        const LessonBalanceService = require('../services/lessonBalanceService');
        const balanceResult = await LessonBalanceService.changeLessonStatus(
            req.params.id,
            newStatus,
            oldStatus,
            req.user
        );
        
        if (!balanceResult.success) {
            console.error('Balance change failed:', balanceResult.error);
            return res.status(500).json({ success: false, message: 'Failed to update balance: ' + balanceResult.error });
        }
        
        // Обновляем статус урока
        lesson.status = newStatus;
        await lesson.save();
        
        if (req.headers['content-type'] === 'application/json') {
            res.json({ 
                success: true, 
                message: 'Status updated successfully',
                balanceChange: balanceResult.balanceChange,
                newBalance: balanceResult.newBalance
            });
        } else {
            res.redirect('/dashboard/lessons');
        }
    } catch (error) {
        console.error('Error updating lesson status:', error);
        if (req.headers['content-type'] === 'application/json') {
            res.status(500).json({ success: false, message: 'Server error' });
        } else {
            res.status(500).send('Server error');
        }
    }
});

// @desc    Edit payment
// @route   GET /admin/payments/:id/edit
router.get('/payments/:id/edit', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('userId', 'name email').lean();
        if (!payment) {
            return res.status(404).send('Payment not found');
        }
        
        res.render('admin/payment_edit', {
            layout: 'layouts/dashboard',
            user: req.user,
            payment: payment,
            page_name: 'payments'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Update payment
// @route   PUT /dashboard/payments/:id
router.put('/payments/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { 
            amountPaid, 
            currency, 
            lessonsPurchased, 
            paymentSystem, 
            transactionType, 
            status, 
            pendingIdentifier, 
            description 
        } = req.body;
        
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }
        
        // Update payment fields
        if (amountPaid !== undefined) payment.amountPaid = parseFloat(amountPaid);
        if (currency) payment.currency = currency;
        if (lessonsPurchased !== undefined) payment.lessonsPurchased = parseInt(lessonsPurchased);
        if (paymentSystem) payment.paymentSystem = paymentSystem;
        if (transactionType) payment.transactionType = transactionType;
        if (status) payment.status = status;
        if (pendingIdentifier !== undefined) payment.pendingIdentifier = pendingIdentifier;
        if (description !== undefined) payment.notes = description;
        
        // Recalculate price per lesson
        if (lessonsPurchased > 0 && amountPaid > 0) {
            payment.pricePerLesson = parseFloat(amountPaid) / parseInt(lessonsPurchased);
        }
        
        payment.updatedAt = new Date();
        await payment.save();
        
        res.json({ success: true, message: 'Payment updated successfully' });
    } catch (err) {
        console.error('Error updating payment:', err);
        res.status(500).json({ success: false, message: 'Server error while updating payment' });
    }
});

// @desc    Delete payment
// @route   DELETE /dashboard/payments/:id
router.delete('/payments/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) {
            return res.status(404).send('Payment not found');
        }
        
        await Payment.findByIdAndDelete(req.params.id);
        
        res.redirect('/dashboard/payments');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @desc    Delete lesson
// @route   DELETE /dashboard/lessons/:id
router.delete('/lessons/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).send('Lesson not found');
        }
        
        // Always return lesson to balance when deleting
        await User.findByIdAndUpdate(lesson.student, { $inc: { lessonsPaid: 1 } });
        
        // Audit: lesson deletion
        try {
            const { logEvent } = require('../services/auditService');
            const studentData = await User.findById(lesson.student).lean();
            const teacherData = await User.findById(lesson.teacher).lean();
            const courseData = await Course.findById(lesson.course).lean();
            await logEvent({
                tags: ['dashboard', 'lessons', 'delete'],
                title: 'Lesson Deleted',
                lines: [
                    `Student: ${studentData?.name || 'Unknown'} (${lesson.student})`,
                    `Teacher: ${teacherData?.name || 'Unknown'} (${lesson.teacher})`,
                    `Course: ${courseData?.name || 'Unknown'} (${lesson.course})`,
                    `Date: ${lesson.lessonDate.toISOString()}`,
                    `Topic: ${lesson.topic || 'No topic'}`,
                    `Status: ${lesson.status}`
                ],
                actor: req.user,
                ip: req.realIp,
                emoji: '🗑️'
            });
        } catch (e) { console.error('[audit] lesson delete:', e.message); }
        
        await Lesson.findByIdAndDelete(req.params.id);
        
        if (req.headers['content-type'] === 'application/json') {
            res.json({ success: true, message: 'Lesson deleted successfully' });
        } else {
            res.redirect('/dashboard/lessons');
        }
    } catch (err) {
        console.error(err);
        if (req.headers['content-type'] === 'application/json') {
            res.status(500).json({ success: false, message: 'Server error' });
        } else {
            res.status(500).send('Server Error');
        }
    }
});

module.exports = router;