'use client'

import { useEffect, useState } from 'react'
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

export default function DistributionChapter() {
  const { t } = useLang()
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
          <Link href="/">{t('nav.home')}</Link><span>\u003E</span>
          <Link href="/chapters/1-matrix">{t('nav.ch1')}</Link><span>\u003E</span>
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
            <h3>{'\u{1F4A1}'} {t('ch2.tryThis')}</h3>
            <p>{t('ch2.concept1')}</p>
          </div>
          <DistributionViz data={data.expression_matrix} geneNames={data.gene_names} cellTypes={data.cell_types} />
          <div className="info-panel tip mt-6">
            <h3>{'\u{1F9EA}'} {t('ch2.tryThis')}</h3>
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
                  <p className="font-mono text-purple-700 text-xs">height(bin) = count(bin) / (total \u00d7 width(bin))</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">{t('ch2.kdeTitle')}</h3>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>{t('ch2.kdeDesc')}</p>
                <div className="info-panel math">
                  <p className="font-mono text-purple-700 text-xs">f\u0302(x) = (1/nh) \u03a3 K((x - x\u1D62)/h)</p>
                </div>
              </div>
            </div>
          </div>
          <div className="info-panel concept mt-6">
            <h3>{'\u{1F527}'} {t('ch2.bandwidthTitle')}</h3>
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
              <h3>{'\u{1F4CA}'} {t('ch2.normalPat')}</h3>
              <p>{t('ch2.normalPatDesc')}</p>
            </div>
            <div className="info-panel tip">
              <h3>{'\u{1F4CA}'} {t('ch2.bimodalPat')}</h3>
              <p>{t('ch2.bimodalPatDesc')}</p>
            </div>
            <div className="info-panel math">
              <h3>{'\u{1F4CA}'} {t('ch2.zeroInfPat')}</h3>
              <p>{t('ch2.zeroInfPatDesc')}</p>
            </div>
          </div>
          <div className="mt-6 text-gray-600 leading-relaxed">
            <p>{t('ch2.concept1')}</p>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/1-matrix" className="text-gray-400 hover:text-[#4361ee] transition-colors">{t('ch2.prevBtn')}</Link>
        <Link href="/chapters/3-preprocessing" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">{t('ch3.step1Label') ? (t('nav.ch3') + ' \u2192') : 'Chapter 3 \u2192'}</Link>
      </div>
    </div>
  )
}
