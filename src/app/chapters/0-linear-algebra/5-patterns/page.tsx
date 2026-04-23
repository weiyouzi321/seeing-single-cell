'use client'

import dynamic from 'next/dynamic'
import { useLang } from '@/lib/i18n/LangContext'
import LaChapterNav from '@/components/linear-algebra/LaChapterNav'

const PatternsViz = dynamic(
  () => import('@/components/visualizations/linear-algebra/PatternsViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div> }
)

export default function PatternsPage() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">0.5</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '实用模式' : 'Practical Patterns'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh
              ? '单细胞分析中常见的矩阵模式：对角、对称、秩-1 和单位矩阵。'
              : 'Common matrix patterns in single-cell analysis: diagonal, symmetric, rank-1, and identity matrices.'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <PatternsViz lang={lang} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '对角矩阵' : 'Diagonal Matrix'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? '只有主对角线非零。缩放变换：D·v 将 v 的每个分量按比例缩放。'
                : 'Only main diagonal entries are non-zero. Scaling transformation: D·v scales each component of v.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '对称矩阵' : 'Symmetric Matrix'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'A = Aᵀ。协方差矩阵总是对称的，这是 PCA 的核心对象。'
                : 'A = Aᵀ. Covariance matrices are always symmetric — this is the core object of PCA.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '秩-1 矩阵' : 'Rank-1 Matrix'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? '可以写成 u·vᵀ。SVD 将任意矩阵分解为秩-1 矩阵的和。'
                : 'Can be written as u·vᵀ. SVD decomposes any matrix into a sum of rank-1 matrices.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '单位矩阵' : 'Identity Matrix'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'I·v = v，不改变任何向量。是矩阵乘法的「1」。'
                : 'I·v = v, leaves any vector unchanged. It is the "1" of matrix multiplication.'}
            </p>
          </div>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/5-patterns" />

      
      </div>
    </div>
  )
}