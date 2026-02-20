const HolidayService = {
  holidays: {
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
    '2025-09-06': '中秋节',
    '2025-09-07': '中秋节',
    '2025-09-08': '中秋节',
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
    '2027-01-01': '元旦',
    '2027-02-16': '春节',
    '2027-02-17': '春节',
    '2027-02-18': '春节',
    '2027-02-19': '春节',
    '2027-02-20': '春节',
    '2027-02-21': '春节',
    '2027-02-22': '春节',
    '2027-02-23': '春节',
    '2027-04-04': '清明节',
    '2027-04-05': '清明节',
    '2027-04-06': '清明节',
    '2027-05-01': '劳动节',
    '2027-05-02': '劳动节',
    '2027-05-03': '劳动节',
    '2027-05-04': '劳动节',
    '2027-05-05': '劳动节'
  },
  
  isHoliday(date) {
    if (!date) return null;
    const dateStr = this.formatDate(date);
    return this.holidays[dateStr] || null;
  },
  
  isHolidayDate(dateStr) {
    return this.holidays[dateStr] || null;
  },
  
  formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  getHolidaysInRange(startDate, endDate) {
    const holidays = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const holiday = this.isHoliday(current);
      if (holiday) {
        holidays.push({
          date: new Date(current),
          name: holiday
        });
      }
      current.setDate(current.getDate() + 1);
    }
    
    return holidays;
  },
  
  skipHolidays(startDate, repeatCount, frequency) {
    const lessons = [];
    const currentDate = new Date(startDate);
    let count = 0;
    const skippedDates = [];
    
    while (count < repeatCount) {
      const holiday = this.isHoliday(currentDate);
      
      if (!holiday) {
        lessons.push({
          week: count + 1,
          date: currentDate.toISOString(),
          status: '',
          problem: ''
        });
        count++;
      } else {
        skippedDates.push({
          date: new Date(currentDate),
          name: holiday
        });
      }
      
      this.incrementDate(currentDate, frequency);
      
      if (currentDate.getFullYear() > 2030) break;
    }
    
    return { lessons, skippedDates };
  },
  
  incrementDate(date, frequency) {
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        date.setDate(date.getDate() + 7);
    }
  },
  
  formatSkippedDates(skippedDates) {
    if (!skippedDates || skippedDates.length === 0) return '';
    
    return skippedDates.map(item => {
      const dateStr = `${item.date.getFullYear()}/${item.date.getMonth() + 1}/${item.date.getDate()}`;
      return `${dateStr} ${item.name}`;
    }).join('、');
  },
  
  async updateFromRemote() {
    try {
      const response = await fetch('https://raw.githubusercontent.com/holiday-cn/holiday-cn/master/data.json');
      if (!response.ok) {
        throw new Error('无法获取节假日数据');
      }
      const remoteData = await response.json();
      this.mergeRemoteData(remoteData);
      return true;
    } catch (error) {
      console.error('更新节假日数据失败:', error);
      return false;
    }
  },
  
  mergeRemoteData(remoteData) {
    if (remoteData && remoteData.holidays) {
      for (const [date, info] of Object.entries(remoteData.holidays)) {
        this.holidays[date] = typeof info === 'string' ? info : info.name || '节假日';
      }
    }
    if (remoteData && remoteData.extra) {
      for (const [date, name] of Object.entries(remoteData.extra)) {
        this.holidays[date] = name;
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HolidayService;
}
