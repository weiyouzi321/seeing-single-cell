'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'

interface NavItem {
  num: string
  href: string
  zh: string
  en: string
}

const NAV: NavItem[] = [
  { num: '0.1', href: '/chapters/0-linear-algebra/1-matrix-views', zh: '矩阵视角', en: 'Matrix Views' },
  { num: '0.2', href: '/chapters/0-linear-algebra/2-vector-products', zh: '向量乘法', en: 'Vector Products' },
  { num: '0.3', href: '/chapters/0-linear-algebra/3-matrix-vector', zh: '矩阵×向量', en: 'Matrix × Vector' },
  { num: '0.4', href: '/chapters/0-linear-algebra/4-matrix-matrix', zh: '矩阵×矩阵', en: 'Matrix × Matrix' },
  { num: '0.5', href: '/chapters/0-linear-algebra/5-patterns', zh: '实用模式', en: 'Patterns' },
  { num: '0.6', href: '/chapters/0-linear-algebra/6-factorizations', zh: '矩阵分解', en: 'Factorizations' },
  { num: '0.6.1', href: '/chapters/0-linear-algebra/6-factorizations/1-cr', zh: 'CR 分解', en: 'CR' },
  { num: '0.6.2', href: '/chapters/0-linear-algebra/6-factorizations/2-lu', zh: 'LU 分解', en: 'LU' },
  { num: '0.6.3', href: '/chapters/0-linear-algebra/6-factorizations/3-qr', zh: 'QR 分解', en: 'QR' },
  { num: '0.6.4', href: '/chapters/0-linear-algebra/6-factorizations/4-evd', zh: '特征值分解', en: 'EVD' },
  { num: '0.6.5', href: '/chapters/0-linear-algebra/6-factorizations/5-svd', zh: 'SVD', en: 'SVD' },
]

export default function LaChapterNav({ currentHref }: { currentHref: string }) {
  const { lang } = useLang()
  const isZh = lang === 'zh'

  const idx = NAV.findIndex(n => n.href === currentHref)
  const prev = idx > 0 ? NAV[idx - 1] : null
  const next = idx >= 0 && idx < NAV.length - 1 ? NAV[idx + 1] : null
  const current = idx >= 0 ? NAV[idx] : null

  // Parent link for sub-chapters (0.6.x -> 0.6)
  const parent = current?.num.startsWith('0.6.') && current.num !== '0.6'
    ? NAV.find(n => n.num === '0.6')
    : null

  return (
    <nav className="mt-10 pt-6 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Prev */}
        {prev ? (
          <Link
            href={prev.href}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <span className="text-indigo-500">←</span>
            <div className="text-left">
              <div className="text-xs text-gray-400">{isZh ? '上一节' : 'Previous'}</div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                {prev.num} · {isZh ? prev.zh : prev.en}
              </div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {/* Center: parent / home */}
        <div className="flex items-center gap-3">
          {parent && (
            <Link
              href={parent.href}
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {isZh ? '← 返回 ' + parent.zh : '← Back to ' + parent.en}
            </Link>
          )}
          <Link
            href="/chapters/0-linear-algebra"
            className="text-sm text-gray-400 hover:text-indigo-500 transition-colors"
          >
            {isZh ? '目录' : 'Contents'}
          </Link>
        </div>

        {/* Next */}
        {next ? (
          <Link
            href={next.href}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="text-right">
              <div className="text-xs text-gray-400">{isZh ? '下一节' : 'Next'}</div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                {next.num} · {isZh ? next.zh : next.en}
              </div>
            </div>
            <span className="text-indigo-500">→</span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </nav>
  )
}
