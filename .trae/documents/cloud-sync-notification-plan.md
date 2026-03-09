# Skippy 增强功能实现计划

## 功能概述

为 Skippy 课程管理应用添加三个核心功能：

1. **云端同步** - 多设备同步课程数据
2. **第三方 API 集成** - 接入更多服务
3. **通知增强** - 桌面通知、邮件提醒

***

## 方案选择

### 1. 云端同步

**推荐方案：Supabase**

* 免费额度充足（500MB 数据库 + 无限 API 请求）

* 实时订阅功能（多设备自动同步）

* 支持匿名登录（无需强制注册）

* PostgreSQL 数据库（结构化查询强）

**备选方案：Firebase**

* 实时数据库 + 离线支持

* Google 账户认证

### 2. 第三方 API

| 服务                    | 功能          |
| --------------------- | ----------- |
| **中国节假日 API**         | 自动识别节假日调休   |
| **天气 API**            | 课程提醒时显示天气   |
| **邮件服务 (Nodemailer)** | 重要 DDL 邮件提醒 |

### 3. 通知增强

* Electron 原生桌面通知（已有基础）

* 增强通知：可自定义时间、提前提醒

* 邮件提醒：DDL 截止前发送邮件

***

## 实现步骤

### 阶段一：云端同步 (Supabase)

#### 1.1 注册 Supabase 账号

* 访问 supabase.com 创建免费项目

* 获取 project URL 和 anon key

#### 1.2 添加依赖

```bash
npm install @supabase/supabase-js
```

#### 1.3 创建同步模块

* 文件：`src/main/modules/sync.js`

* 功能：

  * 初始化 Supabase 客户端

  * 匿名登录/邮箱登录

  * 课程数据上传/下载

  * 实时订阅变化

  * 冲突解决（以最后修改为准）

#### 1.4 更新 IPC 处理器

* 文件：`src/main/modules/ipcHandlers.js`

* 添加：

  * `sync:login` - 登录/注册

  * `sync:upload` - 上传数据

  * `sync:download` - 下载数据

  * `sync:enable` - 启用/禁用同步

  * `sync:status` - 同步状态

#### 1.5 更新前端

* 文件：`src/renderer/js/utils/sync.js`

* UI：设置页面添加"云同步"开关

* 功能：自动同步、显示同步状态

***

### 阶段二：第三方 API 集成

#### 2.1 节假日 API

* 免费 API：`https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}`

* 中国：`countryCode = CN`

* 功能：日历显示节假日、区分调休上课

#### 2.2 天气 API（可选）

* 免费 API：和风天气 / OpenWeatherMap

* 功能：提醒时显示目的地天气

#### 2.3 邮件服务

* 使用 Nodemailer + SMTP

* 支持 Gmail / QQ 邮箱 / 企业邮箱

* 功能：DDL 截止前发送邮件提醒

***

### 阶段三：通知增强

#### 3.1 通知系统重构

* 文件：`src/main/modules/notification.js`

* 功能：

  * 可自定义提前提醒时间（15分钟、1小时、1天）

  * 重复提醒（可设置间隔）

  * 通知历史记录

#### 3.2 邮件提醒模块

* 文件：`src/main/modules/mailer.js`

* 功能：

  * DDL 截止前 N 小时发送邮件

  * 支持多个收件人

  * 邮件模板定制

#### 3.3 前端通知设置

* 文件：`src/renderer/js/modules/notification-settings.js`

* UI：

  * 通知开关

  * 提前时间选择

  * 邮件提醒设置

  * 通知历史

***

### 阶段四：数据迁移与测试

#### 4.1 数据迁移

* 将 localStorage 数据迁移到 SQLite（已完成）

* 支持云端备份/恢复

#### 4.2 测试

* 多设备同步测试

* 通知触发测试

* 邮件发送测试

***

## 文件清单

### 新增文件

| 文件路径                                               | 说明            |
| -------------------------------------------------- | ------------- |
| `src/main/modules/sync.js`                         | Supabase 同步模块 |
| `src/main/modules/notification.js`                 | 增强通知模块        |
| `src/main/modules/mailer.js`                       | 邮件发送模块        |
| `src/renderer/js/utils/sync.js`                    | 前端同步工具        |
| `src/renderer/js/modules/notification-settings.js` | 通知设置 UI       |

### 修改文件

| 文件路径                              | 修改内容        |
| --------------------------------- | ----------- |
| `package.json`                    | 添加依赖        |
| `src/main/main.js`                | 初始化新模块      |
| `src/main/modules/ipcHandlers.js` | 添加同步/通知 IPC |
| `src/main/preload.js`             | 暴露新 API     |
| `src/renderer/index.html`         | 添加设置页面      |

***

## 依赖清单

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "nodemailer": "^6.x"
  }
}
```

***

## 预计工作量

| 阶段     | 功能      | 工作量          |
| ------ | ------- | ------------ |
| 一      | 云端同步    | 4-6 小时       |
| 二      | 第三方 API | 2-3 小时       |
| 三      | 通知增强    | 3-4 小时       |
| 四      | 测试优化    | 2 小时         |
| **总计** | <br />  | **11-15 小时** |

***

## 实施顺序

1. **云端同步** - 核心功能，先实现
2. **通知增强** - 用户痛点，重点优化
3. **第三方 API** - 锦上添花，逐步接入

***

## 注意事项

1. 所有密钥存储在主进程，不暴露给渲染进程
2. 同步采用增量更新，减少流量
3. 邮件发送需要用户配置 SMTP
4. 遵循 Supabase 免费额度限制

