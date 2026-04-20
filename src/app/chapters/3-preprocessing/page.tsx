'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const NormalizationViz = dynamic(
  () => import('@/components/visualizations/NormalizationViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div> }
)

const HvgViz = dynamic(
  () => import('@/components/visualizations/HvgViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div> }
)

const ScaleDataViz = dynamic(
  () => import('@/components/visualizations/ScaleDataViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div> }
)

interface PBMCData {
  metadata: {
    n_cells: number
    n_genes: number
    description: string
    cell_types: string[]
    source: string
  }
  gene_names: string[]
  cell_types: string[]
  expression_matrix: number[][]
}


function K({ math }: { math: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const render = () => {
      if (ref.current && typeof window !== 'undefined' && (window as any).katex) {
        try { (window as any).katex.render(math, ref.current, { throwOnError: false }) } catch(e) {}
      } else if (ref.current) {
        ref.current.textContent = math
      }
    }
    // KaTeX might still be loading
    if ((window as any).katex) { render() } else { setTimeout(render, 500) }
  }, [math])
  return <span ref={ref} className="inline-block" />
}

export default function PreprocessingChapter() {
  const [data, setData] = useState<PBMCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    // Load KaTeX JS
    if (typeof window !== 'undefined' && !(window as any).katex) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js'
      script.async = true
      document.head.appendChild(script)
    }
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/seeing-single-cell' : ''
        const res = await fetch(`${basePath}/data/pbmc_data.json`)
        if (res.ok) {
          setData(await res.json())
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Normalized data: libsize/10k/log1p (standard Seurat pipeline)
  const normalizedData = useMemo(() => {
    if (!data) return null
    return data.expression_matrix.map(row => {
      const libSize = row.reduce((a: number, b: number) => a + b, 0)
      return libSize > 0 ? row.map(v => Math.log1p((v / libSize) * 10000)) : row
    })
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!data || !normalizedData) {
    return <p className="text-center text-red-500 py-12">Failed to load data.</p>
  }

  const steps = [
    { label: 'Normalization', color: '#10b981', icon: '\u{1F4D0}' },
    { label: 'HVG Selection', color: '#ef4444', icon: '\u{1F3AF}' },
    { label: 'ScaleData', color: '#3b82f6', icon: '\u{1F4CF}' },
  ]

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>&gt;</span>
          <Link href="/chapters/2-distribution">Chapter 2</Link>
          <span>&gt;</span>
          <span>Chapter 3</span>
        </div>
        <h1>Preprocessing Trilogy</h1>
        <p className="subtitle">
          Before clustering and visualization, scRNA-seq data goes through three essential preprocessing steps:
          <strong> Normalization</strong>, <strong>Highly Variable Gene selection</strong>, and <strong>Scaling</strong>.
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeStep === i
              ? { background: step.color, color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
              : { background: '#f3f4f6', color: '#6b7280' }
            }
          >
            <span>{step.icon}</span>
            <span className="hidden sm:inline">Step {i + 1}:</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      <section className="mb-12">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)', border: '1px solid #e0f2fe' }}>
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">Raw Counts</span>
              <div className="text-xs text-gray-400 mt-0.5">{data.metadata.n_cells} cells x {data.metadata.n_genes} genes</div>
            </div>
            <span className="text-gray-400 text-lg">&#x2192;</span>
            {[
              { label: 'Normalize', sub: 'div libsize, x 10k, log', color: '#10b981', bg: '#d1fae5', border: '#34d399' },
              { label: 'Select HVGs', sub: 'Top variable genes', color: '#ef4444', bg: '#fee2e2', border: '#f87171' },
              { label: 'Scale', sub: 'Z-score per gene', color: '#3b82f6', bg: '#dbeafe', border: '#60a5fa' },
            ].map((s, i) => (
              <span key={i} className="flex items-center gap-3">
                <div
                  className="rounded-lg px-4 py-2 border shadow-sm cursor-pointer transition-all"
                  style={activeStep === i
                    ? { background: s.bg, borderColor: s.border, outline: '2px solid ' + s.border }
                    : { background: 'white', borderColor: '#e5e7eb' }
                  }
                  onClick={() => setActiveStep(i)}
                >
                  <span className="font-mono font-bold" style={{ color: s.color }}>{s.label}</span>
                  <div className="text-xs mt-0.5" style={{ color: s.color }}>{s.sub}</div>
                </div>
                {i < 2 && <span className="text-gray-400 text-lg">&#x2192;</span>}
              </span>
            ))}
            <span className="text-gray-400 text-lg">&#x2192;</span>
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">PCA &#x2192; Clustering</span>
            </div>
          </div>
        </div>
      </section>

      {activeStep === 0 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#10b981' }}>1</div>
              <h2>Normalization</h2>
            </div>
            <div className="info-panel concept mb-6">
              <h3>Why Normalize?</h3>
              <p>Different cells capture different amounts of mRNA — this is a <strong>technical artifact</strong>, not biological. Cell A might have 10x more total counts than Cell B simply because it was more efficiently captured.</p>
            </div>
            <div className="info-panel math mb-6">
              <h3>The Formula</h3>
              <p className="font-mono text-purple-700 text-sm my-2"><K math="\widetilde{X} = \log\left(1 + \dfrac{X}{\Sigma} \times 10^4\right)" /></p>
              <p className="text-xs text-gray-500">1) Divide by library size, x 10k  2) log1p to stabilize variance</p>
            </div>
            <NormalizationViz data={data.expression_matrix} geneNames={data.gene_names} cellTypes={data.cell_types} />
            <div className="info-panel tip mt-6">
              <h3>Try This</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Toggle <strong>Library Size</strong> — cells become comparable</li>
                <li>Toggle <strong>x 10,000</strong> — values scale to interpretable range</li>
                <li>Try <strong>log1p / log2 / ln</strong> — see how log compresses dynamic range</li>
              </ul>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#ef4444' }}>Next: HVG Selection &#x2192;</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 1 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#ef4444' }}>2</div>
              <h2>Highly Variable Gene (HVG) Selection</h2>
            </div>
            <div className="info-panel concept mb-6">
              <h3>Why Select HVGs?</h3>
              <p>Not all genes are informative. <strong>Housekeeping genes</strong> (like GAPDH) are expressed at similar levels across all cells. <strong>HVGs</strong> show high cell-to-cell variance and drive biological heterogeneity.</p>
            </div>
            <p className="text-sm text-gray-600 mb-4">Data input: <strong>normalized</strong> expression matrix. HVGs identified by mean-variance relationship.</p>
            <HvgViz data={normalizedData} geneNames={data.gene_names} cellTypes={data.cell_types} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="info-panel math"><h3>Poisson: <K math="\text{Var} = \mu" /></h3><p className="text-xs text-gray-500">Points above dashed orange line have overdispersion</p></div>
              <div className="info-panel math"><h3>NB: <K math="\text{Var} = \mu + \alpha\mu^2" /></h3><p className="text-xs text-gray-500">Points above purple line are most variable</p></div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(0)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-colors">&#x2190; Back to Normalization</button>
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#3b82f6' }}>Next: ScaleData &#x2192;</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 2 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#3b82f6' }}>3</div>
              <h2>ScaleData (Z-score Normalization)</h2>
            </div>
            <div className="info-panel concept mb-6">
              <h3>Why Scale?</h3>
              <p>After normalization, genes still have different means. <strong>Scaling</strong> z-scores each gene to mean=0, std=1, giving equal weight in PCA.</p>
            </div>
            <div className="info-panel math mb-6">
              <h3>The Formula</h3>
              <p className="font-mono text-purple-700 text-sm my-2"><K math="z = \dfrac{x - \mu}{\sigma}" /></p>
              <p className="text-xs text-gray-500">Input: 20 HVGs from normalized matrix. Output: centered and scaled.</p>
            </div>
            <ScaleDataViz data={normalizedData} geneNames={data.gene_names} cellTypes={data.cell_types} />
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-red-500 hover:text-red-600 transition-colors">&#x2190; Back to HVG Selection</button>
            </div>
          </div>
        </section>
      )}

      <section className="mb-12">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
          <h3 className="text-lg font-bold text-amber-800 mb-4">The Preprocessing Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <h4 className="font-semibold text-emerald-700 mb-1">1. Normalization</h4>
              <p className="text-xs text-gray-600">Library size correction + log transform</p>
              <div className="mt-2 font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><K math="\log\left(1 + \dfrac{X}{\Sigma} \times 10^4\right)" /></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-200">
              <h4 className="font-semibold text-red-700 mb-1">2. HVG Selection</h4>
              <p className="text-xs text-gray-600">Focus on biologically variable genes</p>
              <div className="mt-2 font-mono text-xs text-red-600 bg-red-50 px-2 py-1 rounded"><K math="\text{top}_n\left(\text{Var}(X)\right)" /></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-700 mb-1">3. ScaleData</h4>
              <p className="text-xs text-gray-600">Z-score, mean=0 std=1 for PCA</p>
              <div className="mt-2 font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"><K math="z = \dfrac{x - \mu}{\sigma}" /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/2-distribution" className="text-gray-400 hover:text-blue-600 transition-colors">&#x2190; Data Distribution</Link>
        <span className="text-sm text-gray-300">Chapter 4 (Dimensionality Reduction) coming soon &#x2192;</span>
      </div>
    </div>
  )
}
