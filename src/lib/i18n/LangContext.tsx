'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import translations from './translations.json'

type Lang = 'en' | 'zh'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const saved = localStorage.getItem('ssc-lang') as Lang
    if (saved === 'en' || saved === 'zh') setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('ssc-lang', l)
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let obj: any = translations[lang]
    for (const k of keys) {
      if (obj && typeof obj === 'object' && k in obj) {
        obj = obj[k]
      } else {
        return key
      }
    }
    return typeof obj === 'string' ? obj : key
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
