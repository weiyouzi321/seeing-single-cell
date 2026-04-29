'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface DimRedVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: 'en' | 'zh'
  activeStep: number
  precomputedTsne?: number[][]
  precomputedUmap?: number[][]
}

const TYPE_COLORS: Record<string, [number, number, number]> = {
  'CD4 T': [66, 133, 244], 'CD8 T': [52, 168, 83], 'B': [234, 67, 53],
  'NK': [251, 188, 4], 'Monocyte': [171, 71, 188], 'DC': [255, 112, 67],
}
function getTypeColor(type: string): [number, number, number] { return TYPE_COLORS[type] || [150, 150, 150] }

import { computePCA } from '@/lib/math'

function seededRandom(seed: number) {
  let s = seed
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

function makeSwissRoll(n: number, seed: number = 42) {
  const rng = seededRandom(seed)
  const pts: number[][] = [], labels: string[] = []
  for (let i = 0; i < n; i++) {
    const t = 1.5 * Math.PI * (1 + 2 * rng())
    const y = 20 * rng()
    pts.push([t * Math.cos(t), y, t * Math.sin(t)])
    labels.push(t < 4.5 * Math.PI * 0.55 ? 'Inner' : 'Outer')
  }
  return { points: pts, labels }
}
function makeMoons(n: number, seed: number = 42) {
  const rng = seededRandom(seed)
  const pts: number[][] = [], labels: string[] = []
  for (let i = 0; i < n; i++) {
    const a = Math.PI * i / n + (rng() - 0.5) * 0.15
    pts.push([Math.cos(a), Math.sin(a)])
    labels.push('Moon1')
  }
  for (let i = 0; i < n; i++) {
    const a = Math.PI * i / n + (rng() - 0.5) * 0.15
    pts.push([1 - Math.cos(a), 1 - Math.sin(a) - 0.5])
    labels.push('Moon2')
  }
  return { points: pts, labels }
}
function makeCircles(n: number, seed: number = 42) {
  const rng = seededRandom(seed)
  const pts: number[][] = [], labels: string[] = []
  for (let i = 0; i < n; i++) {
    const a = 2 * Math.PI * i / n + (rng() - 0.5) * 0.2
    pts.push([Math.cos(a) * 0.5, Math.sin(a) * 0.5])
    labels.push('Inner')
  }
  for (let i = 0; i < n; i++) {
    const a = 2 * Math.PI * i / n + (rng() - 0.5) * 0.2
    pts.push([Math.cos(a) * 1.5, Math.sin(a) * 1.5])
    labels.push('Outer')
  }
  return { points: pts, labels }
}

function runTSNE(X: number[][], perplexity: number = 30, lr: number = 200, iterations: number = 300, seed: number = 42): number[][] {
  const n = X.length, dim = X[0].length
  let rng = seed
  const rand = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647 }
  const Y: number[][] = Array.from({ length: n }, () => [(rand() - 0.5) * 1e-4, (rand() - 0.5) * 1e-4])
  const D: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { let d = 0; for (let k = 0; k < dim; k++) d += (X[i][k] - X[j][k]) ** 2; D[i][j] = d; D[j][i] = d }
  const P: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  const targetEntropy = Math.log2(perplexity)
  for (let i = 0; i < n; i++) {
    let lo = 1e-10, hi = 1e10
    for (let attempt = 0; attempt < 50; attempt++) {
      const beta = (lo + hi) / 2; let sum = 0
      for (let j = 0; j < n; j++) { if (i !== j) { P[i][j] = Math.exp(-D[i][j] * beta); sum += P[i][j] } }
      if (sum < 1e-10) { lo = beta; continue }
      let entropy = 0
      for (let j = 0; j < n; j++) { if (i !== j && P[i][j] > 0) { const p = P[i][j] / sum; entropy -= p * Math.log2(p) } }
      if (entropy > targetEntropy) lo = beta; else hi = beta
    }
    const beta = (lo + hi) / 2; let sum = 0
    for (let j = 0; j < n; j++) { if (i !== j) { P[i][j] = Math.exp(-D[i][j] * beta); sum += P[i][j] } }
    for (let j = 0; j < n; j++) { P[i][j] = i === j ? 0 : P[i][j] / sum }
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const v = (P[i][j] + P[j][i]) / (2 * n); P[i][j] = v; P[j][i] = v }
  for (let iter = 0; iter < iterations; iter++) {
    let Z = 0; const Q: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const dy0 = Y[i][0] - Y[j][0], dy1 = Y[i][1] - Y[j][1]; const q = 1 / (1 + dy0 * dy0 + dy1 * dy1); Q[i][j] = q; Q[j][i] = q; Z += 2 * q }
    for (let i = 0; i < n; i++) {
      let gx = 0, gy = 0
      for (let j = 0; j < n; j++) { if (i === j) continue; const dy0 = Y[i][0] - Y[j][0], dy1 = Y[i][1] - Y[j][1]; const denom = (1 + dy0 * dy0 + dy1 * dy1) * Z; const mult = 4 * (P[i][j] - Q[i][j] / Z) * Q[i][j]; gx += mult * dy0 / denom; gy += mult * dy1 / denom }
      Y[i][0] -= lr * gx; Y[i][1] -= lr * gy
    }
  }
  return Y
}

function runUMAP(X: number[][], nNeighbors: number = 15, minDist: number = 0.1, iterations: number = 200): number[][] {
  const n = X.length, dim = X[0].length
  const D: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { let d = 0; for (let k = 0; k < dim; k++) d += (X[i][k] - X[j][k]) ** 2; D[i][j] = Math.sqrt(d); D[j][i] = D[i][j] }
  const knn: number[][] = Array.from({ length: n }, () => [])
  for (let i = 0; i < n; i++) { const sorted = D[i].map((d, j) => ({ j, d })).filter(x => x.j !== i).sort((a, b) => a.d - b.d); knn[i] = sorted.slice(0, nNeighbors).map(x => x.j) }
  const Y = computePCA(X, 2).projected.map(row => [row[0] * 0.1, row[1] * 0.1])
  for (let iter = 0; iter < iterations; iter++) {
    const lr = 1 - iter / iterations
    for (let i = 0; i < n; i++) {
      for (const j of knn[i]) {
        const dx = Y[j][0] - Y[i][0], dy = Y[j][1] - Y[i][1]; const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const idealDist = D[i][j] * 0.01; const force = (dist - idealDist) * 0.05 * lr
        Y[i][0] += force * dx / dist; Y[i][1] += force * dy / dist
      }
      for (let k = 0; k < 3; k++) {
        const j = Math.floor(Math.random() * n); if (i === j || knn[i].indexOf(j) >= 0) continue
        const dx = Y[j][0] - Y[i][0], dy = Y[j][1] - Y[i][1]; const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        if (dist < minDist + 0.5) { const force = -0.01 * lr / (dist * dist); Y[i][0] += force * dx / dist; Y[i][1] += force * dy / dist }
      }
    }
  }
  return Y
}

function drawScatter(p: any, coords: number[][], labels: string[], labelMap: Record<string, [number, number, number]>, W: number, H: number, M: any, title: string) {
  const pw = W - M.l - M.r, ph = H - M.t - M.b
  const xs = coords.map(c => c[0]), ys = coords.map(c => c[1])
  let mnX = Math.min(...xs), mxX = Math.max(...xs), mnY = Math.min(...ys), mxY = Math.max(...ys)
  const rx = mxX - mnX || 1, ry = mxY - mnY || 1; mnX -= rx * 0.1; mxX += rx * 0.1; mnY -= ry * 0.1; mxY += ry * 0.1
  p.background(255); p.stroke(240); p.strokeWeight(1)
  for (let i = 0; i <= 4; i++) { p.line(M.l, M.t + ph / 4 * i, M.l + pw, M.t + ph / 4 * i); p.line(M.l + pw / 4 * i, M.t, M.l + pw / 4 * i, M.t + ph) }
  for (let i = 0; i < coords.length; i++) {
    const x = M.l + (xs[i] - mnX) / (mxX - mnX) * pw, y = M.t + ph - (ys[i] - mnY) / (mxY - mnY) * ph
    const c = labelMap[labels[i]] || [150, 150, 150]; p.fill(c[0], c[1], c[2], 200); p.noStroke(); p.ellipse(x, y, 8, 8)
  }
  if (title) { p.fill(80); p.noStroke(); p.textSize(12); p.textAlign(p.CENTER); p.text(title, M.l + pw / 2, H - 5) }
}

function drawCellScatter(p: any, coords: number[][], cellTypes: string[], W: number, H: number, M: any, title: string) {
  const pw = W - M.l - M.r, ph = H - M.t - M.b
  const xs = coords.map(c => c[0]), ys = coords.map(c => c[1])
  let mnX = Math.min(...xs), mxX = Math.max(...xs), mnY = Math.min(...ys), mxY = Math.max(...ys)
  const rx = mxX - mnX || 1, ry = mxY - mnY || 1; mnX -= rx * 0.1; mxX += rx * 0.1; mnY -= ry * 0.1; mxY += ry * 0.1
  p.background(255); p.stroke(240); p.strokeWeight(1)
  for (let i = 0; i <= 4; i++) { p.line(M.l, M.t + ph / 4 * i, M.l + pw, M.t + ph / 4 * i); p.line(M.l + pw / 4 * i, M.t, M.l + pw / 4 * i, M.t + ph) }
  for (let i = 0; i < coords.length; i++) {
    const x = M.l + (xs[i] - mnX) / (mxX - mnX) * pw, y = M.t + ph - (ys[i] - mnY) / (mxY - mnY) * ph
    const [r, g, b] = getTypeColor(cellTypes[i]); p.fill(r, g, b, 200); p.noStroke(); p.ellipse(x, y, 9, 9)
  }
  if (title) { p.fill(80); p.noStroke(); p.textSize(12); p.textAlign(p.CENTER); p.text(title, M.l + pw / 2, H - 5) }
}

const SYNTH_PALETTE: Record<string, [number, number, number]> = { 'Inner': [66, 133, 244], 'Outer': [234, 67, 53], 'Moon1': [66, 133, 244], 'Moon2': [234, 67, 53] }

export default function DimRedViz({ data, geneNames, cellTypes, lang = 'en', activeStep, precomputedTsne, precomputedUmap }: DimRedVizProps) {
  const isZh = lang === 'zh'
  const nCells = data.length
  const pca = useMemo(() => computePCA(data, 10).projected, [data])

  const [dataset, setDataset] = useState<'swissroll' | 'moons' | 'circles'>('swissroll')
  const step1Ref = useRef<HTMLDivElement>(null)
  const step1P5 = useRef<p5 | null>(null)

  const [perplexity, setPerplexity] = useState(30)
  const [lr, setLr] = useState(200)
  const [tsneIter, setTsneIter] = useState(0)
  const [tsnePlaying, setTsnePlaying] = useState(false)
  const [tsneFrames, setTsneFrames] = useState<number[][][]>([])
  const step2Ref = useRef<HTMLDivElement>(null)
  const step2P5 = useRef<p5 | null>(null)

  const [nNeighbors, setNN] = useState(15)
  const [minDist, setMinDist] = useState(0.1)
  const [umapResult, setUmapResult] = useState<number[][] | null>(null)
  const step3Ref = useRef<HTMLDivElement>(null)
  const step3P5 = useRef<p5 | null>(null)

  const [tsneRunCount, setTsneRunCount] = useState(0)
  const [isComputing, setIsComputing] = useState(false)
  const [tsneResult4, setTsneResult4] = useState<number[][] | null>(null)
  const step4AllRef = useRef<HTMLDivElement>(null)
  const step4AllP5 = useRef<p5 | null>(null)

  // Use precomputed results if provided
  useEffect(() => {
    if (precomputedTsne) setTsneResult4(precomputedTsne)
    if (precomputedUmap) setUmapResult(precomputedUmap)
  }, [precomputedTsne, precomputedUmap])

  useEffect(() => {
    if (activeStep !== 1) return
    setIsComputing(true)
    setTimeout(() => {
      const frames: number[][][] = []
      for (const it of [0, 20, 50, 100, 200, 300]) { frames.push(runTSNE(pca, perplexity, lr, it, 42)) }
      setTsneFrames(frames)
      setTsneIter(0)
      setIsComputing(false)
    }, 50)
  }, [activeStep, perplexity, lr, pca])

  useEffect(() => {
    if (activeStep !== 2) return
    setIsComputing(true)
    setTimeout(() => {
      setUmapResult(runUMAP(pca, nNeighbors, minDist, 200))
      setIsComputing(false)
    }, 50)
  }, [activeStep, nNeighbors, minDist, pca])

  useEffect(() => {
    if (activeStep !== 3) return
    setIsComputing(true)
    setTimeout(() => {
      setTsneResult4(runTSNE(pca, 30, 200, 300, Date.now()))
      setUmapResult(runUMAP(pca, 15, 0.1, 200))
      setIsComputing(false)
    }, 50)
  }, [activeStep, tsneRunCount])

  useEffect(() => {
    if (activeStep !== 0 || !step1Ref.current) return
    if (step1P5.current) step1P5.current.remove()
    const ds = dataset
    const sketch = (p: any) => {
      const W = 540, H = 180
      let genData = ds === 'swissroll' ? makeSwissRoll(50) : ds === 'moons' ? makeMoons(50) : makeCircles(50)
      const pcaSyn = genData.points.map(r => r.length > 2 ? computePCA([r], 2).projected[0] : r)
      const tsneSyn = runTSNE(genData.points, 20, 100, 200, 42)
      const umapSyn = runUMAP(genData.points, 10, 0.1, 150)
      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step1Ref.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        const pw = W / 3
        const panels = [{ coords: pcaSyn, title: 'PCA' }, { coords: tsneSyn, title: 't-SNE' }, { coords: umapSyn, title: 'UMAP' }]
        panels.forEach((panel, idx) => { p.push(); p.translate(idx * pw, 0); drawScatter(p, panel.coords, genData.labels, SYNTH_PALETTE, pw, H, { t: 10, r: 5, b: 25, l: 5 }, panel.title); p.pop() })
      }
    }
    step1P5.current = new p5(sketch)
    return () => { step1P5.current?.remove() }
  }, [activeStep, dataset])

  useEffect(() => {
    if (activeStep !== 1 || !step2Ref.current || tsneFrames.length === 0) return
    if (step2P5.current) step2P5.current.remove()
    const frame = tsneFrames[Math.min(tsneIter, tsneFrames.length - 1)]
    const sketch = (p: any) => {
      const W = 480, H = 400, M = { t: 20, r: 20, b: 30, l: 40 }
      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step2Ref.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => { drawCellScatter(p, frame, cellTypes, W, H, M, '') }
    }
    step2P5.current = new p5(sketch)
    return () => { step2P5.current?.remove() }
  }, [activeStep, tsneIter, tsneFrames, cellTypes])

  useEffect(() => {
    if (!tsnePlaying) return
    const iv = setInterval(() => {
      setTsneIter(prev => { if (prev >= tsneFrames.length - 1) { setTsnePlaying(false); return prev } return prev + 1 })
    }, 1000)
    return () => clearInterval(iv)
  }, [tsnePlaying, tsneFrames.length])

  useEffect(() => {
    if (activeStep !== 2 || !step3Ref.current || !umapResult) return
    if (step3P5.current) step3P5.current.remove()
    const coords = umapResult
    const sketch = (p: any) => {
      const W = 480, H = 400, M = { t: 20, r: 20, b: 30, l: 40 }
      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step3Ref.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => { drawCellScatter(p, coords, cellTypes, W, H, M, '') }
    }
    step3P5.current = new p5(sketch)
    return () => { step3P5.current?.remove() }
  }, [activeStep, umapResult, cellTypes])

  useEffect(() => {
    if (activeStep !== 3 || !step4AllRef.current || !tsneResult4 || !umapResult) return
    if (step4AllP5.current) step4AllP5.current.remove()
    const pcaR = pca.map(r => [r[0], r[1]])
    const sketch = (p: any) => {
      const W = 540, H = 180
      p.setup = () => { const c = p.createCanvas(W, H); c.parent(step4AllRef.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        const pw = W / 3
        const panels = [{ coords: pcaR, title: 'PCA' }, { coords: tsneResult4, title: 't-SNE' }, { coords: umapResult, title: 'UMAP' }]
        panels.forEach((panel, idx) => { p.push(); p.translate(idx * pw, 0); drawCellScatter(p, panel.coords, cellTypes, pw, H, { t: 10, r: 5, b: 25, l: 5 }, panel.title); p.pop() })
      }
    }
    step4AllP5.current = new p5(sketch)
    return () => { step4AllP5.current?.remove() }
  }, [activeStep, pca, tsneResult4, umapResult, cellTypes, tsneRunCount])

  const iters = [0, 20, 50, 100, 200, 300]

  if (activeStep === 0) {
    return (
      <div>
        <div className="control-group">
          <label>{isZh ? '数据集' : 'Dataset'}:</label>
          {isComputing && <div className="flex justify-center py-4 text-sm text-purple-500">{isZh ? '计算中...' : 'Computing...'}</div>}
        {(['swissroll', 'moons', 'circles'] as const).map(ds => (
            <button key={ds} onClick={() => setDataset(ds)}
              className={`px-3 py-1 rounded text-sm ${dataset === ds ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {ds === 'swissroll' ? (isZh ? '瑞士卷' : 'Swiss Roll') : ds === 'moons' ? (isZh ? '双月' : 'Two Moons') : (isZh ? '同心圆' : 'Circles')}
            </button>
          ))}
        </div>
        {isComputing && <div className="flex justify-center py-4 text-sm text-purple-500">{isZh ? '计算中...' : 'Computing...'}</div>}
        <div ref={step1Ref} className="flex justify-center" />
      </div>
    )
  }

  if (activeStep === 1) {
    return (
      <div>
        <div className="control-group flex-wrap">
          <div className="flex items-center gap-3">
            <label>{isZh ? '困惑度' : 'Perplexity'}:</label>
            <input type="range" min={5} max={50} value={perplexity} onChange={e => setPerplexity(Number(e.target.value))} />
            <span className="font-mono text-sm w-8">{perplexity}</span>
          </div>
          <div className="flex items-center gap-3">
            <label>{isZh ? '学习率' : 'LR'}:</label>
            <input type="range" min={50} max={500} step={10} value={lr} onChange={e => setLr(Number(e.target.value))} />
            <span className="font-mono text-sm w-10">{lr}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <button onClick={() => setTsnePlaying(true)} disabled={tsnePlaying} className="px-3 py-1.5 rounded text-sm font-medium bg-green-500 text-white disabled:opacity-50">{'\u25b6'} {isZh ? '播放' : 'Play'}</button>
          <button onClick={() => setTsnePlaying(false)} className="px-3 py-1.5 rounded text-sm font-medium bg-amber-500 text-white">{'\u23f8'} {isZh ? '暂停' : 'Pause'}</button>
          <button onClick={() => setTsneIter(prev => Math.min(prev + 1, tsneFrames.length - 1))} className="px-3 py-1.5 rounded text-sm font-medium bg-blue-500 text-white">{'\u23ed'} {isZh ? '单步' : 'Step'}</button>
          <button onClick={() => { setTsneIter(0); setTsnePlaying(false) }} className="px-3 py-1.5 rounded text-sm font-medium bg-gray-200 text-gray-600">{'\u21ba'} {isZh ? '重置' : 'Reset'}</button>
        </div>
        <div className="text-center text-sm text-gray-500 mb-2">
          {isZh ? '迭代' : 'Iter'}: <span className="font-bold">{iters[Math.min(tsneIter, iters.length - 1)]}</span> / 300
        </div>
        {isComputing && <div className="flex justify-center py-4 text-sm text-red-500">{isZh ? '计算中...' : 'Computing t-SNE...'}</div>}
        <div ref={step2Ref} className="flex justify-center" />
      </div>
    )
  }

  if (activeStep === 2) {
    return (
      <div>
        <div className="control-group flex-wrap">
          <div className="flex items-center gap-3">
            <label>n_neighbors:</label>
            <input type="range" min={2} max={50} value={nNeighbors} onChange={e => setNN(Number(e.target.value))} />
            <span className="font-mono text-sm w-8">{nNeighbors}</span>
          </div>
          <div className="flex items-center gap-3">
            <label>min_dist:</label>
            <input type="range" min={0.01} max={1} step={0.01} value={minDist} onChange={e => setMinDist(Number(e.target.value))} />
            <span className="font-mono text-sm w-10">{minDist.toFixed(2)}</span>
          </div>
        </div>
        {isComputing && <div className="flex justify-center py-4 text-sm text-blue-500">{isZh ? '计算中...' : 'Computing UMAP...'}</div>}
        <div ref={step3Ref} className="flex justify-center" />
      </div>
    )
  }

  if (activeStep === 3) {
    return (
      <div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <button onClick={() => setTsneRunCount(c => c + 1)} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white">
            {isZh ? '重新运行t-SNE' : 'Re-run t-SNE'} (x{tsneRunCount + 1})
          </button>
        </div>
        {isComputing && <div className="flex justify-center py-4 text-sm text-green-500">{isZh ? '计算中...' : 'Computing...'}</div>}
        <div ref={step4AllRef} className="flex justify-center" />
      </div>
    )
  }

  return null
}
