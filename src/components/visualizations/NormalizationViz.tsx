'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface NormalizationVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: 'en' | 'zh'
}

export default function NormalizationViz({ data, geneNames, cellTypes, lang = 'en' }: NormalizationVizProps) {
  const matrixRef = useRef<HTMLDivElement>(null)
  const distRef = useRef<HTMLDivElement>(null)
  const matrixP5 = useRef<p5 | null>(null)
  const distP5 = useRef<p5 | null>(null)

  const isZh = lang === 'zh'
  const L = {
    transformSteps: isZh ? '变换步骤' : 'Transform Steps',
    divLibSize: isZh ? '÷ 文库大小' : '÷ Library Size',
    mul10k: isZh ? '× 10,000' : '× 10,000',
    logTransform: isZh ? '对数变换' : 'Log Transform',
    logNone: isZh ? '无' : 'None',
    log1p: 'log1p(x)',
    log2: 'log₂(x+1)',
    logLn: 'ln(x+1)',
    rawLabel: isZh ? '原始计数' : 'Raw counts',
    gene: isZh ? '基因' : 'Gene',
    raw: isZh ? '原始' : 'Raw',
    normalized: isZh ? '对数标准化' : 'Log-Normalized',
    interact: isZh ? '交互' : 'Interact',
    interactDesc: isZh ? '悬停查看细胞详情' : 'Hover to see cell details',
    cellDetail: isZh ? '细胞详情' : 'Cell Detail',
    typeLabel: isZh ? '类型' : 'Type',
    valueLabel: isZh ? '值' : 'Value',
    positionLabel: isZh ? '位置' : 'Position',
    rawLibSize: isZh ? '原始文库大小' : 'Raw Lib Size',
    rawRange: isZh ? '原始范围' : 'Raw Range',
    valueMin: isZh ? '最小值' : 'Value Min',
    valueMax: isZh ? '最大值' : 'Value Max',
    valueMean: isZh ? '平均值' : 'Value Mean',
  }

  const [divideByLibSize, setDivideByLibSize] = useState(false)
  const [multiplyBy10k, setMultiplyBy10k] = useState(false)
  const [logTransform, setLogTransform] = useState<'none' | 'log1p' | 'log2' | 'ln'>('none')
  const [selectedGene, setSelectedGene] = useState(0)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; value: number; gene: string; cellType: string } | null>(null)

  const normalizedData = useMemo(() => {
    let result = data.map(row => [...row])
    if (divideByLibSize) {
      result = result.map(row => {
        const libSize = row.reduce((a: number, b: number) => a + b, 0)
        return libSize > 0 ? row.map(v => v / libSize) : row
      })
    }
    if (multiplyBy10k) {
      result = result.map(row => row.map(v => v * 10000))
    }
    if (logTransform === 'log1p') {
      result = result.map(row => row.map(v => Math.log1p(v)))
    } else if (logTransform === 'log2') {
      result = result.map(row => row.map(v => Math.log2(v + 1)))
    } else if (logTransform === 'ln') {
      result = result.map(row => row.map(v => Math.log(v + 1)))
    }
    return result
  }, [data, divideByLibSize, multiplyBy10k, logTransform])

  const libSizes = useMemo(() => data.map(row => row.reduce((a: number, b: number) => a + b, 0)), [data])
  // Dynamic stats from normalizedData (matches the current transform state)
  const currentStats = useMemo(() => {
    const allVals = normalizedData.flat()
    const means = normalizedData.map(row => row.reduce((a: number, b: number) => a + b, 0) / row.length)
    return {
      min: Math.min(...allVals).toFixed(2),
      max: Math.max(...allVals).toFixed(2),
      mean: (allVals.reduce((a: number, b: number) => a + b, 0) / allVals.length).toFixed(2),
      cellMeanMin: Math.min(...means).toFixed(2),
      cellMeanMax: Math.max(...means).toFixed(2),
    }
  }, [normalizedData])

  const formulaText = useMemo(() => {
    if (!divideByLibSize && !multiplyBy10k && logTransform === 'none') return L.rawLabel
    let steps: string[] = []
    if (divideByLibSize) steps.push('v / libsize')
    if (multiplyBy10k) steps.push('x 10k')
    if (logTransform !== 'none') steps.push(logTransform + '(x)')
    return 'v = ' + steps.join(' -> ')
  }, [divideByLibSize, multiplyBy10k, logTransform])

  useEffect(() => {
    if (!distRef.current) return
    if (distP5.current) distP5.current.remove()
    const currentData = normalizedData
    const rawData = data
    const sketch = (p: any) => {
      const width = 440
      const height = 280
      const margin = { top: 40, right: 20, bottom: 45, left: 50 }
      const plotW = width - margin.left - margin.right
      const plotH = height - margin.top - margin.bottom
      p.setup = () => {
        const canvas = p.createCanvas(width, height)
        canvas.parent(distRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }
      p.draw = () => {
        p.background(255)
        const geneData = currentData.map((row: number[]) => row[selectedGene])
        const rawGeneData = rawData.map((row: number[]) => row[selectedGene])
        const bins = 25
        const allVals = [...geneData, ...rawGeneData]
        const minVal = Math.min(...allVals)
        const maxVal = Math.max(...allVals) || 1
        const range = maxVal - minVal || 1
        const binWidth = range / bins
        const histogram = new Array(bins).fill(0)
        const rawHistogram = new Array(bins).fill(0)
        geneData.forEach((v: number) => {
          const idx = Math.min(Math.floor((v - minVal) / binWidth), bins - 1)
          if (idx >= 0) histogram[idx]++
        })
        rawGeneData.forEach((v: number) => {
          const idx = Math.min(Math.floor((v - minVal) / binWidth), bins - 1)
          if (idx >= 0) rawHistogram[idx]++
        })
        const maxCount = Math.max(...histogram, ...rawHistogram) || 1
        const ox = margin.left
        const oy = margin.top
        p.stroke(240); p.strokeWeight(1)
        for (let i = 0; i <= 4; i++) { p.line(ox, oy + (plotH / 4) * i, ox + plotW, oy + (plotH / 4) * i) }
        p.stroke(180); p.strokeWeight(1.5)
        p.line(ox, oy, ox, oy + plotH)
        p.line(ox, oy + plotH, ox + plotW, oy + plotH)
        const bw = plotW / bins
        for (let i = 0; i < bins; i++) {
          const barH = (rawHistogram[i] / maxCount) * plotH
          p.noStroke(); p.fill(200, 200, 210, 120)
          p.rect(ox + i * bw + 0.5, oy + plotH - barH, bw - 1, barH, 1, 1, 0, 0)
        }
        for (let i = 0; i < bins; i++) {
          const barH = (histogram[i] / maxCount) * plotH
          p.noStroke(); p.fill(16, 185, 129, 180)
          p.rect(ox + i * bw + 0.5, oy + plotH - barH, bw - 1, barH, 1, 1, 0, 0)
        }
        p.noStroke(); p.fill(120); p.textSize(9); p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= 5; i++) {
          const val = minVal + range * (i / 5)
          p.text(val.toFixed(1), ox + (plotW / 5) * i, oy + plotH + 6)
        }
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 4; i++) {
          const val = maxCount * (4 - i) / 4
          p.text(Math.round(val).toString(), ox - 6, oy + (plotH / 4) * i)
        }
        p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        const xLabel = logTransform !== 'none' ? logTransform + '(Expression)' : 'Expression Level'
        p.text(xLabel, ox + plotW / 2, oy + plotH + 24)
        p.fill(30); p.textSize(13); p.textAlign(p.LEFT, p.TOP)
        p.text(geneNames[selectedGene], ox + 4, 8)
        // Legend at upper right
        const lx = ox + plotW - 80, ly = 8
        p.fill(200, 200, 210, 120); p.noStroke()
        p.rect(lx, ly + 2, 12, 8, 2)
        p.fill(100); p.textSize(9); p.textAlign(p.LEFT, p.CENTER)
        p.text(L.raw, lx + 16, ly + 6)
        p.fill(16, 185, 129, 180)
        p.rect(lx, ly + 16, 12, 8, 2)
        p.fill(100); p.text(L.normalized, lx + 16, ly + 20)
      }
    }
    distP5.current = new p5(sketch)
    return () => { if (distP5.current) distP5.current.remove() }
  }, [normalizedData, data, selectedGene, logTransform, geneNames])

  useEffect(() => {
    if (!matrixRef.current) return
    if (matrixP5.current) matrixP5.current.remove()
    const currentData = normalizedData
    const sketch = (p: any) => {
      const cellSize = 10, marginLeft = 80, marginTop = 40, marginRight = 50
      const cols = currentData[0].length, rows = currentData.length
      const matrixW = cols * cellSize, matrixH = rows * cellSize
      const canvasW = matrixW + marginLeft + marginRight, canvasH = matrixH + marginTop + 20
      const maxVal = Math.max(...currentData.flat()) || 1
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      p.setup = () => {
        const canvas = p.createCanvas(canvasW, canvasH)
        canvas.parent(matrixRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }
      p.draw = () => {
        p.background(255)
        p.fill(50); p.textSize(12); p.textAlign(p.LEFT, p.TOP)
        p.text((L as any).exprMatrix || "Expression Matrix", marginLeft, 8)
        p.noStroke()
        let lastType = ''
        for (let i = 0; i < rows; i++) {
          if (cellTypes[i] !== lastType) {
            p.fill(60); p.textSize(7); p.textAlign(p.RIGHT, p.CENTER)
            p.text(cellTypes[i], marginLeft - 4, marginTop + i * cellSize + cellSize / 2)
            if (lastType !== '') {
              p.stroke(200); p.strokeWeight(0.5)
              p.line(marginLeft - 2, marginTop + i * cellSize, marginLeft + matrixW, marginTop + i * cellSize)
            }
            lastType = cellTypes[i]
          }
        }
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const x = marginLeft + j * cellSize, y = marginTop + i * cellSize
            const t = Math.min(currentData[i][j] / maxVal, 1)
            p.stroke(230); p.strokeWeight(0.5)
            p.fill(lerp(240, 43, t), lerp(245, 97, t), lerp(250, 238, t))
            p.rect(x, y, cellSize, cellSize)
          }
        }
        p.noStroke(); p.fill(100); p.textSize(6)
        for (let j = 0; j < cols; j++) {
          p.push()
          p.translate(marginLeft + j * cellSize + cellSize / 2, marginTop - 4)
          p.rotate(-Math.PI / 4)
          p.textAlign(p.LEFT, p.CENTER)
          p.text(geneNames[j], 0, 0)
          p.pop()
        }
        const cbX = canvasW - 30, cbH = matrixH
        for (let i = 0; i < cbH; i++) {
          const t = i / cbH
          p.stroke(lerp(43, 240, t), lerp(97, 245, t), lerp(238, 250, t))
          p.line(cbX, marginTop + i, cbX + 10, marginTop + i)
        }
        p.noStroke(); p.fill(100); p.textSize(7); p.textAlign(p.CENTER, p.TOP)
        p.text(maxVal.toFixed(1), cbX + 5, marginTop - 12)
        p.text('0', cbX + 5, marginTop + cbH + 2)
      }
      p.mouseMoved = () => {
        const x = p.mouseX - marginLeft, y = p.mouseY - marginTop
        if (x >= 0 && x < cols * cellSize && y >= 0 && y < rows * cellSize) {
          const col = Math.floor(x / cellSize), row = Math.floor(y / cellSize)
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            setHoveredCell({ row, col, value: currentData[row][col], gene: geneNames[col], cellType: cellTypes[row] })
          }
        } else { setHoveredCell(null) }
      }
    }
    matrixP5.current = new p5(sketch)
    return () => { if (matrixP5.current) matrixP5.current.remove() }
  }, [normalizedData, geneNames, cellTypes])


  return (
    <div className="space-y-6">
      <div className="flex gap-6 items-start">
        <div className="flex flex-col gap-3 flex-shrink-0 w-48">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{L.transformSteps}</div>
          <button onClick={() => setDivideByLibSize(!divideByLibSize)}
            className={"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all " +
              (divideByLibSize ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            <span className={"w-4 h-4 rounded-full border-2 flex items-center justify-center " +
              (divideByLibSize ? 'border-white' : 'border-gray-400')}>
              {divideByLibSize && <span className="w-2 h-2 bg-white rounded-full" />}
            </span>
            {L.divLibSize}
          </button>
          <button onClick={() => setMultiplyBy10k(!multiplyBy10k)}
            className={"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all " +
              (multiplyBy10k ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
            <span className={"w-4 h-4 rounded-full border-2 flex items-center justify-center " +
              (multiplyBy10k ? 'border-white' : 'border-gray-400')}>
              {multiplyBy10k && <span className="w-2 h-2 bg-white rounded-full" />}
            </span>
            {L.mul10k}
          </button>
          <div className="border-t border-gray-200 pt-2 mt-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{L.logTransform}</div>
            <div className="flex flex-col gap-1.5">
              {['none', 'log1p', 'log2', 'ln'].map((mode) => (
                <button key={mode} onClick={() => setLogTransform(mode as any)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all text-left " +
                    (logTransform === mode ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200')}>
                  {mode === 'none' ? L.logNone : mode === 'log1p' ? L.log1p : mode === 'log2' ? L.log2 : L.logLn}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 p-2 bg-emerald-50 rounded-lg">
            <div className="text-xs text-emerald-700 font-mono break-all">{formulaText}</div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div ref={distRef} className="p5-canvas-container" />
          <div className="control-group mt-2">
            <label>{L.gene}</label>
            <select value={selectedGene} onChange={(e) => setSelectedGene(parseInt(e.target.value))}>
              {geneNames.map((gene, i) => (<option key={gene} value={i}>{gene}</option>))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div ref={matrixRef} className="p5-canvas-container" />
        </div>
        <div className="w-56 flex-shrink-0 space-y-4">
          {hoveredCell ? (
            <div className="bg-gray-900 text-white rounded-xl p-4 text-sm">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">{L.cellDetail}</div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.gene}</span>
                  <span className="font-mono font-semibold">{hoveredCell.gene}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.typeLabel}</span>
                  <span>{hoveredCell.cellType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.valueLabel}</span>
                  <span className="font-mono font-semibold text-emerald-400">{hoveredCell.value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{L.positionLabel}</span>
                  <span className="font-mono text-gray-300">[{hoveredCell.row}, {hoveredCell.col}]</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-400">
              <p>👆 {L.interactDesc}</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="stat-card"><h3>{L.rawLibSize}</h3><div className="stat-value">{(libSizes.reduce((a: number, b: number) => a + b, 0) / libSizes.length).toFixed(0)}</div></div>
        <div className="stat-card"><h3>{L.rawRange}</h3><div className="stat-value text-xs">{Math.min(...libSizes) + ' - ' + Math.max(...libSizes)}</div></div>
        <div className="stat-card"><h3>{L.valueMin}</h3><div className="stat-value text-emerald-600">{currentStats.min}</div></div>
        <div className="stat-card"><h3>{L.valueMax}</h3><div className="stat-value text-emerald-600">{currentStats.max}</div></div>
        <div className="stat-card"><h3>{L.valueMean}</h3><div className="stat-value text-emerald-600">{currentStats.mean}</div></div>
      </div>
    </div>
  )
}
