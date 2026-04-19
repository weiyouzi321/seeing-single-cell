'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MatrixViz = dynamic(
  () => import('@/components/visualizations/MatrixViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4361ee]" /></div> }
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

export default function MatrixChapter() {
  const [data, setData] = useState<PBMCData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4361ee]" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-center text-red-500 py-12">Failed to load data.</p>
  }

  const flat = data.expression_matrix.flat()
  const zeros = flat.filter(v => v === 0).length
  const sparsity = ((zeros / flat.length) * 100).toFixed(1)
  const maxVal = Math.max(...flat).toFixed(1)

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <span>Chapter 1</span>
        </div>
        <h1>The Gene Expression Matrix</h1>
        <p className="subtitle">
          Every single-cell experiment begins with a matrix — rows are cells, columns are genes,
          and each value tells us how much a gene is expressed. Let's explore this fundamental data structure.
        </p>
      </div>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">1</div>
            <h2>What Does the Data Look Like?</h2>
          </div>

          <div className="info-panel concept mb-6">
            <h3>💡 Key Concept</h3>
            <p>
              In scRNA-seq, we measure the expression of <strong>{data.metadata.n_genes} genes</strong> across{' '}
              <strong>{data.metadata.n_cells} individual cells</strong>. The result is a matrix where each cell
              (row) has a "barcode" — its unique pattern of gene expression.
            </p>
          </div>

          <MatrixViz
            data={data.expression_matrix}
            geneNames={data.gene_names}
            cellTypes={data.cell_types}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="stat-card">
              <h3>Cells</h3>
              <div className="stat-value">{data.metadata.n_cells}</div>
            </div>
            <div className="stat-card">
              <h3>Genes</h3>
              <div className="stat-value">{data.metadata.n_genes}</div>
            </div>
            <div className="stat-card">
              <h3>Sparsity</h3>
              <div className="stat-value">{sparsity}%</div>
            </div>
            <div className="stat-card">
              <h3>Max Value</h3>
              <div className="stat-value">{maxVal}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">2</div>
            <h2>Why Are There So Many Zeros?</h2>
          </div>

          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Look at the matrix above — notice the many white (zero) cells? This is called{' '}
              <strong className="text-gray-800">sparsity</strong>, and it's a hallmark of single-cell data.
            </p>
            <p>
              In our dataset, <strong className="text-gray-800">{sparsity}%</strong> of all values are zero.
              This happens for two main reasons:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="info-panel concept">
              <h3>🔬 Biological Zero</h3>
              <p>
                The gene is truly not expressed in that cell. Cell-type specific genes will show
                zeros in cells where they are inactive.
              </p>
            </div>
            <div className="info-panel tip">
              <h3>⚙️ Technical Dropout</h3>
              <p>
                The gene was expressed, but at such low levels that the sequencing process failed
                to capture it. This is a key challenge in scRNA-seq analysis.
              </p>
            </div>
          </div>

          <div className="info-panel math mt-6">
            <h3>📐 Mathematical Formulation</h3>
            <p>
              The expression matrix <span className="math-inline">X</span> has dimensions{' '}
              <span className="math-inline">n × p</span>, where <span className="math-inline">n</span> is the number of cells
              and <span className="math-inline">p</span> is the number of genes. The sparsity is defined as:
            </p>
            <p className="text-center my-3 font-mono text-sm text-purple-700">
              sparsity = |{'{x ∈ X : x = 0}'}| / (n × p)
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">3</div>
            <h2>Reading the Matrix</h2>
          </div>

          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              <strong className="text-gray-800">Each row</strong> is a single cell. Cells of the same type
              (e.g., CD4 T cells) tend to have similar expression patterns — they'll cluster together visually.
            </p>
            <p>
              <strong className="text-gray-800">Each column</strong> is a gene. Marker genes like{' '}
              <span className="code-inline">CD3D</span> are highly expressed only in specific cell types,
              creating bright vertical "stripes" in the matrix.
            </p>
            <p>
              <strong className="text-gray-800">Try it:</strong> Hover over the matrix to see individual values.
              Click on a row or column to highlight it. Use the color scale slider to adjust contrast.
            </p>
          </div>

          <div className="info-panel tip mt-6">
            <h3>🎯 What to Look For</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Rows with similar patterns → same cell type</li>
              <li>Columns with many zeros → lowly expressed or cell-type specific</li>
              <li>Bright "hotspots" → marker genes in specific cell types</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <a href="/" className="text-gray-400 hover:text-[#4361ee] transition-colors">
          ← Home
        </a>
        <a
          href="/chapters/2-distribution"
          className="px-5 py-2.5 rounded-xl bg-[#4361ee] text-white font-medium 
                     hover:bg-[#3651d4] transition-colors shadow-sm"
        >
          Next: Data Distribution →
        </a>
      </div>
    </div>
  )
}
