(function() {
  'use strict';

  let currentTimelineCourseId = '';

  const timelineModal = document.getElementById('timelineModal');
  const timelineForm = document.getElementById('timelineForm');
  const timelineClose = document.getElementById('timelineClose');
  const timelineType = document.getElementById('timelineType');
  const weekStartGroup = document.getElementById('weekStartGroup');
  const weekEndGroup = document.getElementById('weekEndGroup');
  const weekSingleGroup = document.getElementById('weekSingleGroup');
  const weekStartInput = document.getElementById('weekStart');
  const weekEndInput = document.getElementById('weekEnd');
  const weekSingleInput = document.getElementById('weekSingle');
  const timelineLabelInput = document.getElementById('timelineLabel');
  const timelineList = document.getElementById('timelineList');

  function showTimelineModal(courseId) {
    currentTimelineCourseId = courseId;
    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);

    if (!course) return;

    document.getElementById('timelineCourseId').value = courseId;
    timelineType.value = 'before';
    weekStartInput.value = '';
    weekEndInput.value = '';
    weekSingleInput.value = '';
    timelineLabelInput.value = '';

    updateWeekInputVisibility();
    renderTimelineList(courseId);

    timelineModal.style.display = 'block';
  }

  function closeTimelineModal() {
    timelineModal.style.display = 'none';
  }

  function updateWeekInputVisibility() {
    const type = timelineType.value;

    weekStartGroup.style.display = 'none';
    weekEndGroup.style.display = 'none';
    weekSingleGroup.style.display = 'none';

    if (type === 'before') {
      weekStartGroup.style.display = 'block';
      weekSingleGroup.style.display = 'none';
    } else if (type === 'between') {
      weekStartGroup.style.display = 'block';
      weekEndGroup.style.display = 'block';
    } else if (type === 'after') {
      weekSingleGroup.style.display = 'block';
      weekStartGroup.style.display = 'none';
    }
  }

  function saveTimeline(e) {
    e.preventDefault();

    const courseId = document.getElementById('timelineCourseId').value;
    const type = timelineType.value;
    const label = timelineLabelInput.value.trim();

    const timelineItem = {
      id: Date.now().toString(),
      type: type,
      label: label || getTimelineLabel(type)
    };

    if (type === 'before') {
      timelineItem.weekStart = parseInt(weekStartInput.value);
    } else if (type === 'between') {
      timelineItem.weekStart = parseInt(weekStartInput.value);
      timelineItem.weekEnd = parseInt(weekEndInput.value);
    } else if (type === 'after') {
      timelineItem.week = parseInt(weekSingleInput.value);
    }

    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);
    if (course) {
      if (!course.timeline) {
        course.timeline = [];
      }
      course.timeline.push(timelineItem);
      window.AppStorage.saveCourses();

      renderTimelineList(courseId);
      if (window.Calendar) {
        window.Calendar.render();
      }

      weekStartInput.value = '';
      weekEndInput.value = '';
      weekSingleInput.value = '';
      timelineLabelInput.value = '';

      if (window.Toast) {
        window.Toast.show('时间轴标注添加成功');
      }
    }
  }

  function getTimelineLabel(type) {
    switch (type) {
      case 'before':
        return '课程前';
      case 'between':
        return '课程期间';
      case 'after':
        return '课程后';
      default:
        return '标注';
    }
  }

  function renderTimelineList(courseId) {
    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);
    if (!course || !course.timeline || course.timeline.length === 0) {
      timelineList.innerHTML = '<p class="no-timeline">暂无时间轴标注</p>';
      return;
    }

    timelineList.innerHTML = '<div class="timeline-items"><h4>已有标注：</h4>' +
      course.timeline.map(item => {
        let weekInfo = '';
        if (item.type === 'before') {
          weekInfo = `第${item.weekStart}周之前`;
        } else if (item.type === 'between') {
          weekInfo = `第${item.weekStart}周至第${item.weekEnd}周之间`;
        } else if (item.type === 'after') {
          weekInfo = `第${item.week}周之后`;
        }

        return `
          <div class="timeline-item">
            <span class="timeline-type-${item.type}">${item.label || weekInfo}</span>
            <button class="delete-timeline-btn" data-timeline-id="${item.id}">删除</button>
          </div>
        `;
      }).join('') + '</div>';

    timelineList.querySelectorAll('.delete-timeline-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteTimeline(courseId, btn.dataset.timelineId);
      });
    });
  }

  function deleteTimeline(courseId, timelineId) {
    const courses = window.AppStorage.getCoursesData();
    const course = courses.find(c => c.id === courseId);
    if (course && course.timeline) {
      course.timeline = course.timeline.filter(t => t.id !== timelineId);
      window.AppStorage.saveCourses();
      renderTimelineList(courseId);
      if (window.Calendar) {
        window.Calendar.render();
      }
      if (window.Toast) {
        window.Toast.show('时间轴标注已删除');
      }
    }
  }

  function getTimelineForDate(course, date) {
    if (!course.timeline || course.timeline.length === 0) return null;

    const dateWeek = window.DateUtils.getWeekNumber(course, date);
    if (dateWeek < 1) return null;

    for (const item of course.timeline) {
      if (item.type === 'before' && dateWeek < item.weekStart) {
        return item;
      } else if (item.type === 'between' && dateWeek >= item.weekStart && dateWeek <= item.weekEnd) {
        return item;
      } else if (item.type === 'after' && dateWeek > item.week) {
        return item;
      }
    }
    return null;
  }

  function initTimelineEvents() {
    timelineForm.addEventListener('submit', saveTimeline);

    timelineClose.addEventListener('click', closeTimelineModal);

    window.addEventListener('click', (e) => {
      if (e.target === timelineModal) {
        timelineModal.style.display = 'none';
      }
    });

    timelineType.addEventListener('change', updateWeekInputVisibility);
  }

  window.Timeline = {
    showModal: showTimelineModal,
    closeModal: closeTimelineModal,
    save: saveTimeline,
    renderList: renderTimelineList,
    delete: deleteTimeline,
    getForDate: getTimelineForDate,
    initEvents: initTimelineEvents
  };
})();
