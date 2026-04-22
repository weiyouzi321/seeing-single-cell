'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const QcViz = dynamic(
  () => import('@/components/visualizations/QcViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div> }
)

interface PBMCData {
  metadata: { n_cells: number; n_genes: number; description: string; cell_types: string[]; source: string }
  gene_names: string[]
  cell_types: string[]
  expression_matrix: number[][]
  qc_metrics?: { nCount: number[]; nFeature: number[]; pct_mito: number[] }
}

function K({ math }: { math: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const render = () => {
      if (ref.current && typeof window !== 'undefined' && (window as any).katex) {
        try { (window as any).katex.render(math, ref.current, { throwOnError: false }) } catch(e) {}
      } else if (ref.current) { ref.current.textContent = math }
    }
    if (typeof window !== 'undefined' && !(window as any).katex) {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js'
      s.async = true
      s.onload = render
      document.head.appendChild(s)
    } else { setTimeout(render, 300) }
  }, [math])
  return <span ref={ref} className="inline-block" />
}

export default function QCChapter() {
  const { t, lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<PBMCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/seeing-single-cell' : ''
        const res = await fetch(`${basePath}/data/pbmc_data.json`)
        if (res.ok) setData(await res.json())
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" /></div>
  if (!data) return <p className="text-center text-red-500 py-12">Failed to load data.</p>

  const qc = data.qc_metrics || { nCount: [], nFeature: [], pct_mito: [] }

  const steps = [
    { label: isZh ? '认识QC指标' : 'QC Metrics', icon: '🔬', color: '#ef4444' },
    { label: isZh ? '查看QC分布' : 'View Distributions', icon: '📊', color: '#f97316' },
    { label: isZh ? '设置过滤阈值' : 'Set Thresholds', icon: '✂️', color: '#8b5cf6' },
    { label: isZh ? '过滤前后对比' : 'Before vs After', icon: '🔍', color: '#10b981' },
  ]

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">{isZh ? '首页' : 'Home'}</Link>
          <span>&gt;</span>
          <span>{isZh ? '第2章：质控与过滤' : 'Chapter 2: Quality Control'}</span>
        </div>
        <h1>{isZh ? '质控与过滤' : 'Quality Control & Filtering'}</h1>
        <p className="subtitle">
          {isZh
            ? '在分析之前，我们需要识别并去除低质量细胞。让我们从理解"什么样的细胞是坏的"开始。'
            : 'Before analysis, we need to identify and remove low-quality cells. Lets start by understanding what makes a cell "bad".'}
        </p>
      </div>

      {/* Step navigation */}
      <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
        {steps.map((step, i) => (
          <button key={i} onClick={() => setActiveStep(i)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeStep === i
              ? { background: step.color, color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
              : { background: '#f3f4f6', color: '#6b7280' }}>
            <span>{step.icon}</span>
            <span className="hidden sm:inline">{isZh ? '步骤' : 'Step'} {i + 1}:</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      {/* Step 1: 认识QC指标 */}
      {activeStep === 0 && (
        <>
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#ef4444' }}>1</div>
              <h2>{isZh ? '一个细胞的"体检报告"' : 'A Cell Health Report'}</h2>
            </div>

            <div className="info-panel concept mb-6">
              <h3>{isZh ? '🔬 不是所有细胞都是健康的' : '🔬 Not All Cells Are Healthy'}</h3>
              <p>{isZh
                ? '你从血液中分离了细胞进行单细胞测序。但在这个过程中，有些细胞会"受伤"——我们需要在分析之前把它们找出来。'
                : 'You isolated cells from blood for single-cell sequencing. But during this process, some cells get "damaged" — we need to find them before analysis.'}</p>
            </div>

            {/* Three cell states */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="info-panel concept text-center">
                <div className="text-5xl mb-3">🫧</div>
                <h4 className="font-bold text-emerald-700 mb-2">{isZh ? '健康细胞' : 'Healthy Cell'}</h4>
                <p className="text-sm">{isZh
                  ? '细胞膜完整，mRNA正常保留在细胞内。文库大小适中，检测到的基因种类丰富，线粒体比例低。'
                  : 'Intact membrane, mRNA retained normally. Moderate library size, rich gene diversity, low mito percentage.'}</p>
              </div>
              <div className="info-panel tip text-center">
                <div className="text-5xl mb-3">💧</div>
                <h4 className="font-bold text-gray-500 mb-2">{isZh ? '空液滴' : 'Empty Droplet'}</h4>
                <p className="text-sm">{isZh
                  ? '液滴里没有细胞，只有环境中的背景RNA。总UMI数极低，检测到的基因很少——这是一个"空袋子"。'
                  : 'No cell inside, only ambient background RNA. Very low total UMIs, few genes detected — an "empty bag".'}</p>
              </div>
              <div className="info-panel math text-center">
                <div className="text-5xl mb-3">💥</div>
                <h4 className="font-bold text-red-600 mb-2">{isZh ? '破损细胞' : 'Damaged Cell'}</h4>
                <p className="text-sm">{isZh
                  ? '细胞膜破损，mRNA泄漏出去。更严重的是，线粒体（位于细胞质中）的比例异常升高——这是细胞受损的标志。'
                  : 'Membrane broken, mRNA leaked out. Worse, mitochondrial percentage spikes — a signature of cell damage.'}</p>
              </div>
            </div>

            {/* Key insight */}
            <div className="info-panel tip">
              <h3>{isZh ? '💡 核心洞察' : '💡 Key Insight'}</h3>
              <p>{isZh
                ? '想象细胞是一个装水的袋子：mRNA就是袋子里的水。空液滴几乎没有水，破损的袋子水漏光了。我们通过三个"体检指标"来判断一个细胞是否健康：'
                : 'Think of a cell as a bag of water: mRNA is the water inside. Empty droplets have almost no water, damaged bags have leaked dry. We use three "health metrics" to judge a cell:'}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <div className="font-mono font-bold text-emerald-700">nCount</div>
                  <div className="text-xs text-gray-500 mt-1">{isZh ? '袋子里有多少水（总mRNA量）' : 'How much water in the bag (total mRNA)'}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="font-mono font-bold text-purple-700">nFeature</div>
                  <div className="text-xs text-gray-500 mt-1">{isZh ? '有多少种不同颜色的水（基因多样性）' : 'How many colors of water (gene diversity)'}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="font-mono font-bold text-amber-700">percent_mt</div>
                  <div className="text-xs text-gray-500 mt-1">{isZh ? '有多少比例是"污染的"（线粒体泄漏）' : 'How much is "contaminated" (mito leak)'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      <div className="flex justify-end mt-6">
        <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors shadow-sm">
          {isZh ? '下一步：QC分布 →' : 'Next Step: QC Distribution →'}
        </button>
      </div>
        </>
      )}

      {/* Step 2: QC分布 */}
      {activeStep === 1 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#f97316' }}>2</div>
              <h2>{isZh ? '把生物学直觉变成数字' : 'From Biology to Numbers'}</h2>
            </div>

            <div className="info-panel concept mb-6">
              <p>{isZh
                ? '现在我们用数据来验证生物学直觉。观察下方的QC分布图：'
                : 'Now lets validate our biological intuition with data. Observe the QC distribution plots below:'}</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                <li>{isZh ? '小提琴图展示了每个QC指标在所有细胞中的分布' : 'Violin plots show the distribution of each QC metric across all cells'}</li>
                <li>{isZh ? '散点图1：nCount vs nFeature——健康细胞应聚在一起，表达量和基因数成正比' : 'Scatter 1: nCount vs nFeature — healthy cells should cluster, with UMIs proportional to genes'}</li>
                <li>{isZh ? '散点图2：nCount vs percent_mt——破损细胞会显示为高线粒体比例+低UMI数' : 'Scatter 2: nCount vs percent_mt — damaged cells show high mito% + low UMIs'}</li>
                <li>{isZh ? '红色虚线是当前的过滤阈值' : 'Red dashed lines show the current filter thresholds'}</li>
              </ul>
            </div>

            <QcViz
              data={data.expression_matrix}
              geneNames={data.gene_names}
              cellTypes={data.cell_types}
              qcMetrics={qc}
              lang={lang}
              translations={{
                cellDetail: isZh ? '细胞详情' : 'Cell Detail',
                cellType: isZh ? '细胞类型' : 'Cell Type',
              }}
            />
          </div>
        </section>
      )}

      {/* Step 3: 设置过滤阈值 */}
      {activeStep === 2 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#8b5cf6' }}>3</div>
              <h2>{isZh ? '画一条“录取线”' : 'Draw the Line'}</h2>
            </div>

            <div className="info-panel concept mb-6">
              <p>{isZh
                ? '怎么决定保留哪些细胞？这个决定有背后的数学和生物学逻辑。'
                : 'How do you decide which cells to keep? There is mathematical and biological logic behind this decision.'}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="info-panel tip">
                  <h4>{isZh ? '📐 固定阈值（经验法则）' : '📐 Fixed Thresholds (Rules of Thumb)'}</h4>
                  <p className="text-sm">{isZh
                    ? '基于大量数据的经验值。简单直接，但可能不适合所有数据类型。'
                    : 'Based on empirical values from many datasets. Simple and direct, but may not suit all data types.'}</p>
                </div>
                <div className="info-panel math">
                  <h4>{isZh ? '📊 MAD自适应（数据驱动）' : '📊 MAD Adaptive (Data-Driven)'}</h4>
                  <p className="text-sm">{isZh
                    ? '不依赖经验值，让数据自己告诉你什么是“异常”。偏离中位数超过K倍MAD的点被视为异常。'
                    : 'No empirical values — let the data tell you what is abnormal. Points deviating more than K×MAD from the median are flagged.'}</p>
                    <div className="text-center mt-2"><K math="\text{Threshold} = \text{Median} \pm K \times 1.4826 \times \text{MAD}" /></div>
                </div>
              </div>
            </div>

            <QcViz
              data={data.expression_matrix}
              geneNames={data.gene_names}
              cellTypes={data.cell_types}
              qcMetrics={qc}
              lang={lang}
              translations={{
                cellDetail: isZh ? '细胞详情' : 'Cell Detail',
                cellType: isZh ? '细胞类型' : 'Cell Type',
              }}
            />
          </div>
        </section>
      )}

      {/* Step 2 nav buttons */}
      {activeStep === 1 && (
        <div className="flex justify-between mt-6">
          <button onClick={() => setActiveStep(0)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-gray-400 transition-colors">
            {isZh ? '← 认识QC指标' : '← QC Metrics'}
          </button>
          <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors shadow-sm">
            {isZh ? '下一步：设置阈值 →' : 'Next Step: Set Thresholds →'}
          </button>
        </div>
      )}

      {/* Step 3 nav buttons */}
      {activeStep === 2 && (
        <div className="flex justify-between mt-6">
          <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-gray-400 transition-colors">
            {isZh ? '← QC分布' : '← QC Distribution'}
          </button>
          <button onClick={() => setActiveStep(3)} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
            {isZh ? '下一步：过滤对比 →' : 'Next Step: Filter Comparison →'}
          </button>
        </div>
      )}

      {/* Step 4: 过滤前后对比 */}
      {activeStep === 3 && (
        <>
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#10b981' }}>4</div>
              <h2>{isZh ? '过滤之后发生了什么？' : 'What Happens After Filtering?'}</h2>
            </div>

            <div className="info-panel concept mb-6">
              <h3>{isZh ? '🔍 过滤不是终点，而是起点' : '🔍 Filtering Is Not the End — It Is the Beginning'}</h3>
              <p>{isZh
                ? '去掉低质量细胞后，我们的数据变得更干净。这如何影响后续分析？'
                : 'After removing low-quality cells, our data becomes cleaner. How does this affect downstream analysis?'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="info-panel tip">
                <h4>{isZh ? '📉 如果不过滤会怎样？' : '📉 What If We Do Not Filter?'}</h4>
                <p className="text-sm mb-2">{isZh
                  ? '空液滴会形成一个假的"细胞群"，在PCA和聚类中误导分析。破损细胞的高percent_mt会引入技术噪声。'
                  : 'Empty droplets form a fake "cell cluster" that misleads PCA and clustering. Damaged cells with high percent_mt introduce technical noise.'}</p>
                <p className="text-xs text-gray-500">{isZh
                  ? '这就像在做菜之前，先把坏掉的食材挑出来。'
                  : 'It is like picking out spoiled ingredients before cooking.'}</p>
              </div>
              <div className="info-panel concept">
                <h4>{isZh ? '➡️ 通往下一步' : '➡️ Onward to Next Steps'}</h4>
                <p className="text-sm mb-2">{isZh
                  ? '过滤后的数据将进入预处理三部曲：对数标准化 → 筛选高变基因 → z分数中心化。干净的数据是高质量分析的基础。'
                  : 'Filtered data enters the preprocessing trilogy: Log Normalization → HVG Selection → Z-score Centering. Clean data is the foundation of quality analysis.'}</p>
              </div>
            </div>

            {/* Preview comparison */}
            <div className="info-panel math">
              <h3>{isZh ? '📊 关键统计' : '📊 Key Statistics'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{data.metadata.n_cells}</div>
                  <div className="text-xs text-gray-400">{isZh ? '总细胞数' : 'Total Cells'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{qc.nCount.length > 0 ? qc.nCount.filter((_: number, i: number) =>
                    qc.nCount[i] > 0 && qc.nFeature[i] > 3 && qc.pct_mito[i] < 20
                  ).length : 'N/A'}</div>
                  <div className="text-xs text-gray-400">{isZh ? '预估保留' : 'Est. Kept'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{data.metadata.n_genes}</div>
                  <div className="text-xs text-gray-400">{isZh ? '总基因数' : 'Total Genes'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{qc.nCount.length > 0 ? qc.nCount.filter((_: number, i: number) =>
                    qc.nCount[i] <= 0 || qc.nFeature[i] <= 3 || qc.pct_mito[i] >= 20
                  ).length : 'N/A'}</div>
                  <div className="text-xs text-gray-400">{isZh ? '预估去除' : 'Est. Removed'}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      <div className="flex justify-start mt-6">
        <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-gray-400 transition-colors">
          {isZh ? '← 上一步' : '← Back'}
        </button>
      </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/1-matrix" className="text-gray-400 hover:text-[#4361ee] transition-colors">
          ← {isZh ? '原始数据' : 'Raw Data'}
        </Link>
        <Link href="/chapters/3-preprocessing" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
          {isZh ? '下一章：预处理三部曲 →' : 'Next Chapter: Preprocessing →'}
        </Link>
      </div>
    </div>
  )
}
