function getStatusEmoji(status) {
    switch (status) {
        case 'scheduled': return '🗓️';
        case 'completed': return '✅';
        case 'cancelled_by_student': return '❌';
        case 'cancelled_by_teacher': return '🚫';
        case 'no_show': return '👻';
        case 'pending': return '⏳';
        case 'in_progress': return '🚀';
        case 'awaiting_confirmation': return '⏳';
        default: return status;
    }
}

function getRoleEmoji(role) {
    switch (role) {
        case 'student': return '👨‍🎓';
        case 'teacher': return '👨‍🏫';
        case 'admin':   return '👑';
        default:        return '👤';
    }
}

function getUserStatusEmoji(status) {
    switch (status) {
        case 'active':   return '🟢';
        case 'inactive': return '🔴';
        case 'paused':   return '⏸️';
        default:         return '⚪️';
    }
}

function createPaginationKeyboard(prefix, currentPage, totalPages, searchTerm) {
    if (totalPages <= 1) return { inline_keyboard: [] };
    let row = [];
    if (currentPage > 1) {
        row.push({ text: '‹ Prev', callback_data: `page_${prefix}_${currentPage - 1}_${searchTerm}` });
    }
    row.push({ text: `${currentPage} / ${totalPages}`, callback_data: 'ignore' });
    if (currentPage < totalPages) {
        row.push({ text: 'Next ›', callback_data: `page_${prefix}_${currentPage + 1}_${searchTerm}` });
    }
    return { inline_keyboard: [row] };
}

function escapeHtml(text) {
    if (text === null || typeof text === 'undefined') {
        return '';
    }
    return String(text)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>');
}

module.exports = {
    getStatusEmoji,
    createPaginationKeyboard,
    escapeHtml,
    getRoleEmoji,
    getUserStatusEmoji
};