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
    const currentPeriodEl = document.getElementById('currentPeriod');

    if (currentView === 'week') {
      renderWeekView(calendar, currentPeriodEl);
      return;
    }

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    currentPeriodEl.textContent = `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`;

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

  function renderWeekView(calendar, currentPeriodEl) {
    const today = new Date();

    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    currentPeriodEl.textContent = `${currentWeekStart.getMonth() + 1}月 ${currentWeekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月 ${weekEnd.getDate()}日`;

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

        dayCell.addEventListener('dragover', (e) => {
          e.preventDefault();
          dayCell.style.background = 'rgba(94, 114, 228, 0.1)';
        });

        dayCell.addEventListener('dragleave', () => {
          dayCell.style.background = '';
        });

        dayCell.addEventListener('drop', (e) => {
          e.preventDefault();
          dayCell.style.background = '';
          
          try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const targetRow = parseInt(dayCell.style.gridRow);
            const newStartHour = targetRow - 2 + 6;
            
            const courses = window.AppStorage.getCoursesData();
            const courseIndex = courses.findIndex(c => c.name === data.courseName);
            
            if (courseIndex !== -1 && newStartHour >= 6 && newStartHour <= 22) {
              const course = courses[courseIndex];
              const [oldStartHour, oldStartMinute] = course.startTime.split(':').map(Number);
              const [oldEndHour, oldEndMinute] = course.endTime.split(':').map(Number);
              const duration = (oldEndHour + oldEndMinute / 60) - (oldStartHour + oldStartMinute / 60);
              
              const newStartTime = `${String(newStartHour).padStart(2, '0')}:${String(oldStartMinute).padStart(2, '0')}`;
              const newEndHour = Math.floor(newStartHour + duration);
              const newEndMinute = Math.round((newStartHour + duration - newEndHour) * 60);
              const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMinute).padStart(2, '0')}`;
              
              course.startTime = newStartTime;
              course.endTime = newEndTime;
              
              window.AppStorage.saveCoursesData(courses);
              renderCalendar();
            }
          } catch (err) {
            console.error('Drop error:', err);
          }
        });

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
        
        eventEl.addEventListener('mouseenter', (e) => {
          showTooltip(item.course, e.currentTarget);
        });
        
        eventEl.addEventListener('mouseleave', () => {
          hideTooltip();
        });
        
        eventEl.addEventListener('click', () => {
          openTaskSidebar(item.course);
        });
        
        eventEl.draggable = true;
        eventEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({
            courseName: item.course.name,
            originalDayIndex: dayIndex
          }));
          setTimeout(() => eventEl.style.opacity = '0.5', 0);
        });
        
        eventEl.addEventListener('dragend', () => {
          eventEl.style.opacity = '1';
        });
          
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
    initNotifications();
    checkUpcomingCourses();
    initFAB();
    renderDDLTimeline();
    updatePeriodButtonText();
    
    document.getElementById('close-sidebar')?.addEventListener('click', closeTaskSidebar);
    document.getElementById('export-ics')?.addEventListener('click', exportToICS);
    document.getElementById('toggle-timeline')?.addEventListener('click', () => {
      const panel = document.getElementById('ddl-timeline-panel');
      if (panel) {
        panel.classList.toggle('show');
      }
    });
    
    document.getElementById('prevPeriod').addEventListener('click', () => {
      if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() - 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() - 1);
      }
      renderCalendar();
    });

    document.getElementById('nextPeriod').addEventListener('click', () => {
      if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      renderCalendar();
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = btn.dataset.view;
        updatePeriodButtonText();
        renderCalendar();
      });
    });
  }

  function updatePeriodButtonText() {
    const prevBtn = document.getElementById('prevPeriod');
    const nextBtn = document.getElementById('nextPeriod');
    if (prevBtn && nextBtn) {
      if (currentView === 'week') {
        prevBtn.textContent = '⟪ 上一周';
        nextBtn.textContent = '下一周 ⟫';
      } else {
        prevBtn.textContent = '⟪ 上月';
        nextBtn.textContent = '下月 ⟫';
      }
    }
  }

  let tooltipEl = null;

  function showTooltip(course, targetElement) {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'calendar-tooltip';
      document.body.appendChild(tooltipEl);
    }

    const location = course.location || '未知地点';
    const teacher = course.teacher || '未知教师';

    tooltipEl.innerHTML = `
      <div class="tooltip-title">${course.name}</div>
      <div class="tooltip-row"><span class="tooltip-icon">🕒</span> ${course.startTime} - ${course.endTime}</div>
      <div class="tooltip-row"><span class="tooltip-icon">📍</span> ${location}</div>
      <div class="tooltip-row"><span class="tooltip-icon">👨‍🏫</span> ${teacher}</div>
    `;

    const rect = targetElement.getBoundingClientRect();
    
    let left = rect.right + 10;
    if (left + 220 > window.innerWidth) {
      left = rect.left - 230;
    }
    
    let top = rect.top;

    tooltipEl.style.left = `${left + window.scrollX}px`;
    tooltipEl.style.top = `${top + window.scrollY}px`;
    tooltipEl.classList.add('show');
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.classList.remove('show');
    }
  }

  function openTaskSidebar(course) {
    const sidebar = document.getElementById('task-sidebar');
    if (!sidebar) return;
    
    document.getElementById('sidebar-title').textContent = course.name;
    
    const location = course.location || '未知地点';
    const teacher = course.teacher || '未知教师';
    const time = course.startTime && course.endTime 
      ? `${course.startTime} - ${course.endTime}` 
      : '时间未设置';
    
    document.getElementById('sidebar-tasks').innerHTML = `
      <p><strong>🕒 时间：</strong>${time}</p>
      <p><strong>📍 地点：</strong>${location}</p>
      <p><strong>👨‍🏫 教师：</strong>${teacher}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
      <h4>待办事项</h4>
      <ul>
        <li><input type="checkbox"> 预习课程内容</li>
        <li><input type="checkbox"> 完成课后作业</li>
        <li><input type="checkbox"> 整理课堂笔记</li>
      </ul>
    `;
    
    sidebar.classList.remove('hidden');
    setTimeout(() => sidebar.classList.add('show'), 10);
  }

  function closeTaskSidebar() {
    const sidebar = document.getElementById('task-sidebar');
    if (sidebar) {
      sidebar.classList.remove('show');
      setTimeout(() => sidebar.classList.add('hidden'), 300);
    }
  }

  function initNotifications() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  function checkUpcomingCourses() {
    setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const courses = window.AppStorage.getCoursesData();
      const today = now.getDay();

      courses.forEach(course => {
        if (course.dayOfWeek === today && course.startTime) {
          const [startHour, startMinute] = course.startTime.split(':').map(Number);
          
          const minutesLeft = (startHour * 60 + startMinute) - (currentHour * 60 + currentMinute);
          
          if (minutesLeft === 15) {
            new Notification('Tody 提醒：准备上课啦！', {
              body: `你的【${course.name}】将在 15 分钟后开始。\n地点：${course.location || '未知'}`
            });
          }
        }
      });
    }, 60000);
  }

  function exportToICS() {
    const courses = window.AppStorage.getCoursesData();
    if (!courses || courses.length === 0) {
      alert('没有可导出的课程！');
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    let icsString = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tody App//ZH
CALSCALE:GREGORIAN
`;

    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    courses.forEach(course => {
      if (!course.startTime || !course.endTime) return;
      
      const [startHour, startMinute] = course.startTime.split(':').map(Number);
      const [endHour, endMinute] = course.endTime.split(':').map(Number);
      
      const dayOfWeek = course.dayOfWeek !== undefined ? course.dayOfWeek : 0;
      const recurDays = dayNames[dayOfWeek];
      
      const startTimeStr = `${dateStr}T${String(startHour).padStart(2, '0')}${String(startMinute).padStart(2, '0')}00`;
      const endTimeStr = `${dateStr}T${String(endHour).padStart(2, '0')}${String(endMinute).padStart(2, '0')}00`;

      icsString += 
`BEGIN:VEVENT
SUMMARY:${course.name}
DTSTART;VALUE=DATE-TIME:${startTimeStr}
DTEND;VALUE=DATE-TIME:${endTimeStr}
RRULE:FREQ=WEEKLY;BYDAY=${recurDays}
LOCATION:${course.location || ''}
DESCRIPTION:教师：${course.teacher || ''}
END:VEVENT
`;
    });

    icsString += `END:VCALENDAR`;

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my_courses.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function initFAB() {
    const fabBtn = document.getElementById('fab-add');
    const modal = document.getElementById('add-event-modal');
    const closeBtn = document.getElementById('close-modal');
    const saveBtn = document.getElementById('save-event-btn');

    if (!fabBtn || !modal) return;

    function updateFABVisibility() {
      const activeView = document.querySelector('.nav-btn.active')?.dataset.view;
      if (activeView === 'calendar') {
        fabBtn.style.display = 'flex';
      } else {
        fabBtn.style.display = 'none';
      }
    }

    fabBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('show'), 10);
    });

    closeBtn?.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => modal.classList.add('hidden'), 300);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
      }
    });

    saveBtn?.addEventListener('click', () => {
      const name = document.getElementById('event-name').value;
      const startTime = document.getElementById('event-start').value;
      const endTime = document.getElementById('event-end').value;
      const type = document.querySelector('input[name="event-type"]:checked')?.value || 'normal';

      if (!name || !startTime || !endTime) {
        alert('请填写完整信息');
        return;
      }

      const courses = window.AppStorage.getCoursesData() || [];
      const now = new Date();
      const dayOfWeek = now.getDay();

      const newCourse = {
        name,
        dayOfWeek,
        startTime,
        endTime,
        location: '',
        teacher: '',
        status: type === 'ddl' ? 'ddl' : 'normal'
      };

      courses.push(newCourse);
      window.AppStorage.saveCoursesData(courses);

      modal.classList.remove('show');
      setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('event-name').value = '';
        document.getElementById('event-start').value = '';
        document.getElementById('event-end').value = '';
      }, 300);

      renderCalendar();
      renderDDLTimeline();
    });
  }

  function renderDDLTimeline() {
    const container = document.getElementById('timeline-container');
    const panel = document.getElementById('ddl-timeline-panel');
    if (!container) return;

    const courses = window.AppStorage.getCoursesData() || [];
    const now = new Date();
    const today = now.getDay();

    const ddls = courses.filter(c => {
      if (c.status !== 'ddl') return false;
      const dayDiff = (c.dayOfWeek + 7 - today) % 7;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayDiff);
      return targetDate > now;
    }).map(c => {
      const dayDiff = (c.dayOfWeek + 7 - today) % 7;
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + dayDiff);
      const [hour, minute] = c.startTime.split(':').map(Number);
      targetDate.setHours(hour, minute, 0);
      return { ...c, targetDate, dayDiff };
    }).sort((a, b) => a.targetDate - b.targetDate);

    if (ddls.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#999;">暂无DDL</p>';
      return;
    }

    container.innerHTML = ddls.map(ddl => {
      const diff = ddl.targetDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let countdownText = '';
      if (days > 0) countdownText = `还剩 ${days} 天 ${hours} 小时`;
      else if (hours > 0) countdownText = `还剩 ${hours} 小时`;
      else countdownText = '即将截止！';

      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      return `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">${ddl.name}</div>
            <div class="timeline-time">${dayNames[ddl.dayOfWeek]} ${ddl.startTime} - ${ddl.endTime}</div>
            <div class="timeline-countdown">${countdownText}</div>
          </div>
        </div>
      `;
    }).join('');
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
