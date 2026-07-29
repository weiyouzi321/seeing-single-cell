'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
import RCode from '@/components/ui/RCode'

interface PCAData {
  metadata: { n_cells: number; n_genes: number; n_components: number; description: string }
  variance_ratio: number[]
  evals: number[]
  cell_types: string[]
}

const PCA_R_CODE = `
# 基于高变基因运行 PCA
pbmc <- RunPCA(pbmc, features = VariableFeatures(object = pbmc))

# 查看 PCA 方差解释比例（Elbow Plot）
ElbowPlot(pbmc)

# 基于前 10 个主成分运行 UMAP
pbmc <- RunUMAP(pbmc, dims = 1:10)

# 查看 PCA 贡献最大的基因
PBMC_top_genes <- DimLoadings(pbmc, dims = 1:10)
head(PBMC_top_genes[, 1:10], 5)`

export default function SeuratPCA() {
  const { lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<PCAData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_BASE_PATH ? `${process.env.NEXT_PUBLIC_BASE_PATH}/data/pbmc_pca.json` : '/data/pbmc_pca.json')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-medium opacity-80 mb-2">
            {isZh ? 'Seurat 经典教程 · 第 4 章' : 'Seurat Tutorial · Chapter 4'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? 'PCA 降维' : 'Principal Component Analysis'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {isZh
              ? 'PCA 将 2000 个高变基因压缩为几十个主成分，每个主成分代表了细胞间的一种主要变异模式。'
              : 'PCA compresses 2000 HVGs into dozens of principal components, each representing a major axis of cell-to-cell variation.'}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? 'PCA 原理' : 'PCA Principles'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'PCA 是一种线性降维方法。它找到数据中方差最大的方向（第一主成分），然后找与第一主成分正交且方差第二大的方向（第二主成分），以此类推。每个主成分由原始基因表达量的线性组合构成。'
              : 'PCA is a linear dimensionality reduction method. It finds the direction of maximum variance (PC1), then the orthogonal direction of second-highest variance (PC2), and so on. Each PC is a linear combination of the original gene expression values.'}
          </p>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 mb-6">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">
              {isZh ? 'PCA 数学公式' : 'PCA Mathematics'}
            </h3>
            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 mb-2">
              {isZh ? 'PC_k = Σ (gene_i × weight_i,k)' : 'PC_k = Σ (gene_i × weight_i,k)'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {isZh ? '每个细胞在第 k 个主成分上的得分 = 所有基因表达量 × 对应权重的加权和' : 'Each cell score on PC_k = weighted sum of all gene expression values'}
            </p>
          </div>

          <RCode code={PCA_R_CODE.trim()} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? 'Elbow Plot — 选择主成分数' : 'Elbow Plot — Selecting Number of PCs'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'Elbow Plot 展示了每个主成分的方差解释比例。拐点（Elbow）之后的主成分通常只包含技术噪音。Seurat 默认选 10-30 个主成分用于下游分析。'
              : 'Elbow plot shows the variance explained by each PC. PCs after the elbow typically contain only technical noise. Seurat defaults to 10-30 PCs for downstream analysis.'}
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : data ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden mb-6">
              <div className="bg-gray-100 dark:bg-slate-800 px-6 py-3 border-b">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {isZh ? '前 10 个主成分方差解释比例' : 'Variance Explained (Top 10 PCs)'}
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {data.variance_ratio.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-8 text-xs font-mono text-gray-500">PC{i + 1}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${Math.min(v * 200, 100)}%` }}
                        ></div>
                      </div>
                      <span className="w-14 text-right text-sm font-mono text-emerald-600">{(v * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  {isZh ? '前 10 个主成分共解释了约 ' + (data.variance_ratio.reduce((a, b) => a + b, 0) * 100).toFixed(0) + '% 的总方差' : 'Top 10 PCs explain ~' + (data.variance_ratio.reduce((a, b) => a + b, 0) * 100).toFixed(0) + '% of total variance'}
                </p>
              </div>
            </div>
          ) : null}

        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '主成分生物学意义' : 'Biological Meaning of PCs'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? '每个主成分由贡献最大的基因定义。通过查看 DimLoadings，可以解释每个主成分的生物学意义。例如，PC1 可能主要反映 T 细胞 vs 非 T 细胞的差异。'
              : 'Each PC is defined by its top contributing genes. By examining DimLoadings, we can interpret the biological meaning of each PC. For example, PC1 might primarily reflect T cells vs non-T cells.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { pc: 'PC1', cn: 'T 细胞 vs 非 T 细胞', en: 'T cells vs non-T cells', genes: 'CD3D, CD3E, IL7R' },
              { pc: 'PC2', cn: '单核细胞 vs 其他', en: 'Monocytes vs others', genes: 'LYZ, S100A9, CD14' },
              { pc: 'PC3', cn: 'B 细胞 vs 其他', en: 'B cells vs others', genes: 'CD79A, MS4A1' },
              { pc: 'PC4', cn: 'NK 细胞标记', en: 'NK cell markers', genes: 'NKG7, GNLY' },
            ].map((p) => (
              <div key={p.pc} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-emerald-600">{p.pc}</span>
                  <span className="text-sm text-gray-600 dark:text-slate-300">{isZh ? p.cn : p.en}</span>
                </div>
                <p className="text-xs font-mono text-gray-400">{isZh ? '标志基因' : 'Top genes'}: <span className="text-emerald-600">{p.genes}</span></p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-between items-center py-8 border-t border-gray-100 dark:border-slate-800">
          <Link href="/seurat/pbmc/normalize" className="text-gray-400 hover:text-emerald-600 transition-colors">
            ← {isZh ? '上一章：标准化' : 'Prev: Normalization'}
          </Link>
          <Link href="/seurat/pbmc/clustering" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            {isZh ? '下一章：聚类 →' : 'Next: Clustering →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
