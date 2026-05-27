'use client'

import { useEffect, useState, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const Deviz = dynamic(
  () => import('@/components/visualizations/Deviz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" /></div> }
)

interface DegGene {
  gene: string
  log2FC: number
  pval: number
  padj: number
  pct_expressed_A: number
  pct_expressed_B: number
  mean_A: number
  mean_B: number
  status: string
}

interface DegData {
  metadata: {
    dataset: string
    n_genes: number
    comparison: string
    groups: { A: string; B: string }
    method: string
    total_cells: number
    date: string
  }
  results: DegGene[]
  top_markers: Record<string, string[]>
  summary: {
    upregulated: number
    downregulated: number
    significant: number
    nonsignificant: number
  }
}

function K({ math }: { math: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const render = () => {
      if (ref.current && (window as any).katex) {
        try { (window as any).katex.render(math, ref.current, { throwOnError: false, displayMode: false }) } catch(e) { if(ref.current) ref.current.textContent = math }
      } else { timer = setTimeout(render, 300) }
    }
    render()
    return () => { if (timer) clearTimeout(timer) }
  }, [math])
  return <span ref={ref} className="inline-block" data-katex={math} />
}

export default function DegChapter() {
  const { t, lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<DegData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).katex) {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js'
      s.async = true
      document.head.appendChild(s)
    }
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const res = await fetch(`${base}/data/pbmc_deg.json`)
        if (res.ok) setData(await res.json())
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">{isZh ? '数据加载失败' : 'Failed to load data'}</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
          {isZh ? '差异表达分析' : 'Differential Expression Analysis'}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          {isZh
            ? '找到区分不同细胞类型的基因。从火山图到标记基因热图，理解差异表达的统计原理。'
            : 'Find genes that distinguish cell types. From volcano plots to marker heatmaps, understand the statistics behind differential expression.'}
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-rose-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-rose-600">{data.results.length}</div>
          <div className="text-sm text-gray-500">{isZh ? '分析基因数' : 'Genes Analyzed'}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{data.summary.upregulated}</div>
          <div className="text-sm text-gray-500">{isZh ? '上调基因' : 'Upregulated'}</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{data.summary.downregulated}</div>
          <div className="text-sm text-gray-500">{isZh ? '下调基因' : 'Downregulated'}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{data.summary.nonsignificant}</div>
          <div className="text-sm text-gray-500">{isZh ? '不显著' : 'Not Significant'}</div>
        </div>
      </div>

      {/* Comparison info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-500">{isZh ? '比较组:' : 'Comparison:'}</span>
          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-medium">
            {data.metadata.groups.A}
          </span>
          <span className="text-gray-400">vs</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {data.metadata.groups.B}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{isZh ? '方法:' : 'Method:'}</span>
          <span className="text-gray-700">{data.metadata.method}</span>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="bg-gray-50 rounded-xl p-6">
        <Deviz
          degData={data.results}
          topMarkers={data.top_markers}
          cellTypes={Object.keys(data.top_markers)}
          lang={lang}
        />
      </div>

      {/* Key concepts */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {isZh ? '📐 核心概念' : '📐 Key Concepts'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-rose-600">Log₂ Fold Change</div>
            <div className="text-gray-600">
              {isZh
                ? '基因在两组间的表达倍数变化。log₂FC > 1 表示在组A中表达量是组B的2倍以上。'
                : 'Fold change in expression between two groups. log₂FC > 1 means >2x higher in group A.'}
            </div>
            <K math={String.raw`\log_2\text{FC} = \log_2\left(\frac{\bar{x}_A}{\bar{x}_B}\right)`} />
          </div>
          <div className="space-y-2">
            <div className="font-medium text-blue-600">P-value & FDR</div>
            <div className="text-gray-600">
              {isZh
                ? 'Wilcoxon秩和检验评估差异是否显著。p.adjust使用Benjamini-Hochberg校正多重检验。'
                : 'Wilcoxon rank-sum test evaluates significance. BH correction controls false discovery rate.'}
            </div>
            <K math={String.raw`p_{\text{adj}} = \frac{p \cdot m}{\text{rank}(p)}`} />
          </div>
          <div className="space-y-2">
            <div className="font-medium text-purple-600">{isZh ? '标记基因' : 'Marker Genes'}</div>
            <div className="text-gray-600">
              {isZh
                ? '在特定细胞类型中高表达的基因。如CD3D标记T细胞，MS4A1标记B细胞。'
                : 'Genes highly expressed in specific cell types. e.g., CD3D marks T cells, MS4A1 marks B cells.'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-emerald-600">{isZh ? '火山图' : 'Volcano Plot'}</div>
            <div className="text-gray-600">
              {isZh
                ? 'X轴为log₂FC，Y轴为-log₁₀(padj)。右上和左上区域的点是显著差异基因。'
                : 'X-axis = log₂FC, Y-axis = -log₁₀(padj). Points in top-right/left are significantly DE.'}
            </div>
          </div>
        </div>
      </div>

      {/* Prev/Next Navigation */}
      <div className="flex justify-between items-center py-8 border-t border-gray-100 mt-8">
        <Link href="/chapters/7-integration" className="text-gray-400 hover:text-rose-600 transition-colors">
          {isZh ? '← 上一章：批次整合' : '← Previous: Batch Integration'}
        </Link>
        <span className="text-sm text-gray-300">
          {isZh ? '已是最后一章' : 'Last Chapter'}
        </span>
      </div>
    </div>
  )
}
