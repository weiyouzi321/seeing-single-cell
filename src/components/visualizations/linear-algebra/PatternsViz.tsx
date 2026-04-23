'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface PatternsVizProps {
  color?: string
  lang?: 'en' | 'zh'
}

export default function PatternsViz({ color = '#6366f1', lang = 'en' }: PatternsVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isZh = lang === 'zh'
  const [pattern, setPattern] = useState<'diagonal' | 'symmetric' | 'rank1' | 'identity'>('diagonal')

  const n = 6

  function getMatrix(pattern: string): number[][] {
    const mat: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
    if (pattern === 'diagonal') {
      for (let i = 0; i < n; i++) mat[i][i] = Math.floor(Math.random() * 15) + 1
    } else if (pattern === 'symmetric') {
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          const val = Math.floor(Math.random() * 10)
          mat[i][j] = val
          mat[j][i] = val
        }
      }
    } else if (pattern === 'rank1') {
      const u = Array.from({ length: n }, () => Math.floor(Math.random() * 5) + 1)
      const v = Array.from({ length: n }, () => Math.floor(Math.random() * 5) + 1)
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          mat[i][j] = u[i] * v[j]
        }
      }
    } else if (pattern === 'identity') {
      for (let i = 0; i < n; i++) mat[i][i] = 1
    }
    return mat
  }

  const matrix = getMatrix(pattern)

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p5: p5) => {
      const cellSize = 44
      const marginLeft = 60
      const marginTop = 80

      const canvasW = marginLeft + n * cellSize + 40
      const canvasH = marginTop + n * cellSize + 80

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

        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            const x = mx + j * cellSize
            const y = my + i * cellSize
            const val = matrix[i][j]

            let fillColor: [number, number, number]
            if (pattern === 'diagonal') {
              fillColor = i === j ? [99, 102, 241] : [245, 245, 245]
            } else if (pattern === 'symmetric') {
              fillColor = i === j ? [99, 102, 241] : i < j ? [167, 139, 250] : [196, 181, 253]
            } else if (pattern === 'rank1') {
              const intensity = Math.min(1, val / 25)
              fillColor = [
                250 - intensity * 150,
                250 - intensity * 100,
                235 - intensity * 100
              ]
            } else {
              fillColor = i === j ? [99, 102, 241] : [245, 245, 245]
            }

            p5.fill(fillColor[0], fillColor[1], fillColor[2])
            p5.stroke(200)
            p5.strokeWeight(1)
            p5.rect(x, y, cellSize, cellSize)

            p5.noStroke()
            p5.fill(val > 15 ? 255 : 60)
            p5.textSize(11)
            p5.textAlign(p5.CENTER, p5.CENTER)
            p5.text(val.toString(), x + cellSize / 2, y + cellSize / 2)
          }
        }

        // Labels
        p5.fill(100)
        p5.textSize(10)
        p5.textAlign(p5.RIGHT, p5.CENTER)
        for (let i = 0; i < n; i++) {
          p5.text('R' + (i + 1), mx - 8, my + i * cellSize + cellSize / 2)
        }
        p5.textAlign(p5.CENTER, p5.BOTTOM)
        for (let j = 0; j < n; j++) {
          p5.text('C' + (j + 1), mx + j * cellSize + cellSize / 2, my - 8)
        }

        // Pattern label
        p5.fill(80)
        p5.textSize(12)
        p5.textAlign(p5.LEFT, p5.TOP)
        const labels: Record<string, string> = {
          diagonal: isZh ? '对角矩阵: 只有对角线非零' : 'Diagonal: Only diagonal entries are non-zero',
          symmetric: isZh ? '对称矩阵: A = Aᵀ' : 'Symmetric: A = Aᵀ',
          rank1: isZh ? '秩-1 矩阵: 所有列都是同一列的倍数' : 'Rank-1: All columns are multiples of one column',
          identity: isZh ? '单位矩阵: 对角线为 1，其余为 0' : 'Identity: Diagonal is 1, rest is 0',
        }
        p5.text(labels[pattern], mx, 20)
      }
    }

    const p5Instance = new p5(sketch)
    return () => p5Instance.remove()
  }, [pattern, matrix])

  const patterns: { key: 'diagonal' | 'symmetric' | 'rank1' | 'identity'; label: string }[] = [
    { key: 'diagonal', label: isZh ? '对角' : 'Diagonal' },
    { key: 'symmetric', label: isZh ? '对称' : 'Symmetric' },
    { key: 'rank1', label: isZh ? '秩-1' : 'Rank-1' },
    { key: 'identity', label: isZh ? '单位矩阵' : 'Identity' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center flex-wrap">
        {patterns.map((p) => (
          <button
            key={p.key}
            onClick={() => setPattern(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              pattern === p.key
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div ref={containerRef} className="flex justify-center" />
    </div>
  )
}
