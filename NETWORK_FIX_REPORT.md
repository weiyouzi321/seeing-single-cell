
【localhost:3001 无响应 - 问题诊断与解决】

🔍 问题现象
============
- 用户访问 http://localhost:3001 无响应
- 开发服务器进程在运行，但无法访问

🔬 深入诊断
============
1. 进程状态：
   ✓ Next.js dev 进程 4960 正在运行
   ✓ 监听端口：3000 (不是 3001！)

2. 端口占用历史：
   ❌ 端口 3000 被旧进程 PID 86137 占用
   ❌ 端口 3001 被 redwood-broker (PID 4882) 占用
   ✅ 清理后，端口 3000/3001 空闲

3. Next.js 自动端口跳转：
   ⚠️ 启动时检测到端口冲突，自动选择 3002
   ⚠️ server_stdout.log: 
      "⚠ Port 3000 is in use, trying 3001 instead."
      "⚠ Port 3001 is in use, trying 3002 instead."
      "- Local: http://localhost:3002"

4. IPv6 问题：
   ❌ IPv6 localhost (::1:3000) 连接失败 (curl exit 3)
   ✅ IPv4 (127.0.0.1:3000) 完全正常 (HTTP 200)

🔧 解决方案
============
1. 清理冲突进程：
   - pkill -9 -f 'next dev'
   - kill -9 86137 4882 等旧进程

2. 清理 PID 和日志文件：
   - rm dev.pid .server.pid
   - 清空 dev_*.log, server_*.log

3. 重新启动（使用环境变量强制端口 3000）：
   - PORT=3000 npm run dev

4. 访问修正：
   ✅ 正确地址: http://127.0.0.1:3000
   ❌ 避免使用: http://localhost:3001

📊 当前状态
============
✅ 开发服务器运行正常 (PID 4960)
✅ 监听端口: 3000 (IPv4)
✅ HTTP 响应: 200 OK
✅ 页面标题: "Seeing Single-Cell"
✅ 构建成功: 22/22 页面

⚠️ 注意事项
============
1. macOS 上 localhost 解析到 ::1 (IPv6) 优先
2. 本机 IPv6 loopback 似乎配置有问题
3. 请始终使用 127.0.0.1:3000 访问
4. 如需共享，请使用实际 IP: http://192.168.28.237:3000
