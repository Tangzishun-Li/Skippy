(function() {
  'use strict';

  const VIEWBOX_SIZE = 800;
  const CENTER = VIEWBOX_SIZE / 2;
  const BASE_RADIUS = 260;
  const RING_THICKNESS = 30;

  const CATEGORY_COLORS = {
    course: { bar: '#4285F4', labelBg: '#e8f0fe', textColor: '#1a73e8' },
    task: { bar: '#34A853', labelBg: '#e6f4ea', textColor: '#137333' },
    personal: { bar: '#FBBC04', labelBg: '#fef7e0', textColor: '#b06100' }
  };

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  }

  function initRingView(container) {
    if (!container) return;
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' });
    
    let html = `
      <div class="ring-container">
        <div class="ring-annotation-layer" id="ring-annotations"></div>
        <svg viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}" class="ring-svg" id="ring-svg">
          <defs>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <text x="${CENTER}" y="${CENTER + 10}" text-anchor="middle" class="ring-core-date">${dateStr}</text>
          
          <circle cx="${CENTER}" cy="${CENTER}" r="${BASE_RADIUS}" 
            stroke-width="${RING_THICKNESS}" stroke="#f1f3f4" fill="none" 
            class="ring-base" id="ring-base"/>
          
          <g class="ring-ticks">
            ${Array.from({length: 24}).map((_, i) => {
              const angle = i * 15;
              const p1 = polarToCartesian(CENTER, CENTER, BASE_RADIUS + RING_THICKNESS / 2, angle);
              const p2 = polarToCartesian(CENTER, CENTER, BASE_RADIUS - RING_THICKNESS / 2, angle);
              const isMajor = i % 3 === 0;
              const labelPos = polarToCartesian(CENTER, CENTER, BASE_RADIUS - 45, angle);
              
              return `
                <g class="ring-tick-group" data-hour="${i}" style="cursor: pointer;">
                  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
                    stroke="${isMajor ? '#bdc1c6' : '#e0e0e0'}" 
                    stroke-width="${isMajor ? 2 : 1}"
                    class="ring-tick-line"/>
                  ${isMajor ? `
                    <text x="${labelPos.x}" y="${labelPos.y + 5}" text-anchor="middle" 
                      class="ring-time-number" pointer-events="none">${i === 0 ? '0' : i}</text>
                  ` : ''}
                  <rect x="${p1.x - 10}" y="${p1.y - 10}" width="20" height="20" 
                    fill="transparent" class="ring-tick-hitbox"/>
                </g>
              `;
            }).join('')}
          </g>
          
          <g class="ring-events" id="ring-events"></g>
          
          <g class="ring-lines" id="ring-lines"></g>
        </svg>
      </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('ring-base').addEventListener('click', handleRingClick);
    
    const tickGroups = document.querySelectorAll('.ring-tick-group');
    tickGroups.forEach(group => {
      group.addEventListener('click', function(e) {
        e.stopPropagation();
        const hour = parseInt(this.dataset.hour);
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        
        window.Calendar.showEventPopup({
          x: e.clientX,
          y: e.clientY,
          defaultTime: timeStr,
          defaultCategory: 'task',
          mode: 'create'
        });
      });
    });
    
    loadRingEvents();
  }

  function handleRingClick(e) {
    const svg = document.getElementById('ring-svg');
    const svgRect = svg.getBoundingClientRect();
    
    const scaleX = VIEWBOX_SIZE / svgRect.width;
    const scaleY = VIEWBOX_SIZE / svgRect.height;
    const clickX = (e.clientX - svgRect.left) * scaleX;
    const clickY = (e.clientY - svgRect.top) * scaleY;
    
    const dx = clickX - CENTER;
    const dy = clickY - CENTER;
    
    let theta = Math.atan2(dy, dx) * (180 / Math.PI);
    
    let standardAngle = theta + 90;
    if (standardAngle < 0) standardAngle += 360;
    
    const hour = Math.round(standardAngle / 15) % 24;
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    const innerRadius = BASE_RADIUS - RING_THICKNESS / 2;
    const outerRadius = BASE_RADIUS + RING_THICKNESS / 2;
    
    if (distance < innerRadius || distance > outerRadius) {
      return;
    }
    
    window.Calendar.showEventPopup({
      x: e.clientX,
      y: e.clientY,
      defaultTime: timeStr,
      defaultCategory: 'task',
      mode: 'create'
    });
  }

  function loadRingEvents() {
    const events = window.Calendar.getEvents ? window.Calendar.getEvents() : [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const todayEvents = events.filter(e => {
      const eventDate = e.start ? e.start.split('T')[0] : null;
      return eventDate === todayStr;
    });
    
    renderRingEvents(todayEvents);
  }

  function renderRingEvents(events) {
    const eventsGroup = document.getElementById('ring-events');
    const linesGroup = document.getElementById('ring-lines');
    const annotationsLayer = document.getElementById('ring-annotations');
    
    if (!eventsGroup || !linesGroup || !annotationsLayer) return;
    
    eventsGroup.innerHTML = '';
    linesGroup.innerHTML = '';
    annotationsLayer.innerHTML = '';
    
    const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));
    
    const processedEvents = sortedEvents.map(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      const startMins = startDate.getHours() * 60 + startDate.getMinutes();
      const endMins = endDate.getHours() * 60 + endDate.getMinutes();
      
      let startAngle = (startMins * (360 / 1440)) + 180;
      let endAngle = (endMins * (360 / 1440)) + 180;
      
      if (endAngle <= startAngle) endAngle += 360;
      
      const midAngle = (startAngle + endAngle) / 2;
      const anchorPoint = polarToCartesian(CENTER, CENTER, BASE_RADIUS + RING_THICKNESS / 2, midAngle);
      
      const timeStr = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
      
      return { ...event, startAngle, endAngle, midAngle, anchorPoint, timeStr };
    });
    
    let leftCount = 0;
    let rightCount = 0;
    
    processedEvents.forEach(event => {
      const isLeft = event.midAngle > 180 && event.midAngle < 360;
      const targetY = isLeft ? 80 + leftCount * 100 : 80 + rightCount * 100;
      const targetX = isLeft ? 30 : VIEWBOX_SIZE - 220;
      
      if (isLeft) leftCount++; else rightCount++;
      
      const breakPointX = isLeft ? CENTER - BASE_RADIUS - 80 : CENTER + BASE_RADIUS + 80;
      
      const colors = CATEGORY_COLORS[event.category || 'task'];
      const pathD = describeArc(CENTER, CENTER, BASE_RADIUS, event.startAngle, event.endAngle);
      
      const arcEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      arcEl.setAttribute('d', pathD);
      arcEl.setAttribute('stroke', colors.bar);
      arcEl.setAttribute('stroke-width', RING_THICKNESS);
      arcEl.setAttribute('fill', 'none');
      arcEl.setAttribute('stroke-linecap', 'round');
      arcEl.setAttribute('filter', 'url(#ring-glow)');
      arcEl.setAttribute('class', 'ring-event-arc');
      arcEl.dataset.eventId = event.id;
      arcEl.addEventListener('click', (e) => {
        e.stopPropagation();
        window.Calendar.showEventPopup({
          x: e.clientX,
          y: e.clientY,
          event: event,
          mode: 'edit'
        });
      });
      eventsGroup.appendChild(arcEl);
      
      const cardCenterY = targetY + 40;
      const cardSideX = isLeft ? targetX + 180 : targetX;
      
      const polylineEl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      const points = [
        `${event.anchorPoint.x},${event.anchorPoint.y}`,
        `${breakPointX},${event.anchorPoint.y}`,
        `${cardSideX},${cardCenterY}`
      ].join(' ');
      polylineEl.setAttribute('points', points);
      polylineEl.setAttribute('fill', 'none');
      polylineEl.setAttribute('stroke', colors.bar);
      polylineEl.setAttribute('stroke-width', '1');
      polylineEl.setAttribute('stroke-dasharray', '4 4');
      polylineEl.setAttribute('opacity', '0.6');
      linesGroup.appendChild(polylineEl);
      
      const cardEl = document.createElement('div');
      cardEl.className = 'ring-event-card';
      cardEl.style.left = `${targetX}px`;
      cardEl.style.top = `${targetY}px`;
      cardEl.style.backgroundColor = colors.labelBg;
      cardEl.style.borderLeft = `4px solid ${colors.bar}`;
      cardEl.style.color = colors.textColor;
      cardEl.innerHTML = `
        <div class="ring-card-time">${event.timeStr}</div>
        <div class="ring-card-title">${event.title}</div>
      `;
      cardEl.addEventListener('click', (e) => {
        e.stopPropagation();
        window.Calendar.showEventPopup({
          x: e.clientX,
          y: e.clientY,
          event: event,
          mode: 'edit'
        });
      });
      annotationsLayer.appendChild(cardEl);
    });
  }

  function refreshRingEvents() {
    loadRingEvents();
  }

  window.RingView = {
    init: initRingView,
    refresh: refreshRingEvents,
    render: renderRingEvents
  };
})();
