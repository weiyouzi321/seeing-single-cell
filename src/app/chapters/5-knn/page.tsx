'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const KnnViz = dynamic(
  () => import('@/components/visualizations/KnnViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div> }
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
    let timer: ReturnType<typeof setTimeout> | null = null
    const render = () => {
      if (ref.current && typeof window !== 'undefined' && (window as any).katex) {
        try { (window as any).katex.render(math, ref.current, { throwOnError: false }) } catch(e) {}
      } else if (ref.current) { ref.current.textContent = math }
    }
    if ((window as any).katex) { render() } else { timer = setTimeout(render, 500) }
    return () => { if (timer) clearTimeout(timer) }
  }, [math])
  return <span ref={ref} className="inline-block" />
}

export default function KnnChapter() {
  const { t, lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<PBMCData | null>(null)
  const [knnData, setKnnData] = useState<{ projected: number[][]; knn_adj: number[][]; cell_types: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).katex) {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js'; s.async = true
      document.head.appendChild(s)
    }
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const [resHvg, resKnn] = await Promise.all([
          fetch(`${base}/data/pbmc_hvg_scaled.json`),
          fetch(`${base}/data/pbmc_knn.json`)
        ])
        if (resHvg.ok && resKnn.ok) {
          const [hvgData, knnRaw] = await Promise.all([resHvg.json(), resKnn.json()])
          setData(hvgData)
          setKnnData(knnRaw)
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  // Preprocess: normalize + HVG + scale (same pipeline as Ch3/Ch4)
  // Data already scaled from pbmc_scaled.json
  const processed = useMemo(() => {
    if (!data) return null
    return { scaled: data.expression_matrix, hvgNames: data.gene_names }
  }, [data])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" /></div>
  if (!data || !processed) return <p className="text-center text-red-500 py-12">Failed to load data.</p>

  const steps = [
    { label: t('ch5.stepBtn1'), color: '#8b5cf6', icon: '\u{1f9ed}' },
    { label: t('ch5.stepBtn2'), color: '#f59e0b', icon: '\u{1f578}' },
    { label: t('ch5.stepBtn3'), color: '#ef4444', icon: '\u{1f50d}' },
    { label: t('ch5.stepBtn4'), color: '#10b981', icon: '\u{1f4ca}' },
  ]

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>&gt;</span>
          <Link href="/chapters/4-pca">{t('nav.ch4')}</Link><span>&gt;</span>
          <span>{t('nav.ch5')}</span>
        </div>
        <h1>{t('ch5.title')}</h1>
        <p className="subtitle">{t('ch5.subtitleFull')}</p>
      </div>

      <section className="mb-10">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)', border: '1px solid #fde68a' }}>
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">{t('ch5.flowPCA')}</span>
              <div className="text-xs text-gray-400 mt-0.5">{t('ch5.flowPCASub')}</div>
            </div>
            <span className="text-gray-400 text-lg">&rarr;</span>
            <div className="bg-amber-50 rounded-lg px-4 py-2 border border-amber-300 shadow-sm" style={{ outline: '2px solid #f59e0b' }}>
              <span className="font-mono font-bold text-amber-700">{t('ch5.flowKNN')}</span>
              <div className="text-xs text-amber-500 mt-0.5">{t('ch5.flowKNNSub')}</div>
            </div>
            <span className="text-gray-400 text-lg">&rarr;</span>
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">{t('ch5.flowDEG')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((step, i) => (
          <button key={i} onClick={() => setActiveStep(i)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeStep === i ? { background: step.color, color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } : { background: '#f3f4f6', color: '#6b7280' }}>
            <span>{step.icon}</span>
            <span className="hidden sm:inline">{t('ch5.stepPrefix')} {i + 1}:</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      {activeStep === 0 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#8b5cf6' }}>1</div>
              <h2>{t('ch5.step1Name')}</h2>
            </div>
            <div className="info-panel concept mb-4"><h3>{t('ch5.step1Why')}</h3><p>{t('ch5.step1WhyDesc')}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="info-panel math">
                <h3>{'\u{1f4cf} ' + t('ch5.step1Euclidean')}</h3>
                <p className="text-sm mb-1">{t('ch5.step1EuclideanDesc')}</p>
                <div className="text-center my-1"><K math="d(A,B) = \sqrt{\sum(A_i - B_i)^2}" /></div>
              </div>
              <div className="info-panel concept">
                <h3>{'\u{1f504} ' + t('ch5.step1Cosine')}</h3>
                <p className="text-sm mb-1">{t('ch5.step1CosineDesc')}</p>
                <div className="text-center my-1"><K math="\cos(A,B) = \frac{A \cdot B}{|A| \times |B|}" /></div>
              </div>
            </div>
            <div className="info-panel concept mb-4"><h3>{t('ch5.step1TryTitle')}</h3><p>{t('ch5.step1TryDesc')}</p></div>
            <KnnViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={0} precomputedProjected={knnData?.projected} precomputedKnnAdj={knnData?.knn_adj} />
            <div className="flex justify-end mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#f59e0b' }}>{t('ch5.step1Next')}</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 1 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header"><div className="step-number" style={{ background: '#f59e0b' }}>2</div><h2>{t('ch5.step2Name')}</h2></div>
            <div className="info-panel concept mb-4"><h3>{t('ch5.step2What')}</h3><p>{t('ch5.step2WhatDesc')}</p></div>
            <div className="info-panel tip mb-4"><h3>{t('ch5.step2TryTitle')}</h3><p>{t('ch5.step2TryDesc')}</p></div>
            <KnnViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={1} precomputedProjected={knnData?.projected} precomputedKnnAdj={knnData?.knn_adj} />
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(0)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-purple-500 hover:text-purple-600 transition-colors">{t('ch5.step2Back')}</button>
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#ef4444' }}>{t('ch5.step2Next')}</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 2 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header"><div className="step-number" style={{ background: '#ef4444' }}>3</div><h2>{t('ch5.step3Name')}</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="info-panel concept"><h3>{t('ch5.step3What')}</h3><p className="text-sm">{t('ch5.step3WhatDesc')}</p></div>
              <div className="info-panel math">
                <h3>{'\u{1f522} ' + t('ch5.step3Modularity')}</h3>
                <p className="text-sm mb-1">{t('ch5.step3ModularityDesc')}</p>
                <div className="text-center my-1"><K math="Q = \frac{1}{2m} \sum \left[A_{ij} - \frac{k_i k_j}{2m}\right] \delta(c_i, c_j)" /></div>
              </div>
            </div>
            <div className="info-panel concept mb-4"><h3>{t('ch5.step3TryTitle')}</h3><p>{t('ch5.step3TryDesc')}</p></div>
            <KnnViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={2} precomputedProjected={knnData?.projected} precomputedKnnAdj={knnData?.knn_adj} />
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-amber-500 hover:text-amber-600 transition-colors">{t('ch5.step3Back')}</button>
              <button onClick={() => setActiveStep(3)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#10b981' }}>{t('ch5.step3Next')}</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 3 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header"><div className="step-number" style={{ background: '#10b981' }}>4</div><h2>{t('ch5.step4Name')}</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="info-panel concept"><h3>{'\u{1f4cb} ' + t('ch5.step4Confusion')}</h3><p className="text-sm">{t('ch5.step4ConfusionDesc')}</p></div>
              <div className="info-panel tip">
                <h3>{'\u{1f4ca} ' + t('ch5.step4Metrics')}</h3>
                <p className="text-sm"><strong>ARI</strong> / <strong>NMI</strong>: {isZh ? '\u8861\u91cf\u805a\u7c7b\u4e0e\u771f\u5b9e\u6807\u7b7e\u7684\u4e00\u81f4\u6027' : 'Measures agreement between clustering and truth'}</p>
              </div>
            </div>
            <KnnViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={3} precomputedProjected={knnData?.projected} precomputedKnnAdj={knnData?.knn_adj} />
            <div className="info-panel tip mt-6">
              <h3>{t('ch5.step4TryTitle')}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>{t('ch5.step4Try1')}</li>
                <li>{t('ch5.step4Try2')}</li>
                <li>{t('ch5.step4Try3')}</li>
              </ul>
            </div>
            <div className="flex justify-start mt-6">
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-red-500 hover:text-red-600 transition-colors">{t('ch5.step4Back')}</button>
            </div>
          </div>
        </section>
      )}

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/4-pca" className="text-gray-400 hover:text-blue-600 transition-colors">{t('ch5.prevCh4')}</Link>
        <Link href="/chapters/6-dimred" className="px-5 py-2.5 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors shadow-sm">
{t('ch5.nextCh6')}
</Link>
      </div>
    </div>
  )
}
