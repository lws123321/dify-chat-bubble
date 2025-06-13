#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 部署到 GitHub Pages 的脚本
 * 将 dist 文件夹内容推送到 gh-pages 分支
 */
function deploy() {
  try {
    console.log('🚀 开始部署到 GitHub Pages...');

    // 检查 dist 目录是否存在
    const distPath = path.resolve('dist');
    if (!fs.existsSync(distPath)) {
      console.error('❌ dist 目录不存在，请先运行 npm run build');
      process.exit(1);
    }

    // 构建项目
    console.log('📦 正在构建项目...');
    execSync('npm run build', { stdio: 'inherit' });

    // 进入 dist 目录
    process.chdir(distPath);

    // 初始化 git 仓库（如果不存在）
    try {
      execSync('git status', { stdio: 'ignore' });
    } catch {
      console.log('🔧 初始化 git 仓库...');
      execSync('git init');
    }

    // 添加所有文件
    console.log('📝 添加文件到 git...');
    execSync('git add .');

    // 提交更改
    const timestamp = new Date().toLocaleString('zh-CN');
    execSync(`git commit -m "部署更新: ${timestamp}"`, { stdio: 'inherit' });

    // 获取远程仓库信息
    const remoteUrl = execSync('git -C .. remote get-url origin', { encoding: 'utf8' }).trim();
    
    // 设置远程仓库
    try {
      execSync('git remote add origin ' + remoteUrl, { stdio: 'ignore' });
    } catch {
      execSync('git remote set-url origin ' + remoteUrl);
    }

    // 推送到 gh-pages 分支
    console.log('🚀 推送到 gh-pages 分支...');
    execSync('git push -f origin HEAD:gh-pages', { stdio: 'inherit' });

    console.log('✅ 部署成功！');
    console.log('🌐 你的网站将在几分钟后可用：');
    console.log(`   https://你的用户名.github.io/dify-chat-bubble`);

  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 运行部署
deploy(); 