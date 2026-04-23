'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface MatrixVectorVizProps {
  matrix: number[][]       // M matrix (m×n)
  vector: number[]         // v vector (length n)
  labelsRows?: string[]    // 行标签 (可选)
  labelsCols?: string[]    // 列标签 (可选)
  color?: string           // 主题色 (默认 #6366f1 indigo)
  lang?: 'en' | 'zh'
}

export default function MatrixVectorViz({
  matrix,
  vector,
  labelsRows,
  labelsCols,
  color = '#6366f1',
  lang = 'en'
}: MatrixVectorVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [calculationStep, setCalculationStep] = useState<number>(0)

  // 解析颜色 (hex to RGB)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 99, g: 102, b: 241 } // default indigo
  }
  const themeRgb = hexToRgb(color)

  useEffect(() => {
    if (!containerRef.current) return

    const m = matrix.length
    const n = matrix[0].length
    const cX = Math.min(n, 8)  // 显示列数限制
    const cY = Math.min(m, 12) // 显示行数限制
    const cSz = 24 // cell size
    const mX = 80, mY = 60 // margins
    const vX = mX + cX * cSz + 30 // vector x position
    const vW = 60 // vector width
    const resultX = vX + vW + 30
    const resultW = 60

    const W = resultX + resultW + 30
    const H = mY + cY * cSz + 60

    // 计算矩阵最大值（用于颜色映射）
    const maxVal = Math.max(...matrix.flat().map(Math.abs)) || 1

    const sketch = (p: p5) => {
      p.setup = () => {
        const canvas = p.createCanvas(W, H)
        canvas.parent(containerRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)

        // Title
        p.fill(50); p.noStroke(); p.textSize(13); p.textAlign(p.LEFT, p.TOP)
        p.text(lang === 'zh' ? '矩阵 × 向量: Mv' : 'Matrix × Vector: Mv', mX, 8)
        p.fill(130); p.textSize(10)
        p.text(lang === 'zh' ? `点击 M 的行查看点积计算` : `Click a row of M to see dot product`, mX, 28)

        // Draw matrix M
        p.fill(60); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
        p.text('M', mX - 35, mY + 5)

        // Draw vector v
        p.fill(themeRgb.r, themeRgb.g, themeRgb.b, 200)
        p.textSize(9); p.textAlign(p.CENTER, p.TOP)
        p.text('v', vX + vW/2, mY + 5)

        // Draw result Mv
        p.fill(220, 20, 60, 200)
        p.textSize(9); p.textAlign(p.CENTER, p.TOP)
        p.text(lang === 'zh' ? 'Mv' : 'Mv', resultX + resultW/2, mY + 5)

        // Draw matrix cells
        for (let i = 0; i < cY; i++) {
          for (let j = 0; j < cX; j++) {
            const x = mX + j * cSz
            const y = mY + i * cSz
            const v = matrix[i][j]
            const n = v / maxVal
            const isSelected = selectedRow === i

            if (isSelected) {
              p.fill(themeRgb.r, themeRgb.g, themeRgb.b, 100)
              p.noStroke()
              p.rect(x, y, cSz, cSz)
              // 显示计算过程
              if (j < calculationStep) {
                p.fill(0)
                p.textSize(8)
                p.textAlign(p.CENTER, p.CENTER)
                const term = (matrix[i][j] * vector[j]).toFixed(1)
                p.text(term, x + cSz/2, y + cSz/2)
              }
            } else {
              // Normal cell coloring based on value
              const intensity = Math.min(Math.abs(n), 1)
              const c = p.lerpColor(p.color(255), p.color(themeRgb.r, themeRgb.g, themeRgb.b), intensity)
              p.fill(c as any)
              p.stroke(230)
              p.strokeWeight(0.5)
              p.rect(x, y, cSz, cSz)
            }

            // Row/col index
            if (j === 0) {
              p.fill(80); p.textSize(8); p.textAlign(p.RIGHT, p.CENTER)
              p.text(`${i}`, x - 4, y + cSz/2)
            }
            if (i === 0) {
              p.fill(100); p.textSize(8); p.textAlign(p.CENTER, p.BOTTOM)
              p.text(`${j}`, x + cSz/2, y - 2)
            }
          }
        }

        // Draw vector values
        for (let j = 0; j < cX; j++) {
          const x = vX
          const y = mY + j * cSz
          const v = vector[j]

          p.noStroke()
          p.fill(60)
          p.textSize(8)
          p.textAlign(p.CENTER, p.CENTER)
          p.text(`${v.toFixed(1)}`, x + vW/2, y + cSz/2)
        }

        // Draw result vector values (computed)
        if (selectedRow !== null) {
          const row = selectedRow
          let sum = 0
          for (let j = 0; j < cX; j++) {
            sum += matrix[row][j] * vector[j]
          }

          for (let j = 0; j < cX; j++) {
            const x = resultX
            const y = mY + j * cSz
            const term = matrix[row][j] * vector[j]

            p.noStroke()
            p.fill(220, 60, 60, 150 + (j < calculationStep ? 100 : 0))
            p.textSize(8)
            p.textAlign(p.CENTER, p.CENTER)
            if (j < calculationStep) {
              p.text(`${term.toFixed(1)}`, x + resultW/2, y + cSz/2)
            } else {
              p.text('?', x + resultW/2, y + cSz/2)
            }
          }

          // Sum at result vector
          p.fill(220, 60, 60)
          p.textSize(10)
          p.textAlign(p.CENTER, p.CENTER)
          p.text(`${sum.toFixed(1)}`, resultX + resultW/2, mY + cY * cSz + 15)
        }

        // Labels
        if (labelsCols) {
          p.fill(80); p.textSize(8); p.textAlign(p.CENTER, p.TOP)
          for (let j = 0; j < cX; j++) {
            p.text(labelsCols[j].substring(0, 4), mX + j*cSz + cSz/2, mY - 15)
          }
        }

        p.fill(80); p.textSize(8); p.textAlign(p.RIGHT, p.CENTER)
        if (labelsRows) {
          for (let i = 0; i < cY; i++) {
            p.text(labelsRows[i].substring(0, 6), mX - 8, mY + i*cSz + cSz/2)
          }
        }

        // Click instructions
        if (selectedRow === null) {
          p.fill(150); p.textSize(9); p.textAlign(p.CENTER, p.BOTTOM)
          p.text(
            lang === 'zh' ? '点击矩阵的行查看计算' : 'Click a row to calculate',
            W/2,
            H - 10
          )
        }
      }

      p.mouseClicked = () => {
        if (!containerRef.current) return false
        const rect = containerRef.current.getBoundingClientRect()
        const x = p.mouseX - rect.left
        const y = p.mouseY - rect.top

        // Check if click is in matrix area
        if (x >= mX && x < mX + cX * cSz &&
            y >= mY && y < mY + cY * cSz) {
          const col = Math.floor((x - mX) / cSz)
          const row = Math.floor((y - mY) / cSz)
          if (row >= 0 && row < cY && col >= 0 && col < cX) {
            setSelectedRow(prev => prev === row ? null : row)
            setCalculationStep(0)
            return true
          }
        }
        return false
      }
    }

    const sketchInstance = new p5(sketch)
    return () => sketchInstance.remove()
  }, [matrix, vector, labelsRows, labelsCols, color, lang, selectedRow, calculationStep])

  // Step animation for showing calculation terms
  useEffect(() => {
    if (selectedRow !== null && calculationStep < matrix[0].length) {
      const timer = setTimeout(() => {
        setCalculationStep(prev => prev + 1)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [selectedRow, calculationStep, matrix])

  return (
    <div ref={containerRef} className="flex justify-center" />
  )
}
