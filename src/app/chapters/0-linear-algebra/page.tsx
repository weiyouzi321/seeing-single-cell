'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'  // 复用全局语言切换

// 导入线性代数章节的 i18n
import laEn from '@/lib/i18n/linear-algebra/en.json'
import laZh from '@/lib/i18n/linear-algebra/zh.json'

export default function LinearAlgebraHome() {
  const { lang } = useLang()
  const t = (key: string): string => {
    const dict = lang === 'zh' ? laZh : laEn
    const keys = key.split('.')
    let obj: any = dict
    for (const k of keys) {
      if (obj && typeof obj === 'object' && k in obj) obj = obj[k]
      else return key
    }
    return typeof obj === 'string' ? obj : key
  }

  const chapters = [
    {
      num: '0.1',
      href: '/chapters/0-linear-algebra/1-matrix-views',
      titleKey: 'chapters.ch1.title',
      descKey: 'chapters.ch1.desc',
      keywords: lang === 'zh'
        ? ['表格视角', '列向量', '行向量']
        : ['Table View', 'Column Vectors', 'Row Vectors'],
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      num: '0.2',
      href: '/chapters/0-linear-algebra/2-vector-products',
      titleKey: 'chapters.ch2.title',
      descKey: 'chapters.ch2.desc',
      keywords: lang === 'zh'
        ? ['点积', '外积', '秩-1矩阵']
        : ['Dot Product', 'Outer Product', 'Rank-1 Matrix'],
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      num: '0.3',
      href: '/chapters/0-linear-algebra/3-matrix-vector',
      titleKey: 'chapters.ch3.title',
      descKey: 'chapters.ch3.desc',
      keywords: lang === 'zh'
        ? ['行点积', '线性组合', '矩阵×向量']
        : ['Row Dot Products', 'Linear Combination', 'Matrix × Vector'],
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      num: '0.4',
      href: '/chapters/0-linear-algebra/4-matrix-matrix',
      titleKey: 'chapters.ch4.title',
      descKey: 'chapters.ch4.desc',
      keywords: lang === 'zh'
        ? ['元素视角', '列视角', '点积视角']
        : ['Element-wise', 'Column View', 'Dot Product View'],
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      num: '0.5',
      href: '/chapters/0-linear-algebra/5-patterns',
      titleKey: 'chapters.ch5.title',
      descKey: 'chapters.ch5.desc',
      keywords: lang === 'zh'
        ? ['对角缩放', '特征值模式', '实用技巧']
        : ['Diagonal Scaling', 'Eigenvalue Patterns', 'Useful Tricks'],
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      num: '0.6',
      href: '/chapters/0-linear-algebra/6-factorizations',
      titleKey: 'chapters.ch6.title',
      descKey: 'chapters.ch6.desc',
      keywords: lang === 'zh'
        ? ['CR分解', 'LU分解', 'QR分解', 'EVD', 'SVD']
        : ['CR', 'LU', 'QR', 'EVD', 'SVD'],
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <section className="pt-16 pb-12 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-indigo-600 mb-4">
          {t('home.tagline')}
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
            {t('home.title')}
          </span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          {lang === 'zh' ? (
            <>
              用可视化交互探索矩阵运算的核心概念。<br />
              通过亲手操作建立对向量、矩阵和分解的直观理解。<br />
              <strong className="text-gray-700 text-lg">掌握 PCA 及其他降维技术的数学基础。</strong>
            </>
          ) : (
            <>
              An interactive visual exploration of matrix operations.<br />
              Build intuition for vectors, matrices, and decompositions through hands-on interaction.<br />
              <strong className="text-gray-700 text-lg">Master the math behind PCA and other dimensionality reduction.</strong>
            </>
          )}
        </p>
      </section>

      {/* Chapters Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('chapters.title')}</h2>
        <p className="text-gray-500 mb-8">
          {lang === 'zh'
            ? '建议按顺序学习，逐步建立知识体系'
            : 'Recommended to learn sequentially for best understanding'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((ch) => (
            <Link
              key={ch.num}
              href={ch.href}
              className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className={`h-2 bg-gradient-to-r ${ch.color}`}></div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-bold text-indigo-600">{ch.num}</span>
                  <h3 className="text-xl font-semibold text-gray-800">{t(ch.titleKey)}</h3>
                </div>
                <p className="text-gray-600 mb-4">{t(ch.descKey)}</p>
                <div className="flex flex-wrap gap-2">
                  {ch.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-indigo-600 font-medium text-sm flex items-center gap-1">
                  {lang === 'zh' ? '开始学习 →' : 'Start learning →'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          {t('footerBuilt')} • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
