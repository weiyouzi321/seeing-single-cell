'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
import RCode from '@/components/ui/RCode'

/**
 * Seurat PBMC 3K — Chapter 1: 数据加载
 * Covers CreateSeuratObject, assay, expression matrix structure.
 */

interface RawData {
  metadata: { source: string; cells: number; genes: number; description: string }
  gene_names: string[]
  cell_barcodes: string[]
  cell_types: string[]
  expression_matrix: number[][]
}

const LOAD_R_CODE = `
# Seurat 经典 PBMC 3K 教程
# https://satijalab.org/seurat/articles/pbmc3k_tutorial.html

library(Seurat)

# 加载 10x Genomics 生成的 CellRanger 表达矩阵
data.dir <- "data"
pbmc.data <- Read10X(data.dir = file.path(data.dir, "pbmc3k_final"))

# 创建 Seurat 对象
pbmc <- CreateSeuratObject(
  counts = pbmc.data,
  project = "pbmc3k",
  min.cells = 3,
  min.features = 200
)

# 查看 Seurat 对象基本信息
pbmc
pbmc[["integrated"]]@data  # 标准化的表达矩阵
pbmc[["integrated"]]@counts # 原始计数矩阵`

export default function SeuratLoad() {
  const { lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<RawData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const r = await fetch(`${basePath}/data/pbmc_data_small.json`)
        const j = await r.json()
        setData(j)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const cellTypeCounts = useMemo(() => {
    if (!data) return {}
    const c: Record<string, number> = {}
    data.cell_types.forEach((t) => {
      c[t] = (c[t] || 0) + 1
    })
    return Object.entries(c).sort((a, b) => b[1] - a[1])
  }, [data])

  const matrixSnippet = useMemo(() => {
    if (!data) return []
    const { gene_names, cell_barcodes, expression_matrix } = data
    return cell_barcodes.slice(0, 8).map((bc, i) => ({
      barcode: bc,
      type: data.cell_types[i],
      values: gene_names.slice(0, 6).map((gn, j) => expression_matrix[i][j]),
    }))
  }, [data])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-medium opacity-80 mb-2">
            {isZh ? 'Seurat 经典教程 · 第 1 章' : 'Seurat Tutorial · Chapter 1'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? '加载表达矩阵' : 'Loading the Expression Matrix'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {isZh
              ? '从 10x Genomics 的 CellRanger 输出创建 Seurat 对象，这是单细胞分析的第一步。'
              : 'Creating a Seurat object from 10x Genomics CellRanger output — the first step in any scRNA-seq analysis.'}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* What is a Seurat object */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '什么是 Seurat 对象？' : 'What is a Seurat Object?'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'Seurat 对象是 R 中用于存储单细胞数据的标准结构。它包含一个或多个 assay（实验），每个 assay 存储了表达矩阵、细胞元数据、基因元数据以及后续分析产生的降维结果。Seurat 对象可以看作是一个"数据容器 + 分析结果"的封装。'
              : 'A Seurat object is the standard R data structure for single-cell data. It stores one or more assays, each containing an expression matrix, cell metadata, gene metadata, and results from downstream analyses. Think of it as a container that wraps both raw data and analysis results.'}
          </p>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 mb-6">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-3">
              {isZh ? 'Seurat 对象结构' : 'Seurat Object Structure'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">counts</span>
                <p className="text-gray-600 dark:text-slate-300 mt-1">{isZh ? '原始 UMI 计数' : 'Raw UMI counts'}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">data</span>
                <p className="text-gray-600 dark:text-slate-300 mt-1">{isZh ? '标准化后矩阵' : 'Normalized data'}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">scale.data</span>
                <p className="text-gray-600 dark:text-slate-300 mt-1">{isZh ? '缩放后矩阵' : 'Scaled data'}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">meta.data</span>
                <p className="text-gray-600 dark:text-slate-300 mt-1">{isZh ? '细胞元数据' : 'Cell metadata'}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">assays</span>
                <p className="text-gray-600 dark:text-slate-300 mt-1">{isZh ? '实验集合' : 'Assay collection'}</p>
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-lg p-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">reductions</span>
                <p className="text-gray-600 dark:text-slate-300 mt-1">{isZh ? '降维结果' : 'Dimensionality reductions'}</p>
              </div>
            </div>
          </div>

          <RCode code={LOAD_R_CODE.trim()} />
        </section>

        {/* Expression matrix preview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '表达矩阵预览' : 'Expression Matrix Preview'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'Seurat 对象的核心是一个基因 × 细胞矩阵。行是基因（feature），列是细胞（cell）。每个单元格是该细胞中该基因的 UMI 计数。这是 PBMC 3K 数据集的 75×40 子集示例。'
              : 'The core of a Seurat object is a gene × cell matrix. Rows are genes (features), columns are cells. Each cell contains UMI counts for that gene in that cell. Below is a 75×40 subsample of the PBMC 3K dataset.'}
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : data ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                    <th className="px-4 py-2 text-left">{isZh ? '细胞类型' : 'Cell Type'}</th>
                    <th className="px-4 py-2 text-left">{isZh ? 'Cell Barcode' : 'Cell Barcode'}</th>
                    {data.gene_names.slice(0, 6).map((g) => (
                      <th key={g} className="px-4 py-2 text-right">{g}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixSnippet.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'}>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium
                          ${row.type === 'CD4 T' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' :
                            row.type === 'CD8 T' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' :
                            row.type === 'Monocyte' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' :
                            row.type === 'B' ? 'bg-green-100 dark:bg-green-900/30 text-green-700' :
                            row.type === 'NK' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700' :
                            'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-slate-400">{row.barcode.slice(0, 16)}</td>
                      {row.values.map((v, j) => (
                        <td key={j} className="px-4 py-2 text-right text-gray-700 dark:text-slate-300">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span>{isZh ? '共' : 'Total: '} {data?.metadata.cells || '?'} {isZh ? '个细胞' : 'cells'}, {data?.metadata.genes || '?'} {isZh ? '个基因' : 'genes'}</span>
            <span>{isZh ? '· 子集展示 75×40' : '· showing 75×40 subsample'}</span>
          </div>
        </section>

        {/* Cell type composition */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? 'PBMC 3K 细胞组成' : 'PBMC 3K Cell Composition'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'PBMC（外周血单核细胞）包含多个主要细胞群：CD4⁺ T 细胞、CD8⁺ T 细胞、B 细胞、NK 细胞、单核细胞、树突状细胞等。这是 Seurat 教程中最经典的数据集。'
              : 'PBMCs contain multiple major cell populations: CD4⁺ T cells, CD8⁺ T cells, B cells, NK cells, monocytes, dendritic cells, and more. This is the most canonical dataset in Seurat tutorials.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(cellTypeCounts as [string, number][]).map(([type, count]) => (
              <div key={type} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                <div className="text-lg font-bold text-gray-800 dark:text-slate-100">{type}</div>
                <div className="text-2xl font-mono bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  {count}
                </div>
                <div className="text-xs text-gray-400 dark:text-slate-500">{isZh ? '个细胞' : 'cells'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PBMC 细胞类型说明 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? 'PBMC 细胞类型说明' : 'PBMC Cell Types'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'CD4⁺ T', cn: 'CD4⁺ T 细胞', en: 'CD4⁺ T cells', desc: isZh ? '辅助性 T 细胞，协调免疫应答' : 'Helper T cells that coordinate immune responses', gene: 'CD4, CD3D, IL7R', color: 'blue' },
              { name: 'CD8⁺ T', cn: 'CD8⁺ T 细胞', en: 'CD8⁺ T cells', desc: isZh ? '细胞毒性 T 细胞，直接杀伤感染细胞' : 'Cytotoxic T cells that directly kill infected cells', gene: 'CD8A, CD8B, GZMK', color: 'red' },
              { name: 'B', cn: 'B 细胞', en: 'B cells', desc: isZh ? '产生抗体的体液免疫细胞' : 'Humoral immune cells that produce antibodies', gene: 'CD79A, MS4A1, CD79B', color: 'green' },
              { name: 'NK', cn: 'NK 细胞', en: 'NK cells', desc: isZh ? '自然杀伤细胞，先天免疫' : 'Natural killer cells of innate immunity', gene: 'NKG7, GNLY, KLRD1', color: 'purple' },
              { name: 'CD14⁺ Monocytes', cn: '经典单核细胞', en: 'Classical Monocytes', desc: isZh ? '组织驻留或招募的单核细胞' : 'Tissue-resident or recruited monocytes', gene: 'LYZ, S100A9, S100A8', color: 'amber' },
              { name: 'FCGR3A⁺ Monocytes', cn: '非经典单核细胞', en: 'Non-classical Monocytes', desc: isZh ? '巡逻型非经典单核细胞' : 'Patrolling non-classical monocytes', gene: 'FCGR3A, MS4A7, LST1', color: 'orange' },
              { name: 'Dendritic', cn: '树突状细胞', en: 'Dendritic Cells', desc: isZh ? '抗原呈递细胞' : 'Antigen-presenting cells', gene: 'FCER1A, CST3, HLA-DRA', color: 'teal' },
              { name: 'Platelet', cn: '血小板', en: 'Platelets', desc: isZh ? '凝血细胞片段' : 'Clotting cell fragments', gene: 'PF4, PPBP, HEMGN', color: 'gray' },
            ].map((ct) => (
              <div key={ct.name} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full bg-${ct.color}-500`}></span>
                  <span className="font-bold text-gray-800 dark:text-slate-100">{isZh ? ct.cn : ct.en}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">{isZh ? ct.desc : ct.desc}</p>
                <p className="text-xs font-mono text-gray-400 dark:text-slate-500">
                  {isZh ? '标志基因' : 'Marker genes'}: <span className="text-emerald-600 dark:text-emerald-400">{ct.gene}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation */}
        <div className="flex justify-between items-center py-8 border-t border-gray-100 dark:border-slate-800">
          <Link href="/" className="text-gray-400 hover:text-blue-600 transition-colors">
            ← {isZh ? '返回首页' : 'Back to Home'}
          </Link>
          <Link href="/seurat/pbmc/qc" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            {isZh ? '下一章：质控 →' : 'Next: Quality Control →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
