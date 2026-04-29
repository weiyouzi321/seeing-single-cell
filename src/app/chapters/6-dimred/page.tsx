'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const DimRedViz = dynamic(() => import('@/components/visualizations/DimRedViz'), {
  ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div>
})

interface PBMCData {
  metadata: { n_cells: number; n_genes: number; cell_types: string[]; source: string }
  gene_names: string[]; cell_types: string[]; expression_matrix: number[][]
}

function K({ math }: { math: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const render = () => {
      if (ref.current && (window as any).katex) {
        try { (window as any).katex.render(math, ref.current, { throwOnError: false }) } catch(e) {}
      } else if (ref.current) {
        ref.current.textContent = math
      }
    }
    if ((window as any).katex) {
      render()
    } else {
      timer = setTimeout(render, 500)
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [math])
  return <span ref={ref} className="inline-block" />
}

export default function DimRedChapter() {
  const { t, lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<PBMCData | null>(null)
  const [dimredData, setDimredData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).katex) { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js'; s.async = true; document.head.appendChild(s) }
    async function load() { 
      try { 
        const b = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const [r1, r2] = await Promise.all([
          fetch(`${b}/data/pbmc_scaled.json`),
          fetch(`${b}/data/pbmc_dimred.json`),
        ])
        if (r1.ok) setData(await r1.json())
        if (r2.ok) setDimredData(await r2.json())
      } catch(e) { console.error(e) } finally { setLoading(false) } 
    }
    load()
  }, [])

  // Data already scaled from pbmc_scaled.json
  const processed = useMemo(() => {
    if (!data) return null
    return { scaled: data.expression_matrix, hvgNames: data.gene_names }
  }, [data])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" /></div>
  if (!data || !processed) return <p className="text-center text-red-500 py-12">Failed to load data.</p>

  const steps = [
    { label: t('ch6.stepBtn1'), color: '#8b5cf6', icon: '\u{1f9ed}' },
    { label: t('ch6.stepBtn2'), color: '#ef4444', icon: '\u{1f4ca}' },
    { label: t('ch6.stepBtn3'), color: '#3b82f6', icon: '\u{1f5fa}' },
    { label: t('ch6.stepBtn4'), color: '#10b981', icon: '\u{2696}' },
  ]

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>&gt;</span>
          <Link href="/chapters/5-knn">{t('nav.ch5')}</Link><span>&gt;</span>
          <span>{t('nav.ch6')}</span>
        </div>
        <h1>{t('ch6.title')}</h1>
        <p className="subtitle">{t('ch6.subtitleFull')}</p>
      </div>

      <section className="mb-10">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #dbeafe 100%)', border: '1px solid #c4b5fd' }}>
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">{t('ch6.flowClustering')}</span>
              <div className="text-xs text-gray-400 mt-0.5">{t('ch6.flowClusteringSub')}</div>
            </div>
            <span className="text-gray-400 text-lg">&rarr;</span>
            <div className="bg-violet-50 rounded-lg px-4 py-2 border border-violet-300 shadow-sm" style={{ outline: '2px solid #8b5cf6' }}>
              <span className="font-mono font-bold text-violet-700">{t('ch6.flowViz')}</span>
              <div className="text-xs text-violet-500 mt-0.5">{t('ch6.flowVizSub')}</div>
            </div>
            <span className="text-gray-400 text-lg">&rarr;</span>
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">{t('ch6.flowDEG')}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((step, i) => (
          <button key={i} onClick={() => setActiveStep(i)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeStep === i ? { background: step.color, color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' } : { background: '#f3f4f6', color: '#6b7280' }}>
            <span>{step.icon}</span><span className="hidden sm:inline">{t('ch6.stepPrefix')} {i+1}:</span><span>{step.label}</span>
          </button>
        ))}
      </div>

      {activeStep === 0 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header"><div className="step-number" style={{ background: '#8b5cf6' }}>1</div><h2>{t('ch6.step1Name')}</h2></div>
            <div className="info-panel concept mb-4"><h3>{t('ch6.step1Why')}</h3><p>{t('ch6.step1WhyDesc')}</p></div>
            <div className="info-panel tip mb-4"><h3>{t('ch6.step1TryTitle')}</h3><p>{t('ch6.step1TryDesc')}</p></div>
            <DimRedViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={0} precomputedTsne={dimredData?.tsne} precomputedUmap={dimredData?.umap} />
            <div className="flex justify-end mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#ef4444' }}>{t('ch6.step1Next')}</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 1 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header"><div className="step-number" style={{ background: '#ef4444' }}>2</div><h2>{t('ch6.step2Name')}</h2></div>
            <div className="info-panel concept mb-4"><h3>{t('ch6.step2Core')}</h3><p>{t('ch6.step2CoreDesc')}</p></div>
            <div className="info-panel math mb-4">
              <h3>Step 1: High-dim similarity</h3>
              <div className="text-center my-1"><K math="P(j|i) = \frac{\exp(-\|x_i - x_j\|^2 / 2\sigma^2)}{\sum_{k \neq i} \exp(-\|x_i - x_k\|^2 / 2\sigma^2)}" /></div>
            </div>
            <div className="info-panel tip mb-4"><h3>{t('ch6.step2TryTitle')}</h3><p>{t('ch6.step2TryDesc')}</p></div>
            <DimRedViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={1} precomputedTsne={dimredData?.tsne} precomputedUmap={dimredData?.umap} />
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(0)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-purple-500 hover:text-purple-600 transition-colors">{t('ch6.step2Back')}</button>
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#3b82f6' }}>{t('ch6.step2Next')}</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 2 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header"><div className="step-number" style={{ background: '#3b82f6' }}>3</div><h2>{t('ch6.step3Name')}</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="info-panel concept"><h3>{t('ch6.step3Core')}</h3><p className="text-sm">{t('ch6.step3CoreDesc')}</p></div>
              <div className="info-panel tip">
                <h3>{isZh ? 't-SNE vs UMAP' : 't-SNE vs UMAP'}</h3>
                <table className="text-xs w-full mt-1">
                  <thead><tr className="border-b"><th className="text-left py-1 text-gray-500"></th><th className="text-left py-1 text-red-500">t-SNE</th><th className="text-left py-1 text-blue-500">UMAP</th></tr></thead>
                  <tbody>
                    <tr className="border-b"><td className="py-1 text-gray-600">{isZh ? '局部' : 'Local'}</td><td>\u2705</td><td>\u2705</td></tr>
                    <tr className="border-b"><td className="py-1 text-gray-600">{isZh ? '全局' : 'Global'}</td><td>\u274c</td><td>\u2705</td></tr>
                    <tr className="border-b"><td className="py-1 text-gray-600">{isZh ? '速度' : 'Speed'}</td><td>\ud83d\udc22</td><td>\ud83d\udc07</td></tr>
                    <tr><td className="py-1 text-gray-600">{isZh ? '可重复' : 'Reproducible'}</td><td>\u274c</td><td>\u2705</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="info-panel tip mb-4"><h3>{t('ch6.step3TryTitle')}</h3><p>{t('ch6.step3TryDesc')}</p></div>
            <DimRedViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={2} precomputedTsne={dimredData?.tsne} precomputedUmap={dimredData?.umap} />
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-red-500 hover:text-red-600 transition-colors">{t('ch6.step3Back')}</button>
              <button onClick={() => setActiveStep(3)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#10b981' }}>{t('ch6.step3Next')}</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 3 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header"><div className="step-number" style={{ background: '#10b981' }}>4</div><h2>{t('ch6.step4Name')}</h2></div>
            <div className="info-panel concept mb-4"><h3>{t('ch6.step4Compare')}</h3><p>{t('ch6.step4CompareDesc')}</p></div>
            <DimRedViz data={processed.scaled} geneNames={processed.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={3} precomputedTsne={dimredData?.tsne} precomputedUmap={dimredData?.umap} />
            <div className="info-panel tip mt-6">
              <h3>{'\u26a0\ufe0f ' + t('ch6.step4Pitfalls')}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>{t('ch6.step4Pitfall1')}</li>
                <li>{t('ch6.step4Pitfall2')}</li>
                <li>{t('ch6.step4Pitfall3')}</li>
                <li>{t('ch6.step4Pitfall4')}</li>
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 text-center">
                <div className="text-xs text-gray-500">PCA</div>
                <div className="text-sm font-medium text-blue-700">{t('ch6.step4WhenPCA')}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-200 text-center">
                <div className="text-xs text-gray-500">t-SNE</div>
                <div className="text-sm font-medium text-red-700">{t('ch6.step4WhenTSNE')}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-center">
                <div className="text-xs text-gray-500">UMAP</div>
                <div className="text-sm font-medium text-green-700">{t('ch6.step4WhenUMAP')}</div>
              </div>
            </div>
            <div className="flex justify-start mt-6">
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-blue-500 hover:text-blue-600 transition-colors">{t('ch6.step4Back')}</button>
            </div>
          </div>
        </section>
      )}

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/5-knn" className="text-gray-400 hover:text-blue-600 transition-colors">{t('ch6.prevCh5')}</Link>
        <span className="text-sm text-gray-300">{t('ch6.ch7Soon')}</span>
      </div>
    </div>
  )
}
