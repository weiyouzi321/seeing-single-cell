'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface MatrixViewsVizProps {
  matrix: number[][]
  color?: string
  lang?: 'en' | 'zh'
}

// Distinct colors for columns/rows — softer, lower saturation
const COL_COLORS: [number, number, number][] = [
  [225, 120, 120],   // soft red
  [230, 160, 100],   // soft orange
  [220, 200, 100],   // soft yellow
  [120, 200, 140],   // soft green
  [120, 160, 225],   // soft blue
  [180, 140, 220],   // soft purple
]
const ROW_COLORS: [number, number, number][] = [
  [225, 120, 120],
  [230, 160, 100],
  [220, 200, 100],
  [120, 200, 140],
  [120, 160, 225],
  [180, 140, 220],
]

export default function MatrixViewsViz({ matrix, color = '#6366f1', lang = 'en' }: MatrixViewsVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isZh = lang === 'zh'
  const [viewMode, setViewMode] = useState<'table' | 'columns' | 'rows' | 'elements'>('table')
  const [selCell, setSelCell] = useState<{i:number;j:number} | null>(null)
  const [selCol, setSelCol] = useState<number | null>(null)
  const [selRow, setSelRow] = useState<number | null>(null)

  const m = matrix.length
  const n = matrix[0]?.length || 0

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p5: p5) => {
      const cellSize = 44
      const marginLeft = 70
      const marginTop = 85
      const marginBottom = 40

      const matW = n * cellSize
      const matH = m * cellSize
      const canvasW = marginLeft + matW + 60
      const canvasH = marginTop + matH + marginBottom + 60

      p5.setup = () => {
        const canvas = p5.createCanvas(canvasW, canvasH)
        canvas.parent(containerRef.current!)
        p5.textFont('Inter')
        p5.noLoop()
      }

      p5.draw = () => {
        p5.background(255)

        const mx = marginLeft
        const my = marginTop

        // ── Draw matrix cells ──
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const x = mx + j * cellSize
            const y = my + i * cellSize
            const val = matrix[i][j]
            const intensity = Math.min(1, Math.abs(val) / 20)

            let r: number, g: number, b: number, a: number
            let strokeR = 200, strokeG = 200, strokeB = 200
            let strokeW = 1

            if (viewMode === 'table') {
              r = 250; g = 250; b = 252; a = 255
              strokeR = 210; strokeG = 210; strokeB = 215
            } else if (viewMode === 'columns') {
              const cc = COL_COLORS[j % COL_COLORS.length]
              r = cc[0]; g = cc[1]; b = cc[2]
              a = 70 + intensity * 90
              strokeR = cc[0]; strokeG = cc[1]; strokeB = cc[2]
              strokeW = 2
              if (selCol === j) { strokeW = 4; a = 170 + intensity * 85 }
            } else if (viewMode === 'rows') {
              const rc = ROW_COLORS[i % ROW_COLORS.length]
              r = rc[0]; g = rc[1]; b = rc[2]
              a = 70 + intensity * 90
              strokeR = rc[0]; strokeG = rc[1]; strokeB = rc[2]
              strokeW = 2
              if (selRow === i) { strokeW = 4; a = 170 + intensity * 85 }
            } else {
              // elements — softer grey-blue heatmap
              const t = intensity
              r = 245 - t * 60      // 245 -> 185
              g = 248 - t * 50      // 248 -> 198
              b = 252 - t * 25      // 252 -> 227
              a = 255
              strokeR = 200; strokeG = 200; strokeB = 205
              strokeW = 1
              if (selCell?.i === i && selCell?.j === j) {
                strokeR = 99; strokeG = 102; strokeB = 241
                strokeW = 4
              }
            }

            p5.fill(r, g, b, a)
            p5.stroke(strokeR, strokeG, strokeB)
            p5.strokeWeight(strokeW)
            p5.rect(x, y, cellSize, cellSize)

            // Value text
            p5.noStroke()
            p5.fill(viewMode === 'elements' && intensity > 0.6 ? 255 : 60)
            p5.textSize(11)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(val.toString(), x + cellSize / 2, y + cellSize / 2)
          }
        }

        // Row labels
        p5.fill(100)
        p5.textSize(10)
        p5.textAlign(p5.RIGHT, p5.CENTER)
        for (let i = 0; i < m; i++) {
          p5.text('R' + (i + 1), mx - 8, my + i * cellSize + cellSize / 2)
        }

        // Column labels
        p5.fill(100)
        p5.textSize(10)
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        for (let j = 0; j < n; j++) {
          p5.text('C' + (j + 1), mx + j * cellSize + cellSize / 2, my - 8)
        }

        // ── Column selection info (below matrix) ──
        if (viewMode === 'columns' && selCol !== null) {
          p5.fill(60)
          p5.textSize(11)
          p5.textAlign(p5.LEFT, p5.TOP)
          const colVals = matrix.map(row => row[selCol])
          const cc = COL_COLORS[selCol % COL_COLORS.length]
          p5.fill(cc[0], cc[1], cc[2])
          p5.text(
            (isZh ? '列 a' : 'Col a') + (selCol + 1) + ' = [' + colVals.join(', ') + ']ᵀ',
            mx, my + matH + 16
          )
        }

        // ── Row selection info (below matrix) ──
        if (viewMode === 'rows' && selRow !== null) {
          p5.fill(60)
          p5.textSize(11)
          p5.textAlign(p5.LEFT, p5.TOP)
          const rc = ROW_COLORS[selRow % ROW_COLORS.length]
          p5.fill(rc[0], rc[1], rc[2])
          p5.text(
            (isZh ? '行 r' : 'Row r') + (selRow + 1) + ' = [' + matrix[selRow].join(', ') + ']',
            mx, my + matH + 16
          )
        }

        // ── Elements mode: selection info ──
        if (viewMode === 'elements' && selCell) {
          const val = matrix[selCell.i][selCell.j]
          p5.fill(99, 102, 241)
          p5.textSize(12)
          p5.textAlign(p5.LEFT, p5.TOP)
          p5.text(
            'a' + (selCell.i + 1) + ',' + (selCell.j + 1) + ' = ' + val +
            (isZh ? '  （第' + (selCell.i + 1) + '行第' + (selCell.j + 1) + '列）' :
             '  (row ' + (selCell.i + 1) + ', col ' + (selCell.j + 1) + ')'),
            mx, my + matH + 16
          )
        }

        // ── View mode label ──
        p5.fill(80)
        p5.textSize(12)
        p5.textAlign(p5.LEFT, p5.TOP)
        const modeLabels: Record<string, string> = {
          table: isZh ? '视角 1: 作为表格' : 'View 1: As a Table',
          columns: isZh ? '视角 2: 作为列向量' : 'View 2: As Column Vectors',
          rows: isZh ? '视角 3: 作为行向量' : 'View 3: As Row Vectors',
          elements: isZh ? '视角 4: 作为单个元素' : 'View 4: As Individual Elements',
        }
        p5.text(modeLabels[viewMode], mx, 20)

        // Description
        p5.fill(130)
        p5.textSize(10)
        const descs: Record<string, string> = {
          table: isZh ? '矩阵是一个 m×n 的数字表格' : 'A matrix is an m×n table of numbers',
          columns: isZh ? 'A = [a₁ a₂ ... aₙ]，每一列是一个 m 维向量。点击列高亮。' : 'A = [a₁ a₂ ... aₙ], each column is an m-dim vector. Click a column to highlight.',
          rows: isZh ? '每一行是一个 n 维向量。点击行高亮。' : 'Each row is an n-dim vector. Click a row to highlight.',
          elements: isZh ? '点击任意元素 aᵢⱼ 查看其值。' : 'Click any element aᵢⱼ to see its value.',
        }
        p5.text(descs[viewMode], mx, 38)
      }

      p5.mousePressed = () => {
        const mx = marginLeft
        const my = marginTop
        const x = p5.mouseX - mx
        const y = p5.mouseY - my
        const j = Math.floor(x / cellSize)
        const i = Math.floor(y / cellSize)

        if (i >= 0 && i < m && j >= 0 && j < n && x >= 0 && y >= 0 && x < matW && y < matH) {
          if (viewMode === 'columns') {
            setSelCol(prev => prev === j ? null : j)
            p5.redraw()
            return
          }
          if (viewMode === 'rows') {
            setSelRow(prev => prev === i ? null : i)
            p5.redraw()
            return
          }
          if (viewMode === 'elements') {
            setSelCell(prev => prev?.i === i && prev?.j === j ? null : {i, j})
            p5.redraw()
            return
          }
        }

        // Click outside clears selection
        if (viewMode === 'columns') { setSelCol(null); p5.redraw() }
        if (viewMode === 'rows') { setSelRow(null); p5.redraw() }
        if (viewMode === 'elements') { setSelCell(null); p5.redraw() }
      }
    }

    const p5Instance = new p5(sketch)
    return () => p5Instance.remove()
  }, [matrix, viewMode, color, selCell, selCol, selRow, isZh])

  const modes: { key: 'table' | 'columns' | 'rows' | 'elements'; label: string }[] = [
    { key: 'table', label: isZh ? '表格' : 'Table' },
    { key: 'columns', label: isZh ? '列向量' : 'Columns' },
    { key: 'rows', label: isZh ? '行向量' : 'Rows' },
    { key: 'elements', label: isZh ? '元素' : 'Elements' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => { setViewMode(mode.key); setSelCell(null); setSelCol(null); setSelRow(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === mode.key
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  )
}
