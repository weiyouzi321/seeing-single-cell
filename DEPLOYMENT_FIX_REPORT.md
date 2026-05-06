
============================================================
📋 部署就绪报告
============================================================

【修复内容】
✅ next.config.js: 添加 basePath, assetPrefix, exclude design-sandbox
✅ 构建时注入 BASE_PATH 和 NEXT_PUBLIC_BASE_PATH
✅ design-sandbox 被正确排除（独立项目）

【构建配置】
- next.config.js: basePath='/seeing-single-cell', assetPrefix='/seeing-single-cell'
- 环境变量: BASE_PATH=/seeing-single-cell, NEXT_PUBLIC_BASE_PATH=/seeing-single-cell
- output: 'export' (静态导出)

【产物验证】
- 页面数: 22 个 HTML
- 数据文件: 13 个 JSON
- 路径前缀: 所有内部链接已自动带 /seeing-single-cell
- 资源文件: _next 静态资源路径正确
- NavLinks: 客户端组件，运行时使用 NEXT_PUBLIC_BASE_PATH（已注入）
- fetch 数据: JS 中动态拼接 '/seeing-single-cell/data/...' 正确

【GitHub Pages 配置】
仓库: https://github.com/weiyouzi321/seeing-single-cell
分支: master (或 gh-pages)
Source: Deploy from a branch → / (root)

【部署命令】
$ cd ~/seeing-single-cell
$ git add out/
$ git commit -m "Deploy: fix basePath for GitHub Pages subdirectory"
$ git push origin master

【访问地址】
https://weiyouzi321.github.io/seeing-single-cell/

【注意事项】
⚠️  如有 404，检查：
  1. GitHub Pages 源分支是 master（不是 main）
  2. 仓库设置中路径是 / (root)，不是 /docs
  3. out/ 目录已提交（不是 .gitignore 忽略）
  4. 等待构建完成（1-2分钟）

============================================================
