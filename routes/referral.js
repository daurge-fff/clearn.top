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
        const Payment = require('../models/Payment');

        // Generate referral code if user doesn't have one
        if (!user.referralCode) {
            const crypto = require('crypto');
            user.referralCode = crypto.randomBytes(5).toString('hex');
            await user.save();
        }
        
        // Calculate earned lessons from referrals
        let totalEarnedLessons = 0;
        const referralsWithStatus = [];
        
        for (const referredUser of referredUsers) {
            // Count completed payments for this referred user
            const completedPayments = await Payment.find({
                userId: referredUser._id,
                status: 'completed'
            });
            
            const totalLessonsPurchased = completedPayments.reduce((sum, payment) => {
                return sum + (payment.lessonsPurchased || 0);
            }, 0);
            
            let status = 'new';
            let earnedFromThisReferral = 0;
            
            if (completedPayments.length > 0) {
                status = `${totalLessonsPurchased} lessons`;
                
                // Calculate earned lessons: 1 for first payment + 1 for each 20+ lesson purchase
                earnedFromThisReferral = 1; // First payment bonus
                
                // Count 20+ lesson purchases
                const bigPurchases = completedPayments.filter(payment => payment.lessonsPurchased >= 20).length;
                earnedFromThisReferral += bigPurchases;
            }
            
            totalEarnedLessons += earnedFromThisReferral;
            
            referralsWithStatus.push({
                ...referredUser.toObject(),
                status,
                earnedLessons: earnedFromThisReferral
            });
        }
        
        const botInfo = { username: 'CodeAndLearnBot' }; // Replace with actual bot username logic if needed
        const referralLink = `https://t.me/${botInfo.username}?start=${user.referralCode}`;

        res.render('referral',
        {
            user,
            referralLink,
            referredUsers: referralsWithStatus,
            totalEarnedLessons,
            layout: './layouts/dashboard'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;