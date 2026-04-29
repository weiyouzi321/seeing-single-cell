'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'

export default function Home() {
  const { t, lang } = useLang()

  return (
    <div>
      {/* Hero */}
      <section className="pt-16 pb-12 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-[#7c3aed] mb-4">
          {t('home.tagline')}
        </p>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          <span className="bg-gradient-to-r from-[#4361ee] via-[#7c3aed] to-[#4361ee] bg-clip-text text-transparent">
            {t('home.title')}
          </span>
        </h1>
        {lang === 'zh' ? (
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            用可视化交互探索单细胞RNA测序分析。<br />
            在生物场景中理解数学和算法原理。<br />
            <strong className="text-gray-700 text-lg">看懂每一行代码背后的逻辑。</strong>
          </p>
        ) : (
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            An interactive visual exploration of scRNA-seq analysis.<br />
            <strong className="text-gray-700 text-lg">Understand the mathematics and algorithm behind biology.</strong><br />
            See the logic behind every line of code.
          </p>
        )}
        <div className="flex justify-center gap-4">
          <Link
            href="/chapters/1-matrix"
            className="px-6 py-3 rounded-xl bg-[#4361ee] text-white font-semibold 
                       hover:bg-[#3651d4] transition-all shadow-md hover:shadow-lg 
                       hover:-translate-y-0.5"
          >
            {t('home.startBtn')}
          </Link>
          <a
            href="#chapters"
            className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold
                       hover:border-[#4361ee] hover:text-[#4361ee] transition-all"
          >
            {t('home.browseBtn')}
          </a>
        </div>
      </section>

      {/* Chapters */}
      <section id="chapters" className="py-12">
        <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-8 text-center">
          {t('home.chaptersTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChapterCard
            number="01"
            title={t('ch1.title')}
            description={t('ch1.subtitle')}
            concepts={[t('home.ch1Kw1'), t('home.ch1Kw2'), t('home.ch1Kw3')]}
            href="/chapters/1-matrix"
            color="from-[#4361ee] to-[#3b82f6]"
            lang={lang} t={t}
          />
          <ChapterCard
            number="02"
            title={lang === 'zh' ? '质控与过滤' : 'Quality Control'}
            description={lang === 'zh'
              ? '识别并去除低质量细胞——空液滴、破损细胞和双胞体。基于nCount、nFeature和线粒体比例进行过滤。'
              : 'Identify and remove low-quality cells — empty droplets, damaged cells, and doublets. Filter based on nCount, nFeature, and mitochondrial percentage.'}
            concepts={[lang === 'zh' ? 'nCount' : 'nCount', lang === 'zh' ? 'nFeature' : 'nFeature', lang === 'zh' ? 'percent_mt' : 'percent_mt']}
            href="/chapters/2-distribution"
            color="from-[#ef4444] to-[#f87171]"
            lang={lang} t={t}
          />
          <ChapterCard
            number="03"
            title={t('ch3.title')}
            description={lang === 'zh'
              ? '聚类和可视化之前，scRNA-seq数据需要经过三个关键预处理步骤。'
              : 'Before clustering and visualization, scRNA-seq data goes through three essential preprocessing steps.'}
            concepts={[lang === 'zh' ? '\u5BF9\u6570\u6807\u51C6\u5316' : 'LogNormalize', lang === 'zh' ? '\u9AD8\u53D8\u57FA\u56E0' : 'HVG', lang === 'zh' ? 'Z-score' : 'ScaleData']}
            href="/chapters/3-preprocessing"
            color="from-[#10b981] to-[#34d399]"
            lang={lang} t={t}
          />
          <ChapterCard
            number="04"
            title={t('ch4.title')}
            description={t('ch4.subtitle')}
            concepts={[t('home.ch4Kw1') || 'PCA', t('home.ch4Kw2') || 'Variance', t('home.ch4Kw3') || 'Eigenvectors']}
            href="/chapters/4-pca"
            color="from-[#f59e0b] to-[#fbbf24]"
            lang={lang} t={t}
          />
          <ChapterCard
            number="05"
            title={t('home.ch5Title')}
            description={t('home.ch5Desc')}
            concepts={[t('home.ch5Kw1'), t('home.ch5Kw2'), t('home.ch5Kw3')]}
            href="/chapters/5-knn"
            color="from-[#8b5cf6] to-[#a78bfa]"
            lang={lang} t={t}
          />
          <ChapterCard
            number="06"
            title={t('home.ch6Title')}
            description={t('home.ch6Desc')}
            concepts={[t('home.ch6Kw1'), t('home.ch6Kw2'), t('home.ch6Kw3')]}
            href="/chapters/6-dimred"
            color="from-[#ec4899] to-[#f472b6]"
            lang={lang} t={t}
          />
          {/* Advanced Analysis Entry Card */}
          <div className="group relative block p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-teal-400 hover:shadow-xl transition-all duration-200 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-200 to-emerald-200 rounded-full blur-2xl opacity-30 -mr-8 -mt-8"></div>
            <div className="flex items-center gap-2 mb-3 relative">
              <span className="text-2xl">🚀</span>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                {lang === 'zh' ? '新增' : 'New'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
              {lang === 'zh' ? '高级分析' : 'Advanced Analysis'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              {lang === 'zh'
                ? '批次整合、差异表达分析等进阶单细胞分析方法。'
                : 'Advanced scRNA-seq methods: integration, differential expression, and more.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {['Integration', 'DE', 'Trajectory'].map((kw, i) => (
                <span key={i} className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                  {lang === 'zh' ? {'Integration':'批次整合','DE':'差异表达','Trajectory':'轨迹推断'}[kw] : kw}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <span className="text-sm text-teal-600 font-medium group-hover:underline">
                {lang === 'zh' ? '使用上方导航 →' : 'Explore in navigation above →'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="py-12 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-sm font-semibold tracking-widest uppercase text-gray-400 mb-2 text-center">
            {lang === 'zh' ? '先修章节' : 'Prerequisites'}
          </h2>
          <p className="text-center text-gray-500 mb-8 text-sm">
            {lang === 'zh'
              ? '开始单细胞分析之前，建议先掌握以下基础'
              : 'Recommended foundations before diving into single-cell analysis'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Linear Algebra */}
            <Link
              href="/chapters/0-linear-algebra"
              className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {lang === 'zh' ? '内置' : 'Built-in'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {lang === 'zh' ? '线性代数基础' : 'Linear Algebra Fundamentals'}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {lang === 'zh'
                    ? '矩阵运算、向量乘法、特征值分解与 SVD —— PCA 和降维的数学基础。'
                    : 'Matrix operations, vector products, eigendecomposition & SVD — the math behind PCA and dimensionality reduction.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Matrix', 'Vector', 'PCA', 'SVD'].map((kw) => (
                    <span key={kw} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            </Link>

            {/* Probability & Statistics */}
            <a
              href="https://seeing-theory.brown.edu/"
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {lang === 'zh' ? '外部' : 'External'}
                  </span>
                  <span className="text-xs text-gray-400">↗</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-amber-600 transition-colors">
                  {lang === 'zh' ? '概率论与数理统计' : 'Probability & Statistics'}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {lang === 'zh'
                    ? '交互式可视化理解概率分布、贝叶斯推断和统计检验 —— 单细胞数据分析的统计基础。'
                    : 'Interactive visualizations of probability distributions, Bayesian inference, and statistical testing.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Distribution', 'Bayesian', 'Hypothesis Testing'].map((kw) => (
                    <span key={kw} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            </a>

            {/* Seurat Tutorial */}
            <a
              href="https://satijalab.org/seurat/articles/pbmc3k_tutorial.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {lang === 'zh' ? '外部' : 'External'}
                  </span>
                  <span className="text-xs text-gray-400">↗</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                  {lang === 'zh' ? 'Seurat 教程' : 'Seurat Tutorial'}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {lang === 'zh'
                    ? 'R 语言单细胞 RNA-seq 数据分析的标准流程：质控、归一化、聚类与可视化。'
                    : 'The standard R workflow for scRNA-seq analysis: QC, normalization, clustering, and visualization.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['R', 'Seurat', 'scRNA-seq'].map((kw) => (
                    <span key={kw} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-gray-100 mt-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">{t('home.howTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="text-3xl mb-3">☝️</div>
              <h3 className="font-semibold mb-1">{t('home.interact')}</h3>
              <p className="text-sm text-gray-500">{t('home.interactDesc')}</p>
            </div>
            <div>
              <div className="text-3xl mb-3">📖</div>
              <h3 className="font-semibold mb-1">{t('home.read')}</h3>
              <p className="text-sm text-gray-500">{t('home.readDesc')}</p>
            </div>
            <div>
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="font-semibold mb-1">{t('home.experiment')}</h3>
              <p className="text-sm text-gray-500">{t('home.experimentDesc')}</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

function ChapterCard({
  number,
  title,
  description,
  concepts,
  href,
  color,
  comingSoon,
  lang,
  t,
}: {
  number: string
  title: string
  description: string
  concepts: string[]
  href: string
  color: string
  comingSoon?: boolean
  lang: string
  t: (key: string) => string
}) {
  const cardContent = (
    <>
      <div className="flex items-start justify-between mb-4">
        <span className={`inline-block px-3 py-1 rounded-lg bg-gradient-to-r ${color} text-white text-xs font-bold`}>
          {lang === 'zh' ? '\u7B2C' + number + '\u7AE0' : t('home.chapterLabel') + ' ' + number}
        </span>
        {comingSoon && (
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
            {t('home.comingSoon')}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-[#4361ee] transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">
        {concepts.map((c) => (
          <span
            key={c}
            className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full"
          >
            {c}
          </span>
        ))}
      </div>
    </>
  )

  const cls = 'group block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-200' +
    (comingSoon ? ' opacity-60' : ' hover:shadow-md hover:-translate-y-1 hover:border-gray-200')

  if (comingSoon) {
    return <div className={cls}>{cardContent}</div>
  }
  return <Link href={href} className={cls}>{cardContent}</Link>
}
