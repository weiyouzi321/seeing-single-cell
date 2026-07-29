'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'

const chapters = [
  {
    number: '01',
    titleZh: '数据加载',
    titleEn: 'Loading Data',
    descZh: '从 10x Genomics 输出创建 Seurat 对象，了解 Seurat 数据结构。',
    descEn: 'Create a Seurat object from 10x Genomics output.',
    keywords: ['CreateSeuratObject', 'Read10X', 'Assay'],
    href: '/seurat/pbmc/load',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    number: '02',
    titleZh: '质控与过滤',
    titleEn: 'Quality Control',
    descZh: '基于 nCount、nFeature 和线粒体比例过滤低质量细胞。',
    descEn: 'Filter low-quality cells based on nCount, nFeature, and mitochondrial percentage.',
    keywords: ['nCount', 'nFeature', 'percent.mt'],
    href: '/seurat/pbmc/qc',
    color: 'from-red-500 to-rose-500',
  },
  {
    number: '03',
    titleZh: '标准化与高变基因',
    titleEn: 'Normalization & HVG',
    descZh: 'LogNormalize 标准化、VST 筛选 2000 个高变基因、ScaleData 缩放。',
    descEn: 'LogNormalize, VST-based HVG selection, and ScaleData.',
    keywords: ['NormalizeData', 'FindVariableFeatures', 'ScaleData'],
    href: '/seurat/pbmc/normalize',
    color: 'from-amber-500 to-orange-500',
  },
  {
    number: '04',
    titleZh: 'PCA 降维',
    titleEn: 'PCA',
    descZh: '将 2000 个高变基因压缩为几十个主成分，选择下游分析的主成分数。',
    descEn: 'Reduce 2000 HVGs into principal components.',
    keywords: ['RunPCA', 'ElbowPlot', 'DimLoadings'],
    href: '/seurat/pbmc/pca',
    color: 'from-purple-500 to-violet-500',
  },
  {
    number: '05',
    titleZh: 'KNN 聚类与 UMAP',
    titleEn: 'Clustering & UMAP',
    descZh: '构建 KNN 图，Louvain 聚类检测细胞社区，UMAP/t-SNE 二维可视化。',
    descEn: 'Build KNN graph, Louvain clustering, and UMAP/t-SNE visualization.',
    keywords: ['FindNeighbors', 'FindClusters', 'RunUMAP'],
    href: '/seurat/pbmc/clustering',
    color: 'from-pink-500 to-rose-500',
  },
  {
    number: '06',
    titleZh: '差异表达与细胞注释',
    titleEn: 'Markers & Annotation',
    descZh: '寻找每个簇的差异表达基因，通过标志基因完成细胞类型注释。',
    descEn: 'Find DEGs per cluster and annotate cell types with markers.',
    keywords: ['FindAllMarkers', 'FeaturePlot', 'DotPlot'],
    href: '/seurat/pbmc/markers',
    color: 'from-cyan-500 to-sky-500',
  },
]

export default function SeuratHome() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  const subtitle = isZh
    ? '完整翻译 Seurat 官方经典 PBMC 3K 教程，从零到一掌握单细胞 RNA-seq 数据分析标准流程。包含 R 代码、可视化图表和中文讲解。'
    : 'A complete translation of the canonical PBMC 3K tutorial. Master the scRNA-seq analysis pipeline from scratch.'

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-sm font-semibold tracking-widest uppercase opacity-80 mb-4">
            {isZh ? 'Seurat 单细胞分析经典教程' : 'Seurat scRNA-seq Classic Tutorial'}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            {isZh ? 'PBMC 3K 中文教程' : 'PBMC 3K Tutorial (Chinese)'}
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed mb-8">
            {subtitle}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/seurat/pbmc/load" className="px-6 py-3 rounded-xl bg-white text-emerald-700 font-semibold hover:bg-gray-100 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              {isZh ? '开始学习' : 'Start Learning'}
            </Link>
            <a
              href="https://satijalab.org/seurat/articles/pbmc3k_tutorial.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl border-2 border-white/50 text-white font-semibold hover:bg-white/10 transition-all"
            >
              {isZh ? '原文 (Seurat)' : 'Original (Seurat)'}
            </a>
          </div>
        </div>
      </header>

      <section className="py-12 bg-gray-50 dark:bg-slate-800/50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 dark:text-slate-500 mb-4">
            {isZh ? '关于 PBMC 3K 数据集' : 'About the PBMC 3K Dataset'}
          </h2>
          <p className="text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {isZh
              ? 'PBMC 3K 是 10x Genomics 公开的经典单细胞数据集，包含来自一名健康志愿者的 2700 个外周血单核细胞，涵盖 CD4 T 细胞、CD8 T 细胞、B 细胞、NK 细胞、单核细胞、树突状细胞等多种细胞类型。这是单细胞分析教学中最广泛使用的基准数据集。'
              : 'PBMC 3K is a canonical 10x Genomics dataset containing 2700 peripheral blood mononuclear cells from a healthy volunteer, spanning CD4+ T cells, CD8+ T cells, B cells, NK cells, monocytes, dendritic cells, and more. This is the most widely used benchmark dataset in single-cell tutorials.'}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 dark:text-slate-500 mb-8 text-center">
            {isZh ? '教程章节' : 'Tutorial Chapters'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((ch) => (
              <Link
                key={ch.number}
                href={ch.href}
                className="group block p-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-gray-200 dark:hover:border-slate-600 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${ch.color} text-white text-xs font-bold`}>
                    {isZh ? ('第' + ch.number + '章') : ('Ch ' + ch.number)}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600 transition-colors">
                  {isZh ? ch.titleZh : ch.titleEn}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {isZh ? ch.descZh : ch.descEn}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ch.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs font-mono text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-gray-100 dark:border-slate-800 text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
          {isZh ? '返回首页' : 'Back to Seeing Single-Cell Home'}
        </Link>
      </footer>
    </div>
  )
}
