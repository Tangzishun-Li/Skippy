# 验证检查清单

## JavaScript 模块化验证

### 核心模块检查

- [ ] 任务 1: core/app.js 存在且功能完整
  - [ ] initApp 函数正确导出
  - [ ] loadCourses 函数正确导出
  - [ ] saveCourses 函数正确导出
  - [ ] switchView 函数正确导出

- [ ] 任务 2: core/calendar.js 存在且功能完整
  - [ ] renderCalendar 函数正确导出
  - [ ] renderWeekView 函数正确导出
  - [ ] getCoursesForDate 函数正确导出
  - [ ] 月份导航事件处理正确

- [ ] 任务 3: core/course.js 存在且功能完整
  - [ ] addCourse 函数正确导出
  - [ ] renderCourses 函数正确导出
  - [ ] deleteCourse 函数正确导出
  - [ ] getFrequencyText 函数正确导出

- [ ] 任务 4: core/status.js 存在且功能完整
  - [ ] updateLessonStatus 函数正确导出
  - [ ] showStatusMenu 函数正确导出
  - [ ] closeAllStatusMenus 函数正确导出

- [ ] 任务 5: core/timeline.js 存在且功能完整
  - [ ] showTimelineModal 函数正确导出
  - [ ] saveTimeline 函数正确导出
  - [ ] renderTimelineList 函数正确导出
  - [ ] deleteTimeline 函数正确导出

- [ ] 任务 6: core/problem.js 存在且功能完整
  - [ ] showProblemModal 函数正确导出
  - [ ] saveProblem 函数正确导出

### 工具模块检查

- [ ] 任务 7: utils/dateUtils.js 存在且功能完整
- [ ] 任务 8: utils/storage.js 存在且功能完整

### 组件模块检查

- [ ] 任务 9: components/toast.js 存在且功能完整
- [ ] 任务 10: components/modal.js 存在且功能完整
- [ ] 任务 11: components/statusMenu.js 存在且功能完整

### 集成检查

- [ ] 任务 12: main.js 正确引入所有模块
- [ ] 任务 13: 所有功能测试通过
  - [ ] 课程添加功能正常
  - [ ] 课程删除功能正常
  - [ ] 日历视图正常显示
  - [ ] 课程状态标记正常
  - [ ] 问题备注功能正常
  - [ ] 时间轴标注功能正常
  - [ ] 导入功能正常
  - [ ] Toast通知正常显示

## CSS 样式分离验证

- [ ] 任务 14: CSS 目录结构正确创建
- [ ] 任务 15: 基础样式分离完成
  - [ ] base/reset.css 存在
  - [ ] base/typography.css 存在
  - [ ] base/variables.css 存在
- [ ] 任务 16: 布局样式分离完成
  - [ ] layout/navbar.css 存在
  - [ ] layout/container.css 存在
- [ ] 任务 17: 组件样式分离完成
  - [ ] components/calendar.css 存在
  - [ ] components/course.css 存在
  - [ ] components/modal.css 存在
  - [ ] components/toast.css 存在
  - [ ] components/form.css 存在
- [ ] 任务 18: 主样式入口正确配置
  - [ ] style.css 正确引入所有分离的样式文件
  - [ ] 页面样式正确应用

## 功能完整性验证

- [ ] 课程管理功能（增删改查）
- [ ] 日历视图（月视图、周视图）
- [ ] 课程状态标记（已上、未上、有问题、DDL）
- [ ] 问题备注功能
- [ ] 时间轴标注功能
- [ ] 法定节假日跳过
- [ ] Toast通知提示
- [ ] 操作指引
- [ ] Google日历导入
- [ ] ICS文件导入
