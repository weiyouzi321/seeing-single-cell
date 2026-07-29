'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
import RCode from '@/components/ui/RCode'
import SeuratUMAP from '@/components/ui/SeuratUMAP'

const CLUSTER_R_CODE = `
# 基于 PCA 结果构建 KNN 图
pbmc <- FindNeighbors(pbmc, dims = 1:10, k.param = 20)

# 基于 KNN 图进行 Louvain 社区检测
pbmc <- FindClusters(pbmc, resolution = 0.5)

# 查看每个簇的细胞数
table(pbmc\$seurat_clusters)

# UMAP 可视化（基于前 10 个主成分）
pbmc <- RunUMAP(pbmc, dims = 1:10)
DimPlot(pbmc, reduction = "umap")

# t-SNE 可视化
pbmc <- RunTSNE(pbmc, dims = 1:10)
DimPlot(pbmc, reduction = "tsne")`

export default function SeuratClustering() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-medium opacity-80 mb-2">
            {isZh ? 'Seurat 经典教程 · 第 5 章' : 'Seurat Tutorial · Chapter 5'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? 'KNN 聚类与 UMAP' : 'KNN Clustering & UMAP'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {isZh
              ? '基于 PCA 结果构建 K 近邻图，再用 Louvain 算法检测细胞社区，最后用 UMAP/t-SNE 将高维结果投影到二维。'
              : 'Build a K-nearest neighbor graph from PCA results, detect cell communities with Louvain, then project high-dimensional results to 2D with UMAP/t-SNE.'}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '1. 构建 KNN 图 — FindNeighbors' : '1. Build KNN Graph'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4">
            {isZh
              ? '在 PCA 降维后的主成分空间中，为每个细胞找到最近 20 个邻居（k=20），构建一个图结构。这个 KNN 图是后续聚类和可视化的基础。'
              : 'In PCA-reduced PC space, find the 20 nearest neighbors (k=20) for each cell, building a graph structure. This KNN graph is the foundation for downstream clustering and visualization.'}
          </p>
          <RCode code={CLUSTER_R_CODE.trim()} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '2. Louvain 聚类 — FindClusters' : '2. Louvain Clustering'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'Louvain 算法在 KNN 图上做社区检测。resolution 参数控制聚类的精细度：值越大，产生的簇越多；值越小，簇越粗。默认 resolution=0.5 通常给出生物学上有意义的聚类。'
              : 'The Louvain algorithm performs community detection on the KNN graph. The resolution parameter controls cluster granularity: higher values produce more clusters, lower values produce fewer. Default resolution=0.5 usually gives biologically meaningful clusters.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { name: '0.2', cn: '粗聚类', en: 'Coarse', desc: isZh ? '2-3 个簇' : '2-3 clusters' },
              { name: '0.5', cn: '标准', en: 'Standard', desc: isZh ? '5-8 个簇（默认）' : '5-8 clusters (default)', highlight: true },
              { name: '1.0', cn: '细聚类', en: 'Fine', desc: isZh ? '8-15 个簇' : '8-15 clusters' },
            ].map((p) => (
              <div key={p.name} className={`bg-white dark:bg-slate-800 rounded-xl p-5 border-2 ${p.highlight ? 'border-emerald-500' : 'border-gray-100 dark:border-slate-700'}`}>
                <div className="text-xs font-mono text-emerald-600">{isZh ? 'resolution' : 'resolution'} = {p.name}</div>
                <h3 className="font-bold text-gray-800 dark:text-slate-100 mt-1">{isZh ? p.cn : p.en}</h3>
                <p className="text-sm text-gray-500 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '3. UMAP 可视化' : '3. UMAP Visualization'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? 'UMAP 是一种非线性降维算法，能同时保持全局结构（远细胞）和局部结构（近细胞）。UMAP 图是单细胞分析中最常用的可视化方式，每个颜色簇通常对应一种细胞类型。'
              : 'UMAP is a nonlinear dimensionality reduction algorithm that preserves both global structure (distant cells) and local structure (nearby cells). UMAP plots are the most common visualization in single-cell analysis — each colored cluster typically corresponds to a cell type.'}
          </p>
          <SeuratUMAP />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '4. 聚类结果解读' : '4. Interpreting Clusters'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? '基于 UMAP 图和各簇的标志基因，可以解释每个簇的生物学身份。Seurat 经典教程中通常识别出 7-10 个主要细胞类型。'
              : 'Based on the UMAP plot and cluster-specific marker genes, each cluster can be interpreted as a biological cell identity. Seurat typically identifies 7-10 major cell types.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: '0', name: isZh ? 'CD4 T' : 'CD4 T', n: 67, color: 'blue' },
              { id: '1', name: isZh ? 'B 细胞' : 'B cells', n: 45, color: 'green' },
              { id: '2', name: isZh ? 'CD8 T' : 'CD8 T', n: 38, color: 'red' },
              { id: '3', name: isZh ? 'NK 细胞' : 'NK cells', n: 22, color: 'purple' },
              { id: '4', name: isZh ? '经典单核' : 'Classical Mon', n: 28, color: 'amber' },
              { id: '5', name: isZh ? '树突状' : 'DCs', n: 12, color: 'teal' },
              { id: '6', name: isZh ? '非经典单核' : 'Non-class Mon', n: 15, color: 'orange' },
              { id: '7', name: isZh ? '血小板' : 'Platelets', n: 8, color: 'gray' },
            ].map((c) => (
              <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className={`w-3 h-3 rounded-full bg-${c.color}-500`}></span>
                  <span className="font-mono text-xs text-gray-400">Cluster {c.id}</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-slate-100">{c.name}</h4>
                <p className="text-sm text-emerald-600 font-mono">{c.n} cells</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-between items-center py-8 border-t border-gray-100 dark:border-slate-800">
          <Link href="/seurat/pbmc/pca" className="text-gray-400 hover:text-emerald-600 transition-colors">
            ← {isZh ? '上一章：PCA' : 'Prev: PCA'}
          </Link>
          <Link href="/seurat/pbmc/markers" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            {isZh ? '下一章：细胞注释 →' : 'Next: Cell Annotation →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
