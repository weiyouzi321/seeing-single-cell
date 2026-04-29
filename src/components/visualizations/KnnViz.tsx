'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface KnnVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: 'en' | 'zh'
  activeStep: number
  /** @deprecated 预计算PCA投影 (若提供则跳过实时PCA计算) */
  precomputedProjected?: number[][]
  /** @deprecated 预计算KNN邻接表 (若提供则跳过实时KNN计算) */
  precomputedKnnAdj?: number[][]
}

const TYPE_COLORS: Record<string, [number, number, number]> = {
  'CD4 T': [66, 133, 244], 'CD8 T': [52, 168, 83], 'B': [234, 67, 53],
  'NK': [251, 188, 4], 'Monocyte': [171, 71, 188], 'DC': [255, 112, 67],
}
function getTypeColor(type: string): [number, number, number] {
  return TYPE_COLORS[type] || [150, 150, 150]
}

import { computePCA } from '@/lib/math'

// Distance
function euclidean(a: number[], b: number[]): number {
  let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s)
}
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2 }
  const d = Math.sqrt(na) * Math.sqrt(nb); return d > 0 ? dot / d : 0
}

// KNN
function buildKNN(coords: number[][], k: number, metric: 'euclidean' | 'cosine') {
  const n = coords.length; const distFn = metric === 'cosine' ? cosine : euclidean
  const edges: [number, number, number][] = []
  for (let i = 0; i < n; i++) {
    const dists: { j: number; d: number }[] = []
    for (let j = 0; j < n; j++) { if (i !== j) dists.push({ j, d: distFn(coords[i], coords[j]) }) }
    dists.sort(metric === 'cosine' ? (a, b) => b.d - a.d : (a, b) => a.d - b.d)
    for (let ki = 0; ki < Math.min(k, dists.length); ki++) {
      const j = dists[ki].j; if (i < j) edges.push([i, j, dists[ki].d])
    }
  }
  // Deduplicate
  const edgeSet = new Set<string>(); const unique: [number, number, number][] = []
  for (const [i, j, d] of edges) { const key = `${i}-${j}`; if (!edgeSet.has(key)) { edgeSet.add(key); unique.push([i, j, d]) } }
  // Build adjacency
  const adj: number[][] = Array.from({ length: n }, () => [])
  for (const [i, j] of unique) { adj[i].push(j); adj[j].push(i) }
  return { edges: unique, adj }
}

// Louvain (simplified single-level)
function louvain(adj: number[][], resolution: number = 1.0): number[] {
  const n = adj.length
  let comm = Array.from({ length: n }, (_, i) => i)
  const deg = adj.map(neighbors => neighbors.length)
  const m = adj.reduce((s, neighbors) => s + neighbors.length, 0) / 2 || 1

  let improved = true; let rounds = 0
  while (improved && rounds < 20) {
    improved = false; rounds++
    // Precompute community total degrees
    const commDeg = new Map<number, number>()
    for (let i = 0; i < n; i++) {
      const c = comm[i]
      commDeg.set(c, (commDeg.get(c) || 0) + deg[i])
    }
    for (let i = 0; i < n; i++) {
      const nbrComms = new Map<number, number>()
      for (const j of adj[i]) { const c = comm[j]; nbrComms.set(c, (nbrComms.get(c) || 0) + 1) }
      let bestComm = comm[i], bestGain = 0
      const entries = Array.from(nbrComms.entries())
      for (let ei = 0; ei < entries.length; ei++) {
        const c = entries[ei][0], kij = entries[ei][1]
        if (c === comm[i]) continue
        // Modularity-based gain with resolution parameter
        const gain = kij - resolution * (deg[i] * (commDeg.get(c) || 0)) / (2 * m)
        if (gain > bestGain) { bestGain = gain; bestComm = c }
      }
      if (bestComm !== comm[i]) { comm[i] = bestComm; improved = true }
    }
  }
  // Renumber communities
  const commMap = new Map<number, number>(); let nComm = 0
  return comm.map(c => { if (!commMap.has(c)) commMap.set(c, nComm++); return commMap.get(c)! })
}

// ARI
function computeARI(labels: number[], truth: string[]): number {
  const n = labels.length
  const truthMap = new Map<string, number>(); let tn = 0
  const tLabels = truth.map(t => { if (!truthMap.has(t)) truthMap.set(t, tn++); return truthMap.get(t)! })
  const k = Math.max(...labels) + 1, r = tn
  const contingency: number[][] = Array.from({ length: r }, () => Array(k).fill(0))
  for (let i = 0; i < n; i++) contingency[tLabels[i]][labels[i]]++
  const sumC = contingency.map(row => row.reduce((s, v) => s + v, 0))
  const sumR = Array(k).fill(0); for (let j = 0; j < k; j++) for (let i = 0; i < r; i++) sumR[j] += contingency[i][j]
  let sumN = 0; for (let i = 0; i < r; i++) for (let j = 0; j < k; j++) sumN += contingency[i][j] * (contingency[i][j] - 1) / 2
  let sumA = 0, sumB = 0
  for (let i = 0; i < r; i++) sumA += sumC[i] * (sumC[i] - 1) / 2
  for (let j = 0; j < k; j++) sumB += sumR[j] * (sumR[j] - 1) / 2
  const totalC2 = n * (n - 1) / 2
  const expected = sumA * sumB / totalC2
  const maxVal = (sumA + sumB) / 2
  const ari = maxVal - expected !== 0 ? (sumN - expected) / (maxVal - expected) : 0
  return Math.max(-1, Math.min(1, ari))
}

// NMI
function computeNMI(labels: number[], truth: string[]): number {
  const n = labels.length
  const truthMap = new Map<string, number>(); let tn = 0
  const tLabels = truth.map(t => { if (!truthMap.has(t)) truthMap.set(t, tn++); return truthMap.get(t)! })
  const k = Math.max(...labels) + 1, r = tn
  const contingency: number[][] = Array.from({ length: r }, () => Array(k).fill(0))
  for (let i = 0; i < n; i++) contingency[tLabels[i]][labels[i]]++
  const hx = (arr: number[]) => { let s = 0; for (const v of arr) { const p = v / n; if (p > 0) s -= p * Math.log2(p) }; return s }
  const sumC = contingency.map(row => row.reduce((s, v) => s + v, 0))
  const sumR = Array(k).fill(0); for (let j = 0; j < k; j++) for (let i = 0; i < r; i++) sumR[j] += contingency[i][j]
  const hC = hx(sumC), hR = hx(sumR)
  let mi = 0
  for (let i = 0; i < r; i++) for (let j = 0; j < k; j++) {
    const p = contingency[i][j] / n; if (p > 0) mi += p * Math.log2(n * p / (sumC[i] * sumR[j]))
  }
  return (hC + hR) > 0 ? 2 * mi / (hC + hR) : 0
}

// Louvain with animation frames
function louvainFrames(coords: number[][], adj: number[][], resolution: number = 1.0): number[][] {
  const n = coords.length
  let comm = Array.from({ length: n }, (_, i) => i)
  const deg = adj.map(neighbors => neighbors.length)
  const m = adj.reduce((s, neighbors) => s + neighbors.length, 0) / 2 || 1
  const frames: number[][] = [[...comm]]
  for (let round = 0; round < 8; round++) {
    let improved = false
    // Precompute community total degrees
    const commDeg = new Map<number, number>()
    for (let i = 0; i < n; i++) {
      const c = comm[i]
      commDeg.set(c, (commDeg.get(c) || 0) + deg[i])
    }
    for (let i = 0; i < n; i++) {
      const nbrComms = new Map<number, number>()
      for (const j of adj[i]) { const c = comm[j]; nbrComms.set(c, (nbrComms.get(c) || 0) + 1) }
      let bestComm = comm[i], bestGain = 0
      const entries2 = Array.from(nbrComms.entries())
      for (let ei = 0; ei < entries2.length; ei++) {
        const c = entries2[ei][0], ki = entries2[ei][1]
        if (c !== comm[i]) {
          const gain = ki - resolution * (deg[i] * (commDeg.get(c) || 0)) / (2 * m)
          if (gain > bestGain) { bestGain = gain; bestComm = c }
        }
      }
      if (bestComm !== comm[i]) { comm[i] = bestComm; improved = true }
    }
    frames.push([...comm])
    if (!improved) break
  }
  // Renumber consistently
  return frames.map(f => {
    const m = new Map<number, number>(); let nc = 0
    return f.map(c => { if (!m.has(c)) m.set(c, nc++); return m.get(c)! })
  })
}

// Confusion matrix
function confusionMatrix(labels: number[], truth: string[]): { matrix: number[][]; types: string[]; clusters: number; maxVal: number } {
  const types = Array.from(new Set(truth))
  const k = Math.max(...labels) + 1
  const matrix = Array.from({ length: types.length }, () => Array(k).fill(0))
  for (let i = 0; i < labels.length; i++) {
    const ti = types.indexOf(truth[i]); matrix[ti][labels[i]]++
  }
  const maxVal = Math.max(...matrix.flat()) || 1
  return { matrix, types, clusters: k, maxVal }
}

export default function KnnViz({ data, geneNames, cellTypes, lang = 'en', activeStep, precomputedProjected, precomputedKnnAdj }: KnnVizProps) {
  const isZh = lang === 'zh'
  const nCells = data.length
  // 优先使用预计算投影（若有效）,否则实时计算PCA
  const pca = useMemo(() => {
    if (precomputedProjected && precomputedProjected.length > 0 && precomputedProjected[0]) {
      return { projected: precomputedProjected, evecs: [], evals: [] }
    }
    return computePCA(data, 10)
  }, [data, precomputedProjected])

  // Step 1 state
  const [cellA, setCellA] = useState(0)
  const [cellB, setCellB] = useState(1)
  const step1Ref = useRef<HTMLDivElement>(null)
  const step1P5 = useRef<p5 | null>(null)

  // Step 2 state
  const [kVal, setKVal] = useState(10)
  const [metric, setMetric] = useState<'euclidean' | 'cosine'>('euclidean')
  const step2Ref = useRef<HTMLDivElement>(null)
  const step2P5 = useRef<p5 | null>(null)

  const neighborsRef = useRef<number[]>([])
  const tooltipRef = useRef<{x: number, y: number, cell: number, type: string, k: number} | null>(null)


  // Step 3 state
  const [playing, setPlaying] = useState(false)
  const [frameIdx, setFrameIdx] = useState(0)
  const step3Ref = useRef<HTMLDivElement>(null)
  const step3P5 = useRef<p5 | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Step 4 state
  const [resolution, setResolution] = useState(1.0)
  const [hoveredCell, setHoveredCell] = useState<number | null>(null)
  const step4Ref = useRef<HTMLDivElement>(null)
  const step4P5 = useRef<p5 | null>(null)

  // 优先使用预计算KNN邻接表
  const knn = useMemo(() => {
    if (precomputedKnnAdj && precomputedKnnAdj.length === data.length) {
      // 构建 edges
      const edges: [number, number][] = []
      for (let i = 0; i < precomputedKnnAdj.length; i++) {
        for (const j of precomputedKnnAdj[i]) {
          if (i < j) edges.push([i, j])
        }
      }
      return { adj: precomputedKnnAdj, edges }
    }
    return buildKNN(pca.projected, kVal, metric)
  }, [pca.projected, kVal, metric, precomputedKnnAdj, data.length])
  const frames = useMemo(() => louvainFrames(pca.projected, knn.adj, 1.0), [pca.projected, knn.adj])
  const commLabels = useMemo(() => {
    return louvain(knn.adj, resolution)
  }, [knn.adj, resolution])
  const ari = useMemo(() => computeARI(commLabels, cellTypes), [commLabels, cellTypes])
  const nmi = useMemo(() => computeNMI(commLabels, cellTypes), [commLabels, cellTypes])
  const confMat = useMemo(() => confusionMatrix(commLabels, cellTypes), [commLabels, cellTypes])

  const step3comm = frames[Math.min(frameIdx, frames.length - 1)] || commLabels
  const nCommunities3 = new Set(step3comm).size
  const nCommunities4 = confMat.clusters

  // Cross-type edge ratio
  const crossRatio = useMemo(() => {
    let cross = 0; for (const [i, j] of knn.edges) { if (cellTypes[i] !== cellTypes[j]) cross++ }
    return knn.edges.length > 0 ? cross / knn.edges.length : 0
  }, [knn.edges, cellTypes])

  // ── Step 1: Distance comparison ──
  useEffect(() => {
    if (activeStep !== 0 || !step1Ref.current) return
    if (step1P5.current) step1P5.current.remove()
    const ca = cellA, cb = cellB
    const sketch = (p: any) => {
      const W = 520, H = 320, M = { t: 30, r: 20, b: 50, l: 55 }
      const pw = W - M.l - M.r, ph = H - M.t - M.b
      const ng = geneNames.length
      const maxVal = Math.max(...data[ca], ...data[cb]) * 1.1 || 1
      const barW = Math.min(22, pw / ng - 2)

      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step1Ref.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        // Grid
        p.stroke(240); p.strokeWeight(1)
        for (let i = 0; i <= 4; i++) p.line(M.l, M.t + ph / 4 * i, M.l + pw, M.t + ph / 4 * i)

        // Bars
        for (let j = 0; j < ng; j++) {
          const x = M.l + j * (barW + 2)
          const hA = (data[ca][j] / maxVal) * ph * 0.85
          const hB = (data[cb][j] / maxVal) * ph * 0.85
          // Cell A (blue)
          p.fill(66, 133, 244, 180); p.noStroke()
          p.rect(x, M.t + ph - hA, barW / 2 - 1, hA, 2, 2, 0, 0)
          // Cell B (red)
          p.fill(234, 67, 53, 180)
          p.rect(x + barW / 2, M.t + ph - hB, barW / 2 - 1, hB, 2, 2, 0, 0)
          // Gene label
          if (ng <= 20) {
            p.fill(120); p.noStroke(); p.textSize(7); p.textAlign(p.CENTER)
            p.push(); p.translate(x + barW / 2, M.t + ph + 10); p.rotate(-p.HALF_PI / 2)
            p.text(geneNames[j], 0, 0); p.pop()
          }
        }

        // Legend
        p.fill(66, 133, 244); p.noStroke(); p.rect(M.l + pw - 120, M.t + 5, 10, 10, 2)
        p.fill(80); p.textSize(11); p.textAlign(p.LEFT); p.text('Cell ' + (ca + 1), M.l + pw - 106, M.t + 14)
        p.fill(234, 67, 53); p.rect(M.l + pw - 120, M.t + 20, 10, 10, 2)
        p.fill(80); p.text('Cell ' + (cb + 1), M.l + pw - 106, M.t + 29)

        // Y axis
        p.fill(150); p.textSize(10); p.textAlign(p.RIGHT)
        for (let i = 0; i <= 4; i++) p.text((maxVal * i / 4).toFixed(1), M.l - 5, M.t + ph - ph * 0.85 * i / 4 + 4)
      }
    }
    step1P5.current = new p5(sketch)
    return () => { step1P5.current?.remove() }
  }, [activeStep, cellA, cellB, data, geneNames])

  // ── Step 2: KNN graph ──
  useEffect(() => {
    if (activeStep !== 1 || !step2Ref.current) return
    if (step2P5.current) step2P5.current.remove()
    const proj = pca.projected; const edges = knn.edges
    const sketch = (p: any) => {
      const W = 520, H = 440, M = { t: 30, r: 30, b: 55, l: 55 }
      const pw = W - M.l - M.r, ph = H - M.t - M.b
      const valsX = proj.map(r => r[0]), valsY = proj.map(r => r[1])
      let mnX = Math.min(...valsX), mxX = Math.max(...valsX), mnY = Math.min(...valsY), mxY = Math.max(...valsY)
      const rx = mxX - mnX || 1, ry = mxY - mnY || 1
      mnX -= rx * 0.1; mxX += rx * 0.1; mnY -= ry * 0.1; mxY += ry * 0.1
      let hov = -1

      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step2Ref.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        // Edges
        p.stroke(180, 180, 180, 60); p.strokeWeight(1)
        for (const [i, j] of edges) {
          const x1 = M.l + (valsX[i] - mnX) / (mxX - mnX) * pw
          const y1 = M.t + ph - (valsY[i] - mnY) / (mxY - mnY) * ph
          const x2 = M.l + (valsX[j] - mnX) / (mxX - mnX) * pw
          const y2 = M.t + ph - (valsY[j] - mnY) / (mxY - mnY) * ph
          p.line(x1, y1, x2, y2)
        }
        // Highlight hovered cell edges
        if (hov >= 0) {
          p.stroke(66, 133, 244, 160); p.strokeWeight(2)
          for (const [i, j] of edges) {
            if (i === hov || j === hov) {
              const x1 = M.l + (valsX[i] - mnX) / (mxX - mnX) * pw
              const y1 = M.t + ph - (valsY[i] - mnY) / (mxY - mnY) * ph
              const x2 = M.l + (valsX[j] - mnX) / (mxX - mnX) * pw
              const y2 = M.t + ph - (valsY[j] - mnY) / (mxY - mnY) * ph
              p.line(x1, y1, x2, y2)
            }
          }
        }
        // Points
        for (let i = 0; i < nCells; i++) {
          const x = M.l + (valsX[i] - mnX) / (mxX - mnX) * pw
          const y = M.t + ph - (valsY[i] - mnY) / (mxY - mnY) * ph
          const [r, g, b] = getTypeColor(cellTypes[i])
          if (i === hov) {
            p.fill(r, g, b, 255); p.stroke(0); p.strokeWeight(2); p.ellipse(x, y, 14, 14)
            const bx = x + 12, by = y - 42
            p.fill(255, 255, 255, 240); p.stroke(180); p.strokeWeight(1); p.rect(bx, by, 110, 38, 5)
            p.noStroke(); p.fill(50); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
            p.text('Cell #' + (i + 1), bx + 6, by + 5)
            p.fill(80); p.textSize(9); p.text(cellTypes[i], bx + 6, by + 20)
          } else {
            p.fill(r, g, b, 220); p.noStroke(); p.ellipse(x, y, 9, 9)
          }
        }
        // Legend
        const types = Array.from(new Set(cellTypes)); let ly = M.t + 10
        types.forEach((type: string) => {
          const [r, g, b] = getTypeColor(type); p.fill(r, g, b); p.noStroke()
          p.ellipse(M.l + pw - 55, ly, 9, 9); p.fill(80); p.textSize(11); p.textAlign(p.LEFT)
          p.text(type, M.l + pw - 48, ly + 4); ly += 18
        })
        // Axes
        p.fill(100); p.noStroke(); p.textSize(12); p.textAlign(p.CENTER)
        p.text('PC1', M.l + pw / 2, H - 5)
        p.push(); p.translate(14, M.t + ph / 2); p.rotate(-p.HALF_PI); p.text('PC2', 0, 0); p.pop()
      }
      p.mouseMoved = () => {
        let c = -1, cd = 12
        for (let i = 0; i < nCells; i++) {
          const x = M.l + (valsX[i] - mnX) / (mxX - mnX) * pw
          const y = M.t + ph - (valsY[i] - mnY) / (mnY - mnY) * ph
          const d = Math.hypot(p.mouseX - x, p.mouseY - y)
          if (d < cd) { c = i; cd = d }
        }
        if (c !== hov) { hov = c; p.redraw(); setHoveredCell(c >= 0 ? c : null) }
        // 更新邻居和 tooltip refs
        if (c >= 0) {
          const nbrs = knn.adj[c] || []
          neighborsRef.current = nbrs
          tooltipRef.current = {
            x: p.mouseX + 15,
            y: p.mouseY + 15,
            cell: c,
            type: cellTypes[c],
            k: nbrs.length
          }
        } else {
          neighborsRef.current = []
          tooltipRef.current = null
        }
      }
    }
    step2P5.current = new p5(sketch)
    return () => { step2P5.current?.remove() }
  }, [activeStep, pca.projected, kVal, metric, cellTypes, nCells])

  // ── Step 3: Louvain animation ──
  useEffect(() => {
    if (activeStep !== 2 || !step3Ref.current) return
    if (step3P5.current) step3P5.current.remove()
    const proj = pca.projected; const comm = step3comm
    const commColors = [
      [66, 133, 244], [234, 67, 53], [52, 168, 83], [251, 188, 4], [171, 71, 188],
      [255, 112, 67], [0, 172, 193], [121, 85, 72], [96, 125, 139], [205, 220, 57],
      [233, 30, 99], [103, 58, 183], [0, 150, 136], [255, 193, 7], [158, 158, 158],
    ]
    const sketch = (p: any) => {
      const W = 520, H = 440, M = { t: 30, r: 30, b: 55, l: 55 }
      const pw = W - M.l - M.r, ph = H - M.t - M.b
      const valsX = proj.map((r: number[]) => r[0]), valsY = proj.map((r: number[]) => r[1])
      let mnX = Math.min(...valsX), mxX = Math.max(...valsX), mnY = Math.min(...valsY), mxY = Math.max(...valsY)
      const rx = mxX - mnX || 1, ry = mxY - mnY || 1
      mnX -= rx * 0.1; mxX += rx * 0.1; mnY -= ry * 0.1; mxY += ry * 0.1

      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step3Ref.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        for (let i = 0; i < nCells; i++) {
          const x = M.l + (valsX[i] - mnX) / (mxX - mnX) * pw
          const y = M.t + ph - (valsY[i] - mnY) / (mxY - mnY) * ph
          const ci = comm[i] % commColors.length; const [r, g, b] = commColors[ci]
          p.fill(r, g, b, 220); p.noStroke(); p.ellipse(x, y, 10, 10)
        }
        p.fill(100); p.noStroke(); p.textSize(12); p.textAlign(p.CENTER)
        p.text('PC1', M.l + pw / 2, H - 5)
        p.push(); p.translate(14, M.t + ph / 2); p.rotate(-p.HALF_PI); p.text('PC2', 0, 0); p.pop()
      }
    }
    step3P5.current = new p5(sketch)
    return () => { step3P5.current?.remove() }
  }, [activeStep, frameIdx, step3comm, pca.projected, nCells])

  // Animation control
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setFrameIdx(prev => {
          if (prev >= frames.length - 1) { setPlaying(false); return prev }
          return prev + 1
        })
      }, 800)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, frames.length])

  // ── Step 4: Evaluation ──
  useEffect(() => {
    if (activeStep !== 3 || !step4Ref.current) return
    if (step4P5.current) step4P5.current.remove()
    const proj = pca.projected; const labels = commLabels
    const commColors = [
      [66, 133, 244], [234, 67, 53], [52, 168, 83], [251, 188, 4], [171, 71, 188],
      [255, 112, 67], [0, 172, 193], [121, 85, 72], [96, 125, 139], [205, 220, 57],
    ]
    const sketch = (p: any) => {
      const W = 520, H = 440, M = { t: 30, r: 30, b: 55, l: 55 }
      const pw = W - M.l - M.r, ph = H - M.t - M.b
      const valsX = proj.map((r: number[]) => r[0]), valsY = proj.map((r: number[]) => r[1])
      let mnX = Math.min(...valsX), mxX = Math.max(...valsX), mnY = Math.min(...valsY), mxY = Math.max(...valsY)
      const rx = mxX - mnX || 1, ry = mxY - mnY || 1
      mnX -= rx * 0.1; mxX += rx * 0.1; mnY -= ry * 0.1; mxY += ry * 0.1
      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step4Ref.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        for (let i = 0; i < nCells; i++) {
          const x = M.l + (valsX[i] - mnX) / (mxX - mnX) * pw
          const y = M.t + ph - (valsY[i] - mnY) / (mxY - mnY) * ph
          const ci = labels[i] % commColors.length; const [r, g, b] = commColors[ci]
          p.fill(r, g, b, 220); p.noStroke(); p.ellipse(x, y, 10, 10)
        }
        p.fill(100); p.noStroke(); p.textSize(12); p.textAlign(p.CENTER)
        p.text('PC1', M.l + pw / 2, H - 5)
        p.push(); p.translate(14, M.t + ph / 2); p.rotate(-p.HALF_PI); p.text('PC2', 0, 0); p.pop()
      }
    }
    step4P5.current = new p5(sketch)
    return () => { step4P5.current?.remove() }
  }, [activeStep, resolution, commLabels, pca.projected, nCells])

  // ── Renders ──

  if (activeStep === 0) {
    const eDist = euclidean(data[cellA], data[cellB])
    const cSim = cosine(data[cellA], data[cellB])
    return (
      <div>
        <div className="control-group">
          <div className="flex items-center gap-2">
            <label>{isZh ? '\u7ec6\u80de A' : 'Cell A'}:</label>
            <select value={cellA} onChange={e => setCellA(Number(e.target.value))}>
              {Array.from({ length: nCells }, (_, i) => <option key={i} value={i}>#{i + 1} ({cellTypes[i]})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label>{isZh ? '\u7ec6\u80de B' : 'Cell B'}:</label>
            <select value={cellB} onChange={e => setCellB(Number(e.target.value))}>
              {Array.from({ length: nCells }, (_, i) => <option key={i} value={i}>#{i + 1} ({cellTypes[i]})</option>)}
            </select>
          </div>
        </div>
        <div ref={step1Ref} className="flex justify-center" />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-xs text-gray-500 mb-1">{isZh ? '\u6b27\u6c0f\u8ddd\u79bb' : 'Euclidean Distance'}</div>
            <div className="text-2xl font-bold text-blue-600">{eDist.toFixed(2)}</div>
            <div className="text-xs text-gray-400">{isZh ? '(\u8d8a\u5c0f\u8d8a\u50cf)' : '(smaller = more similar)'}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="text-xs text-gray-500 mb-1">{isZh ? '\u4f59\u5f26\u76f8\u4f3c\u5ea6' : 'Cosine Similarity'}</div>
            <div className="text-2xl font-bold text-green-600">{cSim.toFixed(4)}</div>
            <div className="text-xs text-gray-400">{isZh ? '(\u8d8a\u5927\u8d8a\u50cf)' : '(larger = more similar)'}</div>
          </div>
        </div>
      </div>
    )
  }

  if (activeStep === 1) {
    return (
      <div>
        <div className="control-group">
          <div className="flex items-center gap-3 flex-1">
            <label>{isZh ? 'K (\u90bb\u5c45\u6570)' : 'K (neighbors)'}:</label>
            <input type="range" min={1} max={30} value={kVal} onChange={e => setKVal(Number(e.target.value))} className="flex-1" />
            <span className="font-mono text-sm w-8">{kVal}</span>
          </div>
          <div className="flex items-center gap-2">
            <label>{isZh ? '\u8ddd\u79bb' : 'Metric'}:</label>
            <button onClick={() => setMetric('euclidean')}
              className={`px-3 py-1 rounded text-sm ${metric === 'euclidean' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {isZh ? '\u6b27\u6c0f' : 'Euclidean'}
            </button>
            <button onClick={() => setMetric('cosine')}
              className={`px-3 py-1 rounded text-sm ${metric === 'cosine' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {isZh ? '\u4f59\u5f26' : 'Cosine'}
            </button>
          </div>
        </div>
        <div ref={step2Ref} className="flex justify-center" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <div className="text-xs text-gray-500">{isZh ? '\u603b\u8fb9\u6570' : 'Total Edges'}</div>
            <div className="text-lg font-bold text-gray-700">{knn.edges.length}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <div className="text-xs text-gray-500">{isZh ? '\u8de8\u7c7b\u578b\u8fb9\u6bd4\u4f8b' : 'Cross-type ratio'}</div>
            <div className="text-lg font-bold text-amber-600">{(crossRatio * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 text-center">
            <div className="text-xs text-gray-500">{isZh ? 'K\u503c' : 'K value'}</div>
            <div className="text-lg font-bold text-blue-600">{kVal}</div>
          </div>
        </div>
      </div>
    )
  }

  if (activeStep === 2) {
    return (
      <div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <button onClick={() => { setPlaying(true); setFrameIdx(0) }} disabled={playing}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white disabled:opacity-50">
            {isZh ? '\u25b6 \u64ad\u653e' : '\u25b6 Play'}
          </button>
          <button onClick={() => setPlaying(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white">
            {isZh ? '\u23f8 \u6682\u505c' : '\u23f8 Pause'}
          </button>
          <button onClick={() => setFrameIdx(prev => Math.min(prev + 1, frames.length - 1))}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white">
            {isZh ? '\u23ed \u5355\u6b65' : '\u23ed Step'}
          </button>
          <button onClick={() => { setFrameIdx(0); setPlaying(false) }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-600">
            {isZh ? '\u21ba \u91cd\u7f6e' : '\u21ba Reset'}
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mb-2 text-sm">
          <span className="text-gray-600">{isZh ? '\u8f6e\u6b21' : 'Round'}: <span className="font-bold">{frameIdx}</span> / {frames.length - 1}</span>
          <span className="text-gray-600">{isZh ? '\u793e\u533a\u6570' : 'Communities'}: <span className="font-bold text-purple-600">{nCommunities3}</span></span>
        </div>
        <div ref={step3Ref} className="flex justify-center" />
      </div>
    )
  }

  if (activeStep === 3) {
    return (
      <div>
        <div className="control-group">
          <div className="flex items-center gap-3 flex-1">
            <label>{isZh ? '\u5206\u8fa8\u7387' : 'Resolution'}:</label>
            <input type="range" min={0.1} max={3} step={0.1} value={resolution}
              onChange={e => setResolution(Number(e.target.value))} className="flex-1" />
            <span className="font-mono text-sm w-10">{resolution.toFixed(1)}</span>
          </div>
          <div className="text-sm text-gray-500">
            {isZh ? '\u805a\u7c7b\u6570' : 'Clusters'}: <span className="font-bold text-purple-600">{nCommunities4}</span>
          </div>
        </div>
        <div ref={step4Ref} className="flex justify-center" />

        {/* Confusion matrix */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">{isZh ? '\u6df7\u6dc6\u77e9\u9635' : 'Confusion Matrix'}</h4>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-gray-500 text-left">{isZh ? '\u771f\u5b9e\\u7c7b\u578b' : 'True Type'}</th>
                  {Array.from({ length: confMat.clusters }, (_, j) => (
                    <th key={j} className="p-1 text-gray-500 text-center">C{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confMat.types.map((type, i) => {
                  const [r, g, b] = getTypeColor(type)
                  return (
                    <tr key={i}>
                      <td className="p-1 font-semibold" style={{ color: `rgb(${r},${g},${b})` }}>{type}</td>
                      {confMat.matrix[i].map((val, j) => {
                        const maxVal = confMat.maxVal
                        const intensity = val / maxVal
                        return (
                          <td key={j} className="p-1 text-center rounded"
                            style={{ background: `rgba(${r},${g},${b},${intensity * 0.6})`, fontWeight: val > 0 ? 600 : 400 }}>
                            {val}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">{isZh ? '\u8c03\u6574\u5170\u5fb7\u6307\u6570' : 'Adjusted Rand Index'}</div>
            <div className="text-2xl font-bold text-blue-600">{ari.toFixed(3)}</div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.max(0, ari) * 100}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">{isZh ? '\u6807\u51c6\u5316\u4e92\u4fe1\u606f' : 'Normalized Mutual Info'}</div>
            <div className="text-2xl font-bold text-green-600">{nmi.toFixed(3)}</div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${nmi * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
