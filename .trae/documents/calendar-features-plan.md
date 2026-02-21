# 日历增强功能实现计划

## 功能列表
1. 桌面系统级通知 (Desktop Notifications)
2. 右侧边栏联动 (Task Sidebar)
3. 拖拽调整时间 (Drag & Drop)
4. iCalendar (.ics) 导出

## 实现顺序
按优先级排序：先实现通知和边栏，最后实现拖拽和导出

---

## 功能 1: 桌面系统级通知

### 实现步骤
1. 在 calendar.js 添加 `initNotifications()` 函数请求通知权限
2. 添加 `checkUpcomingCourses()` 函数每分钟检查即将开始的课程
3. 提前 15 分钟发送系统通知
4. 在 `initCalendarEvents()` 中调用初始化函数

### 涉及文件
- `src/renderer/js/core/calendar.js`

---

## 功能 2: 右侧边栏联动

### 实现步骤
1. 在 index.html 添加侧边栏 HTML 结构
2. 在 calendar.css 添加侧边栏样式
3. 在 calendar.js 添加 `openTaskSidebar()` 和关闭函数
4. 为周视图课程卡片绑定点击事件
5. 显示课程详细信息和关联待办

### 涉及文件
- `src/renderer/index.html`
- `src/renderer/css/components/calendar.css`
- `src/renderer/js/core/calendar.js`

---

## 功能 3: 拖拽调整时间

### 实现步骤
1. 为课程卡片添加 `draggable = true`
2. 绑定 `dragstart` 和 `dragend` 事件
3. 为日历格子添加 `dragover`、`dragleave`、`drop` 事件
4. 计算拖拽后的新时间
5. 更新 AppStorage 中的课程时间
6. 重新渲染周视图

### 涉及文件
- `src/renderer/js/core/calendar.js`

---

## 功能 4: iCalendar (.ics) 导出

### 实现步骤
1. 在日历控制栏添加导出按钮
2. 添加 `exportToICS()` 函数生成 .ics 文件
3. 将课程数据转换为 iCalendar 格式
4. 触发浏览器下载

### 涉及文件
- `src/renderer/index.html`
- `src/renderer/js/core/calendar.js`

---

## 实施计划
1. 首先实现功能 1（通知）- 较为独立简单
2. 然后实现功能 2（边栏）- 需要修改 HTML + CSS + JS
3. 接着实现功能 3（拖拽）- 需要修改 JS
4. 最后实现功能 4（导出）- 需要修改 HTML + JS
