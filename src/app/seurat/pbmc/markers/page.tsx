'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
import RCode from '@/components/ui/RCode'

interface DegData {
  metadata: { dataset: string; n_genes: number; comparison_groups: number; method: string }
  top_markers: Record<string, string[]>
  results: Array<{
    gene: string
    log2FC: number
    pval: number
    padj: number
    pct_expressed_A: number
    pct_expressed_B: number
    mean_A: number
    mean_B: number
  }>
}

const MARKERS_R_CODE = `
# 为每个细胞类型寻找差异表达基因
pbmc <- FindAllMarkers(pbmc)

# 查看 CD4 T 细胞的 Top 标志基因
pbmc.markers <- pbmc\$ FindAllMarkers(pbmc)
head(pbmc.markers[pbmc.markers\$cluster == "CD4 T",])

# 可视化标志基因在 UMAP 上的表达
FeaturePlot(pbmc, features = c("CD3D", "CD4", "CD8A", "CD79A", "NKG7"))

# DotPlot 可视化（大小 = 表达比例，颜色 = 表达量）
DotPlot(pbmc, features = pbmc.markers\$gene[1:10]) + RotatedAxis()

# 小提琴图比较基因在不同簇间的表达
VlnPlot(pbmc, features = c("CD3D", "CD4", "CD8A", "CD79A"))`

export default function SeuratMarkers() {
  const { lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<DegData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_BASE_PATH ? `${process.env.NEXT_PUBLIC_BASE_PATH}/data/pbmc_deg.json` : '/data/pbmc_deg.json')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const markerGenes = data?.top_markers || {}
  const geneList = Object.entries(markerGenes)
    .map(([ct, genes]) => ({ ct, genes }))
    .filter((x) => Array.isArray(x.genes))

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-medium opacity-80 mb-2">
            {isZh ? 'Seurat 经典教程 · 第 6 章 · 完结' : 'Seurat Tutorial · Chapter 6 · Final'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? '差异表达与细胞注释' : 'Differential Expression & Cell Annotation'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {isZh
              ? '通过寻找每个簇的特异性标志基因，将聚类结果解释为生物学上有意义的细胞类型。'
              : 'By finding cluster-specific marker genes, translate clustering results into biologically meaningful cell types.'}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '差异表达分析 — FindAllMarkers' : 'Differential Expression Analysis'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'FindAllMarkers 对每个聚类依次做差异表达检验（Wilcoxon rank-sum test），找到每个簇相对其他所有簇的富集基因。这些富集基因就是该细胞类型的标志基因（marker genes）。'
              : 'FindAllMarkers performs differential expression testing (Wilcoxon rank-sum test) for each cluster against all others, finding enriched genes for each cluster. These enriched genes are the cell type markers.'}
          </p>
          <RCode code={MARKERS_R_CODE.trim()} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? 'PBMC 经典标志基因' : 'Canonical PBMC Marker Genes'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? '下表展示了每个细胞类型的 Top 3 标志基因。这些基因是单细胞 RNA-seq 中最经典、最可靠的细胞类型鉴定标志。'
              : 'Below are the top 3 marker genes for each cell type. These are the most canonical and reliable markers for cell type identification in single-cell RNA-seq.'}
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-left">
                    <th className="px-4 py-3 font-semibold">{isZh ? '细胞类型' : 'Cell Type'}</th>
                    <th className="px-4 py-3 font-semibold">#1</th>
                    <th className="px-4 py-3 font-semibold">#2</th>
                    <th className="px-4 py-3 font-semibold">#3</th>
                    <th className="px-4 py-3 font-semibold">{isZh ? '标志基因用途' : 'Use'}</th>
                  </tr>
                </thead>
                <tbody>
                  {geneList.map(({ ct, genes }, i) => (
                    <tr key={ct} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'}>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-slate-100">{ct}</td>
                      {(genes as string[]).slice(0, 3).map((g, j) => (
                        <td key={j} className="px-4 py-3">
                          <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-mono text-xs px-2 py-0.5 rounded">{g}</span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-xs text-gray-500">{isZh ? '鉴定该细胞类型' : 'Identifies this cell type'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '可视化方法' : 'Visualization Methods'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'Seurat 提供多种方式来可视化标志基因：FeaturePlot（UMAP 上的基因表达热图）、DotPlot（矩阵式表达图）、VlnPlot（小提琴图）、RidgePlot（山脊图）。'
              : 'Seurat provides multiple visualization methods for marker genes: FeaturePlot (gene expression heatmap on UMAP), DotPlot (matrix-style expression), VlnPlot (violin plot), RidgePlot (ridge plot).'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'FeaturePlot', desc: isZh ? '在 UMAP 上展示单个基因的表达强度，颜色越深表达越高' : 'Shows gene expression intensity on UMAP, darker = higher expression', code: 'FeaturePlot(pbmc, features = "CD3D")' },
              { name: 'DotPlot', desc: isZh ? '矩阵式展示基因×细胞类型的表达情况，圆点大小=表达比例，颜色=表达量' : 'Matrix showing gene × cell type expression; dot size = % expressed, color = avg expression', code: 'DotPlot(pbmc, features = c("CD3D", "CD4", "CD79A"))' },
              { name: 'VlnPlot', desc: isZh ? '小提琴图展示基因在不同聚类中的表达分布' : 'Violin plot showing gene expression distribution across clusters', code: 'VlnPlot(pbmc, features = c("CD3D", "CD4"))' },
              { name: 'RidgePlot', desc: isZh ? '山脊图展示每个聚类 Top 标志基因的表达重叠情况' : 'Ridge plot showing expression overlap of top markers per cluster', code: 'RidgePlot(pbmc, features = pbmc.markers$gene)' },
            ].map((v) => (
              <div key={v.name} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">{v.name}</h4>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{isZh ? v.desc : v.desc}</p>
                <pre className="bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 dark:text-slate-300 overflow-x-auto">
                  {v.code}
                </pre>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '完整工作流总结' : 'Complete Workflow Summary'}
          </h2>
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { n: '1', title: isZh ? '数据加载' : 'Load Data', step: 'CreateSeuratObject' },
                { n: '2', title: isZh ? '质控过滤' : 'QC', step: 'subset' },
                { n: '3', title: isZh ? '标准化' : 'NormalizeData', step: 'NormalizeData' },
                { n: '4', title: isZh ? '高变基因' : 'FindVariableFeatures', step: 'FindVariableFeatures' },
                { n: '5', title: isZh ? '缩放' : 'ScaleData', step: 'ScaleData' },
                { n: '6', title: isZh ? 'PCA' : 'RunPCA', step: 'RunPCA' },
                { n: '7', title: isZh ? 'KNN 聚类' : 'FindClusters', step: 'FindNeighbors + FindClusters' },
                { n: '8', title: isZh ? 'UMAP' : 'RunUMAP', step: 'RunUMAP / RunTSNE' },
                { n: '9', title: isZh ? '差异表达' : 'FindMarkers', step: 'FindAllMarkers' },
              ].map((s) => (
                <div key={s.n} className="bg-white dark:bg-slate-700 rounded-xl p-4 text-center">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xl">{s.n}</div>
                  <h4 className="font-semibold text-gray-800 dark:text-slate-100">{s.title}</h4>
                  <p className="text-xs font-mono text-gray-400 mt-1">{s.step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex justify-between items-center py-8 border-t border-gray-100 dark:border-slate-800">
          <Link href="/seurat/pbmc/clustering" className="text-gray-400 hover:text-emerald-600 transition-colors">
            ← {isZh ? '上一章：聚类' : 'Prev: Clustering'}
          </Link>
          <Link href="/seurat" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            {isZh ? '回到 Seurat 教程首页 →' : 'Back to Seurat Home →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
