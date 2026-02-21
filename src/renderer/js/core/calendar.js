(function() {
  'use strict';

  let currentDate = new Date();
  let currentView = 'month';

  function setCurrentDate(date) {
    currentDate = date;
  }

  function getCurrentDate() {
    return currentDate;
  }

  function setCurrentView(view) {
    currentView = view;
  }

  function getCurrentView() {
    return currentView;
  }

  function getCoursesForDate(date) {
    const courses = window.AppStorage.getCoursesData();
    const result = [];
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    courses.forEach(course => {
      const timelineItem = window.Timeline ? window.Timeline.getForDate(course, targetDate) : null;
      if (timelineItem) {
        result.push({
          name: course.name,
          status: 'timeline',
          problem: timelineItem.label || '时间轴标注',
          isTimeline: true,
          timelineType: timelineItem.type
        });
      }

      course.lessons.forEach((lesson, index) => {
        if (lesson.date) {
          const lessonDate = new Date(lesson.date);
          lessonDate.setHours(0, 0, 0, 0);

          if (lessonDate.getTime() === targetDate.getTime()) {
            result.push({
              name: course.name,
              status: lesson.status,
              problem: lesson.problem,
              isTimeline: false
            });
          }
        } else {
          const dayOfWeek = date.getDay();
          if (course.dayOfWeek === dayOfWeek) {
            const startDate = course.startDate ? new Date(course.startDate) : new Date();
            startDate.setHours(0, 0, 0, 0);

            let expectedLessonDate = new Date(startDate);

            switch (course.frequency || 'weekly') {
              case 'daily':
                expectedLessonDate.setDate(startDate.getDate() + index);
                break;
              case 'weekly':
                expectedLessonDate.setDate(startDate.getDate() + (index * 7));
                break;
              case 'biweekly':
                expectedLessonDate.setDate(startDate.getDate() + (index * 14));
                break;
              case 'monthly':
                expectedLessonDate.setMonth(startDate.getMonth() + index);
                break;
            }

            expectedLessonDate.setHours(0, 0, 0, 0);

            if (expectedLessonDate.getTime() === targetDate.getTime()) {
              result.push({
                name: course.name,
                status: lesson.status,
                problem: lesson.problem,
                isTimeline: false
              });
            }
          }
        }
      });
    });

    return result;
  }

  function renderCalendar() {
    const calendar = document.getElementById('calendar') || document.getElementById('calendar-week-view');
    if (!calendar) return;
    
    if (calendar.id !== 'calendar') {
      calendar.id = 'calendar';
    }
    const currentMonthEl = document.getElementById('currentMonth');

    if (currentView === 'week') {
      renderWeekView(calendar, currentMonthEl);
      return;
    }

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    currentMonthEl.textContent = `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`;

    calendar.innerHTML = '';
    calendar.className = 'calendar month-view';
    calendar.id = 'calendar';
    calendar.style.gridTemplateRows = 'auto repeat(6, 1fr)';

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-week-header';
    weekDays.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'calendar-header-day';
      dayHeader.textContent = day;
      headerRow.appendChild(dayHeader);
    });
    calendar.appendChild(headerRow);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);

      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';

      if (day.getMonth() !== month) {
        dayEl.classList.add('other-month');
      }

      const dayOfWeek = day.getDay();
      if (dayOfWeek === 0) {
        dayEl.classList.add('sunday');
      } else if (dayOfWeek === 6) {
        dayEl.classList.add('saturday');
      }

      const today = new Date();
      if (day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear()) {
        dayEl.classList.add('today');
      }

      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = day.getDate();
      dayEl.appendChild(dayNumber);

      const courseEvents = document.createElement('div');
      courseEvents.className = 'course-events';

      const dayCourses = getCoursesForDate(day);
      dayCourses.forEach(courseEvent => {
        const eventEl = document.createElement('div');

        if (courseEvent.isTimeline) {
          eventEl.className = `course-event timeline timeline-${courseEvent.timelineType}`;
          const eventContent = document.createElement('span');
          eventContent.className = 'course-event-text';
          eventContent.textContent = courseEvent.problem;
          eventEl.appendChild(eventContent);
        } else {
          eventEl.className = `course-event ${courseEvent.status}`;
          const eventContent = document.createElement('span');
          eventContent.className = 'course-event-text';
          eventContent.textContent = courseEvent.name;
          eventEl.appendChild(eventContent);

          if (courseEvent.status === 'problematic' && courseEvent.problem) {
            eventEl.classList.add('has-problem');
          }
        }

        courseEvents.appendChild(eventEl);
      });

      dayEl.appendChild(courseEvents);
      calendar.appendChild(dayEl);
    }
  }

  function renderWeekView(calendar, currentMonthEl) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    currentMonthEl.textContent = `${currentWeekStart.getMonth() + 1}月 ${currentWeekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月 ${weekEnd.getDate()}日`;

    calendar.innerHTML = '';
    calendar.className = 'calendar week-view';
    calendar.id = 'calendar-week-view';

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    for (let i = 0; i < 8; i++) {
      const headerCell = document.createElement('div');
      headerCell.className = 'calendar-header-day';
      if (i === 0) {
        headerCell.classList.add('time-column');
        headerCell.textContent = '时间';
      } else {
        const dayIndex = i - 1;
        const weekDate = new Date(currentWeekStart);
        weekDate.setDate(currentWeekStart.getDate() + dayIndex);
        headerCell.innerHTML = `<span class="week-day-name">${weekDays[dayIndex]}</span><span class="week-day-date">${weekDate.getDate()}</span>`;
        if (weekDate.getDate() === today.getDate() && weekDate.getMonth() === today.getMonth() && weekDate.getFullYear() === today.getFullYear()) {
          headerCell.classList.add('today');
        }
      }
      headerCell.style.gridRow = '1';
      headerCell.style.gridColumn = String(i + 1);
      calendar.appendChild(headerCell);
    }

    for (let hour = 6; hour <= 22; hour++) {
      const rowIndex = hour - 6 + 2;
      
      const timeCell = document.createElement('div');
      timeCell.className = 'calendar-time-cell time-column';
      timeCell.textContent = `${hour}:00`;
      timeCell.style.gridRow = String(rowIndex);
      timeCell.style.gridColumn = '1';
      calendar.appendChild(timeCell);

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell';
        
        const cellDate = new Date(currentWeekStart);
        cellDate.setDate(currentWeekStart.getDate() + dayIndex);

        if (cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear()) {
          dayCell.classList.add('today');
        }

        if (dayIndex === 0) {
          dayCell.classList.add('sunday');
        } else if (dayIndex === 6) {
          dayCell.classList.add('saturday');
        }

        dayCell.style.gridRow = String(rowIndex);
        dayCell.style.gridColumn = String(dayIndex + 2);
        dayCell.style.height = '50px';
        dayCell.style.boxSizing = 'border-box';

        calendar.appendChild(dayCell);
      }
    }

    const courses = window.AppStorage.getCoursesData();
    calendar.style.position = 'relative';
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const cellDate = new Date(currentWeekStart);
      cellDate.setDate(currentWeekStart.getDate() + dayIndex);
      const dayCourses = getCoursesForDate(cellDate);
      
      const sortedCourses = dayCourses
        .map(courseEvent => {
          const course = courses.find(c => c.name === courseEvent.name);
          if (!course || !course.startTime || !course.endTime) return null;
          const [startHour, startMinute] = course.startTime.split(':').map(Number);
          const [endHour, endMinute] = course.endTime.split(':').map(Number);
          return {
            courseEvent,
            course,
            startHour,
            startMinute,
            endHour,
            endMinute,
            startTime: startHour + startMinute / 60,
            endTime: endHour + endMinute / 60
          };
        })
        .filter(c => c !== null && c.startHour >= 6 && c.startHour <= 22)
        .sort((a, b) => a.startTime - b.startTime);
      
      const columns = [];
      sortedCourses.forEach(item => {
        let columnIndex = 0;
        for (let i = 0; i < columns.length; i++) {
          if (item.startTime >= columns[i]) {
            columnIndex = i;
            break;
          }
          columnIndex = i + 1;
        }
        columns[columnIndex] = item.endTime;
        
        const durationHours = item.endTime - item.startTime;
        const topOffset = (item.startMinute / 60) * 50;
        const startRow = item.startHour - 6 + 2;
        const dayColumn = dayIndex + 2;
        
        const totalColumns = columns.length;
        const widthPercent = 100 / totalColumns;
        
        const eventEl = document.createElement('div');
        eventEl.className = `week-course-event ${item.courseEvent.status}`;
        eventEl.style.position = 'absolute';
        eventEl.style.gridRowStart = String(startRow);
        eventEl.style.gridColumnStart = String(dayColumn);
        eventEl.style.gridColumnEnd = `span 1`;
        eventEl.style.top = `${topOffset}px`;
        eventEl.style.height = `${Math.max(durationHours * 50, 20)}px`;
        eventEl.style.width = `calc(${widthPercent}% - 8px)`;
        eventEl.style.left = `${columnIndex * widthPercent}%`;
        eventEl.style.margin = '2px 4px';
        eventEl.style.zIndex = '20';
        
        const location = item.course.location || '未知地点';
        const teacher = item.course.teacher || '未知教师';
        eventEl.title = `${item.course.name}\n时间: ${item.course.startTime} - ${item.course.endTime}\n地点: ${location}\n教师: ${teacher}`;
          
        const eventContent = document.createElement('div');
          eventContent.className = 'week-course-content';

          const eventName = document.createElement('span');
          eventName.className = 'week-course-name';
          eventName.textContent = item.course.name;

          const eventTime = document.createElement('span');
          eventTime.className = 'week-course-time';
          eventTime.textContent = `${item.course.startTime} - ${item.course.endTime}`;

          eventContent.appendChild(eventName);
          eventContent.appendChild(eventTime);
          eventEl.appendChild(eventContent);

          if (item.courseEvent.status === 'problematic' && item.courseEvent.problem) {
            eventEl.classList.add('has-problem');
          }

          calendar.appendChild(eventEl);
      });
    }

    const nowIndicator = document.createElement('div');
    nowIndicator.className = 'now-indicator';
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour >= 6 && currentHour <= 22) {
      const topPosition = (currentHour - 6 + currentMinute / 60) * 50 + 50;
      nowIndicator.style.top = `${topPosition}px`;
      nowIndicator.style.zIndex = '30';
      
      const nowDot = document.createElement('div');
      nowDot.className = 'now-dot';
      nowIndicator.appendChild(nowDot);
      
      calendar.appendChild(nowIndicator);
    }

    requestAnimationFrame(() => {
      const scrollToPosition = (currentHour - 6 + currentMinute / 60) * 50;
      calendar.scrollTop = Math.max(0, scrollToPosition - 200);
    });
  }

  function initCalendarEvents() {
    document.getElementById('prevMonth').addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        renderCalendar();
      });
    });
  }

  window.Calendar = {
    render: renderCalendar,
    renderWeekView,
    getCoursesForDate,
    initCalendarEvents,
    setCurrentDate,
    getCurrentDate,
    setCurrentView,
    getCurrentView
  };
})();
