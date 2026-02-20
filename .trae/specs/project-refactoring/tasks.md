# 项目重构任务清单

## 任务总览

将项目代码重构为模块化架构，便于维护和扩展。

## JavaScript 模块化重构

### 核心模块 (core/)

- [ ] 任务 1: 创建应用入口模块 (core/app.js)
  - [ ] 1.1: 创建 core 目录
  - [ ] 1.2: 提取 initApp 函数
  - [ ] 1.3: 提取 loadCourses/saveCourses 函数
  - [ ] 1.4: 提取 switchView 函数

- [ ] 任务 2: 创建日历模块 (core/calendar.js)
  - [ ] 2.1: 提取 renderCalendar 函数
  - [ ] 2.2: 提取 renderWeekView 函数
  - [ ] 2.3: 提取 getCoursesForDate 函数
  - [ ] 2.4: 添加月份导航事件处理

- [ ] 任务 3: 创建课程管理模块 (core/course.js)
  - [ ] 3.1: 提取 addCourse 函数
  - [ ] 3.2: 提取 renderCourses 函数
  - [ ] 3.3: 提取 deleteCourse 函数
  - [ ] 3.4: 提取 getFrequencyText 函数
  - [ ] 3.5: 提取课程列表事件绑定

- [ ] 任务 4: 创建状态管理模块 (core/status.js)
  - [ ] 4.1: 提取 updateLessonStatus 函数
  - [ ] 4.2: 提取 showStatusMenu 函数
  - [ ] 4.3: 提取 closeAllStatusMenus 函数

- [ ] 任务 5: 创建时间轴模块 (core/timeline.js)
  - [ ] 5.1: 提取 showTimelineModal 函数
  - [ ] 5.2: 提取 saveTimeline 函数
  - [ ] 5.3: 提取 renderTimelineList 函数
  - [ ] 5.4: 提取 deleteTimeline 函数
  - [ ] 5.5: 提取 getTimelineForDate 函数

- [ ] 任务 6: 创建问题备注模块 (core/problem.js)
  - [ ] 6.1: 提取 showProblemModal 函数
  - [ ] 6.2: 提取 saveProblem 函数
  - [ ] 6.3: 提取问题浮窗相关函数

### 工具模块 (utils/)

- [ ] 任务 7: 创建日期工具模块 (utils/dateUtils.js)
  - [ ] 7.1: 创建 utils 目录
  - [ ] 7.2: 提取日期格式化函数
  - [ ] 7.3: 提取日期比较函数

- [ ] 任务 8: 创建存储工具模块 (utils/storage.js)
  - [ ] 8.1: 提取 localStorage 操作函数
  - [ ] 8.2: 封装统一的存储接口

### 组件模块 (components/)

- [ ] 任务 9: 创建 Toast 组件 (components/toast.js)
  - [ ] 9.1: 创建 components 目录
  - [ ] 9.2: 提取 showToast 函数
  - [ ] 9.3: 添加 Toast 样式到单独文件

- [ ] 任务 10: 创建 Modal 组件 (components/modal.js)
  - [ ] 10.1: 提取通用弹窗函数
  - [ ] 10.2: 封装弹窗打开/关闭逻辑

- [ ] 任务 11: 创建 StatusMenu 组件 (components/statusMenu.js)
  - [ ] 11.1: 提取状态菜单渲染逻辑

### 集成与测试

- [ ] 任务 12: 创建主入口文件
  - [ ] 12.1: 创建 main.js 引入所有模块
  - [ ] 12.2: 更新 index.html 引入方式

- [ ] 任务 13: 功能测试与验证
  - [ ] 13.1: 测试所有功能正常工作
  - [ ] 13.2: 修复可能的问题

## CSS 样式分离

- [ ] 任务 14: 创建 CSS 目录结构
  - [ ] 14.1: 创建 css/base/ 目录
  - [ ] 14.2: 创建 css/layout/ 目录
  - [ ] 14.3: 创建 css/components/ 目录

- [ ] 任务 15: 分离基础样式
  - [ ] 15.1: 创建 base/reset.css
  - [ ] 15.2: 创建 base/typography.css
  - [ ] 15.3: 创建 base/variables.css (CSS变量)

- [ ] 任务 16: 分离布局样式
  - [ ] 16.1: 创建 layout/navbar.css
  - [ ] 16.2: 创建 layout/container.css

- [ ] 任务 17: 分离组件样式
  - [ ] 17.1: 创建 components/calendar.css
  - [ ] 17.2: 创建 components/course.css
  - [ ] 17.3: 创建 components/modal.css
  - [ ] 17.4: 创建 components/toast.css
  - [ ] 17.5: 创建 components/form.css

- [ ] 任务 18: 创建主样式入口
  - [ ] 18.1: 创建 style.css 引入所有分离的样式

## 任务依赖关系

- [任务 1-6] 可并行执行
- [任务 7-11] 可并行执行
- [任务 12] 依赖于任务 1-11
- [任务 13] 依赖于任务 12
- [任务 14-17] 可并行执行
- [任务 18] 依赖于任务 14-17
- [任务 13] 完成后可并行进行任务 18

## 验收标准

1. 所有 JavaScript 功能正常工作
2. 所有 CSS 样式正确应用
3. 代码可读性和可维护性显著提升
4. 模块之间低耦合，易于单独修改
5. 不改变任何现有功能的行为
