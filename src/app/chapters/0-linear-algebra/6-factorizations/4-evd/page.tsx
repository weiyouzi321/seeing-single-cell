'use client'

import { useLang } from '@/lib/i18n/LangContext'
import LaChapterNav from '@/components/linear-algebra/LaChapterNav'

export default function FactorizationPage() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">0.6.4</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '特征值分解' : 'Eigendecomposition'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh ? 'A = QΛQᵀ，适用于对称矩阵。' : 'A = QΛQᵀ, for symmetric matrices.'}
          </p>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <p className="text-gray-700 leading-relaxed">
            {isZh ? 'Q 的列是特征向量（标准正交），Λ 是对角矩阵（特征值）。PCA 的核心就是协方差矩阵的特征值分解。' : 'Columns of Q are eigenvectors (orthonormal), Λ is diagonal (eigenvalues). PCA is essentially eigendecomposition of the covariance matrix.'}
          </p>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/6-factorizations/4-evd" />

      
      </div>
    </div>
  )
}