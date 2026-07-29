'use client'

import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n/LangContext'
import Script from 'next/script'

// ── Globe.gl types ─────────────────────────────────────────────────────

declare global {
  interface Window {
    Globe?: (container: HTMLElement) => any
    THREE?: any
  }
}

interface Visit {
  ts: string
  type?: string
  country?: string
  countryCode?: string
  lat: number | string | null
  lon: number | string | null
  city?: string
}

// ── Helpers ────────────────────────────────────────────────────────────

function countryCodeToISO3(code: string): string | null {
  const map: Record<string, string> = {
    CN: 'CHN', US: 'USA', GB: 'GBR', DE: 'DEU', FR: 'FRA', JP: 'JPN',
    KR: 'KOR', RU: 'RUS', BR: 'BRA', IN: 'IND', CA: 'CAN', AU: 'AUS',
    IT: 'ITA', ES: 'ESP', NL: 'NLD', SE: 'SWE', NO: 'NOR', DK: 'DNK',
    FI: 'FIN', PL: 'POL', BE: 'BEL', CH: 'CHE', AT: 'AUT', PT: 'PRT',
    SG: 'SGP', HK: 'HKG', TW: 'TWN', MY: 'MYS', TH: 'THA', ID: 'IDN',
    VN: 'VNM', PH: 'PHL', MX: 'MEX', AR: 'ARG', CL: 'CHL', ZA: 'ZAF',
    AE: 'ARE', SA: 'SAU', TR: 'TUR', IL: 'ISR', NZ: 'NZL', IE: 'IRL',
  }
  return map[code] || null
}

function isoToFlag(iso3: string | null): string {
  if (!iso3) return '🌐'
  const code = iso3.toUpperCase()
  try {
    return String.fromCodePoint(
      0x1F1E6 + code.charCodeAt(0),
      0x1F1E6 + code.charCodeAt(1)
    )
  } catch {
    return '🌐'
  }
}

// ── Globe canvas ───────────────────────────────────────────────────────

function GlobeCanvas({ points }: { points: any[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !window.Globe || points.length === 0) return
    ref.current.innerHTML = ''

    const el = ref.current
    const w = el.clientWidth || window.innerWidth
    const h = el.clientHeight || window.innerHeight - 200

    const g: any = window.Globe(el)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .width(w)
      .height(h)

    g.pointsData(points)
      .pointColor((p: any) => (p.count > 5 ? '#7c3aed' : '#c4b5fd'))
      .pointRadius(0.6)
      .pointAltitude(0.04)

    const arcs: any[] = []
    points.slice(0, 30).forEach((p: any) => {
      arcs.push({
        startLat: 39.9,
        startLng: 116.4,
        endLat: p.lat,
        endLng: p.lon,
        count: p.count,
      })
    })
    g.arcData(arcs)
      .arcColor((a: any) => (a.count > 3 ? '#7c3aed' : '#a78bfa'))
      .arcStroke((a: any) => Math.min(a.count * 0.3, 2))
      .arcDashLength(0.4)
      .arcDashGap(0.3)
      .arcDashAnimateTime(1500)

    g.ringData(points.filter((p: any) => p.count >= 3).slice(0, 10))
      .ringColor('#7c3aed')
      .ringRadius(2)
      .ringMaxRadius(5)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(2000)

    g.atmosphereColor('#4361ee').atmosphereAltitude(0.12)

    const ctrl = g.controls()
    ctrl.autoRotate = true
    ctrl.autoRotateSpeed = 0.5
    ctrl.rotateSpeed = 0.8

    const onResize = () => {
      const nw = ref.current?.clientWidth || w
      const nh = ref.current?.clientHeight || h
      g.width(nw).height(nh)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [points])

  return <div ref={ref} className="w-full h-full" />
}

// ── Stat card ──────────────────────────────────────────────────────────

function StatCard({ label, value, zh }: { label: string; value: string; zh: string }) {
  const { lang } = useLang()
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-purple-500/30 rounded-xl px-5 py-3 min-w-[130px]">
      <div className="text-xs text-gray-300 uppercase tracking-wider mb-1">
        {lang === 'zh' ? zh : label}
      </div>
      <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        {value}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────

export default function Analytics() {
  const { lang } = useLang()
  const [points, setPoints] = useState<any[]>([])
  const [top, setTop] = useState<[string, number][]>([])
  const [visits, setVisits] = useState(0)
  const [clicks, setClicks] = useState(0)
  const [countries, setCountries] = useState(0)
  const [loaded, setLoaded] = useState(false)

  // Load Globe.gl from CDN
  useEffect(() => {
    if (window.Globe) return
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/three-globe'
    s.async = true
    document.head.appendChild(s)
  }, [])

  // Fetch data from JSONBin
  useEffect(() => {
    const binId = '__ANALYTICS_BIN_ID__' as string
    if (binId === '__ANALYTICS_BIN_ID__') {
      setLoaded(true)
      return
    }

    fetch(`https://api.jsonbin.io/v3/b/${binId}/record?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((raw: any) => {
        if (!raw) {
          setLoaded(true)
          return
        }

        const visitsArr = Array.isArray(raw) ? raw : raw.record || []
        if (!visitsArr.length) {
          setLoaded(true)
          return
        }

        const pageVisits = visitsArr.filter((v: Visit) => v.type !== 'click')
        const clickVisits = visitsArr.filter((v: Visit) => v.type === 'click')
        const uniqueC = new Set(
          pageVisits.map((v: Visit) => v.countryCode).filter(Boolean)
        )

        const geo = pageVisits.filter(
          (v: Visit) => v.lat && v.lon
        ) as (Visit & { lat: number; lon: number })[]

        const grouped: Record<string, any> = {}
        geo.forEach((v) => {
          const key = v.lat + ',' + v.lon
          if (!grouped[key]) {
            grouped[key] = {
              lat: v.lat,
              lon: v.lon,
              count: 0,
              country: v.country,
              countryCode: v.countryCode,
              city: v.city,
            }
          }
          grouped[key].count++
        })

        const pts = Object.values(grouped).sort((a: any, b: any) => b.count - a.count)

        const cc: Record<string, number> = {}
        geo.forEach((v) => {
          const key = v.countryCode || '??'
          cc[key] = (cc[key] || 0) + 1
        })
        const topArr = Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 8)

        setVisits(pageVisits.length)
        setClicks(clickVisits.length)
        setCountries(uniqueC.size)
        setPoints(pts)
        setTop(topArr as [string, number][])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-12rem)]">
      <Script
        src="https://unpkg.com/three"
        strategy="beforeInteractive"
        crossOrigin="anonymous"
      />
      <Script
        src="https://unpkg.com/three-globe"
        strategy="beforeInteractive"
        crossOrigin="anonymous"
      />

      {/* Background globe canvas */}
      <div className="fixed inset-0 -z-10">
        <div className="w-full h-full">
          {points.length > 0 && <GlobeCanvas points={points} />}
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {lang === 'zh' ? '🌍 访问统计' : '🌍 Visitor Analytics'}
          </h1>
          <p className="text-gray-400 mb-8 text-sm">
            {lang === 'zh'
              ? '全球访客访问情况实时可视化'
              : 'Real-time visualization of global visitor traffic'}
          </p>

          {loaded ? (
            <>
              <div className="flex flex-wrap gap-3 mb-6">
                <StatCard label="Total Visits" zh="总访问量" value={visits.toLocaleString()} />
                <StatCard label="Clicks" zh="点击次数" value={clicks.toLocaleString()} />
                <StatCard label="Countries" zh="覆盖国家" value={String(countries)} />
              </div>

              {top.length > 0 && (
                <div className="max-w-sm bg-white/10 backdrop-blur-sm border border-purple-500/20 rounded-xl px-5 py-4">
                  <h3 className="text-xs text-gray-300 uppercase tracking-wider mb-3">
                    {lang === 'zh' ? 'Top 访客来源' : 'Top Visitors'}
                  </h3>
                  <div className="space-y-2">
                    {top.map(([code, cnt]) => {
                      const max = top[0][1]
                      return (
                        <div key={code} className="flex items-center gap-2 text-sm">
                          <span className="text-base">
                            {isoToFlag(countryCodeToISO3(code))}
                          </span>
                          <span className="w-16 text-gray-300">
                            {code === '??' ? 'Unknown' : code}
                          </span>
                          <span className="text-purple-300 font-semibold">{cnt}</span>
                          <span
                            className="h-1 rounded bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${Math.max(4, (cnt / max) * 80)}px` }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          )}

          {loaded && points.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🌐</div>
              <h2 className="text-xl font-semibold mb-2">
                {lang === 'zh' ? '还没有访问数据' : 'No analytics data yet'}
              </h2>
              <p className="text-gray-400 text-sm">
                {lang === 'zh'
                  ? '访客正在被追踪中，数据将自动更新'
                  : 'Visitors are being tracked. Data will appear shortly.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
