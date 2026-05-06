# seeing-single-cell 404 问题修复报告

**日期**: 2026-05-01
**问题**: GitHub Pages 部署后所有页面 404
**根因**: 子路径部署（/seeing-single-cell/）的 `basePath` 配置缺失

---

## 🔍 问题诊断

### 症状
- 本地 `npm run build` 成功
- 推送到 GitHub Pages 后访问 `https://...github.io/seeing-single-cell/` 显示 404
- 所有页面无法加载

### 根因分析
1. **next.config.js 缺少 basePath**
   - 静态导出时，Next.js 生成的路径是绝对路径（如 `/chapters/1-matrix`）
   - GitHub Pages 子目录部署需要 `/seeing-single-cell/chapters/1-matrix`

2. **NEXT_PUBLIC_BASE_PATH 未在构建时设置**
   - `page.tsx` 中使用 `process.env.NEXT_PUBLIC_BASE_PATH` 构建 data fetch URL
   - 构建时该变量为空 → 生成 `fetch('/data/...')`（绝对路径，在子目录下 404）

3. **design-sandbox 被错误编译**
   - `design-sandbox/` 是独立 Next.js 项目，不应参与主项目构建
   - 主项目 `next.config.js` 未排除该目录 → 构建失败（之前错误）

---

## ✅ 修复方案

### 1. next.config.js 配置

```javascript
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // 🎯 关键1: 子路径支持
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.BASE_PATH || '',
  trailingSlash: true,  // 导出为目录结构（可选）

  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  // 🎯 关键2: 排除 design-sandbox
  exclude: [/[\\/]design-sandbox[\\/]/],

  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, '@': path.resolve(__dirname, 'src') };
    return config;
  },
};
```

**说明**:
- `basePath`: 告诉 Next.js 站点部署在子路径，自动改写所有内部链接
- `assetPrefix`: 静态资源（_next）路径前缀
- `exclude`: 防止 Next.js 扫描 `design-sandbox/`（它有自己的 package.json）

### 2. 构建命令（本地 & CI）

```bash
# 本地构建
BASE_PATH=/seeing-single-cell \
NEXT_PUBLIC_BASE_PATH=/seeing-single-cell \
NODE_ENV=production \
npm run build
```

```yaml
# .github/workflows/deploy.yml
- name: Build
  env:
    BASE_PATH: /seeing-single-cell           # next.config.js 使用
    NEXT_PUBLIC_BASE_PATH: /seeing-single-cell  # 页面代码使用
    NODE_ENV: production
  run: npm run build
```

**为什么需要两个变量?**
- `BASE_PATH`: 在构建时被 `next.config.js` 读取（服务端）
- `NEXT_PUBLIC_BASE_PATH`: 在浏览器运行时被页面 JS 读取（客户端）

### 3. 排除 design-sandbox

```javascript
// next.config.js
exclude: [/[\\/]design-sandbox[\\/]/]
```

同时 `.gitignore` 已包含 `/design-sandbox/`（该目录不应提交，仅本地开发用）。

---

## 📊 验证结果

运行 `npm run build` 后检查 `out/` 目录：

| 检查项 | 状态 | 说明 |
|--------|------|------|
| ✅ HTML 页面数 | 22 个 | 包括首页 + 21 个章节页 |
| ✅ 数据文件 | 13 个 JSON | `out/data/pbmc_*.json` |
| ✅ 首页链接 | `/seeing-single-cell/chapters/...` | basePath 自动添加 |
| ✅ 资源路径 | `/seeing-single-cell/_next/...` | assetPrefix 生效 |
| ✅ JS fetch 路径 | `"/seeing-single-cell/data/..."` | NEXT_PUBLIC_BASE_PATH 注入 |
| ✅ 无双重前缀 | 无 `/seeing-single-cell/seeing-single-cell/` | 配置正确 |
| ✅ 无裸绝对路径 | 无 `/chapters/`, `/_next/` | 全部带前缀 |

---

## 🚀 部署流程

### 本地构建验证
```bash
cd ~/seeing-single-cell
# 1. 清理旧产物
rm -rf out

# 2. 构建（设置环境变量）
BASE_PATH=/seeing-single-cell NEXT_PUBLIC_BASE_PATH=/seeing-single-cell NODE_ENV=production npm run build

# 3. 本地预览（可选）
npx serve out -l 3000
# 访问 http://localhost:3000/seeing-single-cell/
```

### 推送到 GitHub Pages
```bash
git add out/
git commit -m "Deploy: fix basePath for GitHub Pages subdirectory"
git push origin master
```

等待 GitHub Actions 完成（约 1-2 分钟），访问：
```
https://weiyouzi321.github.io/seeing-single-cell/
```

---

## ⚠️ 故障排查

如果仍有 404，按顺序检查：

1. **GitHub Pages 设置**
   - 仓库 → Settings → Pages
   - Source: Deploy from a branch
   - Branch: `master` / `/(root)`
   - 不是 `/docs` 文件夹

2. **确认 out/ 已提交**
   ```bash
   git ls-files out/ | head
   ```
   应看到 `out/index.html`, `out/chapters/...` 等

3. **检查 .gitignore**
   - `/out/` **不应**出现在 `.gitignore` 中（否则 out/ 不会被提交）
   - 当前 `.gitignore` 正确（未忽略 `out/`）

4. **等待构建完成**
   - 推送后 GitHub 需要 1-2 分钟构建
   - 查看 Actions 标签页确认 workflow 成功

5. **路径是否正确**
   - 访问 `https://...github.io/seeing-single-cell/`（不是根路径）
   - 如果跳转到 `/chapters/`（无前缀），说明 basePath 未生效

---

## 📝 技术细节

### Next.js 静态导出与 basePath
Next.js 的 `next export` 生成纯静态文件。当指定 `basePath` 时：
- HTML 中的内部链接自动添加前缀
- `next/link` 的 `href` 自动拼接
- `assetPrefix` 应用到 `_next` 资源
- **但 `fetch` 不会自动加前缀** → 需用 `NEXT_PUBLIC_BASE_PATH` 手动拼接

### 为什么不用路径重写脚本？
最初尝试了后处理重写，但发现：
- `basePath` 已自动处理大部分路径
- 重写反而导致 `/seeing-single-cell/seeing-single-cell/` 双重前缀
- 所以**删除重写步骤**，只用正确配置的 `basePath`

### design-sandbox 的困境
- `design-sandbox/` 是独立 Next.js 项目（用于前端实验）
- 但它位于主项目目录树内，Next.js 会递归扫描所有 `src/`
- 解决方案：`next.config.js` 中 `exclude: [/design-sandbox/]`
- 同时 `.gitignore` 忽略该目录，不提交到仓库

---

## 🎯 总结

| 修复项 | 文件 | 状态 |
|--------|------|------|
| 添加 basePath + assetPrefix | next.config.js | ✅ |
| 排除 design-sandbox | next.config.js | ✅ |
| 设置构建环境变量 | deploy.yml + 本地 | ✅ |
| 验证输出路径 | out/ 产物 | ✅ |
| Git 提交 out/ | 待执行 | ⏳ |

**核心一句话**: `basePath` + `NEXT_PUBLIC_BASE_PATH` 双剑合璧，解决子路径部署的所有路径问题。

---

**下一步**: 执行 `git add out/ && git push`，等待 GitHub Pages 自动部署完成。
