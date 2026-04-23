'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useLang } from '@/lib/i18n/LangContext'
import LaChapterNav from '@/components/linear-algebra/LaChapterNav'

const MatrixVectorViz = dynamic(
  () => import('@/components/visualizations/linear-algebra/MatrixVectorViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div> }
)

function randomMatrix(rows = 6, cols = 6, maxVal = 10) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * (maxVal + 1)))
  )
}

function randomVector(len = 6, maxVal = 5) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * (maxVal + 1)))
}

export default function MatrixVectorPage() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  const matrix = useMemo(() => randomMatrix(), [])
  const vector = useMemo(() => randomVector(), [])

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">0.3</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '矩阵 × 向量' : 'Matrix × Vector'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh
              ? 'Mv 可以从两个角度理解：行点积 或 列的线性组合。点击 Mv 的元素查看逐步计算。'
              : 'Mv can be understood from two perspectives: row-wise dot products or column-wise linear combinations. Click any element in Mv to see the step-by-step calculation.'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <MatrixVectorViz matrix={matrix} vector={vector} lang={lang} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '行点积视角' : 'Row Dot Products'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? '(Mv)ᵢ = M 的第 i 行 · v。把矩阵的每一行与向量做点积。'
                : '(Mv)ᵢ = dot product of row i of M with v. Each row of the matrix is dotted with the vector.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '列线性组合' : 'Linear Combination'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'Mv = v₁·(M 的第 1 列) + v₂·(M 的第 2 列) + ...。结果是矩阵各列的加权和。'
                : 'Mv = v₁·(column 1 of M) + v₂·(column 2 of M) + ... The result is a weighted sum of the matrix columns.'}
            </p>
          </div>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/3-matrix-vector" />

      
      </div>
    </div>
  )
}