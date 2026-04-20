'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface ScaleDataVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: 'en' | 'zh'
}

// Fixed 20 HVGs for ScaleData demo
const FIXED_HVG_COUNT = 20

export default function ScaleDataViz({ data, geneNames, cellTypes, lang = 'en' }: ScaleDataVizProps) {
  const beforeRef = useRef<HTMLDivElement>(null)
  const afterRef = useRef<HTMLDivElement>(null)
  const beforeP5 = useRef<p5 | null>(null)
  const afterP5 = useRef<p5 | null>(null)

  const [selectedGeneIdx, setSelectedGeneIdx] = useState(0)
  const [scaleApplied, setScaleApplied] = useState(true)

  const isZh = lang === 'zh'
  const L = {
    inputTitle: isZh ? '输入数据' : 'Input Data',
    inputDesc: isZh ? '来自log归一化数据的' + FIXED_HVG_COUNT + '个高变基因（按方差排序）。本演示使用固定数量。' : FIXED_HVG_COUNT + ' HVGs from log-normalized data. Fixed set by variance for this demo.',
    toggleLabel: isZh ? '应用标准化（Z-score）' : 'Apply ScaleData (Z-score)',
    before: isZh ? '标准化前' : 'Before Scaling',
    after: isZh ? '标准化后' : 'After Scaling',
    hvgGene: isZh ? '高变基因' : 'HVG Gene',
    normMean: isZh ? '归一化均值' : 'Normalized Mean',
    normStd: isZh ? '归一化标准差' : 'Normalized Std',
    scaledMean: isZh ? '标准化均值' : 'Scaled Mean',
    scaledStd: isZh ? '标准化标准差' : 'Scaled Std',
    perGene: isZh ? '各基因统计' : 'Per-Gene Statistics',
    normMu: isZh ? '归一化 μ' : 'Norm μ',
    normSigma: isZh ? '归一化 σ' : 'Norm σ',
    scaledMu: isZh ? '标准化 μ' : 'Scaled μ',
    scaledSigma: isZh ? '标准化 σ' : 'Scaled σ',
  }

  // data is already log-normalized (from page.tsx)
  // Select top N HVGs by variance
  const hvgIndices = useMemo(() => {
    const nCells = data.length
    const nGenes = data[0].length
    const stats = []
    for (let j = 0; j < nGenes; j++) {
      const values = data.map(row => row[j])
      const mean = values.reduce((a: number, b: number) => a + b, 0) / nCells
      const variance = values.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / nCells
      stats.push({ index: j, variance })
    }
    stats.sort((a, b) => b.variance - a.variance)
    return stats.slice(0, Math.min(FIXED_HVG_COUNT, nGenes)).map(s => s.index)
  }, [data])

  const hvgNames = hvgIndices.map(i => geneNames[i])

  // Extract HVG subset
  const hvgData = useMemo(() => {
    return data.map(row => hvgIndices.map(i => row[i]))
  }, [data, hvgIndices])

  // Scale the HVG data (z-score per gene)
  const scaledData = useMemo(() => {
    const nCells = hvgData.length
    const nGenes = hvgData[0].length
    const result: number[][] = Array.from({ length: nCells }, () => new Array(nGenes).fill(0))
    for (let j = 0; j < nGenes; j++) {
      const values = hvgData.map(row => row[j])
      const mean = values.reduce((a: number, b: number) => a + b, 0) / nCells
      const std = Math.sqrt(values.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / nCells) || 1
      for (let i = 0; i < nCells; i++) {
        result[i][j] = (hvgData[i][j] - mean) / std
      }
    }
    return result
  }, [hvgData])

  // Current gene stats
  const geneStat = useMemo(() => {
    const rawValues = hvgData.map(row => row[selectedGeneIdx])
    const scaledValues = scaledData.map(row => row[selectedGeneIdx])
    const rawMean = rawValues.reduce((a: number, b: number) => a + b, 0) / rawValues.length
    const rawStd = Math.sqrt(rawValues.reduce((s: number, v: number) => s + (v - rawMean) ** 2, 0) / rawValues.length)
    const scaledMean = scaledValues.reduce((a: number, b: number) => a + b, 0) / scaledValues.length
    const scaledStd = Math.sqrt(scaledValues.reduce((s: number, v: number) => s + (v - scaledMean) ** 2, 0) / scaledValues.length)
    return { rawMean, rawStd, scaledMean, scaledStd, rawValues, scaledValues }
  }, [hvgData, scaledData, selectedGeneIdx])

  // Draw histogram helper
  const drawHistogram = (container: HTMLDivElement | null, values: number[], color: [number, number, number], title: string, p5Ref: React.MutableRefObject<p5 | null>) => {
    if (!container) return
    if (p5Ref.current) p5Ref.current.remove()

    const sketch = (p: any) => {
      const width = 380
      const height = 260
      const margin = { top: 40, right: 20, bottom: 40, left: 45 }
      const plotW = width - margin.left - margin.right
      const plotH = height - margin.top - margin.bottom
      const ox = margin.left
      const oy = margin.top

      p.setup = () => {
        const canvas = p.createCanvas(width, height)
        canvas.parent(container)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)

        const bins = 20
        const min = Math.min(...values)
        const max = Math.max(...values) || 1
        const range = max - min || 1
        const binWidth = range / bins
        const histogram = new Array(bins).fill(0)
        values.forEach(v => {
          const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1)
          histogram[idx]++
        })
        const maxCount = Math.max(...histogram) || 1

        // Grid
        p.stroke(240)
        for (let i = 0; i <= 4; i++) {
          p.line(ox, oy + (plotH / 4) * i, ox + plotW, oy + (plotH / 4) * i)
        }

        // Bars
        const bw = plotW / bins
        p.noStroke()
        for (let i = 0; i < bins; i++) {
          const barH = (histogram[i] / maxCount) * plotH
          p.fill(color[0], color[1], color[2], 180)
          p.rect(ox + i * bw + 0.5, oy + plotH - barH, bw - 1, barH, 1, 1, 0, 0)
        }

        // Axes
        p.stroke(180)
        p.strokeWeight(1.5)
        p.line(ox, oy, ox, oy + plotH)
        p.line(ox, oy + plotH, ox + plotW, oy + plotH)

        // X-axis
        p.noStroke()
        p.fill(120)
        p.textSize(9)
        p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= 4; i++) {
          const val = min + range * (i / 4)
          p.text(val.toFixed(1), ox + (plotW / 4) * i, oy + plotH + 6)
        }

        // Title
        p.fill(50)
        p.textSize(12)
        p.textAlign(p.CENTER, p.TOP)
        p.text(title, width / 2, 10)

        // Stats overlay
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length
        const std = Math.sqrt(values.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / values.length)
        p.fill(100)
        p.textSize(9)
        p.textAlign(p.LEFT, p.TOP)
        p.text('mu=' + mean.toFixed(2) + '  sigma=' + std.toFixed(2), ox + 4, oy + 4)
      }
    }

    p5Ref.current = new p5(sketch)
  }

  useEffect(() => {
    drawHistogram(beforeRef.current, geneStat.rawValues, [67, 97, 238], hvgNames[selectedGeneIdx] + ' (Log-normalized)', beforeP5)
    return () => { if (beforeP5.current) beforeP5.current.remove() }
  }, [geneStat.rawValues, selectedGeneIdx, hvgNames])

  useEffect(() => {
    drawHistogram(afterRef.current, scaleApplied ? geneStat.scaledValues : geneStat.rawValues, [16, 185, 129], hvgNames[selectedGeneIdx] + ' (Scaled)', afterP5)
    return () => { if (afterP5.current) afterP5.current.remove() }
  }, [geneStat.scaledValues, geneStat.rawValues, selectedGeneIdx, hvgNames, scaleApplied])

  // Per-gene stats for all HVGs
  const allGeneStats = useMemo(() => {
    return hvgNames.map((gene, j) => {
      const rawValues = hvgData.map(row => row[j])
      const mean = rawValues.reduce((a: number, b: number) => a + b, 0) / rawValues.length
      const std = Math.sqrt(rawValues.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / rawValues.length)
      return { gene, mean, std }
    })
  }, [hvgData, hvgNames])

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="info-panel concept">
        <h3>{L.inputTitle}</h3>
        <p>{L.inputDesc}</p>
      </div>

      {/* Scale toggle */}
      <div className="control-group" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setScaleApplied(!scaleApplied)}
            className={"relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer " + (scaleApplied ? 'bg-blue-500' : 'bg-gray-300')}
          >
            <div className={"absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 " + (scaleApplied ? 'translate-x-5' : '')} />
          </div>
          <span className="text-sm font-semibold text-gray-700">{L.toggleLabel}</span>
        </label>

        <div className="ml-auto text-xs font-mono text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
          z = (x - μ) / σ
        </div>
      </div>

      {/* Before / After histograms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">{L.before}</h4>
          <div ref={beforeRef} className="p5-canvas-container" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">{L.after}</h4>
          <div ref={afterRef} className="p5-canvas-container" />
        </div>
      </div>

      {/* Gene selector */}
      <div className="control-group">
        <label>{L.hvgGene}</label>
        <select value={selectedGeneIdx} onChange={(e) => setSelectedGeneIdx(parseInt(e.target.value))}>
          {hvgNames.map((gene, i) => (
            <option key={gene} value={i}>{gene}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <h3>{L.normMean}</h3>
          <div className="stat-value">{geneStat.rawMean.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h3>{L.normStd}</h3>
          <div className="stat-value">{geneStat.rawStd.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <h3>{L.scaledMean}</h3>
          <div className="stat-value text-blue-600">{scaleApplied ? geneStat.scaledMean.toFixed(2) : '-'}</div>
        </div>
        <div className="stat-card">
          <h3>{L.scaledStd}</h3>
          <div className="stat-value text-blue-600">{scaleApplied ? geneStat.scaledStd.toFixed(2) : '-'}</div>
        </div>
      </div>

      {/* All HVGs stats table */}
      <div className="viz-card" style={{ padding: '1rem' }}>
        <h4 className="text-sm font-semibold text-gray-600 mb-3">{L.perGene}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-semibold text-gray-500">{L.hvgGene}</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-500">{L.normMean}</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-500">{L.normStd}</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-500">{L.scaledMean}</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-500">{L.scaledStd}</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-500 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {allGeneStats.map((s) => {
                const maxMean = Math.max(...allGeneStats.map(g => g.mean)) || 1
                return (
                  <tr key={s.gene} className={"border-b border-gray-50 " + (s.gene === hvgNames[selectedGeneIdx] ? 'bg-blue-50' : '')}>
                    <td className="py-1.5 px-2 font-mono font-semibold">{s.gene}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{s.mean.toFixed(2)}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{s.std.toFixed(2)}</td>
                    <td className="text-right py-1.5 px-2 font-mono text-blue-600">0.00</td>
                    <td className="text-right py-1.5 px-2 font-mono text-blue-600">1.00</td>
                    <td className="py-1.5 px-2">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: (s.mean / maxMean * 100) + '%' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
