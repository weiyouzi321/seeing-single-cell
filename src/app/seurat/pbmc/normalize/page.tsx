'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
import RCode from '@/components/ui/RCode'

const NORMALIZE_R_CODE = `
# 标准化：对数标准化
pbmc <- NormalizeData(pbmc, normalization.method = "LogNormalize", scale.factor = 10000)

# 寻找高变基因（前 2000 个）
pbmc <- FindVariableFeatures(pbmc, selection.method = "vst", nfeatures = 2000)

# 可视化高变基因
VariableFeaturePlot(pbmc)

# 缩放表达矩阵
pbmc <- ScaleData(pbmc)

# 可选：回归掉线粒体比例和 UMI 数的影响
pbmc <- ScaleData(pbmc, vars.to.regress = c("percent.mt", "nCount_RNA"))`

const PCA_R_CODE = `
# 运行 PCA（基于高变基因）
pbmc <- RunPCA(pbmc, features = VariableFeatures(object = pbmc))

# 查看方差解释比例
ElbowPlot(pbmc)

# 基于方差选择主成分（通常选前 10-30 个）
pbmc <- RunUMAP(pbmc, dims = 1:10)
pbmc <- RunTSNE(pbmc, dims = 1:10)`

export default function SeuratNormalize() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-medium opacity-80 mb-2">
            {isZh ? 'Seurat 经典教程 · 第 3 章' : 'Seurat Tutorial · Chapter 3'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? '标准化与高变基因' : 'Normalization & HVG Selection'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {isZh
              ? '消除测序深度差异，筛选出在细胞间表达差异最大的基因用于下游分析。'
              : 'Remove sequencing depth differences, select genes with the highest expression variation across cells for downstream analysis.'}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '1. 标准化 — NormalizeData' : '1. Normalization'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
            {isZh
              ? '每个细胞的总 UMI 数不同（测序深度差异），直接比较原始计数会有偏差。Seurat 使用 LogNormalize 方法：先将每个细胞的计数除以总计数再乘以 10000，然后进行 log1p 变换。'
              : 'Each cell has a different total UMI count (sequencing depth variation). Raw counts cannot be directly compared. Seurat uses LogNormalize: divide by total, multiply by 10000, then log1p transform.'}
          </p>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 mb-6">
            <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
              {isZh ? 'log(T_i / T_total × 10000) + 1' : 'log(T_i / T_total × 10000) + 1'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{isZh ? 'T_i = 基因 i 的原始 UMI 数，T_total = 细胞总 UMI 数' : 'T_i = raw UMI count for gene i, T_total = total UMI count for the cell'}</p>
          </div>

          <RCode code={NORMALIZE_R_CODE.trim()} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '2. 高变基因筛选 — FindVariableFeatures' : '2. Highly Variable Gene Selection'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? '不是所有基因都有助于区分细胞类型。技术噪音（如高表达的管家基因）会干扰分析。Seurat 使用 variance stabilizing transformation (VST) 方法，在全局表达水平校正后选择表达变异性最高的前 2000 个基因。'
              : 'Not all genes help distinguish cell types. Technical noise (e.g., highly expressed housekeeping genes) interferes with analysis. Seurat uses variance stabilizing transformation (VST) to select the top 2000 genes with the highest expression variability after global expression correction.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">{isZh ? '为什么选高变基因？' : 'Why Highly Variable Genes?'}</h3>
              <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-2">
                <li>{isZh ? '• 高变基因携带最多的生物学信号' : '• HVGs carry the most biological signal'}</li>
                <li>{isZh ? '• 减少计算复杂度（20000 → 2000）' : '• Reduces computational complexity (20000 → 2000)'}</li>
                <li>{isZh ? '• 去除技术噪音的影响' : '• Removes technical noise'}</li>
                <li>{isZh ? '• 提高 PCA 和聚类的准确性' : '• Improves PCA and clustering accuracy'}</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">{isZh ? 'VST 方法原理' : 'VST Method'}</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                {isZh
                  ? '对每个基因拟合 mean-variance 关系曲线，识别出方差显著高于技术噪音水平的基因。'
                  : 'Fits a mean-variance relationship curve for each gene, identifying genes whose variance is significantly above the technical noise floor.'}
              </p>
              <p className="text-xs font-mono text-gray-400 dark:text-slate-500">
                {isZh ? 'nfeatures = 2000（默认）' : 'nfeatures = 2000 (default)'}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '3. 缩放 — ScaleData' : '3. Scaling'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? '缩放将每个基因的表达值转换为均值为 0、方差为 1 的标准正态分布（Z-score）。这样可以消除高表达基因的数值优势，确保 PCA 等降维方法对每个基因的贡献权重一致。同时可以回归掉线粒体比例等批次效应。'
              : 'Scaling converts each gene to a mean of 0 and variance of 1 (Z-score). This removes the numerical advantage of highly expressed genes, ensuring equal contribution in downstream dimensionality reduction. Can also regress out batch effects like mitochondrial percentage.'}
          </p>

          <RCode code={`
# Z-score 标准化公式
pbmc <- ScaleData(pbmc, vars.to.regress = c("percent.mt", "nCount_RNA"))

# 缩放公式：
# z = (x - mean) / sd`} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '预处理三步总结' : 'Preprocessing Summary'}
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="bg-gray-100 dark:bg-slate-800 px-6 py-3 border-b border-gray-100 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                {isZh ? '标准预处理流程' : 'Standard Preprocessing Pipeline'}
              </span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">1</div>
                  <h4 className="font-semibold mb-1">{isZh ? '标准化' : 'NormalizeData'}</h4>
                  <p className="text-xs text-gray-500">{isZh ? '消除测序深度差异' : 'Remove sequencing depth bias'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">2</div>
                  <h4 className="font-semibold mb-1">{isZh ? '高变基因' : 'FindVariableFeatures'}</h4>
                  <p className="text-xs text-gray-500">{isZh ? '筛选 2000 个信息量最高的基因' : 'Select top 2000 informative genes'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">3</div>
                  <h4 className="font-semibold mb-1">{isZh ? '缩放' : 'ScaleData'}</h4>
                  <p className="text-xs text-gray-500">{isZh ? 'Z-score + 回归批次效应' : 'Z-score + regress batch effects'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-between items-center py-8 border-t border-gray-100 dark:border-slate-800">
          <Link href="/seurat/pbmc/qc" className="text-gray-400 hover:text-emerald-600 transition-colors">
            ← {isZh ? '上一章：质控' : 'Prev: QC'}
          </Link>
          <Link href="/seurat/pbmc/pca" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            {isZh ? '下一章：PCA 降维 →' : 'Next: PCA →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
