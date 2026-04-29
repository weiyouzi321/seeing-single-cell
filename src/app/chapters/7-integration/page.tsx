'use client'

import { useEffect, useState, useRef } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const IntegrationViz = dynamic(
  () => import('@/components/visualizations/IntegrationViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" /></div> }
)

interface PBMCData {
  metadata: { n_cells: number; n_genes: number; description: string; cell_types: string[]; source: string }
  gene_names: string[]
  cell_types: string[]
  expression_matrix: number[][]
}

interface IntegrationData {
  metadata: { n_cells: number; n_genes: number; n_batches: number; description: string; integration_method: string }
  gene_names: string[]
  cell_types: string[]
  batches: string[]
  labels: number[]
  expression_before: number[][]
  expression_after: number[][]
  proj_before: number[][]
  proj_after: number[][]
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

export default function IntegrationChapter() {
  const { t, lang } = useLang()
  const isZh = lang === 'zh'
  const [data, setData] = useState<PBMCData | null>(null)
  const [intData, setIntData] = useState<IntegrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

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
        const [r1, r2] = await Promise.all([
          fetch(`${base}/data/pbmc_data_small.json`),
          fetch(`${base}/data/pbmc_integration.json`),
        ])
        if (r1.ok) setData(await r1.json())
        if (r2.ok) setIntData(await r2.json())
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const steps = [
    {
      title: isZh ? t('ch7.what') : 'What is Integration?',
      desc: isZh
        ? t('ch7.title') + '（' + t('ch7.title') + '）' + t('ch7.whatDesc') + '，' + t('ch7.concept')
        : 'Integration removes batch effects so that cells from different batches align in the same embedding space.',
    },
    {
      title: isZh ? t('ch7.before') + '：' + t('ch7.concept') : 'Before Integration: Batch Effect',
      desc: isZh ? t('ch7.whyDesc') : 'Batch effects from technical sources cause same cell types to separate.',
    },
    {
      title: isZh ? t('ch7.algo') : 'Common Integration Algorithms',
      desc: isZh ? 'Seurat Integration, Harmony, bbknn, Scanorama, MNN, ComBat' : 'Seurat Integration, Harmony, bbknn, Scanorama, MNN, ComBat',
    },
    {
      title: isZh ? t('ch7.after') : 'After Integration',
      desc: isZh ? t('ch7.conceptDesc') : 'After correction, same cell types from different batches mix together.',
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
          {t('ch7.title')}
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          {t('ch7.subtitle')}
        </p>
      </div>

      {/* Step navigation */}
      <div className="flex flex-wrap justify-center gap-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeStep === i
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-teal-50 hover:text-teal-600'
            }`}
          >
            {isZh ? `${i+1}·` : `${i+1}·`}{s.title}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {steps[activeStep].title}
        </h2>
        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
          {steps[activeStep].desc}
        </p>
      </div>

      {/* Visualization placeholder */}
      <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-400">
        IntegrationViz will render here (step {activeStep + 1})
      </div>
    </div>
  )
}
