'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'

interface ChapterItem {
  href: string
  labelZh: string
  labelEn: string
}

interface ChapterGroup {
  labelZh: string
  labelEn: string
  color: string
  items: ChapterItem[]
}

const chapterGroups: ChapterGroup[] = [
  {
    labelZh: '线性代数',
    labelEn: 'Linear Algebra',
    color: 'from-indigo-500 to-purple-500',
    items: [
      { href: '/chapters/0-linear-algebra', labelZh: '0 · 线性代数', labelEn: '0 · Linear Algebra' },
      { href: '/chapters/0-linear-algebra/1-matrix-views', labelZh: '0.1 · 矩阵视角', labelEn: '0.1 · Matrix Views' },
      { href: '/chapters/0-linear-algebra/2-vector-products', labelZh: '0.2 · 向量乘法', labelEn: '0.2 · Vector Products' },
      { href: '/chapters/0-linear-algebra/3-matrix-vector', labelZh: '0.3 · 矩阵×向量', labelEn: '0.3 · Matrix × Vector' },
      { href: '/chapters/0-linear-algebra/4-matrix-matrix', labelZh: '0.4 · 矩阵×矩阵', labelEn: '0.4 · Matrix × Matrix' },
      { href: '/chapters/0-linear-algebra/5-patterns', labelZh: '0.5 · 实用模式', labelEn: '0.5 · Patterns' },
      { href: '/chapters/0-linear-algebra/6-factorizations', labelZh: '0.6 · 矩阵分解', labelEn: '0.6 · Factorizations' },
    ],
  },
  {
    labelZh: '基础分析',
    labelEn: 'Basic Analysis',
    color: 'from-blue-500 to-cyan-500',
    items: [
      { href: '/chapters/1-matrix', labelZh: '1 · 表达矩阵', labelEn: '1 · Matrix' },
      { href: '/chapters/2-distribution', labelZh: '2 · 质控与过滤', labelEn: '2 · QC' },
      { href: '/chapters/3-preprocessing', labelZh: '3 · 预处理三部曲', labelEn: '3 · Preprocessing' },
      { href: '/chapters/4-pca', labelZh: '4 · PCA降维', labelEn: '4 · PCA' },
      { href: '/chapters/5-knn', labelZh: '5 · KNN聚类', labelEn: '5 · Clustering' },
      { href: '/chapters/6-dimred', labelZh: '6 · t-SNE & UMAP', labelEn: '6 · Visualization' },
    ],
  },
  {
    labelZh: '高级分析',
    labelEn: 'Advanced Analysis',
    color: 'from-rose-500 to-orange-500',
    items: [
      { href: '/chapters/7-integration', labelZh: '7 · 批次整合', labelEn: '7 · Batch Integration' },
      { href: '/chapters/8-deg', labelZh: '8 · 差异表达分析', labelEn: '8 · Differential Expression' },
    ],
  },
]

function DropdownGroup({ group, lang, onItemClick }: {
  group: ChapterGroup
  lang: 'en' | 'zh'
  onItemClick: () => void
}) {
  const label = lang === 'zh' ? group.labelZh : group.labelEn

  return (
    <div className="min-w-[180px]">
      <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${group.color} bg-clip-text text-transparent`}
           role="presentation">
        {label}
      </div>
      <div className="py-1" role="group" aria-label={label}>
        {group.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            role="menuitem"
            className="block px-4 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors rounded-sm mx-1"
          >
            {lang === 'zh' ? item.labelZh : item.labelEn}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function NavLinks() {
  const { lang, t } = useLang()
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setChaptersOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setChaptersOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setChaptersOpen(false), 200)
  }

  const closeAll = () => {
    setChaptersOpen(false)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1">
        {/* 首页 */}
        <Link
          href="/"
          className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#4361ee] dark:hover:text-[#4361ee] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {lang === 'zh' ? '首页' : 'Home'}
        </Link>

        {/* 访问统计 */}
        <Link
          href="/analytics"
          className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#7c3aed] dark:hover:text-[#7c3aed] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          {lang === 'zh' ? '🌍 访问统计' : '🌍 Analytics'}
        </Link>

        {/* 章节 (Mega Dropdown) */}
        <div
          ref={dropdownRef}
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg
              ${chaptersOpen
                ? 'text-[#4361ee] bg-gray-50 dark:bg-slate-800'
                : 'text-gray-600 dark:text-gray-300 hover:text-[#4361ee] dark:hover:text-[#4361ee] hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            aria-label={lang === 'zh' ? '章节导航' : 'Chapter navigation'}
            aria-expanded={chaptersOpen}
            aria-haspopup="true"
          >
            {lang === 'zh' ? '章节' : 'Chapters'}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${chaptersOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {chaptersOpen && (
            <div
              className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-3 z-50 animate-fade-in-up"
              style={{ minWidth: '580px' }}
              role="menu"
              aria-label={lang === 'zh' ? '章节列表' : 'Chapter list'}
            >
              <div className="flex gap-2 px-2">
                {chapterGroups.map((group) => (
                  <DropdownGroup
                    key={group.labelEn}
                    group={group}
                    lang={lang}
                    onItemClick={closeAll}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 overflow-y-auto animate-fade-in-up">
          <div className="p-4 space-y-6">
            {/* 首页 */}
            <Link
              href="/"
              onClick={closeAll}
              className="block px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {lang === 'zh' ? '🏠 首页' : '🏠 Home'}
            </Link>

            {/* 访问统计 */}
            <Link
              href="/analytics"
              onClick={closeAll}
              className="block px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              {lang === 'zh' ? '🌍 访问统计' : '🌍 Analytics'}
            </Link>

            {/* 章节分组 */}
            {chapterGroups.map((group) => {
              const groupLabel = lang === 'zh' ? group.labelZh : group.labelEn
              return (
                <div key={group.labelEn}>
                  <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${group.color} bg-clip-text text-transparent`}>
                    {groupLabel}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeAll}
                        className="block px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {lang === 'zh' ? item.labelZh : item.labelEn}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}