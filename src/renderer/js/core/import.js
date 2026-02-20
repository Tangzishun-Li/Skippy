(function() {
  'use strict';

  const googleImportForm = document.getElementById('googleImportForm');
  const icsImportForm = document.getElementById('icsImportForm');
  const googleImportResult = document.getElementById('googleImportResult');
  const icsImportResult = document.getElementById('icsImportResult');
  const importTabs = document.querySelectorAll('.import-tab');
  const googlePanel = document.getElementById('googlePanel');
  const icsPanel = document.getElementById('icsPanel');

  async function handleGoogleImport(e) {
    e.preventDefault();

    const calendarUrl = document.getElementById('googleCalendarUrl').value.trim();
    const submitBtn = googleImportForm.querySelector('button[type="submit"]');

    googleImportResult.className = 'loading';
    googleImportResult.textContent = '正在获取日历数据...';
    googleImportResult.style.display = 'block';

    submitBtn.disabled = true;

    try {
      const icsContent = await fetchGoogleCalendar(calendarUrl);
      const events = parseICS(icsContent);

      if (events.length === 0) {
        throw new Error('未找到任何日历事件');
      }

      const importedCourses = convertEventsToCourses(events);

      const courses = window.AppStorage.getCoursesData();
      const updatedCourses = [...courses, ...importedCourses];
      window.AppStorage.setCoursesData(updatedCourses);
      window.AppStorage.saveCourses();

      if (window.CourseManager) {
        window.CourseManager.renderCourses();
      }
      if (window.Calendar) {
        window.Calendar.render();
      }

      googleImportResult.className = 'success';
      googleImportResult.innerHTML = `<strong>导入成功！</strong><br>成功导入 ${importedCourses.length} 个课程/事件`;
      googleImportForm.reset();

      if (window.Toast) {
        window.Toast.show(`成功导入 ${importedCourses.length} 个课程`);
      }
    } catch (error) {
      googleImportResult.className = 'error';
      googleImportResult.textContent = '导入失败: ' + error.message;
    } finally {
      submitBtn.disabled = false;
    }
  }

  function handleICSImport(e) {
    e.preventDefault();

    const icsFile = document.getElementById('icsFile').files[0];
    const submitBtn = icsImportForm.querySelector('button[type="submit"]');

    if (!icsFile) {
      icsImportResult.className = 'error';
      icsImportResult.textContent = '请选择ICS文件';
      icsImportResult.style.display = 'block';
      return;
    }

    icsImportResult.className = 'loading';
    icsImportResult.textContent = '正在解析文件...';
    icsImportResult.style.display = 'block';

    submitBtn.disabled = true;

    const reader = new FileReader();

    reader.onload = function(event) {
      try {
        const icsContent = event.target.result;
        const events = parseICS(icsContent);

        if (events.length === 0) {
          throw new Error('未找到任何日历事件');
        }

        const importedCourses = convertEventsToCourses(events);

        const courses = window.AppStorage.getCoursesData();
        const updatedCourses = [...courses, ...importedCourses];
        window.AppStorage.setCoursesData(updatedCourses);
        window.AppStorage.saveCourses();

        if (window.CourseManager) {
          window.CourseManager.renderCourses();
        }
        if (window.Calendar) {
          window.Calendar.render();
        }

        icsImportResult.className = 'success';
        icsImportResult.innerHTML = `<strong>导入成功！</strong><br>成功导入 ${importedCourses.length} 个课程/事件`;
        icsImportForm.reset();

        if (window.Toast) {
          window.Toast.show(`成功导入 ${importedCourses.length} 个课程`);
        }
      } catch (error) {
        icsImportResult.className = 'error';
        icsImportResult.textContent = '解析失败: ' + error.message;
      } finally {
        submitBtn.disabled = false;
      }
    };

    reader.onerror = function() {
      icsImportResult.className = 'error';
      icsImportResult.textContent = '文件读取失败';
      submitBtn.disabled = false;
    };

    reader.readAsText(icsFile);
  }

  async function fetchGoogleCalendar(calendarUrl) {
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(calendarUrl);
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error('无法获取日历数据，请检查链接是否正确');
    }
    return await response.text();
  }

  function parseICS(icsContent) {
    const events = [];
    const lines = icsContent.split(/\r\n|\n|\r/);
    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent) {
          events.push(currentEvent);
          currentEvent = null;
        }
      } else if (currentEvent) {
        if (line.startsWith('DTSTART')) {
          currentEvent.start = parseICSDate(line);
        } else if (line.startsWith('DTEND')) {
          currentEvent.end = parseICSDate(line);
        } else if (line.startsWith('SUMMARY')) {
          currentEvent.summary = line.substring(8);
        } else if (line.startsWith('DESCRIPTION')) {
          currentEvent.description = line.substring(12);
        } else if (line.startsWith('RRULE')) {
          currentEvent.rrule = parseRRule(line);
        }
      }
    }

    return events;
  }

  function parseICSDate(line) {
    const match = line.match(/(\d{8}T\d{6}Z)/);
    if (match) {
      const dateStr = match[1];
      return new Date(
        parseInt(dateStr.substring(0, 4)),
        parseInt(dateStr.substring(4, 6)) - 1,
        parseInt(dateStr.substring(6, 8)),
        parseInt(dateStr.substring(9, 11)),
        parseInt(dateStr.substring(11, 13)),
        parseInt(dateStr.substring(13, 15))
      );
    }
    return null;
  }

  function parseRRule(line) {
    const rrule = {};
    const parts = line.substring(6).split(';');
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key === 'FREQ') rrule.freq = value.toLowerCase();
      if (key === 'COUNT') rrule.count = parseInt(value);
      if (key === 'INTERVAL') rrule.interval = parseInt(value);
      if (key === 'BYDAY') rrule.byday = value;
    });
    return rrule;
  }

  function convertEventsToCourses(events) {
    const coursesMap = new Map();

    events.forEach(event => {
      if (!event.start || !event.summary) return;

      const courseName = event.summary;

      if (!coursesMap.has(courseName)) {
        const startDate = new Date(event.start);
        const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000);

        const startTime = window.DateUtils.formatTime(startDate);
        const endTime = window.DateUtils.formatTime(endDate);

        const frequency = event.rrule ? mapRRuleFrequency(event.rrule) : 'weekly';
        const repeatCount = event.rrule && event.rrule.count ? event.rrule.count : 16;

        coursesMap.set(courseName, {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: courseName,
          startTime: startTime,
          endTime: endTime,
          startDate: startDate.toISOString(),
          frequency: frequency,
          repeatCount: repeatCount,
          dayOfWeek: startDate.getDay(),
          lessons: [],
          timeline: []
        });
      }

      const course = coursesMap.get(courseName);
      course.lessons.push({
        week: course.lessons.length + 1,
        date: event.start.toISOString(),
        status: '',
        problem: ''
      });
    });

    return Array.from(coursesMap.values());
  }

  function mapRRuleFrequency(rrule) {
    if (!rrule || !rrule.freq) return 'weekly';

    switch (rrule.freq) {
      case 'daily':
        return 'daily';
      case 'weekly':
        return 'weekly';
      case 'biweekly':
        return 'biweekly';
      case 'monthly':
        return 'monthly';
      default:
        return 'weekly';
    }
  }

  function initImportEvents() {
    importTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        importTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (tabName === 'google') {
          googlePanel.style.display = 'block';
          icsPanel.style.display = 'none';
        } else if (tabName === 'ics') {
          googlePanel.style.display = 'none';
          icsPanel.style.display = 'block';
        }
      });
    });

    if (googleImportForm) {
      googleImportForm.addEventListener('submit', handleGoogleImport);
    }

    if (icsImportForm) {
      icsImportForm.addEventListener('submit', handleICSImport);
    }
  }

  window.ImportModule = {
    handleGoogleImport,
    handleICSImport,
    convertEventsToCourses,
    fetchGoogleCalendar,
    parseICS,
    initEvents: initImportEvents
  };
})();
