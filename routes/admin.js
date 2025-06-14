const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');

router.all('/*', (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access Denied. You are not an admin.');
});


router.get('/dashboard', async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        res.render('admin/dashboard', { 
            user: req.user,
            studentCount,
            teacherCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ date: 'desc' });
        res.render('admin/users', { user: req.user, usersList: users });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/users/add', (req, res) => {
    res.render('admin/user_form', { 
        user: req.user, 
        viewTitle: 'Add New User',
        editingUser: null,
        teachers: []
    });
});

router.post('/users/add', async (req, res) => {
    const { name, email, password, role, contact } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).send('Please fill all required fields');
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User with this email already exists');
        }
        
        const newUser = new User({ name, email, password, role, contact });
        const savedUser = await newUser.save();

        if (role === 'student') {
            const newProfile = new StudentProfile({ user: savedUser._id });
            await newProfile.save();
        }
        
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/users/edit/:id', async (req, res) => {
    try {
        const userToEdit = await User.findById(req.params.id);
        if (!userToEdit) {
            return res.status(404).send('User not found');
        }

        let studentProfile = null;
        let teachers = [];

        if (userToEdit.role === 'student') {
            studentProfile = await StudentProfile.findOne({ user: userToEdit._id });
            teachers = await User.find({ role: 'teacher' });
        }

        res.render('admin/user_form', {
            user: req.user,
            viewTitle: `Edit User: ${userToEdit.name}`,
            editingUser: userToEdit,
            studentProfile: studentProfile,
            teachers: teachers
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/users/edit/:id', async (req, res) => {
    try {
        const userToEdit = await User.findById(req.params.id);
        if (!userToEdit) {
            return res.status(404).send('User not found');
        }

        userToEdit.name = req.body.name;
        userToEdit.email = req.body.email;
        userToEdit.contact = req.body.contact;
        userToEdit.role = req.body.role;

        if (req.body.password) {
            userToEdit.password = req.body.password;
        }

        await userToEdit.save();

        if (userToEdit.role === 'student') {
            const profile = await StudentProfile.findOne({ user: userToEdit._id });
            if (profile) {
                profile.assignedTeacher = req.body.assignedTeacher || null;
                profile.paidLessons['25'] += Number(req.body.add_lessons_25) || 0;
                profile.paidLessons['50'] += Number(req.body.add_lessons_50) || 0;
                await profile.save();
            }
        }
        
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;