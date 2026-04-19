'use client'

import { useEffect, useState } from 'react'
import MatrixViz from '@/components/visualizations/MatrixViz'

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
        Chapter 1: Gene Expression Matrix
      </h1>
      
      <p className="text-xl text-gray-600 mb-8">
        Understanding the fundamental data structure of single-cell RNA sequencing
      </p>

      {/* 1.1 矩阵可视化 */}
      <section className="mb-12">
        <h2 className="section-title">1.1 Matrix Visualization</h2>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <p className="text-gray-700 mb-4">
            In single-cell RNA sequencing, we measure the expression levels of thousands of genes 
            across thousands of individual cells. This creates a <strong>gene expression matrix</strong> where:
          </p>
          
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
            <li><strong>Each row</strong> represents an individual cell</li>
            <li><strong>Each column</strong> represents a gene</li>
            <li><strong>Each value</strong> represents the expression level of that gene in that cell</li>
          </ul>
          
          <p className="text-gray-700">
            The matrix is often <strong>sparse</strong>, meaning many values are zero. 
            This is due to technical limitations where lowly expressed genes may not be detected.
          </p>
        </div>

        <MatrixViz 
          data={data.expression_matrix} 
          geneNames={data.gene_names}
          cellTypes={data.cell_types}
        />

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <p className="text-yellow-800">
            <strong>Try it!</strong> Hover over cells to see expression values. 
            Click on rows or columns to highlight entire cells or genes. 
            Adjust the color scale to see how it affects visualization.
          </p>
        </div>
      </section>

      {/* 1.2 数学表示 */}
      <section className="mb-12">
        <h2 className="section-title">1.2 Mathematical Representation</h2>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-700 mb-4">
            The gene expression matrix can be represented mathematically as:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4 overflow-x-auto">
            <div className="text-center">
              <span className="math-formula text-lg">
                X = [x<sub>ij</sub>]<sub>m×n</sub>
              </span>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>Where:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><span className="math-formula">x<sub>ij</sub></span> = expression level of gene <span className="math-formula">j</span> in cell <span className="math-formula">i</span></li>
                <li><span className="math-formula">m</span> = number of cells ({data.metadata.n_cells})</li>
                <li><span className="math-formula">n</span> = number of genes ({data.metadata.n_genes})</li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900">Dimensions</h4>
              <p className="text-blue-800 text-sm mt-1">
                {data.metadata.n_cells} cells × {data.metadata.n_genes} genes
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900">Cell Types</h4>
              <p className="text-green-800 text-sm mt-1">
                {data.metadata.cell_types.join(', ')}
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900">Sparsity</h4>
              <p className="text-purple-800 text-sm mt-1">
                ~36% of values are zero
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1.3 关键概念 */}
      <section className="mb-12">
        <h2 className="section-title">1.3 Key Concepts</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Expression Level</h3>
            <p className="text-gray-700 mb-3">
              The expression level represents how actively a gene is being transcribed in a cell. 
              Higher values indicate more RNA molecules detected.
            </p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                <strong>Interpretation:</strong> A value of 0 means the gene was not detected 
                (dropout), while higher values indicate active expression.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sparsity</h3>
            <p className="text-gray-700 mb-3">
              Single-cell data is inherently sparse due to technical limitations. 
              Many genes have zero counts in most cells.
            </p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                <strong>Challenge:</strong> This sparsity requires special analytical approaches 
                to distinguish true biological zeros from technical dropouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 导航 */}
      <div className="flex justify-between items-center mt-16 pt-8 border-t">
        <div></div>
        <a 
          href="/chapters/2-distribution"
          className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Next: Data Distribution
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
