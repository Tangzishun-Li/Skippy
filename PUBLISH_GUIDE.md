# Skippy v1.3.0 发布指南

## 📋 发布清单

### ✅ 发布前准备

- [x] 更新 package.json 版本号为 1.3.0
- [x] 更新 README.md 添加更新日志
- [x] 创建 RELEASE_NOTES.md 发布说明
- [x] 提交 Git 变更
- [x] 创建 Git 标签 v1.3.0
- [ ] 打包各平台安装包
- [ ] 上传到 GitHub Release
- [ ] 发布通知

### 📦 打包命令

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux

# 所有平台
npm run build:all
```

### 🎯 GitHub Release 发布步骤

1. **访问 Release 页面**
   ```
   https://github.com/yourusername/skippy/releases/new
   ```

2. **填写发布信息**
   - **Tag version**: `v1.3.0`
   - **Release title**: `Skippy v1.3.0 - React+FullCalendar 重构`
   - **Description**: 复制 RELEASE_NOTES.md 的内容

3. **上传文件**
   - macOS: `Skippy-1.3.0.dmg`, `Skippy-1.3.0.zip`
   - Windows: `Skippy-Setup-1.3.0.exe`, `Skippy-Portable-1.3.0.exe`
   - Linux: `Skippy-1.3.0.AppImage`, `Skippy-1.3.0.deb`

4. **设置预发布**
   - ✅ 勾选 "Set as a pre-release"
   - 原因：悬浮窗功能还有已知问题

5. **发布**
   - 点击 "Publish release"

### 📝 Release Notes 模板

```markdown
# Skippy v1.3.0 🎉

## 主要特性
- 📅 FullCalendar 集成，支持月/周/日视图
- 🎯 全新悬浮球功能，双击展开日程面板
- 🗄️ 新增 events 表，支持完整 CRUD
- 💅 UI/UX 全面优化

## 已知问题
⚠️ 悬浮窗功能存在以下问题：
1. 点击无响应 - 建议双击
2. 展开显示异常 - 关闭重开
3. 拖拽失效 - 待修复
4. 贴边隐藏不工作 - 待修复

## 安装说明
- macOS: 下载 .dmg 文件拖拽安装
- Windows: 下载 .exe 安装
- Linux: 下载 .AppImage 直接运行

## 开发中
- ⚠️ 云端同步功能正在开发中

详细文档请查看 README.md
```

### 🔔 发布后任务

1. **通知用户**
   - 在项目中发布更新通知
   - 社交媒体宣传

2. **收集反馈**
   - 监控 GitHub Issues
   - 收集用户反馈

3. **后续版本规划**
   - 修复悬浮窗已知问题
   - 开发云端同步功能

---

**发布负责人**: ___________  
**发布日期**: ___________  
**发布状态**: □ 成功 □ 失败 □ 延期
