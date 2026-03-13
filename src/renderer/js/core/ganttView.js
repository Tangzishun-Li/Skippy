(function() {
  'use strict';

  const START_HOUR = 8;
  const END_HOUR = 23;
  const PIXELS_PER_MINUTE = 2;
  const HOUR_WIDTH = 60 * PIXELS_PER_MINUTE;

  const LANES = [
    { id: 'course', name: '📚 课程', color: '#e8f0fe', barColor: '#4285F4' },
    { id: 'task', name: '🎯 任务', color: '#e6f4ea', barColor: '#34A853' },
    { id: 'personal', name: '☕ 个人', color: '#fef7e0', barColor: '#FBBC04' }
  ];

  function initGanttView(container) {
    if (!container) return;
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    let html = `
      <div class="gantt-container">
        <div class="gantt-sidebar">
          <div class="gantt-sidebar-header">今日看板</div>
          ${LANES.map(lane => `
            <div class="gantt-lane-label" data-lane="${lane.id}">
              ${lane.name}
            </div>
          `).join('')}
        </div>
        <div class="gantt-content-wrapper">
          <div class="gantt-timeline-header">
            ${Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
              const hour = START_HOUR + i;
              return `<div class="gantt-time-tick" style="width: ${HOUR_WIDTH}px">
                <span class="tick-label">${hour}:00</span>
                <div class="tick-grid-line"></div>
              </div>`;
            }).join('')}
          </div>
          <div class="gantt-lanes-container">
            ${LANES.map(lane => `
              <div class="gantt-lane" data-lane="${lane.id}">
                <div class="gantt-lane-bg" style="width: ${(END_HOUR - START_HOUR) * HOUR_WIDTH}px" data-lane="${lane.id}"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    document.querySelectorAll('.gantt-lane-bg').forEach(bg => {
      bg.addEventListener('click', handleGanttLaneClick);
    });
    
    loadGanttEvents();
  }

  function handleGanttLaneClick(e) {
    const lane = e.currentTarget.dataset.lane;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    const totalMinutesClicked = Math.floor(clickX / PIXELS_PER_MINUTE);
    const absoluteMinutes = (START_HOUR * 60) + totalMinutesClicked;
    const roundedMinutes = Math.floor(absoluteMinutes / 15) * 15;
    
    const hour = Math.floor(roundedMinutes / 60);
    const minute = roundedMinutes % 60;
    
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    window.Calendar.showEventPopup({
      x: e.clientX,
      y: e.clientY,
      defaultTime: timeStr,
      defaultCategory: lane,
      mode: 'create'
    });
  }

  function loadGanttEvents() {
    const events = window.Calendar.getEvents ? window.Calendar.getEvents() : [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const todayEvents = events.filter(e => {
      const eventDate = e.start ? e.start.split('T')[0] : null;
      return eventDate === todayStr;
    });
    
    LANES.forEach(lane => {
      const laneEl = document.querySelector(`.gantt-lane[data-lane="${lane.id}"]`);
      if (!laneEl) return;
      
      const laneEvents = todayEvents.filter(e => (e.category || 'task') === lane.id);
      
      laneEvents.forEach(event => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
        const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
        
        const baseMinutes = START_HOUR * 60;
        
        const leftPx = (startMinutes - baseMinutes) * PIXELS_PER_MINUTE;
        const widthPx = (endMinutes - startMinutes) * PIXELS_PER_MINUTE;
        
        const eventEl = document.createElement('div');
        eventEl.className = 'gantt-event-block';
        eventEl.style.left = `${leftPx}px`;
        eventEl.style.width = `${Math.max(widthPx, 30)}px`;
        eventEl.style.backgroundColor = lane.barColor;
        eventEl.innerHTML = `<span class="event-title">${event.title}</span>`;
        eventEl.dataset.eventId = event.id;
        
        eventEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.Calendar.showEventPopup({
            x: e.clientX,
            y: e.clientY,
            event: event,
            mode: 'edit'
          });
        });
        
        laneEl.appendChild(eventEl);
      });
    });
  }

  function refreshGanttEvents() {
    document.querySelectorAll('.gantt-event-block').forEach(el => el.remove());
    loadGanttEvents();
  }

  function renderGantt(container, events) {
    if (!container) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayEvents = (events || []).filter(e => {
      const eventDate = e.start ? e.start.split('T')[0] : null;
      return eventDate === todayStr;
    });
    
    LANES.forEach(lane => {
      const laneEl = document.querySelector(`.gantt-lane[data-lane="${lane.id}"]`);
      if (!laneEl) return;
      
      const laneEvents = todayEvents.filter(e => (e.category || 'task') === lane.id);
      
      laneEvents.forEach(event => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
        const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
        
        const baseMinutes = START_HOUR * 60;
        
        const leftPx = (startMinutes - baseMinutes) * PIXELS_PER_MINUTE;
        const widthPx = (endMinutes - startMinutes) * PIXELS_PER_MINUTE;
        
        const existingEl = laneEl.querySelector(`[data-event-id="${event.id}"]`);
        if (existingEl) return;
        
        const eventEl = document.createElement('div');
        eventEl.className = 'gantt-event-block';
        eventEl.style.left = `${leftPx}px`;
        eventEl.style.width = `${Math.max(widthPx, 30)}px`;
        eventEl.style.backgroundColor = lane.barColor;
        eventEl.innerHTML = `<span class="event-title">${event.title}</span>`;
        eventEl.dataset.eventId = event.id;
        
        eventEl.addEventListener('click', (e) => {
          e.stopPropagation();
          window.Calendar.showEventPopup({
            x: e.clientX,
            y: e.clientY,
            event: event,
            mode: 'edit'
          });
        });
        
        laneEl.appendChild(eventEl);
      });
    });
  }

  window.GanttView = {
    init: initGanttView,
    refresh: refreshGanttEvents,
    render: renderGantt
  };
})();
