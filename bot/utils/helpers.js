function getStatusEmoji(status) {
    switch (status) {
        case 'scheduled': return '🗓️ Scheduled';
        case 'completed': return '✅ Completed';
        case 'cancelled_by_student': return '❌ Cancelled (Student)';
        case 'cancelled_by_teacher': return '❌ Cancelled (Teacher)';
        case 'no_show': return '👻 No Show';
        default: return status;
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

module.exports = {
    getStatusEmoji,
    createPaginationKeyboard,
};