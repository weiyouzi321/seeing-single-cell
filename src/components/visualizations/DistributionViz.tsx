'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface DistributionVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: string
  translations?: Record<string, string>
}

export default function DistributionViz({ data, geneNames, cellTypes, lang, translations }: DistributionVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)
  const [selectedGene, setSelectedGene] = useState<number>(0)
  const [binCount, setBinCount] = useState<number>(20)
  const [showKDE, setShowKDE] = useState<boolean>(true)
  const [hoveredBar, setHoveredBar] = useState<{ binStart: number; binEnd: number; count: number } | null>(null)

  const t = (key: string, fallback: string) => translations?.[key] || fallback

  const getGeneData = (geneIndex: number) => data.map(row => row[geneIndex])

  const calculateHistogram = (values: number[], bins: number) => {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    // For integer data, use integer-aligned bins
    const isIntegerData = values.every(v => Number.isInteger(v))
    let binWidth: number
    let actualBins: number
    let binEdges: number[]
    if (isIntegerData && range <= bins * 2) {
      // Integer data with few unique values: one bin per integer
      const intMin = Math.floor(min)
      const intMax = Math.ceil(max)
      actualBins = intMax - intMin
      binWidth = 1
      binEdges = Array.from({ length: actualBins + 1 }, (_, i) => intMin + i)
    } else {
      // Continuous or many values: use nice rounding
      binWidth = range / bins
      actualBins = bins
      if (isIntegerData) {
        // Round binWidth to nice integer
        binWidth = Math.max(1, Math.round(binWidth))
        actualBins = Math.ceil(range / binWidth)
        binEdges = Array.from({ length: actualBins + 1 }, (_, i) => Math.floor(min) + i * binWidth)
      } else {
        binEdges = Array.from({ length: bins + 1 }, (_, i) => min + i * binWidth)
      }
    }
    const histogram = new Array(actualBins).fill(0)
    values.forEach(v => {
      const idx = Math.min(Math.floor((v - (binEdges[0])) / binWidth), actualBins - 1)
      if (idx >= 0 && idx < actualBins) histogram[idx]++
    })
    return { histogram, binEdges, actualBins }
  }

  const calculateKDE = (values: number[], bandwidth?: number) => {
    const std = Math.sqrt(values.reduce((s, v) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      return s + (v - mean) ** 2
    }, 0) / values.length)
    const h = bandwidth ?? ((1.06 * std * Math.pow(values.length, -0.2)) || 0.5)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = (max - min) / 100 || 1
    const x = Array.from({ length: 101 }, (_, i) => min + i * step)
    const y = x.map(xi => {
      const sum = values.reduce((acc, v) => {
        const z = (xi - v) / h
        return acc + Math.exp(-0.5 * z * z)
      }, 0)
      return sum / (values.length * h * Math.sqrt(2 * Math.PI))
    })
    return { x, y }
  }

  // Store refs for p5 access
  const stateRef = useRef({ selectedGene, binCount, showKDE, geneNames, data, hoveredBarIndex: -1 })
  stateRef.current = { selectedGene, binCount, showKDE, geneNames, data, hoveredBarIndex: stateRef.current.hoveredBarIndex }

  useEffect(() => {
    if (!containerRef.current) return
    if (p5Ref.current) p5Ref.current.remove()

    const sketch = (p: p5) => {
      const width = 600
      const height = 380
      const margin = { top: 60, right: 30, bottom: 50, left: 55 }
      const plotW = width - margin.left - margin.right
      const plotH = height - margin.top - margin.bottom

      let currentHistogram: number[] = []
      let currentBinEdges: number[] = []
      let currentMaxCount = 1

      p.setup = () => {
        const canvas = p.createCanvas(width, height)
        canvas.parent(containerRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)
        const s = stateRef.current
        const geneData = s.data.map(row => row[s.selectedGene])
        const { histogram, binEdges, actualBins } = calculateHistogram(geneData, s.binCount)
        const nBins = actualBins || s.binCount
        const kde = s.showKDE ? calculateKDE(geneData) : null
        const maxCount = Math.max(...histogram)
        const maxDensity = kde ? Math.max(...kde.y) : 1

        currentHistogram = histogram
        currentBinEdges = binEdges
        currentMaxCount = maxCount

        const ox = margin.left
        const oy = margin.top

        // Grid lines
        p.stroke(240)
        p.strokeWeight(1)
        for (let i = 0; i <= 5; i++) {
          const y = oy + (plotH / 5) * i
          p.line(ox, y, ox + plotW, y)
        }

        // Axes
        p.stroke(180)
        p.strokeWeight(1.5)
        p.line(ox, oy, ox, oy + plotH)
        p.line(ox, oy + plotH, ox + plotW, oy + plotH)

        // Histogram bars
        const bw = plotW / nBins
        p.noStroke()
        for (let i = 0; i < nBins; i++) {
          const count = histogram[i]
          const barH = (count / maxCount) * plotH
          const x = ox + i * bw
          const y = oy + plotH - barH
          
          // Highlight hovered bar
          if (i === s.hoveredBarIndex) {
            p.fill(245, 158, 11, 220) // amber highlight
          } else {
            p.fill(67, 97, 238, 180) // default blue
          }
          p.rect(x + 0.5, y, bw - 1, barH, 2, 2, 0, 0)
        }

        // KDE curve
        if (s.showKDE && kde) {
          p.noFill()
          p.stroke(245, 158, 11)
          p.strokeWeight(2.5)
          p.beginShape()
          kde.x.forEach((xi, i) => {
            const x = ox + ((xi - kde.x[0]) / (kde.x[kde.x.length - 1] - kde.x[0] || 1)) * plotW
            const y = oy + plotH - (kde.y[i] / maxDensity) * plotH
            p.vertex(x, y)
          })
          p.endShape()
        }

        // X-axis ticks — discrete integer values
        p.noStroke()
        p.fill(120)
        p.textSize(10)
        p.textAlign(p.CENTER, p.TOP)
        const xMin = binEdges[0]
        const xMax = binEdges[binEdges.length - 1]
        const xRange = xMax - xMin
        
        // Generate nice discrete tick values
        const tickCount = 6
        const rawStep = xRange / (tickCount - 1)
        // Round to nice integer
        const niceStep = rawStep <= 1 ? 1 : rawStep <= 2 ? 2 : rawStep <= 5 ? 5 : 
                         rawStep <= 10 ? 10 : Math.ceil(rawStep / 5) * 5
        
        const firstTick = Math.ceil(xMin / niceStep) * niceStep
        const ticks: number[] = []
        for (let v = firstTick; v <= xMax; v += niceStep) {
          ticks.push(v)
        }
        
        ticks.forEach(val => {
          const x = ox + ((val - xMin) / xRange) * plotW
          p.text(val % 1 === 0 ? val.toString() : val.toFixed(1), x, oy + plotH + 6)
        })

        // Y-axis ticks
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 5; i++) {
          const val = (maxCount * (5 - i) / 5)
          const y = oy + (plotH / 5) * i
          p.text(Math.round(val).toString(), ox - 8, y)
        }

        // Axis labels
        p.fill(80)
        p.textSize(11)
        p.textAlign(p.CENTER, p.TOP)
        p.text(t('exprLevel', 'Expression Level'), ox + plotW / 2, oy + plotH + 28)

        p.push()
        p.translate(14, oy + plotH / 2)
        p.rotate(-Math.PI / 2)
        p.textAlign(p.CENTER, p.BOTTOM)
        p.text(t('frequency', 'Frequency'), 0, 0)
        p.pop()

        // Title
        p.fill(30)
        p.textSize(15)
        p.textAlign(p.CENTER, p.TOP)
        p.text(s.geneNames[s.selectedGene], width / 2, 12)

        // Legend
        const lx = ox + plotW - 140
        const ly = oy + 10
        p.fill(67, 97, 238, 180)
        p.noStroke()
        p.rect(lx, ly, 14, 14, 3)
        p.fill(100)
        p.textSize(10)
        p.textAlign(p.LEFT, p.CENTER)
        p.text(t('legendHist', 'Histogram'), lx + 20, ly + 7)

        if (s.showKDE) {
          p.stroke(245, 158, 11)
          p.strokeWeight(2.5)
          p.line(lx, ly + 28, lx + 14, ly + 28)
          p.noStroke()
          p.fill(100)
          p.text(t('legendKDE', 'KDE'), lx + 20, ly + 28)
        }
      }

      p.mouseMoved = () => {
        const s = stateRef.current
        const ox = margin.left
        const oy = margin.top
        const geneData = s.data.map(row => row[s.selectedGene])
        const { histogram, binEdges, actualBins } = calculateHistogram(geneData, s.binCount)
        const nBins = actualBins || s.binCount
        const bw = plotW / nBins
        const maxCount = Math.max(...histogram)

        const mx = p.mouseX - ox
        const my = p.mouseY - oy

        if (mx >= 0 && mx < plotW && my >= 0 && my < plotH) {
          const barIdx = Math.floor(mx / bw)
          if (barIdx >= 0 && barIdx < nBins) {
            const count = histogram[barIdx]
            const barH = (count / maxCount) * plotH
            // Check if mouse is within the bar height
            if (my >= plotH - barH) {
              stateRef.current.hoveredBarIndex = barIdx
              setHoveredBar({
                binStart: Math.round(binEdges[barIdx] * 10) / 10,
                binEnd: Math.round(binEdges[barIdx + 1] * 10) / 10,
                count,
              })
              p.redraw()
              return
            }
          }
        }
        if (stateRef.current.hoveredBarIndex !== -1) {
          stateRef.current.hoveredBarIndex = -1
          setHoveredBar(null)
          p.redraw()
        }
      }
    }

    p5Ref.current = new p5(sketch)
    return () => { if (p5Ref.current) p5Ref.current.remove() }
  }, [data, geneNames, selectedGene, binCount, showKDE])

  // Stats
  const geneData = getGeneData(selectedGene)
  const mean = (geneData.reduce((a, b) => a + b, 0) / geneData.length).toFixed(2)
  const min = Math.min(...geneData)
  const max = Math.max(...geneData)
  const zeros = geneData.filter(v => v === 0).length
  const zeroPct = ((zeros / geneData.length) * 100).toFixed(1)

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div ref={containerRef} className="p5-canvas-container" />

        {/* Hover tooltip */}
        {hoveredBar && (
          <div className="mt-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm inline-block">
            <span className="text-gray-400">{t('exprLevel', 'Expression')}: </span>
            <span className="font-mono font-semibold">{hoveredBar.binStart} – {hoveredBar.binEnd}</span>
            <span className="mx-2 text-gray-500">|</span>
            <span className="text-gray-400">{t('frequency', 'Count')}: </span>
            <span className="font-mono font-semibold text-amber-400">{hoveredBar.count}</span>
          </div>
        )}

        <div className="control-group">
          <label>{t('geneLabel', 'Gene')}</label>
          <select
            value={selectedGene}
            onChange={(e) => {
              setSelectedGene(parseInt(e.target.value))
              setHoveredBar(null)
            }}
          >
            {geneNames.map((gene, i) => (
              <option key={gene} value={i}>{gene}</option>
            ))}
          </select>

          <label>{t('binsLabel', 'Bins')}</label>
          <input
            type="range"
            min="5"
            max="50"
            value={binCount}
            onChange={(e) => setBinCount(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="font-mono text-sm text-gray-500">{binCount}</span>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showKDE}
              onChange={(e) => setShowKDE(e.target.checked)}
            />
            {t('showKDELabel', 'Show KDE')}
          </label>
        </div>
      </div>

      <div className="w-full lg:w-48 space-y-4 flex-shrink-0">
        <div className="stat-card">
          <h3>{t('statGene', 'Gene')}</h3>
          <div className="stat-value text-[#7c3aed]">{geneNames[selectedGene]}</div>
        </div>
        <div className="stat-card">
          <h3>{t('statMean', 'Mean')}</h3>
          <div className="stat-value">{mean}</div>
        </div>
        <div className="stat-card">
          <h3>{t('statRange', 'Range')}</h3>
          <div className="stat-value">{min} – {max}</div>
        </div>
        <div className="stat-card">
          <h3>{t('statZeros', 'Zeros')}</h3>
          <div className="stat-value">
            {zeros} <span className="text-xs text-gray-400">({zeroPct}%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
