const GoogleCalendarImporter = {
  extractCalendarId(url) {
    if (!url) return null;
    
    const patterns = [
      /calendar\.google\.com\/calendar\/ical\/([^/]+)\/public\/basic\.ics/i,
      /calendar\.google\.com\/calendar\/ical\/([^/]+)\/public\/full\.ics/i,
      /calendar\.google\.com\/calendar\/embed\?src=([^&]+)/i,
      /calendar\.google\.com\/r\/([^/]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    
    return null;
  },
  
  buildIcsUrl(calendarId) {
    if (!calendarId) return null;
    const encodedId = encodeURIComponent(calendarId);
    return `https://calendar.google.com/calendar/ical/${encodedId}/public/basic.ics`;
  },
  
  parseUrl(url) {
    const calendarId = this.extractCalendarId(url);
    if (!calendarId) {
      return Promise.reject(new Error('无效的Google日历链接格式'));
    }
    
    const icsUrl = this.buildIcsUrl(calendarId);
    return this.fetchAndParse(icsUrl);
  },
  
  fetchAndParse(icsUrl) {
    return fetch(icsUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('无法获取日历数据，请确保日历链接是公开的');
        }
        return response.text();
      })
      .then(icsContent => {
        return ICSParser.parse(icsContent);
      })
      .catch(error => {
        console.error('获取Google日历时出错:', error);
        throw error;
      });
  },
  
  convertEventsToCourses(events, options = {}) {
    const courses = [];
    const courseMap = new Map();
    
    for (const event of events) {
      const courseKey = `${event.title}-${event.startDate.getHours()}:${event.startDate.getMinutes()}`;
      
      if (!courseMap.has(courseKey)) {
        const course = ICSParser.convertToCourse(event, {
          startTime: options.defaultStartTime,
          endTime: options.defaultEndTime,
          frequency: options.defaultFrequency || 'weekly',
          repeatCount: options.defaultRepeatCount || 16
        });
        
        course.importedFrom = 'google-calendar';
        courseMap.set(courseKey, course);
        courses.push(course);
      }
    }
    
    return courses;
  },
  
  generateLessonsForCourse(course, courseEvents) {
    const lessons = [];
    const courseDate = new Date(course.startDate);
    const frequency = course.frequency || 'weekly';
    
    let count = 0;
    const maxCount = course.repeatCount || 16;
    
    while (count < maxCount) {
      const lessonDate = new Date(courseDate);
      
      const holidayInfo = HolidayService.isHoliday(lessonDate);
      if (!holidayInfo) {
        lessons.push({
          week: count + 1,
          date: lessonDate.toISOString(),
          status: '',
          problem: ''
        });
        count++;
      }
      
      switch (frequency) {
        case 'weekly':
          courseDate.setDate(courseDate.getDate() + 7);
          break;
        case 'biweekly':
          courseDate.setDate(courseDate.getDate() + 14);
          break;
        case 'monthly':
          courseDate.setMonth(courseDate.getMonth() + 1);
          break;
        case 'daily':
          courseDate.setDate(courseDate.getDate() + 1);
          break;
        default:
          courseDate.setDate(courseDate.getDate() + 7);
      }
      
      if (lessonDate > new Date(2027, 0, 1)) break;
    }
    
    return lessons;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleCalendarImporter;
}
