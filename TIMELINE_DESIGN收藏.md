# 时间轴设计收藏夹

> 记录 Skippy 项目中高级炫酷的时间轴设计

---

## 设计概述

这是一个现代化、深色主题的时间轴面板，用于显示 DDL（截止日期）倒计时。设计风格采用赛博朋克 + 科技感，结合了渐变、发光、动画等效果。

---

## 核心文件

- **HTML**: `src/renderer/index.html` (第 73-83 行)
- **CSS**: `src/renderer/css/components/calendar.css` (第 844-1186 行)
- **JS**: `src/renderer/js/core/calendar.js` (第 776-840 行)

---

## 设计亮点

### 1. 面板整体
- 深蓝紫渐变背景 (`rgba(26, 26, 46, 0.98)` → `rgba(22, 33, 62, 0.98)`)
- 毛玻璃效果 (`backdrop-filter: blur(20px)`)
- 紫色光晕边框
- 24px 圆角
- 滑动展开/收起动画

### 2. 头部设计
- 三层渐变背景 (`#1a1a2e` → `#16213e` → `#0f3460`)
- 闪烁光效动画 (`shimmer` - 3s 循环)
- 金色渐变标题文字
- 弹跳图标动画 (`iconBounce` - 2s 循环)

### 3. 时间轴节点
- 渐变紫色圆点 (`#667eea` → `#764ba2`)
- 多层发光效果 (15px + 30px shadow)
- 脉冲动画 (`pulse` - 2s 循环)
- 呼吸效果 (`glow` - 3s 循环)
- 中心白色小圆点

### 4. 卡片内容
- 毛玻璃背景 + 顶部 3px 渐变装饰条
- 悬停时上浮 + 阴影加深
- 菱形标记标题 (`◆`)
- 圆角药丸形状时间标签
- 带背景装饰的倒计时区域

### 5. 特殊状态
- **即将截止**: 红色文字 + 闪烁动画 (`urgentPulse`)
- **空状态**: 浮动图标 + 友好提示文案

---

## 关键 CSS 代码片段

### 面板容器
```css
.timeline-panel {
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.98) 0%, rgba(22, 33, 62, 0.98) 100%);
  backdrop-filter: blur(20px);
  border-radius: 0 24px 24px 0;
  box-shadow: 15px 0 40px rgba(0, 0, 0, 0.25), 0 0 1px rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(102, 126, 234, 0.1);
  border-left: none;
}
```

### 头部闪烁动画
```css
.timeline-header::before {
  content: '';
  position: absolute;
  background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%);
  background-size: 200% 200%;
  animation: shimmer 3s ease-in-out infinite;
}
```

### 节点脉冲 + 发光
```css
.timeline-dot {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 0 15px rgba(102, 126, 234, 0.6), 0 0 30px rgba(102, 126, 234, 0.3);
  animation: pulse 2s infinite, glow 3s ease-in-out infinite;
}
```

### 卡片悬停效果
```css
.timeline-content:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.15), 0 0 0 1px rgba(102, 126, 234, 0.2) inset;
}
```

### 标题渐变文字
```css
.timeline-header h3 {
  background: linear-gradient(90deg, #fff, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 动画关键帧汇总

| 动画名 | 时长 | 效果 |
|--------|------|------|
| `shimmer` | 3s | 头部闪烁光效 |
| `iconBounce` | 2s | 图标弹跳 |
| `pulse` | 2s | 节点脉冲扩散 |
| `glow` | 3s | 节点呼吸亮度 |
| `urgentPulse` | 1s | 截止警告闪烁 |
| `float` | 3s | 空状态浮动 |

---

## 色彩方案

| 用途 | 颜色 |
|------|------|
| 主渐变 | `#667eea` → `#764ba2` |
| 强调色 | `#f093fb` |
| 警告色 | `#ff4757` |
| 金色点缀 | `#ffd700` |
| 背景深色 | `#1a1a2e`, `#16213e`, `#0f3460` |

---

## 适用场景

- DDL 倒计时展示
- 任务截止日期时间线
- 课程/活动日程展示
- 任何需要高颜值时间线的场景

---

*创建时间: 2026-02-26*
*项目: Skippy - 课程管理应用*
