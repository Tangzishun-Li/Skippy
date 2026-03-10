(function() {
  'use strict';

  function switchView(view) {
    const calendarApp = document.getElementById('calendarApp');
    const courseListView = document.getElementById('courseListView');

    if (calendarApp) calendarApp.style.display = 'none';
    if (courseListView) courseListView.style.display = 'none';

    if (view === 'calendar') {
      if (calendarApp) calendarApp.style.display = 'flex';
    } else if (view === 'course-list') {
      if (courseListView) courseListView.style.display = 'block';
    }
  }

  function bindEventListeners() {
    const courseForm = document.getElementById('courseForm');

    if (courseForm) {
      courseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        window.CourseManager.addCourse(e);
      });
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        switchView(view);

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const fabBtn = document.getElementById('fab-add');
        if (fabBtn) {
          fabBtn.style.display = view === 'calendar' ? 'flex' : 'none';
        }
      });
    });

    const helpToggle = document.querySelector('.help-toggle');
    if (helpToggle) {
      helpToggle.addEventListener('click', () => {
        const helpContent = document.querySelector('.help-content');
        helpContent.classList.toggle('show');
      });
    }

    const tooltipClose = document.querySelector('.tooltip-close');
    if (tooltipClose) {
      tooltipClose.addEventListener('click', () => {
        const problemTooltip = document.getElementById('problemTooltip');
        problemTooltip.style.display = 'none';
      });
    }

    const editProblemBtn = document.getElementById('editProblem');
    if (editProblemBtn) {
      editProblemBtn.addEventListener('click', () => {
        const currentTooltipCourseId = window.AppStorage.loadFromStorage('currentTooltipCourseId');
        const currentTooltipLessonIndex = window.AppStorage.loadFromStorage('currentTooltipLessonIndex');
        if (currentTooltipCourseId && currentTooltipLessonIndex >= 0) {
          window.Problem.showModal(currentTooltipCourseId, currentTooltipLessonIndex);
          const problemTooltip = document.getElementById('problemTooltip');
          problemTooltip.style.display = 'none';
        }
      });
    }
  }

  async function initApp() {
    console.log('[Main] Starting app init...');
    console.log('[Main] electronAPI exists:', !!window.electronAPI);
    
    try {
      console.log('[Main] Initializing storage...');
      await window.AppStorage.init();
      console.log('[Main] Storage initialized');
      
      if (window.Calendar) {
        window.Calendar.render();
        console.log('[Main] Calendar rendered');
      }
      
      if (window.CourseManager) {
        window.CourseManager.renderCourses();
        console.log('[Main] Courses rendered');
      }
      
      if (window.Calendar && window.Calendar.initCalendarEvents) {
        window.Calendar.initCalendarEvents();
        console.log('[Main] Calendar events initialized');
      }
      
      if (window.Timeline && window.Timeline.initEvents) {
        window.Timeline.initEvents();
        console.log('[Main] Timeline events initialized');
      }
      
      if (window.Problem && window.Problem.initEvents) {
        window.Problem.initEvents();
        console.log('[Main] Problem events initialized');
      }
      
      if (window.ImportModule && window.ImportModule.initEvents) {
        window.ImportModule.initEvents();
        console.log('[Main] Import events initialized');
      }
      
      bindEventListeners();
      console.log('[Main] App initialized successfully');
    } catch (e) {
      console.error('[Main] Init error:', e);
      console.error(e.stack);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  window.AppView = {
    switchView
  };
})();
