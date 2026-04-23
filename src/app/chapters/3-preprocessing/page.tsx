'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
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
  const { t, lang } = useLang()
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
        const basePath = ''
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
    { label: t('ch3.stepBtn1'), color: '#10b981', icon: '📐' },
    { label: t('ch3.stepBtn2'), color: '#ef4444', icon: '🎯' },
    { label: t('ch3.stepBtn3'), color: '#3b82f6', icon: '📏' },
  ]

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>&gt;</span>
          <Link href="/chapters/2-distribution">Chapter 2</Link>
          <span>&gt;</span>
          <span>{t('nav.ch3')}</span>
        </div>
        <h1>{t('ch3.title')}</h1>
        <p className="subtitle">
          {t('ch3.subtitleFull')} <strong>{t('ch3.subtitleNorm')}</strong>, <strong>{t('ch3.subtitleHVG')}</strong>, <strong>{t('ch3.subtitleScale')}</strong>.
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
            <span className="hidden sm:inline">{t("ch3.stepPrefix")} {i + 1}:</span>
            <span>{step.label}</span>
          </button>
        ))}
      </div>

      <section className="mb-12">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)', border: '1px solid #e0f2fe' }}>
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
            <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
              <span className="font-mono font-bold text-gray-700">{t("ch3.rawCountsLabel")}</span>
              <div className="text-xs text-gray-400 mt-0.5">{data.metadata.n_cells} {t("ch3.cells")} × {data.metadata.n_genes} {t("ch3.genes")}</div>
            </div>
            <span className="text-gray-400 text-lg">&#x2192;</span>
            {[
              { label: t('ch3.normLabel'), sub: t('ch3.normSub'), color: '#10b981', bg: '#d1fae5', border: '#34d399' },
              { label: t('ch3.hvgLabel'), sub: t('ch3.hvgSub'), color: '#ef4444', bg: '#fee2e2', border: '#f87171' },
              { label: t('ch3.scaleLabel'), sub: t('ch3.scaleSub'), color: '#3b82f6', bg: '#dbeafe', border: '#60a5fa' },
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
              <span className="font-mono font-bold text-gray-700">{t('ch3.pcaClustering')}</span>
            </div>
          </div>
        </div>
      </section>

      {activeStep === 0 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#10b981' }}>1</div>
              <h2>{t('ch3.step1Name')}</h2>
            </div>
            <div className="info-panel concept mb-6">
              <h3>{t('ch3.whyNorm')}</h3>
              <p>{t('ch3.step1Desc')}</p>
            </div>
            <div className="info-panel math mb-6">
              <h3>{t('ch3.formulaTitle')}</h3>
              <p className="font-mono text-purple-700 text-sm my-2"><K math="\widetilde{X} = \log\left(1 + \dfrac{X}{\Sigma} \times 10^4\right)" /></p>
              <p className="text-xs text-gray-500">{t('ch3.formulaDesc')}</p>
            </div>
            {/* Library size definition */}
            <div className="info-panel concept mb-6">
              <h3>{'📏 ' + t('ch1.libSizeDef')}</h3>
              <p>{t('ch1.libSizeDefDesc')}</p>
            </div>

            {/* Why log transform */}
            <div className="info-panel tip mb-6">
              <h3>{'🔢 ' + t('ch3.whyLog')}</h3>
              <p className="mb-3">{t('ch3.whyLogDesc1')}</p>
              <div className="bg-white rounded-lg p-4 border border-amber-200 mb-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">{t('ch3.whyLogExample')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <span className="font-mono font-bold text-amber-700">50 → 10</span>
                    <span className="text-gray-500 ml-2">(log₂: 5.64 → 3.32)</span>
                    <p className="text-xs text-gray-500 mt-1">{t('ch3.whyLogGeneA')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="font-mono font-bold text-gray-400">1100 → 1000</span>
                    <span className="text-gray-500 ml-2">(log₂: 10.10 → 9.97)</span>
                    <p className="text-xs text-gray-500 mt-1">{t('ch3.whyLogGeneB')}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">{t('ch3.whyLogConclusion')}</p>
            </div>
            <NormalizationViz data={data.expression_matrix} geneNames={data.gene_names} cellTypes={data.cell_types} lang={lang} />

            <div className="info-panel tip mt-6">
              <h3>{t('ch3.tryThisTitle')}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>{t('ch3.tryNorm1')}</li>
                <li>{t('ch3.tryNorm2')}</li>
                <li>{t('ch3.tryNorm3')}</li>
              </ul>
            </div>


            {/* Three key concepts in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="info-panel math" style={{lineHeight: '1.7'}}>
                <h3>{'⚠️ ' + t('ch3.compBias')}</h3>
                <p className="text-sm">{t('ch3.compBiasDesc')}</p>
                <p className="text-xs text-gray-500 mt-2">{t('ch3.compBiasWhy')}</p>
              </div>
              <div className="info-panel concept" style={{lineHeight: '1.7'}}>
                <h3>{'📐 ' + t('ch3.logFC')}</h3>
                <div className="text-center my-2"><K math="\log_2\!\left(\dfrac{x_2}{x_1}\right) = \log_2(x_2) - \log_2(x_1)" /></div>
                <p className="text-xs text-gray-500">{t('ch3.logFCDesc')}</p>
              </div>
              <div className="info-panel tip" style={{lineHeight: '1.7'}}>
                <h3>{'⚖️ ' + t('ch3.sizeFactor')}</h3>
                <div className="text-center my-2"><K math="s_i = \dfrac{\text{LibSize}_i}{\overline{\text{LibSize}}}" /></div>
                <p className="text-xs text-gray-500">{t('ch3.sizeFactorDesc')}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#ef4444' }}>{t('ch3.nextHVG')} →</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 1 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#ef4444' }}>2</div>
              <h2>{t('ch3.step2Name')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="info-panel concept">
                <h3>{'🎯 ' + t('ch3.whyHVG')}</h3>
                <p className="text-sm">{t('ch3.step2Desc')}</p>
              </div>
              <div className="info-panel math">
                <h3>{'📊 ' + t('ch3.varDecomp')}</h3>
                <div className="text-center my-2">
                  <K math="\text{Var}_{\text{total}} = \text{Var}_{\text{tech}} + \text{Var}_{\text{bio}}" />
                </div>
                <p className="text-xs text-gray-600 mb-1">{t('ch3.varDecompDesc')}</p>
                <p className="text-xs text-gray-400">{t('ch3.negBio')}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('ch3.hvgDataInput')}</p>

            <HvgViz data={normalizedData} geneNames={data.gene_names} cellTypes={data.cell_types} lang={lang} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="info-panel math"><h3>Poisson: <K math="\text{Var} = \mu" /></h3><p className="text-xs text-gray-500">{t('ch3.poissonDesc2')}</p></div>
              <div className="info-panel math"><h3>NB: <K math="\text{Var} = \mu + \alpha\mu^2" /></h3><p className="text-xs text-gray-500">{t('ch3.nbDesc2')}</p></div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(0)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-emerald-500 hover:text-emerald-600 transition-colors">← {t('ch3.backNorm')}</button>
              <button onClick={() => setActiveStep(2)} className="px-5 py-2.5 rounded-xl text-white font-medium shadow-sm" style={{ background: '#3b82f6' }}>{t('ch3.nextScale')} →</button>
            </div>
          </div>
        </section>
      )}

      {activeStep === 2 && (
        <section className="mb-12">
          <div className="viz-card">
            <div className="viz-card-header">
              <div className="step-number" style={{ background: '#3b82f6' }}>3</div>
              <h2>{t('ch3.step3Name')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="info-panel concept">
                <h3>{'🎯 ' + t('ch3.whyScale')}</h3>
                <p className="text-sm">{t('ch3.step3Desc')}</p>
              </div>
              <div className="info-panel tip">
                <h3>{'⚖️ ' + t('ch3.whyEqualWeight')}</h3>
                <p className="text-sm">{t('ch3.equalWeightDesc')}</p>
              </div>
              <div className="info-panel math">
                <h3>{'🧹 ' + t('ch3.regressOut')}</h3>
                <p className="text-sm">{t('ch3.regressOutDesc')}</p>
              </div>
            </div>
            <div className="info-panel math mb-6">
              <h3>{t('ch3.formulaTitle')}</h3>
              <p className="font-mono text-purple-700 text-sm my-2"><K math="z = \dfrac{x - \mu}{\sigma}" /></p>
              <p className="text-xs text-gray-500">{t('ch3.scaleFormulaDesc')}</p>
            </div>

            <ScaleDataViz data={normalizedData} geneNames={data.gene_names} cellTypes={data.cell_types} lang={lang} />
            <div className="flex justify-between mt-6">
              <button onClick={() => setActiveStep(1)} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-medium hover:border-red-500 hover:text-red-600 transition-colors">← {t('ch3.backHVG')}</button>
            </div>
          </div>
        </section>
      )}

      <section className="mb-12">
        <div className="viz-card" style={{ background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)', border: '1px solid #fde68a' }}>
          <h3 className="text-lg font-bold text-amber-800 mb-4">{t('ch3.summaryTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <h4 className="font-semibold text-emerald-700 mb-1">1. {t('ch3.normLabel')}</h4>
              <p className="text-xs text-gray-600">{t('ch3.sumNormDesc')}</p>
              <div className="mt-2 font-mono text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><K math="\log\left(1 + \dfrac{X}{\Sigma} \times 10^4\right)" /></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-200">
              <h4 className="font-semibold text-red-700 mb-1">2. {t('ch3.hvgLabel')}</h4>
              <p className="text-xs text-gray-600">{t('ch3.sumHVGDesc')}</p>
              <div className="mt-2 font-mono text-xs text-red-600 bg-red-50 px-2 py-1 rounded"><K math="\text{top}_n\left(\text{Var}(X)\right)" /></div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-700 mb-1">3. {t('ch3.scaleLabel')}</h4>
              <p className="text-xs text-gray-600">{t('ch3.sumScaleDesc')}</p>
              <div className="mt-2 font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"><K math="z = \dfrac{x - \mu}{\sigma}" /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/2-distribution" className="text-gray-400 hover:text-blue-600 transition-colors">← {t('ch3.prevDist')}</Link>
        <Link href="/chapters/4-pca" className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors shadow-sm">
{t('ch3.nextCh4')}
</Link>
      </div>
    </div>
  )
}
