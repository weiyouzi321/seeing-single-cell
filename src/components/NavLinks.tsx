'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'

export default function NavLinks() {
  const { t, lang } = useLang()
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200)
  }

  const chapters = [
    { href: '/chapters/1-matrix', label: t('nav.ch1') },
    { href: '/chapters/2-distribution', label: t('nav.ch2') },
    { href: '/chapters/3-preprocessing', label: t('nav.ch3') },
    { href: '/chapters/4-pca', label: t('nav.ch4') },
    { href: '/chapters/5-knn', label: t('nav.ch5') },
    { href: '/chapters/6-dimred', label: t('nav.ch6') },
  ]

  return (
    <>
      <Link href="/" className="hover:text-[#4361ee] transition-colors">{t('nav.home')}</Link>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button className="hover:text-[#4361ee] transition-colors flex items-center gap-1">
          {lang === 'zh' ? '基础分析' : 'Basic Analysis'}
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
            {chapters.map((ch, i) => (
              <Link
                key={ch.href}
                href={ch.href}
                className="block px-4 py-2 text-sm text-gray-600 hover:text-[#4361ee] hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <span className="text-gray-400 mr-2">{String(i + 1).padStart(2, '0')}</span>
                {ch.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
