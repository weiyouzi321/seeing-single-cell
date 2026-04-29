export function computePCA(data: number[][], nComp: number = 10) {
  const n = data.length, p = data[0].length
  const means = Array(p).fill(0)
  for (let j = 0; j < p; j++) { for (let i = 0; i < n; i++) means[j] += data[i][j]; means[j] /= n }
  const centered = data.map(row => row.map((v, j) => v - means[j]))
  const cov: number[][] = Array.from({ length: p }, () => Array(p).fill(0))
  for (let i = 0; i < p; i++) for (let j = i; j < p; j++) {
    let s = 0; for (let k = 0; k < n; k++) s += centered[k][i] * centered[k][j]
    cov[i][j] = s / (n - 1); cov[j][i] = cov[i][j]
  }
  const evecs: number[][] = [], evals: number[] = [], mat = cov.map(r => [...r])
  for (let c = 0; c < Math.min(nComp, p); c++) {
    let vec = Array(p).fill(0).map(() => Math.random() - 0.5)
    let nm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)); vec = vec.map(v => v / nm)
    for (let it = 0; it < 300; it++) {
      const nv = Array(p).fill(0)
      for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) nv[i] += mat[i][j] * vec[j]
      nm = Math.sqrt(nv.reduce((s, v) => s + v * v, 0)); if (nm < 1e-12) break; vec = nv.map(v => v / nm)
    }
    let ev = 0; for (let i = 0; i < p; i++) { let mv = 0; for (let j = 0; j < p; j++) mv += mat[i][j] * vec[j]; ev += vec[i] * mv }
    evecs.push(vec); evals.push(Math.max(0, ev))
    for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) mat[i][j] -= ev * vec[i] * vec[j]
  }
  const projected = centered.map(row => evecs.map(ev => ev.reduce((s, v, j) => s + v * row[j], 0)))
  return { projected, evecs, evals, centered, cov }
}
