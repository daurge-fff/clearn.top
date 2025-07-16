const Lesson = require('../../models/Lesson');
const moment = require('moment-timezone');

async function createCalendarKeyboard(user, date) {
    let userTz = user.timeZone || 'Europe/Moscow';
    if (!moment.tz.zone(userTz)) {
        console.warn(`Invalid timezone ${userTz} for user ${user._id}, falling back to Europe/Moscow`);
        userTz = 'Europe/Moscow';
    }
    
    // Валидация входящей даты
    if (!date || isNaN(date.getTime())) {
        date = new Date(); // Используем текущую дату как fallback
    }
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthName = date.toLocaleString('en-US', { month: 'long' });

    // Создаем границы месяца в UTC для запроса к базе данных с валидацией
    const paddedMonth = (month + 1).toString().padStart(2, '0');
    const dateStr = `${year}-${paddedMonth}-01`;
    const startMoment = moment.tz(dateStr, 'YYYY-MM-DD', userTz);

    if (!startMoment.isValid()) {
        console.error(`Invalid startMoment for calendar: ${dateStr} with TZ ${userTz}`);
        throw new Error(`Invalid start date for calendar: year=${year}, month=${month}`);
    }

    const startOfMonth = startMoment.clone().startOf('month').utc().toDate();
    const endOfMonth = startMoment.clone().add(1, 'month').startOf('month').utc().toDate();

    const startOfMonthDate = startOfMonth;
    const endOfMonthDate = endOfMonth;

    const query = { lessonDate: { $gte: startOfMonthDate, $lt: endOfMonthDate } };
    if (user.role === 'student') query.student = user._id;
    if (user.role === 'teacher') query.teacher = user._id;

    const userLessons = await Lesson.find(query).select('lessonDate status').lean();
    
    const lessonDays = {};
    userLessons.forEach(l => {
        // Конвертируем дату урока в часовой пояс пользователя для определения дня
        const day = moment.utc(l.lessonDate).tz(userTz).date();
        if (!lessonDays[day]) lessonDays[day] = [];
        lessonDays[day].push(l.status);
    });

    let keyboard = [];
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
    }
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
    }
    keyboard.push([
        { text: "‹", callback_data: `cal_nav_${prevYear}_${prevMonth}` },
        { text: `${monthName} ${year}`, callback_data: "cal_ignore" },
        { text: "›", callback_data: `cal_nav_${nextYear}_${nextMonth}` }
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