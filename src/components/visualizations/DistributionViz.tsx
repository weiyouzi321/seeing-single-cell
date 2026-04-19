'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface DistributionVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
}

export default function DistributionViz({ data, geneNames, cellTypes }: DistributionVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)
  const [selectedGene, setSelectedGene] = useState<number>(0)
  const [binCount, setBinCount] = useState<number>(20)
  const [showKDE, setShowKDE] = useState<boolean>(true)
  const [distributionType, setDistributionType] = useState<'histogram' | 'density'>('histogram')

  // 获取选中基因的表达数据
  const getGeneData = (geneIndex: number) => {
    return data.map(row => row[geneIndex])
  }

  // 计算直方图
  const calculateHistogram = (values: number[], bins: number) => {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const binWidth = (max - min) / bins
    
    const histogram = new Array(bins).fill(0)
    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1)
      histogram[binIndex]++
    })
    
    return {
      histogram,
      binEdges: Array.from({ length: bins + 1 }, (_, i) => min + i * binWidth)
    }
  }

  // 计算核密度估计
  const calculateKDE = (values: number[], bandwidth: number = 0.5) => {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = (max - min) / 100
    
    const x = Array.from({ length: 101 }, (_, i) => min + i * step)
    const y = x.map(xi => {
      const sum = values.reduce((acc, v) => {
        const z = (xi - v) / bandwidth
        return acc + Math.exp(-0.5 * z * z) / (bandwidth * Math.sqrt(2 * Math.PI))
      }, 0)
      return sum / values.length
    })
    
    return { x, y }
  }

  useEffect(() => {
    if (!containerRef.current) return

    if (p5Ref.current) {
      p5Ref.current.remove()
    }

    const sketch = (p: p5) => {
      const width = 600
      const height = 400
      const margin = 60
      const plotWidth = width - margin * 2
      const plotHeight = height - margin * 2

      p.setup = () => {
        const canvas = p.createCanvas(width, height)
        canvas.parent(containerRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)
        
        const geneData = getGeneData(selectedGene)
        const { histogram, binEdges } = calculateHistogram(geneData, binCount)
        const kde = showKDE ? calculateKDE(geneData) : null
        
        const maxCount = Math.max(...histogram)
        const maxDensity = kde ? Math.max(...kde.y) : 0
        
        // 绘制坐标轴
        p.stroke(200)
        p.strokeWeight(1)
        p.line(margin, margin, margin, height - margin)
        p.line(margin, height - margin, width - margin, height - margin)
        
        // 绘制网格线
        p.stroke(240)
        for (let i = 0; i <= 5; i++) {
          const y = margin + (plotHeight / 5) * i
          p.line(margin, y, width - margin, y)
        }
        
        // 绘制直方图
        if (distributionType === 'histogram') {
          const binWidth = plotWidth / binCount
          
          p.fill(74, 144, 226, 150)
          p.stroke(74, 144, 226)
          p.strokeWeight(1)
          
          histogram.forEach((count, i) => {
            const x = margin + i * binWidth
            const barHeight = (count / maxCount) * plotHeight
            const y = height - margin - barHeight
            
            p.rect(x, y, binWidth - 1, barHeight)
          })
        }
        
        // 绘制 KDE 曲线
        if (showKDE && kde) {
          p.noFill()
          p.stroke(245, 166, 35)
          p.strokeWeight(2)
          
          p.beginShape()
          kde.x.forEach((xi, i) => {
            const x = margin + ((xi - kde.x[0]) / (kde.x[kde.x.length - 1] - kde.x[0])) * plotWidth
            const y = height - margin - (kde.y[i] / maxDensity) * plotHeight
            p.vertex(x, y)
          })
          p.endShape()
        }
        
        // 绘制标题
        p.fill(0)
        p.noStroke()
        p.textSize(16)
        p.textAlign(p.CENTER, p.TOP)
        p.text(\`Distribution of \${geneNames[selectedGene]}\`, width / 2, 15)
        
        p.textSize(12)
        p.text(\`\${distributionType === 'histogram' ? 'Histogram' : 'Density'}\`, width / 2, 35)
        
        // 绘制轴标签
        p.textSize(10)
        p.textAlign(p.CENTER, p.TOP)
        p.text('Expression Level', width / 2, height - 25)
        
        p.push()
        p.translate(15, height / 2)
        p.rotate(-p.PI / 2)
        p.text('Frequency', 0, 0)
        p.pop()
        
        // 绘制刻度
        p.textSize(9)
        p.textAlign(p.CENTER, p.TOP)
        const xMin = binEdges[0]
        const xMax = binEdges[binEdges.length - 1]
        for (let i = 0; i <= 5; i++) {
          const x = margin + (plotWidth / 5) * i
          const value = xMin + (xMax - xMin) * (i / 5)
          p.text(value.toFixed(1), x, height - margin + 5)
        }
      }
    }

    p5Ref.current = new p5(sketch)

    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove()
      }
    }
  }, [data, geneNames, selectedGene, binCount, showKDE, distributionType])

  return (
    <div className="viz-container">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div ref={containerRef} className="p5-canvas-container" />
          
          <div className="mt-4 space-y-4">
            <div>
              <label className="slider-label block mb-2">Select Gene:</label>
              <select
                value={selectedGene}
                onChange={(e) => setSelectedGene(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg"
              >
                {geneNames.map((gene, index) => (
                  <option key={gene} value={index}>
                    {gene}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="slider-label block mb-2">Number of Bins: {binCount}</label>
              <input
                type="range"
                min="5"
                max="50"
                value={binCount}
                onChange={(e) => setBinCount(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showKDE}
                  onChange={(e) => setShowKDE(e.target.checked)}
                  className="mr-2"
                />
                Show KDE
              </label>
              
              <select
                value={distributionType}
                onChange={(e) => setDistributionType(e.target.value as 'histogram' | 'density')}
                className="p-2 border rounded-lg"
              >
                <option value="histogram">Histogram</option>
                <option value="density">Density</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-64 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Gene Statistics</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Gene:</strong> {geneNames[selectedGene]}</p>
              <p><strong>Mean:</strong> {(getGeneData(selectedGene).reduce((a, b) => a + b, 0) / data.length).toFixed(2)}</p>
              <p><strong>Min:</strong> {Math.min(...getGeneData(selectedGene)).toFixed(2)}</p>
              <p><strong>Max:</strong> {Math.max(...getGeneData(selectedGene)).toFixed(2)}</p>
              <p><strong>Zeros:</strong> {getGeneData(selectedGene).filter(v => v === 0).length}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Distribution Types</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>Histogram:</strong> Shows frequency counts in bins</p>
              <p><strong>KDE:</strong> Smooth probability density estimate</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Try These</h3>
            <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
              <li>Compare housekeeping genes vs cell-type markers</li>
              <li>Adjust bin count to see granularity effects</li>
              <li>Toggle KDE to see smoothing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
