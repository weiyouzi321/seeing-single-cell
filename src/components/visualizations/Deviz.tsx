'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

/* ──────────────────────────── types ──────────────────────────── */

interface DegGene {
  gene: string
  log2FC: number
  pval: number
  padj: number
  pct_A: number
  pct_B: number
  mean_A: number
  mean_B: number
}

interface DevizProps {
  degData: DegGene[]
  topMarkers: Record<string, string[]>
  cellTypes: string[]
  lang?: 'en' | 'zh'
}

/* ──────────────────────────── helpers ──────────────────────────── */

function negLog10(p: number): number {
  return p > 0 ? -Math.log10(p) : 0
}

function classifyGene(
  gene: DegGene,
  fcThresh: number,
  pThresh: number
): 'up' | 'down' | 'ns' {
  if (gene.padj < pThresh && gene.log2FC > fcThresh) return 'up'
  if (gene.padj < pThresh && gene.log2FC < -fcThresh) return 'down'
  return 'ns'
}

/* ──────────────────────────── bilingual texts ──────────────────── */

const TEXTS = {
  stepTitles: {
    en: ['What is DEG?', 'Volcano Plot', 'Statistical Methods', 'Marker Heatmap'],
    zh: ['什么是差异基因？', '火山图', '统计方法', '标记基因热图'],
  },
  introTitle: { en: 'Differential Expression Gene (DEG) Analysis', zh: '差异表达基因 (DEG) 分析' },
  introDesc: {
    en: 'DEG analysis identifies genes with statistically significant differences in expression between two conditions or cell populations. Each gene is tested using statistical methods to determine whether the observed differences are real or due to random chance.',
    zh: '差异表达基因分析识别在两个条件或细胞群体之间表达具有统计学显著差异的基因。每个基因都经过统计检验，以确定观察到的差异是真实的还是由于随机因素造成的。',
  },
  fcLabel: { en: 'Fold Change', zh: '倍数变化' },
  padjLabel: { en: 'Adjusted p-value', zh: '校正 p 值' },
  whatIsDeg: { en: 'What is DEG?', zh: '什么是差异基因？' },
  degDesc: {
    en: [
      'DEG (Differential Expression Gene) analysis compares gene expression levels between two groups to find genes that are significantly up- or down-regulated.',
      'Key concepts:',
    ],
    zh: [
      'DEG（差异表达基因）分析比较两组之间的基因表达水平，以找到显著上调或下调的基因。',
      '关键概念：',
    ],
  },
  concepts: {
    en: [
      { term: 'Log2 Fold Change', desc: 'Measures the magnitude of expression change (positive = upregulated, negative = downregulated).' },
      { term: 'P-value', desc: 'Probability that the observed difference occurred by chance.' },
      { term: 'Adjusted P-value', desc: 'P-value corrected for multiple testing (Benjamini-Hochberg).' },
      { term: 'Volcano Plot', desc: 'Visualizes both fold change and significance simultaneously.' },
    ],
    zh: [
      { term: 'Log2 倍数变化', desc: '衡量表达变化的幅度（正值=上调，负值=下调）。' },
      { term: 'P 值', desc: '观察到的差异由偶然因素产生的概率。' },
      { term: '校正 P 值', desc: '经多重检验校正后的 P 值（Benjamini-Hochberg 方法）。' },
      { term: '火山图', desc: '同时可视化倍数变化和显著性的图形。' },
    ],
  },
  statTitle: { en: 'Statistical Methods for DEG', zh: 'DEG 的统计方法' },
  statDesc: {
    en: [
      'DEG analysis typically uses:',
      '• Wilcoxon rank-sum test (non-parametric)',
      '• Likelihood-ratio test (for model-based approaches)',
      '• T-test (when assumptions are met)',
      '• Benjamini-Hochberg correction controls false discovery rate (FDR)',
    ],
    zh: [
      'DEG 分析通常使用：',
      '• Wilcoxon 秩和检验（非参数方法）',
      '• 似然比检验（基于模型的方法）',
      '• T 检验（当假设条件满足时）',
      '• Benjamini-Hochberg 校正控制错误发现率（FDR）',
    ],
  },
  volcanoTitle: { en: 'Volcano Plot', zh: '火山图' },
  volcanoSubtitle: {
    en: 'Each point is a gene. X-axis: log₂ fold change. Y-axis: -log₁₀(adjusted p-value).',
    zh: '每个点代表一个基因。X 轴：log₂ 倍数变化。Y 轴：-log₁₀(校正 p 值)。',
  },
  upregulated: { en: 'Upregulated', zh: '上调' },
  downregulated: { en: 'Downregulated', zh: '下调' },
  notSignificant: { en: 'Not significant', zh: '不显著' },
  geneLabel: { en: 'Gene', zh: '基因' },
  fcThreshold: { en: 'FC Threshold', zh: 'FC 阈值' },
  pThreshold: { en: 'P Threshold', zh: 'P 阈值' },
  markerTitle: { en: 'Top Marker Genes per Cell Type', zh: '各细胞类型的标记基因' },
  markerSubtitle: {
    en: 'Dot size = % cells expressing. Color intensity = average expression.',
    zh: '点大小 = 表达细胞百分比。颜色强度 = 平均表达量。',
  },
  cellType: { en: 'Cell Type', zh: '细胞类型' },
  expression: { en: 'Expression', zh: '表达量' },
  pctExpressing: { en: '% Expressed', zh: '表达百分比' },
  totalGenes: { en: 'Total Genes', zh: '基因总数' },
  sigUp: { en: 'Significant Up', zh: '显著上调' },
  sigDown: { en: 'Significant Down', zh: '显著下调' },
}

function t(isZh: boolean, obj: { en: string; zh: string }): string {
  return isZh ? obj.zh : obj.en
}

function tArr(isZh: boolean, obj: { en: string[]; zh: string[] }): string[] {
  return isZh ? obj.zh : obj.en
}

function tConcepts(isZh: boolean): { term: string; desc: string }[] {
  return isZh ? TEXTS.concepts.zh : TEXTS.concepts.en
}

/* ──────────────────────────── component ──────────────────────────── */

export default function Deviz({ degData, topMarkers, cellTypes, lang = 'en' }: DevizProps) {
  const isZh = lang === 'zh'

  /* ── step navigation ── */
  const [activeStep, setActiveStep] = useState(0)

  /* ── volcano plot state ── */
  const [fcThresh, setFcThresh] = useState(1.0)
  const [pThresh, setPThresh] = useState(0.05)
  const volcanoRef = useRef<HTMLDivElement>(null)
  const volcanoP5 = useRef<p5 | null>(null)

  /* ── dot plot state ── */
  const dotPlotRef = useRef<HTMLDivElement>(null)
  const dotPlotP5 = useRef<p5 | null>(null)

  /* ── computed data ── */
  const classified = useMemo(() => {
    return degData.map(g => ({
      ...g,
      negLog10P: negLog10(g.padj),
      category: classifyGene(g, fcThresh, pThresh) as 'up' | 'down' | 'ns',
    }))
  }, [degData, fcThresh, pThresh])

  const stats = useMemo(() => {
    const up = classified.filter(g => g.category === 'up').length
    const down = classified.filter(g => g.category === 'down').length
    const ns = classified.length - up - down
    return { total: classified.length, up, down, ns }
  }, [classified])

  /* ─────────── Step 0: What is DEG? ─────────── */

  const renderStep0 = () => (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-gray-800">
        {t(isZh, TEXTS.introTitle)}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        {t(isZh, TEXTS.introDesc)}
      </p>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-xs text-gray-500">{t(isZh, TEXTS.totalGenes)}</div>
          <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-xs text-gray-500">{t(isZh, TEXTS.sigUp)}</div>
          <div className="text-2xl font-bold text-red-500">{stats.up}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-xs text-gray-500">{t(isZh, TEXTS.sigDown)}</div>
          <div className="text-2xl font-bold text-blue-500">{stats.down}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="text-xs text-gray-500">{t(isZh, TEXTS.notSignificant)}</div>
          <div className="text-2xl font-bold text-gray-400">{stats.ns}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">
          {tArr(isZh, TEXTS.degDesc)[0]}
        </h4>
        <p className="text-sm text-gray-500">
          {tArr(isZh, TEXTS.degDesc)[1]}
        </p>
        <ul className="space-y-3 mt-3">
          {tConcepts(isZh).map((c, i) => (
            <li key={i} className="bg-white rounded-lg p-3 border border-gray-100">
              <span className="font-semibold text-gray-800 text-sm">{c.term}</span>
              <span className="text-gray-500 text-sm ml-2">— {c.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  /* ─────────── Step 1: Volcano Plot ─────────── */

  useEffect(() => {
    if (activeStep !== 1 || !volcanoRef.current) return
    if (volcanoP5.current) volcanoP5.current.remove()

    const data = classified
    const sketch = (p: p5) => {
      const W = 560
      const H = 400
      const M = { t: 35, r: 30, b: 55, l: 65 }
      const pw = W - M.l - M.r
      const ph = H - M.t - M.b

      // compute ranges
      const xVals = data.map(g => g.log2FC)
      const yVals = data.map(g => g.negLog10P)
      let mnX = Math.min(...xVals)
      let mxX = Math.max(...xVals)
      let mxY = Math.max(...yVals) * 1.05 || 1
      const padX = (mxX - mnX) * 0.08 || 0.5
      mnX -= padX
      mxX += padX

      const mapX = (v: number) => M.l + ((v - mnX) / (mxX - mnX)) * pw
      const mapY = (v: number) => M.t + ph - (v / mxY) * ph

      const categoryColor = (cat: string) => {
        if (cat === 'up') return [220, 50, 50]
        if (cat === 'down') return [50, 100, 220]
        return [180, 180, 180]
      }

      p.setup = () => {
        const c = p.createCanvas(W, H)
        c.parent(volcanoRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)

        // Grid lines
        p.stroke(235)
        p.strokeWeight(1)
        const yTicks = 5
        for (let i = 0; i <= yTicks; i++) {
          const yy = M.t + (ph / yTicks) * i
          p.line(M.l, yy, M.l + pw, yy)
        }
        const xTicks = 5
        for (let i = 0; i <= xTicks; i++) {
          const xx = M.l + (pw / xTicks) * i
          p.line(xx, M.t, xx, M.t + ph)
        }

        // Threshold lines
        const xUp = mapX(fcThresh)
        const xDown = mapX(-fcThresh)
        const yThresh = mapY(negLog10(pThresh))
        p.stroke(255, 150, 50)
        p.strokeWeight(1)
        p.drawingContext.setLineDash([5, 4])
        p.line(xUp, M.t, xUp, M.t + ph)
        p.line(xDown, M.t, xDown, M.t + ph)
        p.line(M.l, yThresh, M.l + pw, yThresh)
        p.drawingContext.setLineDash([])

        // Points
        p.noStroke()
        for (const g of data) {
          const x = mapX(g.log2FC)
          const y = mapY(g.negLog10P)
          const col = categoryColor(g.category)
          p.fill(col[0], col[1], col[2], g.category === 'ns' ? 90 : 170)
          p.ellipse(x, y, g.category === 'ns' ? 4 : 6, g.category === 'ns' ? 4 : 6)
        }

        // Label top significant genes (top 5 by negLog10P that are not ns)
        const labeled = data
          .filter(g => g.category !== 'ns')
          .sort((a, b) => b.negLog10P - a.negLog10P)
          .slice(0, 8)
        p.textSize(8)
        p.textAlign(p.LEFT, p.CENTER)
        for (const g of labeled) {
          const x = mapX(g.log2FC)
          const y = mapY(g.negLog10P)
          const col = categoryColor(g.category)
          p.fill(col[0], col[1], col[2])
          p.text(g.gene, x + 5, y)
        }

        // X axis
        p.fill(100)
        p.noStroke()
        p.textSize(10)
        p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= xTicks; i++) {
          const val = mnX + ((mxX - mnX) / xTicks) * i
          p.text(val.toFixed(1), M.l + (pw / xTicks) * i, M.t + ph + 8)
        }
        p.textSize(11)
        p.text(t(isZh, TEXTS.fcLabel), M.l + pw / 2, H - 8)

        // Y axis
        p.textAlign(p.RIGHT, p.CENTER)
        p.textSize(10)
        for (let i = 0; i <= yTicks; i++) {
          const val = (mxY / yTicks) * i
          p.text(val.toFixed(1), M.l - 8, M.t + ph - (ph / yTicks) * i)
        }
        p.push()
        p.translate(14, M.t + ph / 2)
        p.rotate(-p.HALF_PI)
        p.textAlign(p.CENTER, p.BOTTOM)
        p.textSize(11)
        p.text('-log\u2081\u2080(padj)', 0, 0)
        p.pop()

        // Legend
        const legendY = M.t + 5
        const legendItems: [string, number[], string][] = [
          [t(isZh, TEXTS.upregulated), [220, 50, 50], 'up'],
          [t(isZh, TEXTS.downregulated), [50, 100, 220], 'down'],
          [t(isZh, TEXTS.notSignificant), [180, 180, 180], 'ns'],
        ]
        let lx = M.l + pw - 130
        for (const [label, col] of legendItems) {
          p.fill(col[0], col[1], col[2])
          p.noStroke()
          p.ellipse(lx, legendY + 5, 7, 7)
          p.fill(80)
          p.textSize(9)
          p.textAlign(p.LEFT, p.CENTER)
          p.text(label, lx + 8, legendY + 5)
          lx += p.textWidth(label) + 22
        }
      }
    }

    volcanoP5.current = new p5(sketch)
    return () => { volcanoP5.current?.remove() }
  }, [activeStep, classified, fcThresh, pThresh, isZh])

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">
        {t(isZh, TEXTS.volcanoTitle)}
      </h3>
      <p className="text-xs text-gray-500">
        {t(isZh, TEXTS.volcanoSubtitle)}
      </p>

      {/* Controls */}
      <div className="control-group flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t(isZh, TEXTS.fcThreshold)}:</label>
          <input
            type="range"
            min={0}
            max={4}
            step={0.1}
            value={fcThresh}
            onChange={e => setFcThresh(Number(e.target.value))}
            className="w-28"
          />
          <span className="font-mono text-sm w-8">{fcThresh.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t(isZh, TEXTS.pThreshold)}:</label>
          <select
            value={pThresh}
            onChange={e => setPThresh(Number(e.target.value))}
            className="border border-gray-200 rounded px-2 py-1 text-sm"
          >
            <option value={0.05}>0.05</option>
            <option value={0.01}>0.01</option>
            <option value={0.001}>0.001</option>
            <option value={0.0001}>0.0001</option>
          </select>
        </div>
      </div>

      {/* Canvas */}
      <div ref={volcanoRef} className="flex justify-center" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
          <div className="text-xs text-gray-500">{t(isZh, TEXTS.upregulated)}</div>
          <div className="text-lg font-bold text-red-500">{stats.up}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
          <div className="text-xs text-gray-500">{t(isZh, TEXTS.downregulated)}</div>
          <div className="text-lg font-bold text-blue-500">{stats.down}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
          <div className="text-xs text-gray-500">{t(isZh, TEXTS.notSignificant)}</div>
          <div className="text-lg font-bold text-gray-400">{stats.ns}</div>
        </div>
      </div>
    </div>
  )

  /* ─────────── Step 2: Statistical Methods ─────────── */

  const renderStep2 = () => (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-gray-800">
        {t(isZh, TEXTS.statTitle)}
      </h3>

      <div className="space-y-3">
        {tArr(isZh, TEXTS.statDesc).map((line, i) => (
          <p key={i} className="text-sm text-gray-600 leading-relaxed">{line}</p>
        ))}
      </div>

      {/* Summary stats table */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {isZh ? '数据概览' : 'Data Summary'}
        </h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-2 text-left text-gray-500">{isZh ? '指标' : 'Metric'}</th>
              <th className="p-2 text-right text-gray-500">{isZh ? '值' : 'Value'}</th>
            </tr>
          </thead>
          <tbody>
            {[
              [t(isZh, TEXTS.totalGenes), stats.total.toString()],
              [t(isZh, TEXTS.sigUp), stats.up.toString()],
              [t(isZh, TEXTS.sigDown), stats.down.toString()],
              [t(isZh, TEXTS.notSignificant), stats.ns.toString()],
              [t(isZh, TEXTS.fcThreshold), fcThresh.toFixed(1)],
              [t(isZh, TEXTS.pThreshold), `< ${pThresh}`],
              [
                isZh ? '平均 |log₂FC|' : 'Mean |log₂FC|',
                (degData.reduce((s, g) => s + Math.abs(g.log2FC), 0) / (degData.length || 1)).toFixed(3),
              ],
            ].map(([label, val], i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="p-2 text-gray-700">{label}</td>
                <td className="p-2 text-right font-mono text-gray-600">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Distribution of log2FC */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {isZh ? 'Log₂FC 分布' : 'Log₂FC Distribution'}
        </h4>
        <Log2FCMiniPlot data={classified} isZh={isZh} />
      </div>
    </div>
  )

  /* ─────────── Step 3: Marker Dot Plot / Heatmap ─────────── */

  useEffect(() => {
    if (activeStep !== 3 || !dotPlotRef.current) return
    if (dotPlotP5.current) dotPlotP5.current.remove()

    const sketch = (p: p5) => {
      // Build matrix: rows = genes (deduplicated, top 25), cols = cell types
      const allGenes: string[] = []
      for (const ct of cellTypes) {
        const genes = topMarkers[ct] || []
        for (const g of genes) {
          if (!allGenes.includes(g)) allGenes.push(g)
        }
      }
      const displayGenes = allGenes.slice(0, 25)
      const displayTypes = cellTypes.slice(0, 12)

      // Build lookup: for each (gene, cellType) → { pct, mean }
      const lookup = new Map<string, { pct: number; mean: number }>()
      for (const g of degData) {
        // Find which cell type this gene belongs to based on which marker list it's in
        for (const ct of displayTypes) {
          if ((topMarkers[ct] || []).includes(g.gene)) {
            const key = `${g.gene}|${ct}`
            if (!lookup.has(key)) {
              lookup.set(key, {
                pct: Math.max(g.pct_A, g.pct_B),
                mean: Math.max(g.mean_A, g.mean_B),
              })
            }
          }
        }
      }

      // Ranges
      let maxMean = 0
      for (const v of lookup.values()) { if (v.mean > maxMean) maxMean = v.mean }
      if (maxMean === 0) maxMean = 1

      const cellW = Math.max(30, Math.min(48, 480 / displayTypes.length))
      const cellH = Math.max(16, Math.min(28, 500 / displayGenes.length))
      const labelW = 100
      const M = { t: 60, r: 20, b: 30, l: labelW }
      const W = M.l + displayTypes.length * cellW + M.r
      const H = M.t + displayGenes.length * cellH + M.b

      p.setup = () => {
        const c = p.createCanvas(W, H)
        c.parent(dotPlotRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)

        // Column labels (cell types) — rotated
        p.textSize(9)
        p.fill(80)
        p.noStroke()
        for (let j = 0; j < displayTypes.length; j++) {
          const cx = M.l + j * cellW + cellW / 2
          p.push()
          p.translate(cx, M.t - 5)
          p.rotate(-p.HALF_PI / 1.5)
          p.textAlign(p.RIGHT, p.CENTER)
          p.text(displayTypes[j], 0, 0)
          p.pop()
        }

        // Rows
        for (let i = 0; i < displayGenes.length; i++) {
          const gene = displayGenes[i]
          const cy = M.t + i * cellH + cellH / 2

          // Gene label
          p.fill(80)
          p.noStroke()
          p.textSize(9)
          p.textAlign(p.RIGHT, p.CENTER)
          p.text(gene, M.l - 8, cy)

          for (let j = 0; j < displayTypes.length; j++) {
            const ct = displayTypes[j]
            const key = `${gene}|${ct}`
            const val = lookup.get(key)
            const cx = M.l + j * cellW + cellW / 2

            if (val) {
              // Dot size by pct expressed (0-1 → 3-maxR)
              const maxR = Math.min(cellW, cellH) * 0.42
              const r = 3 + (val.pct) * (maxR - 3)
              // Color by expression level: white→blue gradient
              const intensity = val.mean / maxMean
              const red = Math.round(255 - intensity * 180)
              const green = Math.round(255 - intensity * 100)
              const blue = Math.round(255 - intensity * 10)
              p.fill(red, green, blue)
              p.stroke(200)
              p.strokeWeight(0.5)
              p.ellipse(cx, cy, r * 2, r * 2)
            } else {
              // Empty cell
              p.fill(245)
              p.noStroke()
              p.rect(cx - cellW * 0.35, cy - cellH * 0.35, cellW * 0.7, cellH * 0.7, 2)
            }
          }

          // Alternating row background
          if (i % 2 === 0) {
            p.fill(0, 0, 0, 3)
            p.noStroke()
            p.rect(M.l, cy - cellH / 2, displayTypes.length * cellW, cellH)
          }
        }

        // Color legend
        const legY = H - 18
        const legX = M.l + 10
        p.noStroke()
        p.textSize(8)
        p.fill(100)
        p.textAlign(p.LEFT, p.CENTER)
        p.text(isZh ? '表达量:' : 'Expression:', legX, legY)
        for (let i = 0; i < 20; i++) {
          const intensity = i / 19
          const red = Math.round(255 - intensity * 180)
          const green = Math.round(255 - intensity * 100)
          const blue = Math.round(255 - intensity * 10)
          p.fill(red, green, blue)
          p.rect(legX + 65 + i * 5, legY - 4, 5, 8)
        }
        p.fill(100)
        p.text('0', legX + 60, legY)
        p.text(maxMean.toFixed(1), legX + 170, legY)
      }
    }

    dotPlotP5.current = new p5(sketch)
    return () => { dotPlotP5.current?.remove() }
  }, [activeStep, degData, topMarkers, cellTypes, isZh])

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">
        {t(isZh, TEXTS.markerTitle)}
      </h3>
      <p className="text-xs text-gray-500">
        {t(isZh, TEXTS.markerSubtitle)}
      </p>
      <div ref={dotPlotRef} className="overflow-x-auto flex justify-center" />
    </div>
  )

  /* ─────────── render ─────────── */

  const steps = tArr(isZh, TEXTS.stepTitles)

  return (
    <div className="deg-viz space-y-4">
      {/* Step navigation */}
      <div className="flex gap-1 flex-wrap">
        {steps.map((label, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeStep === i
                ? 'bg-blue-500 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-gray-100 shadow-sm">
        {activeStep === 0 && renderStep0()}
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
        {activeStep === 3 && renderStep3()}
      </div>
    </div>
  )
}

/* ──────────────────────── sub-component: Log2FC mini histogram ──────────────────────── */

function Log2FCMiniPlot({
  data,
  isZh,
}: {
  data: { log2FC: number; negLog10P: number; category: string }[]
  isZh: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (p5Ref.current) p5Ref.current.remove()

    const sketch = (p: p5) => {
      const W = 480
      const H = 140
      const M = { t: 10, r: 15, b: 30, l: 45 }
      const pw = W - M.l - M.r
      const ph = H - M.t - M.b
      const bins = 40
      const vals = data.map(d => d.log2FC)
      const mn = Math.min(...vals)
      const mx = Math.max(...vals)
      const range = mx - mn || 1
      const binW = range / bins

      const histogram = Array.from({ length: bins }, () => ({ up: 0, down: 0, ns: 0 }))
      for (const d of data) {
        const idx = Math.min(Math.floor((d.log2FC - mn) / binW), bins - 1)
        if (idx >= 0 && idx < bins) {
          histogram[idx][d.category as 'up' | 'down' | 'ns']++
        }
      }
      const maxCount = Math.max(...histogram.map(h => h.up + h.down + h.ns), 1)

      p.setup = () => {
        const c = p.createCanvas(W, H)
        c.parent(containerRef.current!)
        p.textFont('Inter')
        p.noLoop()
      }

      p.draw = () => {
        p.background(255)
        const barW = pw / bins

        for (let i = 0; i < bins; i++) {
          const h = histogram[i]
          const total = h.up + h.down + h.ns
          const barH = (total / maxCount) * ph
          const x = M.l + i * barW

          // stacked: ns on bottom, then down, then up
          let y = M.t + ph
          // ns
          const nsH = (h.ns / maxCount) * ph
          p.fill(180, 180, 180, 120)
          p.noStroke()
          p.rect(x, y - nsH, barW - 1, nsH)
          y -= nsH
          // down
          const dH = (h.down / maxCount) * ph
          p.fill(50, 100, 220, 160)
          p.rect(x, y - dH, barW - 1, dH)
          y -= dH
          // up
          const uH = (h.up / maxCount) * ph
          p.fill(220, 50, 50, 160)
          p.rect(x, y - uH, barW - 1, uH)
        }

        // X axis
        p.fill(100)
        p.noStroke()
        p.textSize(9)
        p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= 4; i++) {
          const val = mn + (range / 4) * i
          p.text(val.toFixed(1), M.l + (pw / 4) * i, M.t + ph + 5)
        }
        p.textSize(10)
        p.text('log\u2082FC', M.l + pw / 2, H - 5)

        // Y axis
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 3; i++) {
          const val = Math.round((maxCount / 3) * i)
          p.text(val, M.l - 5, M.t + ph - (ph / 3) * i)
        }

        // Zero line
        const zeroX = M.l + ((0 - mn) / range) * pw
        p.stroke(100)
        p.strokeWeight(1)
        p.line(zeroX, M.t, zeroX, M.t + ph)
      }
    }

    p5Ref.current = new p5(sketch)
    return () => { p5Ref.current?.remove() }
  }, [data, isZh])

  return <div ref={containerRef} className="flex justify-center" />
}
