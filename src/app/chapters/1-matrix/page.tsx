'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MatrixViz = dynamic(
  () => import('@/components/visualizations/MatrixViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4361ee]" /></div> }
)

const DistributionViz = dynamic(
  () => import('@/components/visualizations/DistributionViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed]" /></div> }
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
function PatternHist({ values, color, label, kdeColor }: { values: number[]; color: string; label: string; kdeColor?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const max = Math.max(...values)
    const isInt = values.every(v => Number.isInteger(v))
    const nBins = isInt ? Math.max(1, Math.ceil(max)) : 15
    const binW = isInt ? 1 : (max || 1) / nBins
    const hist = new Array(nBins).fill(0)
    values.forEach(v => {
      const idx = isInt ? Math.min(Math.floor(v), nBins - 1) : Math.min(Math.floor(v / binW), nBins - 1)
      if (idx >= 0 && idx < nBins) hist[idx]++
    })
    const maxCount = Math.max(...hist) || 1
    const barW = (w - 30) / nBins
    // Draw bars
    ctx.fillStyle = color
    for (let i = 0; i < nBins; i++) {
      const barH = (hist[i] / maxCount) * (h - 35)
      ctx.fillRect(20 + i * barW + 1, h - 25 - barH, Math.max(barW - 2, 1), barH)
    }
    // Draw KDE overlay
    if (kdeColor && values.length > 0) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const std = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length) || 1
      const bw = 1.06 * std * Math.pow(values.length, -0.2)
      const xMin = Math.min(...values) - 3 * bw
      const xMax = Math.max(...values) + 3 * bw
      const nPts = 80
      const kdeXs: number[] = []
      const kdeYs: number[] = []
      for (let i = 0; i < nPts; i++) {
        const x = xMin + (xMax - xMin) * i / nPts
        let density = 0
        for (const v of values) {
          const u = (x - v) / bw
          density += Math.exp(-0.5 * u * u) / (bw * Math.sqrt(2 * Math.PI))
        }
        density /= values.length
        kdeXs.push(x)
        kdeYs.push(density)
      }
      const maxDensity = Math.max(...kdeYs) || 1
      ctx.strokeStyle = kdeColor
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < nPts; i++) {
        const px = 20 + ((kdeXs[i] - xMin) / (xMax - xMin)) * (w - 30)
        const py = h - 25 - (kdeYs[i] / maxDensity) * (h - 35)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
    }
    // X-axis labels
    ctx.fillStyle = '#9ca3af'
    ctx.font = '9px Inter, sans-serif'
    ctx.textAlign = 'center'
    const step = Math.max(1, Math.ceil(nBins / 5))
    for (let i = 0; i <= nBins; i += step) {
      ctx.fillText(String(isInt ? i : (i * binW).toFixed(1)), 20 + i * barW, h - 8)
    }
    // Label
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(label, 20, 14)
  }, [values, color, label, kdeColor])
  return <canvas ref={ref} width={220} height={110} className="w-full max-w-[220px]" />
}


export default function RawDataChapter() {
  const { t, lang } = useLang()
  const [data, setData] = useState<PBMCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        const basePath = ''
        const res = await fetch(`${basePath}/data/pbmc_data.json`)
        if (res.ok) setData(await res.json())
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  const sparsity = useMemo(() => {
    if (!data) return 0
    const flat = data.expression_matrix.flat()
    return ((flat.filter((v: number) => v === 0).length / flat.length) * 100).toFixed(1)
  }, [data])

  const maxVal = useMemo(() => {
    if (!data) return 0
    return Math.max(...data.expression_matrix.flat())
  }, [data])

  // Synthetic distribution data for pattern examples (integer counts)
  const normalData = useMemo(() => {
    const d: number[] = []
    for (let i = 0; i < 200; i++) {
      const u1 = Math.random(), u2 = Math.random()
      d.push(Math.round(Math.max(0, 5 + 1.5 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2))))
    }
    return d
  }, [])
  const bimodalData = useMemo(() => {
    const d: number[] = []
    for (let i = 0; i < 200; i++) {
      const u1 = Math.random(), u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      d.push(Math.round(Math.max(0, i < 100 ? 0.3 + 0.3 * z : 4 + 1 * z)))
    }
    return d
  }, [])
  const zeroInflatedData = useMemo(() => {
    const d: number[] = []
    for (let i = 0; i < 200; i++) {
      if (Math.random() < 0.7) { d.push(0) }
      else {
        const u1 = Math.random(), u2 = Math.random()
        d.push(Math.round(Math.max(0, 3 + 2 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2))))
      }
    }
    return d
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4361ee]" /></div>
  if (!data) return <p className="text-center text-red-500 py-12">Failed to load data.</p>

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">{t('ch1.home')}</Link><span>&gt;</span><span>{t('nav.ch1')}</span>
        </div>
        <h1>{t('ch1.title')}</h1>
        <p className="subtitle">{t('ch1.subtitle')}</p>
      </div>

      {/* Step navigation */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[
          { label: lang === 'zh' ? '表达矩阵' : 'Expression Matrix', color: '#4361ee', icon: '🔢' },
          { label: lang === 'zh' ? '数据分布' : 'Data Distribution', color: '#7c3aed', icon: '📊' },
        ].map((step, i) => (
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
            <span className="hidden sm:inline">{t('ch3.stepPrefix')} {i + 1}:</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      {activeStep === 0 && (
      <>
      {/* Section 1: Matrix */}
      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">1</div>
            <h2>{t('ch1.step1Title')}</h2>
          </div>
          <div className="info-panel concept mb-6">
            <h3>{t('ch1.keyConcept')}</h3>
            <p>{t('ch1.conceptText1')}{t('ch1.conceptText5')}</p>
          </div>

          {/* Library size and expressed features definitions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="info-panel concept">
              <h4>{'📏 ' + t('ch1.libSizeDef')}</h4>
              <p className="text-sm">{t('ch1.libSizeDefDesc')}</p>
            </div>
            <div className="info-panel tip">
              <h4>{'🧬 ' + t('ch1.exprFeaturesDef')}</h4>
              <p className="text-sm">{t('ch1.exprFeaturesDefDesc')}</p>
            </div>
          </div>
          <MatrixViz data={data.expression_matrix} geneNames={data.gene_names} cellTypes={data.cell_types} lang={lang} translations={{
            cellDetail: t('ch1.cellDetail'), typeLabel: t('ch1.typeLabel'), valueLabel: t('ch1.valueLabel'),
            positionLabel: t('ch1.positionLabel'), geneLabel: t('ch1.genesStat'), selectedGene: t('ch1.selectedGene'),
            interactTitle: t('ch1.interactTitle'), interactHover: t('ch1.interactHover'),
            interactClick: t('ch1.interactClick'), interactSlider: t('ch1.interactSlider'), colorScale: t('ch1.colorScale'),
          }} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="stat-card"><h3>{t('ch1.cells')}</h3><div className="stat-value">{data.metadata.n_cells}</div></div>
            <div className="stat-card"><h3>{t('ch1.genesStat')}</h3><div className="stat-value">{data.metadata.n_genes}</div></div>
            <div className="stat-card"><h3>{t('ch1.sparsity')}</h3><div className="stat-value">{sparsity}%</div></div>
            <div className="stat-card"><h3>{t('ch1.maxValue')}</h3><div className="stat-value">{maxVal}</div></div>
          </div>
        </div>
      </section>

      {/* Section 2: Sparsity */}
      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header"><div className="step-number">2</div><h2>{t('ch1.step2Title')}</h2></div>
          <div className="info-panel concept mb-6">
            <p>{t('ch1.sparseDesc1')} <strong>{t('ch1.sparseDescBold')}</strong> {t('ch1.sparseDesc2')}</p>
            <p className="mt-2">{t('ch1.sparseDesc3')} <strong>{sparsity}%</strong> {t('ch1.sparseDesc4')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="info-panel concept"><h4>{t('ch1.bioZeroFull')}</h4><p className="text-sm">{t('ch1.bioZeroFullDesc')}</p></div>
            <div className="info-panel tip"><h4>{t('ch1.techDropoutFull')}</h4><p className="text-sm">{t('ch1.techDropoutFullDesc')}</p></div>
          </div>
          <div className="info-panel math mt-6">
            <h3>{t('ch1.mathFormula')}</h3>
            <div className="text-center my-3"><K math="\text{Sparsity} = \dfrac{\sum_{i,j} \mathbf{1}[X_{ij} = 0]}{n \times p}" /></div>
            <p className="text-xs text-gray-500 text-center">{t('ch1.mathDesc1')}</p>
            <p className="text-xs text-gray-400 text-center mt-2">{t('ch1.sparsityExplain')}</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end mt-6">
        <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors shadow-sm">
          {lang === 'zh' ? '下一步：数据分布 →' : 'Next Step: Data Distribution →'}
        </button>
      </div>

      </>
      )}

      {activeStep === 1 && (
      <>
      {/* Section 3: Distribution */}
      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header"><div className="step-number" style={{ background: '#7c3aed' }}>3</div><h2>{t('ch2.step1Title')}</h2></div>
          <div className="info-panel concept mb-6"><p>{t('ch2.concept1')}</p></div>
          <DistributionViz data={data.expression_matrix} geneNames={data.gene_names} cellTypes={data.cell_types} lang={lang} translations={{
            geneLabel: t('ch2.geneLabel'), binsLabel: t('ch2.binsLabel'), showKDELabel: t('ch2.showKDELabel'),
            statGene: t('ch2.statGene'), statMean: t('ch2.statMean'), statRange: t('ch2.statRange'),
            statZeros: t('ch2.statZeros'), exprLevel: t('ch2.exprLevel'), frequency: t('ch2.frequency'),
            legendHist: t('ch2.legendHist'), legendKDE: t('ch2.legendKDE'),
          }} />
          <div className="info-panel tip mt-6">
            <h3>{'🧪'} {t('ch2.tryThis')}</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('ch2.try1')}</li><li>{t('ch2.try2')}</li><li>{t('ch2.try3')}</li><li>{t('ch2.try4')}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4: Histogram vs KDE */}
      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header"><div className="step-number" style={{ background: '#7c3aed' }}>4</div><h2>{t('ch2.step2Title')}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">{t('ch2.histTitle')}</h3>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>{t('ch2.histDesc')} <strong className="text-gray-800">{t('ch2.histDescBold')}</strong> {t('ch2.histDescEnd')}</p>
                <div className="info-panel math"><p className="text-center"><K math="\text{height}(\text{bin}) = \dfrac{\text{count}(\text{bin})}{\text{total} \times \text{width}(\text{bin})}" /></p></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">{t('ch2.kdeTitle')}</h3>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>{t('ch2.kdeDesc')}</p>
                <p className="text-xs text-gray-500">{t('ch2.kdeFormulaDesc')}</p>
                <div className="info-panel math"><p className="text-center"><K math="\hat{f}(x) = \dfrac{1}{nh} \sum_{i=1}^{n} K\!\left(\dfrac{x - x_i}{h}\right)" /></p></div>
              </div>
            </div>
          </div>
          <div className="info-panel concept mt-6">
            <h3>{'🔧'} {t('ch2.bandwidthTitle')}</h3>
            <p>{t('ch2.bandwidthDesc')} <span className="math-inline">h</span> {t('ch2.bandwidthDesc2')}</p>
          </div>
        </div>
      </section>

      {/* Section 5: Distribution Patterns */}
      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header"><div className="step-number" style={{ background: '#7c3aed' }}>5</div><h2>{t('ch2.step3Title')}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="info-panel concept">
              <h3>{'📊'} {t('ch2.normalPat')}</h3>
              <p>{t('ch2.normalPatDesc')}</p>
            </div>
            <div className="info-panel tip">
              <h3>{'📊'} {t('ch2.bimodalPat')}</h3>
              <p>{t('ch2.bimodalPatDesc')}</p>
            </div>
            <div className="info-panel math">
              <h3>{'📊'} {t('ch2.zeroInfPat')}</h3>
              <p>{t('ch2.zeroInfPatDesc')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <PatternHist values={normalData} color="#10b981" label="GAPDH" kdeColor="#059669" />
              <p className="text-xs text-gray-500 mt-1">{lang === 'zh' ? '示例：GAPDH（管家基因）' : 'Example: GAPDH (housekeeping)'}</p>
            </div>
            <div className="text-center">
              <PatternHist values={bimodalData} color="#f59e0b" label="CD3D" kdeColor="#d97706" />
              <p className="text-xs text-gray-500 mt-1">{lang === 'zh' ? '示例：CD3D（T细胞标记）' : 'Example: CD3D (T cell marker)'}</p>
            </div>
            <div className="text-center">
              <PatternHist values={zeroInflatedData} color="#8b5cf6" label="MS4A1" kdeColor="#7c3aed" />
              <p className="text-xs text-gray-500 mt-1">{lang === 'zh' ? '示例：MS4A1（低表达基因）' : 'Example: MS4A1 (low expression)'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-start mt-6">
        <button onClick={() => setActiveStep(0)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-gray-400 transition-colors">
          {lang === 'zh' ? '← 上一步' : '← Back'}
        </button>
      </div>

      </>
      )}

      {/* Navigation */}
<div className="flex justify-between items-center py-8 border-t border-gray-100">
<Link href="/" className="text-gray-400 hover:text-[#4361ee] transition-colors">
{lang === 'zh' ? '← 首页' : '← Home'}
</Link>
<Link href="/chapters/2-distribution" className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#ef4444' }}>
{lang === 'zh' ? '下一章：质控与过滤 →' : 'Next Chapter: Quality Control →'}
</Link>
</div>
</div>
)
}
