const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ensureAuth, ensureRole } = require('../middleware/auth');
const fs = require('fs');

const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const upload = require('../middleware/upload');

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

            stats = {
                lessonsThisWeek: await Lesson.countDocuments({ teacher: req.user.id, lessonDate: { $gte: startOfWeek, $lt: endOfWeek } }),
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

// @desc    Страница управления пользователями (с фильтрацией)
// @route   GET /dashboard/users
router.get('/users', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { role, status } = req.query;
        const filter = {};

        if (role) {
            filter.role = role;
        }
        if (status) {
            filter.status = status;
        }

        const users = await User.find(filter).sort({ name: 1 }).lean();

        res.render('admin/users', {
            layout: 'layouts/dashboard',
            user: req.user,
            users: users,
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
router.get('/users/edit/:id', ensureAuth, ensureRole('admin'), async (req, res) => { try { const userToEdit = await User.findById(req.params.id).lean(); if (!userToEdit) return res.status(404).send('User not found'); const teachers = await User.find({ role: 'teacher' }).lean(); res.render('admin/user_edit', { layout: 'layouts/dashboard', user: req.user, userToEdit: userToEdit, teachers: teachers, page_name: 'users' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.post('/users/edit/:id', ensureAuth, ensureRole('admin'), async (req, res) => { try { const userId = req.params.id; const { name, email, role, contact, lessonsPaid, status, teacher: newTeacherId } = req.body; const userToUpdate = await User.findById(userId); if (!userToUpdate) return res.status(404).send('User not found'); const oldTeacherId = userToUpdate.teacher ? String(userToUpdate.teacher) : null; const newTeacherIdStr = newTeacherId || null; if (oldTeacherId !== newTeacherIdStr) { if (oldTeacherId) { await User.updateOne({ _id: oldTeacherId }, { $pull: { students: userId } }); } if (newTeacherIdStr && role === 'student') { await User.updateOne({ _id: newTeacherIdStr }, { $addToSet: { students: userId } }); } } userToUpdate.name = name; userToUpdate.email = email.toLowerCase(); userToUpdate.contact = contact; userToUpdate.status = status; if (userToUpdate.role !== 'student' && role === 'student') { userToUpdate.teacher = newTeacherIdStr; } else if (userToUpdate.role === 'student' && role !== 'student') { if(oldTeacherId) { await User.updateOne({ _id: oldTeacherId }, { $pull: { students: userId } }); } userToUpdate.teacher = null; } userToUpdate.role = role; if (role === 'student') { userToUpdate.lessonsPaid = Number(lessonsPaid); userToUpdate.teacher = newTeacherIdStr; } else { userToUpdate.lessonsPaid = 0; userToUpdate.teacher = null; } if (req.body.password) { const salt = await bcrypt.genSalt(10); userToUpdate.password = await bcrypt.hash(req.body.password, salt); } await userToUpdate.save(); res.redirect('/dashboard/users'); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/users/delete/:id', ensureAuth, ensureRole('admin'), async (req, res) => { try { await User.findByIdAndDelete(req.params.id); res.redirect('/dashboard/users'); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });

// @desc    Страница просмотра всех уроков (с фильтрацией)
// @route   GET /dashboard/lessons
router.get('/lessons', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const { teacher, student, status } = req.query;
        const filter = {};

        if (teacher) filter.teacher = teacher;
        if (student) filter.student = student;
        if (status) filter.status = status;

        const lessons = await Lesson.find(filter)
            .populate('student', 'name')
            .populate('teacher', 'name')
            .populate('course', 'name')
            .sort({ lessonDate: -1 })
            .lean();
        
        const allTeachers = await User.find({ role: 'teacher' }).sort({ name: 1 }).lean();
        const allStudents = await User.find({ role: 'student' }).sort({ name: 1 }).lean();

        res.render('admin/lessons', {
            layout: 'layouts/dashboard',
            user: req.user,
            lessons: lessons,
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
router.post('/lessons/add', ensureAuth, ensureRole('admin'), async (req, res) => { const { student, teacher, course, lessonDate, duration, topic } = req.body; if (!student || !teacher || !course || !lessonDate) return res.status(400).send('Please fill all required fields.'); try { await Lesson.create({ student, teacher, course, lessonDate, duration: Number(duration), topic: topic || 'Scheduled Lesson' }); await User.findByIdAndUpdate(student, { $inc: { lessonsPaid: -1 } }); res.redirect('/dashboard/lessons'); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/schedule', ensureAuth, ensureRole('teacher'), async (req, res) => { try { const lessons = await Lesson.find({ teacher: req.user.id }).populate('student', 'name').populate('course', 'name').sort({ lessonDate: -1 }).lean(); res.render('teacher/schedule', { layout: 'layouts/dashboard', user: req.user, lessons: lessons, page_name: 'schedule' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/my-students', ensureAuth, ensureRole('teacher'), async (req, res) => { try { const teacher = await User.findById(req.user.id).populate('students'); res.render('teacher/my_students', { layout: 'layouts/dashboard', user: req.user, students: teacher.students, page_name: 'students' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/lessons/manage/:id', ensureAuth, async (req, res) => { try { const lesson = await Lesson.findById(req.params.id).populate('student', 'name').populate('course', 'name').lean(); if (!lesson) return res.status(404).send('Lesson not found'); if (req.user.role !== 'admin' && String(lesson.teacher) !== String(req.user.id)) { return res.status(403).send('Forbidden: You are not authorized to manage this lesson.'); } res.render('teacher/lesson_manage', { layout: 'layouts/dashboard', user: req.user, lesson: lesson, page_name: req.user.role === 'admin' ? 'lessons' : 'schedule' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
// @desc    Просмотр профиля ученика учителем
// @route   GET /dashboard/student/:id
router.get('/student/:id', ensureAuth, ensureRole('teacher'), async (req, res) => {
    try {
        const isMyStudent = req.user.students.some(studentId => studentId.toString() === req.params.id);
        if (!isMyStudent) return res.status(403).send('This is not your student.');

        const student = await User.findById(req.params.id).lean();
        const lessons = await Lesson.find({ student: req.params.id, teacher: req.user.id }).sort({ lessonDate: -1 }).lean();

        res.render('teacher/student_profile', {
            layout: 'layouts/dashboard',
            user: req.user,
            student: student,
            lessons: lessons,
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

        if (originalStatus === 'scheduled' && (status === 'cancelled_by_teacher' || status === 'cancelled_by_student')) {
            await User.findByIdAndUpdate(lesson.student, { $inc: { lessonsPaid: 1 } });
        } else if (originalStatus !== 'scheduled' && status === 'scheduled') {
            await User.findByIdAndUpdate(lesson.student, { $inc: { lessonsPaid: -1 } });
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
        }

        await lesson.save();
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
router.get('/my-lessons', ensureAuth, ensureRole('student'), async (req, res) => { try { const lessons = await Lesson.find({ student: req.user.id }).populate('teacher', 'name').populate('course', 'name').sort({ lessonDate: -1 }).lean(); res.render('student/my_lessons', { layout: 'layouts/dashboard', user: req.user, lessons: lessons, page_name: 'my-lessons' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.post('/lessons/cancel/:id', ensureAuth, ensureRole('student'), async (req, res) => { try { const lesson = await Lesson.findById(req.params.id); if (!lesson) { return res.status(404).send('Lesson not found.'); } if (String(lesson.student) !== String(req.user.id)) { return res.status(403).send('Forbidden.'); } if (lesson.status !== 'scheduled') { return res.status(400).send('This lesson cannot be cancelled.'); } await Lesson.findByIdAndUpdate(req.params.id, { status: 'cancelled_by_student', cancellationReason: req.body.reason || 'Cancelled by student' }); await User.findByIdAndUpdate(req.user.id, { $inc: { lessonsPaid: 1 } }); res.redirect('/dashboard/my-lessons'); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/lessons/view/:id', ensureAuth, ensureRole('student'), async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('teacher', 'name').populate('course', 'name').lean();
        if (!lesson) return res.status(404).send('Lesson not found');
        if (String(lesson.student) !== String(req.user.id)) return res.status(403).send('Forbidden');

        const grade = await Grade.findOne({ lesson: lesson._id }).lean();

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
// @desc    Просмотр профиля любого пользователя админом
// @route   GET /dashboard/user-profile/:id
router.get('/user-profile/:id', ensureAuth, ensureRole('admin'), async (req, res) => {
    try {
        const userProfile = await User.findById(req.params.id).lean();
        if (!userProfile) return res.status(404).send('User not found');

        let lessons = [];
        if (userProfile.role === 'student') {
            lessons = await Lesson.find({ student: userProfile._id }).populate('teacher', 'name').sort({ lessonDate: -1 }).lean();
        } else if (userProfile.role === 'teacher') {
            lessons = await Lesson.find({ teacher: userProfile._id }).populate('student', 'name').sort({ lessonDate: -1 }).lean();
        }

        res.render('admin/user_profile', {
            layout: 'layouts/dashboard',
            user: req.user,
            userProfile: userProfile,
            lessons: lessons,
            page_name: 'users'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// @desc    Страница просмотра прогресса
// @route   GET /dashboard/progress
router.get('/progress', ensureAuth, ensureRole('student'), (req, res) => {
    res.render('student/progress', {
        layout: 'layouts/dashboard',
        user: req.user,
        page_name: 'progress'
    });
});

module.exports = router;