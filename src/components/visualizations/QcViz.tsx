'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface QcVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  qcMetrics: { nCount: number[]; nFeature: number[]; pct_mito: number[] }
  lang?: string
  translations?: Record<string, string>
}

export default function QcViz({ data, geneNames, cellTypes, qcMetrics, lang, translations }: QcVizProps) {
  const isZh = lang === 'zh'
  const t = (key: string, fallback: string) => translations?.[key] || fallback

  const violinRef = useRef<HTMLDivElement>(null)
  const scatterRef = useRef<HTMLDivElement>(null)
  const violinP5 = useRef<p5 | null>(null)
  const scatterP5 = useRef<p5 | null>(null)
  const scatterMtRef = useRef<HTMLDivElement>(null)
  const scatterMtP5 = useRef<p5 | null>(null)

  const [thresholds, setThresholds] = useState({
    nCountMin: 0, nCountMax: Infinity,
    nFeatureMin: 5, nFeatureMax: Infinity,
    pctMitoMax: Infinity,
  })
  const [useMAD, setUseMAD] = useState(false)
  const [madK, setMadK] = useState(3)
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'nCount' | 'nFeature' | 'pct_mito'>('nCount')

  const L = {
    nCount: isZh ? 'nCount (总UMI数)' : 'nCount (Total UMIs)',
    nFeature: isZh ? 'nFeature (检测基因数)' : 'nFeature (Detected Genes)',
    pctMito: isZh ? 'percent_mt (线粒体比例)' : 'percent_mt (Mitochondrial %)',
    fixed: isZh ? '固定阈值' : 'Fixed Threshold',
    mad: isZh ? 'MAD自适应' : 'MAD Adaptive',
    keep: isZh ? '保留' : 'Keep',
    remove: isZh ? '去除' : 'Remove',
    cells: isZh ? '个细胞' : 'cells',
    min: isZh ? '最小值' : 'Min',
    max: isZh ? '最大值' : 'Max',
    median: isZh ? '中位数' : 'Median',
    threshold: isZh ? '阈值' : 'Threshold',
    filtered: isZh ? '过滤后' : 'Filtered',
    total: isZh ? '总计' : 'Total',
    violinTitle: isZh ? 'QC指标分布' : 'QC Metrics Distribution',
    scatterTitle: isZh ? 'nCount vs nFeature' : 'nCount vs nFeature',
    interactHint: isZh ? '悬停查看细胞详情' : 'Hover for cell details',
    cellType: isZh ? '细胞类型' : 'Cell Type',
  }

  // Compute MAD-based thresholds
  const madThresholds = useMemo(() => {
    const mad = (arr: number[]) => {
      const sorted = [...arr].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const deviations = sorted.map(v => Math.abs(v - median))
      const madVal = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)]
      return { median, mad: madVal }
    }
    const nc = mad(qcMetrics.nCount)
    const nf = mad(qcMetrics.nFeature)
    const pm = mad(qcMetrics.pct_mito)
    return {
      nCountMin: Math.max(0, nc.median - madK * nc.mad * 1.4826),
      nCountMax: nc.median + madK * nc.mad * 1.4826,
      nFeatureMin: Math.max(1, nf.median - madK * nf.mad * 1.4826),
      nFeatureMax: nf.median + madK * nf.mad * 1.4826,
      pctMitoMax: pm.median + madK * pm.mad * 1.4826,
    }
  }, [qcMetrics, madK])

  const activeThresholds = useMAD ? madThresholds : thresholds

  // Filter cells
  const filterResult = useMemo(() => {
    const keep: number[] = []
    const remove: number[] = []
    for (let i = 0; i < qcMetrics.nCount.length; i++) {
      const nc = qcMetrics.nCount[i]
      const nf = qcMetrics.nFeature[i]
      const pm = qcMetrics.pct_mito[i]
      if (nc >= activeThresholds.nCountMin && nc <= activeThresholds.nCountMax &&
          nf >= activeThresholds.nFeatureMin && nf <= activeThresholds.nFeatureMax &&
          pm <= activeThresholds.pctMitoMax) {
        keep.push(i)
      } else {
        remove.push(i)
      }
    }
    return { keep, remove }
  }, [qcMetrics, activeThresholds])

  // Draw violin plots
  useEffect(() => {
    if (!violinRef.current) return
    if (violinP5.current) violinP5.current.remove()

    const sketch = (p: any) => {
      const W = 700, H = 300
      const margin = { top: 30, right: 20, bottom: 40, left: 60 }
      const plotW = W - margin.left - margin.right
      const plotH = H - margin.top - margin.bottom

      p.setup = () => {
        const c = p.createCanvas(W, H)
        c.parent(violinRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)
        const metrics = ['nCount', 'nFeature', 'pct_mito']
        const metricLabels = [L.nCount, L.nFeature, L.pctMito]
        const colW = plotW / 3
        const colors = [[16,185,129], [124,58,237], [245,158,11]]

        for (let mi = 0; mi < 3; mi++) {
          const values = qcMetrics[metrics[mi] as keyof typeof qcMetrics]
          const cx = margin.left + colW * mi + colW / 2
          const minVal = Math.min(...values)
          const maxVal = Math.max(...values) || 1
          const range = maxVal - minVal || 1

          // Kernel density for violin shape
          const bw = range * 0.08
          const nPts = 60
          const densities: number[] = []
          for (let i = 0; i < nPts; i++) {
            const val = minVal + range * i / nPts
            let d = 0
            for (const v of values) {
              const u = (val - v) / bw
              d += Math.exp(-0.5 * u * u)
            }
            d /= values.length * bw * Math.sqrt(2 * Math.PI)
            densities.push(d)
          }
          const maxDensity = Math.max(...densities) || 1

          // Draw violin
          const halfW = colW * 0.35
          p.noStroke()
          p.fill(colors[mi][0], colors[mi][1], colors[mi][2], 60)
          p.beginShape()
          for (let i = 0; i < nPts; i++) {
            const y = margin.top + plotH - (i / nPts) * plotH
            const w = (densities[i] / maxDensity) * halfW
            p.vertex(cx - w, y)
          }
          for (let i = nPts - 1; i >= 0; i--) {
            const y = margin.top + plotH - (i / nPts) * plotH
            const w = (densities[i] / maxDensity) * halfW
            p.vertex(cx + w, y)
          }
          p.endShape(p.CLOSE)

          // Box plot elements
          const sorted = [...values].sort((a: number, b: number) => a - b)
          const q1 = sorted[Math.floor(sorted.length * 0.25)]
          const med = sorted[Math.floor(sorted.length * 0.5)]
          const q3 = sorted[Math.floor(sorted.length * 0.75)]

          // Median line
          const medY = margin.top + plotH - ((med - minVal) / range) * plotH
          p.stroke(0); p.strokeWeight(2)
          p.line(cx - 8, medY, cx + 8, medY)

          // IQR box
          const q1Y = margin.top + plotH - ((q1 - minVal) / range) * plotH
          const q3Y = margin.top + plotH - ((q3 - minVal) / range) * plotH
          p.noStroke()
          p.fill(colors[mi][0], colors[mi][1], colors[mi][2], 100)
          p.rect(cx - 4, q3Y, 8, q1Y - q3Y)

          // Threshold lines
          let threshLow: number | null = null
          let threshHigh: number | null = null
          if (mi === 0) { threshLow = activeThresholds.nCountMin; threshHigh = activeThresholds.nCountMax }
          else if (mi === 1) { threshLow = activeThresholds.nFeatureMin; threshHigh = activeThresholds.nFeatureMax }
          else { threshHigh = activeThresholds.pctMitoMax }

          p.stroke(239, 68, 68); p.strokeWeight(2); p.drawingContext.setLineDash([5, 3])
          if (threshLow !== null && threshLow > minVal) {
            const ty = margin.top + plotH - ((threshLow - minVal) / range) * plotH
            p.line(cx - halfW - 5, ty, cx + halfW + 5, ty)
          }
          if (threshHigh !== null && threshHigh < maxVal) {
            const ty = margin.top + plotH - ((threshHigh - minVal) / range) * plotH
            p.line(cx - halfW - 5, ty, cx + halfW + 5, ty)
          }
          p.drawingContext.setLineDash([])

          // Y-axis labels (independent per violin)
          const axisX = margin.left + colW * mi
          p.stroke(180); p.strokeWeight(1)
          p.line(axisX, margin.top, axisX, margin.top + plotH)
          p.noStroke(); p.fill(120); p.textSize(9); p.textAlign(p.RIGHT, p.CENTER)
          for (let i = 0; i <= 4; i++) {
            const val = minVal + range * (i / 4)
            const y = margin.top + plotH - (i / 4) * plotH
            p.text(val < 10 ? val.toFixed(2) : Math.round(val).toString(), axisX + 18, y)
            p.stroke(180); p.strokeWeight(1)
            p.line(axisX, y, axisX + 4, y)
            p.noStroke()
          }

          // X-axis label
          p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
          p.text(metricLabels[mi], cx, H - 25)
        }
      }
    }
    violinP5.current = new p5(sketch)
    return () => { if (violinP5.current) violinP5.current.remove() }
  }, [qcMetrics, activeThresholds, lang])

  // Draw scatter plot
  useEffect(() => {
    if (!scatterRef.current) return
    if (scatterP5.current) scatterP5.current.remove()

    const sketch = (p: any) => {
      const W = 400, H = 300
      const margin = { top: 20, right: 20, bottom: 45, left: 55 }
      const plotW = W - margin.left - margin.right
      const plotH = H - margin.top - margin.bottom

      p.setup = () => {
        const c = p.createCanvas(W, H)
        c.parent(scatterRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)
        const ox = margin.left, oy = margin.top
        const ncMax = Math.max(...qcMetrics.nCount) || 1
        const nfMax = Math.max(...qcMetrics.nFeature) || 1

        // Grid
        p.stroke(240); p.strokeWeight(1)
        for (let i = 0; i <= 4; i++) {
          p.line(ox, oy + (plotH / 4) * i, ox + plotW, oy + (plotH / 4) * i)
          p.line(ox + (plotW / 4) * i, oy, ox + (plotW / 4) * i, oy + plotH)
        }

        // Axes
        p.stroke(180); p.strokeWeight(1.5)
        p.line(ox, oy, ox, oy + plotH)
        p.line(ox, oy + plotH, ox + plotW, oy + plotH)

        // Points
        for (let i = 0; i < qcMetrics.nCount.length; i++) {
          const x = ox + (qcMetrics.nCount[i] / ncMax) * plotW
          const y = oy + plotH - (qcMetrics.nFeature[i] / nfMax) * plotH
          const kept = filterResult.keep.includes(i)
          if (i === hoveredCell) {
            p.fill(239, 68, 68); p.stroke(0); p.strokeWeight(1)
            p.ellipse(x, y, 10, 10)
          } else if (kept) {
            p.fill(99, 102, 241, 180); p.noStroke()
            p.ellipse(x, y, 6, 6)
          } else {
            p.fill(239, 68, 68, 120); p.noStroke()
            p.ellipse(x, y, 6, 6)
          }
        }

        // Axis labels
        p.noStroke(); p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        p.text(L.nCount, ox + plotW / 2, oy + plotH + 8)
        p.push(); p.translate(14, oy + plotH / 2); p.rotate(-Math.PI / 2)
        p.textAlign(p.CENTER, p.BOTTOM); p.text(L.nFeature, 0, 0); p.pop()

        // Tick labels
        p.fill(120); p.textSize(9); p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= 4; i++) {
          p.text(Math.round(ncMax * i / 4).toString(), ox + (plotW / 4) * i, oy + plotH + 2)
        }
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 4; i++) {
          p.text(Math.round(nfMax * (4 - i) / 4).toString(), ox - 6, oy + (plotH / 4) * i)
        }

        // Legend
        p.fill(99, 102, 241); p.noStroke()
        p.ellipse(ox + plotW - 60, oy + 10, 8, 8)
        p.fill(80); p.textSize(9); p.textAlign(p.LEFT, p.CENTER)
        p.text(L.keep, ox + plotW - 54, oy + 10)
        p.fill(239, 68, 68)
        p.ellipse(ox + plotW - 60, oy + 24, 8, 8)
        p.fill(80)
        p.text(L.remove, ox + plotW - 54, oy + 24)
      }

      p.mouseMoved = () => {
        const ox = margin.left, oy = margin.top
        const ncMax = Math.max(...qcMetrics.nCount) || 1
        const nfMax = Math.max(...qcMetrics.nFeature) || 1
        const mx = p.mouseX - ox, my = p.mouseY - oy
        let closest = -1, closestDist = 15
        for (let i = 0; i < qcMetrics.nCount.length; i++) {
          const x = (qcMetrics.nCount[i] / ncMax) * plotW
          const y = plotH - (qcMetrics.nFeature[i] / nfMax) * plotH
          const d = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
          if (d < closestDist) { closestDist = d; closest = i }
        }
        setHoveredCell(closest >= 0 ? closest : null)
        p.redraw()
      }
    }
    scatterP5.current = new p5(sketch)
    return () => { if (scatterP5.current) scatterP5.current.remove() }
  }, [qcMetrics, filterResult, hoveredCell, lang])

  // Draw nCount vs percent_mt scatter plot
  useEffect(() => {
    if (!scatterMtRef.current) return
    if (scatterMtP5.current) scatterMtP5.current.remove()

    const sketch = (p: any) => {
      const W = 400, H = 300
      const margin = { top: 20, right: 20, bottom: 45, left: 55 }
      const plotW = W - margin.left - margin.right
      const plotH = H - margin.top - margin.bottom

      p.setup = () => {
        const c = p.createCanvas(W, H)
        c.parent(scatterMtRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)
        const ox = margin.left, oy = margin.top
        const ncMax = Math.max(...qcMetrics.nCount) || 1
        const mtMax = Math.max(...qcMetrics.pct_mito) || 1

        // Grid
        p.stroke(240); p.strokeWeight(1)
        for (let i = 0; i <= 4; i++) {
          p.line(ox, oy + (plotH / 4) * i, ox + plotW, oy + (plotH / 4) * i)
          p.line(ox + (plotW / 4) * i, oy, ox + (plotW / 4) * i, oy + plotH)
        }

        // Axes
        p.stroke(180); p.strokeWeight(1.5)
        p.line(ox, oy, ox, oy + plotH)
        p.line(ox, oy + plotH, ox + plotW, oy + plotH)

        // Points
        for (let i = 0; i < qcMetrics.nCount.length; i++) {
          const x = ox + (qcMetrics.nCount[i] / ncMax) * plotW
          const y = oy + plotH - (qcMetrics.pct_mito[i] / mtMax) * plotH
          const kept = filterResult.keep.includes(i)
          if (i === hoveredCell) {
            p.fill(239, 68, 68); p.stroke(0); p.strokeWeight(1)
            p.ellipse(x, y, 10, 10)
          } else if (kept) {
            p.fill(99, 102, 241, 180); p.noStroke()
            p.ellipse(x, y, 6, 6)
          } else {
            p.fill(239, 68, 68, 120); p.noStroke()
            p.ellipse(x, y, 6, 6)
          }
        }

        // Axis labels
        p.noStroke(); p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        p.text(isZh ? 'nCount (总UMI数)' : 'nCount (Total UMIs)', ox + plotW / 2, oy + plotH + 8)
        p.push(); p.translate(14, oy + plotH / 2); p.rotate(-Math.PI / 2)
        p.textAlign(p.CENTER, p.BOTTOM); p.text(isZh ? 'percent_mt' : 'percent_mt', 0, 0); p.pop()

        // Tick labels
        p.fill(120); p.textSize(9); p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= 4; i++) {
          p.text(Math.round(ncMax * i / 4).toString(), ox + (plotW / 4) * i, oy + plotH + 2)
        }
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 4; i++) {
          p.text((mtMax * (4 - i) / 4).toFixed(1), ox - 6, oy + (plotH / 4) * i)
        }
      }

      p.mouseMoved = () => {
        const ox = margin.left, oy = margin.top
        const ncMax = Math.max(...qcMetrics.nCount) || 1
        const mtMax = Math.max(...qcMetrics.pct_mito) || 1
        const mx = p.mouseX - ox, my = p.mouseY - oy
        let closest = -1, closestDist = 15
        for (let i = 0; i < qcMetrics.nCount.length; i++) {
          const x = (qcMetrics.nCount[i] / ncMax) * plotW
          const y = plotH - (qcMetrics.pct_mito[i] / mtMax) * plotH
          const d = Math.sqrt((mx - x) ** 2 + (my - y) ** 2)
          if (d < closestDist) { closestDist = d; closest = i }
        }
        setHoveredCell(closest >= 0 ? closest : null)
        p.redraw()
      }
    }
    scatterMtP5.current = new p5(sketch)
    return () => { if (scatterMtP5.current) scatterMtP5.current.remove() }
  }, [qcMetrics, filterResult, hoveredCell, lang])

  const metricOptions = [
    { key: 'nCount' as const, label: L.nCount, color: '#10b981', maxVal: Math.max(...qcMetrics.nCount) },
    { key: 'nFeature' as const, label: L.nFeature, color: '#7c3aed', maxVal: Math.max(...qcMetrics.nFeature) },
    { key: 'pct_mito' as const, label: L.pctMito, color: '#f59e0b', maxVal: Math.max(...qcMetrics.pct_mito) },
  ]

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button onClick={() => setUseMAD(false)}
            className={"px-4 py-2 text-sm font-medium " + (!useMAD ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600')}>
            {L.fixed}
          </button>
          <button onClick={() => setUseMAD(true)}
            className={"px-4 py-2 text-sm font-medium " + (useMAD ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600')}>
            {L.mad}
          </button>
        </div>
        {useMAD && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">MAD ×</span>
            <input type="range" min="1" max="5" step="0.5" value={madK}
              onChange={e => setMadK(parseFloat(e.target.value))} className="w-24" />
            <span className="font-mono font-semibold text-indigo-600">{madK}</span>
          </div>
        )}
      </div>

      {/* Threshold controls (fixed mode) */}
      {!useMAD && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metricOptions.map(m => (
            <div key={m.key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-semibold mb-2" style={{ color: m.color }}>{m.label}</div>
              <div className="space-y-2">
                {m.key !== 'pct_mito' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-8">Min</span>
                    <input type="range" min="0" max={m.key === 'nCount' ? 500 : 50} step="1"
                      value={m.key === 'nCount' ? thresholds.nCountMin : thresholds.nFeatureMin}
                      onChange={e => setThresholds(prev => ({
                        ...prev,
                        [m.key === 'nCount' ? 'nCountMin' : 'nFeatureMin']: parseInt(e.target.value)
                      }))}
                      className="flex-1" />
                    <span className="font-mono text-xs w-8 text-right">
                      {m.key === 'nCount' ? thresholds.nCountMin : thresholds.nFeatureMin}
                    </span>
                  </div>
                )}
                {m.key !== 'pct_mito' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-8">Max</span>
                    <input type="range" min={m.key === 'nCount' ? 100 : 20} max={m.key === 'nCount' ? 500 : 52} step="1"
                      value={m.key === 'nCount' ?
                        (thresholds.nCountMax === Infinity ? 500 : thresholds.nCountMax) :
                        (thresholds.nFeatureMax === Infinity ? 52 : thresholds.nFeatureMax)}
                      onChange={e => setThresholds(prev => ({
                        ...prev,
                        [m.key === 'nCount' ? 'nCountMax' : 'nFeatureMax']: parseInt(e.target.value)
                      }))}
                      className="flex-1" />
                    <span className="font-mono text-xs w-8 text-right">
                      {m.key === 'nCount' ?
                        (thresholds.nCountMax === Infinity ? '∞' : thresholds.nCountMax) :
                        (thresholds.nFeatureMax === Infinity ? '∞' : thresholds.nFeatureMax)}
                    </span>
                  </div>
                )}
                {m.key === 'pct_mito' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-8">Max</span>
                    <input type="range" min="2" max="30" step="0.5"
                      value={thresholds.pctMitoMax === Infinity ? 30 : thresholds.pctMitoMax}
                      onChange={e => setThresholds(prev => ({ ...prev, pctMitoMax: parseFloat(e.target.value) }))}
                      className="flex-1" />
                    <span className="font-mono text-xs w-10 text-right">
                      {thresholds.pctMitoMax === Infinity ? '∞' : thresholds.pctMitoMax.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Violin plots */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 mb-2">{L.violinTitle}</h4>
        <div ref={violinRef} className="p5-canvas-container" />
      </div>

      {/* Scatter plots + hover info */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">{isZh ? 'nCount vs nFeature' : 'nCount vs nFeature'}</h4>
          <div ref={scatterRef} className="p5-canvas-container" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">{isZh ? 'nCount vs percent_mt' : 'nCount vs percent_mt'}</h4>
          <div ref={scatterMtRef} className="p5-canvas-container" />
        </div>
        <div className="w-56 flex-shrink-0">
          {hoveredCell !== null ? (
            <div className="bg-gray-900 text-white rounded-xl p-4 text-sm">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">{t('cellDetail', 'Cell Detail')}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.cellType}</span>
                  <span>{cellTypes[hoveredCell]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">nCount</span>
                  <span className="font-mono font-semibold text-emerald-400">{qcMetrics.nCount[hoveredCell]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">nFeature</span>
                  <span className="font-mono font-semibold text-purple-400">{qcMetrics.nFeature[hoveredCell]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">percent_mt</span>
                  <span className="font-mono font-semibold text-amber-400">{qcMetrics.pct_mito[hoveredCell].toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400">
              <p>👆 {L.interactHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <h3>{L.total}</h3>
          <div className="stat-value">{qcMetrics.nCount.length}</div>
        </div>
        <div className="stat-card">
          <h3 className="text-emerald-600">{L.keep}</h3>
          <div className="stat-value text-emerald-600">{filterResult.keep.length}</div>
        </div>
        <div className="stat-card">
          <h3 className="text-red-500">{L.remove}</h3>
          <div className="stat-value text-red-500">{filterResult.remove.length}</div>
        </div>
        <div className="stat-card">
          <h3>{isZh ? '保留率' : 'Keep Rate'}</h3>
          <div className="stat-value">{(filterResult.keep.length / qcMetrics.nCount.length * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}
