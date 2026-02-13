// 全局变量
let courses = [];
let currentDate = new Date();
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
  }
}

// 保存课程数据到本地存储
function saveCourses() {
  localStorage.setItem('courses', JSON.stringify(courses));
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
    lessons: []
  };
  
  // 生成课程的每一节课
  for (let i = 0; i < repeatCount; i++) {
    // 计算每节课的日期
    const lessonDate = new Date(courseDate);
    switch (frequency) {
      case 'weekly':
        lessonDate.setDate(lessonDate.getDate() + (i * 7));
        break;
      case 'biweekly':
        lessonDate.setDate(lessonDate.getDate() + (i * 14));
        break;
      case 'monthly':
        lessonDate.setMonth(lessonDate.getMonth() + i);
        break;
      case 'daily':
        lessonDate.setDate(lessonDate.getDate() + i);
        break;
    }
    
    newCourse.lessons.push({
      week: i + 1,
      date: lessonDate.toISOString(),
      status: '', // empty string for no status, attended, skipped, problematic, ddl
      problem: ''
    });
  }
  
  // 添加到课程列表
  courses.push(newCourse);
  
  // 保存到本地存储
  saveCourses();
  
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
      updateLessonStatus(courseId, lessonIndex, button.dataset.status);
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
  
  // 显示选中的视图
  if (view === 'calendar') {
    document.getElementById('calendarView').style.display = 'block';
  } else if (view === 'add-course') {
    document.getElementById('addCourseView').style.display = 'block';
  } else if (view === 'course-list') {
    document.getElementById('courseListView').style.display = 'block';
  }
}

// 渲染日历
function renderCalendar() {
  const calendar = document.getElementById('calendar');
  const currentMonthEl = document.getElementById('currentMonth');
  
  // 设置当前月份标题
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  currentMonthEl.textContent = `${currentDate.getFullYear()}年 ${monthNames[currentDate.getMonth()]}`;
  
  // 清空日历
  calendar.innerHTML = '';
  
  // 添加星期标题
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  weekDays.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-header-day';
    dayHeader.style.fontWeight = 'bold';
    dayHeader.style.textAlign = 'center';
    dayHeader.style.padding = '10px';
    dayHeader.textContent = day;
    calendar.appendChild(dayHeader);
  });
  
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
      eventEl.className = `course-event ${courseEvent.status}`;
      eventEl.textContent = courseEvent.name;
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
            problem: lesson.problem
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
              problem: lesson.problem
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
