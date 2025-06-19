const User = require('../../models/User');
const { createPaginationKeyboard } = require('../utils/helpers');

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

    let response = `*Your Students (Page ${result.currentPage}/${result.totalPages}):*\n\n`;
    const keyboardRows = [];

    result.users.forEach(s => {
        response += `*${s.name}* ${s.emojiAvatar || ''}\n- Balance: ${s.lessonsPaid} lessons\n- Contact: ${s.contact || 'not specified'}\n\n`;
        keyboardRows.push([{ text: `View ${s.name.split(' ')[0]}'s Profile`, url: `${BASE_URL}/dashboard/student/${s._id}` }]);
    });

    const paginationKeyboard = createPaginationKeyboard('teacher_list_students', result.currentPage, result.totalPages, 'all');
    if (paginationKeyboard.inline_keyboard.length > 0) {
        keyboardRows.push(paginationKeyboard.inline_keyboard[0]);
    }

    const options = {
        chat_id: chatId,
        parse_mode: 'Markdown',
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
    let response = `*Found users (Page ${result.currentPage}/${result.totalPages}):*\n\n`;
    const keyboardRows = [];
    result.users.forEach(u => {
        response += `*${u.name}* (${u.role}) - ${u.status}\nEmail: ${u.email || 'not set'}\n\n`;
        keyboardRows.push([{ text: `View ${u.name.split(' ')[0]}'s Profile`, url: `${BASE_URL}/dashboard/user-profile/${u._id}` }]);
    });
    const paginationKeyboard = createPaginationKeyboard('admin_user_search', result.currentPage, result.totalPages, searchString);
    if (paginationKeyboard.inline_keyboard.length > 0) keyboardRows.push(paginationKeyboard.inline_keyboard[0]);
    const options = { chat_id: chatId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboardRows } };
    if (messageId) return bot.editMessageText(response, { ...options, message_id: messageId });
    else return bot.sendMessage(chatId, response, options);
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

    let response = `*Found your students (Page ${result.currentPage}/${result.totalPages}):*\n\n`;
    const keyboardRows = [];

    result.users.forEach(s => {
        response += `*${s.name}*\n- Balance: ${s.lessonsPaid} lessons\n- Contact: ${s.contact || 'not specified'}\n\n`;
        keyboardRows.push([{ text: `View ${s.name.split(' ')[0]}'s Profile`, url: `${BASE_URL}/dashboard/user-profile/${s._id}` }]);
    });

    const paginationKeyboard = createPaginationKeyboard('teacher_student_search', result.currentPage, result.totalPages, studentName);
     if (paginationKeyboard.inline_keyboard.length > 0) {
        keyboardRows.push(paginationKeyboard.inline_keyboard[0]);
    }

    const options = {
        chat_id: chatId,
        parse_mode: 'Markdown',
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
    listStudentsForTeacher,
    findUserForAdmin,
};