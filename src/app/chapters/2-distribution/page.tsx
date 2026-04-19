'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

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

export default function DistributionChapter() {
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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c3aed]" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-center text-red-500 py-12">Failed to load data.</p>
  }

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/chapters/1-matrix">Chapter 1</Link>
          <span>›</span>
          <span>Chapter 2</span>
        </div>
        <h1>Data Distribution</h1>
        <p className="subtitle">
          Not all genes are created equal. Explore how expression values are distributed
          across cells, and discover what different distribution shapes tell us about biology.
        </p>
      </div>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">1</div>
            <h2>Exploring Gene Expression Distributions</h2>
          </div>

          <div className="info-panel concept mb-6">
            <h3>💡 Why Distributions Matter</h3>
            <p>
              The distribution of a gene's expression values across all cells reveals important patterns.
              Housekeeping genes tend to be normally distributed, while cell-type markers show bimodal
              distributions (on or off).
            </p>
          </div>

          <DistributionViz
            data={data.expression_matrix}
            geneNames={data.gene_names}
            cellTypes={data.cell_types}
          />

          <div className="info-panel tip mt-6">
            <h3>🧪 Try This</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Select different genes from the dropdown — compare CD3D (T cell marker) vs B2M (housekeeping)</li>
              <li>Adjust the bin count to see how granularity affects the histogram's shape</li>
              <li>Toggle the KDE curve on/off to see how kernel smoothing works</li>
              <li>Watch how the statistics panel changes with each gene</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">2</div>
            <h2>Histogram vs Kernel Density Estimation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Histogram</h3>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>
                  A histogram divides the data range into <strong className="text-gray-800">bins</strong> and
                  counts how many values fall into each bin. It's simple and intuitive, but the shape
                  depends on bin width and starting position.
                </p>
                <div className="info-panel math">
                  <p className="font-mono text-purple-700 text-xs">
                    height(bin) = count(bin) / (total × width(bin))
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Kernel Density Estimation (KDE)</h3>
              <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
                <p>
                  KDE places a smooth kernel (usually Gaussian) at each data point, then sums them up.
                  The result is a continuous, smooth estimate of the probability density function.
                </p>
                <div className="info-panel math">
                  <p className="font-mono text-purple-700 text-xs">
                    f̂(x) = (1/nh) Σ K((x - xᵢ)/h)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="info-panel concept mt-6">
            <h3>🔧 The Bandwidth Parameter</h3>
            <p>
              The bandwidth <span className="math-inline">h</span> in KDE controls the smoothness:
              too small → noisy and spiky, too large → over-smoothed. In the visualization above,
              try different genes to see how the optimal bandwidth changes with the data shape.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="viz-card">
          <div className="viz-card-header">
            <div className="step-number">3</div>
            <h2>Common Distribution Patterns in scRNA-seq</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="info-panel concept">
              <h3>📊 Normal-like</h3>
              <p>
                <strong>Housekeeping genes</strong> (e.g., GAPDH, B2M) are expressed in all cells.
                Their distribution is roughly symmetric around the mean.
              </p>
            </div>
            <div className="info-panel tip">
              <h3>📊 Bimodal</h3>
              <p>
                <strong>Cell-type markers</strong> (e.g., CD3D) show two peaks: one at zero (cells
                that don't express it) and one at a higher value (cells that do).
              </p>
            </div>
            <div className="info-panel math">
              <h3>📊 Zero-inflated</h3>
              <p>
                <strong>Lowly expressed genes</strong> have a huge spike at zero with a long right tail.
                This is the "dropout" problem in scRNA-seq.
              </p>
            </div>
          </div>

          <div className="mt-6 text-gray-600 leading-relaxed">
            <p>
              In the interactive plot above, try selecting <strong className="text-gray-800">B2M</strong> (normal-like),{' '}
              <strong className="text-gray-800">CD3D</strong> (bimodal), and{' '}
              <strong className="text-gray-800">NKG7</strong> (zero-inflated) to see these patterns in real data.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link
          href="/chapters/1-matrix"
          className="text-gray-400 hover:text-[#4361ee] transition-colors"
        >
          ← Gene Expression Matrix
        </Link>
        <span className="text-sm text-gray-300">
          Chapter 3 (Normalization) coming soon →
        </span>
      </div>
    </div>
  )
}
