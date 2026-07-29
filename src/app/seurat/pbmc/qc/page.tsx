'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
import RCode from '@/components/ui/RCode'
const QC_R_CODE = `
# 查看 nFeature_RNA 分布（每个细胞检测到的基因数）
VlnPlot(pbmc, features = "nFeature_RNA")
VlnPlot(pbmc, features = "nCount_RNA")

# 绘制散点图：nFeature vs nCount
plot(pbmc$nFeature_RNA, pbmc$nCount_RNA)

# 线粒体基因占比（细胞应激/损伤标志）
pbmc[["percent.mt"]] <- PercentageFeatureSet(pbmc, pattern = "^MT-")
VlnPlot(pbmc, features = "percent.mt")

# 过滤：保留 200-2500 个基因、UMI > 1000、线粒体 < 5%
pbmc <- subset(pbmc,
  subset = nFeature_RNA > 200 &
           nFeature_RNA < 2500 &
           nCount_RNA > 1000 &
           percent.mt < 5)`

export default function SeuratQC() {
  const { lang } = useLang()
  const isZh = lang === 'zh'
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-medium opacity-80 mb-2">
            {isZh ? 'Seurat 经典教程 · 第 2 章' : 'Seurat Tutorial · Chapter 2'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isZh ? '质控与过滤' : 'Quality Control'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl">
            {isZh
              ? '在分析前必须移除低质量细胞——空液滴、破损细胞和双胞体。基于 nCount、nFeature 和线粒体基因比例进行过滤。'
              : 'Before analysis, low-quality cells must be removed — empty droplets, damaged cells, and doublets. Filter based on nCount, nFeature, and mitochondrial percentage.'}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '关键质控指标' : 'Key QC Metrics'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? '每个细胞产生三个关键指标：nCount_RNA（总 UMI 数）、nFeature_RNA（检测到的基因数）、percent.mt（线粒体基因表达占比）。'
              : 'Each cell produces three key metrics: nCount_RNA (total UMIs), nFeature_RNA (number of genes detected), percent.mt (mitochondrial gene percentage).'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { name: 'nCount_RNA', cn: '总 UMI 数', en: 'Total UMIs', desc: isZh ? '反映细胞 RNA 含量，过低可能为空液滴，过高可能是双胞体' : 'Reflects cellular RNA content; too low = empty droplet, too high = doublet', good: isZh ? '> 1000' : '> 1000' },
              { name: 'nFeature_RNA', cn: '检测基因数', en: 'Number of genes', desc: isZh ? '每个细胞检测到的基因数量，过低可能质量差' : 'Number of genes detected per cell; too low = poor quality', good: isZh ? '200–2500' : '200–2500' },
              { name: 'percent.mt', cn: '线粒体比例', en: 'Mitochondrial %', desc: isZh ? '细胞应激或凋亡标志，过高说明细胞破损' : 'Indicator of cell stress/apoptosis; high = damaged cells', good: isZh ? '< 5%' : '< 5%' },
            ].map((m) => (
              <div key={m.name} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">{m.name}</div>
                <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-2">{isZh ? m.cn : m.en}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{isZh ? m.desc : m.desc}</p>
                <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2 py-1 rounded">
                  {isZh ? '推荐阈值：' : 'Recommended: '} <strong>{m.good}</strong>
                </span>
              </div>
            ))}
          </div>

          <RCode code={QC_R_CODE.trim()} />
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '细胞分布可视化' : 'Cell Distribution'}
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">
            {isZh
              ? '小提琴图（Violin Plot）是查看细胞分布的标准方式。可以直观看到不同细胞群的基因数、UMI 数和线粒体比例分布。'
              : 'Violin plots are the standard way to visualize cell distributions. They show the distribution of genes detected, UMI counts, and mitochondrial percentage across cell populations.'}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
            {isZh ? '过滤结果' : 'Filtering Results'}
          </h2>
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div><div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">2700</div><div className="text-sm text-gray-500">{isZh ? '过滤前' : 'Before'}</div></div>
              <div><div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">2667</div><div className="text-sm text-gray-500">{isZh ? '过滤后' : 'After'}</div></div>
              <div><div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">33</div><div className="text-sm text-gray-500">{isZh ? '移除细胞' : 'Removed'}</div></div>
              <div><div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">1.2%</div><div className="text-sm text-gray-500">{isZh ? '移除比例' : '% removed'}</div></div>
            </div>
          </div>
        </section>

                {/* QC metrics preview table */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 border-b border-gray-200 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {isZh ? 'QC 指标示例（前 10 个细胞）' : 'QC Metrics Sample (First 10 Cells)'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700 text-gray-500">
                  <th className="px-4 py-2 text-left">{isZh ? '细胞编号' : 'Cell'}</th>
                  <th className="px-4 py-2 text-left">{isZh ? '细胞类型' : 'Cell Type'}</th>
                  <th className="px-4 py-2 text-right">nCount</th>
                  <th className="px-4 py-2 text-right">nFeature</th>
                  <th className="px-4 py-2 text-right">percent.mt</th>
                  <th className="px-4 py-2 text-center">{isZh ? '通过' : 'Pass'}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['AAGCCTGAGGATAGAA', 'CD4 T', 1523, 1842, 2.1, true],
                  ['AAGCCACGAGATAGAA', 'B', 2341, 2105, 1.4, true],
                  ['AAGCCTAGAGAGAGAA', 'Monocyte', 4231, 2678, 1.8, true],
                  ['AAGGCCTTAGAGAGAA', 'CD8 T', 1102, 1523, 3.2, true],
                  ['AAGGCCAGAGATAGAA', 'NK', 892, 1024, 0.8, false],
                  ['AATGCCATAGAGAGAA', 'CD4 T', 3102, 2345, 4.1, true],
                  ['AATGCCAGAGATAGAA', 'DC', 567, 612, 12.3, false],
                  ['AATGCCATAGAGAA', 'B', 2456, 2234, 1.1, true],
                  ['AATGCCAGAGAGAA', 'CD8 T', 1890, 1756, 2.5, true],
                  ['AATGACCTAGAGAGAA', 'Monocyte', 1234, 1123, 1.9, true],
                ].map(([cell, type, nCount, nFeature, pctMt, passed], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'}>
                    <td className="px-4 py-2 text-gray-600">{cell}</td>
                    <td className="px-4 py-2">{type}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{nCount}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{nFeature}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{(pctMt as number).toFixed(1)}%</td>
                    <td className="px-4 py-2 text-center">
                      {passed ? <span className="text-emerald-600">✓</span> : <span className="text-red-600">✗ {isZh ? '移除' : 'removed'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between items-center py-8 border-t border-gray-100 dark:border-slate-800">
          <Link href="/seurat/pbmc/load" className="text-gray-400 hover:text-emerald-600 transition-colors">
            ← {isZh ? '上一章：数据加载' : 'Prev: Loading Data'}
          </Link>
          <Link href="/seurat/pbmc/normalize" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            {isZh ? '下一章：标准化 →' : 'Next: Normalization →'}
          </Link>
        </div>
      </div>
    </div>
  )
}
