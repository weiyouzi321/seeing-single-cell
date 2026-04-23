'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface MatrixVectorVizProps {
  matrix: number[][]      // M 矩阵 (m×n)
  vector: number[]        // 向量 v (length n)
  color?: string          // 主题色 (indigo #6366f1)
  onResult?: (result: number[]) => void
  lang?: 'en' | 'zh'
  title?: string
}

export default function MatrixVectorViz({
  matrix,
  vector,
  color = '#6366f1',
  onResult,
  lang = 'en',
  title = 'Matrix × Vector'
}: MatrixVectorVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isZh = lang === 'zh'

  const m = matrix.length
  const n = matrix[0]?.length || 0

  const result = matrix.map(row => row.reduce((sum, val, j) => sum + val * vector[j], 0))

  const [viewMode, setViewMode] = useState<'row-dot' | 'col-combo'>('row-dot')
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedCol, setSelectedCol] = useState<number | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (onResult) onResult(result)

    const sketch = (p5: p5) => {
      const cellSize = 36
      const innerGap = 50
      const marginTop = 70
      const marginLeft = 50
      const marginRight = 50
      const marginBottom = 55
      const panelGap = 28
      const panelH = 110
      const vecW = Math.round(cellSize * 1.6)

      const matrixW = n * cellSize
      const matrixH = m * cellSize
      const vH = n * cellSize
      const rH = m * cellSize

      const mX = marginLeft
      const timesX = mX + matrixW + innerGap
      const vX = timesX + innerGap
      const eqX = vX + vecW + innerGap
      const rX = eqX + innerGap

      const totalW = rX + vecW + marginRight
      const matrixBlockH = Math.max(matrixH, vH, rH)
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

        const mY = baseY + (matrixBlockH - matrixH) / 2
        const vY = baseY + (matrixBlockH - vH) / 2
        const rY = baseY + (matrixBlockH - rH) / 2

        // 1) 名称（上方居中）
        p5.fill(80)
        p5.textSize(13)
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        p5.text('M', mX + matrixW / 2, mY - 6)
        p5.text('v', vX + vecW / 2, vY - 6)
        p5.text('Mv', rX + vecW / 2, rY - 6)

        // 2) 符号（垂直居中于矩阵区域）
        const symbolY = baseY + matrixBlockH / 2
        p5.fill(60)
        p5.textSize(20)
        p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text('×', timesX, symbolY)
        p5.text('=', eqX, symbolY)

        // 3) Matrix M
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < n; j++) {
            const x = mX + j * cellSize
            const y = mY + i * cellSize
            const isSelRow = viewMode === 'row-dot' && selectedRow !== null && i === selectedRow
            const isSelCol = viewMode === 'col-combo' && selectedCol !== null && j === selectedCol
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
            p5.textSize(10)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(matrix[i][j].toString(), x + cellSize / 2, y + cellSize / 2)
          }
        }

        // M 行标签
        p5.fill(120)
        p5.textSize(10)
        p5.textAlign(p5.RIGHT, p5.CENTER)
        for (let i = 0; i < m; i++) {
          p5.text(String.fromCharCode(65 + i), mX - 8, mY + i * cellSize + cellSize / 2)
        }
        // M 列标签
        p5.fill(120)
        p5.textSize(9)
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        for (let j = 0; j < n; j++) {
          p5.text(String.fromCharCode(97 + j), mX + j * cellSize + cellSize / 2, mY - 2)
        }

        // 4) Vector v
        for (let i = 0; i < n; i++) {
          const x = vX
          const y = vY + i * cellSize
          const isActive = viewMode === 'row-dot' ? selectedRow !== null : selectedCol === i
          if (isActive) {
            p5.fill(viewMode === 'row-dot' ? '#10b98125' : '#f59e0b25')
            p5.stroke(viewMode === 'row-dot' ? '#10b981' : '#f59e0b')
            p5.strokeWeight(2)
          } else {
            p5.fill(250, 252, 255)
            p5.stroke(220)
            p5.strokeWeight(1)
          }
          p5.rect(x, y, vecW, cellSize)
          p5.noStroke()
          p5.fill(60)
          p5.textSize(10)
          p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(vector[i].toString(), x + vecW / 2, y + cellSize / 2)
        }

        // 5) Result Mv
        for (let i = 0; i < m; i++) {
          const x = rX
          const y = rY + i * cellSize
          const isSel = viewMode === 'row-dot' && selectedRow !== null && i === selectedRow
          if (isSel) {
            p5.fill('#f59e0b')
            p5.stroke('#d97706')
            p5.strokeWeight(2)
          } else {
            p5.fill('#ecfdf5')
            p5.stroke('#10b981')
            p5.strokeWeight(1)
          }
          p5.rect(x, y, vecW, cellSize)
          p5.noStroke()
          p5.fill(60)
          p5.textSize(10)
          p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(result[i].toFixed(1), x + vecW / 2, y + cellSize / 2)
        }

        // 6) 计算面板（下方长条）
        const panelX = mX
        const panelY = baseY + matrixBlockH + panelGap
        const panelW = rX + vecW - mX

        if (viewMode === 'row-dot' && selectedRow !== null) {
          const i = selectedRow

          p5.fill(250, 255, 250)
          p5.stroke(210)
          p5.strokeWeight(1)
          p5.rect(panelX, panelY, panelW, panelH, 10)

          p5.noStroke()
          p5.fill(60)
          p5.textSize(12)
          p5.textAlign(p5.LEFT, p5.TOP)
          const formula = isZh
            ? `Mv[${String.fromCharCode(65 + i)}] = Σ M[${String.fromCharCode(65 + i)},j]·v[j]  （行点积）`
            : `Mv[${String.fromCharCode(65 + i)}] = Σ M[${String.fromCharCode(65 + i)},j]·v[j]  (row dot product)`
          p5.text(formula, panelX + 16, panelY + 14)

          const termH = 34
          const termY = panelY + 44
          const itemW = Math.min(140, (panelW - 32) / n)
          const totalItemsW = itemW * n
          const startX = panelX + (panelW - totalItemsW) / 2

          for (let j = 0; j < n; j++) {
            const itemX = startX + j * itemW
            const mVal = matrix[i][j]
            const vVal = vector[j]
            const prod = mVal * vVal

            p5.fill(255)
            p5.stroke(230)
            p5.strokeWeight(1)
            p5.rect(itemX + 4, termY, itemW - 8, termH, 6)

            p5.noStroke()
            p5.fill(100)
            p5.textSize(9)
            p5.textAlign(p5.CENTER, p5.TOP)
            p5.text(`j=${j + 1}`, itemX + itemW / 2, termY + 4)

            p5.fill(60)
            p5.textSize(10)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(`${mVal} × ${vVal} = ${prod.toFixed(1)}`, itemX + itemW / 2, termY + termH / 2 + 3)
          }

          const sumY = termY + termH + 10
          p5.stroke(200)
          p5.strokeWeight(1)
          p5.line(panelX + 16, sumY, panelX + panelW - 16, sumY)

          p5.noStroke()
          p5.fill('#059669')
          p5.textSize(12)
          p5.textAlign(p5.CENTER, p5.TOP)
          const sumText = isZh
            ? `总和  =  ${result[i].toFixed(1)}`
            : `Sum  =  ${result[i].toFixed(1)}`
          p5.text(sumText, panelX + panelW / 2, sumY + 8)
        } else if (viewMode === 'col-combo' && selectedCol !== null) {
          const j = selectedCol
          const colScaled = matrix.map(row => row[j] * vector[j])

          p5.fill(255, 250, 240)
          p5.stroke(210)
          p5.strokeWeight(1)
          p5.rect(panelX, panelY, panelW, panelH, 10)

          p5.noStroke()
          p5.fill(60)
          p5.textSize(12)
          p5.textAlign(p5.LEFT, p5.TOP)
          const formula = isZh
            ? `v[${String.fromCharCode(97 + j)}]·M[:,${String.fromCharCode(97 + j)}] = ${vector[j]} × [${matrix.map(r => r[j]).join(', ')}]ᵀ`
            : `v[${String.fromCharCode(97 + j)}]·M[:,${String.fromCharCode(97 + j)}] = ${vector[j]} × [${matrix.map(r => r[j]).join(', ')}]ᵀ`
          p5.text(formula, panelX + 16, panelY + 10)

          // Show scaled column values
          const termH = 30
          const termY = panelY + 38
          const itemW = Math.min(120, (panelW - 32) / m)
          const totalItemsW = itemW * m
          const startX = panelX + (panelW - totalItemsW) / 2

          for (let i = 0; i < m; i++) {
            const itemX = startX + i * itemW
            p5.fill(255)
            p5.stroke(230)
            p5.strokeWeight(1)
            p5.rect(itemX + 4, termY, itemW - 8, termH, 6)

            p5.noStroke()
            p5.fill(100)
            p5.textSize(8)
            p5.textAlign(p5.CENTER, p5.TOP)
            p5.text(String.fromCharCode(65 + i), itemX + itemW / 2, termY + 3)

            p5.fill(60)
            p5.textSize(9)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(`${matrix[i][j]}×${vector[j]}=${colScaled[i].toFixed(1)}`, itemX + itemW / 2, termY + termH / 2 + 3)
          }

          const sumY = termY + termH + 8
          p5.stroke(200)
          p5.strokeWeight(1)
          p5.line(panelX + 16, sumY, panelX + panelW - 16, sumY)

          p5.noStroke()
          p5.fill('#d97706')
          p5.textSize(11)
          p5.textAlign(p5.CENTER, p5.TOP)
          const contribText = isZh
            ? `该列对 Mv 的贡献: [${colScaled.map(v => v.toFixed(1)).join(', ')}]ᵀ  （累加所有列得最终结果）`
            : `Contribution to Mv: [${colScaled.map(v => v.toFixed(1)).join(', ')}]ᵀ  (sum all columns for final result)`
          p5.text(contribText, panelX + panelW / 2, sumY + 6)
        } else {
          p5.fill(245)
          p5.stroke(230)
          p5.strokeWeight(1)
          p5.rect(panelX, panelY, panelW, panelH, 10)

          p5.noStroke()
          p5.fill(180)
          p5.textSize(11)
          p5.textAlign(p5.CENTER, p5.CENTER)
          const hint = viewMode === 'row-dot'
            ? (isZh ? '点击 Mv 的任意元素查看行点积计算' : 'Click any element in Mv to see row-wise dot product')
            : (isZh ? '点击 v 的任意元素查看列线性组合' : 'Click any element in v to see column-wise linear combination')
          p5.text(hint, panelX + panelW / 2, panelY + panelH / 2)
        }

        // 标题 + 视角标签
        if (title) {
          p5.fill(60)
          p5.textSize(14)
          p5.textAlign(p5.LEFT, p5.TOP)
          p5.text(title, marginLeft, 18)
        }
        p5.fill(130)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.text(
          viewMode === 'row-dot'
            ? (isZh ? '视角: 行点积  Mvᵢ = Mᵢ · v' : 'View: Row dot product  Mvᵢ = Mᵢ · v')
            : (isZh ? '视角: 列线性组合  Mv = Σ vⱼ·M[:,j]' : 'View: Column combination  Mv = Σ vⱼ·M[:,j]'),
          marginLeft, 36
        )
      }

      p5.mousePressed = () => {
        const mx = p5.mouseX
        const my = p5.mouseY

        if (viewMode === 'row-dot') {
          const rY = baseY + (matrixBlockH - rH) / 2
          if (mx >= rX && mx < rX + vecW && my >= rY && my < rY + rH) {
            const row = Math.floor((my - rY) / cellSize)
            if (row >= 0 && row < m) {
              setSelectedRow(prev => (prev === row ? null : row))
            } else {
              setSelectedRow(null)
            }
          } else {
            setSelectedRow(null)
          }
        } else {
          // col-combo: click on v vector
          const vY = baseY + (matrixBlockH - vH) / 2
          if (mx >= vX && mx < vX + vecW && my >= vY && my < vY + vH) {
            const col = Math.floor((my - vY) / cellSize)
            if (col >= 0 && col < n) {
              setSelectedCol(prev => (prev === col ? null : col))
            } else {
              setSelectedCol(null)
            }
          } else {
            setSelectedCol(null)
          }
        }
      }
    }

    const p5Instance = new p5(sketch)
    return () => p5Instance.remove()
  }, [matrix, vector, color, selectedRow, selectedCol, viewMode, isZh, title, result, onResult])

  const modes: { key: 'row-dot' | 'col-combo'; label: string }[] = [
    { key: 'row-dot', label: isZh ? '行点积' : 'Row Dot' },
    { key: 'col-combo', label: isZh ? '列组合' : 'Col Combo' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-center">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => { setViewMode(mode.key); setSelectedRow(null); setSelectedCol(null) }}
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
      <div ref={containerRef} className="flex justify-center py-2" />
    </div>
  )
}
