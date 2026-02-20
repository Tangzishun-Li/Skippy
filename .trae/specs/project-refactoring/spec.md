# 项目重构规格说明书

## Why

当前项目存在以下问题：
1. `script.js` 文件过大（1519行），难以维护和阅读
2. 功能模块混杂在一起，没有清晰的分层架构
3. CSS样式集中在一个文件中，难以定位和维护
4. 各个功能之间耦合度高，不利于单独测试和修改

## What Changes

### 1. JavaScript 模块化重构
- 将 `script.js` 拆分为多个独立模块
- 采用功能模块化设计，每个模块负责单一功能
- 使用 ES6 模块化规范

### 2. CSS 样式分离
- 按功能区域拆分 CSS 文件
- 创建基础样式、组件样式、布局样式等分类
- 便于样式复用和维护

### 3. 代码组织优化
- 前端代码按功能模块组织
- 保持现有功能不变
- 优化代码结构和命名

## Impact

### 受影响的规格
- 课程管理功能（拆分到独立模块）
- 日历视图功能（拆分到独立模块）
- 导入导出功能（已有模块化文件）
- 节假日功能（已有模块化文件）

### 受影响的代码文件

#### 拆分后的 JavaScript 文件结构
| 原文件 | 拆分后文件 | 功能说明 |
|--------|-----------|---------|
| script.js | core/app.js | 应用入口和初始化 |
| script.js | core/calendar.js | 日历渲染逻辑 |
| script.js | core/course.js | 课程管理逻辑 |
| script.js | core/status.js | 课程状态管理 |
| script.js | core/timeline.js | 时间轴功能 |
| script.js | utils/dateUtils.js | 日期工具函数 |
| script.js | utils/storage.js | 本地存储工具 |
| script.js | components/toast.js | Toast通知组件 |
| script.js | components/modal.js | 弹窗组件 |
| script.js | components/statusMenu.js | 状态菜单组件 |
| 新增 | services/holidayService.js | 节假日服务（已创建） |
| 新增 | services/icsParser.js | ICS解析服务（已创建） |
| 新增 | services/googleImporter.js | Google导入服务（已创建） |

#### 拆分后的 CSS 文件结构
| 原文件 | 拆分后文件 | 功能说明 |
|--------|-----------|---------|
| style.css | base/reset.css | 基础重置样式 |
| style.css | base/typography.css | 字体排版样式 |
| style.css | layout/navbar.css | 导航栏样式 |
| style.css | layout/container.css | 容器布局样式 |
| style.css | components/calendar.css | 日历组件样式 |
| style.css | components/course.css | 课程列表样式 |
| style.css | components/modal.css | 弹窗样式 |
| style.css | components/toast.css | Toast通知样式 |
| style.css | components/form.css | 表单样式 |

## ADDED Requirements

### Requirement: 模块化架构
系统 SHALL 采用模块化架构组织前端代码。

#### Scenario: 模块加载
- **WHEN** 应用启动时
- **THEN** 按正确顺序加载各个模块
- **AND** 模块之间通过约定接口通信

### Requirement: 功能完整性
系统 SHALL 保持现有所有功能不变。

#### Scenario: 功能测试
- **WHEN** 重构完成后
- **THEN** 所有原有功能正常工作
- **AND** 用户无感知变化

## MODIFIED Requirements

### Requirement: 代码组织
- **原要求**: 代码集中在少数文件中
- **新要求**: 代码按功能模块化组织到独立文件

## REMOVED Requirements

无

## 重构原则

1. **渐进式重构**: 不一次性改变所有代码，而是逐步拆分
2. **保持功能不变**: 重构过程中不改变任何现有功能
3. **向后兼容**: 新模块支持旧接口调用方式
4. **文档同步**: 规格文档与实际代码保持一致
