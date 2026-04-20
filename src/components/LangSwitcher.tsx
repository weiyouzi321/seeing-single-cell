'use client'

import { useLang } from '@/lib/i18n/LangContext'

export default function LangSwitcher() {
  const { lang, setLang, t } = useLang()

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className="px-3 py-1 rounded-lg text-sm font-semibold transition-all
                 bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800
                 border border-gray-200"
      title={lang === 'en' ? 'Switch to Chinese' : 'Switch to English'}
    >
      {t('langSwitch')}
    </button>
  )
}
