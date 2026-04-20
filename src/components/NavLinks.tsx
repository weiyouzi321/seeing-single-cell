'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n/LangContext'

export default function NavLinks() {
  const { t } = useLang()
  return (
    <>
      <Link href="/" className="hover:text-[#4361ee] transition-colors">
        {t('nav.home')}
      </Link>
      <Link href="/chapters/1-matrix" className="hover:text-[#4361ee] transition-colors">
        {t('nav.ch1')}
      </Link>
      <Link href="/chapters/2-distribution" className="hover:text-[#4361ee] transition-colors">
        {t('nav.ch2')}
      </Link>
      <Link href="/chapters/3-preprocessing" className="hover:text-[#4361ee] transition-colors">
        {t('nav.ch3')}
      </Link>
    </>
  )
}
