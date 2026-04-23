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
          <span className="text-sm font-bold text-indigo-600">0.6.2</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? 'LU 分解' : 'LU Decomposition'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh ? 'A = L·U，L 是下三角矩阵，U 是上三角矩阵。' : 'A = L·U, where L is lower triangular and U is upper triangular.'}
          </p>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <p className="text-gray-700 leading-relaxed">
            {isZh ? 'LU 分解对应高斯消去法。L 记录消去过程，U 是消去后的上三角矩阵。解线性方程组 Ax=b 时，先解 Ly=b，再解 Ux=y。' : 'LU decomposition corresponds to Gaussian elimination. L records the elimination steps; U is the resulting upper triangular matrix. To solve Ax=b, first solve Ly=b, then Ux=y.'}
          </p>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/6-factorizations/2-lu" />

      
      </div>
    </div>
  )
}