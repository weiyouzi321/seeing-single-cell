# Seeing Single-Cell 🧬

**Interactive visualization of single-cell analysis mathematics** — inspired by [3Blue1Brown](https://www.3blue1brown.com/)'s visual-first math education and [Seeing Theory](https://seeing-theory.brown.edu/)'s interactive learning approach.

> 🎯 **Live demo**: [weiyouzi321.github.io/seeing-single-cell](https://weiyouzi321.github.io/seeing-single-cell/)

Seeing Single-Cell bridges the gap between mathematical theory and practical single-cell RNA-seq analysis. Instead of static figures and formulas, students can click on matrix elements to watch PCA computations unfold step by step, drag sliders to see how parameters affect KNN clustering in real time, and build intuition for the algorithms that power modern bioinformatics pipelines.

## ✨ Features

- **🎨 Interactive visualizations** powered by p5.js — click, drag, and explore
- **📐 Step-by-step computation** — watch matrix operations (covariance, eigenvalue decomposition) build up visually
- **📊 Real PBMC 3k data** — 75-cell teaching subset + 300-cell full dataset from 10x Genomics
- **🌐 Bilingual** — full Chinese and English interface
- **🌙 Dark mode** — comfortable viewing day or night
- **📱 Responsive** — works on desktop and mobile
- **🚀 Static export** — zero server cost, deployed via GitHub Pages

## 📚 Chapters

### Linear Algebra Foundation (Ch0)

| Sub-chapter | Topic |
|---|---|
| 0.0 | Linear Algebra Overview |
| 0.1 | Matrix Views — rows, columns, and dimensions |
| 0.2 | Vector Products — dot product, norms |
| 0.3 | Matrix × Vector — linear transformations |
| 0.4 | Matrix × Matrix — composition of transformations |
| 0.5 | Practical Patterns — common matrix operations |
| 0.6 | Factorizations — CR, LU, QR, EVD, SVD |

### Basic Analysis Pipeline

| Chapter | Topic |
|---|---|
| **Ch1** | **Gene Expression Matrix** — cells, genes, and expression values |
| **Ch2** | **Quality Control & Filtering** — histograms, KDE, QC metrics |
| **Ch3** | **Preprocessing Trilogy** — normalization, HVG selection, scaling |
| **Ch4** | **PCA Dimensionality Reduction** — covariance matrix → eigenvalue decomposition → interactive stepping |
| **Ch5** | **KNN Clustering** — distance metrics, neighborhood graphs, cluster assignment |
| **Ch6** | **t-SNE & UMAP Visualization** — non-linear embedding for visual exploration |

### Advanced Analysis

| Chapter | Topic |
|---|---|
| **Ch7** | **Batch Integration** — harmonizing datasets from different experiments |

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | Static site generation & routing |
| **p5.js** (instance mode) | Interactive canvas visualization |
| **D3.js** | Statistical charts (histograms, KDE) |
| **KaTeX** | Mathematical formula rendering |
| **Math.js** | Linear algebra computation |
| **Tailwind CSS** | Styling & responsive design |
| **TypeScript** | Type safety |
| **GitHub Actions** | CI/CD auto-deploy to Pages |

## 📊 Data

All chapters use real **10x Genomics PBMC 3k** (Peripheral Blood Mononuclear Cells) data:

- **Full dataset**: 300 cells × ~2000 highly variable genes
- **Teaching subset**: 75 cells × 40 genes (strict subset of full data, with 7 cell types)
- **Pre-computed results**: PCA, t-SNE, UMAP, KNN graphs, batch-corrected embeddings
- **Data generation**: fully reproducible via `scripts/generate_all_data.js` (seed = 42)
- **Cell types**: CD4 T cells, CD8 T cells, B cells, NK cells, Monocytes, Dendritic cells, Megakaryocytes

## 🚀 Getting Started

```bash
# Prerequisites
node >= 18, npm or yarn

# 1. Clone
git clone https://github.com/weiyouzi321/seeing-single-cell.git
cd seeing-single-cell

# 2. Install
npm install

# 3. Start dev server (http://localhost:3000)
npm run dev

# 4. Build for production (static export)
npm run build

# 5. Preview the build
npx serve out -l 3000
```

> **Note**: For deployment to GitHub Pages, the build uses `BASE_PATH=/seeing-single-cell`. See `.github/workflows/deploy.yml` for the full CI/CD pipeline.

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with ThemeProvider
│   ├── page.tsx            # Landing page
│   └── chapters/           # Chapter pages (0–7)
│       ├── 0-linear-algebra/  # Sub-chapters (1–6)
│       ├── 1-matrix/
│       ├── 2-distribution/
│       ├── 3-preprocessing/
│       ├── 4-pca/
│       ├── 5-knn/
│       ├── 6-dimred/
│       └── 7-integration/
├── components/
│   ├── NavLinks.tsx        # Navigation with chapter dropdown
│   ├── LangSwitcher.tsx    # ZH/EN toggle
│   ├── ThemeToggle.tsx     # Dark/light mode
│   └── visualizations/     # p5.js interactive components
├── lib/
│   ├── i18n/               # Internationalization
│   └── math.ts             # Helper functions
└── types/
```

## 🎨 Design Philosophy

- **Progressive disclosure**: Start from linear algebra fundamentals, build up to real analysis pipelines
- **Interactive first**: Every concept has a visual component you can manipulate
- **Real data**: No toy examples — all visualizations use genuine PBMC 3k data
- **Reproducible**: Data generation scripts let you verify and extend the dataset
- **Bilingual**: Lowering language barriers for Chinese-speaking students in computational biology

## 📖 Inspiration

- [3Blue1Brown](https://www.3blue1brown.com/) — Essence of linear algebra & calculus series
- [Seeing Theory](https://seeing-theory.brown.edu/) — Interactive probability & statistics
- [Seurat](https://satijalab.org/seurat/) — Single-cell analysis toolkit
- [Scanpy](https://scanpy.readthedocs.io/) — Single-cell analysis in Python

## 📄 License

MIT License — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

Built with ❤️ for the single-cell biology community. Special thanks to the Brown University STATS4STEM program and the 3Blue1Brown team for the inspiration.
