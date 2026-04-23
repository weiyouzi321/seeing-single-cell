'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useLang } from '@/lib/i18n/LangContext'
import LaChapterNav from '@/components/linear-algebra/LaChapterNav'

const MatrixMultiplicationViz = dynamic(
  () => import('@/components/visualizations/linear-algebra/MatrixMultiplicationViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div> }
)

function randomMatrix(rows = 6, cols = 6, maxVal = 8) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * (maxVal + 1)))
  )
}

export default function MatrixMatrixPage() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  const A = useMemo(() => randomMatrix(), [])
  const B = useMemo(() => randomMatrix(), [])

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">0.4</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '矩阵 × 矩阵' : 'Matrix × Matrix'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh
              ? 'C = AB：点击 C 的任意元素，查看 C[i,j] = Σₖ A[i,k]·B[k,j] 的逐步计算。'
              : 'C = AB: Click any element of C to see the step-by-step calculation C[i,j] = Σₖ A[i,k]·B[k,j].'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 overflow-x-auto">
          <MatrixMultiplicationViz matrixA={A} matrixB={B} lang={lang} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '元素视角' : 'Element-wise View'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'C[i,j] 是 A 的第 i 行与 B 的第 j 列的点积。'
                : 'C[i,j] is the dot product of row i of A and column j of B.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '列视角' : 'Column View'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'C 的第 j 列 = A · (B 的第 j 列)。即 C 的每一列都是 A 的列的线性组合。'
                : 'Column j of C = A · (column j of B). Each column of C is a linear combination of columns of A.'}
            </p>
          </div>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/4-matrix-matrix" />

      
      </div>
    </div>
  )
}