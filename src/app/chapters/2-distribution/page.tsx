'use client'

import { useLang } from '@/lib/i18n/LangContext'
import Link from 'next/link'

export default function QCChapter() {
  const { t, lang } = useLang()

  return (
    <div>
      <div className="chapter-hero">
        <div className="breadcrumb">
          <Link href="/">{'Home'}</Link>
          <span>&gt;</span>
          <span>{lang === 'zh' ? '第2章：质控与过滤' : 'Chapter 2: Quality Control'}</span>
        </div>
        <h1>{lang === 'zh' ? '质控与过滤' : 'Quality Control & Filtering'}</h1>
        <p className="subtitle">
          {lang === 'zh'
            ? '在分析之前，我们需要识别并去除低质量细胞——空液滴、破损细胞和双胞体。'
            : 'Before analysis, we need to identify and remove low-quality cells — empty droplets, damaged cells, and doublets.'}
        </p>
      </div>

      <section className="mb-12">
        <div className="viz-card" style={{ 
          background: 'linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%)', 
          border: '1px solid #fecaca',
          textAlign: 'center',
          padding: '3rem 2rem'
        }}>
          <div className="text-6xl mb-6">🚧</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            {lang === 'zh' ? '正在开发中' : 'Coming Soon'}
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto mb-6">
            {lang === 'zh'
              ? '本章将包含三个QC指标（nCount、nFeature、%mito）的交互式可视化，支持固定阈值和MAD自适应两种过滤模式。'
              : 'This chapter will include interactive visualizations for three QC metrics (nCount, nFeature, %mito), with both fixed threshold and adaptive MAD-based filtering.'}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-white rounded-lg px-4 py-2 border border-red-200 shadow-sm text-sm">
              <span className="font-mono font-bold text-red-600">nCount</span>
              <div className="text-xs text-gray-400">{lang === 'zh' ? '总UMI数' : 'Total UMIs'}</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 border border-red-200 shadow-sm text-sm">
              <span className="font-mono font-bold text-red-600">nFeature</span>
              <div className="text-xs text-gray-400">{lang === 'zh' ? '检测基因数' : 'Detected genes'}</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 border border-red-200 shadow-sm text-sm">
              <span className="font-mono font-bold text-red-600">%mito</span>
              <div className="text-xs text-gray-400">{lang === 'zh' ? '线粒体比例' : 'Mitochondrial %'}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center py-8 border-t border-gray-100">
        <Link href="/chapters/1-matrix" className="text-gray-400 hover:text-[#4361ee] transition-colors">
          ← {lang === 'zh' ? '原始数据' : 'Raw Data'}
        </Link>
        <Link href="/chapters/3-preprocessing" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors shadow-sm">
          {lang === 'zh' ? '下一步：预处理三部曲 →' : 'Next: Preprocessing →'}
        </Link>
      </div>
    </div>
  )
}
