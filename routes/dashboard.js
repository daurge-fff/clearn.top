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

// Function to calculate stars based on grade
function calculateStarsFromGrade(score, isProject) {
    if (isProject) {
        // For projects (max 25 points)
        if (score >= 23) return 10; // Excellent (23-25)
        if (score >= 20) return 8;  // Very good (20-22)
        if (score >= 17) return 6;  // Good (17-19)
        if (score >= 14) return 4;  // Satisfactory (14-16)
        if (score >= 10) return 2;  // Basic (10-13)
        return 1; // Participation (1-9)
    } else {
        // For regular lessons (max 10 points)
        if (score >= 9) return 5;   // Excellent (9-10)
        if (score >= 8) return 4;   // Very good (8)
        if (score >= 7) return 3;   // Good (7)
        if (score >= 6) return 2;   // Satisfactory (6)
        if (score >= 4) return 1;   // Basic (4-5)
        return 1; // Participation (1-3)
    }
}

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
                upcomingLesson.localLessonDate = moment.utc(upcomingLesson.lessonDate).tz(userTz).toDate();
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
                localLessonDate: moment.utc(lesson.lessonDate).tz(userTz).toDate()
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
        res.status(200).json({ message: 'Payment status updated successfully', payment });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ message: error.message });
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
router.post('/users/edit/:id', ensureAuth, ensureRole('admin'), async (req, res) => { try { const userId = req.params.id; const { name, email, role, contact, lessonsPaid, status, teacher: newTeacherId, timeZone } = req.body; const userToUpdate = await User.findById(userId); if (!userToUpdate) return res.status(404).send('User not found'); const oldTeacherId = userToUpdate.teacher ? String(userToUpdate.teacher) : null; const newTeacherIdStr = newTeacherId || null; if (oldTeacherId !== newTeacherIdStr) { if (oldTeacherId) { await User.updateOne({ _id: oldTeacherId }, { $pull: { students: userId } }); } if (newTeacherIdStr && role === 'student') { await User.updateOne({ _id: newTeacherIdStr }, { $addToSet: { students: userId } }); } } userToUpdate.name = name; userToUpdate.email = email.toLowerCase(); userToUpdate.contact = contact;
userToUpdate.timeZone = timeZone || userToUpdate.timeZone; userToUpdate.status = status; if (userToUpdate.role !== 'student' && role === 'student') { userToUpdate.teacher = newTeacherIdStr; } else if (userToUpdate.role === 'student' && role !== 'student') { if(oldTeacherId) { await User.updateOne({ _id: oldTeacherId }, { $pull: { students: userId } }); } userToUpdate.teacher = null; } userToUpdate.role = role; if (role === 'student') { userToUpdate.lessonsPaid = Number(lessonsPaid); userToUpdate.teacher = newTeacherIdStr; } else { userToUpdate.lessonsPaid = 0; userToUpdate.teacher = null; } if (req.body.password) { const salt = await bcrypt.genSalt(10); userToUpdate.password = await bcrypt.hash(req.body.password, salt); } await userToUpdate.save(); res.redirect('/dashboard/users'); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
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
        
        user.balanceHistory.pull({ _id: req.params.id });

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

            filter.$or = [
                { topic: searchRegex },
                { teacher: { $in: userIds } },
                { student: { $in: userIds } }
            ];
        }

        let sort = {};
        if (req.query.sort) {
            sort[req.query.sort] = req.query.order === 'desc' ? -1 : 1;
        } else {
            sort.lessonDate = -1;
        }

        const lessons = await Lesson.find(filter)
            .populate('student', 'name')
            .populate('teacher', 'name')
            .populate('course', 'name')
            .sort(sort)
            .lean();

        const userTz = req.user.timeZone || 'Europe/Moscow';
        const lessonsWithLocalTime = lessons.map(lesson => ({
            ...lesson,
            localLessonDate: moment.utc(lesson.lessonDate).tz(userTz).toDate()
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

        await Lesson.create({
            student,
            teacher,
            course,
            lessonDate: lessonDateUTC,
            duration: Number(duration),
            topic: topic || 'Scheduled Lesson'
        });
        await User.findByIdAndUpdate(student, { $inc: { lessonsPaid: -1 } });
        res.redirect('/dashboard/lessons');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard/lessons/add');
    }
});
router.get('/schedule', ensureAuth, ensureRole('teacher'), async (req, res) => { try { const lessons = await Lesson.find({ teacher: req.user.id }).populate('student', 'name').populate('course', 'name').sort({ lessonDate: -1 }).lean(); const userTz = req.user.timeZone || 'Europe/Moscow'; const lessonsWithLocalTime = lessons.map(lesson => ({ ...lesson, localLessonDate: moment.utc(lesson.lessonDate).tz(userTz).toDate() })); res.render('teacher/schedule', { layout: 'layouts/dashboard', user: req.user, lessons: lessonsWithLocalTime, page_name: 'schedule' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/my-students', ensureAuth, ensureRole('teacher'), async (req, res) => { try { const teacher = await User.findById(req.user.id).populate('students'); res.render('teacher/my_students', { layout: 'layouts/dashboard', user: req.user, students: teacher.students, page_name: 'students' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
router.get('/lessons/manage/:id', ensureAuth, async (req, res) => { try { const lesson = await Lesson.findById(req.params.id).populate('student', 'name').populate('course', 'name').lean(); if (!lesson) return res.status(404).send('Lesson not found'); if (req.user.role !== 'admin' && String(lesson.teacher) !== String(req.user.id)) { return res.status(403).send('Forbidden: You are not authorized to manage this lesson.'); } const userTimeZone = req.user.timeZone || 'UTC'; lesson.localLessonDate = moment.tz(lesson.lessonDate, userTimeZone).toDate(); res.render('teacher/lesson_manage', { layout: 'layouts/dashboard', user: req.user, lesson: lesson, page_name: req.user.role === 'admin' ? 'lessons' : 'schedule' }); } catch (err) { console.error(err); res.status(500).send('Server Error'); } });
// @desc    Просмотр профиля ученика учителем
// @route   GET /dashboard/student/:id
router.get('/student/:id', ensureAuth, ensureRole('teacher'), async (req, res) => {
    try {
        const isMyStudent = req.user.students.some(studentId => studentId.toString() === req.params.id);
        if (!isMyStudent) return res.status(403).send('This is not your student.');

        const student = await User.findById(req.params.id).lean();
        const lessons = await Lesson.find({ student: req.params.id, teacher: req.user.id }).sort({ lessonDate: -1 }).lean();

        const userTz = req.user.timeZone || 'Europe/Moscow';
        const lessonsWithLocalTime = lessons.map(lesson => ({
            ...lesson,
            localLessonDate: moment.utc(lesson.lessonDate).tz(userTz).toDate()
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

            // Award stars based on grade
            const starsToAward = calculateStarsFromGrade(finalScore, lesson.isProject);
            if (starsToAward > 0) {
                const student = await User.findById(lesson.student);
                if (student) {
                    // Check if grade stars were already awarded for this specific lesson
                    const gradeAlreadyAwarded = student.balanceHistory.some(entry => 
                        entry.reason && entry.reason.includes('lesson grade') && 
                        entry.reason.includes(`(ID: ${lesson._id})`)
                    );
                    
                    if (!gradeAlreadyAwarded) {
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
                        
                        await student.save();
                    }
                }
            }
        }

        // Award stars for completing lesson (if status changed to completed and not already awarded)
        if (originalStatus !== 'completed' && status === 'completed') {
            const student = await User.findById(lesson.student);
            if (student) {
                // Check if completion stars were already awarded for this specific lesson
                const alreadyAwarded = student.balanceHistory.some(entry => 
                    entry.reason && entry.reason.includes(`completing`) && 
                    entry.reason.includes(`(ID: ${lesson._id})`)
                );
                
                if (!alreadyAwarded) {
                    const completionStars = lesson.isProject ? 5 : 2; // More stars for project completion
                    const newStarsBalance = (student.stars || 0) + completionStars;
                    student.stars = newStarsBalance;
                    
                    student.balanceHistory.push({
                        date: new Date(),
                        change: completionStars,
                        starsBalanceAfter: Number(newStarsBalance),
                        lessonsBalanceAfter: Number(student.lessonsPaid || 0),
                        reason: `Stars earned for completing ${lesson.isProject ? 'project' : 'lesson'} (ID: ${lesson._id})`,
                        isStarAdjustment: true
                    });
                    
                    await student.save();
                }
            }
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
router.get('/my-lessons', ensureAuth, ensureRole('student'), async (req, res) => {
    try {
        const lessons = await Lesson.find({ student: req.user.id }).populate('teacher', 'name').populate('course', 'name').sort({ lessonDate: -1 }).lean();
        
        const payments = await Payment.find({ userId: req.user.id, status: 'completed' }).sort({ createdAt: -1 }).lean();

        const userTz = req.user.timeZone || 'Europe/Moscow';
        const lessonsWithLocalTime = lessons.map(lesson => ({ ...lesson, localLessonDate: moment.utc(lesson.lessonDate).tz(userTz).toDate() }));

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
        await Lesson.findByIdAndUpdate(req.params.id, { 
            status: 'cancelled_by_student', 
            cancellationReason: req.body.reason || 'Cancelled by student' 
        }); 
        await User.findByIdAndUpdate(req.user.id, { $inc: { lessonsPaid: 1 } }); 
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
        const userTimeZone = req.user.timeZone || 'UTC';
        lesson.localLessonDate = moment.tz(lesson.lessonDate, userTimeZone).toDate();

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
            
            // Convert lesson dates to user's local time
            const userTimeZone = req.user.timeZone || 'UTC';
            lessons.forEach(lesson => {
                lesson.localLessonDate = moment.tz(lesson.lessonDate, userTimeZone).toDate();
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
    const { name, email, password, role, contact, lessonsPaid } = req.body;
    
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
            lessonsPaid: role === 'student' ? Number(lessonsPaid) : 0,
            emojiAvatar: randomEmoji
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        
        await newUser.save();

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
        const { status } = req.query;
        let filter = {};
        if (status) filter.status = status;

        let sort = {};
        if (req.query.sort) {
            sort[req.query.sort] = req.query.order === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const payments = await Payment.find(filter)
            .populate('userId', 'name email')
            .sort(sort)
            .lean();

        res.render('admin/payments', {
            layout: 'layouts/dashboard',
            user: req.user,
            payments: payments,
            query: req.query,
            page_name: 'payments'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;