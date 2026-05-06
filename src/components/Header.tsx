\`use client\`

import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { useState } from 'react'

const navItems = [
  { name: '首页', href: '/' },
  {
    name: '目录',
    href: '#',
    children: [
      {
        name: '基础分析',
        children: [
          { name: '矩阵', href: '/chapters/1-matrix' },
          { name: '分布', href: '/chapters/2-distribution' },
          { name: '预处理', href: '/chapters/3-preprocessing' },
        ],
      },
      {
        name: '线代基础',
        children: [
          { name: '线性代数', href: '/chapters/0-linear-algebra' },
        ],
      },
      {
        name: '高级分析',
        children: [
          { name: 'PCA', href: '/chapters/4-pca' },
          { name: 'KNN', href: '/chapters/5-knn' },
          { name: '维度约约', href: '/chapters/6-dimred' },
          { name: '集成分析', href: '/chapters/7-integration' },
        ],
      },
    ],
  },
  { name: '中文', href: '/i18n' },
]

function Dropdown({ children, menu }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative group">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
      >
        {children}
        <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-900 shadow-lg rounded-b-lg ring-1 ring-black ring-opacity-5 z-10">
          {menu.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-2xl">🔬</span>
          <span className="text-xl font-semibold">Seeing Single-Cell</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <Dropdown key={item.name} menu={item.children}>
                  {item.name}
                </Dropdown>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <ThemeToggle className="ml-4" />

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden h-8 w-8 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-blue-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 border-t border-gray-100 dark:border-slate-800 animate-fade-in-up">
          <div className="flex flex-col gap-2 px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
