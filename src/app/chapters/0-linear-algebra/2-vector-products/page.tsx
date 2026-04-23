'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useLang } from '@/lib/i18n/LangContext'
import LaChapterNav from '@/components/linear-algebra/LaChapterNav'

const VectorProductsViz = dynamic(
  () => import('@/components/visualizations/linear-algebra/VectorProductsViz'),
  { ssr: false, loading: () => <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div> }
)

function randomVector(len = 6, maxVal = 10) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * (maxVal + 1)))
}

export default function VectorProductsPage() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  const v = useMemo(() => randomVector(), [])
  const w = useMemo(() => randomVector(), [])

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">0.2</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '向量乘法' : 'Vector Products'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh
              ? '两种基本的向量乘法：点积产生标量，外积产生矩阵。'
              : 'Two fundamental vector multiplications: dot product yields a scalar, outer product yields a matrix.'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <VectorProductsViz v={v} w={w} lang={lang} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '点积 (Dot Product)' : 'Dot Product'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'vᵀ·w = Σ vᵢwᵢ，结果是一个标量。在 PCA 中，点积衡量两个基因表达模式的相似度。'
                : 'vᵀ·w = Σ vᵢwᵢ, resulting in a scalar. In PCA, dot product measures similarity between gene expression patterns.'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">{isZh ? '外积 (Outer Product)' : 'Outer Product'}</h3>
            <p className="text-sm text-gray-500">
              {isZh
                ? 'v·wᵀ 产生一个 n×m 的秩-1 矩阵。每个元素是 vᵢwⱼ。这是理解矩阵乘法的基础。'
                : 'v·wᵀ produces an n×m rank-1 matrix. Each element is vᵢwⱼ. This is the foundation of understanding matrix multiplication.'}
            </p>
          </div>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/2-vector-products" />

      
      </div>
    </div>
  )
}