'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'
import LaChapterNav from '@/components/linear-algebra/LaChapterNav'

export default function FactorizationsPage() {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  const factors = [
    {
      num: '0.6.1',
      href: '/chapters/0-linear-algebra/6-factorizations/1-cr',
      title: isZh ? 'CR 分解' : 'CR Decomposition',
      desc: isZh ? 'A = C·R (列行分解)' : 'A = C·R (Column-Row factorization)',
      color: 'from-indigo-400 to-indigo-500'
    },
    {
      num: '0.6.2',
      href: '/chapters/0-linear-algebra/6-factorizations/2-lu',
      title: isZh ? 'LU 分解' : 'LU Decomposition',
      desc: isZh ? 'A = L·U (高斯消去法)' : 'A = L·U (Gaussian elimination)',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      num: '0.6.3',
      href: '/chapters/0-linear-algebra/6-factorizations/3-qr',
      title: isZh ? 'QR 分解' : 'QR Decomposition',
      desc: isZh ? 'A = Q·R (格拉姆-施密特正交化)' : 'A = Q·R (Gram-Schmidt orthogonalization)',
      color: 'from-indigo-600 to-violet-500'
    },
    {
      num: '0.6.4',
      href: '/chapters/0-linear-algebra/6-factorizations/4-evd',
      title: isZh ? '特征值分解' : 'Eigendecomposition',
      desc: isZh ? 'A = QΛQᵀ (对称矩阵)' : 'A = QΛQᵀ (for symmetric matrices)',
      color: 'from-violet-500 to-purple-500'
    },
    {
      num: '0.6.5',
      href: '/chapters/0-linear-algebra/6-factorizations/5-svd',
      title: isZh ? '奇异值分解' : 'SVD',
      desc: isZh ? 'A = UΣVᵀ (任意矩阵)' : 'A = UΣVᵀ (for any matrix)',
      color: 'from-purple-500 to-fuchsia-500'
    },
  ]

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <span className="text-sm font-bold text-indigo-600">0.6</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? '矩阵分解' : 'Matrix Factorizations'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh
              ? '五种基本分解方法，是理解 PCA 和降维的数学基础。'
              : 'Five fundamental factorization methods — the mathematical foundation for understanding PCA and dimensionality reduction.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {factors.map((f) => (
            <Link
              key={f.num}
              href={f.href}
              className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              <div className={`h-1 bg-gradient-to-r ${f.color}`}></div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-indigo-600">{f.num}</span>
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {f.title}
                    </h3>
                  </div>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
                <span className="text-indigo-400 group-hover:text-indigo-600 transition-colors text-xl">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/6-factorizations" />

      
      </div>
    </div>
  )
}