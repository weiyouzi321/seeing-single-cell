'use client'

import { useEffect, useRef, useState } from 'react'

interface UmapData {
  metadata: { n_cells: number; method: string }
  cell_types: string[]
  umap: number[][]
}

const TYPE_COLORS: Record<string, string> = {
  'CD4 T': '#4361ee',
  'CD8 T': '#ef4444',
  'B': '#10b981',
  'NK': '#f59e0b',
  'Monocyte': '#a855f7',
  'DC': '#06b6d4',
  'Platelet': '#94a3b8',
  'CD14+ Monocytes': '#fb923c',
  'FCGR3A+ Monocytes': '#ec4899',
  'CD14+ Monocytes ': '#fb923c',
}

function getColor(type: string) {
  return TYPE_COLORS[type] || '#94a3b8'
}

export default function SeuratUMAP({ isSection = false }: { isSection?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [data, setData] = useState<UmapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_BASE_PATH
      ? `${process.env.NEXT_PUBLIC_BASE_PATH}/data/pbmc_dimred.json`
      : '/data/pbmc_dimred.json'
    )
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!data || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Background
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, w, h)

    const points = data.umap
    const cellTypes = data.cell_types

    // Compute bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    points.forEach((p) => {
      if (p[0] < minX) minX = p[0]
      if (p[0] > maxX) maxX = p[0]
      if (p[1] < minY) minY = p[1]
      if (p[1] > maxY) maxY = p[1]
    })

    const pad = 30
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scale = Math.min((w - pad * 2) / rangeX, (h - pad * 2) / rangeY)

    const sx = (x: number) => pad + (x - minX) * scale
    const sy = (y: number) => h - pad - (y - minY) * scale

    // Draw grid
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 10; i++) {
      const x = pad + (w - 2 * pad) * i / 10
      ctx.beginPath()
      ctx.moveTo(x, pad)
      ctx.lineTo(x, h - pad)
      ctx.stroke()
    }
    for (let i = 0; i <= 8; i++) {
      const y = pad + (h - 2 * pad) * i / 8
      ctx.beginPath()
      ctx.moveTo(pad, y)
      ctx.lineTo(w - pad, y)
      ctx.stroke()
    }

    // Draw points
    points.forEach((p, i) => {
      const x = sx(p[0])
      const y = sy(p[1])
      const color = getColor(cellTypes[i])
      ctx.fillStyle = color
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Axis labels
    ctx.fillStyle = '#64748b'
    ctx.font = '11px sans-serif'
    ctx.fillText('UMAP 1', w - 50, h - 5)
    ctx.save()
    ctx.translate(10, 15)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('UMAP 2', 0, 0)
    ctx.restore()

    // Legend
    const uniqueTypes = [...new Set(cellTypes)]
    let legendY = 30
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.fillRect(w - 130, 20, 120, 20 + uniqueTypes.length * 18 + 10)
    ctx.strokeRect(w - 130, 20, 120, 20 + uniqueTypes.length * 18 + 10)

    ctx.fillStyle = '#374151'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('Cell Types', w - 120, 38)

    ctx.font = '10px sans-serif'
    uniqueTypes.forEach((t) => {
      ctx.fillStyle = getColor(t)
      ctx.beginPath()
      ctx.arc(w - 120, legendY + 6, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#374151'
      ctx.fillText(t, w - 110, legendY + 9)
      legendY += 18
    })
  }, [data])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"/></div>
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-800">
      <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          UMAP Visualization — PBMC 3K
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-auto block"
        style={{ maxWidth: '100%' }}
      />
    </div>
  )
}
