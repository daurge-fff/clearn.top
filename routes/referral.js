const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /referral
// @desc    Display referral page
// @access  Private
router.get('/', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('referredBy');
        const referredUsers = await User.find({ referredBy: user._id });

        const botInfo = { username: 'CodeAndLearnBot' }; // Replace with actual bot username logic if needed
        const referralLink = `https://t.me/${botInfo.username}?start=${user.referralCode}`;

        res.render('referral',
        {
            user,
            referralLink,
            referredUsers,
            layout: './layouts/dashboard'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;