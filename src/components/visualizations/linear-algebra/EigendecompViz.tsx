'use client'

import { useEffect, useRef, useState } from 'react'
import p5 from 'p5'

interface EigendecompVizProps {
  matrix: number[][]       // 对称矩阵 (例如协方差矩阵)
  maxIter?: number         // 最大迭代次数
  currentIter?: number     // 当前迭代步数 (用于动画控制)
  selectedPC?: number      // 选中的主成分
  onPCSelect?: (pc: number) => void
  color?: string           // 主题色 (indigo #6366f1)
  title?: string
  lang?: 'en' | 'zh'
}

// Power iteration 算法 (来自 PcaViz.tsx Step 3-C)
function powerIterSteps(cov: number[][], nSteps: number) {
  const p = cov.length
  let vec = Array(p).fill(0).map(() => Math.random() - 0.5)
  let nm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0))
  vec = vec.map((v: number) => v / nm)
  const steps: number[][] = [vec]

  for (let it = 0; it < nSteps; it++) {
    const nv = Array(p).fill(0)
    for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) nv[i] += cov[i][j] * vec[j]
    nm = Math.sqrt(nv.reduce((s: number, v: number) => s + v * v, 0))
    if (nm < 1e-12) break
    vec = nv.map((v: number) => v / nm)
    steps.push([...vec])
  }

  let eigenval = 0
  for (let i = 0; i < p; i++) {
    let mv = 0
    for (let j = 0; j < p; j++) mv += cov[i][j] * vec[j]
    eigenval += vec[i] * mv
  }
  return { steps, eigenval: Math.max(0, eigenval), eigenvector: vec }
}

export default function EigendecompViz({
  matrix,
  maxIter = 20,
  currentIter = 5,
  selectedPC = 0,
  onPCSelect,
  color = '#6366f1',
  title,
  lang = 'en'
}: EigendecompVizProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isZh = lang === 'zh'

  const p = 6  // 固定显示 6×6 矩阵
  const cSz = 20
  const nPC = Math.min(4, p)

  useEffect(() => {
    if (!containerRef.current) return

    const cov = matrix
    const piResult = powerIterSteps(cov, currentIter)
    const vec = piResult.eigenvector
    const lambda = piResult.eigenval

    const sketch = (p5: p5) => {
      const W = 800, H = 500
      const mX = 40, mY = 120
      const sigmaW = p * cSz

      p5.setup = () => {
        const canvas = p5.createCanvas(W, H)
        canvas.parent(containerRef.current!)
        p5.textFont('Inter')
        p5.noLoop()
      }

      p5.draw = () => {
        p5.background(255)

        // Title
        p5.fill(50)
        p5.noStroke()
        p5.textSize(13)
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.text(title || (isZh ? '特征值分解: 幂迭代法' : 'Eigendecomposition: Power Iteration'), mX, 8)
        p5.fill(130)
        p5.textSize(10)
        p5.text(isZh ? '选择 PC，观察迭代中 λ 与 v 的动态变化' : 'Select PC, watch λ and v converge dynamically', mX, 26)

        // ── Σ matrix ──
        p5.fill(60)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.text('Σ (' + p + '×' + p + ')', mX, mY - 16)
        const cMx = Math.max(...cov.slice(0, p).map((r) => r.slice(0, p).map(Math.abs)).flat()) || 1

        for (let i = 0; i < p; i++) {
          for (let j = 0; j < p; j++) {
            const v = cov[i][j], n = Math.abs(v) / cMx
            p5.fill(n >= 0 ? [66, 133, 244, n * 75 + 25] : [234, 67, 53, n * 75 + 25])
            p5.stroke(255)
            p5.strokeWeight(0.5)
            p5.rect(mX + j * cSz, mY + i * cSz, cSz, cSz)
          }
        }

        // ── Σv product ──
        p5.fill(16, 185, 129)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.text('Σv', mX + sigmaW + 30, mY - 16)

        const sigmaV = Array(p).fill(0)
        for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) sigmaV[i] += cov[i][j] * vec[j]
        const svMx = Math.max(...sigmaV.map(Math.abs)) || 1

        for (let i = 0; i < p; i++) {
          const v = sigmaV[i], n = Math.abs(v) / svMx
          p5.fill(v >= 0 ? [16, 185, 129, n * 0.75 + 0.25] : [239, 68, 68, n * 0.75 + 0.25])
          p5.stroke(255)
          p5.strokeWeight(0.5)
          p5.rect(mX + sigmaW + 30, mY + i * cSz, cSz, cSz)  // simplified
        }

        // ── λ badge ──
        const lambdaX = mX + sigmaW + 30 + p * cSz + 20
        p5.fill(60)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.text(isZh ? 'λ:' : 'λ:', lambdaX, mY - 16)
        const lambdaH = p * cSz
        const lambdaY = mY + (lambdaH - 12) / 2
        p5.fill(245, 158, 11)
        p5.noStroke()
        p5.rect(lambdaX + 25, lambdaY, 40, 12, 3)
        p5.fill(255)
        p5.textSize(10)
        p5.textAlign(p5.CENTER, p5.CENTER)
        p5.text(lambda.toFixed(4), lambdaX + 45, lambdaY + 6)

        // ── Eigenvectors V ──
        const evX = lambdaX + 80
        p5.fill(60)
        p5.textSize(9)
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.text(isZh ? '特征向量 v' : 'Eigenvector v', evX, mY - 16)
        const evecs = [vec]  // simplified
        const evMx = Math.max(...evecs.slice(0, nPC).map((r) => r.map(Math.abs)).flat()) || 1

        for (let i = 0; i < p; i++) {
          for (let j = 0; j < nPC; j++) {
            const v = evecs[j][i], n = Math.abs(v) / evMx
            p5.fill(v >= 0 ? [66, 133, 244, n * 0.75 + 0.25] : [234, 67, 53, n * 0.75 + 0.25])
            p5.stroke(255)
            p5.strokeWeight(0.5)
            p5.rect(evX + j * cSz, mY + i * cSz, cSz, cSz)
          }
        }

        // ── Equation ──
        const eqX = evX + nPC * cSz + 30
        p5.fill(60)
        p5.textSize(10)
        p5.textAlign(p5.LEFT, p5.TOP)
        p5.text(isZh ? 'Σv ≈ λ·v' : 'Σv ≈ λ·v', eqX, mY + p * cSz / 2 - 10)
      }
    }

    const p5Instance = new p5(sketch)
    return () => p5Instance.remove()
  }, [matrix, currentIter, selectedPC, color, title, lang])

  return <div ref={containerRef} className="flex justify-center" />
}
