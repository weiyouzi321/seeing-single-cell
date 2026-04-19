'use client'

import { useEffect, useState } from 'react'
import DistributionViz from '@/components/visualizations/DistributionViz'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const basePath = process.env.NODE_ENV === 'production' ? '/seeing-single-cell' : ''
        const response = await fetch(\`\${basePath}/data/pbmc_data.json\`)
        if (!response.ok) {
          throw new Error('Failed to load data')
        }
        const pbmcData = await response.json()
        setData(pbmcData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="prose max-w-none">
      <h1 className="chapter-title">
        Chapter 2: Data Distribution
      </h1>
      
      <p className="text-xl text-gray-600 mb-8">
        Understanding statistical distributions in single-cell gene expression
      </p>

      {/* 2.1 分布可视化 */}
      <section className="mb-12">
        <h2 className="section-title">2.1 Gene Expression Distribution</h2>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <p className="text-gray-700 mb-4">
            The distribution of gene expression values reveals important biological and technical patterns. 
            Different genes exhibit different distribution shapes:
          </p>
          
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li><strong>Housekeeping genes</strong> (e.g., B2M, MALAT1) tend to have higher, more consistent expression</li>
            <li><strong>Cell-type specific genes</strong> show bimodal distributions (on/off in different cell types)</li>
            <li><strong>Lowly expressed genes</strong> are often right-skewed with many zeros</li>
          </ul>
        </div>

        {data && (
          <DistributionViz 
            data={data.expression_matrix} 
            geneNames={data.gene_names}
            cellTypes={data.cell_types}
          />
        )}

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <p className="text-yellow-800">
            <strong>Try it!</strong> Select different genes to compare their distributions. 
            Housekeeping genes like MALAT1 show high, unimodal distributions. 
            Cell-type markers like CD3D show bimodal distributions.
          </p>
        </div>
      </section>

      {/* 2.2 常见分布类型 */}
      <section className="mb-12">
        <h2 className="section-title">2.2 Common Distribution Types</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Normal Distribution</h3>
            <div className="bg-gray-50 p-3 rounded mb-3">
              <div className="text-center math-formula">
                f(x) = (1/σ√2π) × e^(-(x-μ)²/2σ²)
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              Often seen after log-transformation. Characterized by mean (μ) and standard deviation (σ).
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Poisson Distribution</h3>
            <div className="bg-gray-50 p-3 rounded mb-3">
              <div className="text-center math-formula">
                P(X=k) = (λᵏ × e^(-λ)) / k!
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              Models count data. Parameter λ equals both mean and variance. 
              Common in RNA-seq data before normalization.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Negative Binomial</h3>
            <div className="bg-gray-50 p-3 rounded mb-3">
              <div className="text-center math-formula">
                Var(X) = μ + μ²/θ
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              Extends Poisson with extra dispersion parameter (θ). 
              Better models overdispersed count data.
            </p>
          </div>
        </div>
      </section>

      {/* 2.3 分布参数估计 */}
      <section className="mb-12">
        <h2 className="section-title">2.3 Distribution Parameters</h2>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-700 mb-4">
            Understanding distribution parameters helps in:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Mean (μ)</h4>
              <p className="text-gray-700 text-sm mb-2">
                The average expression level across all cells.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-center math-formula text-sm">
                  μ = (1/n) × Σᵢ xᵢ
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Variance (σ²)</h4>
              <p className="text-gray-700 text-sm mb-2">
                Measures spread or dispersion of expression values.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-center math-formula text-sm">
                  σ² = (1/(n-1)) × Σᵢ (xᵢ - μ)²
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>Key insight:</strong> In single-cell data, variance often increases with mean 
              (overdispersion). This is why specialized models like negative binomial are used.
            </p>
          </div>
        </div>
      </section>

      {/* 2.4 实际应用 */}
      <section className="mb-12">
        <h2 className="section-title">2.4 Practical Applications</h2>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Gene Selection</h4>
              <p className="text-gray-700 text-sm">
                Genes with higher variance are more informative for clustering and classification. 
                Low-variance genes (housekeeping) are often filtered out.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Normalization</h4>
              <p className="text-gray-700 text-sm">
                Different distributions require different normalization strategies. 
                Log-transformation helps normalize right-skewed distributions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Differential Expression</h4>
              <p className="text-gray-700 text-sm">
                Statistical tests compare distributions between groups. 
                Understanding the underlying distribution is crucial for test selection.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Quality Control</h4>
              <p className="text-gray-700 text-sm">
                Abnormal distributions may indicate technical issues. 
                Very low expression or unusual patterns can flag problematic cells.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 导航 */}
      <div className="flex justify-between items-center mt-16 pt-8 border-t">
        <a 
          href="/chapters/1-matrix"
          className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous: Matrix
        </a>
        <a 
          href="/chapters/3-pca"
          className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Next: PCA
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
