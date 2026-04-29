'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'

export default function NavLinks() {
  const { t, lang } = useLang()
  const [openBasic, setOpenBasic] = useState(false)
  const [openLA, setOpenLA] = useState(false)
  const timeoutBasic = useRef<NodeJS.Timeout | null>(null)
  const timeoutLA = useRef<NodeJS.Timeout | null>(null)

  const basicChapters = [
    { href: '/chapters/1-matrix', label: t('nav.ch1') },
    { href: '/chapters/2-distribution', label: t('nav.ch2') },
    { href: '/chapters/3-preprocessing', label: t('nav.ch3') },
    { href: '/chapters/4-pca', label: t('nav.ch4') },
    { href: '/chapters/5-knn', label: t('nav.ch5') },
    { href: '/chapters/6-dimred', label: t('nav.ch6') },
  ]

  const laChapters = [
    { href: '/chapters/0-linear-algebra', label: lang === 'zh' ? '0 · 线性代数' : '0 · Linear Algebra' },
    { href: '/chapters/0-linear-algebra/1-matrix-views', label: lang === 'zh' ? '0.1 · 矩阵视角' : '0.1 · Matrix Views' },
    { href: '/chapters/0-linear-algebra/2-vector-products', label: lang === 'zh' ? '0.2 · 向量乘法' : '0.2 · Vector Products' },
    { href: '/chapters/0-linear-algebra/3-matrix-vector', label: lang === 'zh' ? '0.3 · 矩阵×向量' : '0.3 · Matrix × Vector' },
    { href: '/chapters/0-linear-algebra/4-matrix-matrix', label: lang === 'zh' ? '0.4 · 矩阵×矩阵' : '0.4 · Matrix × Matrix' },
    { href: '/chapters/0-linear-algebra/5-patterns', label: lang === 'zh' ? '0.5 · 实用模式' : '0.5 · Patterns' },
    { href: '/chapters/0-linear-algebra/6-factorizations', label: lang === 'zh' ? '0.6 · 矩阵分解' : '0.6 · Factorizations' },
  ]
  const [openAdv, setOpenAdv] = useState(false)
  const timeoutAdv = useRef<NodeJS.Timeout | null>(null)


  return (
    <>
          {/* Advanced Analysis dropdown */}
      <div
        className="relative"
        onMouseEnter={() => { if (timeoutAdv.current) clearTimeout(timeoutAdv.current); setOpenAdv(true) }}
        onMouseLeave={() => { timeoutAdv.current = setTimeout(() => setOpenAdv(false), 200) }}
      >
        <button className="hover:text-teal-600 transition-colors flex items-center gap-1">
          {t('nav.advanced')}
          <svg className={`w-3 h-3 transition-transform ${openAdv ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openAdv && (
          <div className="absolute top-full left-1/2 -translate-x-1/0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            <Link
              href="/chapters/7-integration"
              className="block px-4 py-2 text-sm text-gray-600 hover:text-teal-600 hover:bg-gray-50 transition-colors"
              onClick={() => setOpenAdv(false)}
            >
              <span className="text-gray-400 mr-2">7</span>
              {t('nav.ch7')}
            </Link>
            <Link
              href="/chapters/8-de"
              className="block px-4 py-2 text-sm text-gray-600 hover:text-teal-600 hover:bg-gray-50 transition-colors"
              onClick={() => setOpenAdv(false)}
            >
              <span className="text-gray-400 mr-2">8</span>
              {t('nav.ch8')}
            </Link>
          </div>
        )}
      </div>

  <Link href="/" className="hover:text-[#4361ee] transition-colors">{t('nav.home')}</Link>
      <div
        className="relative"
        onMouseEnter={() => { if (timeoutBasic.current) clearTimeout(timeoutBasic.current); setOpenBasic(true) }}
        onMouseLeave={() => { timeoutBasic.current = setTimeout(() => setOpenBasic(false), 200) }}
      >
        <button className="hover:text-[#4361ee] transition-colors flex items-center gap-1">
          {lang === 'zh' ? '基础分析' : 'Basic Analysis'}
          <svg className={`w-3 h-3 transition-transform ${openBasic ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openBasic && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            {basicChapters.map((ch, i) => (
              <Link
                key={ch.href}
                href={ch.href}
                className="block px-4 py-2 text-sm text-gray-600 hover:text-[#4361ee] hover:bg-gray-50 transition-colors"
                onClick={() => setOpenBasic(false)}
              >
                <span className="text-gray-400 mr-2">{String(i + 1).padStart(2, '0')}</span>
                {ch.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div
        className="relative"
        onMouseEnter={() => { if (timeoutLA.current) clearTimeout(timeoutLA.current); setOpenLA(true) }}
        onMouseLeave={() => { timeoutLA.current = setTimeout(() => setOpenLA(false), 200) }}
      >
        <button className="hover:text-[#6366f1] transition-colors flex items-center gap-1 text-indigo-500">
          {lang === 'zh' ? '线性代数' : 'Linear Algebra'}
          <svg className={`w-3 h-3 transition-transform ${openLA ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openLA && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            {laChapters.map((ch) => (
              <Link
                key={ch.href}
                href={ch.href}
                className="block px-4 py-2 text-sm text-gray-600 hover:text-[#6366f1] hover:bg-gray-50 transition-colors"
                onClick={() => setOpenLA(false)}
              >
                {ch.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
