(function() {
  'use strict';

  function showStatusMenu(e, courseId, lessonIndex) {
    closeAllStatusMenus();

    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const lesson = course.lessons[lessonIndex];
    let courseDate;

    if (lesson.date) {
      courseDate = new Date(lesson.date);
    } else {
      const startDate = course.startDate ? new Date(course.startDate) : new Date();
      const weekOffset = lesson.week - 1;
      courseDate = new Date(startDate);
      courseDate.setDate(courseDate.getDate() + (weekOffset * 7) + (course.dayOfWeek - startDate.getDay()));
    }

    const isFuture = courseDate > new Date();

    const menu = document.createElement('div');
    menu.className = 'status-menu';

    let menuHTML = getStatusMenuOptions(isFuture);

    menu.innerHTML = menuHTML;

    const rect = e.target.getBoundingClientRect();
    menu.style.top = `${rect.bottom}px`;
    menu.style.left = `${rect.left}px`;

    document.body.appendChild(menu);

    menu.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.action === 'add-timeline') {
          if (window.Timeline) {
            window.Timeline.showModal(courseId);
          }
        } else {
          updateLessonStatus(courseId, lessonIndex, button.dataset.status);
        }
        closeAllStatusMenus();
      });
    });

    setTimeout(() => {
      document.addEventListener('click', closeAllStatusMenus);
    }, 100);
  }

  function closeAllStatusMenus() {
    const menus = document.querySelectorAll('.status-menu');
    menus.forEach(menu => menu.remove());
    document.removeEventListener('click', closeAllStatusMenus);
  }

  function updateLessonStatus(courseId, lessonIndex, status) {
    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);
    if (course) {
      if (status === 'none') {
        course.lessons[lessonIndex].status = '';
      } else {
        course.lessons[lessonIndex].status = status;
      }
      if (status !== 'problematic') {
        course.lessons[lessonIndex].problem = '';
      }
      window.AppStorage.saveCourses();
      if (window.CourseManager) {
        window.CourseManager.renderCourses();
      }
      if (window.Calendar) {
        window.Calendar.render();
      }
    }
  }

  function getStatusMenuOptions(isFuture) {
    if (isFuture) {
      return `
        <button data-status="none">无标签</button>
        <button data-status="ddl">DDL</button>
        <button data-action="add-timeline">添加时间轴标注</button>
      `;
    } else {
      return `
        <button data-status="attended">已上（无问题）</button>
        <button data-status="skipped">未上/旷课</button>
        <button data-status="problematic">已上（有问题）</button>
      `;
    }
  }

  window.Status = {
    showMenu: showStatusMenu,
    closeAllMenus: closeAllStatusMenus,
    updateLessonStatus,
    getStatusMenuOptions
  };
})();
