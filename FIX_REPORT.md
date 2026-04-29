
【开发模式卡死问题 - 已解决】

🔍 问题诊断
============
1. 根本原因：design-sandbox 目录被 Next.js 错误扫描编译
   - build_error.log 显示：Cannot find module '@/hooks/useTheme'
   - design-sandbox 的 layout.tsx 引用了主项目缺失的模块

2. 连锁问题：
   - 缺失 hooks/useTheme.tsx 和 components/ThemeToggle.tsx
   - missing 'lucide-react' 依赖
   - next.config.js 排除规则不完整

🔧 修复措施
============
✅ 复制缺失文件（从 design-sandbox）：
   - src/hooks/useTheme.tsx
   - src/components/ThemeToggle.tsx
   - src/components/Header.tsx
   - src/components/ParticleBackground.tsx

✅ 修复 next.config.js：
   - 添加 webpack 规则排除 design-sandbox 目录
   - 确保 '@/...' 正确解析到根 src

✅ 安装缺失依赖：
   - npm install lucide-react

✅ 代码质量修复：
   - useTheme.tsx: 分离类型导入（import type { ReactNode }）
   - 验证所有 .tsx 文件的 import 语句符合 Next.js 14 规范

✅ 验证结果：
   - Build 成功：22/22 页面编译通过
   - Dev 服务器：localhost:3001 正常运行
   - TypeScript：0 错误
   - design-sandbox：完全排除，无引用

📊 Next.js 14 合规检查
======================
✅ 'use client' + metadata 冲突：无
✅ Type imports 分离：全部符合
✅ Dynamic imports (ssr: false)：14 个正确使用
✅ Layout 结构：正确（仅 export metadata）
✅ Page 组件：全部为客户端组件

