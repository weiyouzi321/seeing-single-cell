'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useLang } from '@/lib/i18n/LangContext'
import LaChapterNav from '@/components/linear-algebra/LaChapterNav'

const MatrixViewsViz = dynamic(
  () => import('@/components/visualizations/linear-algebra/MatrixViewsViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div> }
)

function randomMatrix(rows = 6, cols = 6, maxVal = 20) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * (maxVal + 1)))
  )
}

export default function MatrixViewsPage() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  const matrix = useMemo(() => randomMatrix(), [])

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">0.1</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '矩阵的四种视角' : '4 Ways to View a Matrix'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh
              ? '一个矩阵可以从四个等价的角度理解。切换下方按钮探索不同视角。'
              : 'A matrix can be understood from four equivalent perspectives. Toggle the buttons below to explore.'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <MatrixViewsViz matrix={matrix} lang={lang} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '作为表格' : 'As a Table'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? '最直观的视角：m 行 n 列的数字排列。在单细胞数据中，行通常是细胞，列是基因。'
                : 'The most intuitive view: m rows and n columns of numbers. In single-cell data, rows are cells and columns are genes.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '作为列向量' : 'As Column Vectors'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'A = [a₁ a₂ ... aₙ]，每一列是一个 m 维向量。在 PCA 中，列是基因的表达向量。'
                : 'A = [a₁ a₂ ... aₙ], each column is an m-dimensional vector. In PCA, columns are gene expression vectors.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '作为行向量' : 'As Row Vectors'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? '每一行是一个 n 维向量，代表一个细胞在所有基因上的表达谱。'
                : "Each row is an n-dimensional vector representing a cell's expression profile across all genes."}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '作为单个元素' : 'As Individual Elements'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'aᵢⱼ 是第 i 行第 j 列的元素。矩阵乘法本质上是对这些元素的系统操作。'
                : 'aᵢⱼ is the element at row i, column j. Matrix multiplication is fundamentally a systematic operation on these elements.'}
            </p>
          </div>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/1-matrix-views" />

      
      </div>
    </div>
  )
}