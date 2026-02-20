(function() {
  'use strict';

  const coursesContainer = document.getElementById('coursesContainer');
  const courseForm = document.getElementById('courseForm');

  function addCourse(e) {
    e.preventDefault();

    const courseName = document.getElementById('courseName').value;
    const startTime = document.getElementById('courseStartTime').value;
    const endTime = document.getElementById('courseEndTime').value;
    const courseDate = new Date(document.getElementById('courseDate').value);
    const frequency = document.getElementById('courseFrequency').value;
    const repeatCount = parseInt(document.getElementById('repeatCount').value);

    const courses = window.AppStorage.getCoursesData();

    const newCourse = {
      id: Date.now().toString(),
      name: courseName,
      startTime: startTime,
      endTime: endTime,
      startDate: courseDate.toISOString(),
      frequency: frequency,
      repeatCount: repeatCount,
      dayOfWeek: courseDate.getDay(),
      lessons: [],
      timeline: []
    };

    const skippedHolidays = [];

    let lessonIndex = 0;
    let currentDate = new Date(courseDate);

    while (lessonIndex < repeatCount) {
      const holiday = window.DateUtils.isHoliday(currentDate);

      if (holiday) {
        const dateStr = currentDate.toLocaleDateString('zh-CN');
        skippedHolidays.push({ date: dateStr, name: holiday });

        switch (frequency) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        }
        continue;
      }

      newCourse.lessons.push({
        week: lessonIndex + 1,
        date: currentDate.toISOString(),
        status: '',
        problem: ''
      });

      lessonIndex++;

      switch (frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'biweekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'daily':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
      }
    }

    courses.push(newCourse);
    window.AppStorage.setCoursesData(courses);
    window.AppStorage.saveCourses();

    if (skippedHolidays.length > 0) {
      const holidayInfo = skippedHolidays.map(h => `${h.date} ${h.name}`).join('、');
      window.Toast.show(`课程添加成功，已跳过节假日：${holidayInfo}`);
    } else {
      window.Toast.show('课程添加成功');
    }

    renderCourses();
    if (window.Calendar) {
      window.Calendar.render();
    }

    courseForm.reset();
  }

  function renderCourses() {
    const courses = window.AppStorage.getCoursesData();
    coursesContainer.innerHTML = '';

    if (courses.length === 0) {
      coursesContainer.innerHTML = '<p>暂无课程，请添加课程</p>';
      return;
    }

    courses.forEach(course => {
      const courseElement = document.createElement('div');
      courseElement.className = 'course-item';

      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayName = dayNames[course.dayOfWeek];

      let currentWeek = -1;
      const today = new Date();

      if (course.startDate) {
        const startDate = new Date(course.startDate);
        const timeDiff = today - startDate;
        const weekDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24 * 7));
        if (weekDiff > 0 && weekDiff <= course.repeatCount) {
          currentWeek = weekDiff;
        }
      }

      courseElement.innerHTML = `
        <div class="course-header">
          <h3>${course.name} <span class="problem-tag" style="display: ${course.lessons.some(l => l.status === 'problematic') ? 'inline-block' : 'none'}">有问题</span></h3>
          <button class="delete-course-btn" data-course-id="${course.id}">删除</button>
        </div>
        <p>时间：${dayName} ${course.startTime} - ${course.endTime}</p>
        <p>开始日期：${course.startDate ? new Date(course.startDate).toLocaleDateString() : '未设置'}</p>
        <p>频率：${getFrequencyText(course.frequency || 'weekly')}</p>
        <p>总次数：${course.repeatWeeks || course.repeatCount}次</p>
        <div class="lessons-container">
          ${course.lessons.map((lesson, index) => {
            const isCurrentWeek = lesson.week === currentWeek;
            return `
              <div class="lesson-item lesson-${lesson.status} ${isCurrentWeek ? 'current-week' : ''}" data-course-id="${course.id}" data-lesson-index="${index}">
                第${lesson.week}周
              </div>
            `;
          }).join('')}
        </div>
      `;

      coursesContainer.appendChild(courseElement);
    });

    addLessonClickListeners();
    addDeleteCourseListeners();
  }

  function getFrequencyText(frequency) {
    switch (frequency) {
      case 'daily':
        return '每天';
      case 'weekly':
        return '每周';
      case 'biweekly':
        return '每两周';
      case 'monthly':
        return '每个月';
      default:
        return '每周';
    }
  }

  function deleteCourse(courseId) {
    const courses = window.AppStorage.getCoursesData();
    const filtered = courses.filter(course => course.id !== courseId);
    window.AppStorage.setCoursesData(filtered);
    window.AppStorage.saveCourses();
    renderCourses();
    if (window.Calendar) {
      window.Calendar.render();
    }
  }

  function addDeleteCourseListeners() {
    const deleteButtons = document.querySelectorAll('.delete-course-btn');

    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const courseId = button.dataset.courseId;
        if (confirm('确定要删除这门课程吗？')) {
          deleteCourse(courseId);
        }
      });
    });
  }

  function addLessonClickListeners() {
    const lessonItems = document.querySelectorAll('.lesson-item');

    lessonItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const courseId = item.dataset.courseId;
        const lessonIndex = parseInt(item.dataset.lessonIndex);
        if (window.Status) {
          window.Status.showMenu(e, courseId, lessonIndex);
        }
      });

      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const courseId = item.dataset.courseId;
        const lessonIndex = parseInt(item.dataset.lessonIndex);
        if (window.Status) {
          window.Status.showMenu(e, courseId, lessonIndex);
        }
      });

      item.addEventListener('mouseenter', (e) => {
        const courseId = item.dataset.courseId;
        const lessonIndex = parseInt(item.dataset.lessonIndex);

        if (item.classList.contains('lesson-problematic')) {
          const courses = window.AppStorage.getCoursesData();
          const course = courses.find(c => c.id === courseId);
          if (course) {
            const lesson = course.lessons[lessonIndex];
            if (lesson.problem) {
              const tooltipBody = document.getElementById('tooltipBody');
              const problemTooltip = document.getElementById('problemTooltip');
              window.AppStorage.set('currentTooltipCourseId', courseId);
              window.AppStorage.set('currentTooltipLessonIndex', lessonIndex);

              tooltipBody.textContent = lesson.problem;

              const rect = item.getBoundingClientRect();
              problemTooltip.style.left = `${rect.right + 10}px`;
              problemTooltip.style.top = `${rect.top}px`;
              problemTooltip.style.display = 'block';
            }
          }
        }
      });

      item.addEventListener('mouseleave', (e) => {
        const problemTooltip = document.getElementById('problemTooltip');
        setTimeout(() => {
          const tooltipHovered = problemTooltip.matches(':hover');
          if (!tooltipHovered) {
            problemTooltip.style.display = 'none';
            window.AppStorage.set('currentTooltipCourseId', '');
            window.AppStorage.set('currentTooltipLessonIndex', -1);
          }
        }, 100);
      });
    });

    const problemTooltip = document.getElementById('problemTooltip');
    problemTooltip.addEventListener('mouseleave', () => {
      problemTooltip.style.display = 'none';
      window.AppStorage.set('currentTooltipCourseId', '');
      window.AppStorage.set('currentTooltipLessonIndex', -1);
    });
  }

  window.CourseManager = {
    addCourse,
    renderCourses,
    deleteCourse,
    getFrequencyText,
    addLessonClickListeners,
    addDeleteCourseListeners
  };
})();
