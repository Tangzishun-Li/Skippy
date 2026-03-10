(function() {
  'use strict';

  let currentDate = new Date();
  let currentView = 'month';
  let calendarInstance = null;
  let miniCalendarInstance = null;
  let showPopup = false;
  let popupPos = { x: 0, y: 0 };
  let draftEvent = null;
  let eventTitle = '';
  let currentZoom = 100;

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
    const courses = window.AppStorage ? window.AppStorage.getCoursesData() : [];
    if (!courses || !Array.isArray(courses)) return [];
    
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

      if (!course.lessons || !Array.isArray(course.lessons)) return;
      
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

  async function loadEventsFromDatabase() {
    try {
      if (window.electronAPI?.db?.getEvents) {
        const dbEvents = await window.electronAPI.db.getEvents();
        if (dbEvents && Array.isArray(dbEvents) && dbEvents.length > 0) {
          return dbEvents.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            backgroundColor: event.backgroundColor || '#4285F4',
            borderColor: event.borderColor || '#4285F4'
          }));
        }
      }
    } catch (err) {
      console.error('[Calendar] Failed to load events from database:', err);
    }
    return [];
  }

  function getEventsForFullCalendar() {
    return loadEventsFromDatabase().then(dbEvents => {
      if (dbEvents && dbEvents.length > 0) {
        return dbEvents;
      }
      
      const courses = window.AppStorage ? window.AppStorage.getCoursesData() : [];
      if (!courses || !Array.isArray(courses)) return [];
      
      const events = [];
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      courses.forEach(course => {
        if (!course.startTime || !course.endTime) return;
        
        const [startHour, startMinute] = course.startTime.split(':').map(Number);
        const [endHour, endMinute] = course.endTime.split(':').map(Number);

        const dayOfWeek = course.dayOfWeek !== undefined ? course.dayOfWeek : now.getDay();
        
        for (let week = 0; week < 16; week++) {
          const lessonDate = new Date(today);
          lessonDate.setDate(today.getDate() + (dayOfWeek - today.getDay()) + (week * 7));
          lessonDate.setHours(startHour, startMinute, 0);

          const endDate = new Date(lessonDate);
          endDate.setHours(endHour, endMinute, 0);

          if (lessonDate < now) continue;

          events.push({
            id: `${course.id}-${week}`,
            title: course.name,
            start: lessonDate.toISOString(),
            end: endDate.toISOString(),
            backgroundColor: course.status === 'ddl' ? '#ea4335' : '#4285F4',
            borderColor: course.status === 'ddl' ? '#ea4335' : '#4285F4',
            extendedProps: {
              course: course,
              status: course.status
            }
          });
        }
      });

      return events;
    });
  }

  async function initFullCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || typeof FullCalendar === 'undefined') {
      console.warn('[Calendar] FullCalendar not available');
      renderCalendar();
      return;
    }

    const calendarHeader = document.querySelector('.calendar-header');
    if (calendarHeader) {
      calendarHeader.style.display = 'none';
    }

    const events = await getEventsForFullCalendar();

    calendarInstance = new FullCalendar.Calendar(calendarEl, {
      initialView: currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth',
      locale: 'zh-cn',
      headerToolbar: false,
      buttonText: {
        today: '今天',
        month: '月',
        week: '周',
        day: '日'
      },
      editable: true,
      selectable: true,
      selectMirror: true,
      dayMaxEvents: true,
      slotMinTime: '06:00:00',
      slotMaxTime: '23:00:00',
      allDaySlot: false,
      events: events,
      select: handleDateSelect,
      unselect: handleUnselect,
      eventClick: handleEventClick,
      eventDrop: handleEventDrop,
      eventResize: handleEventResize,
      datesSet: handleDatesSet,
      height: '100%',
      contentHeight: '100%',
      scrollTime: '08:00:00',
      fixedWeekCount: false,
      showNonCurrentDates: true
    });

    calendarInstance.render();

    initMiniCalendar();
    setupCalendarToolbar();
    setupSidebarResize();
  }

  function initMiniCalendar() {
    const miniCalendarEl = document.getElementById('mini-calendar');
    if (!miniCalendarEl) {
      console.warn('[Calendar] Mini calendar element not found');
      return;
    }

    renderMiniCalendar(new Date());
  }

  function renderMiniCalendar(date) {
    const miniCalendarEl = document.getElementById('mini-calendar');
    if (!miniCalendarEl) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = `
      <div class="mini-calendar">
        <div class="mini-calendar-header">
          <button class="mini-calendar-prev" onclick="window.Calendar.navigateMiniCalendar(-1)">‹</button>
          <span class="mini-calendar-title">${year}年 ${monthNames[month]}</span>
          <button class="mini-calendar-next" onclick="window.Calendar.navigateMiniCalendar(1)">›</button>
        </div>
        <div class="mini-calendar-weekdays">
          ${weekDays.map(d => `<span>${d}</span>`).join('')}
        </div>
        <div class="mini-calendar-days">
    `;

    for (let i = 0; i < startDay; i++) {
      html += '<span class="mini-calendar-day empty"></span>';
    }

    for (let day = 1; day <= totalDays; day++) {
      const currentDate = new Date(year, month, day);
      currentDate.setHours(0, 0, 0, 0);
      
      let classes = 'mini-calendar-day';
      if (currentDate.getTime() === today.getTime()) {
        classes += ' today';
      }
      
      html += `<span class="${classes}" data-date="${year}-${month + 1}-${day}" onclick="window.Calendar.selectMiniCalendarDate('${year}-${month + 1}-${day}')">${day}</span>`;
    }

    html += `
        </div>
      </div>
    `;

    miniCalendarEl.innerHTML = html;
  }

  function navigateMiniCalendar(delta) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + delta);
    currentDate = date;
    renderMiniCalendar(date);
    if (calendarInstance) {
      calendarInstance.gotoDate(date);
    }
  }

  function selectMiniCalendarDate(dateStr) {
    const date = new Date(dateStr);
    currentDate = date;
    if (calendarInstance) {
      calendarInstance.gotoDate(date);
    }
    renderMiniCalendar(date);
  }

  function handleMiniCalendarChange(date) {
    currentDate = date;
    if (calendarInstance) {
      calendarInstance.gotoDate(date);
    }
    if (miniCalendarInstance) {
      miniCalendarInstance.value = date;
    }
  }

  function handleDatesSet(dateInfo) {
    currentDate = dateInfo.view.currentStart;
    currentView = dateInfo.view.type === 'timeGridWeek' ? 'week' : 
                  dateInfo.view.type === 'timeGridDay' ? 'day' : 'month';
    
    if (miniCalendarInstance) {
      miniCalendarInstance.value = dateInfo.view.currentStart;
    }
    
    updatePeriodDisplay();
  }

  function handleDateSelect(selectInfo) {
    const mouseX = selectInfo.jsEvent.clientX;
    const mouseY = selectInfo.jsEvent.clientY;

    const popupWidth = 300;
    const popupHeight = 180;
    const finalX = mouseX + popupWidth > window.innerWidth ? window.innerWidth - popupWidth - 20 : mouseX;
    const finalY = mouseY + popupHeight > window.innerHeight ? window.innerHeight - popupHeight - 20 : mouseY;

    popupPos = { x: finalX, y: finalY };
    draftEvent = selectInfo;
    eventTitle = '';
    showPopup = true;
    
    renderPopup();
  }

  function handleUnselect() {
    showPopup = false;
    removePopup();
  }

  function handleEventClick(clickInfo) {
    const newTitle = prompt('修改日程标题:', clickInfo.event.title);
    if (newTitle) {
      clickInfo.event.setProp('title', newTitle);
    }
  }

  function handleEventDrop(dropInfo) {
    console.log('[Calendar] Event dropped:', dropInfo.event.title, dropInfo.event.startStr);
  }

  function handleEventResize(resizeInfo) {
    console.log('[Calendar] Event resized:', resizeInfo.event.title);
  }

  function handleDatesSet(dateInfo) {
    currentDate = dateInfo.view.currentStart;
    currentView = dateInfo.view.type === 'timeGridWeek' ? 'week' : 'month';
    
    if (document.getElementById('mini-calendar')) {
      renderMiniCalendar(currentDate);
    }
    
    updatePeriodDisplay();
  }

  function updatePeriodDisplay() {
    const currentPeriodEl = document.getElementById('currentPeriod');
    if (!currentPeriodEl) return;

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    if (currentView === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      currentPeriodEl.textContent = `${weekStart.getMonth() + 1}月 ${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月 ${weekEnd.getDate()}日`;
    } else {
      currentPeriodEl.textContent = `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`;
    }
  }

  function renderPopup() {
    removePopup();

    if (!showPopup || !draftEvent) return;

    const popup = document.createElement('div');
    popup.id = 'event-popup-card';
    popup.className = 'event-popup-card';
    popup.style.position = 'absolute';
    popup.style.left = `${popupPos.x}px`;
    popup.style.top = `${popupPos.y}px`;
    popup.style.zIndex = '10000';

    const startDate = draftEvent.startStr ? new Date(draftEvent.startStr) : null;
    const endDate = draftEvent.endStr ? new Date(draftEvent.endStr) : null;
    
    const formatTime = (date) => {
      if (!date) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    popup.innerHTML = `
      <div class="popup-header">
        <span class="close-btn" id="popup-close">✕</span>
      </div>
      <div class="popup-body">
        <input 
          type="text" 
          id="popup-event-title"
          placeholder="添加课程或任务名称..." 
          value="${eventTitle}"
          autocomplete="off"
        />
        <div class="time-display">
          ${formatTime(startDate)} - ${formatTime(endDate)}
        </div>
      </div>
      <div class="popup-footer">
        <button class="save-btn" id="popup-save">保存</button>
      </div>
    `;

    document.body.appendChild(popup);

    document.getElementById('popup-close').addEventListener('click', closePopup);
    document.getElementById('popup-save').addEventListener('click', savePopupEvent);
    
    const input = document.getElementById('popup-event-title');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') savePopupEvent();
      if (e.key === 'Escape') closePopup();
    });
    
    setTimeout(() => input.focus(), 100);
  }

  function removePopup() {
    const existing = document.getElementById('event-popup-card');
    if (existing) {
      existing.remove();
    }
  }

  function closePopup() {
    showPopup = false;
    if (draftEvent && calendarInstance) {
      calendarInstance.unselect();
    }
    removePopup();
  }

  function setupFCCreateButton() {
    const btn = document.getElementById('fc-create-btn');
    if (!btn) return;
    
    btn.onclick = function() {
      const today = new Date();
      const start = new Date(today);
      start.setHours(9, 0, 0, 0);
      const end = new Date(today);
      end.setHours(10, 0, 0, 0);
      
      popupPos = { 
        x: window.innerWidth / 2 - 150, 
        y: window.innerHeight / 2 - 100 
      };
      draftEvent = {
        startStr: start.toISOString(),
        endStr: end.toISOString(),
        allDay: false,
        view: { calendar: calendarInstance }
      };
      eventTitle = '';
      showPopup = true;
      renderPopup();
    };
  }

  function setupCalendarToolbar() {
    const todayBtn = document.getElementById('fc-today');
    const prevBtn = document.getElementById('fc-prev');
    const nextBtn = document.getElementById('fc-next');
    const periodEl = document.getElementById('current-period');
    const viewBtns = document.querySelectorAll('.view-btn');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomLevelEl = document.getElementById('zoom-level');

    if (!todayBtn || !prevBtn || !nextBtn || !periodEl) return;

    todayBtn.onclick = function() {
      if (calendarInstance) {
        calendarInstance.today();
      }
    };

    prevBtn.onclick = function() {
      if (calendarInstance) {
        calendarInstance.prev();
      }
    };

    nextBtn.onclick = function() {
      if (calendarInstance) {
        calendarInstance.next();
      }
    };

    viewBtns.forEach(btn => {
      btn.onclick = function() {
        if (!calendarInstance) return;
        
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const view = btn.dataset.view;
        if (view === 'month') {
          calendarInstance.changeView('dayGridMonth');
        } else if (view === 'week') {
          calendarInstance.changeView('timeGridWeek');
        } else if (view === 'day') {
          calendarInstance.changeView('timeGridDay');
        }
      };
    });

    if (zoomInBtn && zoomOutBtn && zoomLevelEl) {
      zoomInBtn.onclick = function() {
        if (currentZoom < 200) {
          currentZoom += 10;
          applyZoom();
        }
      };

      zoomOutBtn.onclick = function() {
        if (currentZoom > 50) {
          currentZoom -= 10;
          applyZoom();
        }
      };

      function applyZoom() {
        const calendarApp = document.getElementById('calendarApp');
        if (calendarApp) {
          calendarApp.style.transform = `scale(${currentZoom / 100})`;
          // 调整容器高度以适应缩放
          const scale = currentZoom / 100;
          calendarApp.style.height = `${100 / scale}%`;
        }
        zoomLevelEl.textContent = currentZoom + '%';
      }
    }
  }

  function setupSidebarResize() {
    const sidebar = document.getElementById('sidebar');
    const resizeHandle = document.getElementById('sidebar-resize-handle');
    
    if (!sidebar || !resizeHandle) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', function(e) {
      isResizing = true;
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;
      
      const diff = e.clientX - startX;
      const newWidth = startWidth + diff;
      
      if (newWidth >= 200 && newWidth <= 400) {
        sidebar.style.width = newWidth + 'px';
      }
    });

    document.addEventListener('mouseup', function() {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  function savePopupEvent() {
    const input = document.getElementById('popup-event-title');
    if (!input || !input.value.trim() || !draftEvent) {
      closePopup();
      return;
    }

    const newEvent = {
      id: `skippy_${Date.now()}`,
      title: input.value.trim(),
      start: draftEvent.startStr,
      end: draftEvent.endStr,
      allDay: draftEvent.allDay || false,
      backgroundColor: '#4285F4',
      borderColor: '#4285F4'
    };

    if (calendarInstance) {
      calendarInstance.addEvent(newEvent);
    }

    if (window.electronAPI?.db?.addEvent) {
      window.electronAPI.db.addEvent({
        id: newEvent.id,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        allDay: newEvent.allDay
      }).catch(err => console.error('[Calendar] Failed to save event to database:', err));
    }

    closePopup();
  }

  function renderCalendar() {
    if (typeof FullCalendar !== 'undefined') {
      if (!calendarInstance) {
        initFullCalendar().then(() => {
          setupFCCreateButton();
        });
      } else {
        setupFCCreateButton();
      }
      return;
    }

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
              
              window.AppStorage.setCoursesData(courses);
              window.AppStorage.saveCourses();
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

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDayOfWeek = now.getDay();
    const nowDate = now.getDate();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();
    
    const displayWeekStart = new Date(currentDate);
    displayWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const displayWeekEnd = new Date(displayWeekStart);
    displayWeekEnd.setDate(displayWeekStart.getDate() + 6);
    
    const isCurrentWeek = nowYear >= displayWeekStart.getFullYear() && 
                          nowYear <= displayWeekEnd.getFullYear() &&
                          nowMonth >= displayWeekStart.getMonth() && 
                          nowMonth <= displayWeekEnd.getMonth() &&
                          nowDate >= displayWeekStart.getDate() && 
                          nowDate <= displayWeekEnd.getDate();
    
    if (currentHour >= 6 && currentHour <= 22 && isCurrentWeek) {
      const gridColumn = currentDayOfWeek + 2;
       
      const nowDot = document.createElement('div');
      nowDot.className = 'now-dot';
      nowDot.style.gridColumn = `${gridColumn}`;
      
      calendar.appendChild(nowDot);
      
      requestAnimationFrame(() => {
        const scrollToPosition = (currentHour - 6 + currentMinute / 60) * 50;
        calendar.scrollTop = Math.max(0, scrollToPosition - 200);
      });
    }
  }

  function initCalendarEvents() {
    initNotifications();
    checkUpcomingCourses();
    initFAB();
    renderDDLTimeline();
    updatePeriodButtonText();
    
    document.getElementById('close-sidebar')?.addEventListener('click', closeTaskSidebar);
    
    document.getElementById('toggle-timeline')?.addEventListener('click', () => {
      const panel = document.getElementById('ddl-timeline-panel');
      if (panel) {
        panel.classList.toggle('show');
      }
    });
    
    document.getElementById('collapse-timeline')?.addEventListener('click', () => {
      const panel = document.getElementById('ddl-timeline-panel');
      if (panel) {
        panel.classList.toggle('collapsed');
        const btn = document.getElementById('collapse-timeline');
        btn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
      }
    });

    document.getElementById('open-settings')?.addEventListener('click', () => {
      const sidebar = document.getElementById('settings-sidebar');
      if (sidebar) {
        sidebar.classList.remove('hidden');
        setTimeout(() => sidebar.classList.add('show'), 10);
        if (typeof loadSettingsData === 'function') {
          loadSettingsData().catch(e => console.error('[Calendar] Load settings error:', e));
        }
      }
    });

    document.getElementById('close-settings-sidebar')?.addEventListener('click', () => {
      const sidebar = document.getElementById('settings-sidebar');
      if (sidebar) {
        sidebar.classList.remove('show');
        setTimeout(() => sidebar.classList.add('hidden'), 300);
      }
    });

    document.getElementById('notification-enabled')?.addEventListener('change', async (e) => {
      if (window.NotificationSettings && window.NotificationSettings.saveNotificationSettings) {
        await window.NotificationSettings.saveNotificationSettings({ enabled: e.target.checked });
      }
    });

    document.getElementById('notification-advance')?.addEventListener('change', async (e) => {
      if (window.NotificationSettings && window.NotificationSettings.saveNotificationSettings) {
        await window.NotificationSettings.saveNotificationSettings({ advanceMinutes: parseInt(e.target.value) });
      }
    });

    document.getElementById('notification-sound')?.addEventListener('change', async (e) => {
      if (window.NotificationSettings && window.NotificationSettings.saveNotificationSettings) {
        await window.NotificationSettings.saveNotificationSettings({ sound: e.target.checked });
      }
    });

    document.getElementById('test-notification')?.addEventListener('click', async () => {
      if (window.NotificationSettings && window.NotificationSettings.showTestNotification) {
        await window.NotificationSettings.showTestNotification();
      }
    });

    document.getElementById('mail-enabled')?.addEventListener('change', async (e) => {
      if (window.NotificationSettings && window.NotificationSettings.saveMailSettings) {
        window.NotificationSettings.saveMailSettings({ enabled: e.target.checked });
      }
    });

    document.getElementById('test-mail')?.addEventListener('click', async () => {
      const recipients = document.getElementById('mail-recipients').value;
      if (!recipients) {
        if (window.Toast) window.Toast.show('请先填写收件人');
        return;
      }
      if (window.NotificationSettings && window.NotificationSettings.sendTestMail) {
        const result = await window.NotificationSettings.sendTestMail(recipients);
        if (result.success) {
          if (window.Toast) window.Toast.show('测试邮件已发送');
        } else {
          if (window.Toast) window.Toast.show('发送失败: ' + result.error);
        }
      }
    });

    document.getElementById('save-sync')?.addEventListener('click', async () => {
      const url = document.getElementById('sync-url').value;
      const key = document.getElementById('sync-key').value;
      const enabled = document.getElementById('sync-enabled').checked;

      if (url && key) {
        if (window.SyncManager) {
          await window.SyncManager.setup(url, key);
          await window.SyncManager.enableSync(enabled);
          if (window.Toast) window.Toast.show('同步配置已保存');
          updateSyncStatus();
        }
      } else {
        if (window.Toast) window.Toast.show('请填写 Supabase 配置');
      }
    });
    
    // 旧的导航按钮已移除，使用 FullCalendar 自定义工具栏
    // prevPeriod 和 nextPeriod 按钮已在 HTML 中移除
    // view-btn 事件已在 setupCalendarToolbar 中处理
  }

  async function loadSettingsData() {
    if (!window.NotificationSettings || !window.NotificationSettings.loadSettings) {
      console.warn('[Calendar] NotificationSettings not available');
      return;
    }
    
    const settings = await window.NotificationSettings.loadSettings();
    
    if (settings.notification) {
      const enabledEl = document.getElementById('notification-enabled');
      const advanceEl = document.getElementById('notification-advance');
      const soundEl = document.getElementById('notification-sound');
      
      if (enabledEl) enabledEl.checked = settings.notification.enabled;
      if (advanceEl) advanceEl.value = settings.notification.advanceMinutes || 15;
      if (soundEl) soundEl.checked = settings.notification.sound;
    }
    
    if (settings.mail) {
      const mailEnabledEl = document.getElementById('mail-enabled');
      const hostEl = document.getElementById('mail-host');
      const portEl = document.getElementById('mail-port');
      const userEl = document.getElementById('mail-user');
      const recipientsEl = document.getElementById('mail-recipients');
      
      if (mailEnabledEl) mailEnabledEl.checked = settings.mail.enabled;
      if (hostEl) hostEl.value = settings.mail.host || '';
      if (portEl) portEl.value = settings.mail.port || 587;
      if (userEl) userEl.value = settings.mail.user || '';
      if (recipientsEl) recipientsEl.value = settings.mail.recipients ? settings.mail.recipients.join(', ') : '';
    }
    
    await updateSyncStatus();
  }

  async function updateSyncStatus() {
    if (!window.SyncManager) return;
    
    const status = await window.SyncManager.getStatus();
    const statusEl = document.getElementById('sync-status');
    if (statusEl) {
      if (status.signedIn) {
        statusEl.innerHTML = `<span class="status-connected">✓ 已连接: ${status.user?.email || '匿名'}</span>`;
      } else if (status.configured) {
        statusEl.innerHTML = `<span class="status-disconnected">⚠️ 已配置但未登录</span>`;
      } else {
        statusEl.innerHTML = `<span class="status-disconnected">未连接</span>`;
      }
    }
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
    
    if (sidebar.classList.contains('show') && sidebar.dataset.courseId === String(course.id)) {
      closeTaskSidebar();
      return;
    }
    
    document.getElementById('sidebar-title').textContent = course.name;
    sidebar.dataset.courseId = course.id;
    
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
      delete sidebar.dataset.courseId;
      setTimeout(() => sidebar.classList.add('hidden'), 300);
    }
  }

  function initNotifications() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  function checkUpcomingCourses() {
    try {
      setInterval(() => {
        try {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          if (!window.AppStorage || !window.AppStorage.getCoursesData) return;
          
          const courses = window.AppStorage.getCoursesData();
          if (!courses || !Array.isArray(courses)) return;
          
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
        } catch (e) {
          console.error('[Calendar] Check courses error:', e);
        }
      }, 60000);
    } catch (e) {
      console.error('[Calendar] Init checkUpcomingCourses error:', e);
    }
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
      window.AppStorage.setCoursesData(courses);
      window.AppStorage.saveCourses();

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
      container.innerHTML = `
        <div class="timeline-empty">
          <div class="empty-icon">📋</div>
          <p>暂无时间轴事件</p>
          <span>添加DDL事件后会显示在这里</span>
        </div>
      `;
      return;
    }

    container.innerHTML = ddls.map(ddl => {
      const diff = ddl.targetDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let countdownText = '';
      if (days > 0) countdownText = `<span class="countdown-value">${days} 天 ${hours} 小时</span>`;
      else if (hours > 0) countdownText = `<span class="countdown-value">${hours} 小时</span>`;
      else countdownText = `<span class="countdown-value urgent">即将截止！</span>`;

      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const month = ddl.targetDate.getMonth() + 1;
      const date = ddl.targetDate.getDate();

      return `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">${ddl.name}</div>
            <div class="timeline-time">📅 ${month}月${date}日 ${dayNames[ddl.dayOfWeek]} · ${ddl.startTime} - ${ddl.endTime}</div>
            <div class="timeline-countdown">
              <span class="countdown-label">⏱️ 倒计时</span>
              ${countdownText}
            </div>
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
    getCurrentView,
    refreshCalendar: function() {
      if (calendarInstance) {
        calendarInstance.refetchEvents();
      }
    },
    navigateMiniCalendar: navigateMiniCalendar,
    selectMiniCalendarDate: selectMiniCalendarDate
  };
})();
