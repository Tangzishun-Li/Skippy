# Skippy 重构计划

## 项目概述
根据技术规格文档，将现有的原生 JavaScript Electron 应用重构为 React + FullCalendar 架构。

## 阶段一：项目初始化与依赖安装

### 1.1 安装 React 和 FullCalendar 相关依赖
- `@fullcalendar/react` - React FullCalendar 适配器
- `@fullcalendar/core` - 核心库
- `@fullcalendar/daygrid` - 月视图
- `@fullcalendar/timegrid` - 周/日视图
- `@fullcalendar/interaction` - 拖拽交互
- `react-calendar` - 迷你日历
- `rrule.js` - 循环日程规则库（预留）

### 1.2 创建 React 项目结构
```
src/
  renderer/
    App.jsx           # 主应用入口
    components/
      CalendarView.jsx    # FullCalendar 主视图
      MiniCalendar.jsx   # 迷你日历侧边栏
      EventPopup.jsx      # 气泡创建弹窗
      Sidebar.jsx        # 侧边栏容器
    styles/
      calendar.css
      popup.css
      sidebar.css
```

## 阶段二：主日历视图实现

### 2.1 创建 FullCalendar 基础组件
- 实现月/周/日视图切换
- 配置中文本地化 (locale: 'zh-cn')
- 设置时间轴范围 (slotMinTime/slotMaxTime)
- 启用拖拽编辑和缩放功能

### 2.2 实现气泡弹窗创建 UI
- 使用 FullCalendar 的 `select` 回调捕获拖拽区域
- 在鼠标位置绝对定位显示气泡卡片
- 实现标题输入框自动聚焦
- 按 Enter 保存，Esc 取消

## 阶段三：侧边栏与迷你日历

### 3.1 侧边栏布局
- 左侧固定宽度 260px
- 顶部"创建日程"大按钮
- 下方迷你日历导航
- 底部分类过滤列表

### 3.2 双向同步逻辑
- 点击迷你日历日期 → 主日历跳转 (gotoDate)
- 主日历翻页 → 迷你日历月份同步 (datesSet 回调)

## 阶段四：数据库集成

### 4.1 扩展数据库 Schema
- 创建 `events` 表 (id, title, start_time, end_time, is_all_day, category, rrule)
- 创建 `categories` 表 (id, name, color)

### 4.2 新增 IPC 处理器
- `get-events` - 获取所有日程
- `add-event` - 添加新日程
- `update-event` - 修改日程
- `delete-event` - 删除日程
- `get-today-events` - 获取今日日程（悬浮球用）

### 4.3 Preload 桥接
暴露 `todyAPI` 供 React 前端调用

## 阶段五：系统通知提醒

### 5.1 主进程提醒服务
- 每分钟轮询检查即将到来的日程
- 支持提前 10 分钟/1 小时/1 天提醒

### 5.2 两种提醒方式
- 系统原生通知 (Notification API)
- 强制弹窗提醒 (独立 BrowserWindow)

## 阶段六：悬浮球功能

### 6.1 悬浮球窗口创建
- 透明、无边框、置顶窗口
- 60x60 收起状态 / 280x350 展开状态

### 6.2 悬浮球 UI
- 收起状态：圆形可拖拽图标
- 展开状态：
  - 快捷操作按钮
  - 今日日程时间轴列表
  - 底部下一节提醒

### 6.3 边缘吸附效果
- 监听 `moved` 事件
- 松手后自动滑向最近屏幕边缘
- 使用 Cubic Ease-Out 缓动动画

### 6.4 悬浮球内编辑功能
- 点击日程项 → 切换为编辑表单
- 内联修改标题和时间
- 保存/删除操作后刷新列表

## 阶段七：数据同步与实时更新

### 7.1 主窗口与悬浮球数据同步
- 使用 Electron IPC 广播机制
- 任一窗口修改数据后通知另一窗口刷新

## 阶段八：测试与验证

### 8.1 功能测试
- [ ] 日历视图切换正常
- [ ] 拖拽创建日程成功
- [ ] 气泡弹窗交互流畅
- [ ] 迷你日历导航同步
- [ ] 数据库持久化正常
- [ ] 系统通知正常弹出
- [ ] 悬浮球边缘吸附动画
- [ ] 悬浮球内编辑保存

---

**优先级**: 高 → 低
**预计开始时间**: 即日
