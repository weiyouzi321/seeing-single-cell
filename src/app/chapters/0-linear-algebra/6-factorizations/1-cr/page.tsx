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
          <span className="text-sm font-bold text-indigo-600">0.6.1</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? 'CR 分解' : 'CR Decomposition'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh ? 'A = C·R，其中 C 包含线性无关列，R 是行简化阶梯形。' : 'A = C·R, where C contains independent columns and R is row-reduced echelon form.'}
          </p>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <p className="text-gray-700 leading-relaxed">
            {isZh ? 'CR 分解是理解矩阵列空间的基础。C 的列是 A 的主元列，R 描述了如何用这些主元列组合出 A 的所有列。' : 'CR decomposition is the foundation for understanding column space. Columns of C are the pivot columns of A; R describes how to combine them to get all columns of A.'}
          </p>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/6-factorizations/1-cr" />

      
      </div>
    </div>
  )
}