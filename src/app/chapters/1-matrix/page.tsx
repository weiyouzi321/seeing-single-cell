'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLang } from '@/lib/i18n/LangContext'

const MatrixViz = dynamic(
  () => import('@/components/visualizations/MatrixViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4361ee]" /></div> }
)

interface PBMCData {
  metadata: { n_cells: number; n_genes: number; description: string; cell_types: string[]; source: string }
  gene_names: string[]
  cell_types: string[]
  expression_matrix: number[][]
}

export default function MatrixChapter() {
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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4361ee]" /></div>
  if (!data) return <p className="text-center text-red-500 py-12">Failed to load data.</p>

  const flat = data.expression_matrix.flat()
  const zeros = flat.filter(v => v === 0).length
  const sparsity = ((zeros / flat.length) * 100).toFixed(1)
  const maxVal = Math.max(...flat).toFixed(1)

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">{t('ch1.home')}</Link><span>\u003E</span><span>{t('ch1.chapter')}</span>
        </div>
        <h1>{t('ch1.title')}</h1>
        <p className="subtitle">{t('ch1.subtitle')}</p>
      </div>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">1</div>
            <h2>{t('ch1.step1Title')}</h2>
          </div>
          <div className="info-panel concept mb-6">
            <h3>{'\u{1F4A1}'} {t('ch1.keyConcept')}</h3>
            <p>{t('ch1.conceptText1')} <strong>{data.metadata.n_genes} {t('ch1.conceptText2')}</strong> {t('ch1.conceptText3')} <strong>{data.metadata.n_cells} {t('ch1.conceptText4')}</strong>. {t('ch1.conceptText5')}</p>
          </div>
          <MatrixViz data={data.expression_matrix} geneNames={data.gene_names} cellTypes={data.cell_types} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="stat-card"><h3>{t('ch1.cells')}</h3><div className="stat-value">{data.metadata.n_cells}</div></div>
            <div className="stat-card"><h3>{t('ch1.genesStat')}</h3><div className="stat-value">{data.metadata.n_genes}</div></div>
            <div className="stat-card"><h3>{t('ch1.sparsity')}</h3><div className="stat-value">{sparsity}%</div></div>
            <div className="stat-card"><h3>{t('ch1.maxValue')}</h3><div className="stat-value">{maxVal}</div></div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">2</div>
            <h2>{t('ch1.step2Title')}</h2>
          </div>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>{t('ch1.sparseDesc1')} <strong className="text-gray-800">{t('ch1.sparseDescBold')}</strong>, {t('ch1.sparseDesc2')}</p>
            <p>{t('ch1.sparseDesc3')} <strong className="text-gray-800">{sparsity}%</strong> {t('ch1.sparseDesc4')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="info-panel concept">
              <h3>{t('ch1.bioZeroFull')}</h3>
              <p>{t('ch1.bioZeroFullDesc')}</p>
            </div>
            <div className="info-panel tip">
              <h3>{t('ch1.techDropoutFull')}</h3>
              <p>{t('ch1.techDropoutFullDesc')}</p>
            </div>
          </div>
          <div className="info-panel math mt-6">
            <h3>{t('ch1.mathFormula')}</h3>
            <p>{t('ch1.mathDesc1')} <span className="math-inline">X</span> {t('ch1.mathDesc2')} <span className="math-inline">n \u00d7 p</span>, {t('ch1.mathDesc3')} <span className="math-inline">n</span> {t('ch1.mathDesc4')} <span className="math-inline">p</span> {t('ch1.mathDesc5')}</p>
            <p className="text-center my-3 font-mono text-sm text-purple-700">sparsity = |{'{x \u2208 X : x = 0}'}| / (n \u00d7 p)</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">3</div>
            <h2>{t('ch1.step3Title')}</h2>
          </div>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">{t('ch1.readRows')}</strong> {t('ch1.readRowsDesc')}</p>
            <p><strong className="text-gray-800">{t('ch1.readCols')}</strong> {t('ch1.readColsDesc1')} <span className="code-inline">CD3D</span> {t('ch1.readColsDesc2')}</p>
            <p><strong className="text-gray-800">{t('ch1.tryIt')}</strong> {t('ch1.tryItDesc')}</p>
          </div>
          <div className="info-panel tip mt-6">
            <h3>{t('ch1.lookFor')}</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('ch1.look1')}</li>
              <li>{t('ch1.look2')}</li>
              <li>{t('ch1.look3')}</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/" className="text-gray-400 hover:text-[#4361ee] transition-colors">{t('ch1.prevHome')}</Link>
        <Link href="/chapters/2-distribution" className="px-5 py-2.5 rounded-xl bg-[#4361ee] text-white font-medium hover:bg-[#3651d4] transition-colors shadow-sm">{t('ch1.nextDist')}</Link>
      </div>
    </div>
  )
}
