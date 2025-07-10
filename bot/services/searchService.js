const User = require('../../models/User');
const { createPaginationKeyboard, escapeHtml, getRoleEmoji, getUserStatusEmoji } = require('../utils/helpers');

let BASE_URL;

function init(dependencies) {
    BASE_URL = dependencies.BASE_URL;
}

async function findUser(query, page = 1, limit = 5) {
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query).limit(limit).skip(skip).lean();
    const totalPages = Math.ceil(total / limit);
    return { users, totalPages, currentPage: page };
}

async function listStudentsForTeacher(bot, chatId, teacher, page = 1, messageId = null) {
    const query = { _id: { $in: teacher.students } };
    const result = await findUser(query, page);

    if (result.users.length === 0) {
        const text = "You don't have any students assigned yet.";
        return messageId ? bot.editMessageText(text, { chat_id: chatId, message_id: messageId }) : bot.sendMessage(chatId, text);
    }

    let response = `<b>Your Students (Page ${result.currentPage}/${result.totalPages}):</b>\n\n`;
    const keyboardRows = [];

    const buttons = result.users.map(s => {
        const studentName = escapeHtml(s.name);
        const emoji = s.emojiAvatar || getRoleEmoji('student');
        const statusIcon = getUserStatusEmoji(s.status);
        response += `${emoji} <b>${studentName}</b> ${statusIcon}\n   Balance: ${s.lessonsPaid} lessons\n\n`;
        return { text: s.name, url: `${BASE_URL}/dashboard/student/${s._id}` };
    });

    for (let i = 0; i < buttons.length; i += 2) {
        keyboardRows.push(buttons.slice(i, i + 2));
    }

    const paginationKeyboard = createPaginationKeyboard('teacher_list_students', result.currentPage, result.totalPages, 'all');
    if (paginationKeyboard.inline_keyboard.length > 0) {
        keyboardRows.push(paginationKeyboard.inline_keyboard[0]);
    }

    const options = {
        chat_id: chatId,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboardRows }
    };

    if (messageId) {
        return bot.editMessageText(response, { ...options, message_id: messageId });
    } else {
        return bot.sendMessage(chatId, response, options);
    }
}


async function findUserForAdmin(bot, chatId, searchString, page = 1, messageId = null) {
    const searchRegex = new RegExp(searchString, 'i');
    const query = { $or: [{ name: searchRegex }, { email: searchRegex }] };
    const result = await findUser(query, page);
    if (result.users.length === 0) return bot.sendMessage(chatId, `No users found matching "${searchString}".`);
    let response = `<b>Found users (Page ${result.currentPage}/${result.totalPages}):</b>\n\n`;
    const keyboardRows = [];
    result.users.forEach(u => {
        const emoji = u.emojiAvatar || getRoleEmoji(u.role);
        const statusIcon = getUserStatusEmoji(u.status);
        response += `${emoji} <b>${u.name}</b> (${u.role}) ${statusIcon}\n`;
        keyboardRows.push([{ text: `${u.name}`, url: `${BASE_URL}/dashboard/user-profile/${u._id}` }]);
    });
    const paginationKeyboard = createPaginationKeyboard('admin_list_users', result.currentPage, result.totalPages, 'all');
    if (paginationKeyboard.inline_keyboard.length > 0) {
        keyboardRows.push(paginationKeyboard.inline_keyboard[0]);
    }
    const options = {
        chat_id: chatId,
        parse_mode: 'HTML', 
        reply_markup: { inline_keyboard: keyboardRows }
    };
    try {
        if (messageId) {
            return await bot.editMessageText(response, { ...options, message_id: messageId });
        } else {
            return await bot.sendMessage(chatId, response, options);
        }
    } catch (error) {
        console.error("Telegram send/edit error:", error.response.body);
        return bot.sendMessage(chatId, "Could not display user list due to a formatting error.");
    }
}

async function findStudentForTeacher(bot, chatId, teacher, studentName, page = 1, messageId = null) {
    const searchRegex = new RegExp(studentName, 'i');
    const query = {
        _id: { $in: teacher.students },
        name: searchRegex
    };
    
    const result = await findUser(query, page);

    if (result.users.length === 0) {
        return bot.sendMessage(chatId, `No students found in your list matching "${studentName}".`);
    }

    let response = `<b>Found your students (Page ${result.currentPage}/${result.totalPages})</b>:\n\n`;
    const keyboardRows = [];

    result.users.forEach(s => {
        const studentName = escapeHtml(s.name);
        const emoji = s.emojiAvatar || getRoleEmoji('student');
        const statusIcon = getUserStatusEmoji(s.status);
        response += `${emoji} <b>${studentName}</b> ${statusIcon}\n   Balance: ${s.lessonsPaid} lessons\n\n`;
        keyboardRows.push([{ text: `${s.name}`, url: `${BASE_URL}/dashboard/user-profile/${s._id}` }]);
    });

    const paginationKeyboard = createPaginationKeyboard('teacher_student_search', result.currentPage, result.totalPages, studentName);
     if (paginationKeyboard.inline_keyboard.length > 0) {
        keyboardRows.push(paginationKeyboard.inline_keyboard[0]);
    }

    const options = {
        chat_id: chatId,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboardRows }
    };

    if (messageId) {
        return bot.editMessageText(response, { ...options, message_id: messageId });
    } else {
        return bot.sendMessage(chatId, response, options);
    }
}

async function listAllUsers(bot, chatId, page = 1, messageId = null) {
    const result = await findUser({}, page); 

    if (result.users.length === 0) {
        const text = "No users found in the system.";
        return messageId ? bot.editMessageText(text, { chat_id: chatId, message_id: messageId }) : bot.sendMessage(chatId, text);
    }

    let response = `<b>All Users (Page ${result.currentPage}/${result.totalPages}):</b>\n\n`;
    const keyboardRows = [];
    
    const buttons = result.users.map(u => {
        const name = escapeHtml(u.name);
        const roleIcon = getRoleEmoji(u.role);
        const statusIcon = getUserStatusEmoji(u.status);
        response += `${roleIcon} <b>${name}</b> (${u.role}) ${statusIcon}\n`;
        return { text: u.name, url: `${BASE_URL}/dashboard/user-profile/${u._id}` };
    });

    for (let i = 0; i < buttons.length; i += 2) {
         keyboardRows.push(buttons.slice(i, i + 2));
    }
    
    const paginationKeyboard = createPaginationKeyboard('admin_list_users', result.currentPage, result.totalPages, 'all');
    if (paginationKeyboard.inline_keyboard.length > 0) {
        keyboardRows.push(paginationKeyboard.inline_keyboard[0]);
    }

    const options = {
        chat_id: chatId,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboardRows }
    };

    if (messageId) {
        return bot.editMessageText(response, { ...options, message_id: messageId });
    } else {
        return bot.sendMessage(chatId, response, options);
    }
}



module.exports = {
    init,
    listAllUsers,
    listStudentsForTeacher,
    findUserForAdmin,
};