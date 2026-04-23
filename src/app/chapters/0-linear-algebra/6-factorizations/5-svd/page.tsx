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
          <span className="text-sm font-bold text-indigo-600">0.6.5</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '奇异值分解' : 'Singular Value Decomposition'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh ? 'A = UΣVᵀ，适用于任意矩阵。' : 'A = UΣVᵀ, for any matrix.'}
          </p>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <p className="text-gray-700 leading-relaxed">
            {isZh ? 'U 和 V 是正交矩阵，Σ 是对角矩阵（奇异值）。SVD 是矩阵分解的「瑞士军刀」，PCA、降维、推荐系统都基于 SVD。' : 'U and V are orthogonal, Σ is diagonal (singular values). SVD is the "Swiss Army knife" of matrix factorizations — PCA, dimensionality reduction, and recommendation systems all rely on SVD.'}
          </p>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/6-factorizations/5-svd" />

      
      </div>
    </div>
  )
}