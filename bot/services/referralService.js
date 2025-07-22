const User = require('../../models/User');
const crypto = require('crypto');

async function handleReferral(ctx, referralCode) {
    try {
        const referrer = await User.findOne({ referralCode });
        if (!referrer) {
            return ctx.reply('Invalid referral code.');
        }

        const referredUser = await User.findOne({ telegramChatId: ctx.from.id });
        if (referredUser.referredBy) {
            return ctx.reply('You are already part of the referral program.');
        }

        if (referrer.telegramChatId === referredUser.telegramChatId) {
            return ctx.reply('You cannot use your own referral code.');
        }

        referredUser.referredBy = referrer._id;
        // Give 1 free lesson to the new user
        referredUser.lessonsPaid = (referredUser.lessonsPaid || 0) + 1;
        
        // Add to balance history
        referredUser.balanceHistory.push({
            date: new Date(),
            change: 1,
            starsBalanceAfter: Number(referredUser.stars || 0),
            lessonsBalanceAfter: Number(referredUser.lessonsPaid || 0),
            reason: 'Free lesson for joining via referral link',
            isStarAdjustment: false
        });

        await referredUser.save();
        await referrer.save();

        await ctx.reply(`You have been referred by ${referrer.name}. You received 1 free lesson! 🎉`);
        
        try {
                await ctx.telegram.sendMessage(referrer.telegramChatId, `User ${referredUser.name} has joined using your link!`);
            } catch (telegramError) {
                console.error(`Failed to send referral notification to referrer ${referrer.name}:`, telegramError.message);
            }

        // Notify admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            if (admin.telegramChatId) {
                try {
                    await ctx.telegram.sendMessage(admin.telegramChatId, `New referral: ${referrer.name} (ID: ${referrer.telegramChatId}) referred ${referredUser.name} (ID: ${referredUser.telegramChatId}).`);
                } catch (telegramError) {
                    console.error(`Failed to send referral notification to admin ${admin.name}:`, telegramError.message);
                }
            }
        }

    } catch (error) {
        console.error('Error handling referral:', error);
        ctx.reply('An error occurred while processing your referral code.');
    }
}

async function showReferralInfo(ctx) {
    try {
        const user = await User.findOne({ telegramChatId: ctx.from.id }).populate('referredBy');
        if (!user) {
            return ctx.reply('Could not find user information.');
        }

        if (!user.referralCode) {
            user.referralCode = crypto.randomBytes(5).toString('hex');
            await user.save();
        }

        const botInfo = await ctx.telegram.getMe();
        const referralLink = `https://t.me/${botInfo.username}?start=${user.referralCode}`;

        let message = `Your partner link: ${referralLink}\n`;
        message += `Your total lessons: ${user.lessonsPaid || 0}\n`;

        if (user.referredBy) {
            message += `You were referred by: ${user.referredBy.name}\n`;
        }

        const referredUsers = await User.find({ referredBy: user._id });
        message += `Number of referred users: ${referredUsers.length}\n\n`;
        message += `📋 How it works:\n`;
        message += `• Invite friends using your link\n`;
        message += `• You get 1 free lesson when they make their first payment\n`;
        message += `• You get +1 bonus lesson if they buy 20+ lessons at once\n`;
        message += `• New users get 1 free lesson when joining via referral`;

        ctx.reply(message);
    } catch (error) {
        console.error('Error displaying referral information:', error);
        ctx.reply('An error occurred while fetching your referral information.');
    }
}

module.exports = {
    handleReferral,
    showReferralInfo
};