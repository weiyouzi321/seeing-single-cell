#!/usr/bin/env node
// Seeing Single-Cell 一键启动器
// 用法: node start.js [dev|build]
const { spawn, execSync } = require('child_process');
const path = require('path');

const NODE = '/Users/yiqi/.nvm/versions/node/v22.22.0/bin/node';
const PROJECT = __dirname;
const NEXT = path.join(PROJECT, 'node_modules/next/dist/bin/next');

// 设置 PATH 确保 npm/node 可用
const ENV = Object.assign({}, process.env, {
  PATH: '/Users/yiqi/.nvm/versions/node/v22.22.0/bin:' + (process.env.PATH || '')
});

const mode = process.argv[2] || 'dev';

if (mode === 'build') {
  console.log('📦 生产构建中...');
  const child = spawn(NODE, [NEXT, 'build'], {
    cwd: PROJECT, env: ENV, stdio: 'inherit'
  });
  child.on('exit', code => {
    console.log(code === 0 ? '✅ 构建成功' : '❌ 构建失败 (code ' + code + ')');
    process.exit(code);
  });
} else {
  console.log('🚀 启动开发服务器 (127.0.0.1:3000)...');
  // 先尝试清理端口
  try {
    const pidFile = '/tmp/nextdev_pid.txt';
    const fs = require('fs');
    if (fs.existsSync(pidFile)) {
      const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
      try { process.kill(oldPid); } catch(e) {}
    }
  } catch(e) {}
  
  const child = spawn(NODE, [NEXT, 'dev', '--hostname', '127.0.0.1', '--port', '3000'], {
    cwd: PROJECT, env: ENV, stdio: 'inherit'
  });
  child.on('exit', code => {
    console.log('开发服务器退出 (code ' + code + ')');
  });
}
