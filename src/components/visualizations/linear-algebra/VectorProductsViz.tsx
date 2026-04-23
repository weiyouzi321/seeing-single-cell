'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface VectorProductsVizProps {
  v: number[]
  w: number[]
  color?: string
  lang?: 'en' | 'zh'
}

export default function VectorProductsViz({ v, w, color = '#6366f1', lang = 'en' }: VectorProductsVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isZh = lang === 'zh'
  const [mode, setMode] = useState<'dot' | 'outer'>('dot')
  const [selectedCell, setSelectedCell] = useState<{ i: number; j: number } | null>(null)

  const n = v.length
  const m = w.length

  const dotProd = v.reduce((sum, val, i) => sum + val * w[i], 0)

  const outerProd: number[][] = []
  for (let i = 0; i < n; i++) {
    outerProd[i] = []
    for (let j = 0; j < m; j++) {
      outerProd[i][j] = v[i] * w[j]
    }
  }

  useEffect(() => {
    setSelectedCell(null)
  }, [mode])

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p5: p5) => {
      const cellSize = 36
      const innerGap = 50
      const marginTop = 55
      const marginLeft = 50
      const marginRight = 50
      const marginBottom = 55
      const panelGap = 28
      const panelH = 110

      let totalW: number, totalH: number

      if (mode === 'dot') {
        const vW = n * cellSize
        const wW = n * cellSize
        const rW = Math.round(cellSize * 2)
        const vX = marginLeft
        const timesX = vX + vW + innerGap
        const wX = timesX + innerGap
        const eqX = wX + wW + innerGap
        const rX = eqX + innerGap
        totalW = rX + rW + marginRight
        totalH = marginTop + 18 + cellSize + panelGap + panelH + marginBottom
      } else {
        const leftArea = marginLeft + cellSize + 30
        const topArea = marginTop + 18 + cellSize + 20
        totalW = leftArea + m * cellSize + marginRight
        totalH = topArea + n * cellSize + panelGap + panelH + marginBottom
      }

      p5.setup = () => {
        const canvas = p5.createCanvas(totalW, totalH)
        canvas.parent(containerRef.current!)
        p5.textFont('Inter')
        p5.noLoop()
      }

      p5.draw = () => {
        p5.background(255)

        if (mode === 'dot') {
          const vW = n * cellSize
          const wW = n * cellSize
          const rW = Math.round(cellSize * 2)
          const vX = marginLeft
          const timesX = vX + vW + innerGap
          const wX = timesX + innerGap
          const eqX = wX + wW + innerGap
          const rX = eqX + innerGap
          const baseY = marginTop + 18

          // 名称上方居中
          p5.fill(80)
          p5.textSize(13)
          p5.textAlign(p5.CENTER, p5.BOTTOM)
          p5.text('vᵀ', vX + vW / 2, baseY - 6)
          p5.text('w', wX + wW / 2, baseY - 6)
          p5.text(isZh ? '点积' : 'Dot', rX + rW / 2, baseY - 6)

          // 符号
          const symbolY = baseY + cellSize / 2
          p5.fill(60)
          p5.textSize(20)
          p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text('×', timesX, symbolY)
          p5.text('=', eqX, symbolY)

          // v 向量
          for (let i = 0; i < n; i++) {
            const x = vX + i * cellSize
            const y = baseY
            p5.fill(color + '25')
            p5.stroke(color)
            p5.strokeWeight(2)
            p5.rect(x, y, cellSize, cellSize, 3)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(10)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(v[i].toString(), x + cellSize / 2, y + cellSize / 2)
          }

          // w 向量
          for (let i = 0; i < n; i++) {
            const x = wX + i * cellSize
            const y = baseY
            p5.fill('#10b98125')
            p5.stroke('#10b981')
            p5.strokeWeight(2)
            p5.rect(x, y, cellSize, cellSize, 3)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(10)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(w[i].toString(), x + cellSize / 2, y + cellSize / 2)
          }

          // 标量结果
          p5.fill('#f59e0b30')
          p5.stroke('#f59e0b')
          p5.strokeWeight(2)
          p5.rect(rX, baseY, rW, cellSize, 3)
          p5.noStroke()
          p5.fill(60)
          p5.textSize(14)
          p5.textAlign(p5.CENTER, p5.CENTER)
          p5.text(dotProd.toString(), rX + rW / 2, baseY + cellSize / 2)

          // 面板（始终显示）
          const panelX = vX
          const panelY = baseY + cellSize + panelGap
          const panelW = rX + rW - vX

          p5.fill(250, 255, 250)
          p5.stroke(210)
          p5.strokeWeight(1)
          p5.rect(panelX, panelY, panelW, panelH, 10)

          p5.noStroke()
          p5.fill(60)
          p5.textSize(12)
          p5.textAlign(p5.LEFT, p5.TOP)
          p5.text(isZh ? 'vᵀ·w = Σ v[i]·w[i]' : 'vᵀ·w = Σ v[i]·w[i]', panelX + 16, panelY + 14)

          const termH = 34
          const termY = panelY + 44
          const itemW = Math.min(140, (panelW - 32) / n)
          const totalItemsW = itemW * n
          const startX = panelX + (panelW - totalItemsW) / 2

          for (let i = 0; i < n; i++) {
            const itemX = startX + i * itemW
            const vi = v[i]
            const wi = w[i]
            const prod = vi * wi

            p5.fill(255)
            p5.stroke(230)
            p5.strokeWeight(1)
            p5.rect(itemX + 4, termY, itemW - 8, termH, 6)

            p5.noStroke()
            p5.fill(100)
            p5.textSize(9)
            p5.textAlign(p5.CENTER, p5.TOP)
            p5.text(`i=${i + 1}`, itemX + itemW / 2, termY + 4)

            p5.fill(60)
            p5.textSize(10)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(`${vi} × ${wi} = ${prod.toFixed(1)}`, itemX + itemW / 2, termY + termH / 2 + 3)
          }

          const sumY = termY + termH + 10
          p5.stroke(200)
          p5.strokeWeight(1)
          p5.line(panelX + 16, sumY, panelX + panelW - 16, sumY)

          p5.noStroke()
          p5.fill('#059669')
          p5.textSize(12)
          p5.textAlign(p5.CENTER, p5.TOP)
          const sumText = isZh ? `总和  =  ${dotProd.toFixed(1)}` : `Sum  =  ${dotProd.toFixed(1)}`
          p5.text(sumText, panelX + panelW / 2, sumY + 8)

        } else {
          // ── Outer Product ──
          const leftArea = marginLeft + cellSize + 30
          const topArea = marginTop + 18 + cellSize + 20
          const matX = leftArea
          const matY = topArea
          const vX = marginLeft
          const vY = topArea
          const wX = leftArea
          const wY = marginTop + 18

          // wᵀ 名称
          p5.fill(80)
          p5.textSize(13)
          p5.textAlign(p5.CENTER, p5.BOTTOM)
          p5.text('wᵀ', wX + m * cellSize / 2, wY - 6)

          // w 向量（上方）
          for (let j = 0; j < m; j++) {
            const x = wX + j * cellSize
            const y = wY
            const isSelCol = selectedCell && j === selectedCell.j
            if (isSelCol) {
              p5.fill('#10b98125')
              p5.stroke('#10b981')
              p5.strokeWeight(2)
            } else {
              p5.fill(250, 252, 255)
              p5.stroke(220)
              p5.strokeWeight(1)
            }
            p5.rect(x, y, cellSize, cellSize, 3)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(10)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(w[j].toString(), x + cellSize / 2, y + cellSize / 2)
          }

          // v 名称
          p5.fill(80)
          p5.textSize(13)
          p5.textAlign(p5.RIGHT, p5.CENTER)
          p5.text('v', vX - 8, vY + n * cellSize / 2)

          // v 向量（左侧）
          for (let i = 0; i < n; i++) {
            const x = vX
            const y = vY + i * cellSize
            const isSelRow = selectedCell && i === selectedCell.i
            if (isSelRow) {
              p5.fill(color + '25')
              p5.stroke(color)
              p5.strokeWeight(2)
            } else {
              p5.fill(250, 252, 255)
              p5.stroke(220)
              p5.strokeWeight(1)
            }
            p5.rect(x, y, cellSize, cellSize, 3)
            p5.noStroke()
            p5.fill(60)
            p5.textSize(10)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(v[i].toString(), x + cellSize / 2, y + cellSize / 2)
          }

          // 结果矩阵
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
              const x = matX + j * cellSize
              const y = matY + i * cellSize
              const isSel = selectedCell && i === selectedCell.i && j === selectedCell.j
              if (isSel) {
                p5.fill('#f59e0b')
                p5.stroke('#d97706')
                p5.strokeWeight(2)
              } else {
                const intensity = Math.min(1, Math.abs(outerProd[i][j]) / 50)
                p5.fill(250, 250 - intensity * 30, 235 - intensity * 20)
                p5.stroke(220)
                p5.strokeWeight(1)
              }
              p5.rect(x, y, cellSize, cellSize)
              p5.noStroke()
              p5.fill(60)
              p5.textSize(10)
              p5.textAlign(p5.CENTER, p5.CENTER)
              p5.text(outerProd[i][j].toString(), x + cellSize / 2, y + cellSize / 2)
            }
          }

          // 面板（矩阵下方）
          const panelX = matX
          const panelY = matY + n * cellSize + panelGap
          const panelW = m * cellSize

          if (selectedCell) {
            const { i, j } = selectedCell

            p5.fill(250, 255, 250)
            p5.stroke(210)
            p5.strokeWeight(1)
            p5.rect(panelX, panelY, panelW, panelH, 10)

            p5.noStroke()
            p5.fill(60)
            p5.textSize(12)
            p5.textAlign(p5.LEFT, p5.TOP)
            p5.text(
              `(${String.fromCharCode(65 + i)},${String.fromCharCode(65 + j)}) = v[${String.fromCharCode(65 + i)}] × w[${String.fromCharCode(65 + j)}]`,
              panelX + 16, panelY + 14
            )

            const vi = v[i]
            const wj = w[j]
            const prod = outerProd[i][j]

            p5.fill(255)
            p5.stroke(230)
            p5.strokeWeight(1)
            const cardW = 180
            const cardH = 40
            const cardX = panelX + (panelW - cardW) / 2
            const cardY = panelY + 50
            p5.rect(cardX, cardY, cardW, cardH, 6)

            p5.noStroke()
            p5.fill(60)
            p5.textSize(12)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(`${vi} × ${wj} = ${prod}`, cardX + cardW / 2, cardY + cardH / 2)

            p5.fill('#059669')
            p5.textSize(11)
            p5.textAlign(p5.CENTER, p5.TOP)
            p5.text(isZh ? '外积矩阵元素' : 'Outer product element', panelX + panelW / 2, panelY + panelH - 22)
          } else {
            p5.fill(245)
            p5.stroke(230)
            p5.strokeWeight(1)
            p5.rect(panelX, panelY, panelW, panelH, 10)

            p5.noStroke()
            p5.fill(180)
            p5.textSize(11)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(
              isZh ? '点击矩阵的任意元素查看计算' : 'Click any matrix element to see calculation',
              panelX + panelW / 2, panelY + panelH / 2
            )
          }
        }
      }

      p5.mousePressed = () => {
        if (mode !== 'outer') return

        const leftArea = marginLeft + cellSize + 30
        const topArea = marginTop + 18 + cellSize + 20
        const matX = leftArea
        const matY = topArea

        const mx = p5.mouseX
        const my = p5.mouseY

        if (mx >= matX && mx < matX + m * cellSize && my >= matY && my < matY + n * cellSize) {
          const col = Math.floor((mx - matX) / cellSize)
          const row = Math.floor((my - matY) / cellSize)
          if (row >= 0 && row < n && col >= 0 && col < m) {
            setSelectedCell(prev => (prev && prev.i === row && prev.j === col ? null : { i: row, j: col }))
          } else {
            setSelectedCell(null)
          }
        } else {
          setSelectedCell(null)
        }
      }
    }

    const p5Instance = new p5(sketch)
    return () => p5Instance.remove()
  }, [v, w, mode, color, selectedCell, isZh, dotProd, outerProd, n, m])

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setMode('dot')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'dot'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isZh ? '点积 vᵀ·w' : 'Dot Product vᵀ·w'}
        </button>
        <button
          onClick={() => setMode('outer')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'outer'
              ? 'bg-indigo-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isZh ? '外积 v·wᵀ' : 'Outer Product v·wᵀ'}
        </button>
      </div>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  )
}
