# Skippy - 课程管理助手

一个基于 Electron + Vite 开发的桌面课程管理应用，采用模块化架构设计，支持课程管理、状态跟踪、日历视图、悬浮球快捷操作等功能。

## 功能特点

### 核心功能

- **课程管理**：添加、删除、编辑课程，支持设置课程名称、时间、日期、频率和重复次数
- **状态管理**：
  - 无标签：默认状态
  - 已上且无问题：绿色
  - 未上/旷课：红色
  - 已上但有问题：黄色
  - 未来课程 DDL：蓝色
- **悬浮球**：桌面悬浮球快捷操作，支持拖动、悬停展开功能按钮
- **日历视图**：直观显示课程安排和状态，支持月份导航
- **系统托盘**：最小化到托盘，后台运行，右键菜单快速操作

### 将要进行的功能
- **问题记录**：标记有问题的课程，记录学习问题，方便回顾复习



### 界面特点

- 清新现代的 UI 设计
- 响应式布局，适配不同屏幕尺寸
- 当前周课程自动标记
- 当天日期突出显示
- 悬停效果和动画过渡

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
├── .gitignore                    # Git 忽略配置
├── README.md                     # 本文档
└── MODULES.md                    # 模块化架构详细文档
```

## 文件依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                      main.js                            │
│                    (应用入口)                            │
│                                                         │
│  - 导入 windowManager, trayManager, ipcHandlers        │
│  - 设置 app.isQuitting 标志                            │
│  - 监听 app.whenReady() 初始化各模块                    │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ windowManager   │ │  trayManager    │ │  ipcHandlers    │
│   (窗口管理)    │ │   (托盘管理)     │ │  (IPC处理)       │
│                 │ │                 │ │                 │
│ 依赖:           │ │ 依赖:           │ │ 依赖:           │
│ - electron      │ │ - electron      │ │ - electron      │
│ - path          │ │ - path          │ │ - windowManager │
│ - app           │ │ - windowManager │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                    │                    │
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  preload.js     │
                    │ (预加载脚本)     │
                    │                 │
                    │ 依赖:           │
                    │ - electron      │
                    │                 │
                    │ 暴露 API:       │
                    │ - ballWindowMove│
                    │ - openMenu      │
                    │ - toggleMainWin │
                    │ - showCalendar  │
                    │ - showAddCourse │
                    │ - updateBall    │
                    │ - onUpdate      │
                    │ - onConfig      │
                    └─────────────────┘
```

**依赖关系说明**：
- `main.js` 依赖 `windowManager`、`trayManager`、`ipcHandlers`
- `trayManager` 依赖 `windowManager`（需要调用窗口操作方法）
- `ipcHandlers` 依赖 `windowManager`（需要操作窗口和发送消息）
- `preload.js` 独立运行，通过 IPC 与主进程通信

## 快速开始

### 前提条件

确保您的电脑已安装 Node.js 环境。如果未安装，请先下载并安装：
- [Node.js 官方下载](https://nodejs.org/zh-cn/download/)

### 安装依赖

```bash
cd d:\Codespace\Skippy\Skippy
npm install
```

### 运行应用

```bash
# 直接启动 Electron 应用
npm run electron

# 启动开发模式（同时运行 Vite 和 Electron）
npm run electron:dev
```

## 模块 API 详细说明

### 1. windowManager.js（窗口管理模块）

**文件路径**: `src/main/modules/windowManager.js`

**功能描述**: 负责创建和管理主窗口、悬浮球窗口的所有操作。

#### 函数列表

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `createMainWindow()` | 无 | `BrowserWindow` | 创建并返回主窗口实例 |
| `createFloatingBallWindow()` | 无 | `BrowserWindow` | 创建并返回悬浮球窗口实例 |
| `getMainWindow()` | 无 | `BrowserWindow \| null` | 获取当前主窗口实例 |
| `getFloatingBallWindow()` | 无 | `BrowserWindow \| null` | 获取当前悬浮球窗口实例 |
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

### 2. trayManager.js（系统托盘模块）

**文件路径**: `src/main/modules/trayManager.js`

**功能描述**: 负责创建和管理系统托盘，包括托盘图标、右键菜单等。

#### 函数列表

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `createTray(windowManager)` | `windowManager: object` | `Tray` | 创建系统托盘并返回实例 |
| `getTray()` | 无 | `Tray \| null` | 获取当前托盘实例 |
| `destroyTray()` | 无 | `void` | 销毁托盘实例 |
| `updateTooltip(text)` | `text: string` | `void` | 更新托盘提示文本 |

### 3. ipcHandlers.js（IPC 处理模块）

**文件路径**: `src/main/modules/ipcHandlers.js`

**功能描述**: 集中处理所有主进程与渲染进程之间的 IPC 通信。

#### 函数列表

| 函数名 | 参数 | 返回值 | 功能描述 |
|--------|------|--------|----------|
| `registerIpcHandlers(windowManager)` | `windowManager: object` | `void` | 注册所有 IPC 事件处理器 |
| `clearIpcHandlers()` | 无 | `void` | 清除所有 IPC 处理器 |

### 4. preload.js（预加载脚本）

**文件路径**: `src/main/preload.js`

**功能描述**: 配置渲染进程可用的 API 接口，实现主进程与渲染进程的安全通信。

#### 暴露的 API（`window.electronAPI`）

| API 名称 | 参数 | 返回值 | 功能描述 |
|----------|------|--------|----------|
| `ballWindowMove(data)` | `data: { x: number, y: number }` | `void` | 移动悬浮球位置 |
| `openMenu()` | 无 | `void` | 打开右键菜单 |
| `toggleMainWindow()` | 无 | `void` | 切换主窗口 |
| `showCalendar()` | 无 | `void` | 显示日历 |
| `showAddCourse()` | 无 | `void` | 显示添加课程 |
| `updateBall()` | 无 | `void` | 更新悬浮球数据 |
| `onUpdate(callback)` | `callback: (data) => void` | `void` | 监听数据更新 |
| `onConfig(callback)` | `callback: (config) => void` | `void` | 监听配置更新 |

## 使用指南

### 1. 添加课程

1. 在"添加课程"表单中填写课程信息
2. 选择开始和结束时间
3. 选择上课日期（支持多选）
4. 选择频率（每周、每两周、每个月或每天）
5. 设置重复次数
6. 点击"添加课程"按钮

### 2. 管理课程状态

1. 点击每周的课程项（圆形进度点）
2. 在弹出的菜单中选择对应状态
3. 状态会立即更新并保存

**状态说明**：
- 未来课程：只能设置为"无标签"或"DDL"
- 过去课程：可以设置为"已上（无问题）"、"未上/旷课"或"已上（有问题）"

### 3. 记录问题

1. 将课程状态设置为"已上（有问题）"
2. 点击黄色的课程项
3. 在弹出的表单中输入问题描述
4. 点击"保存问题"按钮
5. 悬停在黄色课程项上可以查看问题详情

### 4. 使用悬浮球

- **拖动**：按住悬浮球拖动到任意位置
- **悬停**：鼠标悬停显示功能按钮
- **右键**：打开右键菜单（置顶、开发者工具、重启、退出）
- **功能按钮**：
  - 日历按钮：显示日历视图
  - 文档按钮：切换主窗口
  - 加号按钮：显示添加课程视图

### 5. 使用系统托盘

- **点击托盘图标**：显示/隐藏主窗口
- **右键菜单**：
  - 显示主窗口
  - 隐藏主窗口
  - 显示/隐藏悬浮球
  - 退出应用

## 打包应用

### 打包前准备

1. **确保依赖已安装**：
   ```bash
   npm install
   ```

2. **安装打包工具**：
   ```bash
   npm install electron-builder --save-dev
   npm install cross-env --save-dev
   ```

### 执行打包

```bash
# 打包 Windows 版本
npm run build:win

# 打包 macOS 版本
npm run build:mac

# 打包 Linux 版本
npm run build:linux

# 打包所有平台
npm run build:all
```

### 打包结果

打包完成后，生成的文件会位于 `dist/` 目录：

| 文件类型 | 文件名 | 用途 |
|----------|--------|------|
| 安装包 | `Skippy Setup 0.1.0-beta.1.exe` | 可安装版本，会创建快捷方式 |
| 便携版 | `Skippy 0.1.0-beta.1.exe` | 绿色便携版，无需安装 |
| 解包版 | `win-unpacked/` | 已解包的应用文件 |

### 发布应用

#### 方法 1：GitHub Releases

1. **创建 Release**：
   - 进入 GitHub 仓库 → Releases → Draft a new release
   - 版本号：`v0.1.0-beta.1`
   - 标题：`Skippy v0.1.0-beta.1`

2. **上传文件**：
   - 上传 `Skippy Setup 0.1.0-beta.1.exe`（推荐）
   - 上传 `Skippy 0.1.0-beta.1.exe`（可选，便携版）

3. **填写说明**：
   ```markdown
   ## Skippy v0.1.0-beta.1

   ### 功能特性
   - 课程管理：添加、删除、编辑课程
   - 状态管理：支持标记已上、未上、有问题等状态
   - 问题记录：记录学习问题，方便回顾复习
   - 日历视图：直观显示课程安排和状态
   - 悬浮球：桌面悬浮球快捷操作
   - 系统托盘：后台运行，右键菜单快速操作

   ### 安装方法
   1. 下载 `Skippy Setup 0.1.0-beta.1.exe`
   2. 双击运行安装向导
   3. 按照提示完成安装
   4. 从桌面快捷方式启动应用

   ### 便携版使用
   1. 下载 `Skippy 0.1.0-beta.1.exe`
   2. 直接运行，无需安装
   3. 可将文件放在任何位置使用
   ```

#### 方法 2：其他平台

- **百度网盘**：上传安装包和便携版，分享链接
- **坚果云**：创建分享链接
- **企业内网**：上传到内部文件服务器

### 打包配置说明

**package.json 中的打包配置**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 版本号 | `0.1.0-beta.1` | 应用版本号 |
| 应用名称 | `Skippy` | 应用显示名称 |
| 应用ID | `com.skippy.app` | 应用唯一标识 |
| 目标架构 | `x64` | 64位系统 |
| 目标系统 | `Windows` | 支持的系统 |
| 安装器类型 | `NSIS` | 支持自定义安装路径 |

### 技术细节

- 使用 **electron-builder** 进行打包
- 配置了 **NSIS 安装器**，支持自定义安装路径
- 生成了 **便携版**，方便用户免安装使用
- 使用了本地缓存文件解决网络下载问题

## 技术架构

### 技术栈

- **前端**：HTML5 + CSS3 + JavaScript
- **框架**：Electron 25.x
- **构建工具**：Vite 4.x
- **数据存储**：localStorage

### IPC 通信流程

```
渲染进程                    主进程
    │                         │
    │  window.electronAPI     │
    │  .ballWindowMove(data)  │
    │ ──────────────────────> │
    │                         │ windowManager.moveFloatingBall(x, y)
    │                         │
    │  window.electronAPI     │
    │  .onUpdate(callback)    │
    │ <────────────────────── │
    │                         │ windowManager.sendToFloatingBall('update', data)
    │                         │
```

## 数据存储

应用使用 `localStorage` 存储课程数据，数据结构如下：

```javascript
{
  id: "唯一标识符",
  name: "课程名称",
  time: "上课时间",
  days: [1, 3, 5],  // 上课日期（0-6，周日为0）
  frequency: "weekly",  // 频率：weekly/biweekly/monthly/daily
  repeat: 16,  // 重复次数
  startDate: "2024-01-01",  // 开始日期
  lessons: [
    {
      date: "2024-01-01",
      status: "attended",  // 状态：attended/skipped/problematic/ddl
      problem: "问题描述"  // 可选
    }
  ]
}
```

## 常见问题

### 1. 无法运行软件

- 检查 Node.js 是否已正确安装
- 确保所有依赖已成功安装（`npm install`）
- 尝试以管理员身份运行命令提示符

### 2. 数据丢失

- 软件使用 localStorage 存储数据，通常不会丢失
- 若浏览器清除了本地存储，数据可能会丢失
- 建议定期备份重要数据

### 3. 悬浮球无法拖动

- 确保应用已正确启动
- 检查是否有其他窗口遮挡
- 尝试重启应用

### 4. 界面显示异常

- 尝试调整窗口大小
- 检查是否有 CSS 样式冲突
- 清除应用缓存后重新启动

## 开发指南

### 项目脚本

```bash
# 安装依赖
npm install

# 启动 Vite 开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview

# 启动 Electron 应用
npm run electron

# 启动开发模式
npm run electron:dev

# 打包应用
npm run build:win
npm run build:mac
npm run build:linux
```

### 添加新功能

1. 在 `src/main/modules/` 下创建新模块
2. 在 `main.js` 中导入并初始化模块
3. 如需 IPC 通信，在 `ipcHandlers.js` 中添加处理器
4. 在 `preload.js` 中暴露新的 API

### 代码规范

- 使用 CommonJS 模块规范
- 函数和变量使用驼峰命名
- 模块职责单一，避免循环依赖
- 使用 `contextIsolation: true` 确保渲染进程安全

## 更新日志

### v1.0.0

- 实现课程管理核心功能
- 实现状态管理和问题记录
- 实现日历视图
- 实现悬浮球功能
- 实现系统托盘功能
- 项目模块化重构

### v0.1.0-beta.1

- 初始版本
- 完成基本功能开发
- 支持 Windows 平台打包

## 许可证

MIT License

## 联系与反馈

如有任何问题或建议，欢迎反馈！