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
          <span className="text-sm font-bold text-indigo-600">0.6.3</span>
          <h1 className="text-3xl font-bold text-gray-800 mt-2">
            {isZh ? 'QR 分解' : 'QR Decomposition'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isZh ? 'A = Q·R，Q 是正交矩阵，R 是上三角矩阵。' : 'A = Q·R, where Q is orthogonal and R is upper triangular.'}
          </p>
        </div>

        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
          <p className="text-gray-700 leading-relaxed">
            {isZh ? 'QR 分解通过格拉姆-施密特正交化实现。Q 的列是一组标准正交基，R 记录了原始列在这组基下的坐标。在最小二乘问题中广泛使用。' : 'QR decomposition is achieved via Gram-Schmidt orthogonalization. Columns of Q form an orthonormal basis; R records the coordinates of original columns in this basis. Widely used in least squares problems.'}
          </p>
        </div>

        <LaChapterNav currentHref="/chapters/0-linear-algebra/6-factorizations/3-qr" />

      
      </div>
    </div>
  )
}