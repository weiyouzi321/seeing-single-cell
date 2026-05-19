# Seeing Single-Cell 🧬

**单细胞转录组学分析的交互式可视化教学平台** — 灵感来源于 [3Blue1Brown](https://www.3blue1brown.com/) 的数学可视化理念和 [Seeing Theory](https://seeing-theory.brown.edu/)（Brown 大学）的可交互学习方式。

> 🎯 **在线演示**: [weiyouzi321.github.io/seeing-single-cell](https://weiyouzi321.github.io/seeing-single-cell/)

Seeing Single-Cell 旨在桥接数学理论与单细胞 RNA-seq 实际分析之间的断层。不同于静态的插图和公式，学生可以点击矩阵元素观察 PCA 计算的每一步过程，拖动滑块实时查看 KNN 聚类参数对结果的影响，在实践中建立对生物信息学核心算法的直觉理解。

## ✨ 功能特点

- **🎨 交互式可视化** — 基于 p5.js，可点击、拖拽、实时探索
- **📐 逐步计算演示** — 矩阵运算（协方差、特征值分解）可视化构建过程
- **📊 真实 PBMC 3k 数据** — 75细胞教学子集 + 300细胞完整数据集，来自 10x Genomics
- **🌐 中英双语** — 完整的中文和英文界面
- **🌙 暗色模式** — 日间和夜间舒适阅读
- **📱 响应式设计** — 桌面端和移动端均可使用
- **🚀 静态导出** — 零服务器成本，通过 GitHub Pages 部署

## 📚 章节概览

### 线性代数基础（第0章）

| 子章节 | 主题 |
|---|---|
| 0.0 | 线性代数导览 |
| 0.1 | 矩阵视角 — 行、列与维度 |
| 0.2 | 向量乘法 — 点积、范数 |
| 0.3 | 矩阵 × 向量 — 线性变换 |
| 0.4 | 矩阵 × 矩阵 — 变换的复合 |
| 0.5 | 实用模式 — 常见矩阵操作 |
| 0.6 | 矩阵分解 — CR、LU、QR、EVD、SVD |

### 基础分析管线

| 章节 | 主题 |
|---|---|
| **第1章** | **基因表达矩阵** — 细胞、基因与表达值 |
| **第2章** | **质控与过滤** — 直方图、核密度估计、质控指标 |
| **第3章** | **预处理三部曲** — 标准化、高变基因筛选、数据缩放 |
| **第4章** | **PCA 降维** — 协方差矩阵 → 特征值分解 → 交互式步进演示 |
| **第5章** | **KNN 聚类** — 距离度量、邻域图、聚类分配 |
| **第6章** | **t-SNE & UMAP 可视化** — 非线性嵌入的视觉探索 |

### 高级分析

| 章节 | 主题 |
|---|---|
| **第7章** | **批次整合** — 融合不同实验来源的数据集 |

## 🛠️ 技术栈

| 技术 | 用途 |
|---|---|
| **Next.js 14**（App Router） | 静态站点生成与路由 |
| **p5.js**（实例模式） | 交互式画布可视化 |
| **D3.js** | 统计图表（直方图、KDE） |
| **KaTeX** | 数学公式渲染 |
| **Math.js** | 线性代数计算 |
| **Tailwind CSS** | 样式与响应式设计 |
| **TypeScript** | 类型安全 |
| **GitHub Actions** | CI/CD 自动部署到 Pages |

## 📊 数据来源

所有章节均使用真实的 **10x Genomics PBMC 3k**（外周血单个核细胞）数据：

- **完整数据集**: 300 细胞 × ~2000 个高变基因
- **教学子集**: 75 细胞 × 40 基因（严格从完整数据中抽取，含 7 种细胞类型）
- **预计算结果**: PCA、t-SNE、UMAP、KNN 图、批次校正向量
- **数据生成**: 完全可复现，见 `scripts/generate_all_data.js`（随机种子 = 42）
- **细胞类型**: CD4 T 细胞、CD8 T 细胞、B 细胞、NK 细胞、单核细胞、树突状细胞、巨核细胞

## 🚀 快速开始

```bash
# 前置要求
node >= 18, npm 或 yarn

# 1. 克隆仓库
git clone https://github.com/weiyouzi321/seeing-single-cell.git
cd seeing-single-cell

# 2. 安装依赖
npm install

# 3. 启动开发服务器 (http://localhost:3000)
npm run dev

# 4. 生产构建（静态导出）
npm run build

# 5. 预览构建结果
npx serve out -l 3000
```

> **注意**: 部署到 GitHub Pages 时，构建使用 `BASE_PATH=/seeing-single-cell`。完整的 CI/CD 流水线见 `.github/workflows/deploy.yml`。

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 根布局（含 ThemeProvider）
│   ├── page.tsx            # 首页
│   └── chapters/           # 章节页面（0–7）
│       ├── 0-linear-algebra/  # 子章节（1–6）
│       ├── 1-matrix/
│       ├── 2-distribution/
│       ├── 3-preprocessing/
│       ├── 4-pca/
│       ├── 5-knn/
│       ├── 6-dimred/
│       └── 7-integration/
├── components/
│   ├── NavLinks.tsx        # 导航栏（章节下拉菜单）
│   ├── LangSwitcher.tsx    # 中/英切换
│   ├── ThemeToggle.tsx     # 暗/亮模式
│   └── visualizations/     # p5.js 交互式可视化组件
├── lib/
│   ├── i18n/               # 国际化
│   └── math.ts             # 辅助函数
└── types/
```

## 🎨 设计理念

- **渐进式展开**: 从线性代数基础入手，逐步深入到实际分析管线
- **交互优先**: 每个概念都有可以动手操作的视觉组件
- **真实数据**: 不使用合成示例，所有可视化基于真实的 PBMC 3k 数据
- **可复现**: 数据生成脚本让您可以验证和扩展数据集
- **双语支持**: 降低中文背景学生进入计算生物学的语言门槛

## 📖 灵感来源

- [3Blue1Brown](https://www.3blue1brown.com/) — 线性代数本质与微积分系列
- [Seeing Theory](https://seeing-theory.brown.edu/) — 交互式概率与统计
- [Seurat](https://satijalab.org/seurat/) — 单细胞分析工具包
- [Scanpy](https://scanpy.readthedocs.io/) — Python 单细胞分析框架

## 📄 许可证

MIT 许可证 — 详见 [LICENSE](LICENSE)。

## 🙏 致谢

为单细胞生物学社区用心打造。特别感谢 Brown University STATS4STEM 项目和 3Blue1Brown 团队的启发。
