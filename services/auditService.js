const bot = require('../bot');

function getLogsChatId() {
    return process.env.TELEGRAM_LOGS_ID;
}

function formatUserInline(user) {
    if (!user) return '`anonymous`';
    const name = user.name || user.email || user._id || 'unknown';
    const email = user.email ? user.email.replace(/<([^>]+)>/, '$1') : null;
    const tg = user.telegramUsername ? ` ( @${escapeMarkdown(user.telegramUsername)} )` : '';
    return `${escapeMarkdown(name)}${tg}${email ? '\n' + escapeMarkdown(email) : ''}`;
}

function escapeMarkdown(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/\\([_*\[\]()~`<>#+\-=|{}.!])/g, '$1');
}

async function sendLog(message, extra = {}) {
    const chatId = getLogsChatId();
    if (!chatId) {
        console.warn('[audit] TELEGRAM_LOGS_ID not set; skipping log:', message);
        return;
    }
    try {
        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('[audit] Failed to send log:', err.message, { extra });
    }
}

function buildIpLine(ip) {
    return ip ? `\n🌐 IP: \`${escapeMarkdown(ip)}\`` : '';
}

function formatMaybeJson(text) {
    try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
    } catch (_) {
        return text;
    }
}

// Payments
async function logInvoiceCreated({ amount, currency, systemName, identifier, description, orderId, actor, ip }) {
    const msg = `#invoice #create\n` +
        `🧾 *New Invoice*\n\n` +
        `💰 Amount: *${escapeMarkdown(amount)} ${escapeMarkdown(currency)}*\n` +
        `💳 System: *${escapeMarkdown(systemName)}*\n` +
        `👤 Client: \`${escapeMarkdown(identifier)}\`\n` +
        (description ? `📝 Desc: ${escapeMarkdown(description)}\n` : '') +
        (orderId ? `🆔 Order: \`${escapeMarkdown(orderId)}\`\n` : '') +
        (actor ? `🧑 Actor: ${formatUserInline(actor)}\nID: ${actor._id}` : '') +
        `${buildIpLine(ip)}`;
    await sendLog(msg, { type: 'invoice_create' });
}

async function logManualConfirmationSubmitted({ systemName, amount, currency, identifier, transactionId, orderId, actor, ip }) {
    const msg = `#payment #manual\n` +
        `⚠️ *Manual Confirmation Submitted*\n\n` +
        `💳 System: *${escapeMarkdown(systemName)}*\n` +
        `💰 Amount: *${escapeMarkdown(amount)} ${escapeMarkdown(currency)}*\n` +
        `👤 Client: \`${escapeMarkdown(identifier)}\`\n` +
        (transactionId ? `🧾 Tx: \`${escapeMarkdown(transactionId)}\`\n` : '') +
        (orderId ? `🆔 Order: \`${escapeMarkdown(orderId)}\`\n` : '') +
        (actor ? `🧑 Actor: ${formatUserInline(actor)}\nID: ${actor._id}` : '') +
        `${buildIpLine(ip)}`;
    await sendLog(msg, { type: 'payment_manual_submit' });
}

async function logPaymentCompleted({ systemName, amount, currency, identifier, orderId, paymentId }) {
    const msg = `#payment #completed\n` +
        `✅ *Payment Completed*\n\n` +
        (systemName ? `💳 System: *${escapeMarkdown(systemName)}*\n` : '') +
        `💰 Amount: *${escapeMarkdown(amount)} ${escapeMarkdown(currency)}*\n` +
        `👤 Client: \`${escapeMarkdown(identifier)}\`\n` +
        (orderId ? `🆔 Order: \`${escapeMarkdown(orderId)}\`\n` : '') +
        (paymentId ? `📄 PaymentID: \`${escapeMarkdown(paymentId)}\`` : '');
    await sendLog(msg, { type: 'payment_completed' });
}

// Lessons
async function logLessonStatusChange({ lessonId, fromStatus, toStatus, actor, ip, time, courseName, withUser, balanceChange, newBalance }) {
    const msg = `#lesson #status\n` +
        `🔄 *Lesson Status Changed*\n\n` +
        `📘 Lesson: \`${escapeMarkdown(lessonId)}\`\n` +
        (courseName ? `📚 Course: ${escapeMarkdown(courseName)}\n` : '') +
        (withUser ? `👥 With: ${escapeMarkdown(withUser)}\n` : '') +
        `➡️ ${escapeMarkdown(fromStatus)} → *${escapeMarkdown(toStatus)}*\n` +
        (time ? `🕒 ${escapeMarkdown(time)}\n` : '') +
        (balanceChange !== undefined && balanceChange !== 0 ? `💰 Balance: ${balanceChange > 0 ? '+' : ''}${balanceChange} (New: ${newBalance})\n` : '') +
        (actor ? `🧑 Actor: ${formatUserInline(actor)}\nID: ${actor._id}` : '') +
        `${buildIpLine(ip)}`;
    await sendLog(msg, { type: 'lesson_status' });
}

async function logLessonCancelled({ lessonId, byRole, reason, actor, ip, time, withUser }) {
    const msg = `#lesson #cancel\n` +
        `❌ *Lesson Cancelled*\n\n` +
        `📘 Lesson: \`${escapeMarkdown(lessonId)}\`\n` +
        (withUser ? `👥 With: ${escapeMarkdown(withUser)}\n` : '') +
        `👤 By: *${escapeMarkdown(byRole)}*\n` +
        (time ? `🕒 ${escapeMarkdown(time)}\n` : '') +
        (reason ? `📝 Reason: ${escapeMarkdown(reason)}\n` : '') +
        (actor ? `🧑 Actor: ${formatUserInline(actor)}\nID: ${actor._id}` : '') +
        `${buildIpLine(ip)}`;
    await sendLog(msg, { type: 'lesson_cancel' });
}

// Generic
async function logEvent({ tags = [], title, lines = [], actor, ip, emoji = '🪵' }) {
    const hash = tags.map(t => `#${t}`).join(' ');
    const header = `${hash}\n${emoji} *${escapeMarkdown(title)}*`;
    const body = (lines || []).filter(Boolean).map(l => {
        if (l.startsWith('Body:')) {
            const content = l.slice(5).trim();
            const pretty = formatMaybeJson(content);
            return `Body:\n\`\`\`\n${pretty}\n\`\`\``;
        }
        return escapeMarkdown(l);
    }).join('\n');
    const footer = actor ? `\n🧑 Actor: ${formatUserInline(actor)}\nID: ${actor._id}${buildIpLine(ip)}` : `${buildIpLine(ip)}`;
    await sendLog(`${header}\n\n${body}${footer}`);
}

module.exports = {
    sendLog,
    logInvoiceCreated,
    logManualConfirmationSubmitted,
    logPaymentCompleted,
    logLessonStatusChange,
    logLessonCancelled,
    logEvent
};


