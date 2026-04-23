'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const PcaViz = dynamic(
  () => import('@/components/visualizations/PcaViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" /></div> }
)

interface PBMCData {
  metadata: { n_cells: number; n_genes: number; description: string; cell_types: string[]; source: string }
  gene_names: string[]
  cell_types: string[]
  expression_matrix: number[][]
  qc_metrics?: Record<string, number[]>
}

function K({ math }: { math: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let cancelled = false
    const render = () => {
      if (cancelled) return
      if (ref.current && typeof window !== 'undefined' && (window as any).katex) {
        try { (window as any).katex.render(math, ref.current, { throwOnError: false, displayMode: false }) } catch(e) { if (ref.current && !cancelled) ref.current.textContent = math }
      } else if (!cancelled) {
        setTimeout(render, 200)
      }
    }
    render()
    return () => { cancelled = true }
  }, [math])
  return <span ref={ref} className="inline-block" data-katex={math} />
}

export default function PcaChapter() {
  const { t, lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<PBMCData | null>(null)
  const [pcaData, setPcaData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).katex) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js'
      script.async = true
      document.head.appendChild(script)
    }
    async function loadData() {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const [res1, res2] = await Promise.all([
          fetch(`${basePath}/data/pbmc_scaled.json`),
          fetch(`${basePath}/data/pbmc_pca.json`),
        ])
        if (res1.ok) setData(await res1.json())
        if (res2.ok) setPcaData(await res2.json())
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  // Preprocess: normalize + select HVGs (top 20 by variance) + scale
  // Data already scaled from pbmc_scaled.json
  const processedData = useMemo(() => {
    if (!data) return null
    return { scaled: data.expression_matrix, hvgNames: data.gene_names }
  }, [data])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" /></div>
  }
  if (!data || !processedData) {
    return <p className="text-center text-red-500 py-12">Failed to load data.</p>
  }

  const steps = [
    { label: t('ch4.stepBtn1'), color: '#8b5cf6', icon: '\u{1f52c}' },
    { label: t('ch4.stepBtn2'), color: '#f59e0b', icon: '\u{1f4ca}' },
    { label: t('ch4.stepBtn3'), color: '#ef4444', icon: '\u{2699}' },
    { label: t('ch4.stepBtn4'), color: '#3b82f6', icon: '\u{1f50d}' },
  ]

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link><span>&gt;</span>
          <Link href="/chapters/3-preprocessing">{t('nav.ch3')}</Link><span>&gt;</span>
          <span>{t('nav.ch4')}</span>
        </div>
        <h1>{t('ch4.title')}</h1>
        <p className="subtitle">{t('ch4.subtitleFull')}</p>
      </div>

      {/* Flow bar */}
      <section className="mb-10">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)', border: '1px solid #e0e7ff' }}>
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">{t('ch4.flowNormData')}</span>
              <div className="text-xs text-gray-400 mt-0.5">{t('ch4.flowNormSub')}</div>
            </div>
            <span className="text-gray-400 text-lg">&rarr;</span>
            <div className="bg-purple-50 rounded-lg px-4 py-2 border border-purple-300 shadow-sm" style={{ outline: '2px solid #a78bfa' }}>
              <span className="font-mono font-bold text-purple-700">{t('ch4.flowPCA')}</span>
              <div className="text-xs text-purple-500 mt-0.5">{t('ch4.flowPCASub')}</div>
            </div>
            <span className="text-gray-400 text-lg">&rarr;</span>
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">{t('ch4.flowCluster')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Step tabs */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((step, i) => (
          <button key={i} onClick={() => setActiveStep(i)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeStep === i
              ? { background: step.color, color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
              : { background: '#f3f4f6', color: '#6b7280' }}>
            <span>{step.icon}</span>
            <span className="hidden sm:inline">{t('ch4.stepPrefix')} {i + 1}:</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      {/* ── Step 1: Why reduce dimensions ── */}
      {activeStep === 0 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#8b5cf6' }}>1</div>
              <h2>{t('ch4.step1Name')}</h2>
            </div>

            <div className="info-panel concept mb-4">
              <h3>{t('ch4.step1Why')}</h3>
              <p>{t('ch4.step1WhyDesc')}</p>
            </div>

            <div className="info-panel tip mb-6">
              <h3>{'\u{1f5fa}\ufe0f ' + t('ch4.step1Analogy')}</h3>
              <p>{t('ch4.step1AnalogyDesc')}</p>
            </div>

            <div className="info-panel concept mb-4">
              <h3>{t('ch4.step1TryTitle')}</h3>
              <p>{t('ch4.step1TryDesc')}</p>
            </div>

            <PcaViz data={processedData.scaled} geneNames={processedData.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={0} projected={pcaData?.projected} varianceRatio={pcaData?.variance_ratio} />

            <div className="flex justify-end mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#f59e0b' }}>
                {t('ch4.step1Next')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Step 2: Variance is signal ── */}
      {activeStep === 1 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#f59e0b' }}>2</div>
              <h2>{t('ch4.step2Name')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="info-panel concept">
                <h3>{t('ch4.step2WhyVariance')}</h3>
                <p className="text-sm">{t('ch4.step2WhyVarianceDesc')}</p>
              </div>
              <div className="info-panel tip">
                <h3>{t('ch4.step2Direction')}</h3>
                <p className="text-sm">{t('ch4.step2DirectionDesc')}</p>
              </div>
            </div>

            <div className="info-panel concept mb-4">
              <h3>{t('ch4.step2TryTitle')}</h3>
              <p>{t('ch4.step2TryDesc')}</p>
            </div>

            <PcaViz data={processedData.scaled} geneNames={processedData.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={1} projected={pcaData?.projected} varianceRatio={pcaData?.variance_ratio} />

            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(0)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-purple-500 hover:text-purple-600 transition-colors">
                {t('ch4.step2Back')}
              </button>
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#ef4444' }}>
                {t('ch4.step2Next')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Step 3: How PCA works ── */}
      {activeStep === 2 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#ef4444' }}>3</div>
              <h2>{t('ch4.step3Name')}</h2>
            </div>

            <div className="info-panel math mb-4">
              <h3>{t('ch4.step3Formula')}</h3>
              <p className="text-sm mb-2">{t('ch4.step3FormulaDesc')}</p>
              <div className="text-center my-2"><K math="Y = X \cdot W" /></div>
              <p className="text-xs text-gray-500">{isZh ? 'X: 中心化数据 (n×p)，W: 特征向量 (p×k)，Y: 投影数据 (n×k)' : 'X: centered data (n×p), W: eigenvectors (p×k), Y: projected (n×k)'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: t('ch4.step3Step1'), desc: t('ch4.step3Step1Desc'), color: '#10b981', icon: 'A' },
                { label: t('ch4.step3Step2'), desc: t('ch4.step3Step2Desc'), color: '#f59e0b', icon: 'B' },
                { label: t('ch4.step3Step3'), desc: t('ch4.step3Step3Desc'), color: '#ef4444', icon: 'C' },
                { label: t('ch4.step3Step4'), desc: t('ch4.step3Step4Desc'), color: '#3b82f6', icon: 'D' },
              ].map((step, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: step.color }}>{step.icon}</span>
                    <h4 className="text-sm font-semibold text-gray-700">{step.label}</h4>
                  </div>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="info-panel concept mb-4">
              <h3>{t('ch4.step3TryTitle')}</h3>
              <p>{t('ch4.step3TryDesc')}</p>
            </div>

            <PcaViz data={processedData.scaled} geneNames={processedData.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={2} projected={pcaData?.projected} varianceRatio={pcaData?.variance_ratio} />
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-amber-500 hover:text-amber-600 transition-colors">
                {t('ch4.step3Back')}
              </button>
              <button onClick={() => setActiveStep(3)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#3b82f6' }}>
                {t('ch4.step3Next')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Step 4: Explore PCs ── */}
      {activeStep === 3 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#3b82f6' }}>4</div>
              <h2>{t('ch4.step4Name')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="info-panel concept">
                <h3>{'\u{1f4ca} ' + t('ch4.step4VarianceTitle')}</h3>
                <p className="text-sm">{t('ch4.step4VarianceDesc')}</p>
              </div>
              <div className="info-panel tip">
                <h3>{'\u{1f50d} ' + t('ch4.step4ScatterTitle')}</h3>
                <p className="text-sm">{t('ch4.step4ScatterDesc')}</p>
              </div>
            </div>

            <PcaViz data={processedData.scaled} geneNames={processedData.hvgNames} cellTypes={data.cell_types} lang={lang} activeStep={3} projected={pcaData?.projected} varianceRatio={pcaData?.variance_ratio} />

            <div className="info-panel tip mt-6">
              <h3>{t('ch4.step4TryTitle')}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>{t('ch4.step4Try1')}</li>
                <li>{t('ch4.step4Try2')}</li>
                <li>{t('ch4.step4Try3')}</li>
              </ul>
            </div>

            <div className="flex justify-start mt-6">
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-red-500 hover:text-red-600 transition-colors">
                {t('ch4.step4Back')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Summary */}
      <section className="mb-12">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #c4b5fd' }}>
          <h3 className="text-lg font-bold text-purple-800 mb-4">{isZh ? '\u{1f4cb} PCA\u6d41\u7a0b\u603b\u7ed3' : '\u{1f4cb} PCA Pipeline Summary'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { label: isZh ? '\u5747\u503c\u4e2d\u5fc3\u5316' : 'Center', desc: isZh ? '\u51cf\u53bb\u5747\u503c' : 'Subtract mean', formula: 'X_c = X - \\mu', color: '#10b981' },
              { label: isZh ? '\u534f\u65b9\u5dee\u77e9\u9635' : 'Covariance', desc: isZh ? '\u57fa\u56e0\u5171\u53d8\u5173\u7cfb' : 'Gene co-variation', formula: '\\Sigma = \\frac{1}{n-1} X_c^T X_c', color: '#f59e0b' },
              { label: isZh ? '\u7279\u5f81\u5206\u89e3' : 'Eigendecomp.', desc: isZh ? '\u65b9\u5411+\u91cd\u8981\u6027' : 'Direction + importance', formula: '\\Sigma v = \\lambda v', color: '#ef4444' },
              { label: isZh ? '\u6295\u5f71' : 'Project', desc: isZh ? '\u65b0\u5750\u6807\u7cfb' : 'New coordinate system', formula: 'Y = X_c \\cdot W', color: '#3b82f6' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-3 border" style={{ borderColor: s.color + '40' }}>
                <h4 className="font-semibold text-sm mb-1" style={{ color: s.color }}>{i + 1}. {s.label}</h4>
                <p className="text-xs text-gray-600 mb-1">{s.desc}</p>
                <div className="font-mono text-xs px-2 py-1 rounded" style={{ background: s.color + '10', color: s.color }}><K math={s.formula} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/3-preprocessing" className="text-gray-400 hover:text-blue-600 transition-colors">{t('ch4.prevCh3')}</Link>
        <Link href="/chapters/5-knn" className="px-5 py-2.5 rounded-xl bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors shadow-sm">
{t('ch4.nextCh5')}
</Link>
      </div>
    </div>
  )
}
