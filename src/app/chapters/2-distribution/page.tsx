'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLang } from '@/lib/i18n/LangContext'

const DistributionViz = dynamic(
  () => import('@/components/visualizations/DistributionViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c3aed]" /></div> }
)

interface PBMCData {
  metadata: { n_cells: number; n_genes: number; description: string; cell_types: string[]; source: string }
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

function PatternHist({ values, color, label }: { values: number[]; color: string; label: string }) {
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
    const barW = (w - 20) / nBins
    ctx.fillStyle = color
    for (let i = 0; i < nBins; i++) {
      const barH = (hist[i] / maxCount) * (h - 30)
      ctx.fillRect(10 + i * barW + 1, h - 20 - barH, Math.max(barW - 2, 1), barH)
    }
    ctx.fillStyle = '#9ca3af'
    ctx.font = '9px Inter, sans-serif'
    ctx.textAlign = 'center'
    const step = Math.max(1, Math.ceil(nBins / 5))
    for (let i = 0; i <= nBins; i += step) {
      ctx.fillText(String(isInt ? i : (i * binW).toFixed(1)), 10 + i * barW, h - 5)
    }
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 11px Inter, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(label, 10, 12)
  }, [values, color, label])
  return <canvas ref={ref} width={200} height={100} className="w-full max-w-[200px]" />
}

export default function DistributionChapter() {
  const { t, lang } = useLang()
  const [data, setData] = useState<PBMCData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/seeing-single-cell' : ''
        const res = await fetch(`${basePath}/data/pbmc_data.json`)
        if (res.ok) setData(await res.json())
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    loadData()
  }, [])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c3aed]" /></div>
  if (!data) return <p className="text-center text-red-500 py-12">Failed to load data.</p>

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">{t('nav.home')}</Link><span>{'>'}</span>
          <Link href="/chapters/1-matrix">{t('nav.ch1')}</Link><span>{'>'}</span>
          <span>{t('nav.ch2')}</span>
        </div>
        <h1>{t('ch2.title')}</h1>
        <p className="subtitle">{t('ch2.subtitle')}</p>
      </div>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">1</div>
            <h2>{t('ch2.step1Title')}</h2>
          </div>
          <div className="info-panel concept mb-6">
            <h3>{'💡'} {t('ch2.tryThis')}</h3>
            <p>{t('ch2.concept1')}</p>
          </div>
          <DistributionViz data={data.expression_matrix} geneNames={data.gene_names} cellTypes={data.cell_types} lang={lang} translations={{
            geneLabel: t('ch2.geneLabel'),
            binsLabel: t('ch2.binsLabel'),
            showKDELabel: t('ch2.showKDELabel'),
            statGene: t('ch2.statGene'),
            statMean: t('ch2.statMean'),
            statRange: t('ch2.statRange'),
            statZeros: t('ch2.statZeros'),
            exprLevel: t('ch2.exprLevel'),
            frequency: t('ch2.frequency'),
            legendHist: t('ch2.legendHist'),
            legendKDE: t('ch2.legendKDE'),
          }} />
          <div className="info-panel tip mt-6">
            <h3>{'🧪'} {t('ch2.tryThis')}</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('ch2.try1')}</li>
              <li>{t('ch2.try2')}</li>
              <li>{t('ch2.try3')}</li>
              <li>{t('ch2.try4')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">2</div>
            <h2>{t('ch2.step2Title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">{t('ch2.histTitle')}</h3>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>{t('ch2.histDesc')} <strong className="text-gray-800">{t('ch2.histDescBold')}</strong> {t('ch2.histDescEnd')}</p>
                <div className="info-panel math">
                  <p className="text-center"><K math="\text{height}(\text{bin}) = \dfrac{\text{count}(\text{bin})}{\text{total} \times \text{width}(\text{bin})}" /></p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">{t('ch2.kdeTitle')}</h3>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>{t('ch2.kdeDesc')}</p>
                <p className="text-xs text-gray-500">{t('ch2.kdeFormulaDesc')}</p>
                <div className="info-panel math">
                  <p className="text-center"><K math="\hat{f}(x) = \dfrac{1}{nh} \sum_{i=1}^{n} K\!\left(\dfrac{x - x_i}{h}\right)" /></p>
                </div>
              </div>
            </div>
          </div>
          <div className="info-panel concept mt-6">
            <h3>{'🔧'} {t('ch2.bandwidthTitle')}</h3>
            <p>{t('ch2.bandwidthDesc')} <span className="math-inline">h</span> {t('ch2.bandwidthDesc2')}</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">3</div>
            <h2>{t('ch2.step3Title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="info-panel concept">
              <h3>{'📊'} {t('ch2.normalPat')}</h3>
              {data && <PatternHist values={data.expression_matrix.map(r => r[22])} color="rgba(75,85,99,0.6)" label="B2M" />}
              <p className="mt-2">{t('ch2.normalPatDesc')}</p>
            </div>
            <div className="info-panel tip">
              <h3>{'📊'} {t('ch2.bimodalPat')}</h3>
              {data && <PatternHist values={data.expression_matrix.map(r => r[0])} color="rgba(124,58,237,0.6)" label="CD3D" />}
              <p className="mt-2">{t('ch2.bimodalPatDesc')}</p>
            </div>
            <div className="info-panel math">
              <h3>{'📊'} {t('ch2.zeroInfPat')}</h3>
              {data && <PatternHist values={data.expression_matrix.map(r => r[19])} color="rgba(245,158,11,0.6)" label="PPBP" />}
              <p className="mt-2">{t('ch2.zeroInfPatDesc')}</p>
            </div>
          </div>
          <div className="mt-6 text-gray-600 leading-relaxed">
            <p>{t('ch2.concept1')}</p>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/1-matrix" className="text-gray-400 hover:text-[#4361ee] transition-colors">{t('ch2.prevBtn')}</Link>
        <Link href="/chapters/3-preprocessing" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">{t('ch3.step1Label') ? (t('nav.ch3') + ' →') : 'Chapter 3 →'}</Link>
      </div>
    </div>
  )
}
