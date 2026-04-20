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
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t('home.subtitle')}{' '}
          <strong className="text-gray-700">{t('home.subtitleBold')}</strong>
          <br />
          {t('home.subtitleEnd')}
        </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              ? '识别并去除低质量细胞——空液滴、破损细胞和双胞体。'
              : 'Identify and remove low-quality cells — empty droplets, damaged cells, and doublets.'}
            concepts={[lang === 'zh' ? 'nCount' : 'nCount', lang === 'zh' ? 'nFeature' : 'nFeature', lang === 'zh' ? '%mito' : '%mito']}
            href="/chapters/2-distribution"
            color="from-[#ef4444] to-[#f87171]"
            lang={lang} t={t}
          />
          <ChapterCard
            number="03"
            title={t('ch3.title')}
            lang={lang} t={t}
            description={t('ch3.subtitle') + ' ' + t('ch3.subtitleNorm') + ', ' + t('ch3.subtitleHVG') + ', ' + t('ch3.subtitleScale') + '. ' + t('ch3.subtitleEnd')}
            concepts={[t('home.ch3Kw1'), t('home.ch3Kw2'), t('home.ch3Kw3')]}
            href="/chapters/3-preprocessing"
            color="from-[#10b981] to-[#34d399]"
          />
          <ChapterCard
            number="04"
            title={t('home.ch4Title')}
            description={t('home.ch4Desc')}
            concepts={['PCA', 't-SNE', 'UMAP']}
            href="#"
            color="from-[#f59e0b] to-[#fbbf24]"
            comingSoon
            lang={lang} t={t}
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 border-t border-gray-100 mt-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">{t('home.howTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="text-3xl mb-3">{'👆'}</div>
              <h3 className="font-semibold mb-1">{t('home.interact')}</h3>
              <p className="text-sm text-gray-500">{t('home.interactDesc')}</p>
            </div>
            <div>
              <div className="text-3xl mb-3">{'📖'}</div>
              <h3 className="font-semibold mb-1">{t('home.read')}</h3>
              <p className="text-sm text-gray-500">{t('home.readDesc')}</p>
            </div>
            <div>
              <div className="text-3xl mb-3">{'🧪'}</div>
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
          {(lang === "zh" ? t("home.chapterLabel") + number + "章" : t("home.chapterLabel") + " " + number)}
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

  const cls = `group block p-6 bg-white rounded-2xl border border-gray-100 
               shadow-sm transition-all duration-200
               ${comingSoon ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-1 hover:border-gray-200'}`

  if (comingSoon) {
    return <div className={cls}>{cardContent}</div>
  }
  return <Link href={href} className={cls}>{cardContent}</Link>
}
