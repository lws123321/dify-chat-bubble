# GitHub Pages 部署指南

本项目提供三种方式将打包后的 `dist` 文件夹部署到 GitHub Pages。

## 🚀 方案1：GitHub Actions 自动部署（推荐）

### 设置步骤：

1. **启用 GitHub Pages**
   - 进入你的 GitHub 仓库
   - 点击 `Settings` 选项卡
   - 在左侧菜单中找到 `Pages`
   - 在 "Source" 部分，选择 `GitHub Actions`

2. **推送代码**
   ```bash
   git add .
   git commit -m "添加 GitHub Actions 部署配置"
   git push origin main
   ```

3. **查看部署状态**
   - 在仓库的 `Actions` 选项卡中查看部署进度
   - 部署成功后，你的网站将在 `https://你的用户名.github.io/dify-chat-bubble` 可用

### 特点：
- ✅ 每次推送到 `main` 分支时自动部署
- ✅ 支持手动触发部署
- ✅ 无需本地配置
- ✅ 部署日志清晰可见

## 📝 方案2：使用脚本手动部署

### 使用方法：
```bash
# 安装依赖（如果还没安装）
npm install

# 执行部署
npm run deploy
```

### 特点：
- ✅ 自动构建项目
- ✅ 推送到 `gh-pages` 分支
- ✅ 带有时间戳的提交信息
- ❓ 需要本地执行

## 🛠️ 方案3：使用 gh-pages 工具

### 安装依赖：
```bash
npm install gh-pages --save-dev
```

### 使用方法：
```bash
# 构建并部署
npm run deploy:manual
```

### 特点：
- ✅ 简单易用
- ✅ 专业的部署工具
- ❓ 需要安装额外依赖

## 📋 部署前检查清单

- [ ] 确保项目可以正常构建：`npm run build`
- [ ] 检查 `dist` 目录是否包含所需文件
- [ ] 确保 GitHub 仓库设置了正确的 Pages 配置
- [ ] 验证仓库的 `homepage` 字段是否正确（如需要）

## 🌐 访问你的网站

部署成功后，你的网站将在以下地址可用：
- `https://你的用户名.github.io/dify-chat-bubble`

## 🔧 自定义域名（可选）

如果你有自定义域名，可以：

1. 在 `dist` 目录中创建 `CNAME` 文件：
   ```
   your-domain.com
   ```

2. 在 GitHub Pages 设置中配置自定义域名

## ❗ 常见问题

### 1. 部署后网站显示空白页面
- 检查 `dist` 目录中是否有 `index.html` 文件
- 确保文件路径正确

### 2. GitHub Actions 权限错误
- 在仓库设置的 Actions > General 中，确保工作流权限设置为 "Read and write permissions"

### 3. 手动部署脚本执行失败
- 确保已配置 Git 用户信息：
  ```bash
  git config --global user.name "你的用户名"
  git config --global user.email "你的邮箱"
  ```

### 4. 404 错误
- 确保 GitHub Pages 已正确启用
- 检查分支设置是否正确
- 等待几分钟让更改生效

## 📝 更新部署

- **自动部署**：只需推送代码到 `main` 分支
- **手动部署**：重新运行部署命令

## 🎯 建议

对于生产环境，推荐使用 **GitHub Actions 自动部署**，因为它：
- 减少人为错误
- 提供完整的部署日志
- 支持团队协作
- 无需本地环境配置 