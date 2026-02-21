# 任务列表

## 任务 1: 修复周视图网格布局
- [x] 1.1: 检查并修复 calendar.js 中的 renderWeekView 函数
  - [x] 确保生成 8 个标题单元格（时间 + 7 天）
  - [x] 确保每个单元格正确设置 grid-row 和 grid-column
  - [x] 确保生成 17 个时间段（6:00-22:00），每个时间段 8 个单元格
- [x] 1.2: 检查并修复 calendar.css 中的周视图样式
  - [x] 确保 grid-template-columns: 50px repeat(7, 1fr)
  - [x] 确保 grid-template-rows: 50px repeat(17, 50px)
  - [x] 移除可能干扰布局的 CSS 规则

## 任务 2: 实现课程事件跨时段显示
- [x] 2.1: 修改 JS 渲染逻辑，计算课程持续时间
  - [x] 解析 startTime 和 endTime
  - [x] 计算 duration = endHour - startHour
- [x] 2.2: 设置事件元素的 grid-row-span
  - [x] 使用 grid-row: span ${duration} 让事件跨越多行
  - [x] 调整事件样式确保正确显示

## 任务 3: 验证修复
- [x] 3.1: 验证周六列可见
- [x] 3.2: 验证各列宽度一致
- [x] 3.3: 验证课程事件跨越多个时间段
