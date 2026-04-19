'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface MatrixVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
}

export default function MatrixViz({ data, geneNames, cellTypes }: MatrixVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number, value: number, gene: string, cellType: string} | null>(null)
  const [selectedGene, setSelectedGene] = useState<number | null>(null)
  const [selectedCell, setSelectedCell] = useState<number | null>(null)
  const [colorScale, setColorScale] = useState<number>(1)

  useEffect(() => {
    if (!containerRef.current) return

    // 清理之前的 p5 实例
    if (p5Ref.current) {
      p5Ref.current.remove()
    }

    const sketch = (p: p5) => {
      const cellSize = 12
      const margin = 100
      const matrixWidth = data[0].length * cellSize
      const matrixHeight = data.length * cellSize
      
      // 计算颜色范围
      const maxVal = Math.max(...data.flat()) * colorScale
      const minVal = 0

      p.setup = () => {
        const canvas = p.createCanvas(matrixWidth + margin * 2, matrixHeight + margin * 2)
        canvas.parent(containerRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)
        
        // 绘制矩阵
        for (let i = 0; i < data.length; i++) {
          for (let j = 0; j < data[i].length; j++) {
            const x = margin + j * cellSize
            const y = margin + i * cellSize
            const value = data[i][j]
            
            // 颜色映射（从白色到蓝色）
            const normalizedValue = (value - minVal) / (maxVal - minVal)
            const color = p.lerpColor(p.color(255), p.color(65, 105, 225), normalizedValue)
            
            // 高亮选中的行或列
            if (selectedGene === j || selectedCell === i) {
              p.stroke(255, 165, 0)
              p.strokeWeight(2)
            } else {
              p.stroke(200)
              p.strokeWeight(1)
            }
            
            p.fill(color)
            p.rect(x, y, cellSize, cellSize)
          }
        }
        
        // 绘制基因名称（列标签）
        p.fill(0)
        p.textSize(9)
        p.textAlign(p.CENTER, p.TOP)
        for (let j = 0; j < geneNames.length; j++) {
          const x = margin + j * cellSize + cellSize / 2
          const y = margin - 5
          p.push()
          p.translate(x, y)
          p.rotate(-p.PI / 4)
          p.text(geneNames[j], 0, 0)
          p.pop()
        }
        
        // 绘制细胞类型（行标签）
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i < cellTypes.length; i++) {
          const x = margin - 5
          const y = margin + i * cellSize + cellSize / 2
          p.text(cellTypes[i], x, y)
        }
        
        // 绘制标题
        p.textAlign(p.CENTER, p.TOP)
        p.textSize(14)
        p.text('Gene Expression Matrix', matrixWidth / 2 + margin, 10)
        
        p.textSize(10)
        p.text(\`\${data.length} cells × \${data[0].length} genes\`, matrixWidth / 2 + margin, 30)
      }

      p.mouseMoved = () => {
        if (!containerRef.current) return
        
        const rect = containerRef.current.getBoundingClientRect()
        const x = p.mouseX - margin
        const y = p.mouseY - margin
        
        if (x >= 0 && x < matrixWidth && y >= 0 && y < matrixHeight) {
          const col = Math.floor(x / cellSize)
          const row = Math.floor(y / cellSize)
          
          if (row >= 0 && row < data.length && col >= 0 && col < data[row].length) {
            setHoveredCell({
              row,
              col,
              value: data[row][col],
              gene: geneNames[col],
              cellType: cellTypes[row]
            })
            
            // 高亮单元格
            p.redraw()
          }
        } else {
          setHoveredCell(null)
        }
      }

      p.mousePressed = () => {
        const x = p.mouseX - margin
        const y = p.mouseY - margin
        
        if (x >= 0 && x < matrixWidth && y >= 0 && y < matrixHeight) {
          const col = Math.floor(x / cellSize)
          const row = Math.floor(y / cellSize)
          
          if (col >= 0 && col < geneNames.length) {
            setSelectedGene(selectedGene === col ? null : col)
          }
          if (row >= 0 && row < cellTypes.length) {
            setSelectedCell(selectedCell === row ? null : row)
          }
          
          p.redraw()
        }
      }
    }

    p5Ref.current = new p5(sketch)

    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove()
      }
    }
  }, [data, geneNames, cellTypes, colorScale, selectedGene, selectedCell])

  return (
    <div className="viz-container">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div ref={containerRef} className="p5-canvas-container" />
          
          <div className="mt-4 flex items-center gap-4">
            <label className="slider-label">Color Scale:</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={colorScale}
              onChange={(e) => setColorScale(parseFloat(e.target.value))}
              className="w-48"
            />
            <span className="slider-value">{colorScale.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="w-full md:w-64">
          {hoveredCell ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Cell Info</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-500">Gene:</span> {hoveredCell.gene}</p>
                <p><span className="text-gray-500">Cell Type:</span> {hoveredCell.cellType}</p>
                <p><span className="text-gray-500">Expression:</span> {hoveredCell.value.toFixed(2)}</p>
                <p><span className="text-gray-500">Position:</span> [{hoveredCell.row}, {hoveredCell.col}]</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Hover over cells to see details</li>
                <li>• Click rows/columns to highlight</li>
                <li>• Adjust color scale with slider</li>
              </ul>
            </div>
          )}
          
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Matrix Structure</h3>
            <div className="text-sm text-blue-800">
              <p>• <strong>Rows:</strong> Individual cells</p>
              <p>• <strong>Columns:</strong> Genes</p>
              <p>• <strong>Values:</strong> Expression levels</p>
              <p>• <strong>Zeros:</strong> Dropout events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
