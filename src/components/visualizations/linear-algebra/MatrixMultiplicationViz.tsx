'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface MatrixMultiplicationVizProps {
  matrixA: number[][]    // A (m×p)
  matrixB: number[][]    // B (p×n)
  color?: string         // 主题色 (indigo #6366f1)
  lang?: 'en' | 'zh'
  title?: string
}

export default function MatrixMultiplicationViz({
  matrixA,
  matrixB,
  color = '#6366f1',
  lang = 'en',
  title = 'Matrix Multiplication'
}: MatrixMultiplicationVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isZh = lang === 'zh'

  const m = matrixA.length
  const p = matrixA[0]?.length || 0
  const n = matrixB[0]?.length || 0

  // 计算结果 C = A·B
  const result: number[][] = []
  for (let i = 0; i < m; i++) {
    result[i] = []
    for (let j = 0; j < n; j++) {
      let sum = 0
      for (let k = 0; k < p; k++) {
        sum += matrixA[i][k] * matrixB[k][j]
      }
      result[i][j] = sum
    }
  }

  const [viewMode, setViewMode] = useState<'element' | 'column' | 'row' | 'outer'>('element')
  const [selectedCell, setSelectedCell] = useState<{ i: number; j: number } | null>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedCol, setSelectedCol] = useState<number | null>(null)
  const [selectedK, setSelectedK] = useState<number>(0)

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p5: p5) => {
      const cellSize = 34
      const innerGap = 42
      const marginTop = 70
      const marginLeft = 45
      const marginRight = 45
      const marginBottom = 55
      const panelGap = 24
      const panelH = 115

      const aw = p * cellSize
      const ah = m * cellSize
      const bw = n * cellSize
      const bh = p * cellSize
      const cw = n * cellSize
      const ch = m * cellSize

      // Horizontal layout: A  ×  B  =  C
      const aX = marginLeft
      const timesX = aX + aw + innerGap
      const bX = timesX + innerGap
      const eqX = bX + bw + innerGap
      const cX = eqX + innerGap

      const matrixBlockW = cX + cw - aX
      const totalW = matrixBlockW + marginLeft + marginRight
      const matrixBlockH = Math.max(ah, bh, ch)
      const baseY = marginTop + 18
      const totalH = baseY + matrixBlockH + panelGap + panelH + marginBottom

      p5.setup = () => {
        const canvas = p5.createCanvas(totalW, totalH)
        canvas.parent(containerRef.current!)
        p5.textFont('Inter')
        p5.noLoop()
      }

      p5.draw = () => {
        p5.background(255)

        const aY = baseY
        const bY = baseY + (matrixBlockH - bh) / 2
        const cY = baseY

        // 1) Names above
        p5.fill(80)
        p5.textSize(13)
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        p5.text('A', aX + aw / 2, aY - 6)
        p5.text('B', bX + bw / 2, bY - 6)
        p5.text('C', cX + cw / 2, cY - 6)

        // 2) Symbols centered vertically
        const symbolY = baseY + matrixBlockH / 2
        p5.fill(60)
        p5.textSize(20)
        p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('×', timesX, symbolY)
        p5.text('=', eqX, symbolY)

        // 3) Matrix A
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < p; j++) {
            const x = aX + j * cellSize
            const y = aY + i * cellSize
            const isSelRow = viewMode === 'row' && selectedRow === i
            const isSelCol = (viewMode === 'element' && selectedCell?.i === i) ||
                             (viewMode === 'outer' && selectedK === j)
            if (isSelRow) {
              p5.fill(color + '25')
              p5.stroke(color)
              p5.strokeWeight(2)
            } else if (isSelCol) {
              p5.fill('#f59e0b25')
              p5.stroke('#f59e0b')
              p5.strokeWeight(2)
            } else {
              p5.fill(250, 252, 255)
              p5.stroke(220)
              p5.strokeWeight(1)
            }
            p5.rect(x, y, cellSize, cellSize)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(9)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(matrixA[i][j].toString(), x + cellSize / 2, y + cellSize / 2)
          }
        }
        // A row labels
        p5.fill(120)
        p5.textSize(9)
        p5.textAlign(p5.RIGHT, p5.CENTER)
        for (let i = 0; i < m; i++) {
          p5.text(String.fromCharCode(65 + i), aX - 6, aY + i * cellSize + cellSize / 2)
        }
        // A col labels
        p5.fill(120)
        p5.textSize(8)
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        for (let j = 0; j < p; j++) {
          p5.text(String.fromCharCode(97 + j), aX + j * cellSize + cellSize / 2, aY - 2)
        }

        // 4) Matrix B
        for (let i = 0; i < p; i++) {
          for (let j = 0; j < n; j++) {
            const x = bX + j * cellSize
            const y = bY + i * cellSize
            const isSelCol = viewMode === 'column' && selectedCol === j
            const isSelRow = (viewMode === 'element' && selectedCell?.j === j) ||
                             (viewMode === 'outer' && selectedK === i)
            if (isSelCol) {
              p5.fill('#f59e0b25')
              p5.stroke('#f59e0b')
              p5.strokeWeight(2)
            } else if (isSelRow) {
              p5.fill('#10b98125')
              p5.stroke('#10b981')
              p5.strokeWeight(2)
            } else {
              p5.fill(250, 252, 255)
              p5.stroke(220)
              p5.strokeWeight(1)
            }
            p5.rect(x, y, cellSize, cellSize)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(9)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(matrixB[i][j].toString(), x + cellSize / 2, y + cellSize / 2)
          }
        }
        // B col labels
        p5.fill(120)
        p5.textSize(8)
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        for (let j = 0; j < n; j++) {
          p5.text(String.fromCharCode(97 + j), bX + j * cellSize + cellSize / 2, bY - 2)
        }

        // 5) Matrix C
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const x = cX + j * cellSize
            const y = cY + i * cellSize
            const isSel = (viewMode === 'element' && selectedCell?.i === i && selectedCell?.j === j) ||
                          (viewMode === 'column' && selectedCol === j) ||
                          (viewMode === 'row' && selectedRow === i)
            if (isSel) {
              p5.fill('#f59e0b')
              p5.stroke('#d97706')
              p5.strokeWeight(2)
            } else {
              p5.fill('#ecfdf5')
              p5.stroke('#10b981')
              p5.strokeWeight(1)
            }
            p5.rect(x, y, cellSize, cellSize)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(9)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(result[i][j].toFixed(1), x + cellSize / 2, y + cellSize / 2)
          }
        }
        // C row labels
        p5.fill(120)
        p5.textSize(9)
        p5.textAlign(p5.RIGHT, p5.CENTER)
        for (let i = 0; i < m; i++) {
          p5.text(String.fromCharCode(65 + i), cX - 6, cY + i * cellSize + cellSize / 2)
        }
        // C col labels
        p5.fill(120)
        p5.textSize(8)
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        for (let j = 0; j < n; j++) {
          p5.text(String.fromCharCode(97 + j), cX + j * cellSize + cellSize / 2, cY - 2)
        }

        // 6) Panel
        const panelX = aX
        const panelY = baseY + matrixBlockH + panelGap
        const panelW = cX + cw - aX

        if (viewMode === 'element' && selectedCell) {
          drawElementPanel(p5, panelX, panelY, panelW, panelH, selectedCell.i, selectedCell.j)
        } else if (viewMode === 'column' && selectedCol !== null) {
          drawColumnPanel(p5, panelX, panelY, panelW, panelH, selectedCol)
        } else if (viewMode === 'row' && selectedRow !== null) {
          drawRowPanel(p5, panelX, panelY, panelW, panelH, selectedRow)
        } else if (viewMode === 'outer') {
          drawOuterPanel(p5, panelX, panelY, panelW, panelH, selectedK)
        } else {
          // Empty hint
          p5.fill(245)
          p5.stroke(230)
          p5.strokeWeight(1)
          p5.rect(panelX, panelY, panelW, panelH, 10)
          p5.noStroke()
          p5.fill(180)
          p5.textSize(11)
          p5.textAlign(p5.CENTER, p5.CENTER)
          let hint = ''
          if (viewMode === 'element') hint = isZh ? '点击 C 的任意元素查看点积计算' : 'Click any element in C to see dot product'
          else if (viewMode === 'column') hint = isZh ? '点击 C 的任意列查看列视角计算' : 'Click any column in C to see column view'
          else if (viewMode === 'row') hint = isZh ? '点击 C 的任意行查看行视角计算' : 'Click any row in C to see row view'
          else hint = isZh ? '选择 k 查看外积累加' : 'Select k to see outer product accumulation'
          p5.text(hint, panelX + panelW / 2, panelY + panelH / 2)
        }

        // Title + view label
        if (title) {
          p5.fill(60)
          p5.textSize(14)
          p5.textAlign(p5.LEFT, p5.TOP)
          p5.text(title, marginLeft, 18)
        }
        p5.fill(130)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        const labels: Record<string, string> = {
          element: isZh ? '视角 1: 元素视角  Cᵢⱼ = Aᵢ · Bⱼ' : 'View 1: Element  Cᵢⱼ = Aᵢ · Bⱼ',
          column: isZh ? '视角 2: 列视角  C[:,j] = A × B[:,j]' : 'View 2: Column  C[:,j] = A × B[:,j]',
          row: isZh ? '视角 3: 行视角  C[i,:] = A[i,:] × B' : 'View 3: Row  C[i,:] = A[i,:] × B',
          outer: isZh ? '视角 4: 外积视角  C = Σ A[:,k] × B[k,:]' : 'View 4: Outer  C = Σ A[:,k] × B[k,:]',
        }
        p5.text(labels[viewMode], marginLeft, 36)
      }

      function drawElementPanel(p5: p5, px: number, py: number, pw: number, ph: number, i: number, j: number) {
        p5.fill(250, 255, 250)
        p5.stroke(210)
        p5.strokeWeight(1)
        p5.rect(px, py, pw, ph, 10)

        p5.noStroke()
        p5.fill(60)
        p5.textSize(11)
        p5.textAlign(p5.LEFT, p5.TOP)
        const formula = isZh
          ? `C[${String.fromCharCode(65 + i)},${String.fromCharCode(97 + j)}] = Σ A[${String.fromCharCode(65 + i)},k]·B[k,${String.fromCharCode(97 + j)}]`
          : `C[${String.fromCharCode(65 + i)},${String.fromCharCode(97 + j)}] = Σ A[${String.fromCharCode(65 + i)},k]·B[k,${String.fromCharCode(97 + j)}]`
        p5.text(formula, px + 14, py + 10)

        const termH = 30
        const termY = py + 34
        const itemW = Math.min(130, (pw - 28) / p)
        const totalItemsW = itemW * p
        const startX = px + (pw - totalItemsW) / 2

        for (let k = 0; k < p; k++) {
          const ix = startX + k * itemW
          const aVal = matrixA[i][k]
          const bVal = matrixB[k][j]
          const prod = aVal * bVal

          p5.fill(255)
          p5.stroke(230)
          p5.strokeWeight(1)
          p5.rect(ix + 3, termY, itemW - 6, termH, 5)

          p5.noStroke()
          p5.fill(100)
          p5.textSize(8)
          p5.textAlign(p5.CENTER, p5.TOP)
          p5.text(`k=${k + 1}`, ix + itemW / 2, termY + 3)

          p5.fill(60)
          p5.textSize(9)
          p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(`${aVal}×${bVal}=${prod.toFixed(1)}`, ix + itemW / 2, termY + termH / 2 + 2)
        }

        const sumY = termY + termH + 8
        p5.stroke(200)
        p5.strokeWeight(1)
        p5.line(px + 14, sumY, px + pw - 14, sumY)

        p5.noStroke()
        p5.fill('#059669')
        p5.textSize(11)
        p5.textAlign(p5.CENTER, p5.TOP)
        p5.text((isZh ? '总和 = ' : 'Sum = ') + result[i][j].toFixed(1), px + pw / 2, sumY + 6)
      }

      function drawColumnPanel(p5: p5, px: number, py: number, pw: number, ph: number, j: number) {
        p5.fill(255, 250, 240)
        p5.stroke(210)
        p5.strokeWeight(1)
        p5.rect(px, py, pw, ph, 10)

        p5.noStroke()
        p5.fill(60)
        p5.textSize(11)
        p5.textAlign(p5.LEFT, p5.TOP)
        const formula = isZh
          ? `C[:,${String.fromCharCode(97 + j)}] = A × B[:,${String.fromCharCode(97 + j)}]   （A 的每一行与 B 的第 ${String.fromCharCode(97 + j)} 列点积）`
          : `C[:,${String.fromCharCode(97 + j)}] = A × B[:,${String.fromCharCode(97 + j)}]   (each row of A dot col ${String.fromCharCode(97 + j)} of B)`
        p5.text(formula, px + 14, py + 10)

        const termH = 28
        const termY = py + 34
        const itemW = Math.min(130, (pw - 28) / m)
        const totalItemsW = itemW * m
        const startX = px + (pw - totalItemsW) / 2

        for (let i = 0; i < m; i++) {
          const ix = startX + i * itemW
          const rowA = matrixA[i]
          const colB = matrixB.map(row => row[j])
          let sum = 0
          for (let k = 0; k < p; k++) sum += rowA[k] * colB[k]

          p5.fill(255)
          p5.stroke(230)
          p5.strokeWeight(1)
          p5.rect(ix + 3, termY, itemW - 6, termH, 5)

          p5.noStroke()
          p5.fill(100)
          p5.textSize(8)
          p5.textAlign(p5.CENTER, p5.TOP)
          p5.text(String.fromCharCode(65 + i), ix + itemW / 2, termY + 2)

          p5.fill(60)
          p5.textSize(9)
          p5.textAlign(p5.CENTER, p5.CENTER)
          const terms = rowA.map((a, k) => `${a}·${colB[k]}`).join('+')
          p5.text(terms.length > 18 ? terms.slice(0, 15) + '...' : terms, ix + itemW / 2, termY + termH / 2 + 2)
        }

        const sumY = termY + termH + 6
        p5.noStroke()
        p5.fill('#d97706')
        p5.textSize(10)
        p5.textAlign(p5.CENTER, p5.TOP)
        const vals = result.map(row => row[j].toFixed(1))
        p5.text((isZh ? '该列结果: [' : 'Column result: [') + vals.join(', ') + ']ᵀ', px + pw / 2, sumY + 4)
      }

      function drawRowPanel(p5: p5, px: number, py: number, pw: number, ph: number, i: number) {
        p5.fill(240, 248, 255)
        p5.stroke(210)
        p5.strokeWeight(1)
        p5.rect(px, py, pw, ph, 10)

        p5.noStroke()
        p5.fill(60)
        p5.textSize(11)
        p5.textAlign(p5.LEFT, p5.TOP)
        const formula = isZh
          ? `C[${String.fromCharCode(65 + i)},:] = A[${String.fromCharCode(65 + i)},:] × B   （A 的第 ${String.fromCharCode(65 + i)} 行与 B 的每一列点积）`
          : `C[${String.fromCharCode(65 + i)},:] = A[${String.fromCharCode(65 + i)},:] × B   (row ${String.fromCharCode(65 + i)} of A dot each col of B)`
        p5.text(formula, px + 14, py + 10)

        const termH = 28
        const termY = py + 34
        const itemW = Math.min(130, (pw - 28) / n)
        const totalItemsW = itemW * n
        const startX = px + (pw - totalItemsW) / 2

        for (let j = 0; j < n; j++) {
          const ix = startX + j * itemW
          const rowA = matrixA[i]
          const colB = matrixB.map(row => row[j])
          let sum = 0
          for (let k = 0; k < p; k++) sum += rowA[k] * colB[k]

          p5.fill(255)
          p5.stroke(230)
          p5.strokeWeight(1)
          p5.rect(ix + 3, termY, itemW - 6, termH, 5)

          p5.noStroke()
          p5.fill(100)
          p5.textSize(8)
          p5.textAlign(p5.CENTER, p5.TOP)
          p5.text(String.fromCharCode(97 + j), ix + itemW / 2, termY + 2)

          p5.fill(60)
          p5.textSize(9)
          p5.textAlign(p5.CENTER, p5.CENTER)
          const terms = rowA.map((a, k) => `${a}·${colB[k]}`).join('+')
          p5.text(terms.length > 18 ? terms.slice(0, 15) + '...' : terms, ix + itemW / 2, termY + termH / 2 + 2)
        }

        const sumY = termY + termH + 6
        p5.noStroke()
        p5.fill('#4b7bec')
        p5.textSize(10)
        p5.textAlign(p5.CENTER, p5.TOP)
        const vals = result[i].map(v => v.toFixed(1))
        p5.text((isZh ? '该行结果: [' : 'Row result: [') + vals.join(', ') + ']', px + pw / 2, sumY + 4)
      }

      function drawOuterPanel(p5: p5, px: number, py: number, pw: number, ph: number, k: number) {
        p5.fill(250, 245, 255)
        p5.stroke(210)
        p5.strokeWeight(1)
        p5.rect(px, py, pw, ph, 10)

        // Compute outer product A[:,k] × B[k,:]
        const outer: number[][] = []
        for (let i = 0; i < m; i++) {
          outer[i] = []
          for (let j = 0; j < n; j++) {
            outer[i][j] = matrixA[i][k] * matrixB[k][j]
          }
        }

        p5.noStroke()
        p5.fill(60)
        p5.textSize(11)
        p5.textAlign(p5.LEFT, p5.TOP)
        const formula = isZh
          ? `外积 ${String.fromCharCode(97 + k)}: A[:,${String.fromCharCode(97 + k)}] × B[${String.fromCharCode(97 + k)},:]  （累加所有外积得 C）`
          : `Outer ${String.fromCharCode(97 + k)}: A[:,${String.fromCharCode(97 + k)}] × B[${String.fromCharCode(97 + k)},:]  (sum all outer products = C)`
        p5.text(formula, px + 14, py + 8)

        // Show outer product mini matrix
        const miniCell = 22
        const miniW = n * miniCell
        const miniH = m * miniCell
        const miniX = px + 14
        const miniY = py + 28

        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const x = miniX + j * miniCell
            const y = miniY + i * miniCell
            p5.fill(255)
            p5.stroke(200)
            p5.strokeWeight(0.5)
            p5.rect(x, y, miniCell, miniCell)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(7)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(outer[i][j].toFixed(0), x + miniCell / 2, y + miniCell / 2)
          }
        }

        // Show sum preview
        p5.fill(80)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        const preview = result.map(row => '[' + row.map(v => v.toFixed(0)).join(',') + ']').join(', ')
        const shortPreview = preview.length > 50 ? preview.slice(0, 47) + '...' : preview
        p5.text((isZh ? 'C = Σ 外积 = ' : 'C = Σ outer = ') + shortPreview, miniX + miniW + 10, miniY + miniH / 2 - 5)
      }

      p5.mousePressed = () => {
        const mx = p5.mouseX
        const my = p5.mouseY
        const aY = baseY
        const cY = baseY
        const bY = baseY + (matrixBlockH - bh) / 2

        if (viewMode === 'element') {
          if (mx >= cX && mx < cX + cw && my >= cY && my < cY + ch) {
            const col = Math.floor((mx - cX) / cellSize)
            const row = Math.floor((my - cY) / cellSize)
            if (row >= 0 && row < m && col >= 0 && col < n) {
              setSelectedCell(prev => (prev && prev.i === row && prev.j === col ? null : { i: row, j: col }))
            } else { setSelectedCell(null) }
          } else { setSelectedCell(null) }
        } else if (viewMode === 'column') {
          if (mx >= cX && mx < cX + cw && my >= cY && my < cY + ch) {
            const col = Math.floor((mx - cX) / cellSize)
            if (col >= 0 && col < n) {
              setSelectedCol(prev => prev === col ? null : col)
            } else { setSelectedCol(null) }
          } else { setSelectedCol(null) }
        } else if (viewMode === 'row') {
          if (mx >= cX && mx < cX + cw && my >= cY && my < cY + ch) {
            const row = Math.floor((my - cY) / cellSize)
            if (row >= 0 && row < m) {
              setSelectedRow(prev => prev === row ? null : row)
            } else { setSelectedRow(null) }
          } else { setSelectedRow(null) }
        } else if (viewMode === 'outer') {
          // Cycle through k values on click anywhere in canvas
          if (mx >= aX && mx < aX + aw && my >= aY && my < aY + ah) {
            const col = Math.floor((mx - aX) / cellSize)
            if (col >= 0 && col < p) setSelectedK(col)
          } else if (mx >= bX && mx < bX + bw && my >= bY && my < bY + bh) {
            const row = Math.floor((my - bY) / cellSize)
            if (row >= 0 && row < p) setSelectedK(row)
          }
        }
      }
    }

    const p5Instance = new p5(sketch)
    return () => p5Instance.remove()
  }, [matrixA, matrixB, color, selectedCell, selectedRow, selectedCol, selectedK, viewMode, isZh, title])

  const modes: { key: 'element' | 'column' | 'row' | 'outer'; label: string }[] = [
    { key: 'element', label: isZh ? '元素' : 'Element' },
    { key: 'column', label: isZh ? '列视角' : 'Column' },
    { key: 'row', label: isZh ? '行视角' : 'Row' },
    { key: 'outer', label: isZh ? '外积' : 'Outer' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-center">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => {
              setViewMode(mode.key)
              setSelectedCell(null)
              setSelectedRow(null)
              setSelectedCol(null)
              setSelectedK(0)
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === mode.key
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="flex justify-center py-2" />
    </div>
  )
}
