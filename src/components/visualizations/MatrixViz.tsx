'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import p5 from 'p5'

interface MatrixVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: string
  translations?: Record<string, string>
}

export default function MatrixViz({ data, geneNames, cellTypes, lang, translations }: MatrixVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{
    row: number; col: number; value: number; gene: string; cellType: string
  } | null>(null)
  const [selectedGene, setSelectedGene] = useState<number | null>(null)
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [colorScale, setColorScale] = useState<number>(1)

  useEffect(() => {
    if (!containerRef.current) return
    if (p5Ref.current) p5Ref.current.remove()

    const sketch = (p: p5) => {
      const cellSize = 10
      const marginLeft = 80
      const marginTop = 120
      const marginRight = 20
      const marginBottom = 20
      const cols = data[0].length
      const rows = data.length
      const matrixW = cols * cellSize
      const matrixH = rows * cellSize
      const canvasW = matrixW + marginLeft + marginRight
      const canvasH = matrixH + marginTop + marginBottom
      const maxVal = Math.max(...data.flat()) * colorScale

      // Color: white → blue
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t

      p.setup = () => {
        const canvas = p.createCanvas(canvasW, canvasH)
        canvas.parent(containerRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)

        // Matrix cells
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const x = marginLeft + j * cellSize
            const y = marginTop + i * cellSize
            const value = data[i][j]
            const t = Math.min(value / maxVal, 1)

            // White to deep blue
            const r = lerp(240, 43, t)
            const g = lerp(245, 97, t)
            const b = lerp(250, 238, t)

            const isSelected = selectedGene === j || selectedCell === i
            if (isSelected) {
              p.stroke(245, 158, 11) // amber stroke
              p.strokeWeight(2)
            } else {
              p.stroke(230)
              p.strokeWeight(0.5)
            }
            p.fill(r, g, b)
            p.rect(x, y, cellSize, cellSize)
          }
        }

        // Gene labels (columns) — rotated
        p.noStroke()
        p.fill(100)
        p.textSize(8)
        p.textAlign(p.LEFT, p.CENTER)
        for (let j = 0; j < Math.min(cols, geneNames.length); j++) {
          const x = marginLeft + j * cellSize + cellSize / 2
          const y = marginTop - 4
          p.push()
          p.translate(x, y)
          p.rotate(-Math.PI / 4)
          p.text(geneNames[j], 0, 0)
          p.pop()
        }

        // Cell type labels (rows) — abbreviated
        p.textAlign(p.RIGHT, p.CENTER)
        // Show type at type boundaries
        let lastType = ''
        for (let i = 0; i < rows; i++) {
          if (cellTypes[i] !== lastType) {
            p.fill(60)
            p.textSize(8)
            p.text(cellTypes[i], marginLeft - 4, marginTop + i * cellSize + cellSize / 2)
            lastType = cellTypes[i]
          }
        }

        // Colorbar
        const cbX = canvasW - 50
        const cbY = marginTop
        const cbH = matrixH
        const cbW = 12
        for (let i = 0; i < cbH; i++) {
          const t = i / cbH
          const r = lerp(43, 240, t)
          const g = lerp(97, 245, t)
          const b = lerp(238, 250, t)
          p.stroke(r, g, b)
          p.line(cbX, cbY + i, cbX + cbW, cbY + i)
        }
        p.noStroke()
        p.fill(100)
        p.textSize(8)
        p.textAlign(p.CENTER, p.TOP)
        p.text(maxVal.toFixed(0), cbX + cbW / 2, cbY - 12)
        p.text('0', cbX + cbW / 2, cbY + cbH + 2)
      }

      p.mouseMoved = () => {
        const x = p.mouseX - marginLeft
        const y = p.mouseY - marginTop
        if (x >= 0 && x < cols * cellSize && y >= 0 && y < rows * cellSize) {
          const col = Math.floor(x / cellSize)
          const row = Math.floor(y / cellSize)
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            setHoveredCell({
              row, col,
              value: data[row][col],
              gene: geneNames[col],
              cellType: cellTypes[row],
            })
          }
        } else {
          setHoveredCell(null)
        }
      }

      p.mousePressed = () => {
        const x = p.mouseX - marginLeft
        const y = p.mouseY - marginTop
        if (x >= 0 && x < cols * cellSize && y >= 0 && y < rows * cellSize) {
          const col = Math.floor(x / cellSize)
          const row = Math.floor(y / cellSize)
          setSelectedGene(prev => prev === col ? null : col)
          setSelectedCell(prev => prev === row ? null : row)
          p.redraw()
        }
      }
    }

    p5Ref.current = new p5(sketch)
    return () => { if (p5Ref.current) p5Ref.current.remove() }
  }, [data, geneNames, cellTypes, colorScale, selectedGene, selectedCell])

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">
        <div ref={containerRef} className="p5-canvas-container" />
        <div className="control-group">
          <label>{translations?.colorScale || 'Color Scale'}</label>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={colorScale}
            onChange={(e) => setColorScale(parseFloat(e.target.value))}
            className="w-40"
          />
          <span className="font-mono text-sm text-gray-500">{colorScale.toFixed(1)}×</span>
        </div>
      </div>

      <div className="w-full lg:w-56 space-y-4 flex-shrink-0">
        {hoveredCell ? (
            <div className="bg-gray-900 text-white rounded-xl p-4 text-sm">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">{translations?.cellDetail || 'Cell Detail'}</div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">{translations?.geneLabel || 'Gene'}</span>
                <span className="font-mono font-semibold">{hoveredCell.gene}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{translations?.typeLabel || 'Type'}</span>
                <span>{hoveredCell.cellType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{translations?.valueLabel || 'Value'}</span>
                <span className="font-mono font-semibold text-[#4361ee]">{hoveredCell.value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{translations?.positionLabel || 'Position'}</span>
                <span className="font-mono text-gray-300">[{hoveredCell.row}, {hoveredCell.col}]</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
            <p className="font-semibold text-gray-700 mb-2">{translations?.interactTitle || '👆 Interact'}</p>
            <ul className="space-y-1">
              <li>{translations?.interactHover || '• Hover for cell details'}</li>
              <li>{translations?.interactClick || '• Click to highlight row/column'}</li>
              <li>{translations?.interactSlider || '• Slider adjusts color range'}</li>
            </ul>
          </div>
        )}

        {selectedGene !== null && (
          <div className="stat-card">
            <h3>{translations?.selectedGene || 'Selected Gene'}</h3>
            <div className="stat-value text-[#4361ee]">{geneNames[selectedGene]}</div>
          </div>
        )}
      </div>
    </div>
  )
}
