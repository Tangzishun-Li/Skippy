# Electron 日历网站技术方案

**Date**: March 10, 2026 at 09:22 AM
**Turns**: 10
**Source**: [Gemini Chat](https://gemini.google.com/app/eb338b18f31d05ba?hl=zh-cn)

---

## Turn 1

### 👤 User

给我做一个实用的日历网站，我用electron，想要和Google calender一样，月视图，周视图，日视图。周视图的还可以拖动时间，而且点击还有反馈
1. 核心交互与体验优化 (UI/UX)
除了基础的拖拽，现代日历在交互上还有很多可以打磨的细节：
快捷创建与内联编辑： 用户在日历空白处双击或拖拽出一个时间块时，直接弹出一个轻量级的气泡卡片（Pop-up）快速输入标题，而不是跳转到新页面。
跨天/跨周拖拽： 周视图中，不仅要能上下拖动改变时间，还要能左右拖动改变日期；甚至拖住日程的底部边缘来缩放调整时长。
迷你日历导航： 在侧边栏提供一个迷你的月历，方便用户快速跳转到几个月后的某一天，而不需要在主视图里狂点“下一周”。
时区支持： 如果有跨国协作或网课需求，支持显示双时区或者自动转换时区是非常硬核且实用的功能。
2. 日程管理深度
一个实用的日历不能只能记单次事件，还需要应对复杂的现实生活：
循环日程 (Recurring Events)： 这是排课表或周会的刚需。需要支持“每天”、“每周三”、“每隔一周”、“工作日”等自定义重复规则，以及“修改单次”或“修改后续所有”的逻辑。
分类与颜色标签： 允许用户创建不同的日历层（例如：学业、个人、兼职），并为它们分配不同的颜色，支持一键隐藏/显示某个分类。
多重提醒机制： 支持事件开始前 10 分钟、1 小时或 1 天的弹窗提醒或系统通知。

### 🤖 Assistant

太棒了！你列出的这些需求非常专业，完美切中了一个现代化、高可用性的日程/课程管理工具的核心痛点。用 Electron 来做这个项目是非常合适的选择，因为你可以深度调用操作系统的原生能力（比如系统级弹窗提醒、离线本地存储等）。
要从零开始手写一个媲美 Google Calendar 的拖拽排表、跨天逻辑和视口计算，工作量是极其巨大的（涉及到复杂的 DOM 计算、闰年和夏令时处理）。为了保证项目的“实用性”和开发效率，**强烈建议采用成熟的日历引擎作为底层，配合现代前端框架来构建 UI**。
这里为你整理了一套可以直接落地的技术方案和架构设计：

### 1. 核心技术栈推荐

- **前端框架**：React 或 Vue（推荐 React，生态更丰富）。
- **日历引擎**：**FullCalendar**。这是目前前端最强大的开源日历库，原生支持月/周/日视图、跨天/跨周拖拽（Drag & Drop）、边缘缩放时长（Resize），并且对时区支持极好。
- **重复规则引擎**：`rrule.js`。处理“每隔两周的周三”这种复杂的循环日程，必须依赖标准的 RFC 5545 协议（iCalendar 标准），手写逻辑容易出 Bug。
- **本地存储**：`better-sqlite3`（在 Electron 主进程中运行）。相比于简单的 JSON，关系型数据库在处理复杂的标签、分类和按时间范围查询日程时性能更好。

---

### 2. 核心交互与体验优化 (UI/UX) 落地指南
**A. 快捷创建与内联编辑 (Pop-up 气泡)**
利用 FullCalendar 的 `select` 回调函数。当用户在周视图上拖拽出一块空白时间后，获取这段时间的 `start` 和 `end` 坐标，结合 UI 组件库（如 Ant Design 或 Material-UI）的 `Popover` 组件，在鼠标位置弹出一个绝对定位的输入框。
**B. 跨天/跨周拖拽与缩放反馈**
FullCalendar 的 `interactionPlugin` 直接自带这些功能。你只需要开启它，并监听事件：

- `eventDrop`: 拖拽结束后触发，返回新的开始/结束时间，此时通过 Electron 的 IPC 发送给主进程更新数据库。
- `eventResize`: 拖住底部缩放时长后触发。
- *点击反馈*：可以在日程块（Event Render）上自定义 CSS 动画（如 `transform: scale(0.98)`），实现点击时的物理按压感。
**C. 迷你日历导航**
在界面的左侧边栏放置一个轻量级的日期选择器（Date Picker）。当在这个迷你日历上点击某一天时，调用主日历的 API：`calendarApi.gotoDate(selectedDate)`，实现主视图的瞬间跳转。
**D. 时区支持**
引入 `moment-timezone`。在日历初始化时设置用户的默认时区，并在侧边栏提供一个下拉菜单。切换时区时，所有日程的渲染会自动根据 UTC 时间加上偏移量重新计算，这对跨时区的网课或会议极其有用。

---

### 3. 日程管理深度实现
**A. 循环日程 (Recurring Events) 的数据结构**
不要在数据库里把循环日程拆分成无数个单次事件！这会撑爆数据库。
正确的做法是存储一个 `rrule` 字符串。例如：“每周一、三、五上课”在数据库里存为：`FREQ=WEEKLY;BYDAY=MO,WE,FR`。
当你想“修改后续所有”时，更新这个 rrule 即可；当你想“仅修改单次”（比如某节课临时调休），则在数据库中记录一个 Exception（排除该日期），并新建一个单次事件。
**B. 分类与颜色标签**
在你的数据库表结构中设计 `Categories` 表。
给每个日程绑定一个 `categoryId`。在前端，根据这个 ID 映射出不同的背景色（如学业是蓝色，个人是绿色）。侧边栏做几个 Checkbox，勾选/取消时，通过前端过滤（Filter）立刻隐藏或显示对应的日程流。
**C. 多重提醒机制 (Electron 独家优势)**
这是 Web 网页版日历很难做好的，但 Electron 可以完美实现：

1. **轮询或定时器**：在 Electron 的不可见后台进程中，维护一个即将到来的日程队列。
2. **系统级通知**：使用 Electron原生的 `Notification` API。哪怕用户把日历应用最小化到了托盘，时间一到（比如提前 10 分钟），右下角依然会准时弹出系统通知框。
3. **声音反馈**：弹窗时配合清脆的提示音。

---

### 代码结构示例 (React + FullCalendar)
如果你使用 React，核心的日历组件大概长这样：

```javascript
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function MyCalendar() {
  const handleDateSelect = (selectInfo) => {
    // 这里触发气泡卡片 (Pop-up)，让用户快速输入标题
    let title = prompt('请输入日程标题 (后续替换为气泡UI):');
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // 清除拖拽高亮

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay
      });
      // TODO: 通过 IPC 发送给 Electron 主进程保存到数据库
    }
  };

  const handleEventDrop = (dropInfo) => {
    // 拖拽改变时间后的回调，保存新时间
    console.log("日程移动到了:", dropInfo.event.start);
  };

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        initialView="timeGridWeek"
        editable={true} // 开启拖拽和缩放
        selectable={true} // 开启空白处拖拽创建
        selectMirror={true} // 拖拽时显示占位阴影
        dayMaxEvents={true}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        // events={your_event_data_array}
      />
    </div>
  );
}

```
针对你这个项目，我们可以一步步来。**你想先从前端的 UI 框架和 FullCalendar 的基础搭建开始，还是先讨论 Electron 主进程与本地数据库（SQLite）的数据结构设计？** 我们可以聚焦其中一块深入聊聊。

## Turn 2

### 👤 User

先从前端的 UI 框架和 FullCalendar 的基础搭建开始

### 🤖 Assistant

没问题，从前端跑起来、看到实实在在的界面，是最容易获得成就感的一步。既然这会是 Tody (逃课宝) 的核心排课与日程界面，我们对它的流畅度和现代化质感要求就要高一些。
为了兼顾开发效率和最终的运行性能，前端框架我们直接采用 **React + Vite**。Vite 构建速度极快，非常适合配合 Electron 进行热更新开发。
下面是基础搭建的完整起步指南：

### 1. 初始化项目与安装依赖
假设你已经搭建好了基础的 Electron + Vite + React 骨架（如果没有，可以使用 `npm create vite@latest tody-calendar -- --template react` 快速生成）。
接下来，在你的前端项目目录下，安装 FullCalendar 的核心包以及我们需要的视图插件：

```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

```

- `@fullcalendar/react`: React 的官方适配器。
- `@fullcalendar/daygrid`: 提供月视图 (Month View)。
- `@fullcalendar/timegrid`: 提供带时间轴的周视图 (Week View) 和日视图 (Day View)。
- `@fullcalendar/interaction`: **灵魂插件**，负责处理拖拽 (Drag & Drop)、缩放、点击等交互。

### 2. 编写基础日历组件
在你的 `src` 目录下创建一个 `CalendarView.jsx` 文件。我们要在这里把月、周、日视图整合起来，并加上中文支持和基础的交互开关。

```javascript
import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// 引入基础样式 (根据 FullCalendar v6+ 的设计，通常不需要手动引 css，但如果有自定义需求可在此处覆盖)
import './CalendarView.css'; 

export default function CalendarView() {
  const calendarRef = useRef(null);

  // 模拟一些初始的日程/课程数据
  const initialEvents = [
    {
      id: '1',
      title: '编译原理',
      start: new Date().toISOString().split('T')[0] + 'T10:00:00',
      end: new Date().toISOString().split('T')[0] + 'T12:00:00',
      backgroundColor: '#4285F4', // Google Calendar 经典的蓝色
    },
    {
      id: '2',
      title: '小组周会',
      start: new Date().toISOString().split('T')[0] + 'T14:30:00',
      end: new Date().toISOString().split('T')[0] + 'T15:30:00',
      backgroundColor: '#34A853', // 绿色
    }
  ];

  // 日期点击/拖拽选中的回调 (准备做气泡弹窗)
  const handleDateSelect = (selectInfo) => {
    console.log('用户选中了时间段:', selectInfo.startStr, '到', selectInfo.endStr);
    // 稍后我们会在这里拦截默认行为，弹出自定义的气泡卡片
  };

  // 拖拽改变时间的回调
  const handleEventDrop = (dropInfo) => {
    console.log(`日程 "${dropInfo.event.title}" 移动到了:`, dropInfo.event.start);
    // 稍后通过 Electron IPC 通知数据库更新
  };

  // 调整日程时长的回调
  const handleEventResize = (resizeInfo) => {
    console.log(`日程 "${resizeInfo.event.title}" 时长改变，结束时间为:`, resizeInfo.event.end);
  };

  return (
    <div className="calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        
        // 顶部工具栏配置
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        
        // 默认视图为周视图 (最常用的排表视图)
        initialView="timeGridWeek"
        
        // 本地化设置
        locale="zh-cn"
        buttonText={{
          today: '今天',
          month: '月',
          week: '周',
          day: '日'
        }}
        
        // 核心交互开关
        editable={true}       // 允许拖拽和缩放日程
        selectable={true}     // 允许用户在日历上拖拽划定一个时间范围
        selectMirror={true}   // 拖拽划定时显示半透明的占位块，体验更好
        dayMaxEvents={true}   // 月视图下，如果一天日程太多则显示 "更多..."
        
        // 限制时间轴显示范围 (例如只显示早上 7 点到晚上 11 点)
        slotMinTime="07:00:00"
        slotMaxTime="23:00:00"
        
        // 绑定事件数据和回调
        initialEvents={initialEvents}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        
        // 高度撑满父容器
        height="100%"
      />
    </div>
  );
}

```

### 3. 让日历铺满桌面级窗口 (CSS)
Electron 作为桌面应用，日历界面通常需要填满整个窗口，而不是像网页那样有滚动条。在你的 `CalendarView.css` 或全局样式中，加上这段布局控制：

```css
/* 假设你的 App 根节点占满全屏 */
html, body, #root {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden; /* 防止出现外层滚动条 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.calendar-wrapper {
  /* 留出一点内边距，或者配合侧边栏使用 flex 布局 */
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  background-color: #ffffff;
}

/* 稍微美化一下 FullCalendar 的默认边框，使其更现代 */
.fc-theme-standard td, .fc-theme-standard th {
  border-color: #e0e0e0;
}

/* 当前时间线的颜色 (标志现在是几点的那条红线) */
.fc .fc-timegrid-now-indicator-line {
  border-color: #ea4335; 
}
.fc .fc-timegrid-now-indicator-arrow {
  border-color: #ea4335;
  background-color: #ea4335;
}

```

### 跑起来看看！
把这个 `CalendarView` 组件挂载到你的主页面上运行起来。现在你应该能看到一个带有“月、周、日”切换功能的标准日历了。你可以尝试用鼠标拖动那两个预设的日程（支持跨天拖拽），或者在空白的地方下拉拖拽出一个新的时间段。
基础框架搭好后，骨架就有了。**下一步，你想先死磕“双击/拖拽空白处弹出轻量级创建气泡” (Pop-up UI) 的交互，还是先规划侧边栏的“迷你日历导航”？**

## Turn 3

### 👤 User

想先死磕“双击/拖拽空白处弹出轻量级创建气泡” (Pop-up UI) 的交互

### 🤖 Assistant

太有眼光了！这个轻量级的气泡弹窗（Pop-up UI）绝对是整个日历交互的“灵魂”。它能打断用户的操作心流降到最低，尤其是在为逃课宝（Tody）排布密集的课程表或碎片化任务时，这种“随手一划、打字即存”的丝滑感是核心竞争力。
要实现这个效果，核心思路是：**拦截 FullCalendar 的默认选中事件，获取鼠标松开时的屏幕坐标（X/Y），然后在这个坐标上绝对定位（Absolute Position）渲染一个 React 组件。**
下面是完整的代码演进，我们给 `CalendarView.jsx` 加上这个气泡引擎。

### 1. 升级组件状态 (State)
我们需要引入几个 React State 来控制气泡的显示、位置以及暂存的时间数据。

```javascript
import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
// ... (保留之前的 dayGridPlugin, timeGridPlugin, interactionPlugin 等引入)

export default function CalendarView() {
  const calendarRef = useRef(null);

  // --- 气泡弹窗的状态管理 ---
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [draftEvent, setDraftEvent] = useState(null); // 暂存用户拖拽出的时间段
  const [eventTitle, setEventTitle] = useState('');   // 输入框绑定的标题

  // ... (保留 initialEvents)

```

### 2. 改造拖拽/选中回调函数
当用户在空白处拖拽完毕松开鼠标时，FullCalendar 会触发 `select`。我们需要从这个回调的 `jsEvent` 中提取鼠标位置。

```javascript
  const handleDateSelect = (selectInfo) => {
    // 1. 获取鼠标松开时的视口坐标
    const mouseX = selectInfo.jsEvent.clientX;
    const mouseY = selectInfo.jsEvent.clientY;

    // 2. 简单的边界处理：防止气泡超出屏幕右侧或下方 (假设气泡宽300px, 高150px)
    const popupWidth = 300;
    const popupHeight = 150;
    const finalX = mouseX + popupWidth > window.innerWidth ? window.innerWidth - popupWidth - 20 : mouseX;
    const finalY = mouseY + popupHeight > window.innerHeight ? window.innerHeight - popupHeight - 20 : mouseY;

    // 3. 更新状态，呼出气泡
    setPopupPos({ x: finalX, y: finalY });
    setDraftEvent(selectInfo); // 保存这段时间的 start, end 等信息
    setEventTitle('');         // 清空上一次的输入
    setShowPopup(true);
  };

  // 点击空白处或其他地方时，关闭气泡
  const handleUnselect = () => {
    setShowPopup(false);
  };

```

### 3. 编写气泡 UI 与保存逻辑
我们需要一个弹窗组件，以及确认保存时的逻辑。

```javascript
  // 保存日程的逻辑
  const handleSaveEvent = () => {
    if (eventTitle.trim() && draftEvent) {
      const calendarApi = draftEvent.view.calendar;
      
      // 在日历上渲染出这个新日程
      calendarApi.addEvent({
        id: String(Date.now()), // 临时ID，后续由本地数据库生成
        title: eventTitle,
        start: draftEvent.startStr,
        end: draftEvent.endStr,
        allDay: draftEvent.allDay,
        backgroundColor: '#4285F4' // 默认课程/任务颜色
      });
      
      // TODO: 这里将来可以通过 Electron IPC 发送给主进程写入 SQLite 数据库
    }
    
    // 清理现场
    closePopup();
  };

  const closePopup = () => {
    setShowPopup(false);
    if (draftEvent) {
      draftEvent.view.calendar.unselect(); // 清除日历上的拖拽高亮阴影
    }
  };

  // 监听键盘事件：按 Enter 保存，按 Esc 取消
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEvent();
    if (e.key === 'Escape') closePopup();
  };

```

### 4. 组装 JSX 与渲染气泡
现在，我们将气泡组件通过绝对定位覆盖在日历上方。

```javascript
  return (
    <div className="calendar-wrapper" style={{ position: 'relative', height: '100vh' }}>
      <FullCalendar
        // ... (保留之前的 FullCalendar 配置)
        select={handleDateSelect}
        unselect={handleUnselect}
        unselectAuto={false} // 重要！设为 false 防止点击气泡内部时意外清除高亮
      />

      {/* 绝对定位的创建气泡 */}
      {showPopup && (
        <div 
          className="event-popup-card"
          style={{
            position: 'absolute',
            left: `${popupPos.x}px`,
            top: `${popupPos.y}px`,
            zIndex: 1000, // 确保浮在日历最上层
          }}
        >
          <div className="popup-header">
            <span className="close-btn" onClick={closePopup}>✕</span>
          </div>
          <div className="popup-body">
            <input 
              autoFocus // 弹窗出现时自动聚焦，用户可以直接打字
              type="text" 
              placeholder="添加课程或任务名称..." 
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {/* 这里可以展示格式化后的时间，例如 "10:00 - 11:30" */}
            <div className="time-display">
               {draftEvent && new Date(draftEvent.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
               {draftEvent && new Date(draftEvent.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
          <div className="popup-footer">
            <button className="save-btn" onClick={handleSaveEvent}>保存</button>
          </div>
        </div>
      )}
    </div>
  );
}

```

### 5. 注入灵魂的 CSS 样式
为了让它看起来像 Google Calendar 一样具有现代感和悬浮感，加上这段 CSS（可以在你的 `CalendarView.css` 中添加）：

```css
.event-popup-card {
  width: 300px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0,0,0,0.2);
  padding: 16px;
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.popup-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.close-btn {
  cursor: pointer;
  color: #5f6368;
  font-size: 14px;
  padding: 4px;
}

.close-btn:hover {
  background-color: #f1f3f4;
  border-radius: 50%;
}

.popup-body input {
  width: 100%;
  border: none;
  border-bottom: 2px solid #1a73e8;
  font-size: 18px;
  padding: 4px 0;
  outline: none;
  margin-bottom: 12px;
  color: #3c4043;
}

.popup-body input::placeholder {
  color: #70757a;
}

.time-display {
  font-size: 13px;
  color: #5f6368;
  margin-bottom: 16px;
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  background-color: #1a73e8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-btn:hover {
  background-color: #1557b0;
}

```

### 跑起来的体验
现在，当你在周视图里按住鼠标拖拽出一个时间段后松开：

1. 原本的地方会保留蓝色的半透明阴影（表示选中区域）。
2. 鼠标松开的位置会“嘭”地弹出一个带阴影的白色卡片。
3. 输入框会自动获取焦点，你直接敲击键盘输入名字，按下 `Enter` 键。
4. 气泡消失，日程完美地落入刚才你拖拽的方块中！
这套逻辑完全解耦了界面的渲染和底层的保存，非常健壮。接下来，你可以尝试在这个气泡里加上**颜色选择器**，或者我们继续往深处走，聊聊怎么把这些生成的事件通过 Electron 的 IPC 机制存进本地 SQLite 数据库里？

## Turn 4

### 👤 User

规划侧边栏的“迷你日历导航”

### 🤖 Assistant

侧边栏的“迷你日历导航”是提升整个应用专业感的关键。为了让逃课宝 (Tody) 的整体界面具有类似 macOS 原生应用的精致质感，我们需要采用经典的**“左右分栏布局” (Sidebar + Main Content)**。
这里的核心技术难点在于**双向绑定 (Two-way Synchronization)**：

1. 点击左侧迷你日历的某一天，右侧的主视图要瞬间跳转到那一周/那一天。
2. 在右侧主视图点击“上一周/下一周”时，左侧迷你日历的月份和高亮状态也要跟着同步翻页。
为了保持应用的轻量级，侧边栏的迷你日历我不建议再引入一个庞大的组件库，我们可以使用非常纯粹且易于覆盖样式的 `react-calendar`。
以下是完整的落地步骤：

### 1. 安装迷你日历依赖
在你的终端中运行：

```bash
npm install react-calendar

```

### 2. 重构整体布局 (Layout)
我们需要在 `CalendarView.jsx` 的外层包裹一个父组件，或者直接在里面使用 Flexbox 把它分成左右两块。

```javascript
import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import MiniCalendar from 'react-calendar'; // 引入迷你日历
import 'react-calendar/dist/Calendar.css'; // 引入其基础样式（稍后我们会用 CSS 覆盖它，使其更美观）
import './CalendarView.css'; 

export default function CalendarApp() {
  const mainCalendarRef = useRef(null);
  
  // 核心状态：当前选中的日期，用于双向同步
  const [currentDate, setCurrentDate] = useState(new Date());

  // ... (保留之前的 showPopup, popupPos 等气泡状态和函数)

  // ================= 核心：双向同步逻辑 =================

  // 1. 迷你日历 -> 主日历：点击左侧迷你日历时触发
  const handleMiniCalendarChange = (newDate) => {
    setCurrentDate(newDate); // 更新高亮状态
    // 获取主日历的 API 实例，强制跳转到所选日期
    let calendarApi = mainCalendarRef.current.getApi();
    calendarApi.gotoDate(newDate);
  };

  // 2. 主日历 -> 迷你日历：主日历发生翻页（上一周、下一周、今天）时触发
  const handleMainCalendarDatesSet = (dateInfo) => {
    // dateInfo.view.currentStart 可以获取当前视图第一天的日期
    // 我们用它来同步左侧迷你日历的月份显示
    setCurrentDate(dateInfo.view.currentStart);
  };

  return (
    <div className="app-container">
      
      {/* 左侧边栏 */}
      <div className="sidebar">
        <div className="sidebar-header">
           {/* 这里可以放一个“新建日程”的醒目大按钮 */}
           <button className="create-btn" onClick={() => {/* 触发一个居中的大弹窗 */}}>
             + 创建日程
           </button>
        </div>
        
        <div className="mini-calendar-wrapper">
          <MiniCalendar 
            onChange={handleMiniCalendarChange} 
            value={currentDate} 
            locale="zh-CN"
            prev2Label={null} // 隐藏跳过一年的按钮，保持 UI 简洁
            next2Label={null}
          />
        </div>

        {/* 侧边栏下方可以预留给“日历分类（我的课表、作业、个人）”的 Checkbox 列表 */}
        <div className="calendar-filters">
           <h3>我的日历</h3>
           {/* TODO: 分类列表 */}
        </div>
      </div>

      {/* 右侧主日历视图 */}
      <div className="main-calendar">
        <FullCalendar
          ref={mainCalendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'today prev,next',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="timeGridWeek"
          datesSet={handleMainCalendarDatesSet} // 监听翻页事件，反向同步给迷你日历
          
          // ... (保留之前的 select, editable 等配置)
          height="100%"
        />
        
        {/* 这里放置之前写的气泡弹窗代码 {showPopup && <div className="event-popup-card">...</div>} */}
      </div>
      
    </div>
  );
}

```

### 3. 注入现代化的分栏 CSS
原生的 `react-calendar` 样式比较复古，我们需要用 CSS 把它“洗”成现代 macOS 或 Google Calendar 的无边框扁平风格。把这些加入到你的 CSS 文件中：

```css
/* 外层 Flex 布局 */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa; /* 整体浅灰色背景 */
  overflow: hidden;
}

/* 左侧边栏样式 */
.sidebar {
  width: 260px;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  z-index: 10;
}

/* 醒目的创建按钮 */
.sidebar-header {
  padding: 0 16px 20px 16px;
}
.create-btn {
  width: 100%;
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #dadce0;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  color: #3c4043;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
  transition: background-color 0.2s, box-shadow 0.2s;
}
.create-btn:hover {
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
}

/* ====== 魔改 react-calendar 样式 ====== */
.mini-calendar-wrapper {
  padding: 0 16px;
}
.react-calendar {
  width: 100%;
  border: none !important; /* 去掉默认边框 */
  font-family: inherit;
}
.react-calendar__navigation button {
  min-width: 30px;
  background: none;
  border-radius: 4px;
}
.react-calendar__navigation button:hover {
  background-color: #f1f3f4 !important;
}
.react-calendar__month-view__days__day {
  border-radius: 50%; /* 把方形日期变成圆形 */
  height: 32px;
  width: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 2px auto;
}
.react-calendar__month-view__days__day:hover {
  background-color: #f1f3f4 !important;
}
/* 选中日期的颜色 */
.react-calendar__tile--active, 
.react-calendar__tile--hasActive {
  background-color: #1a73e8 !important;
  color: white !important;
}
.react-calendar__tile--now {
  background-color: #e8f0fe;
  color: #1a73e8;
}

/* 右侧主区域占满剩余空间 */
.main-calendar {
  flex: 1;
  padding: 16px 24px;
  position: relative; /* 保证气泡弹窗的绝对定位是相对于主视图的 */
  background-color: #ffffff;
}

/* 微调 FullCalendar 头部，使其与侧边栏对齐 */
.fc .fc-toolbar.fc-header-toolbar {
  margin-bottom: 24px;
}

```

### 跑起来的体验
现在你的界面会有质的飞跃：

1. 左边是一个宽度 260px 的白色干净侧边栏，顶部有一个带有阴影的悬浮“+ 创建日程”按钮。
2. 侧边栏中间是一个极其扁平、带有圆形交互高亮的迷你日历。
3. 右边是宽敞的主排表区域。
4. **最酷的是**：你在右边狂点下一周查看未来的课表时，左边的迷你日历会自动翻页跟上；当你想看期末考那一周（比如两个月后），直接在左边迷你日历点一下，右边的主视图瞬间切换过去，没有任何延迟。
UI 框架和核心的交互现在已经彻底成型了。接下来，咱们就到了 Electron 最核心的本地化阶段。**你是想先把这些“写死”的日程数据接入到 SQLite 数据库里实现持久化存储，还是想先研究一下怎么利用 Electron 做“提前 10 分钟系统弹窗提醒”？**

## Turn 5

### 👤 User

SQLite 数据库，并且支持用户输入日程

### 🤖 Assistant

太棒了！接入本地 SQLite 数据库是让这个项目真正从“网页玩具”蜕变成“桌面级生产力工具”的关键一步。既然这是为逃课宝（Tody）设计的核心模块，我们在设计数据库表结构时，就要考虑到不仅能存普通的单次日程，还要为未来的“课程表”和“任务管理”留出扩展空间。
在 Electron 架构中，**React 前端是不能直接操作本地数据库的**。我们需要建立一套标准的 IPC（进程间通信）机制：前端（渲染进程）发送请求 👉 Preload（桥梁） 👉 主进程（Node.js）执行 SQLite 读写。
下面是完整的落地指南：

### 1. 安装高能效的 SQLite 驱动
在你的 Electron 项目根目录（通常是 `package.json` 所在位置）安装 `better-sqlite3`。它是目前 Node.js 生态里最快、最适合 Electron 的同步 SQLite 库。

```bash
npm install better-sqlite3

```

---

### 2. 在主进程初始化数据库 (Main Process)
在你的 Electron 主进程文件（例如 `main.js` 或 `src/main/index.js`）中，引入数据库并建表。我们要为逃课宝设计一个实用的表结构。

```javascript
// main.js (Electron 主进程部分代码)
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// 初始化数据库文件，存放在用户的应用数据目录中，防止应用更新时数据丢失
const dbPath = path.join(app.getPath('userData'), 'tody_calendar.db');
const db = new Database(dbPath);

// 初始化表结构
function initDB() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      is_all_day INTEGER DEFAULT 0,
      category TEXT DEFAULT 'default', -- 用于区分课程、作业、个人事务
      rrule TEXT -- 预留给未来做循环日程（比如每周的课）
    )
  `;
  db.exec(createTableQuery);
}

// === 监听前端发来的请求 (IPC Handlers) ===

// 1. 获取所有日程
ipcMain.handle('get-events', () => {
  const stmt = db.prepare('SELECT * FROM events');
  const events = stmt.all();
  // 将数据库字段映射为 FullCalendar 需要的格式
  return events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.start_time,
    end: e.end_time,
    allDay: e.is_all_day === 1,
    // 简单的颜色映射逻辑
    backgroundColor: e.category === 'course' ? '#4285F4' : '#34A853' 
  }));
});

// 2. 添加新日程
ipcMain.handle('add-event', (event, eventData) => {
  const stmt = db.prepare(`
    INSERT INTO events (id, title, start_time, end_time, is_all_day, category)
    VALUES (@id, @title, @start, @end, @allDay, @category)
  `);
  
  stmt.run({
    id: eventData.id,
    title: eventData.title,
    start: eventData.start,
    end: eventData.end,
    allDay: eventData.allDay ? 1 : 0,
    category: eventData.category || 'default'
  });
  return { success: true };
});

app.whenReady().then(() => {
  initDB(); // 启动时建表
  // ... 创建你的 BrowserWindow
});

```

---

### 3. 搭建安全桥梁 (Preload Script)
Electron 为了安全，要求必须通过 `preload.js` 暴露 API 给 React 前端。在你的 `preload.js` 文件中添加：

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todyAPI', {
  getEvents: () => ipcRenderer.invoke('get-events'),
  addEvent: (eventData) => ipcRenderer.invoke('add-event', eventData),
});

```
*(注意：确保在创建 BrowserWindow 时加载了这个 preload.js)*。

---

### 4. 前端 React 接入数据库 (UI 联动)
回到我们之前写的 `CalendarView.jsx`。我们需要做两件事：**一是在组件加载时从数据库读取数据，二是在气泡弹窗点击“保存”时写入数据库。**

```javascript
import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
// ... 引入其他插件

export default function CalendarApp() {
  const mainCalendarRef = useRef(null);
  
  // 用于存储从数据库加载的日程
  const [events, setEvents] = useState([]);
  
  // 气泡弹窗状态
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [draftEvent, setDraftEvent] = useState(null);
  const [eventTitle, setEventTitle] = useState('');

  // 1. 组件挂载时，从 SQLite 加载数据
  useEffect(() => {
    const loadEvents = async () => {
      // 调用 preload 暴露的 API
      if (window.todyAPI) {
        const dbEvents = await window.todyAPI.getEvents();
        setEvents(dbEvents);
      }
    };
    loadEvents();
  }, []); // 空依赖数组，只在初次渲染时执行

  // 2. 魔改保存逻辑：写入数据库并更新 UI
  const handleSaveEvent = async () => {
    if (eventTitle.trim() && draftEvent) {
      const newEvent = {
        id: `tody_${Date.now()}`, // 生成唯一 ID
        title: eventTitle,
        start: draftEvent.startStr,
        end: draftEvent.endStr,
        allDay: draftEvent.allDay,
        category: 'course' // 可以根据侧边栏的选择动态传入
      };

      // 保存到本地 SQLite
      if (window.todyAPI) {
        await window.todyAPI.addEvent(newEvent);
      }

      // 更新 React 状态，让 FullCalendar 立刻渲染出来
      // 注意：FullCalendar 接收的事件对象格式
      setEvents(prevEvents => [...prevEvents, {
        id: newEvent.id,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        allDay: newEvent.allDay,
        backgroundColor: '#4285F4'
      }]);
    }
    
    closePopup();
  };

  const closePopup = () => {
    setShowPopup(false);
    if (draftEvent) {
      draftEvent.view.calendar.unselect();
    }
  };

  // ... (保留之前的 handleDateSelect 等逻辑)

  return (
    <div className="app-container">
      {/* ... (侧边栏代码保留) ... */}

      <div className="main-calendar">
        <FullCalendar
          ref={mainCalendarRef}
          // ... 基础配置保留
          
          // 将从数据库读取的状态绑定到日历上！
          events={events} 
          
          select={handleDateSelect}
          // ... 其他交互回调保留
        />
        
        {/* 气泡弹窗 UI 保持不变 */}
        {showPopup && (
           <div className="event-popup-card" style={{/*...*/}}>
              {/* ... input 和 button 绑定 onChange 和 handleSaveEvent ... */}
           </div>
        )}
      </div>
    </div>
  );
}

```

### 体验数据持久化的魔法
现在重新编译并运行你的应用：

1. 用鼠标拖拽出一个空白时间块，气泡弹出。
2. 输入“高等数学”并按下回车/点击保存。
3. 日程立刻出现在日历上。
4. **最关键的测试**：按下 `Ctrl+R`（或 `Cmd+R`）刷新 Electron 窗口，或者干脆彻底关掉应用再重新打开。
5. 你会发现，“高等数学”依然静静地躺在你安排的时间段里——它已经安全地存在本地硬盘的 SQLite 数据库中了！
**现在的架构已经跑通了全链路：前端交互 -> IPC 通信 -> 本地存储。**
接下来，你可以选择继续完善数据库操作（比如实现拖拽修改时间后的 `update-event` 和删除日程的 `delete-event`），或者我们可以开始聊聊 Electron 非常有优势的**后台弹窗与系统级提醒功能**？

## Turn 6

### 👤 User

需要后台弹窗与系统级提醒功能

### 🤖 Assistant

太有品味了！**后台轮询 + 系统级弹窗**，这正是 Electron 作为一个跨平台桌面应用，能彻底“碾压”普通 Web 网页版日历的杀手锏功能。
即使你的用户（学生）把逃课宝 (Tody) 的主界面关掉，或者最小化到了系统托盘（Tray），只要 Electron 的主进程（Main Process）还在运行，提醒就绝对不会错过。
我们要实现两种级别的提醒：

1. **轻量级（系统通知）**：调用 Windows/macOS 原生的通知中心，伴随“叮”的一声。
2. **重量级（强提醒弹窗）**：类似 Outlook，直接在屏幕中央弹出一个置顶的、无边框的独立小窗口，强制用户看到。
以下是完整的架构与代码实现：

### 1. 在主进程建立“日程哨兵” (Main Process)
我们要把提醒逻辑写在 `main.js` 中。千万不要写在 React 前端里，因为前端窗口一旦被关闭或休眠，定时器就会失效。
在你的 `main.js` 中，引入 Electron 的 `Notification` 模块，并写一个定时轮询服务：

```javascript
// main.js 的顶部引入新增的模块
const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// ... (保留之前的 db 初始化和 initDB 逻辑) ...

// ================= 核心提醒服务 =================

function startReminderService() {
  // 每隔 1 分钟 (60000 毫秒) 检查一次数据库
  setInterval(() => {
    // 1. 计算 10 分钟后的时间 (用于提前 10 分钟提醒)
    const targetTime = new Date(Date.now() + 10 * 60 * 1000);
    
    // 将时间格式化为与数据库相同的格式 (假设你的数据库存的是类似 '2026-03-09T10:00:00' 的前缀)
    // 这里我们截取到分钟级别进行精确比对
    const targetTimeStr = targetTime.toISOString().substring(0, 16); // e.g., "2026-03-09T10:00"

    // 2. 从数据库查询：有没有刚好在 10 分钟后开始的日程？
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE start_time LIKE ? 
      AND is_all_day = 0
    `);
    
    const upcomingEvents = stmt.all(`${targetTimeStr}%`);

    // 3. 触发提醒
    upcomingEvents.forEach(event => {
      triggerNotification(event);
      triggerCustomPopup(event); // 如果需要强提醒，解除注释
    });

  }, 60000); 
}

// 级别一：系统级原生通知 (Windows右下角 / macOS右上角)
function triggerNotification(event) {
  // 检查系统是否支持通知
  if (Notification.isSupported()) {
    const notif = new Notification({
      title: 'Tody 课程提醒 🔔',
      body: `【${event.title}】将在 10 分钟后开始！`,
      silent: false, // 允许系统发出提示音
      // icon: path.join(__dirname, 'assets/icon.png') // 你可以加上你的 App Logo
    });
    
    notif.on('click', () => {
      // 用户点击通知时，唤醒主窗口
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });

    notif.show();
  }
}

// 级别二：重量级独立弹窗 (强制弹出置顶小窗口)
function triggerCustomPopup(event) {
  let reminderWin = new BrowserWindow({
    width: 340,
    height: 180,
    frame: false,       // 无边框，看起来更现代
    alwaysOnTop: true,  // 永远置顶，覆盖在游戏或网课之上！
    skipTaskbar: true,  // 不在任务栏显示图标
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 你可以专门写一个 reminder.html 作为这个小窗口的 UI
  // 这里为了演示直接注入 HTML
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; background: #fff; height: 100%; box-sizing: border-box; border: 1px solid #1a73e8; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <h3 style="margin: 0 0 10px 0; color: #1a73e8;">⏰ 即将开始</h3>
        <p style="margin: 0; font-size: 16px; color: #333;"><strong>${event.title}</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">10分钟后 (${event.start_time.split('T')[1].substring(0,5)})</p>
      </div>
      <button onclick="window.close()" style="width: 100%; padding: 8px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;">我知道了</button>
    </div>
  `;
  
  reminderWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  // 1分钟后如果用户没点关闭，自动销毁，防止堆积
  setTimeout(() => {
    if (!reminderWin.isDestroyed()) reminderWin.close();
  }, 60000);
}

// ================= 在应用启动时调用 =================

app.whenReady().then(() => {
  initDB(); 
  
  // 启动提醒服务
  startReminderService(); 
  
  // ... (创建你的主窗口 mainWindow 的代码) ...
});

```

### 2. 必须注意的坑（经验之谈）

1. **日期格式匹配**：上面的代码我用了 `start_time LIKE '2026-03-09T10:00%'` 去匹配。这要求前端存入数据库的 `start_time` 必须是标准的 ISO 字符串（`YYYY-MM-DDTHH:mm:ss`）。如果不统一，提醒就会失效。
2. **多重提醒防抖**：如果你每隔1分钟查一次，而提醒刚好触发了，千万不要在一分钟内再次触发。按上面的逻辑，只匹配 `当前时间 + 10分钟` 的那一分钟，所以不会重复弹。
3. **系统权限**：Windows 10/11 的“专注助手（免打扰模式）”可能会拦截系统通知（级别一）。如果你的应用是给大学生抢课、上课用的，建议**把级别二（强提醒独立窗口）作为默认开启的备用选项**，这样绝对不会漏掉。

### 怎么测试这个功能？

1. 运行你的 Electron 应用。
2. 在日历上创建一个事件，时间设定在**当前时间的 11 分钟后**。
3. 把主窗口关掉（只要终端里 Node 还在跑，或者你配置了托盘图标隐藏在后台）。
4. 盯住屏幕或者去刷会网页，大概 1 分钟后，“叮”的一声，右下角会弹出系统通知，同时屏幕中间会直接“砸”出一个无法忽视的小卡片告诉你：**该上课了！**
现在，逃课宝的核心骨架：**前端酷炫 UI + 本地数据库固化 + 强力后台提醒**，这三驾马车已经全部齐活了。
接下来，你是想优化一下我们刚才提到的**“隐藏到系统托盘 (Tray)”功能让它成为真正的后台常驻应用，还是想去搞定“编辑/拖拽更新/删除”**这些完整的 CRUD 操作呢？

## Turn 7

### 👤 User

需要可以自定义的”悬浮球“，点击有目录，点击会交互，可以有小日历

### 🤖 Assistant

桌面级“悬浮球”（类似 iOS 的小白点或安全软件的加速球）是一个极具极客范儿、且用户黏性极高的功能！对于“逃课宝”来说，用户在打游戏、看视频或者写代码时，不需要切回主窗口，直接点击悬浮球就能看接下来的课表或新建任务，这绝对是**杀手级体验**。
在 Electron 中实现悬浮球，其本质是**创建一个永远置顶（Always on Top）、无边框（Frameless）、背景透明（Transparent）的独立微型窗口**。
这涉及到 Electron 多窗口管理和动态改变窗口尺寸的 IPC 通信。下面是为你量身定制的完整实现方案：

### 1. 创建悬浮球窗口 (主进程 `main.js`)
我们需要在主进程中新增一个独立于主日历窗口的 `BrowserWindow`。当用户点击悬浮球展开菜单时，这个窗口需要通过 IPC 动态放大，以容纳小日历和目录。

```javascript
// main.js 添加悬浮球逻辑
const { app, BrowserWindow, ipcMain, screen } = require('electron');
// ... 之前的代码保留

let floatWin = null;

function createFloatingBall() {
  // 获取屏幕尺寸，将悬浮球默认放在屏幕右侧偏上
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const ballSize = 60; // 悬浮球的宽高

  floatWin = new BrowserWindow({
    width: ballSize,
    height: ballSize,
    x: width - ballSize - 20, // 靠右 20px
    y: 100,                   // 距离顶部 100px
    transparent: true,        // 核心：背景透明！
    frame: false,             // 无边框
    alwaysOnTop: true,        // 永远置顶
    resizable: false,         // 禁止用户手动拉伸边框
    skipTaskbar: true,        // 不在任务栏显示独立图标
    hasShadow: false,         // 去除系统默认阴影，我们用 CSS 自己画
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 这里确保你的 React 路由能区分主窗口和悬浮球窗口
    }
  });

  // 假设你在 React 中使用了 HashRouter，我们将悬浮球指向特定路由
  // 开发环境下：
  floatWin.loadURL('http://localhost:5173/#/float'); 
  // 生产环境下应该是加载本地 HTML：floatWin.loadFile('index.html', { hash: 'float' })
}

// === 动态修改悬浮球窗口大小的 IPC 通信 ===
ipcMain.handle('resize-float-window', (event, expand) => {
  if (!floatWin) return;
  
  if (expand) {
    // 展开成带日历的面板 (宽 280, 高 350)
    floatWin.setSize(280, 350);
  } else {
    // 缩回普通的悬浮球 (宽 60, 高 60)
    floatWin.setSize(60, 60);
  }
});

// 在 app.whenReady() 中调用
app.whenReady().then(() => {
  // initDB();
  // mainWindow = createMainWindow();
  createFloatingBall(); 
});

```

### 2. 暴露通信接口 (`preload.js`)
在你的 `preload.js` 中新增改变窗口尺寸的方法：

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todyAPI', {
  // ... 之前的 db 方法
  resizeFloat: (expand) => ipcRenderer.invoke('resize-float-window', expand)
});

```

### 3. 构建悬浮球 UI 组件 (`FloatingBall.jsx`)
在你的 React 前端中，新建一个 `FloatingBall.jsx`。这个组件要在“圆形小球”和“带日历的面板”两种状态间平滑切换。
**注意关键点：** 使用 Electron 提供的 CSS 属性 `-webkit-app-region: drag;` 可以让元素变得像窗口标题栏一样可以拖拽移动。

```javascript
import React, { useState } from 'react';
import MiniCalendar from 'react-calendar';
import './FloatingBall.css'; // 引入专属样式

export default function FloatingBall() {
  const [isExpanded, setIsExpanded] = useState(false);

  // 切换展开/收起状态
  const toggleExpand = async () => {
    const nextState = !isExpanded;
    // 先通知 Electron 主进程改变物理窗口的大小
    if (window.todyAPI) {
      await window.todyAPI.resizeFloat(nextState);
    }
    // 然后更新 React 状态，渲染不同的 UI
    setIsExpanded(nextState);
  };

  if (!isExpanded) {
    // === 状态一：缩起来的悬浮球 ===
    return (
      <div 
        className="float-ball-collapsed" 
        onDoubleClick={toggleExpand} // 双击展开
      >
        <span className="ball-icon">📅</span>
      </div>
    );
  }

  // === 状态二：展开的交互面板 ===
  return (
    <div className="float-panel-expanded">
      {/* 顶部标题栏：允许拖拽移动位置 */}
      <div className="panel-header drag-area">
        <span className="panel-title">逃课宝 Tody</span>
        <button className="close-btn no-drag" onClick={toggleExpand}>—</button>
      </div>

      <div className="panel-content no-drag">
        {/* 目录区域（快捷操作） */}
        <div className="quick-actions">
          <button className="action-btn">✨ 新建日程</button>
          <button className="action-btn">📚 今日课表</button>
        </div>

        {/* 迷你日历展示 */}
        <div className="float-mini-calendar">
          <MiniCalendar 
            locale="zh-CN"
            // 这里可以对接你之前写的 SQLite 数据，标出有课的日期
          />
        </div>
        
        {/* 底部信息提示 */}
        <div className="next-class-alert">
           下一节：14:30 编译原理
        </div>
      </div>
    </div>
  );
}

```

### 4. 注入灵魂的 CSS (`FloatingBall.css`)
悬浮球的质感完全靠 CSS 阴影和透明度撑起来。一定要加上拖拽区域的控制。

```css
/* 基础重置，确保透明窗口生效 */
body {
  background-color: transparent !important;
  margin: 0;
  overflow: hidden;
}

/* --- 控制 Electron 窗口拖拽的核心 --- */
.drag-area {
  -webkit-app-region: drag; /* 允许按住拖动整个物理窗口 */
  cursor: grab;
}
.no-drag {
  -webkit-app-region: no-drag; /* 按钮、交互区域必须禁止拖拽，否则无法点击！ */
}

/* === 缩起来的悬浮球 === */
.float-ball-collapsed {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  -webkit-app-region: drag; /* 悬浮球状态下整体可拖拽 */
  transition: transform 0.2s, background 0.2s;
}

.float-ball-collapsed:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 1);
}

/* === 展开后的面板 === */
.float-panel-expanded {
  width: 280px;
  height: 350px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  height: 40px;
  background: #f1f3f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}

.panel-title {
  font-weight: bold;
  font-size: 14px;
  color: #3c4043;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #5f6368;
}

.panel-content {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 8px;
  background: #e8f0fe;
  color: #1a73e8;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.action-btn:hover {
  background: #d2e3fc;
}

.next-class-alert {
  background: #fce8e6;
  color: #d93025;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

```

### 体验流程

1. 启动应用，屏幕右上角会出现一个**圆形的日历图标悬浮球**。
2. 你可以按住它**任意拖拽**到屏幕边缘。
3. **双击它**（或者设定为单击），物理窗口会瞬间变大，并展开为一个毛玻璃质感的面板。
4. 面板上有“快捷创建”、“今天课表”两个按钮，下方嵌着一个小日历，最底部还提示你“下一节：14:30 编译原理”。
5. 点击面板右上角的“—”号，它又会瞬间收缩变回原来的圆形悬浮球。

---
现在，悬浮球的基本物理形态和交互已经成型了。
接下来，我们可以重点打磨细节。**你是希望先把之前写好的 SQLite 查询逻辑接入到这个悬浮球里（让它真实显示今天的日程），还是希望实现类似 iOS 那种“拖拽松手后，悬浮球自动吸附到屏幕左右边缘”的物理回弹效果？**

## Turn 8

### 👤 User

先把之前写好的 SQLite 查询逻辑接入到这个悬浮球里（让它真实显示今天的日程）

### 🤖 Assistant

让悬浮球真实读取数据库，是让它从“好看的UI”变成“真正的生产力工具”的核心一步。想象一下，你正在专注敲代码或者浏览网页，随手点开悬浮球，里面清晰地列着今天下午的 NLP 课程或者晚上要提交的 Matlab 图像处理作业，这种掌控感是非常棒的。
为了实现这一点，我们需要在 SQLite 中增加一个专门查询“今日日程”的接口，并在 React 组件中动态计算“下一条日程”的状态。
以下是完整的接入方案：

### 1. 主进程增加“今日日程”查询 (main.js)
虽然之前写过获取所有日程的接口，但为了悬浮球的性能，我们最好在数据库层面直接过滤出今天的数据，并且按时间排好序。
在 `main.js` 的 IPC 监听部分，新增这个 handler：

```javascript
// main.js
ipcMain.handle('get-today-events', () => {
  if (!db) return [];
  
  // 获取今天的日期字符串，格式为 'YYYY-MM-DD'
  // 注意：如果是跨时区应用，这里最好结合用户的本地时区计算，目前用本地时间截取
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`; 

  // 用 LIKE 匹配今天开头的所有日程，并按开始时间升序排列
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE start_time LIKE ? 
    ORDER BY start_time ASC
  `);
  
  const events = stmt.all(`${todayStr}%`);
  
  return events.map(e => ({
    id: e.id,
    title: e.title,
    // 截取时间部分，把 '2026-03-09T14:30:00' 变成 '14:30'
    startTimeStr: e.start_time.split('T')[1].substring(0, 5),
    endTimeStr: e.end_time ? e.end_time.split('T')[1].substring(0, 5) : '',
    rawStart: e.start_time // 保留原始时间戳用于计算“下一节课”
  }));
});

```

### 2. 暴露新接口 (preload.js)
在 `preload.js` 中把这个新方法暴露给前端：

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todyAPI', {
  // ... 之前的其他方法
  resizeFloat: (expand) => ipcRenderer.invoke('resize-float-window', expand),
  getTodayEvents: () => ipcRenderer.invoke('get-today-events') // 新增这行
});

```

### 3. 重构悬浮球组件 (FloatingBall.jsx)
现在回到 React。我们需要在悬浮球**展开时**请求数据，并计算出哪一条日程是“接下来即将发生”的。

```javascript
import React, { useState, useEffect } from 'react';
import MiniCalendar from 'react-calendar';
import './FloatingBall.css';

export default function FloatingBall() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [todayEvents, setTodayEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);

  // 每次展开悬浮球时，刷新今天的数据
  useEffect(() => {
    if (isExpanded) {
      fetchTodayData();
    }
  }, [isExpanded]);

  const fetchTodayData = async () => {
    if (window.todyAPI) {
      const events = await window.todyAPI.getTodayEvents();
      setTodayEvents(events);
      calculateNextEvent(events);
    }
  };

  // 核心逻辑：计算“下一条日程”
  const calculateNextEvent = (events) => {
    const now = new Date();
    // 找到第一个开始时间大于当前时间的日程
    const upcoming = events.find(e => new Date(e.rawStart) > now);
    setNextEvent(upcoming || null);
  };

  const toggleExpand = async () => {
    const nextState = !isExpanded;
    if (window.todyAPI) {
      await window.todyAPI.resizeFloat(nextState);
    }
    setIsExpanded(nextState);
  };

  if (!isExpanded) {
    return (
      <div className="float-ball-collapsed drag-area" onDoubleClick={toggleExpand}>
        <span className="ball-icon">📅</span>
      </div>
    );
  }

  return (
    <div className="float-panel-expanded">
      <div className="panel-header drag-area">
        <span className="panel-title">逃课宝 Tody</span>
        <button className="close-btn no-drag" onClick={toggleExpand}>—</button>
      </div>

      <div className="panel-content no-drag">
        <div className="quick-actions">
          <button className="action-btn">✨ 新建日程</button>
        </div>

        {/* 今日日程列表区域，取代之前的死数据 */}
        <div className="today-agenda">
          <h4 className="agenda-title">今日日程</h4>
          <div className="agenda-list">
            {todayEvents.length === 0 ? (
              <div className="empty-state">今天没有任何安排，好好休息吧！</div>
            ) : (
              todayEvents.map(event => (
                <div key={event.id} className="agenda-item">
                  <div className="agenda-time">{event.startTimeStr}</div>
                  <div className="agenda-info">
                    <div className="agenda-name">{event.title}</div>
                    {/* 如果有结束时间也可以显示 */}
                    {event.endTimeStr && <div className="agenda-duration">至 {event.endTimeStr}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* 底部动态提醒 */}
        <div className={`next-class-alert ${!nextEvent ? 'no-alert' : ''}`}>
           {nextEvent ? `下一节：${nextEvent.startTimeStr} ${nextEvent.title}` : '今日任务已全部结束 🎉'}
        </div>
      </div>
    </div>
  );
}

```

### 4. 补充时间线风格的 CSS
为了让今天日程的列表看起来像一个精美的 Timeline（时间线），需要在 `FloatingBall.css` 中追加这段样式：

```css
/* ... 保留之前的悬浮球基础样式 ... */

.today-agenda {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 配合内部滚动 */
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.05);
}

.agenda-title {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #5f6368;
  border-bottom: 1px solid #f1f3f4;
  padding-bottom: 5px;
}

.agenda-list {
  flex: 1;
  overflow-y: auto; /* 就算今天排满了课，也可以在面板里滚动查看 */
  padding-right: 4px;
}

/* 隐藏滚动条但保留滚动功能 (为了美观) */
.agenda-list::-webkit-scrollbar {
  width: 4px;
}
.agenda-list::-webkit-scrollbar-thumb {
  background: #dadce0;
  border-radius: 4px;
}

.agenda-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  position: relative;
}

/* 左侧时间 */
.agenda-time {
  font-size: 12px;
  font-weight: bold;
  color: #1a73e8;
  width: 45px;
  padding-top: 2px;
}

/* 右侧内容块 */
.agenda-info {
  flex: 1;
  background: #f8f9fa;
  border-left: 3px solid #1a73e8;
  padding: 6px 10px;
  border-radius: 0 4px 4px 0;
}

.agenda-name {
  font-size: 13px;
  color: #3c4043;
  font-weight: 500;
  margin-bottom: 2px;
}

.agenda-duration {
  font-size: 11px;
  color: #80868b;
}

.empty-state {
  text-align: center;
  font-size: 12px;
  color: #9aa0a6;
  margin-top: 20px;
}

.next-class-alert {
  /* 之前写的样式 */
  background: #fce8e6;
  color: #d93025;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  text-align: center;
}

.next-class-alert.no-alert {
  background: #e6f4ea;
  color: #137333;
}

```

### 跑起来的惊艳效果：
现在，当你在主窗口的日历上新建了今天的几个事件（比如 10:00 的课，14:30 的小组会），然后关掉主窗口或者切到别的应用。
双击右侧的悬浮球，展开的面板里会立刻拉取数据库：

1. 中间会像时间轴一样按顺序列出你今天所有的安排。
2. 底部的红色提醒条会自动算出**下一个还没开始的事件**。如果今天事情都做完了，它会变成绿色并告诉你“今日任务已全部结束”。
这套逻辑将 SQLite 查询、前端状态计算和 Electron 的独立窗口完美结合在一起。现在这个组件已经具备了极高的实用价值。
要不要我们一鼓作气，把**“边缘吸附”**这个纯物理交互效果加上？让它像真正的系统悬浮球一样，拖拽松手后自动贴边，不挡屏幕！

## Turn 9

### 👤 User

把“边缘吸附”这个纯物理交互效果加上

### 🤖 Assistant

给悬浮球加上“边缘吸附”的物理回弹，是让它彻底拥有原生系统级质感（类似 macOS 小组件或 iOS 悬浮球）的点睛之笔。
在 Electron 中，因为我们使用了 `-webkit-app-region: drag` 让操作系统原生接管了拖拽（这保证了极致的流畅度，不会掉帧），所以**吸附逻辑必须写在 Node.js 主进程 (main.js) 中**。操作系统会在用户松开鼠标、拖拽结束时，向 Electron 发射一个 `moved` 事件。我们要做的就是拦截这个事件，计算距离，并给它加上一段平滑的“吸附动画”。
此外还有一个核心细节：**如果悬浮球原本贴在屏幕最右侧，当你双击展开成 280px 宽的面板时，面板会冲出屏幕外！** 所以我们在展开时也要做边界碰撞检测。
以下是 `main.js` 的完美改造方案：

### 1. 改造主进程逻辑 (`main.js`)
在你的 `main.js` 中找到之前写的悬浮球代码，增加状态追踪和吸附动画：

```javascript
// 在文件顶部确保引入了 screen 模块
const { app, BrowserWindow, ipcMain, screen } = require('electron');

let floatWin = null;
let isFloatExpanded = false; // 新增：追踪悬浮球是否处于展开状态

function createFloatingBall() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const ballSize = 60;
  
  floatWin = new BrowserWindow({
    // ... 保持之前的透明、无边框等配置
    width: ballSize,
    height: ballSize,
    x: width - ballSize - 10, // 初始位置靠右侧 10px 边距
    y: 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // ========== 核心一：监听拖拽结束事件 ==========
  floatWin.on('moved', () => {
    // 如果面板是展开的，就不执行吸附，让用户自由摆放
    if (isFloatExpanded) return;

    const bounds = floatWin.getBounds();
    // 动态获取当前悬浮球所在屏幕的尺寸（支持多显示器）
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const screenWidth = display.workAreaSize.width;
    const screenX = display.bounds.x; // 处理多显示器的坐标偏移

    const snapMargin = 10; // 吸附后距离边缘的留白
    const ballCenter = bounds.x + bounds.width / 2;

    // 判断悬浮球中心点在屏幕左半边还是右半边
    const isLeft = ballCenter < (screenX + screenWidth / 2);

    // 计算目标X坐标
    const targetX = isLeft ? screenX + snapMargin : screenX + screenWidth - bounds.width - snapMargin;

    // 执行丝滑的动画吸附过去
    animateWindow(floatWin, targetX, bounds.y);
  });

  floatWin.loadURL('http://localhost:5173/#/float'); 
}

// ========== 核心二：手写缓动动画引擎 ==========
function animateWindow(win, targetX, targetY) {
  const startBounds = win.getBounds();
  const distanceX = targetX - startBounds.x;
  
  // 如果已经很接近边缘了，直接跳过动画
  if (Math.abs(distanceX) < 2) return; 

  const totalFrames = 15; // 动画帧数（15帧大约250ms，非常清脆）
  let currentFrame = 0;

  const interval = setInterval(() => {
    currentFrame++;
    const progress = currentFrame / totalFrames;
    
    // 使用 Cubic Ease-Out 缓动函数（先快后慢，物理感极强）
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentX = Math.round(startBounds.x + distanceX * easeOut);

    if (!win.isDestroyed()) {
      win.setBounds({
        x: currentX,
        y: targetY,
        width: startBounds.width,
        height: startBounds.height
      });
    }

    if (currentFrame >= totalFrames) {
      clearInterval(interval);
    }
  }, 16); // 约 60 FPS
}

// ========== 核心三：改造展开/收缩的 IPC，加入防越界逻辑 ==========
ipcMain.handle('resize-float-window', (event, expand) => {
  if (!floatWin) return;
  isFloatExpanded = expand;
  
  const bounds = floatWin.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const screenWidth = display.workAreaSize.width;
  const screenX = display.bounds.x;
  
  if (expand) {
    const newWidth = 280;
    const newHeight = 350;
    let newX = bounds.x;
    
    // 【防越界】如果悬浮球在最右侧，直接展开会跑到屏幕外面
    // 必须让它向左偏移
    if (bounds.x + newWidth > screenX + screenWidth) {
      newX = screenX + screenWidth - newWidth - 10;
    }
    
    floatWin.setBounds({ x: newX, y: bounds.y, width: newWidth, height: newHeight });
  } else {
    // 收缩回悬浮球状态
    const newWidth = 60;
    const newHeight = 60;
    floatWin.setBounds({ x: bounds.x, y: bounds.y, width: newWidth, height: newHeight });
    
    // 巧妙利用触发器：收缩后手动发射一个 moved 事件，让它自动吸附到边缘！
    floatWin.emit('moved');
  }
});

```

### 体验令人上瘾的物理反馈
现在重启你的 Electron 应用，试着在屏幕上“扔”一下这个悬浮球：

1. **自动吸附**：用鼠标把它拖到屏幕中央，松手。悬浮球会以一种“先快后慢”的 Q 弹动画，瞬间滑向离它最近的屏幕边缘（左侧或右侧），并保持 10px 的优雅边距。
2. **智能展开**：把它拖到屏幕最右侧边缘，双击展开。你会发现面板并没有被屏幕边缘切断，而是聪明地向左延伸出了 280px 的完整面板。
3. **收缩归位**：看完日程后点击“—”，面板缩回圆形的同时，又会自动触发一次动画，重新稳稳地吸附在边缘。
这个小小的组件加上这段动画后，整个“逃课宝”的高级感就彻底出来了。
到目前为止，我们已经完成了：桌面主视图排表、SQLite 数据库接入、后台静默提醒、以及具有物理反馈的桌面悬浮球。
这四个模块构成了日程软件最坚实的核心。你想继续深入打磨一下悬浮球里的交互（比如**点击日程直接弹窗修改**），还是想回头给主日历加上**“导出/导入 .ics 日历文件”**的功能，方便与其他日历应用联动？

## Turn 10

### 👤 User

继续深入打磨一下悬浮球里的交互（比如点击日程直接弹窗修改）

### 🤖 Assistant

在这么精致的 280x350 像素悬浮面板里，如果点击日程后再弹出一个新的系统窗口，体验会非常割裂，显得应用很“重”。
要做到顶级原生应用（如 macOS 侧边栏小组件）的质感，最佳实践是**“视图内联平滑切换”（Inline View Switching）**。也就是说，当用户点击某节课时，当天的日程列表顺滑地“翻转”或“滑出”，变成一个轻量级的编辑表单；修改完点保存，再丝滑地切回列表。
我们分三步来实现这个完美的闭环：更新底层数据库接口 -> 暴露 API -> 重构悬浮球 UI。

### 1. 打通更新与删除的底层接口 (main.js & preload.js)
首先，主进程必须要能处理修改和删除的 SQL 指令。
在 `main.js` 的 IPC 监听区域，补充这两个核心操作：

```javascript
// main.js

// 修改日程
ipcMain.handle('update-event', (event, eventData) => {
  if (!db) return { success: false };
  
  const stmt = db.prepare(`
    UPDATE events 
    SET title = @title, start_time = @start
    WHERE id = @id
  `);
  
  stmt.run({
    id: eventData.id,
    title: eventData.title,
    start: eventData.start // 需要传入完整的 ISO 时间戳，例如 '2026-03-09T14:30:00'
  });
  
  return { success: true };
});

// 删除日程
ipcMain.handle('delete-event', (event, id) => {
  if (!db) return { success: false };
  const stmt = db.prepare('DELETE FROM events WHERE id = ?');
  stmt.run(id);
  return { success: true };
});

```
接着，在 `preload.js` 中把它们暴露给前端：

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todyAPI', {
  // ... 保留之前的 db 和 window 方法
  updateEvent: (data) => ipcRenderer.invoke('update-event', data),
  deleteEvent: (id) => ipcRenderer.invoke('delete-event', id)
});

```

---

### 2. 悬浮球组件增加“编辑状态” (FloatingBall.jsx)
我们需要在组件中引入一个新的状态 `editingEvent`。当它为空时，显示列表；当它有值时，原地显示编辑表单。
修改你的 `FloatingBall.jsx`：

```javascript
import React, { useState, useEffect } from 'react';
import MiniCalendar from 'react-calendar';
import './FloatingBall.css';

export default function FloatingBall() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [todayEvents, setTodayEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);

  // === 新增：编辑态管理 ===
  const [editingEvent, setEditingEvent] = useState(null); 
  const [editTitle, setEditTitle] = useState('');
  const [editTime, setEditTime] = useState('');

  // ... (保留之前的 useEffect, fetchTodayData, calculateNextEvent, toggleExpand 逻辑)

  // 点击列表项，进入编辑模式
  const handleEditClick = (event) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditTime(event.startTimeStr); // 形如 "14:30"
  };

  // 保存修改
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;

    // 将用户修改的 "14:30" 拼装回完整的数据库时间戳
    // 从 rawStart (例如 "2026-03-09T10:00:00") 中提取出日期前缀 "2026-03-09T"
    const datePrefix = editingEvent.rawStart.substring(0, 11); 
    const newStartStr = `${datePrefix}${editTime}:00`;

    if (window.todyAPI) {
      await window.todyAPI.updateEvent({
        id: editingEvent.id,
        title: editTitle,
        start: newStartStr
      });
      // 刷新数据并退出编辑态
      await fetchTodayData();
      setEditingEvent(null);
    }
  };

  // 删除日程
  const handleDelete = async () => {
    if (window.todyAPI) {
      await window.todyAPI.deleteEvent(editingEvent.id);
      await fetchTodayData();
      setEditingEvent(null);
    }
  };

  // 渲染收缩状态...
  if (!isExpanded) { /* ...保留之前代码... */ }

  return (
    <div className="float-panel-expanded">
      <div className="panel-header drag-area">
        {/* 如果在编辑状态，标题变成“编辑日程”，并提供返回按钮 */}
        <span className="panel-title">
          {editingEvent ? '编辑日程' : '逃课宝 Tody'}
        </span>
        <button className="close-btn no-drag" onClick={toggleExpand}>—</button>
      </div>

      <div className="panel-content no-drag">
        {/* === 核心：视图平滑切换 === */}
        {editingEvent ? (
          
          /* --- 编辑视图 --- */
          <div className="edit-view animation-fade-in">
             <div className="edit-form-group">
               <label>日程名称</label>
               <input 
                 autoFocus
                 type="text" 
                 value={editTitle} 
                 onChange={(e) => setEditTitle(e.target.value)} 
                 className="edit-input"
               />
             </div>
             <div className="edit-form-group">
               <label>开始时间</label>
               <input 
                 type="time" 
                 value={editTime} 
                 onChange={(e) => setEditTime(e.target.value)} 
                 className="edit-input time-input"
               />
             </div>
             
             <div className="edit-actions">
               <button className="btn-save" onClick={handleSaveEdit}>保存修改</button>
               <button className="btn-delete" onClick={handleDelete}>删除</button>
               <button className="btn-cancel" onClick={() => setEditingEvent(null)}>取消</button>
             </div>
          </div>

        ) : (

          /* --- 列表视图 (原本的代码) --- */
          <div className="view-container animation-fade-in">
            <div className="quick-actions">
              <button className="action-btn">✨ 新建日程</button>
            </div>
            <div className="today-agenda">
              <h4 className="agenda-title">今日日程</h4>
              <div className="agenda-list">
                {todayEvents.map(event => (
                  // 给这里加上 onClick 唤起编辑
                  <div key={event.id} className="agenda-item interactive-item" onClick={() => handleEditClick(event)}>
                    <div className="agenda-time">{event.startTimeStr}</div>
                    <div className="agenda-info">
                      <div className="agenda-name">{event.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={`next-class-alert ${!nextEvent ? 'no-alert' : ''}`}>
               {nextEvent ? `下一节：${nextEvent.startTimeStr} ${nextEvent.title}` : '今日任务已全部结束 🎉'}
            </div>
          </div>
          
        )}
      </div>
    </div>
  );
}

```

---

### 3. 补充精美的表单 CSS
在狭小的空间里排版表单，留白（Padding）和圆角（Border-radius）是关键。把这些加进 `FloatingBall.css` 中：

```css
/* --- 列表项交互反馈 --- */
.interactive-item {
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;
}
.interactive-item:hover {
  transform: translateX(4px); /* 鼠标悬浮时微微向右滑动，暗示可点击 */
  opacity: 0.8;
}

/* --- 视图切换动画 --- */
.animation-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
  height: 100%;
  display: flex;
  flex-direction: column;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

/* --- 编辑视图表单样式 --- */
.edit-view {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.05);
  flex: 1;
}

.edit-form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.edit-form-group label {
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 6px;
  font-weight: 500;
}

.edit-input {
  border: 1px solid #dadce0;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
  color: #3c4043;
  outline: none;
  transition: border-color 0.2s;
}

.edit-input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
}

.time-input {
  width: 120px;
}

/* --- 编辑底部按钮组 --- */
.edit-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto; /* 把按钮推到最底部 */
  padding-top: 16px;
}

.btn-save {
  flex: 1;
  background: #1a73e8;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.btn-save:hover { background: #1557b0; }

.btn-delete {
  background: #fce8e6;
  color: #d93025;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.btn-delete:hover { background: #fad2cf; }

.btn-cancel {
  width: 100%;
  background: transparent;
  color: #5f6368;
  border: 1px solid #dadce0;
  padding: 8px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.btn-cancel:hover { background: #f1f3f4; }

```

### 跑起来的体验
现在，这个悬浮球完全具备了独立运转的能力：

1. 双击展开悬浮球，看到今天的日程列表。
2. 鼠标悬浮在某个日程上，它会微微向右移动提示你。
3. 点击它，整个面板内部瞬间切换为编辑模式。你可以直接在输入框修改名称，或者点击原生 Time 选择器把 14:30 延后到 15:00。
4. 点下蓝色的“保存修改”按钮，表单消失，列表刷新，甚至连底部提示的“下一节课”也会因为你改了时间而自动重新计算！
现在，悬浮球内部逻辑可以说是无懈可击了。由于前后端的数据都是以这个本地的 `tody_calendar.db` SQLite 数据库为核心的，因此**你在悬浮球里做的任何修改，主窗口里的 FullCalendar 只要刷新就能立刻同步**。
接下来，你打算处理一下悬浮球里的“新建日程”按钮复用这套编辑表单逻辑，还是想了解主窗口和悬浮窗口之间怎样实现“免刷新实时数据同步”（类似 Redux 的多窗口广播）？

---

*Exported from [Gemini Voyager](https://github.com/Nagi-ovo/gemini-voyager)*  
*Generated on March 10, 2026 at 09:22 AM*