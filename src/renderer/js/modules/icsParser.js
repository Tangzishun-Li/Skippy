const ICSParser = {
  parse(icsContent) {
    const events = [];
    const lines = this.splitLines(icsContent);
    
    let currentEvent = null;
    
    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent) {
          const parsed = this.parseEvent(currentEvent);
          if (parsed) {
            events.push(parsed);
          }
        }
        currentEvent = null;
      } else if (currentEvent) {
        this.parseEventLine(line, currentEvent);
      }
    }
    
    return events;
  },
  
  splitLines(content) {
    const lines = [];
    let currentLine = '';
    const chars = content.split('');
    
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      
      if (char === '\n') {
        if (currentLine.endsWith('\r')) {
          currentLine = currentLine.slice(0, -1);
        }
        lines.push(currentLine);
        currentLine = '';
      } else if (i > 0 && char === ' ' && chars[i - 1] !== ' ') {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
      } else {
        currentLine += char;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  },
  
  parseEventLine(line, event) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return;
    
    const key = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);
    
    const baseKey = key.split(';')[0];
    
    switch (baseKey) {
      case 'DTSTART':
        event.dtstart = this.parseDate(value);
        break;
      case 'DTEND':
        event.dtend = this.parseDate(value);
        break;
      case 'SUMMARY':
        event.summary = this.unescapeText(value);
        break;
      case 'DESCRIPTION':
        event.description = this.unescapeText(value);
        break;
      case 'RRULE':
        event.rrule = this.parseRRule(value);
        break;
      case 'LOCATION':
        event.location = this.unescapeText(value);
        break;
    }
  },
  
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    if (dateStr.includes('T')) {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(9, 11)) || 0;
      const minute = parseInt(dateStr.substring(11, 13)) || 0;
      const second = parseInt(dateStr.substring(13, 15)) || 0;
      
      if (dateStr.endsWith('Z')) {
        return new Date(Date.UTC(year, month, day, hour, minute, second));
      }
      return new Date(year, month, day, hour, minute, second);
    } else {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    }
  },
  
  parseRRule(rruleStr) {
    const rrule = {};
    const parts = rruleStr.split(';');
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      switch (key) {
        case 'FREQ':
          rrule.freq = value.toLowerCase();
          break;
        case 'COUNT':
          rrule.count = parseInt(value);
          break;
        case 'INTERVAL':
          rrule.interval = parseInt(value);
          break;
        case 'UNTIL':
          rrule.until = this.parseDate(value);
          break;
        case 'BYDAY':
          rrule.byday = value.split(',');
          break;
      }
    }
    
    return rrule;
  },
  
  unescapeText(text) {
    if (!text) return '';
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  },
  
  parseEvent(event) {
    if (!event.dtstart) return null;
    
    const result = {
      title: event.summary || '无标题',
      description: event.description || '',
      startDate: event.dtstart,
      endDate: event.dtend || new Date(event.dtstart.getTime() + 60 * 60 * 1000),
      location: event.location || '',
      rrule: event.rrule
    };
    
    if (event.rrule) {
      const occurrences = this.expandRRule(event);
      return occurrences.map(occ => ({
        ...result,
        startDate: occ,
        endDate: new Date(occ.getTime() + (result.endDate.getTime() - result.startDate.getTime()))
      }));
    }
    
    return result;
  },
  
  expandRRule(event) {
    const occurrences = [];
    const rrule = event.rrule;
    const startDate = event.dtstart;
    const endDate = event.dtend || new Date(startDate.getTime() + 60 * 60 * 1000);
    const duration = endDate.getTime() - startDate.getTime();
    
    let count = rrule.count || 52;
    let until = rrule.until || new Date(startDate.getTime() + count * 7 * 24 * 60 * 60 * 1000);
    let interval = rrule.interval || 1;
    
    let freq = rrule.freq;
    if (freq === 'daily') {
      for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i * interval);
        if (date <= until) {
          occurrences.push(date);
        }
      }
    } else if (freq === 'weekly') {
      for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i * 7 * interval);
        if (date <= until) {
          occurrences.push(date);
        }
      }
    } else if (freq === 'monthly') {
      for (let i = 0; i < count; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i * interval);
        if (date <= until) {
          occurrences.push(date);
        }
      }
    } else {
      occurrences.push(startDate);
    }
    
    return occurrences.slice(0, 100);
  },
  
  parseFromUrl(url) {
    return fetch(url)
      .then(response => response.text())
      .then(content => this.parse(content));
  },
  
  convertToCourse(icsEvent, courseDefaults = {}) {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    const dayOfWeek = icsEvent.startDate.getDay();
    const startTime = this.formatTime(icsEvent.startDate);
    const endTime = this.formatTime(icsEvent.endDate);
    
    return {
      name: icsEvent.title,
      startTime: courseDefaults.startTime || startTime,
      endTime: courseDefaults.endTime || endTime,
      startDate: icsEvent.startDate.toISOString(),
      frequency: courseDefaults.frequency || 'weekly',
      repeatCount: courseDefaults.repeatCount || 16,
      dayOfWeek: dayOfWeek,
      lessons: [],
      importedFrom: 'ics',
      originalDescription: icsEvent.description
    };
  },
  
  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ICSParser;
}
