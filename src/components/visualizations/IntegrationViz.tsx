'use client'

import { useEffect, useRef } from 'react'
import p5 from 'p5'

interface IntegrationVizProps {
  projBefore: number[][]  // [[x,y], ...] 整合前坐标
  projAfter: number[][]   // [[x,y], ...] 整合后坐标
  labels: string[]        // 细胞类型
  batches: string[]       // 批次标签
  lang?: 'en' | 'zh'
  activeStep: number      // 0: intro, 1: before, 2: after, 3: compare
}

// 批次颜色
const BATCH_COLORS: Record<string, [number, number, number]> = {
  'Batch1': [66, 133, 244],   // 蓝色
  'Batch2': [234, 67, 53],    // 红色
}

export default function IntegrationViz({
  projBefore, projAfter, labels, batches, lang = 'en', activeStep
}: IntegrationVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const textZh = [
    '批次效应：不同批次的数据在空间中分离',
    '显示整合前（批次效应存在）',
    '显示整合后（批次效应消除）',
    '对比：整合前（左）vs 整合后（右）',
  ]
  const textEn = [
    'Batch effect: different batches separate in space',
    'Before integration (batch effect present)',
    'After integration (batch effect removed)',
    'Compare: before (left) vs after (right)',
  ]
  const phaseText = lang === 'zh' ? textZh[activeStep] || '' : textEn[activeStep] || ''

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p: p5) => {
      let dotsBefore: { x: number; y: number; b: string }[] = []
      let dotsAfter: { x: number; y: number; b: string }[] = []

      p.setup = () => {
        p.createCanvas(containerRef.current!.clientWidth, containerRef.current!.clientHeight)
        // 坐标归一化：输入大致 [-10..10] 映射到画布
        const scale = 18, ox = p.width / 2, oy = p.height / 2
        dotsBefore = projBefore.map((pt, i) => ({
          x: ox + pt[0] * scale,
          y: oy - pt[1] * scale,
          b: batches[i] || 'Unknown',
        }))
        dotsAfter = projAfter.map((pt, i) => ({
          x: ox + pt[0] * scale,
          y: oy - pt[1] * scale,
          b: batches[i] || 'Unknown',
        }))
      }

      p.draw = () => {
        p.background(255)
        p.textAlign(p.CENTER, p.CENTER)

        if (activeStep === 0) {
          // 介绍页
          p.fill(30)
          p.textSize(18)
          p.text('Single-Cell Integration', p.width / 2, p.height / 2 - 40)
          p.textSize(14)
          p.fill(100)
          p.text('Align cells across batches by removing batch effects', p.width / 2, p.height / 2 - 15)
          // 示意箭头
          p.stroke(150); p.strokeWeight(2)
          p.line(p.width/2 - 80, p.height/2 + 30, p.width/2 + 80, p.height/2 + 30)
          p.noStroke()
          const col1 = BATCH_COLORS['Batch1'] || [66,133,244]
          const col2 = BATCH_COLORS['Batch2'] || [234,67,53]
          p.fill(col1[0],col1[1],col1[2]); p.textSize(12); p.text('Batch1', p.width/2 - 120, p.height/2 + 40)
          p.fill(col2[0],col2[1],col2[2]); p.text('Batch2', p.width/2 + 120, p.height/2 + 40)
          return
        }

        if (activeStep === 1 || activeStep === 3) {
          drawPanel(p, dotsBefore, 0, 0, activeStep === 3 ? p.width/2 : p.width, p.height, lang === 'zh' ? '整合前' : 'Before')
        }
        if (activeStep === 2 || activeStep === 3) {
          drawPanel(p, dotsAfter, activeStep === 3 ? p.width/2 : 0, 0, activeStep === 3 ? p.width/2 : p.width, p.height, lang === 'zh' ? '整合后' : 'After')
        }
      }

      function drawPanel(p: p5, dots: {x:number; y:number; b:string}[], x0: number, y0: number, w: number, h: number, label: string) {
        p.push()
        p.fill(250); p.stroke(230); p.strokeWeight(1); p.rect(x0, y0, w, h)
        p.noStroke(); p.fill(30); p.textSize(12); p.textAlign(p.LEFT); p.text(label, x0 + 10, y0 + 20)
        // 绘制点
        for (const pt of dots) {
          const col = BATCH_COLORS[pt.b] || [150,150,150]
          p.fill(col[0], col[1], col[2], 180)
          p.noStroke()
          p.circle(x0 + pt.x, y0 + pt.y, 8)
        }
        // 图例
        p.textSize(10); p.textAlign(p.LEFT)
        Object.entries(BATCH_COLORS).forEach(([b, col], idx) => {
          p.fill(col[0], col[1], col[2])
          p.rect(x0 + 10, y0 + h - 60 + idx*16, 10, 10)
          p.fill(50)
          p.text(b, x0 + 24, y0 + h - 60 + idx*16 + 8)
        })
        p.pop()
      }

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(containerRef.current.clientWidth, containerRef.current.clientHeight)
        }
      }
    }

    const instance = new p5(sketch, containerRef.current)
    return () => instance?.remove()
  }, [projBefore, projAfter, batches, activeStep])

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full h-[500px] rounded-xl border border-gray-200 overflow-hidden bg-white" />
      <p className="text-center mt-3 text-gray-500 text-sm">{phaseText}</p>
    </div>
  )
}
