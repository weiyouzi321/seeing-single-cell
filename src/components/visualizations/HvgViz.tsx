'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface HvgVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: 'en' | 'zh'
}

export default function HvgViz({ data, geneNames, cellTypes, lang = 'en' }: HvgVizProps) {
  const scatterRef = useRef<HTMLDivElement>(null)
  const heatmapRef = useRef<HTMLDivElement>(null)
  const scatterP5 = useRef<p5 | null>(null)
  const heatmapP5 = useRef<p5 | null>(null)

  const isZh = lang === 'zh'
  const L = {
    numHVGs: isZh ? '高变基因数量' : 'Number of HVGs',
    meanVar: isZh ? '均值 vs 方差' : 'Mean vs Variance',
    selectedHVGs: isZh ? '选中的高变基因' : 'Selected HVGs',
    ratio: isZh ? '占比' : 'Ratio',
    heatmapTitle: isZh ? '高变基因在全部细胞中的表达（按类型排序）' : 'HVG Expression Across Cells (sorted by type)',
    heatmapDesc: isZh ? '细胞按类型排序。高变基因在不同细胞中表现出异质性表达。' : 'Cells sorted by type. HVGs show heterogeneous expression across cells.',
    otherGenes: isZh ? '其他基因' : 'Other genes',
    poisson: isZh ? '泊松分布' : 'Poisson',
    nb: isZh ? '负二项分布' : 'Negative Binomial',
    interactLabel: isZh ? '交互提示' : 'Interact',
    interactDesc: isZh ? '悬停查看细胞详情' : 'Hover for cell details',
    geneLabel: isZh ? '基因' : 'Gene',
    typeLabel: isZh ? '类型' : 'Type',
    valueLabel: isZh ? '值' : 'Value',
    varLabel: isZh ? '方差' : 'var',
    selectedHVGsLabel: isZh ? '选中的高变基因' : 'Selected HVGs',
  }

  const [nTopGenes, setNTopGenes] = useState(10)
  const [hoveredHeatmapCell, setHoveredHeatmapCell] = useState<{row: number, col: number, gene: string, cellType: string, value: number} | null>(null)

  const geneStats = useMemo(() => {
    const nCells = data.length
    const nGenes = data[0].length
    const stats = []
    for (let j = 0; j < nGenes; j++) {
      const values = data.map(row => row[j])
      const mean = values.reduce((a: number, b: number) => a + b, 0) / nCells
      const variance = values.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / nCells
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 0
      stats.push({ gene: geneNames[j], mean, variance, cv, index: j })
    }
    const sorted = [...stats].sort((a, b) => b.variance - a.variance)
    const hvgSet = new Set(sorted.slice(0, nTopGenes).map(s => s.index))
    return stats.map(s => ({ ...s, isHVG: hvgSet.has(s.index) }))
  }, [data, geneNames, nTopGenes])

  const hvgList = useMemo(() => geneStats.filter(s => s.isHVG).sort((a, b) => b.variance - a.variance), [geneStats])

  // Sorted cells by cell type for heatmap
  const sortedCellIndices = useMemo(() => {
    const indices = Array.from({ length: cellTypes.length }, (_, i) => i)
    indices.sort((a, b) => cellTypes[a].localeCompare(cellTypes[b]))
    return indices
  }, [cellTypes])

  // Scatter plot
  useEffect(() => {
    if (!scatterRef.current) return
    if (scatterP5.current) scatterP5.current.remove()
    const stats = geneStats
    const sketch = (p: any) => {
      const width = 440, height = 380
      const margin = { top: 20, right: 20, bottom: 50, left: 55 }
      const plotW = width - margin.left - margin.right
      const plotH = height - margin.top - margin.bottom
      const ox = margin.left, oy = margin.top
      const maxMean = Math.max(...stats.map(s => s.mean)) * 1.1 || 1
      const maxVar = Math.max(...stats.map(s => s.variance)) * 1.1 || 1
      const fitX = Array.from({ length: 100 }, (_, i) => maxMean * i / 99)
      const alpha = maxVar / (maxMean * maxMean)
      const poissonY = fitX.map(x => x)
      const nbY = fitX.map(x => x + alpha * x * x)

      p.setup = () => {
        const canvas = p.createCanvas(width, height)
        canvas.parent(scatterRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }
      p.draw = () => {
        p.background(255)
        p.stroke(240); p.strokeWeight(1)
        for (let i = 0; i <= 5; i++) {
          p.line(ox, oy + (plotH / 5) * i, ox + plotW, oy + (plotH / 5) * i)
          p.line(ox + (plotW / 5) * i, oy, ox + (plotW / 5) * i, oy + plotH)
        }
        // Poisson
        p.stroke(250, 150, 50, 100); p.strokeWeight(1.5)
        p.drawingContext.setLineDash([5, 5]); p.noFill()
        p.beginShape()
        poissonY.forEach((yi: number, i: number) => {
          const x = ox + (fitX[i] / maxMean) * plotW
          const y = oy + plotH - (yi / maxVar) * plotH
          if (y >= oy) p.vertex(x, y)
        })
        p.endShape(); p.drawingContext.setLineDash([])
        // NB
        p.stroke(147, 51, 234, 100); p.strokeWeight(1.5)
        p.noFill(); p.beginShape()
        nbY.forEach((yi: number, i: number) => {
          const x = ox + (fitX[i] / maxMean) * plotW
          const y = oy + plotH - (yi / maxVar) * plotH
          if (y >= oy) p.vertex(x, y)
        })
        p.endShape()
        // Points
        stats.forEach((s: any) => {
          const x = ox + (s.mean / maxMean) * plotW
          const y = oy + plotH - (s.variance / maxVar) * plotH
          if (s.isHVG) {
            p.fill(239, 68, 68, 200); p.stroke(185, 28, 28); p.strokeWeight(1)
            p.ellipse(x, y, 10, 10)
          } else {
            p.fill(148, 163, 184, 140); p.noStroke()
            p.ellipse(x, y, 7, 7)
          }
          if (s.isHVG) {
            p.noStroke(); p.fill(30); p.textSize(9); p.textAlign(p.LEFT, p.CENTER)
            p.text(s.gene, x + 8, y - 2)
          }
        })
        // Axes
        p.stroke(100); p.strokeWeight(1.5)
        p.line(ox, oy, ox, oy + plotH)
        p.line(ox, oy + plotH, ox + plotW, oy + plotH)
        p.noStroke(); p.fill(120); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= 5; i++) {
          p.text((maxMean * i / 5).toFixed(1), ox + (plotW / 5) * i, oy + plotH + 8)
        }
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 5; i++) {
          p.text((maxVar * (5 - i) / 5).toFixed(1), ox - 8, oy + (plotH / 5) * i)
        }
        p.fill(80); p.textSize(12); p.textAlign(p.CENTER, p.TOP)
        p.text('Mean Expression', ox + plotW / 2, oy + plotH + 30)
        p.push(); p.translate(14, oy + plotH / 2); p.rotate(-Math.PI / 2)
        p.textAlign(p.CENTER, p.BOTTOM); p.text('Variance', 0, 0); p.pop()
        // Legend top-left
        const lx = ox + 10, ly = oy + 10
        p.fill(239, 68, 68, 200); p.stroke(185, 28, 28); p.strokeWeight(1)
        p.ellipse(lx + 5, ly + 5, 10, 10)
        p.noStroke(); p.fill(80); p.textSize(10); p.textAlign(p.LEFT, p.CENTER)
        p.text('Top ' + nTopGenes + ' HVGs', lx + 14, ly + 5)
        p.fill(148, 163, 184, 140); p.noStroke()
        p.ellipse(lx + 5, ly + 24, 7, 7)
        p.fill(80); p.text('Other genes', lx + 14, ly + 24)
        p.stroke(250, 150, 50, 100); p.strokeWeight(1.5)
        p.drawingContext.setLineDash([5, 5]); p.line(lx, ly + 42, lx + 10, ly + 42)
        p.drawingContext.setLineDash([]); p.noStroke(); p.fill(80)
        p.text('Poisson (var=mean)', lx + 14, ly + 42)
        p.stroke(147, 51, 234, 100); p.strokeWeight(1.5)
        p.line(lx, ly + 58, lx + 10, ly + 58); p.noStroke(); p.fill(80)
        p.text(L.nb, lx + 14, ly + 58)
      }
    }
    scatterP5.current = new p5(sketch)
    return () => { if (scatterP5.current) scatterP5.current.remove() }
  }, [geneStats, nTopGenes])

  // Heatmap: HVGs x cells (sorted by type)
  useEffect(() => {
    if (!heatmapRef.current) return
    if (heatmapP5.current) heatmapP5.current.remove()
    const hvgIndices = hvgList.map(h => h.index)
    if (hvgIndices.length === 0) return
    const sketch = (p: any) => {
      const cellW = 8, cellH = 12
      const marginLeft = 70, marginTop = 30, marginBottom = 60
      const nCells = data.length, nHVGs = hvgIndices.length
      const canvasW = nCells * cellW + marginLeft + 20
      const canvasH = nHVGs * cellH + marginTop + marginBottom
      p.setup = () => {
        const canvas = p.createCanvas(canvasW, canvasH)
        canvas.parent(heatmapRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }
      // Compute global max for colorbar
      const maxGlobalVal = Math.max(...hvgIndices.map(gi => Math.max(...sortedCellIndices.map(ci => data[ci][gi])))) || 1
      p.draw = () => {
        p.background(255)
        p.fill(50); p.textSize(12); p.textAlign(p.LEFT, p.TOP)
        p.text(L.heatmapTitle, marginLeft, 4)
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t
        for (let hi = 0; hi < nHVGs; hi++) {
          const geneIdx = hvgIndices[hi]
          const values = sortedCellIndices.map(ci => data[ci][geneIdx])
          p.fill(60); p.noStroke(); p.textSize(8); p.textAlign(p.RIGHT, p.CENTER)
          p.text(hvgList[hi].gene, marginLeft - 4, marginTop + hi * cellH + cellH / 2)
          for (let ci = 0; ci < nCells; ci++) {
            const t = Math.min(values[ci] / maxGlobalVal, 1)
            p.stroke(230); p.strokeWeight(0.3)
            p.fill(lerp(240, 43, t), lerp(245, 97, t), lerp(250, 238, t))
            p.rect(marginLeft + ci * cellW, marginTop + hi * cellH, cellW, cellH)
          }
        }
        // Cell type labels at bottom (sorted)
        let lastType = ''
        p.noStroke(); p.fill(80); p.textSize(7)
        for (let ci = 0; ci < nCells; ci++) {
          const actualIdx = sortedCellIndices[ci]
          if (cellTypes[actualIdx] !== lastType) {
            const x = marginLeft + ci * cellW
            p.stroke(100); p.strokeWeight(0.8)
            p.line(x, marginTop, x, marginTop + nHVGs * cellH)
            p.noStroke()
            p.push()
            p.translate(x + 2, marginTop + nHVGs * cellH + 4)
            p.rotate(-Math.PI / 3)
            p.textAlign(p.LEFT, p.CENTER)
            p.text(cellTypes[actualIdx], 0, 0)
            p.pop()
            lastType = cellTypes[actualIdx]
          }
        }
        // Colorbar on the right
        const cbX = marginLeft + nCells * cellW + 10
        const cbH = nHVGs * cellH
        for (let hi = 0; hi < cbH; hi++) {
          const t = hi / cbH
          p.stroke(lerp(43, 240, t), lerp(97, 245, t), lerp(238, 250, t))
          p.line(cbX, marginTop + hi, cbX + 12, marginTop + hi)
        }
        p.noStroke(); p.fill(80); p.textSize(7); p.textAlign(p.CENTER, p.TOP)
        p.text(maxGlobalVal.toFixed(1), cbX + 6, marginTop - 12)
        p.text('0', cbX + 6, marginTop + cbH + 2)
      }
      p.mouseMoved = () => {
        const x = p.mouseX - marginLeft, y = p.mouseY - marginTop
        if (x >= 0 && x < nCells * cellW && y >= 0 && y < nHVGs * cellH) {
          const col = Math.floor(x / cellW), row = Math.floor(y / cellH)
          if (row >= 0 && row < nHVGs && col >= 0 && col < nCells) {
            const ci = sortedCellIndices[col]
            const geneIdx = hvgIndices[row]
            setHoveredHeatmapCell({ row, col, gene: hvgList[row].gene, cellType: cellTypes[ci], value: data[ci][geneIdx] })
          }
        } else { setHoveredHeatmapCell(null) }
      }
    }
    heatmapP5.current = new p5(sketch)
    return () => { if (heatmapP5.current) heatmapP5.current.remove() }
  }, [hvgList, data, cellTypes, sortedCellIndices])

  return (
    <div className="space-y-6">
      {/* Slider */}
      <div className="control-group" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
        <label className="text-sm font-semibold text-gray-700">Number of HVGs</label>
        <input type="range" min="3" max={Math.min(geneNames.length, 25)} value={nTopGenes}
          onChange={(e) => setNTopGenes(parseInt(e.target.value))} className="w-48" />
        <span className="font-mono text-sm text-red-600 font-semibold">{nTopGenes}</span>
      </div>

      {/* Top row: Scatter (left) + HVG list (right) */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-500 mb-2">Mean vs Variance</h4>
          <div ref={scatterRef} className="p5-canvas-container" />
        </div>
        <div className="w-56 flex-shrink-0">
          <div className="stat-card">
            <h3>Selected HVGs</h3>
            <div className="flex flex-col gap-1.5 mt-2">
              {hvgList.map((s) => (
                <div key={s.gene} className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-red-600">{s.gene}</span>
                  <span className="text-gray-400">var={s.variance.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-400">Ratio</div>
              <div className="font-mono text-sm text-red-500 font-semibold">{nTopGenes}/{geneNames.length} ({(nTopGenes / geneNames.length * 100).toFixed(0)}%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Heatmap (full width, cells sorted by type) */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div ref={heatmapRef} className="p5-canvas-container" />
          <p className="text-xs text-gray-400 mt-1">
            {L.heatmapDesc}
          </p>
        </div>
        <div className="w-56 flex-shrink-0">
          {hoveredHeatmapCell ? (
            <div className="bg-gray-900 text-white rounded-xl p-4 text-sm">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">{L.interactLabel || 'Cell Detail'}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.geneLabel || 'Gene'}</span>
                  <span className="font-mono font-semibold">{hoveredHeatmapCell.gene}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.typeLabel || 'Type'}</span>
                  <span>{hoveredHeatmapCell.cellType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.valueLabel || 'Value'}</span>
                  <span className="font-mono font-semibold text-red-400">{hoveredHeatmapCell.value.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-400">
              <p>👆 {L.interactDesc || 'Hover for cell details'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
