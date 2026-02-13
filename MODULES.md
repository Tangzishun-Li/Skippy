# Skippy 项目模块化架构文档

## 项目概述

Skippy 是一个基于 Electron + Vite 的桌面课程管理应用，采用模块化架构设计，将不同功能分离到独立模块中，实现代码结构清晰、职责单一、低耦合的目标。

---

## 项目结构

```
Skippy/
├── src/
│   ├── main/                      # Electron 主进程代码
│   │   ├── main.js               # 应用入口文件
│   │   ├── preload.js            # 预加载脚本
│   │   └── modules/              # 功能模块目录
│   │       ├── windowManager.js  # 窗口管理模块
│   │       ├── trayManager.js    # 系统托盘模块
│   │       ├── ipcHandlers.js    # IPC 通信处理模块
│   │       └── preloadBridge.js # 预加载桥接模块
│   │
│   ├── renderer/                 # 前端渲染进程代码
│   │   ├── index.html           # 主页面
│   │   ├── css/
│   │   │   └── style.css        # 样式文件
│   │   └── js/
│   │       └── script.js        # 前端逻辑脚本
│   │
│   └── floating/                 # 悬浮球功能
│       └── floating-ball.html   # 悬浮球页面
│
├── package.json                  # 项目配置
├── vite.config.js                # Vite 配置
└── .gitignore                    # Git 忽略配置
```

---

## 模块说明

### 1. main.js（入口文件）

**文件路径**: `src/main/main.js`

**功能描述**: 应用的入口文件，负责协调各模块的初始化和应用程序的生命周期管理。

**核心职责**:
- 导入并初始化各功能模块
- 处理应用启动事件
- 管理应用退出流程

**使用示例**:

```javascript
const { app, BrowserWindow } = require('electron')

const windowManager = require('./modules/windowManager')
const trayManager = require('./modules/trayManager')
const ipcHandlers = require('./modules/ipcHandlers')

app.isQuitting = false

app.whenReady().then(() => {
  // 初始化各模块
  windowManager.createMainWindow()
  windowManager.createFloatingBallWindow()
  trayManager.createTray(windowManager)
  ipcHandlers.registerIpcHandlers(windowManager)
})
```

---

### 2. windowManager.js（窗口管理模块）

**文件路径**: `src/main/modules/windowManager.js`

**功能描述**: 负责创建和管理主窗口、悬浮球窗口的所有操作。

**核心函数说明**:

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `createMainWindow()` | 无 | `BrowserWindow` | 创建并返回主窗口实例 |
| `createFloatingBallWindow()` | 无 | `BrowserWindow` | 创建并返回悬浮球窗口实例 |
| `getMainWindow()` | 无 | `BrowserWindow` | 获取当前主窗口实例 |
| `getFloatingBallWindow()` | 无 | `BrowserWindow` | 获取当前悬浮球窗口实例 |
| `showMainWindow()` | 无 | `void` | 显示主窗口并获得焦点 |
| `hideMainWindow()` | 无 | `void` | 隐藏主窗口 |
| `toggleMainWindow()` | 无 | `void` | 切换主窗口显示/隐藏状态 |
| `showFloatingBall()` | 无 | `void` | 显示悬浮球 |
| `hideFloatingBall()` | 无 | `void` | 隐藏悬浮球 |
| `toggleFloatingBall()` | 无 | `void` | 切换悬浮球显示/隐藏状态 |
| `setFloatingBallAlwaysOnTop(flag)` | `flag: boolean` | `void` | 设置悬浮球是否置顶 |
| `moveFloatingBall(x, y)` | `x: number, y: number` | `void` | 移动悬浮球到指定位置 |
| `openFloatingBallDevTools()` | 无 | `void` | 打开悬浮球的开发者工具 |
| `sendToFloatingBall(channel, data)` | `channel: string, data: any` | `void` | 向悬浮球发送消息 |
| `destroyAllWindows()` | 无 | `void` | 销毁所有窗口 |

**使用示例**:

```javascript
const windowManager = require('./modules/windowManager')

// 创建窗口
windowManager.createMainWindow()
windowManager.createFloatingBallWindow()

// 窗口操作
windowManager.showMainWindow()
windowManager.hideMainWindow()
windowManager.toggleFloatingBall()
windowManager.setFloatingBallAlwaysOnTop(true)

// 向悬浮球发送数据
windowManager.sendToFloatingBall('update', { total: 5, completed: 2 })
```

---

### 3. trayManager.js（系统托盘模块）

**文件路径**: `src/main/modules/trayManager.js`

**功能描述**: 负责创建和管理系统托盘，包括托盘图标、右键菜单等。

**核心函数说明**:

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `createTray(windowManager)` | `windowManager: object` | `Tray` | 创建系统托盘并返回实例 |
| `getTray()` | 无 | `Tray` | 获取当前托盘实例 |
| `destroyTray()` | 无 | `void` | 销毁托盘实例 |
| `updateTooltip(text)` | `text: string` | `void` | 更新托盘提示文本 |

**托盘菜单功能**:
- 显示主窗口
- 隐藏主窗口
- 显示/隐藏悬浮球
- 退出应用

**使用示例**:

```javascript
const trayManager = require('./modules/trayManager')
const windowManager = require('./modules/windowManager')

// 创建托盘（需要传入 windowManager 以响应菜单操作）
trayManager.createTray(windowManager)

// 更新托盘提示
trayManager.updateTooltip('Skippy - 运行中')

// 销毁托盘
trayManager.destroyTray()
```

---

### 4. ipcHandlers.js（IPC 处理模块）

**文件路径**: `src/main/modules/ipcHandlers.js`

**功能描述**: 集中处理所有主进程与渲染进程之间的 IPC 通信。

**核心函数说明**:

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `registerIpcHandlers(windowManager)` | `windowManager: object` | `void` | 注册所有 IPC 事件处理器 |
| `clearIpcHandlers()` | 无 | `void` | 清除所有 IPC 处理器 |

**IPC 通信列表**:

| 通道名称 | 方向 | 数据格式 | 功能描述 |
|----------|------|----------|----------|
| `ballWindowMove` | 渲染→主 | `{ x: number, y: number }` | 移动悬浮球位置 |
| `toggleMainWindow` | 渲染→主 | 无 | 切换主窗口显示状态 |
| `updateBall` | 渲染→主 | 无 | 请求更新悬浮球数据 |
| `updateConfig` | 渲染→主 | `any` | 更新悬浮球配置 |
| `openMenu` | 渲染→主 | 无 | 打开悬浮球右键菜单 |
| `showCalendar` | 渲染→主 | 无 | 显示日历视图 |
| `showAddCourse` | 渲染→主 | 无 | 显示添加课程视图 |
| `update` | 主→渲染 | `[total, completed]` | 推送悬浮球数据更新 |
| `config` | 主→渲染 | `any` | 推送配置更新 |

**使用示例**:

```javascript
const ipcHandlers = require('./modules/ipcHandlers')
const windowManager = require('./modules/windowManager')

// 注册 IPC 处理器
ipcHandlers.registerIpcHandlers(windowManager)

// 清除所有处理器（通常在应用退出时使用）
ipcHandlers.clearIpcHandlers()
```

---

### 5. preloadBridge.js（预加载桥接模块）

**文件路径**: `src/main/modules/preloadBridge.js`

**功能描述**: 配置渲染进程可用的 API 接口，实现主进程与渲染进程的安全通信。

**核心函数说明**:

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `setupPreloadBridge()` | 无 | `void` | 配置 contextBridge 暴露的 API |
| `setupDOMBridge()` | 无 | `void` | 配置 DOM 加载完成后的初始化 |

**暴露给渲染进程的 API** (`window.electronAPI`):

```javascript
// 发送消息到主进程
window.electronAPI.ballWindowMove(data)      // 移动悬浮球
window.electronAPI.openMenu()                 // 打开右键菜单
window.electronAPI.toggleMainWindow()         // 切换主窗口
window.electronAPI.showCalendar()            // 显示日历
window.electronAPI.showAddCourse()           // 显示添加课程
window.electronAPI.updateBall()              // 更新悬浮球

// 监听主进程消息
window.electronAPI.onUpdate(callback)        // 监听数据更新
window.electronAPI.onConfig(callback)        // 监听配置更新
```

**使用示例**:

```javascript
// 在渲染进程中使用
// 发送消息
window.electronAPI.showCalendar()
window.electronAPI.updateBall()

// 监听消息
window.electronAPI.onUpdate((data) => {
  console.log('收到数据更新:', data)
})

window.electronAPI.onConfig((config) => {
  console.log('收到配置更新:', config)
})
```

---

## 文件依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                      main.js                            │
│                    (应用入口)                            │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ windowManager   │ │  trayManager    │ │  ipcHandlers    │
│   (窗口管理)    │ │   (托盘管理)     │ │  (IPC处理)       │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                    │                    │
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  preload.js     │
                    │ (预加载脚本)     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ preloadBridge   │
                    │ (桥接模块)       │
                    └─────────────────┘
```

**依赖关系说明**:
- `main.js` 依赖 `windowManager`、`trayManager`、`ipcHandlers`
- `trayManager` 依赖 `windowManager`（需要调用窗口操作方法）
- `ipcHandlers` 依赖 `windowManager`（需要操作窗口和发送消息）
- `preload.js` 依赖 `preloadBridge`

---

## 模块化优势

### 1. 职责单一
每个模块只负责一个功能领域，便于理解和维护。

### 2. 低耦合
模块间通过定义好的接口进行通信，内部实现对外部透明。

### 3. 可复用性
如 `windowManager` 模块可以在不同项目中重复使用。

### 4. 易于测试
每个模块可以独立进行单元测试。

### 5. 代码组织清晰
功能模块分离使代码结构一目了然，便于团队协作。

---

## 启动项目

```bash
# 安装依赖
npm install

# 启动 Electron 应用
npm run electron

# 启动开发模式（同时运行 Vite 和 Electron）
npm run electron:dev
```

---

## 注意事项

1. **模块路径**: 所有模块文件位于 `src/main/modules/` 目录下
2. **窗口引用**: 窗口实例存储在 `windowManager` 模块中，其他模块需要通过它获取
3. **IPC 安全**: 使用 `contextIsolation: true` 确保渲染进程安全
4. **生命周期**: 应用退出时确保正确清理托盘和窗口资源
