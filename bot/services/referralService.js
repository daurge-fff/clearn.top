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
        referrer.referralBonuses = (referrer.referralBonuses || 0) + 1; // Example: 1 bonus per referral

        await referredUser.save();
        await referrer.save();

        await ctx.reply(`You have been referred by ${referrer.name}.`);
        
        const bot = ctx.telegram;
        await bot.sendMessage(referrer.telegramChatId, `User ${referredUser.name} has joined using your link!`);

        // Notify admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            if (admin.telegramChatId) {
                try {
                    await bot.sendMessage(admin.telegramChatId, `New referral: ${referrer.name} (ID: ${referrer.telegramChatId}) referred ${referredUser.name} (ID: ${referredUser.telegramChatId}).`);
                } catch (e) {
                    console.error(`Failed to send notification to admin ${admin.name}:`, e);
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
        message += `Your bonus balance: ${user.referralBonuses || 0}\n`;

        if (user.referredBy) {
            message += `You were referred by: ${user.referredBy.name}\n`;
        }

        const referredUsers = await User.find({ referredBy: user._id });
        message += `Number of referred users: ${referredUsers.length}`;

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