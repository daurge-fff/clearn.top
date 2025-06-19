const Lesson = require('../../models/Lesson');

async function createCalendarKeyboard(user, date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString('en-US', { month: 'long' });

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const query = { lessonDate: { $gte: startOfMonth, $lte: endOfMonth } };
    if (user.role === 'student') query.student = user._id;
    if (user.role === 'teacher') query.teacher = user._id;

    const userLessons = await Lesson.find(query).select('lessonDate status').lean();
    
    const lessonDays = {};
    userLessons.forEach(l => {
        const day = new Date(l.lessonDate).getDate();
        if (!lessonDays[day]) lessonDays[day] = [];
        lessonDays[day].push(l.status);
    });

    let keyboard = [];
    keyboard.push([
        { text: "‹", callback_data: `cal_nav_${year}_${month - 1}` },
        { text: `${monthName} ${year}`, callback_data: "cal_ignore" },
        { text: "›", callback_data: `cal_nav_${year}_${month + 1}` }
    ]);
    keyboard.push(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => ({ text: d, callback_data: "cal_ignore" })));

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    let row = [];
    for (let i = 0; i < firstDay; i++) row.push({ text: " ", callback_data: "cal_ignore" });
    
    for (let day = 1; day <= daysInMonth; day++) {
        let dayText;
        if (lessonDays[day]) {
            if (lessonDays[day].includes('scheduled')) dayText = `🔵`;
            else if (lessonDays[day].every(s => s === 'completed')) dayText = `✅`;
            else dayText = `🔴`;
        } else {
          dayText = String(day);
        }

        row.push({ text: dayText, callback_data: `cal_day_${year}_${month}_${day}` });
        if (row.length === 7) { keyboard.push(row); row = []; }
    }
    if (row.length > 0) keyboard.push(row);

    keyboard.push([
        { text: "This Week", callback_data: "cal_filter_week" },
        { text: "This Month", callback_data: "cal_filter_month" }
    ]);

    return { inline_keyboard: keyboard };
}

module.exports = { createCalendarKeyboard };