const holidays = {
  '2024-01-01': '元旦',
  '2024-02-10': '春节',
  '2024-02-11': '春节',
  '2024-02-12': '春节',
  '2024-02-13': '春节',
  '2024-02-14': '春节',
  '2024-02-15': '春节',
  '2024-02-16': '春节',
  '2024-04-04': '清明节',
  '2024-04-05': '清明节',
  '2024-04-06': '清明节',
  '2024-05-01': '劳动节',
  '2024-05-02': '劳动节',
  '2024-05-03': '劳动节',
  '2024-05-04': '劳动节',
  '2024-05-05': '劳动节',
  '2024-06-10': '端午节',
  '2024-09-15': '中秋节',
  '2024-09-16': '中秋节',
  '2024-09-17': '中秋节',
  '2024-10-01': '国庆节',
  '2024-10-02': '国庆节',
  '2024-10-03': '国庆节',
  '2024-10-04': '国庆节',
  '2024-10-05': '国庆节',
  '2024-10-06': '国庆节',
  '2024-10-07': '国庆节',
  '2025-01-01': '元旦',
  '2025-01-28': '春节',
  '2025-01-29': '春节',
  '2025-01-30': '春节',
  '2025-01-31': '春节',
  '2025-02-01': '春节',
  '2025-02-02': '春节',
  '2025-02-03': '春节',
  '2025-04-04': '清明节',
  '2025-04-05': '清明节',
  '2025-04-06': '清明节',
  '2025-05-01': '劳动节',
  '2025-05-02': '劳动节',
  '2025-05-03': '劳动节',
  '2025-05-04': '劳动节',
  '2025-05-05': '劳动节',
  '2025-05-31': '端午节',
  '2025-10-01': '国庆节',
  '2025-10-02': '国庆节',
  '2025-10-03': '国庆节',
  '2025-10-04': '国庆节',
  '2025-10-05': '国庆节',
  '2025-10-06': '国庆节',
  '2025-10-07': '国庆节',
  '2025-10-08': '国庆节',
  '2026-01-01': '元旦',
  '2026-01-26': '春节',
  '2026-01-27': '春节',
  '2026-01-28': '春节',
  '2026-01-29': '春节',
  '2026-01-30': '春节',
  '2026-01-31': '春节',
  '2026-02-01': '春节',
  '2026-02-02': '春节',
  '2026-04-04': '清明节',
  '2026-04-05': '清明节',
  '2026-04-06': '清明节',
  '2026-05-01': '劳动节',
  '2026-05-02': '劳动节',
  '2026-05-03': '劳动节',
  '2026-05-04': '劳动节',
  '2026-05-05': '劳动节',
  '2026-10-01': '国庆节',
  '2026-10-02': '国庆节',
  '2026-10-03': '国庆节',
  '2026-10-04': '国庆节',
  '2026-10-05': '国庆节',
  '2026-10-06': '国庆节',
  '2026-10-07': '国庆节',
};

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function getWeekNumber(course, date) {
  if (!course.startDate || !date) return -1;

  const startDate = new Date(course.startDate);
  startDate.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return -1;

  let weekNumber = 1;
  let currentDate = new Date(startDate);

  while (currentDate < targetDate) {
    const holiday = isHoliday(currentDate);
    if (!holiday) {
      weekNumber++;
    }
    switch (course.frequency || 'weekly') {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return weekNumber;
}

function getWeekNumberStart(startDate, currentDate) {
  if (!startDate || !currentDate) return -1;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const target = new Date(currentDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return -1;

  return Math.floor(diffDays / 7) + 1;
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function formatTime(date) {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isHoliday(date) {
  const dateStr = date.toISOString().split('T')[0];
  return holidays[dateStr] || null;
}

window.DateUtils = {
  formatDate,
  getWeekNumber,
  getWeekNumberStart,
  isSameDay,
  formatTime,
  isHoliday
};
