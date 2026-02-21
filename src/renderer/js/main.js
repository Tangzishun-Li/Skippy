(function() {
  'use strict';

  function switchView(view) {
    document.getElementById('calendarView').style.display = 'none';
    document.getElementById('addCourseView').style.display = 'none';
    document.getElementById('courseListView').style.display = 'none';
    document.getElementById('importView').style.display = 'none';

    if (view === 'calendar') {
      document.getElementById('calendarView').style.display = 'block';
    } else if (view === 'add-course') {
      document.getElementById('addCourseView').style.display = 'block';
    } else if (view === 'course-list') {
      document.getElementById('courseListView').style.display = 'block';
    } else if (view === 'import') {
      document.getElementById('importView').style.display = 'block';
    }
  }

  function bindEventListeners() {
    const courseForm = document.getElementById('courseForm');

    courseForm.addEventListener('submit', function(e) {
      e.preventDefault();
      window.CourseManager.addCourse(e);
    });

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

  function initApp() {
    window.AppStorage.loadCourses();
    window.Calendar.render();
    window.CourseManager.renderCourses();
    window.Calendar.initCalendarEvents();
    window.Timeline.initEvents();
    window.Problem.initEvents();
    window.ImportModule.initEvents();
    bindEventListeners();
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
