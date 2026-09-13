'use client'

/**
 * VisitorCounter — 不蒜子 (busuanzi.cc) 访问量统计
 *
 * 用法：放在根布局页脚，站点每页都会加载一次脚本并计数。
 * - 显示：本站总访问量 (site_pv) / 本站总访客数 (site_uv)
 * - 附带隐藏 span：今日访问 (today_pv) / 今日访客 (today_uv)，
 *   供 /analytics 页面读取（避免重复加载脚本导致重复计数）
 * - 优雅降级：脚本加载失败或超时未返回数据时整行隐藏，不留 "..."
 *
 * 官方文档: https://busuanzi.cc
 * 脚本: //cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js
 */

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n/LangContext'

const SCRIPT_SRC = 'https://cdn.busuanzi.cc/busuanzi/3.6.9/busuanzi.min.js'

export default function VisitorCounter() {
  const { lang } = useLang()
  const [ready, setReady] = useState(false)

  // Load the busuanzi script exactly once, after the spans are mounted.
  useEffect(() => {
    if (document.querySelector(`script[src^="${SCRIPT_SRC}"]`)) return
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    document.body.appendChild(s)
  }, [])

  // Reveal once the service has filled the spans (or hide forever on failure).
  useEffect(() => {
    const value = document.getElementById('busuanzi_site_pv')
    const check = () => {
      const el = document.getElementById('busuanzi_site_pv')
      const txt = (el?.textContent || '').trim()
      if (el && txt && txt !== '…' && !Number.isNaN(Number(txt.replace(/,/g, '')))) {
        setReady(true)
        return true
      }
      return false
    }
    if (check()) return
    const timer = setInterval(() => { if (check()) clearInterval(timer) }, 300)
    const giveUp = setTimeout(() => clearInterval(timer), 10000)
    return () => {
      clearInterval(timer)
      clearTimeout(giveUp)
    }
  }, [])

  // NOTE: all four spans (site_pv/site_uv/today_pv/today_uv) must ALWAYS stay in
  // the DOM. busuanzi only fills spans that exist when its script executes, so if
  // site_pv were conditionally rendered, it would never get filled and `ready`
  // would never flip — an unrecoverable circular wait. Visibility is toggled
  // with CSS instead of conditional rendering.

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ visibility: ready ? 'visible' : 'hidden' }}
    >
      <span style={{ display: 'none' }} aria-hidden="true">
        <span id="busuanzi_today_pv">…</span>
        <span id="busuanzi_today_uv">…</span>
      </span>
      {' · '}
      {lang === 'zh' ? '本站总访问量' : 'Total visits'}{' '}
      <span id="busuanzi_site_pv" className="font-semibold text-gray-500 dark:text-slate-400">…</span>{' '}
      {lang === 'zh' ? '次 · 总访客' : '· Unique visitors'}{' '}
      <span id="busuanzi_site_uv" className="font-semibold text-gray-500 dark:text-slate-400">…</span>
      {lang === 'zh' ? '人' : ''}
    </span>
  )
}
