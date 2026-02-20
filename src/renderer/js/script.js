// 中国法定节假日数据 (2024-2026)
// 格式: 'YYYY-MM-DD': '节日名称'
const holidays = {
  // 2024年
  '2024-01-01': '元旦',
  '2024-02-10': '春节',
  '2024-02-11': '春节',
  '2024-02-12': '春节',
  '2024-02-13': '春节',
  '2024-02-14': '春节',
  '2024-02-15': '春节',
  '2024-02-16': '春节',
  '2024-04-04': '清明节',
  '2024-04-05': '清明节',
  '2024-04-06': '清明节',
  '2024-05-01': '劳动节',
  '2024-05-02': '劳动节',
  '2024-05-03': '劳动节',
  '2024-05-04': '劳动节',
  '2024-05-05': '劳动节',
  '2024-06-10': '端午节',
  '2024-09-15': '中秋节',
  '2024-09-16': '中秋节',
  '2024-09-17': '中秋节',
  '2024-10-01': '国庆节',
  '2024-10-02': '国庆节',
  '2024-10-03': '国庆节',
  '2024-10-04': '国庆节',
  '2024-10-05': '国庆节',
  '2024-10-06': '国庆节',
  '2024-10-07': '国庆节',
  // 2025年
  '2025-01-01': '元旦',
  '2025-01-28': '春节',
  '2025-01-29': '春节',
  '2025-01-30': '春节',
  '2025-01-31': '春节',
  '2025-02-01': '春节',
  '2025-02-02': '春节',
  '2025-02-03': '春节',
  '2025-04-04': '清明节',
  '2025-04-05': '清明节',
  '2025-04-06': '清明节',
  '2025-05-01': '劳动节',
  '2025-05-02': '劳动节',
  '2025-05-03': '劳动节',
  '2025-05-04': '劳动节',
  '2025-05-05': '劳动节',
  '2025-05-31': '端午节',
  '2025-10-01': '国庆节',
  '2025-10-02': '国庆节',
  '2025-10-03': '国庆节',
  '2025-10-04': '国庆节',
  '2025-10-05': '国庆节',
  '2025-10-06': '国庆节',
  '2025-10-07': '国庆节',
  '2025-10-08': '国庆节',
  // 2026年
  '2026-01-01': '元旦',
  '2026-01-26': '春节',
  '2026-01-27': '春节',
  '2026-01-28': '春节',
  '2026-01-29': '春节',
  '2026-01-30': '春节',
  '2026-01-31': '春节',
  '2026-02-01': '春节',
  '2026-02-02': '春节',
  '2026-04-04': '清明节',
  '2026-04-05': '清明节',
  '2026-04-06': '清明节',
  '2026-05-01': '劳动节',
  '2026-05-02': '劳动节',
  '2026-05-03': '劳动节',
  '2026-05-04': '劳动节',
  '2026-05-05': '劳动节',
  '2026-10-01': '国庆节',
  '2026-10-02': '国庆节',
  '2026-10-03': '国庆节',
  '2026-10-04': '国庆节',
  '2026-10-05': '国庆节',
  '2026-10-06': '国庆节',
  '2026-10-07': '国庆节',
};

// 判断是否为节假日
function isHoliday(date) {
  const dateStr = date.toISOString().split('T')[0];
  return holidays[dateStr] || null;
}

// 全局变量
let courses = [];
let currentDate = new Date();
let currentView = 'month';
const coursesContainer = document.getElementById('coursesContainer');
const courseForm = document.getElementById('courseForm');
const problemModal = document.getElementById('problemModal');
const problemForm = document.getElementById('problemForm');
const closeModal = document.querySelector('.close');
const problemTooltip = document.getElementById('problemTooltip');
const tooltipBody = document.getElementById('tooltipBody');
const editProblemBtn = document.getElementById('editProblem');
const tooltipClose = document.querySelector('.tooltip-close');
let currentTooltipCourseId = '';
let currentTooltipLessonIndex = -1;

// 时间轴相关DOM元素
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
let currentTimelineCourseId = '';

// 导入相关变量
const googleImportForm = document.getElementById('googleImportForm');
const icsImportForm = document.getElementById('icsImportForm');
const googleImportResult = document.getElementById('googleImportResult');
const icsImportResult = document.getElementById('icsImportResult');
const importTabs = document.querySelectorAll('.import-tab');
const googlePanel = document.getElementById('googlePanel');
const icsPanel = document.getElementById('icsPanel');

// 初始化应用
function initApp() {
  // 从本地存储加载课程数据
  loadCourses();
  // 渲染日历
  renderCalendar();
  // 渲染课程列表
  renderCourses();
  // 绑定事件监听器
  bindEventListeners();
}

// 从本地存储加载课程数据
function loadCourses() {
  const storedCourses = localStorage.getItem('courses');
  if (storedCourses) {
    courses = JSON.parse(storedCourses);
    // 确保旧课程也有timeline字段
    courses.forEach(course => {
      if (!course.timeline) {
        course.timeline = [];
      }
    });
  }
}

// 保存课程数据到本地存储
function saveCourses() {
  localStorage.setItem('courses', JSON.stringify(courses));
}

// 显示Toast通知
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// 绑定事件监听器
function bindEventListeners() {
  // 课程表单提交
  courseForm.addEventListener('submit', addCourse);
  
  // 问题表单提交
  problemForm.addEventListener('submit', saveProblem);
  
  // 关闭问题弹窗
  closeModal.addEventListener('click', () => {
    problemModal.style.display = 'none';
  });
  
  // 点击弹窗外部关闭
  window.addEventListener('click', (e) => {
    if (e.target === problemModal) {
      problemModal.style.display = 'none';
    }
  });
  
  // 导航按钮点击事件
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
      
      // 更新活跃状态
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  // 日历控制按钮
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  // 关闭问题悬停浮窗
  tooltipClose.addEventListener('click', () => {
    problemTooltip.style.display = 'none';
  });
  
  // 编辑问题按钮
  editProblemBtn.addEventListener('click', () => {
    if (currentTooltipCourseId && currentTooltipLessonIndex >= 0) {
      showProblemModal(currentTooltipCourseId, currentTooltipLessonIndex);
      problemTooltip.style.display = 'none';
    }
  });

  // 操作指引展开/收起
  const helpToggle = document.querySelector('.help-toggle');
  if (helpToggle) {
    helpToggle.addEventListener('click', () => {
      const helpContent = document.querySelector('.help-content');
      helpContent.classList.toggle('show');
    });
  }
  
  // 视图切换按钮事件
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderCalendar();
    });
  });
  
  // 时间轴表单提交
  timelineForm.addEventListener('submit', saveTimeline);
  
  // 关闭时间轴弹窗
  timelineClose.addEventListener('click', closeTimelineModal);
  
  // 点击时间轴弹窗外部关闭
  window.addEventListener('click', (e) => {
    if (e.target === timelineModal) {
      timelineModal.style.display = 'none';
    }
  });
  
  // 标注类型切换时更新输入框
  timelineType.addEventListener('change', updateWeekInputVisibility);
  
  // 导入标签页切换
  importTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      importTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (tabName === 'google') {
        googlePanel.style.display = 'block';
        icsPanel.style.display = 'none';
      } else if (tabName === 'ics') {
        googlePanel.style.display = 'none';
        icsPanel.style.display = 'block';
      }
    });
  });
  
  // Google日历导入表单提交
  if (googleImportForm) {
    googleImportForm.addEventListener('submit', handleGoogleImport);
  }
  
  // ICS文件导入表单提交
  if (icsImportForm) {
    icsImportForm.addEventListener('submit', handleICSImport);
  }
}

// 添加课程
function addCourse(e) {
  e.preventDefault();
  
  const courseName = document.getElementById('courseName').value;
  const startTime = document.getElementById('courseStartTime').value;
  const endTime = document.getElementById('courseEndTime').value;
  const courseDate = new Date(document.getElementById('courseDate').value);
  const frequency = document.getElementById('courseFrequency').value;
  const repeatCount = parseInt(document.getElementById('repeatCount').value);
  
  // 创建课程对象
  const newCourse = {
    id: Date.now().toString(),
    name: courseName,
    startTime: startTime,
    endTime: endTime,
    startDate: courseDate.toISOString(),
    frequency: frequency,
    repeatCount: repeatCount,
    dayOfWeek: courseDate.getDay(), // 保留周几信息用于兼容现有逻辑
    lessons: [],
    timeline: []
  };
  
  // 记录跳过的节假日
  const skippedHolidays = [];
  
  // 生成课程的每一节课
  let lessonIndex = 0;
  let currentDate = new Date(courseDate);
  
  while (lessonIndex < repeatCount) {
    // 检查是否为节假日
    const holiday = isHoliday(currentDate);
    
    if (holiday) {
      // 记录跳过的节假日
      const dateStr = currentDate.toLocaleDateString('zh-CN');
      skippedHolidays.push({ date: dateStr, name: holiday });
      
      // 根据频率计算下一天/周
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
      status: '', // empty string for no status, attended, skipped, problematic, ddl
      problem: ''
    });
    
    lessonIndex++;
    
    // 根据频率计算下一次课程日期
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
  
  // 添加到课程列表
  courses.push(newCourse);
  
  // 保存到本地存储
  saveCourses();
  
  // 显示提示信息
  if (skippedHolidays.length > 0) {
    const holidayInfo = skippedHolidays.map(h => `${h.date} ${h.name}`).join('、');
    showToast(`课程添加成功，已跳过节假日：${holidayInfo}`);
  } else {
    showToast('课程添加成功');
  }
  
  // 渲染课程列表
  renderCourses();
  renderCalendar();
  
  // 重置表单
  courseForm.reset();
}

// 渲染课程列表
function renderCourses() {
  coursesContainer.innerHTML = '';
  
  if (courses.length === 0) {
    coursesContainer.innerHTML = '<p>暂无课程，请添加课程</p>';
    return;
  }
  
  courses.forEach(course => {
    const courseElement = document.createElement('div');
    courseElement.className = 'course-item';
    
    // 生成星期几的中文名称
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayName = dayNames[course.dayOfWeek];
    
    // 计算当前周是课程的第几周
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
  
  // 为所有课程项添加点击事件
  addLessonClickListeners();
  
  // 为删除按钮添加点击事件
  addDeleteCourseListeners();
}

// 获取频率文本
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

// 为删除按钮添加点击事件
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

// 删除课程
function deleteCourse(courseId) {
  courses = courses.filter(course => course.id !== courseId);
  saveCourses();
  renderCourses();
  renderCalendar();
}

// 为课程项添加点击事件
function addLessonClickListeners() {
  const lessonItems = document.querySelectorAll('.lesson-item');
  
  lessonItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const courseId = item.dataset.courseId;
      const lessonIndex = parseInt(item.dataset.lessonIndex);
      // 显示状态切换菜单
      showStatusMenu(e, courseId, lessonIndex);
    });
  });
}

// 显示状态切换菜单
function showStatusMenu(e, courseId, lessonIndex) {
  // 关闭之前的菜单
  closeAllStatusMenus();
  
  // 获取课程信息
  const course = courses.find(c => c.id === courseId);
  if (!course) return;
  
  // 计算课程日期
  const lesson = course.lessons[lessonIndex];
  let courseDate;
  
  // 如果课程有具体日期，使用它
  if (lesson.date) {
    courseDate = new Date(lesson.date);
  } else {
    // 否则使用课程开始日期计算
    const startDate = course.startDate ? new Date(course.startDate) : new Date();
    const weekOffset = lesson.week - 1;
    courseDate = new Date(startDate);
    courseDate.setDate(courseDate.getDate() + (weekOffset * 7) + (course.dayOfWeek - startDate.getDay()));
  }
  
  // 判断课程是否为未来课程
  const isFuture = courseDate > new Date();
  
  // 创建菜单
  const menu = document.createElement('div');
  menu.className = 'status-menu';
  
  // 根据课程日期生成不同的状态选项
  let menuHTML = '';
  if (isFuture) {
    // 未来课程
    menuHTML = `
      <button data-status="none">无标签</button>
      <button data-status="ddl">DDL</button>
      <button data-action="add-timeline">添加时间轴标注</button>
    `;
  } else {
    // 过去课程
    menuHTML = `
      <button data-status="attended">已上（无问题）</button>
      <button data-status="skipped">未上/旷课</button>
      <button data-status="problematic">已上（有问题）</button>
    `;
  }
  
  menu.innerHTML = menuHTML;
  
  // 定位菜单
  const rect = e.target.getBoundingClientRect();
  menu.style.top = `${rect.bottom}px`;
  menu.style.left = `${rect.left}px`;
  
  // 添加到页面
  document.body.appendChild(menu);
  
  // 绑定菜单点击事件
  menu.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'add-timeline') {
        showTimelineModal(courseId);
      } else {
        updateLessonStatus(courseId, lessonIndex, button.dataset.status);
      }
      closeAllStatusMenus();
    });
  });
  
  // 点击其他地方关闭菜单
  setTimeout(() => {
    document.addEventListener('click', closeAllStatusMenus);
  }, 100);
}

// 关闭所有状态菜单
function closeAllStatusMenus() {
  const menus = document.querySelectorAll('.status-menu');
  menus.forEach(menu => menu.remove());
  document.removeEventListener('click', closeAllStatusMenus);
}

// 更新课程状态
function updateLessonStatus(courseId, lessonIndex, status) {
  const course = courses.find(c => c.id === courseId);
  if (course) {
    // 处理无标签状态
    if (status === 'none') {
      course.lessons[lessonIndex].status = '';
    } else {
      course.lessons[lessonIndex].status = status;
    }
    // 如果状态不是problematic，清空问题
    if (status !== 'problematic') {
      course.lessons[lessonIndex].problem = '';
    }
    saveCourses();
    renderCourses();
    renderCalendar();
  }
}

// 显示问题记录弹窗
function showProblemModal(courseId, lessonIndex) {
  const course = courses.find(c => c.id === courseId);
  if (course) {
    const lesson = course.lessons[lessonIndex];
    document.getElementById('courseId').value = courseId;
    document.getElementById('lessonIndex').value = lessonIndex;
    document.getElementById('problemDescription').value = lesson.problem || '';
    problemModal.style.display = 'block';
  }
}

// 保存问题
function saveProblem(e) {
  e.preventDefault();
  
  const courseId = document.getElementById('courseId').value;
  const lessonIndex = parseInt(document.getElementById('lessonIndex').value);
  const problemDescription = document.getElementById('problemDescription').value;
  
  const course = courses.find(c => c.id === courseId);
  if (course) {
    course.lessons[lessonIndex].problem = problemDescription;
    saveCourses();
    renderCourses();
    renderCalendar();
    problemModal.style.display = 'none';
  }
}

// 切换视图
function switchView(view) {
  // 隐藏所有视图
  document.getElementById('calendarView').style.display = 'none';
  document.getElementById('addCourseView').style.display = 'none';
  document.getElementById('courseListView').style.display = 'none';
  document.getElementById('importView').style.display = 'none';
  
  // 显示选中的视图
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

// 渲染日历
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const currentMonthEl = document.getElementById('currentMonth');
  
  if (currentView === 'week') {
    renderWeekView(calendar, currentMonthEl);
    return;
  }
  
  // 设置当前月份标题
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  currentMonthEl.textContent = `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`;
  
  // 清空日历
  calendar.innerHTML = '';
  calendar.className = 'calendar month-view';
  
  // 添加星期标题
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
  
  // 计算月份信息
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // 生成日历天数
  for (let i = 0; i < 42; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    // 添加日期类
    if (day.getMonth() !== month) {
      dayEl.classList.add('other-month');
    }
    
    // 周末区分
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
    
    // 添加日期数字
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day.getDate();
    dayEl.appendChild(dayNumber);
    
    // 添加课程事件
    const courseEvents = document.createElement('div');
    courseEvents.className = 'course-events';
    
    // 查找当天的课程
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

// 获取指定日期的课程
function getCoursesForDate(date) {
  const result = [];
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  courses.forEach(course => {
    // 检查是否有时间轴标注
    const timelineItem = getTimelineForDate(course, targetDate);
    if (timelineItem) {
      result.push({
        name: course.name,
        status: 'timeline',
        problem: timelineItem.label || '时间轴标注',
        isTimeline: true,
        timelineType: timelineItem.type
      });
    }
    
    // 遍历课程的每一节课
    course.lessons.forEach((lesson, index) => {
      // 检查课程是否有具体日期
      if (lesson.date) {
        const lessonDate = new Date(lesson.date);
        lessonDate.setHours(0, 0, 0, 0);
        
        // 比较日期是否匹配
        if (lessonDate.getTime() === targetDate.getTime()) {
          result.push({
            name: course.name,
            status: lesson.status,
            problem: lesson.problem,
            isTimeline: false
          });
        }
      } else {
        // 兼容旧的课程数据结构
        const dayOfWeek = date.getDay();
        if (course.dayOfWeek === dayOfWeek) {
          // 计算课程开始日期
          const startDate = course.startDate ? new Date(course.startDate) : new Date();
          startDate.setHours(0, 0, 0, 0);
          
          // 计算应该上课的日期
          let expectedLessonDate = new Date(startDate);
          
          // 根据频率和索引计算实际日期
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
          
          // 标准化日期时间
          expectedLessonDate.setHours(0, 0, 0, 0);
          
          // 只有当预期日期与目标日期匹配时才显示课程
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

// 为课程项添加点击事件
function addLessonClickListeners() {
  const lessonItems = document.querySelectorAll('.lesson-item');
  
  lessonItems.forEach(item => {
    // 左键点击事件 - 所有课程都显示状态切换菜单
    item.addEventListener('click', (e) => {
      const courseId = item.dataset.courseId;
      const lessonIndex = parseInt(item.dataset.lessonIndex);
      // 显示状态切换菜单
      showStatusMenu(e, courseId, lessonIndex);
    });
    
    // 右键点击事件 - 所有课程都可以显示状态切换菜单
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // 阻止默认右键菜单
      const courseId = item.dataset.courseId;
      const lessonIndex = parseInt(item.dataset.lessonIndex);
      showStatusMenu(e, courseId, lessonIndex);
    });
    
    // 悬停事件 - 为问题课程添加浮窗
    item.addEventListener('mouseenter', (e) => {
      const courseId = item.dataset.courseId;
      const lessonIndex = parseInt(item.dataset.lessonIndex);
      
      // 只有问题课程显示浮窗
      if (item.classList.contains('lesson-problematic')) {
        const course = courses.find(c => c.id === courseId);
        if (course) {
          const lesson = course.lessons[lessonIndex];
          if (lesson.problem) {
            // 设置浮窗内容
            tooltipBody.textContent = lesson.problem;
            currentTooltipCourseId = courseId;
            currentTooltipLessonIndex = lessonIndex;
            
            // 定位浮窗
            const rect = item.getBoundingClientRect();
            problemTooltip.style.left = `${rect.right + 10}px`;
            problemTooltip.style.top = `${rect.top}px`;
            problemTooltip.style.display = 'block';
          }
        }
      }
    });
    
    // 鼠标离开事件 - 不立即隐藏浮窗
    item.addEventListener('mouseleave', (e) => {
      // 只有当鼠标不移向浮窗时才隐藏
      setTimeout(() => {
        const tooltipHovered = problemTooltip.matches(':hover');
        if (!tooltipHovered) {
          problemTooltip.style.display = 'none';
          currentTooltipCourseId = '';
          currentTooltipLessonIndex = -1;
        }
      }, 100);
    });
  });
  
  // 为浮窗添加鼠标事件
  problemTooltip.addEventListener('mouseenter', () => {
    // 鼠标进入浮窗时保持显示
  });
  
  problemTooltip.addEventListener('mouseleave', () => {
    // 鼠标离开浮窗时隐藏
    problemTooltip.style.display = 'none';
    currentTooltipCourseId = '';
    currentTooltipLessonIndex = -1;
  });
}

// 初始化应用
initApp();

// 渲染周视图
function renderWeekView(calendar, currentMonthEl) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  
  // 找到当前周的周一
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(currentWeekStart.getDate() + 6);
  
  // 设置标题
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  currentMonthEl.textContent = `${currentWeekStart.getMonth() + 1}月 ${currentWeekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月 ${weekEnd.getDate()}日`;
  
  calendar.innerHTML = '';
  calendar.className = 'calendar week-view';
  
  // 添加星期标题行
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-week-header';
  
  // 添加时间列标题
  const timeHeader = document.createElement('div');
  timeHeader.className = 'calendar-header-day time-column';
  timeHeader.textContent = '时间';
  headerRow.appendChild(timeHeader);
  
  weekDays.forEach((day, index) => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-header-day';
    
    const weekDate = new Date(currentWeekStart);
    weekDate.setDate(currentWeekStart.getDate() + index);
    
    dayHeader.innerHTML = `<span class="week-day-name">${day}</span><span class="week-day-date">${weekDate.getDate()}</span>`;
    
    if (weekDate.getDate() === today.getDate() && 
        weekDate.getMonth() === today.getMonth() && 
        weekDate.getFullYear() === today.getFullYear()) {
      dayHeader.classList.add('today');
    }
    
    headerRow.appendChild(dayHeader);
  });
  calendar.appendChild(headerRow);
  
  // 生成每小时时间行 (6:00 - 22:00)
  for (let hour = 6; hour <= 22; hour++) {
    const timeRow = document.createElement('div');
    timeRow.className = 'calendar-time-row';
    
    // 时间列
    const timeCell = document.createElement('div');
    timeCell.className = 'calendar-time-cell time-column';
    timeCell.textContent = `${hour}:00`;
    timeRow.appendChild(timeCell);
    
    // 每周的7天
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar-day-cell';
      
      const cellDate = new Date(currentWeekStart);
      cellDate.setDate(currentWeekStart.getDate() + dayIndex);
      
      if (cellDate.getDate() === today.getDate() && 
          cellDate.getMonth() === today.getMonth() && 
          cellDate.getFullYear() === today.getFullYear()) {
        dayCell.classList.add('today');
      }
      
      if (dayIndex === 0) {
        dayCell.classList.add('sunday');
      } else if (dayIndex === 6) {
        dayCell.classList.add('saturday');
      }
      
      // 查找当天的课程并添加
      const dayCourses = getCoursesForDate(cellDate);
      dayCourses.forEach(courseEvent => {
        // 获取课程时间
        const course = courses.find(c => c.name === courseEvent.name);
        if (course && course.startTime) {
          const [courseHour, courseMinute] = course.startTime.split(':').map(Number);
          
          if (courseHour === hour) {
            const eventEl = document.createElement('div');
            eventEl.className = `week-course-event ${courseEvent.status}`;
            
            const eventContent = document.createElement('div');
            eventContent.className = 'week-course-content';
            
            const eventName = document.createElement('span');
            eventName.className = 'week-course-name';
            eventName.textContent = course.name;
            
            const eventTime = document.createElement('span');
            eventTime.className = 'week-course-time';
            eventTime.textContent = `${course.startTime} - ${course.endTime}`;
            
            eventContent.appendChild(eventName);
            eventContent.appendChild(eventTime);
            eventEl.appendChild(eventContent);
            
            if (courseEvent.status === 'problematic' && courseEvent.problem) {
              eventEl.classList.add('has-problem');
            }
            
            dayCell.appendChild(eventEl);
          }
        }
      });
      
      timeRow.appendChild(dayCell);
    }
    
    calendar.appendChild(timeRow);
  }
}

// 显示时间轴标注弹窗
function showTimelineModal(courseId) {
  currentTimelineCourseId = courseId;
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

// 根据标注类型更新周输入框的可见性
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

// 保存时间轴标注
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
  
  const course = courses.find(c => c.id === courseId);
  if (course) {
    if (!course.timeline) {
      course.timeline = [];
    }
    course.timeline.push(timelineItem);
    saveCourses();
    
    renderTimelineList(courseId);
    renderCalendar();
    
    weekStartInput.value = '';
    weekEndInput.value = '';
    weekSingleInput.value = '';
    timelineLabelInput.value = '';
    
    showToast('时间轴标注添加成功');
  }
}

// 获取默认标注名称
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

// 渲染时间轴标注列表
function renderTimelineList(courseId) {
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
  
  // 绑定删除按钮点击事件
  timelineList.querySelectorAll('.delete-timeline-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTimeline(courseId, btn.dataset.timelineId);
    });
  });
}

// 删除时间轴标注
function deleteTimeline(courseId, timelineId) {
  const course = courses.find(c => c.id === courseId);
  if (course && course.timeline) {
    course.timeline = course.timeline.filter(t => t.id !== timelineId);
    saveCourses();
    renderTimelineList(courseId);
    renderCalendar();
    showToast('时间轴标注已删除');
  }
}

// 关闭时间轴弹窗
function closeTimelineModal() {
  timelineModal.style.display = 'none';
}

// 获取课程指定周次的日期
function getCourseDateForWeek(course, week) {
  if (!course.startDate || !course.lessons[week - 1]) {
    return null;
  }
  return new Date(course.lessons[week - 1].date);
}

// 检查指定日期是否有时间轴标注
function getTimelineForDate(course, date) {
  if (!course.timeline || course.timeline.length === 0) return null;
  
  const dateWeek = getWeekNumber(course, date);
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

// 计算课程的第几周
function getWeekNumber(course, date) {
  if (!course.startDate || !date) return -1;
  
  const startDate = new Date(course.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return -1;
  
  let weekNumber = 1;
  let currentDate = new Date(startDate);
  
  while (currentDate < targetDate) {
    const holiday = isHoliday(currentDate);
    if (!holiday) {
      weekNumber++;
    }
    switch (course.frequency || 'weekly') {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }
  
  return weekNumber;
}

// 解析ICS文件内容
function parseICS(icsContent) {
  const events = [];
  const lines = icsContent.split(/\r\n|\n|\r/);
  let currentEvent = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      }
    } else if (currentEvent) {
      if (line.startsWith('DTSTART')) {
        currentEvent.start = parseICSDate(line);
      } else if (line.startsWith('DTEND')) {
        currentEvent.end = parseICSDate(line);
      } else if (line.startsWith('SUMMARY')) {
        currentEvent.summary = line.substring(8);
      } else if (line.startsWith('DESCRIPTION')) {
        currentEvent.description = line.substring(12);
      } else if (line.startsWith('RRULE')) {
        currentEvent.rrule = parseRRule(line);
      }
    }
  }
  
  return events;
}

// 解析ICS日期格式
function parseICSDate(line) {
  const match = line.match(/(\d{8}T\d{6}Z)/);
  if (match) {
    const dateStr = match[1];
    return new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8)),
      parseInt(dateStr.substring(9, 11)),
      parseInt(dateStr.substring(11, 13)),
      parseInt(dateStr.substring(13, 15))
    );
  }
  return null;
}

// 解析RRULE重复规则
function parseRRule(line) {
  const rrule = {};
  const parts = line.substring(6).split(';');
  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key === 'FREQ') rrule.freq = value.toLowerCase();
    if (key === 'COUNT') rrule.count = parseInt(value);
    if (key === 'INTERVAL') rrule.interval = parseInt(value);
    if (key === 'BYDAY') rrule.byday = value;
  });
  return rrule;
}

// 从Google日历URL获取ICS内容
async function fetchGoogleCalendar(calendarUrl) {
  const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(calendarUrl);
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error('无法获取日历数据，请检查链接是否正确');
  }
  return await response.text();
}

// 处理Google日历导入
async function handleGoogleImport(e) {
  e.preventDefault();
  
  const calendarUrl = document.getElementById('googleCalendarUrl').value.trim();
  const submitBtn = googleImportForm.querySelector('button[type="submit"]');
  
  googleImportResult.className = 'loading';
  googleImportResult.textContent = '正在获取日历数据...';
  googleImportResult.style.display = 'block';
  
  submitBtn.disabled = true;
  
  try {
    const icsContent = await fetchGoogleCalendar(calendarUrl);
    const events = parseICS(icsContent);
    
    if (events.length === 0) {
      throw new Error('未找到任何日历事件');
    }
    
    const importedCourses = convertEventsToCourses(events);
    
    courses = [...courses, ...importedCourses];
    saveCourses();
    renderCourses();
    renderCalendar();
    
    googleImportResult.className = 'success';
    googleImportResult.innerHTML = `<strong>导入成功！</strong><br>成功导入 ${importedCourses.length} 个课程/事件`;
    googleImportForm.reset();
    
    showToast(`成功导入 ${importedCourses.length} 个课程`);
  } catch (error) {
    googleImportResult.className = 'error';
    googleImportResult.textContent = '导入失败: ' + error.message;
  } finally {
    submitBtn.disabled = false;
  }
}

// 处理ICS文件导入
function handleICSImport(e) {
  e.preventDefault();
  
  const icsFile = document.getElementById('icsFile').files[0];
  const submitBtn = icsImportForm.querySelector('button[type="submit"]');
  
  if (!icsFile) {
    icsImportResult.className = 'error';
    icsImportResult.textContent = '请选择ICS文件';
    icsImportResult.style.display = 'block';
    return;
  }
  
  icsImportResult.className = 'loading';
  icsImportResult.textContent = '正在解析文件...';
  icsImportResult.style.display = 'block';
  
  submitBtn.disabled = true;
  
  const reader = new FileReader();
  
  reader.onload = function(event) {
    try {
      const icsContent = event.target.result;
      const events = parseICS(icsContent);
      
      if (events.length === 0) {
        throw new Error('未找到任何日历事件');
      }
      
      const importedCourses = convertEventsToCourses(events);
      
      courses = [...courses, ...importedCourses];
      saveCourses();
      renderCourses();
      renderCalendar();
      
      icsImportResult.className = 'success';
      icsImportResult.innerHTML = `<strong>导入成功！</strong><br>成功导入 ${importedCourses.length} 个课程/事件`;
      icsImportForm.reset();
      
      showToast(`成功导入 ${importedCourses.length} 个课程`);
    } catch (error) {
      icsImportResult.className = 'error';
      icsImportResult.textContent = '解析失败: ' + error.message;
    } finally {
      submitBtn.disabled = false;
    }
  };
  
  reader.onerror = function() {
    icsImportResult.className = 'error';
    icsImportResult.textContent = '文件读取失败';
    submitBtn.disabled = false;
  };
  
  reader.readAsText(icsFile);
}

// 将ICS事件转换为课程格式
function convertEventsToCourses(events) {
  const coursesMap = new Map();
  
  events.forEach(event => {
    if (!event.start || !event.summary) return;
    
    const courseName = event.summary;
    
    if (!coursesMap.has(courseName)) {
      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
      
      const startTime = formatTime(startDate);
      const endTime = formatTime(endDate);
      
      const frequency = event.rrule ? mapRRuleFrequency(event.rrule) : 'weekly';
      const repeatCount = event.rrule && event.rrule.count ? event.rrule.count : 16;
      
      coursesMap.set(courseName, {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: courseName,
        startTime: startTime,
        endTime: endTime,
        startDate: startDate.toISOString(),
        frequency: frequency,
        repeatCount: repeatCount,
        dayOfWeek: startDate.getDay(),
        lessons: [],
        timeline: []
      });
    }
    
    const course = coursesMap.get(courseName);
    course.lessons.push({
      week: course.lessons.length + 1,
      date: event.start.toISOString(),
      status: '',
      problem: ''
    });
  });
  
  return Array.from(coursesMap.values());
}

// 格式化时间为HH:MM
function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 将RRULE频率映射为课程频率
function mapRRuleFrequency(rrule) {
  if (!rrule || !rrule.freq) return 'weekly';
  
  switch (rrule.freq) {
    case 'daily':
      return 'daily';
    case 'weekly':
      return 'weekly';
    case 'biweekly':
      return 'biweekly';
    case 'monthly':
      return 'monthly';
    default:
      return 'weekly';
  }
}
