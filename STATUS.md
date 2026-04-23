# Seeing Single-Cell — 项目状态文档
> 最后更新：2026-04-23

---

## 项目概述

交互式单细胞 RNA 测序分析教学网站，基于 Next.js 14 + p5.js + Tailwind CSS。

- **路径**：`~/seeing-single-cell/`
- **GitHub**：`weiyouzi321/seeing-single-cell`
- **部署**：GitHub Pages（静态导出）

---

## 章节完成状态

### Chapter 0：线性代数基础（Prerequisite）
新增章节，Indigo `#6366f1` 主题，独立于主站蓝色 `#4361ee`。

| 子章节 | 路由 | 状态 | 可视化组件 |
|--------|------|------|-----------|
| 0.0 主页 | `/chapters/0-linear-algebra` | ✅ | 导航卡片 |
| 0.1 矩阵视角 | `/chapters/0-linear-algebra/1-matrix-views` | ✅ | MatrixViewsViz（4种视角切换） |
| 0.2 向量乘法 | `/chapters/0-linear-algebra/2-vector-products` | ✅ | VectorProductsViz（点积/外积） |
| 0.3 矩阵×向量 | `/chapters/0-linear-algebra/3-matrix-vector` | ✅ | MatrixVectorViz（行点积/列组合） |
| 0.4 矩阵×矩阵 | `/chapters/0-linear-algebra/4-matrix-matrix` | ✅ | MatrixMultiplicationViz（点击计算） |
| 0.5 实用模式 | `/chapters/0-linear-algebra/5-patterns` | ✅ | PatternsViz（对角/对称/秩-1/单位） |
| 0.6 矩阵分解主页 | `/chapters/0-linear-algebra/6-factorizations` | ✅ | 导航列表 |
| 0.6.1 CR 分解 | `/.../6-factorizations/1-cr` | ✅ | 文字概念页 |
| 0.6.2 LU 分解 | `/.../6-factorizations/2-lu` | ✅ | 文字概念页 |
| 0.6.3 QR 分解 | `/.../6-factorizations/3-qr` | ✅ | 文字概念页 |
| 0.6.4 特征值分解 | `/.../6-factorizations/4-evd` | ✅ | 文字概念页（可接入EigendecompViz） |
| 0.6.5 SVD | `/.../6-factorizations/5-svd` | ✅ | 文字概念页 |

### Chapter 1–6：单细胞分析基础
原章节，蓝色 `#4361ee` 主题，数据驱动可视化。

| 章节 | 路由 | 状态 |
|------|------|------|
| Ch1 矩阵与数据 | `/chapters/1-matrix` | ✅ |
| Ch2 质控与过滤 | `/chapters/2-distribution` | ✅ |
| Ch3 预处理 | `/chapters/3-preprocessing` | ✅ |
| Ch4 PCA | `/chapters/4-pca` | ✅ |
| Ch5 KNN 聚类 | `/chapters/5-knn` | ✅ |
| Ch6 降维可视化 | `/chapters/6-dimred` | ✅ |

---

## 技术配置

### next.config.js（本地开发版）
```js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: '',        // 本地 serve 必须为空
  assetPrefix: '',     // 本地 serve 必须为空
}
```
> ⚠️ 恢复 GitHub Pages 部署时需改回 `basePath: '/seeing-single-cell'`

### 本地开发流程
```bash
# 1. 构建静态导出
cd ~/seeing-single-cell
rm -rf .next out
node node_modules/.bin/next build

# 2. 启动本地服务器
node serve.js
# → http://localhost:3456/
```

---

## 可视化组件清单

### 线性代数组件（新增）
| 组件 | 路径 | 说明 |
|------|------|------|
| MatrixViewsViz | `linear-algebra/MatrixViewsViz.tsx` | 4种矩阵视角 toggle |
| VectorProductsViz | `linear-algebra/VectorProductsViz.tsx` | 点积/外积 toggle |
| PatternsViz | `linear-algebra/PatternsViz.tsx` | 矩阵模式 toggle |
| MatrixVectorViz | `linear-algebra/MatrixVectorViz.tsx` | 矩阵×向量（已有，修复后复用） |
| MatrixMultiplicationViz | `linear-algebra/MatrixMultiplicationViz.tsx` | 矩阵×矩阵（已有，修复后复用） |
| EigendecompViz | `linear-algebra/EigendecompViz.tsx` | 特征值分解（已有，修复后复用） |

### 单细胞组件（原有）
MatrixViz, DistributionViz, QcViz, NormalizationViz, HvgViz, ScaleDataViz, PcaViz, KnnViz, DimRedViz

---

## 已修复的 Bug

### 1. next.config.js basePath 导致资源 404
- **现象**：静态导出后本地 serve，所有页面白屏，JS/CSS 404
- **原因**：`basePath: '/seeing-single-cell'` 仅在 GitHub Pages 子路径部署时需要
- **修复**：本地开发时设为 `''`

### 2. Ch1–Ch6 fetch URL 带 `/seeing-single-cell` 前缀
- **现象**：单细胞章节显示 "failed to load data"
- **原因**：页面内 `basePath = process.env.NODE_ENV === 'production' ? '/seeing-single-cell' : ''`，build 时 NODE_ENV=production 被硬编码
- **修复**：6 个 page.tsx 全部改为空字符串 basePath

### 3. EigendecompViz.tsx 未定义变量
- **行 125**：`j * cSz` 中 `j` 未定义 → 改为固定偏移

### 4. MatrixMultiplicationViz.tsx mousePressed 作用域
- **现象**：点击 C 矩阵元素报错
- **原因**：`mousePressed` 回调引用了 `draw` 函数内部局部变量
- **修复**：在 `mousePressed` 内重新计算所需坐标值

### 5. MatrixVectorViz.tsx 类型与拼写错误
- `p5.Color` TypeScript 类型不匹配 → `as any` 断言
- `new p(sketch)` → `new p5(sketch)`

---

## i18n 结构

```
src/lib/i18n/
├── LangContext.tsx          # 全局语言上下文（localStorage: ssc-lang）
├── translations.json        # Ch1–Ch6 翻译
└── linear-algebra/
    ├── en.json              # Ch0 英文翻译
    └── zh.json              # Ch0 中文翻译
```

Ch0 页面使用独立导入：
```ts
import laEn from '@/lib/i18n/linear-algebra/en.json'
import laZh from '@/lib/i18n/linear-algebra/zh.json'
```

---

## 导航结构

顶部导航栏 `NavLinks.tsx` 有两个下拉菜单：
1. **基础分析** — Ch1–Ch6（蓝色 `#4361ee`）
2. **线性代数** — Ch0（Indigo `#6366f1`）

---

## 待办 / 下一步

### 高优先级
- [ ] **0.6.x 分解子页面接入可视化** — 目前为纯文字，需接入 EigendecompViz 等交互组件
- [ ] **首页添加 Chapter 0 入口** — `/page.tsx` 中目前只有 Ch1–Ch6 卡片

### 中优先级
- [ ] **细节优化** — toggle 交互流畅度、色值微调、文字内容深度
- [ ] **GitHub Pages 部署恢复** — 需改回 `basePath: '/seeing-single-cell'` 后构建

### 低优先级
- [ ] **0.6.4 EVD 页面** — 当前为占位，可完整接入幂迭代动画
- [ ] **0.6.5 SVD 页面** — 可新增 SVD 逐步分解可视化
