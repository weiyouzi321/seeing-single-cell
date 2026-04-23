'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface PcaVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: 'en' | 'zh'
  activeStep: number
  projected?: number[][]
  varianceRatio?: number[]
}

const TC: Record<string, [number, number, number]> = {
  'CD4 T': [66,133,244], 'CD8 T': [52,168,83], 'B': [234,67,53],
  'NK': [251,188,4], 'Monocyte': [171,71,188], 'DC': [255,112,67],
}
const gc = (t: string): [number,number,number] => TC[t] || [150,150,150]

function computePCA(data: number[][], nComp = 10) {
  const n = data.length, p = data[0].length
  const means = Array(p).fill(0)
  for (let j = 0; j < p; j++) { for (let i = 0; i < n; i++) means[j] += data[i][j]; means[j] /= n }
  const centered = data.map(row => row.map((v, j) => v - means[j]))
  const cov: number[][] = Array.from({length: p}, () => Array(p).fill(0))
  for (let i = 0; i < p; i++) for (let j = i; j < p; j++) { let s = 0; for (let k = 0; k < n; k++) s += centered[k][i] * centered[k][j]; cov[i][j] = s/(n-1); cov[j][i] = cov[i][j] }
  const evecs: number[][] = [], evals: number[] = [], mat = cov.map(r => [...r])
  for (let c = 0; c < Math.min(nComp, p); c++) {
    let vec = Array(p).fill(0).map(() => Math.random()-0.5); let nm = Math.sqrt(vec.reduce((s: number, v: number) => s+v*v, 0)); vec = vec.map((v: number) => v/nm)
    for (let it = 0; it < 300; it++) { const nv = Array(p).fill(0); for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) nv[i] += mat[i][j]*vec[j]; nm = Math.sqrt(nv.reduce((s: number, v: number) => s+v*v, 0)); if (nm < 1e-12) break; vec = nv.map((v: number) => v/nm) }
    let ev = 0; for (let i = 0; i < p; i++) { let mv = 0; for (let j = 0; j < p; j++) mv += mat[i][j]*vec[j]; ev += vec[i]*mv }
    evecs.push(vec); evals.push(Math.max(0, ev))
    for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) mat[i][j] -= ev*vec[i]*vec[j]
  }
  return { projected: centered.map(row => evecs.map(ev => ev.reduce((s: number, v: number, j: number) => s+v*row[j], 0))), evecs, evals, centered, cov }
}

// Power iteration step-by-step for visualization
function powerIterSteps(cov: number[][], nSteps: number) {
  const p = cov.length
  let vec = Array(p).fill(0).map(() => Math.random()-0.5)
  let nm = Math.sqrt(vec.reduce((s: number, v: number) => s+v*v, 0))
  vec = vec.map((v: number) => v/nm)
  const steps: number[][] = [vec]
  for (let it = 0; it < nSteps; it++) {
    const nv = Array(p).fill(0)
    for (let i = 0; i < p; i++) for (let j = 0; j < p; j++) nv[i] += cov[i][j]*vec[j]
    nm = Math.sqrt(nv.reduce((s: number, v: number) => s+v*v, 0))
    if (nm < 1e-12) break
    vec = nv.map((v: number) => v/nm)
    steps.push([...vec])
  }
  let eigenval = 0
  for (let i = 0; i < p; i++) { let mv = 0; for (let j = 0; j < p; j++) mv += cov[i][j]*vec[j]; eigenval += vec[i]*mv }
  return { steps, eigenval: Math.max(0, eigenval), eigenvector: vec }
}

export default function PcaViz({ data, geneNames, cellTypes, lang = 'en', activeStep, projected, varianceRatio }: PcaVizProps) {
  // PCA matrix dimensions (shared)

  const dG = Math.min(geneNames.length, 8)

  const dC = Math.min(cellTypes.length, 10)

  const nPC = Math.min(4, dG)



  const s1Ref = useRef<HTMLDivElement>(null)
  const s2Ref = useRef<HTMLDivElement>(null)
  const s3MatRef = useRef<HTMLDivElement>(null)
  const s3CovRef = useRef<HTMLDivElement>(null)
  const s3EigenRef = useRef<HTMLDivElement>(null)
  const s3ProjRef = useRef<HTMLDivElement>(null)
  const psx = useRef(0); const psy = useRef(0); const ppx = useRef(0); const ppy = useRef(0); const zm = useRef(1)

  const s4ERef = useRef<HTMLDivElement>(null)
  const s4SRef = useRef<HTMLDivElement>(null)
  const refs = useRef<Record<string, p5 | null>>({})

  const isZh = lang === 'zh'
  const nC = data.length, nG = data[0].length
  const [xG, setXG] = useState(0)
  const [yG, setYG] = useState(Math.min(1, nG-1))
  const [pAngle, setPAngle] = useState(45)
  const [s3Sub, setS3Sub] = useState(0)
  const [selCov, setSelCov] = useState<{j:number;k:number} | null>(null)
  const [selGeneCol, setSelGeneCol] = useState<number | null>(null)
  const [eigenStep, setEigenStep] = useState(5)
  const [selPC, setSelPC] = useState(0)
  const [selProj, setSelProj] = useState<{i:number;j:number} | null>(null)

  const [xPC, setXPC] = useState(0)
  const [yPC, setYPC] = useState(1)
  const [s4Hover, setS4Hover] = useState<number | null>(null)
  const [s4Sel, setS4Sel] = useState<number | null>(null)


  const pca = useMemo(() => computePCA(data, Math.min(10, nG)), [data, nG])
  const computedVarexp = useMemo(() => { const t = pca.evals.reduce((s: number,v: number)=>s+v,0); return t>0 ? pca.evals.map((v: number)=>v/t) : pca.evals.map(()=>0) }, [pca])
  const varexp = varianceRatio || computedVarexp
  const pcaProjected = projected || pca.projected

  const rm = (k: string) => { if(refs.current[k]) { refs.current[k]!.remove(); refs.current[k] = null } }
  const mk = (k: string, el: HTMLDivElement | null, sk: any) => { if(!el) return; rm(k); refs.current[k] = new p5(sk) }

  // ── Step 1: Interactive scatter ──
  useEffect(() => {
    if (activeStep !== 0 || !s1Ref.current) return
    const sk = (p: any) => {
      const W=500, H=400, M={t:25,r:20,b:45,l:50}, pw=W-M.l-M.r, ph=H-M.t-M.b
      let hov=-1, zm=1, px2=0, py2=0, pan=false, psx=0,psy=0,ppx=0,ppy=0
      const xs=data.map((r: number[])=>r[xG]), ys=data.map((r: number[])=>r[yG])
      let mnX=Math.min(...xs),mxX=Math.max(...xs)||1, mnY=Math.min(...ys),mxY=Math.max(...ys)||1
      const pdX=(mxX-mnX)*0.05||0.5, pdY=(mxY-mnY)*0.05||0.5; mnX-=pdX;mxX+=pdX;mnY-=pdY;mxY+=pdY
      const rx=xs.map((v: number)=>M.l+(v-mnX)/(mxX-mnX)*pw), ry=ys.map((v: number)=>M.t+ph-(v-mnY)/(mxY-mnY)*ph)
      const ts = (a: number,b: number) => ({x:(a-pw/2-M.l)*zm+pw/2+M.l+px2, y:(b-ph/2-M.t)*zm+ph/2+M.t+py2})
      p.setup=()=>{p.createCanvas(W,H).parent(s1Ref.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255); p.stroke(235);p.strokeWeight(0.5)
        for(let i=0;i<=5;i++){p.line(M.l+pw*i/5,M.t,M.l+pw*i/5,M.t+ph);p.line(M.l,M.t+ph*i/5,M.l+pw,M.t+ph*i/5)}
        if(hov>=0&&hov<nC){const{x:hx,y:hy}=ts(rx[hov],ry[hov]);p.stroke(200);p.strokeWeight(0.5);for(let d=M.t;d<hy-5;d+=6)p.line(hx,d,hx,Math.min(d+3,hy-5));for(let d=hx+5;d<M.l+pw;d+=6)p.line(d,hy,Math.min(d+3,M.l+pw),hy)}
        for(let i=0;i<nC;i++){const{x,y}=ts(rx[i],ry[i]);if(x<M.l-5||x>M.l+pw+5||y<M.t-5||y>M.t+ph+5)continue;const[r,g,b]=gc(cellTypes[i]);if(i===hov){p.fill(r,g,b,255);p.stroke(0);p.strokeWeight(1.5);p.ellipse(x,y,12,12)}else{p.fill(r,g,b,180);p.noStroke();p.ellipse(x,y,8,8)}}
        p.noFill();p.stroke(180);p.strokeWeight(1);p.rect(M.l,M.t,pw,ph)
        p.noStroke();p.fill(60);p.textSize(11);p.textAlign(p.CENTER,p.TOP);p.text(geneNames[xG],M.l+pw/2,M.t+ph+8)
        p.push();p.translate(12,M.t+ph/2);p.rotate(-Math.PI/2);p.text(geneNames[yG],0,0);p.pop()
        p.fill(120);p.textSize(8);p.textAlign(p.CENTER,p.TOP);for(let i=0;i<=5;i++)p.text((mnX+(mxX-mnX)*i/5).toFixed(1),M.l+pw*i/5,M.t+ph+2)
        p.textAlign(p.RIGHT,p.CENTER);for(let i=0;i<=5;i++)p.text((mnY+(mxY-mnY)*i/5).toFixed(1),M.l-4,M.t+ph-ph*i/5)
        const ut=Array.from(new Set(cellTypes));p.textSize(9);p.textAlign(p.LEFT,p.CENTER);ut.forEach((t,i)=>{const[r,g,b]=gc(t);p.fill(r,g,b);p.noStroke();p.ellipse(W-85,M.t+10+i*16,8,8);p.fill(80);p.text(t,W-77,M.t+10+i*16)})
        if(hov>=0&&hov<nC){const bx=M.l+10,by=M.t+8;p.fill(255,255,255,230);p.stroke(180);p.strokeWeight(1);p.rect(bx,by,155,62,5);p.noStroke();p.fill(50);p.textSize(10);p.textAlign(p.LEFT,p.TOP);p.text((isZh?'细胞':'Cell')+' #'+(hov+1),bx+8,by+6);p.fill(80);p.textSize(9);p.text((isZh?'类型':'Type')+': '+cellTypes[hov],bx+8,by+22);p.text(geneNames[xG]+': '+xs[hov].toFixed(3),bx+8,by+36);p.text(geneNames[yG]+': '+ys[hov].toFixed(3),bx+8,by+50)}
        if(zm!==1){p.fill(150);p.noStroke();p.textSize(9);p.textAlign(p.RIGHT,p.BOTTOM);p.text((zm*100).toFixed(0)+'%',W-10,H-5)}
        p.fill(180);p.noStroke();p.textSize(9);p.textAlign(p.LEFT,p.BOTTOM);p.text(isZh?'悬停查看 · 滚轮缩放 · 拖拽平移':'Hover · Scroll zoom · Drag pan',M.l,H-3)
      }
      p.mouseMoved=()=>{let c=-1,cd=15;for(let i=0;i<nC;i++){const{x,y}=ts(rx[i],ry[i]);const d=Math.hypot(p.mouseX-x,p.mouseY-y);if(d<cd){c=i;cd=d}}if(c!==hov){hov=c;p.redraw()}}
      p.mouseWheel=(e: any)=>{if(p.mouseX<M.l||p.mouseX>M.l+pw||p.mouseY<M.t||p.mouseY>M.t+ph)return;zm=Math.max(0.5,Math.min(5,zm+(e.delta>0?-0.12:0.12)));p.redraw();return false}
      p.mousePressed=()=>{if(p.mouseX>=M.l&&p.mouseX<=M.l+pw&&p.mouseY>=M.t&&p.mouseY<=M.t+ph){pan=true;psx=p.mouseX;psy=p.mouseY;ppx=px2;ppy=py2}}
      p.mouseDragged=()=>{if(!pan)return;px2=ppx+(p.mouseX-psx);py2=ppy+(p.mouseY-psy);p.redraw()}
      p.mouseReleased=()=>{pan=false}
    }
    mk('s1', s1Ref.current, sk)
    return () => rm('s1')
  }, [activeStep, xG, yG, data, geneNames, cellTypes, nC, isZh])

  // ── Step 2: Variance projection ──
  useEffect(() => {
    if (activeStep !== 1 || !s2Ref.current) return
    const sk = (p: any) => {
      const W=500, H=360, M={t:30,r:20,b:45,l:50}, pw=W-M.l-M.r, ph=H-M.t-M.b
      const cx=M.l+pw/2, cy=M.t+ph/2, r=Math.min(pw,ph)*0.38
      const xs=data.map((r: number[])=>r[0]), ys=data.map((r: number[])=>r[1])
      const mX=xs.reduce((a: number,b: number)=>a+b,0)/xs.length, mY=ys.reduce((a: number,b: number)=>a+b,0)/ys.length
      const sX=Math.sqrt(xs.reduce((s: number,v: number)=>s+(v-mX)**2,0)/xs.length)||1, sY=Math.sqrt(ys.reduce((s: number,v: number)=>s+(v-mY)**2,0)/ys.length)||1
      p.setup=()=>{p.createCanvas(W,H).parent(s2Ref.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255);const ar=pAngle*Math.PI/180,dx=Math.cos(ar),dy=-Math.sin(ar)
        p.stroke(235);p.strokeWeight(0.5);for(let i=0;i<=5;i++){p.line(M.l+pw*i/5,M.t,M.l+pw*i/5,M.t+ph);p.line(M.l,M.t+ph*i/5,M.l+pw,M.t+ph*i/5)}
        for(let i=0;i<nC;i++){const px=cx+((xs[i]-mX)/sX)*r*0.6, py=cy-((ys[i]-mY)/sY)*r*0.6;const[cr,cg,cb]=gc(cellTypes[i]);p.fill(cr,cg,cb,180);p.noStroke();p.ellipse(px,py,8,8)}
        p.stroke(239,68,68);p.strokeWeight(2.5);p.line(cx-dx*r*1.3,cy-dy*r*1.3,cx+dx*r*1.3,cy+dy*r*1.3)
        let vr=0;for(let i=0;i<nC;i++){const rx2=((xs[i]-mX)/sX)*0.6*r,ry2=-((ys[i]-mY)/sY)*0.6*r;const pr=rx2*dx+ry2*dy;const lx=cx+pr*dx,ly=cy+pr*dy;const[cr,cg,cb]=gc(cellTypes[i]);p.stroke(cr,cg,cb,50);p.strokeWeight(0.7);p.line(cx+rx2,cy+ry2,lx,ly);p.fill(cr,cg,cb,130);p.noStroke();p.ellipse(lx,ly,5,5);vr+=(pr/r)**2}
        vr/=nC
        p.noFill();p.stroke(180);p.strokeWeight(1);p.rect(M.l,M.t,pw,ph)
        p.noStroke();p.fill(60);p.textSize(11);p.textAlign(p.CENTER,p.TOP);p.text(geneNames[0],M.l+pw/2,M.t+ph+8)
        p.push();p.translate(12,M.t+ph/2);p.rotate(-Math.PI/2);p.text(geneNames[1],0,0);p.pop()
        p.fill(120);p.textSize(8);p.textAlign(p.CENTER,p.TOP);for(let i=0;i<=5;i++)p.text(((i/5)*2-1).toFixed(1),M.l+pw*i/5,M.t+ph+2)
        p.textAlign(p.RIGHT,p.CENTER);for(let i=0;i<=5;i++)p.text(((i/5)*2-1).toFixed(1),M.l-4,M.t+ph-ph*i/5)
        const ut=Array.from(new Set(cellTypes));p.textSize(9);p.textAlign(p.LEFT,p.CENTER);ut.forEach((t,i)=>{const[cr,cg,cb]=gc(t);p.fill(cr,cg,cb);p.noStroke();p.ellipse(W-85,M.t+10+i*16,8,8);p.fill(80);p.text(t,W-77,M.t+10+i*16)})
        // Variance + angle BELOW scatter, not overlapping
        const barX=M.l+10, barY=M.t+ph+22, barW=140, barH=12
        p.fill(240);p.noStroke();p.rect(barX,barY,barW,barH,3)
        p.fill(239,68,68,180);p.rect(barX,barY,Math.min(1,vr/0.4)*barW,barH,3)
        p.fill(60);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
        p.text((isZh?'方差':'Variance')+': '+vr.toFixed(3), barX+barW+8, barY)
        p.fill(80);p.text((isZh?'角度':'Angle')+': '+pAngle.toFixed(0)+'°', barX+barW+110, barY)
      }
    }
    mk('s2', s2Ref.current, sk)
    return () => rm('s2')
  }, [activeStep, pAngle, data, cellTypes, nC, geneNames, isZh])

  // ── Step 3-A: Centered data matrix + gene bar chart ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 0 || !s3MatRef.current) return
    const centered = pca.centered
    const dG = Math.min(nG, 10), dC = Math.min(nC, 20), cSz = 20
    const mX = 60, mY = 55
    const W = mX + dG*cSz + 220, H = mY + dC*cSz + 40
    const sk = (p: any) => {
      p.setup=()=>{p.createCanvas(W,H).parent(s3MatRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255)
        p.fill(50);p.noStroke();p.textSize(12);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'中心化数据矩阵 Xc (值 = 原始 − 均值)':'Centered Data Xc (value = raw − mean)',mX,8)
        p.fill(130);p.textSize(10);p.text(dC+' '+(isZh?'个细胞':'cells')+' × '+dG+' '+(isZh?'个基因':'genes'),mX,28)
        const mxA=Math.max(...centered.slice(0,dC).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dC;i++){for(let j=0;j<dG;j++){
          const v=centered[i][j], n=v/mxA
          const isSel = selGeneCol === j
          if(isSel){p.fill(255,165,0,230);p.stroke(200,120,0);p.strokeWeight(1.5)}
          else if(n>=0){p.fill(66,133,244,n*200+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*200+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(mX+j*cSz,mY+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.fill(80);p.textSize(7);p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dC;i++){const[r,g,b]=gc(cellTypes[i]);p.fill(r,g,b);p.text(cellTypes[i].substring(0,4),mX-3,mY+i*cSz+cSz/2)}
        p.fill(60);p.textSize(7);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<dG;j++){
          const isSel = selGeneCol === j
          p.fill(isSel ? 255 : 60, isSel ? 165 : 60, isSel ? 0 : 60)
          p.push();p.translate(mX+j*cSz+cSz/2,mY+dC*cSz+2);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()
        }
        // Bar chart for selected gene
        const bx = mX+dG*cSz+15, by = mY, bw = 180, bh = dC*10
        if(selGeneCol !== null && selGeneCol < dG) {
          p.fill(50);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
          p.text(geneNames[selGeneCol]+' '+(isZh?'表达分布':'expression'),bx,by-15)
          const vals = centered.map((r: number[])=>r[selGeneCol])
          const mxV = Math.max(...vals.map(Math.abs))||1
          for(let i=0;i<dC;i++){
            const barW = (vals[i]/mxV)*80
            const[cr,cg,cb]=gc(cellTypes[i])
            p.fill(cr,cg,cb,180);p.noStroke()
            if(barW>=0) p.rect(bx+85,by+i*10,barW,8,1)
            else p.rect(bx+85+barW,by+i*10,-barW,8,1)
          }
          // Zero line
          p.stroke(150);p.strokeWeight(1);p.line(bx+85,by,bx+85,by+dC*10)
          p.noStroke();p.fill(100);p.textSize(7);p.textAlign(p.LEFT,p.CENTER)
          for(let i=0;i<dC;i++) p.text(cellTypes[i].substring(0,3),bx,by+i*10+4)
        } else {
          p.fill(150);p.textSize(9);p.textAlign(p.LEFT,p.TOP)
          p.text(isZh?'点击上方基因列查看分布':'Click a gene column',bx,by)
        }
      }
      p.mousePressed=()=>{
        const gx = Math.floor((p.mouseX-mX)/cSz)
        if(gx>=0&&gx<dG){setSelGeneCol(gx===selGeneCol?null:gx)}
      }
    }
    mk('s3m', s3MatRef.current, sk)
    return () => rm('s3m')
  }, [activeStep, s3Sub, selGeneCol, pca, geneNames, cellTypes, nC, nG, isZh])

  // ── Step 3-B: Covariance computation (Xc^T × Xc) ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 1 || !s3CovRef.current) return
    const centered = pca.centered, cov = pca.cov
    const dG2 = Math.min(nG, 7), dC2 = Math.min(nC, 10)
    const cSz = 20
    const innerGap = 42
    const marginTop = 55
    const marginLeft = 45
    const marginRight = 45
    const marginBottom = 45
    const panelGap = 24
    const panelH = 110

    const xctW = dC2 * cSz
    const xctH = dG2 * cSz
    const xcW = dG2 * cSz
    const xcH = dC2 * cSz
    const sigmaW = dG2 * cSz
    const sigmaH = dG2 * cSz

    const xctX = marginLeft
    const xctTimesX = xctX + xctW + innerGap
    const xcX = xctTimesX + innerGap
    const xcEqX = xcX + xcW + innerGap
    const sigmaX = xcEqX + innerGap

    const blockH = Math.max(xctH, xcH, sigmaH)
    const baseY = marginTop + 18
    const totalW = sigmaX + sigmaW + marginRight
    const totalH = baseY + blockH + panelGap + panelH + marginBottom

    const sk = (p: any) => {
      p.setup = () => { p.createCanvas(totalW, totalH).parent(s3CovRef.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)

        const xctY = baseY + (blockH - xctH) / 2
        const xcY = baseY + (blockH - xcH) / 2
        const sigmaY = baseY + (blockH - sigmaH) / 2

        // 1) Names above
        p.fill(80); p.textSize(11); p.textAlign(p.CENTER, p.BOTTOM)
        p.text('Xc\u1D40', xctX + xctW / 2, xctY - 6)
        p.text('Xc', xcX + xcW / 2, xcY - 6)
        p.text('\u03A3', sigmaX + sigmaW / 2, sigmaY - 6)

        // 2) Symbols centered
        const symY = baseY + blockH / 2
        p.fill(60); p.textSize(18); p.textAlign(p.CENTER, p.CENTER)
        p.text('\u00D7', xctTimesX, symY)
        p.text('=', xcEqX, symY)

        // 3) Xcᵀ matrix
        const mxA = Math.max(...centered.slice(0, dC2).map((r: number[]) => r.slice(0, dG2).map(Math.abs)).flat()) || 1
        for (let i = 0; i < dG2; i++) {
          for (let j = 0; j < dC2; j++) {
            const v = centered[j][i], n = v / mxA
            const hiRow = selCov && i === selCov.j
            if (hiRow) { p.fill(255, 165, 0, 220); p.stroke(200, 120, 0); p.strokeWeight(1.5) }
            else if (n >= 0) { p.fill(66, 133, 244, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            p.rect(xctX + j * cSz, xctY + i * cSz, cSz, cSz)
          }
        }
        p.noStroke(); p.textSize(7); p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i < dG2; i++) {
          const hi = selCov && i === selCov.j; p.fill(hi ? [255, 165, 0] : [80, 80, 80])
          p.text(geneNames[i], xctX - 4, xctY + i * cSz + cSz / 2)
        }
        p.textAlign(p.CENTER, p.TOP); p.fill(120); p.textSize(6)
        for (let j = 0; j < dC2; j++) p.text('c' + j, xctX + j * cSz + cSz / 2, xctY + xctH + 2)

        // 4) Xc matrix
        for (let i = 0; i < dC2; i++) {
          for (let j = 0; j < dG2; j++) {
            const v = centered[i][j], n = v / mxA
            const hiCol = selCov && j === selCov.k
            if (hiCol) { p.fill(0, 200, 100, 220); p.stroke(0, 150, 80); p.strokeWeight(1.5) }
            else if (n >= 0) { p.fill(66, 133, 244, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            p.rect(xcX + j * cSz, xcY + i * cSz, cSz, cSz)
          }
        }
        p.noStroke(); p.textSize(7); p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i < dC2; i++) { const [r, g, b] = gc(cellTypes[i]); p.fill(r, g, b); p.text(cellTypes[i].substring(0, 3), xcX - 4, xcY + i * cSz + cSz / 2) }
        p.textAlign(p.CENTER, p.TOP)
        for (let j = 0; j < dG2; j++) {
          const hi = selCov && j === selCov.k; p.fill(hi ? [0, 200, 100] : [60, 60, 60])
          p.push(); p.translate(xcX + j * cSz + cSz / 2, xcY + xcH + 2); p.rotate(-Math.PI / 4); p.text(geneNames[j], 0, 0); p.pop()
        }

        // 5) Σ matrix
        const cMx = Math.max(...cov.slice(0, dG2).map((r: number[]) => r.slice(0, dG2).map(Math.abs)).flat()) || 1
        for (let i = 0; i < dG2; i++) {
          for (let j = 0; j < dG2; j++) {
            const v = cov[i][j], n = v / cMx
            const isSel = selCov && i === selCov.j && j === selCov.k
            if (isSel) { p.fill(255, 165, 0, 255); p.stroke(200, 120, 0); p.strokeWeight(2) }
            else if (n >= 0) { p.fill(66, 133, 244, n * 180 + 55); p.stroke(255); p.strokeWeight(0.5) }
            else { p.fill(234, 67, 53, -n * 180 + 55); p.stroke(255); p.strokeWeight(0.5) }
            p.rect(sigmaX + j * cSz, sigmaY + i * cSz, cSz, cSz)
          }
        }
        p.noStroke(); p.textSize(7)
        p.textAlign(p.RIGHT, p.CENTER); for (let i = 0; i < dG2; i++) p.text(geneNames[i], sigmaX - 4, sigmaY + i * cSz + cSz / 2)
        p.textAlign(p.CENTER, p.TOP)
        for (let j = 0; j < dG2; j++) { p.push(); p.translate(sigmaX + j * cSz + cSz / 2, sigmaY + sigmaH + 2); p.rotate(-Math.PI / 4); p.text(geneNames[j], 0, 0); p.pop() }

        // 6) Detail panel (below)
        const panelX = xctX
        const panelY = baseY + blockH + panelGap
        const panelW = sigmaX + sigmaW - xctX

        if (selCov) {
          const { j, k } = selCov
          const colJ = centered.map((r: number[]) => r[j]), colK = centered.map((r: number[]) => r[k])
          const dp = colJ.reduce((s: number, v: number, i: number) => s + v * colK[i], 0)
          const cv = dp / (nC - 1)

          p.fill(255, 248, 240); p.stroke(255, 165, 0, 150); p.strokeWeight(1.5); p.rect(panelX, panelY, panelW, panelH, 10)
          p.noStroke()
          p.fill(180, 100, 0); p.textSize(11); p.textAlign(p.LEFT, p.TOP)
          p.text('\u03A3[' + geneNames[j] + ',' + geneNames[k] + '] ' + (isZh ? '计算过程' : 'calculation'), panelX + 12, panelY + 10)

          p.fill(60); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
          p.text('= 1/(n-1) \u00B7 Xc\u1D40[' + geneNames[j] + ',:] \u00B7 Xc[:,' + geneNames[k] + ']', panelX + 12, panelY + 28)

          const termH = 30; const termY = panelY + 48
          const itemW = Math.min(130, (panelW - 24) / Math.min(5, colJ.length))
          const nShow = Math.min(5, colJ.length)
          const totalItemsW = itemW * nShow
          const startX = panelX + (panelW - totalItemsW) / 2

          for (let idx = 0; idx < nShow; idx++) {
            const itemX = startX + idx * itemW
            const vj = colJ[idx], vk = colK[idx], prod = vj * vk
            p.fill(255); p.stroke(230); p.strokeWeight(1); p.rect(itemX + 3, termY, itemW - 6, termH, 6)
            p.noStroke(); p.fill(100); p.textSize(8); p.textAlign(p.CENTER, p.TOP)
            p.text('c' + idx, itemX + itemW / 2, termY + 3)
            p.fill(60); p.textSize(9); p.textAlign(p.CENTER, p.CENTER)
            p.text(vj.toFixed(2) + '\u00D7' + vk.toFixed(2) + '=' + prod.toFixed(2), itemX + itemW / 2, termY + termH / 2 + 2)
          }
          if (colJ.length > 5) {
            p.fill(120); p.textSize(9); p.textAlign(p.LEFT, p.CENTER)
            p.text('...', startX + totalItemsW + 4, termY + termH / 2)
          }

          const sumY = termY + termH + 8
          p.stroke(200); p.strokeWeight(1); p.line(panelX + 16, sumY, panelX + panelW - 16, sumY)
          p.noStroke(); p.fill('#059669'); p.textSize(11); p.textAlign(p.CENTER, p.TOP)
          p.text((isZh ? '总和 = ' : 'Sum = ') + dp.toFixed(3) + ' / ' + (nC - 1) + ' = ' + cv.toFixed(4), panelX + panelW / 2, sumY + 6)

          // Legend
          p.fill(255, 165, 0); p.rect(panelX + 12, panelY + panelH - 22, 10, 10, 2)
          p.fill(80); p.textSize(8); p.textAlign(p.LEFT, p.TOP)
          p.text(geneNames[j] + ' row', panelX + 26, panelY + panelH - 21)
          p.fill(0, 200, 100); p.rect(panelX + 100, panelY + panelH - 22, 10, 10, 2)
          p.fill(80); p.text(geneNames[k] + ' col', panelX + 114, panelY + panelH - 21)
        } else {
          p.fill(245); p.stroke(230); p.strokeWeight(1); p.rect(panelX, panelY, panelW, panelH, 10)
          p.noStroke(); p.fill(180); p.textSize(11); p.textAlign(p.CENTER, p.CENTER)
          p.text(isZh ? '点击 \u03A3 矩阵的任意元素查看协方差计算' : 'Click any element in \u03A3 matrix to see covariance calculation', panelX + panelW / 2, panelY + panelH / 2)
        }

        // Title
        p.fill(50); p.noStroke(); p.textSize(13); p.textAlign(p.LEFT, p.TOP)
        p.text(isZh ? '协方差计算' : 'Covariance Computation', marginLeft, 10)
        p.fill(130); p.textSize(10)
        p.text(isZh ? '点击 \u03A3 元素，观察对应行/列的计算关系' : 'Click \u03A3 element to see row/column relationship', marginLeft, 28)

        // Formula
        p.fill(245, 248, 255); p.stroke(200, 215, 255); p.strokeWeight(1); p.rect(marginLeft, 42, 220, 22, 4)
        p.noStroke(); p.fill(60, 80, 140); p.textSize(11); p.textAlign(p.LEFT, p.TOP)
        p.text('\u03A3 = 1/(n-1) \u00B7 Xc\u1D40 \u00B7 Xc', marginLeft + 8, 45)
      }

      p.mousePressed = () => {
        const sigmaY = baseY + (blockH - sigmaH) / 2
        const gx = Math.floor((p.mouseX - sigmaX) / cSz)
        const gy = Math.floor((p.mouseY - sigmaY) / cSz)
        if (gx >= 0 && gx < dG2 && gy >= 0 && gy < dG2) { setSelCov({ j: gy, k: gx }); p.redraw() }
        else { setSelCov(null); p.redraw() }
      }
    }
    mk('s3c', s3CovRef.current, sk)
    return () => rm('s3c')
  }, [activeStep, s3Sub, selCov, pca, geneNames, cellTypes, nC, nG, isZh])
  // ── Step 3-C: Eigendecomposition ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 2 || !s3EigenRef.current) return
    const cSz = 20
    const nPC2 = Math.min(4, dG)
    const piResult = powerIterSteps(pca.cov, eigenStep)
    const vec = piResult.eigenvector, lambda = piResult.eigenval
    const innerGap = 42
    const marginTop = 55
    const marginLeft = 40
    const marginRight = 40
    const marginBottom = 45
    const panelGap = 24
    const panelH = 110

    const sigmaW = dG * cSz
    const sigmaH = dG * cSz
    const vecW = Math.round(cSz * 2.4)
    const vecH = dG * cSz
    const svW = vecW
    const svH = dG * cSz
    const lambdaBadgeW = 52
    const lambdaBadgeH = 26
    const v2W = vecW
    const v2H = dG * cSz
    const evW = nPC2 * (cSz + 2)
    const evH = dG * cSz

    const sigmaX = marginLeft
    const times1X = sigmaX + sigmaW + innerGap
    const vecX = times1X + innerGap
    const eq1X = vecX + vecW + innerGap
    const svX = eq1X + innerGap
    const approxX = svX + svW + innerGap
    const lambdaX = approxX + innerGap
    const times2X = lambdaX + lambdaBadgeW + innerGap
    const v2X = times2X + innerGap
    const evX = v2X + v2W + innerGap + 20

    const leftBlockW = evX + evW - sigmaX
    const totalW = leftBlockW + marginRight
    const blockH = Math.max(sigmaH, vecH, svH, v2H, evH)
    const baseY = marginTop + 38
    const totalH = baseY + blockH + panelGap + panelH + marginBottom

    const sk = (p: any) => {
      p.setup = () => { p.createCanvas(totalW, totalH).parent(s3EigenRef.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)

        const sigmaY = baseY + (blockH - sigmaH) / 2
        const vecY = baseY + (blockH - vecH) / 2
        const svY = baseY + (blockH - svH) / 2
        const lambdaY = baseY + (blockH - lambdaBadgeH) / 2
        const v2Y = baseY + (blockH - v2H) / 2
        const evY = baseY + (blockH - evH) / 2

        // 1) Names above
        p.fill(80); p.textSize(11); p.textAlign(p.CENTER, p.BOTTOM)
        p.text('\u03A3', sigmaX + sigmaW / 2, sigmaY - 6)
        p.text('v', vecX + vecW / 2, vecY - 6)
        p.text('\u03A3v', svX + svW / 2, svY - 6)
        p.text('\u03BB', lambdaX + lambdaBadgeW / 2, lambdaY - 6)
        p.text('v', v2X + v2W / 2, v2Y - 6)
        p.text(isZh ? '特征向量 V' : 'Eigenvectors V', evX + evW / 2, evY - 6)

        // 2) Symbols
        const symY = baseY + blockH / 2
        p.fill(60); p.textSize(18); p.textAlign(p.CENTER, p.CENTER)
        p.text('\u00D7', times1X, symY)
        p.text('=', eq1X, symY)
        p.text('\u2248', approxX, symY)
        p.text('\u00D7', times2X, symY)

        // 3) PC selector
        p.fill(60); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
        p.text(isZh ? '主成分:' : 'PC:', marginLeft, 14)
        for (let pc = 0; pc < nPC2; pc++) {
          const bx = marginLeft + 50 + pc * 54, by = 10, bw = 46, bh = 22
          const isActive = selPC === pc
          if (isActive) { p.fill(139, 92, 246); p.stroke(100, 60, 200); p.strokeWeight(2) }
          else { p.fill(245); p.stroke(200); p.strokeWeight(1) }
          p.rect(bx, by, bw, bh, 4)
          p.noStroke(); p.fill(isActive ? 255 : 80); p.textSize(10); p.textAlign(p.CENTER, p.CENTER)
          p.text('PC' + (pc + 1), bx + bw / 2, by + bh / 2)
        }
        p.fill(80); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
        p.text(isZh ? '迭代:' : 'Iter:', marginLeft + 50 + nPC2 * 54 + 15, 14)
        p.fill(60); p.textSize(10)
        p.text(eigenStep, marginLeft + 50 + nPC2 * 54 + 55, 14)

        // Column labels
        p.textSize(6); p.textAlign(p.CENTER, p.TOP)
        for (let j = 0; j < dG; j++) { p.push(); p.translate(sigmaX + j * cSz + cSz / 2, sigmaY - 8); p.rotate(-Math.PI / 4); p.text(geneNames[j], 0, 0); p.pop() }

        // 4) Σ matrix
        const cMx = Math.max(...pca.cov.slice(0, dG).map((r: number[]) => r.slice(0, dG).map(Math.abs)).flat()) || 1
        for (let i = 0; i < dG; i++) {
          for (let j = 0; j < dG; j++) {
            const v = pca.cov[i][j], n = Math.abs(v) / cMx
            if (n >= 0) { p.fill(66, 133, 244, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            p.rect(sigmaX + j * cSz, sigmaY + i * cSz, cSz, cSz)
          }
        }
        p.noStroke(); p.textSize(7); p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i < dG; i++) p.text(geneNames[i], sigmaX - 4, sigmaY + i * cSz + cSz / 2)

        // 5) v vector
        const vecMx = Math.max(...vec.map(Math.abs)) || 1
        for (let i = 0; i < dG; i++) {
          const val = vec[i], n = Math.abs(val) / vecMx
          if (n >= 0) { p.fill(139, 92, 246, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
          else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
          p.rect(vecX, vecY + i * cSz, vecW, cSz)
          p.noStroke(); p.fill(n > 0.3 ? 255 : 100); p.textSize(8); p.textAlign(p.CENTER, p.CENTER)
          p.text(val.toFixed(3), vecX + vecW / 2, vecY + i * cSz + cSz / 2)
        }

        // 6) Σv vector
        const sigmaV = Array(dG).fill(0)
        for (let i = 0; i < dG; i++) for (let j = 0; j < dG; j++) sigmaV[i] += pca.cov[i][j] * vec[j]
        const svMx = Math.max(...sigmaV.map(Math.abs)) || 1
        for (let i = 0; i < dG; i++) {
          const val = sigmaV[i], n = Math.abs(val) / svMx
          if (n >= 0) { p.fill(16, 185, 129, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
          else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
          p.rect(svX, svY + i * cSz, svW, cSz)
          p.noStroke(); p.fill(n > 0.3 ? 255 : 100); p.textSize(8); p.textAlign(p.CENTER, p.CENTER)
          p.text(val.toFixed(3), svX + svW / 2, svY + i * cSz + cSz / 2)
        }

        // 7) λ badge
        p.fill(245, 158, 11, 245); p.stroke(200, 120, 0); p.strokeWeight(1.5); p.rect(lambdaX, lambdaY, lambdaBadgeW, lambdaBadgeH, 5)
        p.noStroke(); p.fill(255); p.textSize(12); p.textAlign(p.CENTER, p.CENTER)
        p.text(lambda.toFixed(4), lambdaX + lambdaBadgeW / 2, lambdaY + lambdaBadgeH / 2)

        // 8) v2 vector (same values as v, amber color)
        for (let i = 0; i < dG; i++) {
          const val = vec[i], n = Math.abs(val) / vecMx
          if (n >= 0) { p.fill(245, 158, 11, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
          else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
          p.rect(v2X, v2Y + i * cSz, v2W, cSz)
          p.noStroke(); p.fill(n > 0.3 ? 255 : 100); p.textSize(8); p.textAlign(p.CENTER, p.CENTER)
          p.text(val.toFixed(3), v2X + v2W / 2, v2Y + i * cSz + cSz / 2)
        }

        // 9) Eigenvectors V
        const evecs = pca.evecs
        const evMx = Math.max(...evecs.slice(0, nPC2).map((r: number[]) => r.map(Math.abs)).flat()) || 1
        for (let pc = 0; pc < nPC2; pc++) {
          for (let i = 0; i < dG; i++) {
            const v = evecs[pc][i], n = Math.abs(v) / evMx
            const isSel = pc === selPC
            if (isSel) { p.fill(139, 92, 246, n > 0.3 ? 255 : 100); p.stroke(100, 60, 200); p.strokeWeight(1.5) }
            else { if (n >= 0) { p.fill(66, 133, 244, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) } else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) } }
            p.rect(evX + pc * (cSz + 2), evY + i * cSz, cSz, cSz)
          }
        }
        p.noStroke()
        for (let pc = 0; pc < nPC2; pc++) {
          p.fill(pc === selPC ? 139 : 120, pc === selPC ? 92 : 120, pc === selPC ? 246 : 120)
          p.textSize(pc === selPC ? 9 : 7); p.textAlign(p.CENTER, p.TOP)
          p.text('PC' + (pc + 1), evX + pc * (cSz + 2) + cSz / 2, evY + evH + 4)
        }
        p.textAlign(p.RIGHT, p.CENTER); p.fill(80); p.textSize(7)
        for (let i = 0; i < dG; i++) p.text(geneNames[i], evX - 5, evY + i * cSz + cSz / 2)

        // 10) Convergence info panel (below)
        const panelX = sigmaX
        const panelY = baseY + blockH + panelGap
        const panelW = evX + evW - sigmaX

        p.fill(245, 248, 255); p.stroke(200, 215, 255); p.strokeWeight(1); p.rect(panelX, panelY, panelW, panelH, 10)
        p.noStroke(); p.fill(60, 80, 140); p.textSize(11); p.textAlign(p.LEFT, p.TOP)
        p.text(isZh ?
          'PC' + (selPC + 1) + ': \u03BB = ' + lambda.toFixed(5) + ' | \u03A3v' + (selPC + 1) + ' \u2248 \u03BB\u00B7v' + (selPC + 1) + ' (' + eigenStep + ' iter)' :
          'PC' + (selPC + 1) + ': \u03BB = ' + lambda.toFixed(5) + ' | \u03A3v' + (selPC + 1) + ' \u2248 \u03BB\u00B7v' + (selPC + 1) + ' (' + eigenStep + ' iter)',
          panelX + 12, panelY + 12)

        // Show Σv vs λv comparison as mini vectors
        const compY = panelY + 44
        const compItemW = Math.min(100, (panelW - 40) / dG)
        const compTotalW = compItemW * dG
        const compStartX = panelX + (panelW - compTotalW) / 2

        p.fill(80); p.textSize(9); p.textAlign(p.CENTER, p.BOTTOM)
        p.text('\u03A3v', compStartX - 28, compY + 18)
        p.text('\u03BBv', compStartX - 28, compY + 46)

        for (let i = 0; i < dG; i++) {
          const x = compStartX + i * compItemW
          // Σv bar
          const svVal = sigmaV[i]
          const svN = Math.min(1, Math.abs(svVal) / (svMx || 1))
          p.fill(16, 185, 129, 180); p.noStroke(); p.rect(x + 2, compY, (compItemW - 4) * svN, 14, 3)
          p.fill(60); p.textSize(8); p.textAlign(p.CENTER, p.CENTER)
          p.text(svVal.toFixed(2), x + compItemW / 2, compY + 7)

          // λv bar
          const lvVal = lambda * vec[i]
          const lvN = Math.min(1, Math.abs(lvVal) / (Math.max(...sigmaV.map(Math.abs)) || 1))
          p.fill(245, 158, 11, 180); p.noStroke(); p.rect(x + 2, compY + 20, (compItemW - 4) * lvN, 14, 3)
          p.fill(60); p.textSize(8); p.textAlign(p.CENTER, p.CENTER)
          p.text(lvVal.toFixed(2), x + compItemW / 2, compY + 27)
        }
      }

      p.mousePressed = () => {
        for (let pc = 0; pc < nPC2; pc++) {
          const bx = marginLeft + 50 + pc * 54, by = 10, bw = 46, bh = 22
          if (p.mouseX >= bx && p.mouseX <= bx + bw && p.mouseY >= by && p.mouseY <= by + bh) { setSelPC(pc); p.redraw(); return }
        }
        const evY = baseY + (blockH - evH) / 2
        const evCol = Math.floor((p.mouseX - evX) / (cSz + 2))
        const evRow = Math.floor((p.mouseY - evY) / cSz)
        if (evCol >= 0 && evCol < nPC2 && evRow >= 0 && evRow < dG) { setSelPC(evCol); p.redraw(); return }
      }
    }
    mk('s3e', s3EigenRef.current, sk)
    return () => rm('s3e')
  }, [activeStep, s3Sub, selPC, eigenStep, pca, geneNames, nG, dG, isZh])
  // ── Step 3-D: Projection ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 3 || !s3ProjRef.current) return
    const cSz = 22
    const nPC2 = Math.min(4, dG)
    const innerGap = 42
    const marginTop = 55
    const marginLeft = 20
    const marginRight = 20
    const marginBottom = 45
    const panelGap = 24
    const panelH = 110

    const m1W = dG * cSz
    const m1H = dC * cSz
    const m2W = nPC2 * cSz
    const m2H = dG * cSz
    const m3W = nPC2 * cSz
    const m3H = dC * cSz

    const m1x = marginLeft
    const timesX = m1x + m1W + innerGap
    const m2x = timesX + innerGap
    const eqX = m2x + m2W + innerGap
    const m3x = eqX + innerGap

    const blockH = Math.max(m1H, m2H, m3H)
    const baseY = marginTop + 18
    const totalW = m3x + m3W + marginRight
    const totalH = baseY + blockH + panelGap + panelH + marginBottom

    const sk = (p: any) => {
      p.setup = () => { p.createCanvas(totalW, totalH).parent(s3ProjRef.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)

        const m1y = baseY + (blockH - m1H) / 2
        const m2y = baseY + (blockH - m2H) / 2
        const m3y = baseY + (blockH - m3H) / 2

        // 1) Names above
        p.fill(80); p.textSize(11); p.textAlign(p.CENTER, p.BOTTOM)
        p.text('Xc', m1x + m1W / 2, m1y - 6)
        p.text('W', m2x + m2W / 2, m2y - 6)
        p.text('Y', m3x + m3W / 2, m3y - 6)

        // 2) Symbols
        const symY = baseY + blockH / 2
        p.fill(60); p.textSize(18); p.textAlign(p.CENTER, p.CENTER)
        p.text('\u00D7', timesX, symY)
        p.text('=', eqX, symY)

        // 3) Xc matrix
        const mxA = Math.max(...pca.centered.slice(0, dC).map((r: number[]) => r.slice(0, dG).map(Math.abs)).flat()) || 1
        for (let i = 0; i < dC; i++) {
          for (let j = 0; j < dG; j++) {
            const v = pca.centered[i][j], n = v / mxA
            const hiRow = selProj && i === selProj.i
            if (hiRow) { p.fill(255, 165, 0, 200); p.stroke(200, 120, 0); p.strokeWeight(1.5) }
            else if (n >= 0) { p.fill(66, 133, 244, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            p.rect(m1x + j * cSz, m1y + i * cSz, cSz, cSz)
          }
        }
        p.noStroke(); p.textSize(7); p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i < dC; i++) { const [r, g, b] = gc(cellTypes[i]); p.fill(r, g, b); p.text(cellTypes[i].substring(0, 3), m1x - 4, m1y + i * cSz + cSz / 2) }
        p.textAlign(p.CENTER, p.TOP); p.fill(120); p.textSize(6)
        for (let j = 0; j < dG; j++) { p.push(); p.translate(m1x + j * cSz + cSz / 2, m1y + m1H + 2); p.rotate(-Math.PI / 4); p.text(geneNames[j], 0, 0); p.pop() }

        // 4) W matrix
        const evMx = Math.max(...pca.evecs.slice(0, nPC2).map((r: number[]) => r.map(Math.abs)).flat()) || 1
        for (let i = 0; i < dG; i++) {
          for (let j = 0; j < nPC2; j++) {
            const v = pca.evecs[j][i], n = v / evMx
            const hiCol = selProj && j === selProj.j
            if (hiCol) { p.fill(139, 92, 246, 220); p.stroke(100, 60, 200); p.strokeWeight(1.5) }
            else if (n >= 0) { p.fill(139, 92, 246, n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            else { p.fill(234, 67, 53, -n * 150 + 55); p.stroke(255); p.strokeWeight(0.5) }
            p.rect(m2x + j * cSz, m2y + i * cSz, cSz, cSz)
          }
        }
        p.noStroke(); p.textSize(7); p.textAlign(p.CENTER, p.TOP)
        for (let j = 0; j < nPC2; j++) p.text('PC' + (j + 1), m2x + j * cSz + cSz / 2, m2y + m2H + 2)
        p.textAlign(p.RIGHT, p.CENTER); p.fill(80)
        for (let i = 0; i < dG; i++) p.text(geneNames[i], m2x - 4, m2y + i * cSz + cSz / 2)

        // 5) Y matrix
        const yMx = Math.max(...pcaProjected.slice(0, dC).map((r: number[]) => r.slice(0, nPC2).map(Math.abs)).flat()) || 1
        for (let i = 0; i < dC; i++) {
          for (let j = 0; j < nPC2; j++) {
            const v = pcaProjected[i][j], n = v / yMx
            const isSel = selProj && i === selProj.i && j === selProj.j
            if (isSel) { p.fill(245, 158, 11, 255); p.stroke(200, 120, 0); p.strokeWeight(2) }
            else if (n >= 0) { p.fill(16, 185, 129, n * 200 + 55); p.stroke(255); p.strokeWeight(0.5) }
            else { p.fill(234, 67, 53, -n * 200 + 55); p.stroke(255); p.strokeWeight(0.5) }
            p.rect(m3x + j * cSz, m3y + i * cSz, cSz, cSz)
          }
        }
        p.noStroke(); p.textSize(7); p.textAlign(p.CENTER, p.TOP)
        for (let j = 0; j < nPC2; j++) p.text('PC' + (j + 1), m3x + j * cSz + cSz / 2, m3y + m3H + 2)
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i < dC; i++) { const [r, g, b] = gc(cellTypes[i]); p.fill(r, g, b); p.text(cellTypes[i].substring(0, 3), m3x - 4, m3y + i * cSz + cSz / 2) }

        // Title
        p.fill(50); p.noStroke(); p.textSize(13); p.textAlign(p.LEFT, p.TOP)
        p.text(isZh ? '投影: Y = Xc \u00B7 W' : 'Projection: Y = Xc \u00B7 W', marginLeft, 10)
        p.fill(130); p.textSize(10)
        p.text(isZh ? '点击 Y 矩阵元素查看向量相乘过程' : 'Click Y matrix element to see vector multiplication', marginLeft, 28)

        // Formula reference
        const fx = m3x + m3W + 12
        if (fx + 150 < totalW) {
          p.fill(245, 248, 255); p.stroke(200, 215, 255); p.strokeWeight(1); p.rect(fx, 10, 150, 22, 4)
          p.noStroke(); p.fill(60, 80, 140); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
          p.text('Y[i,j] = Xc[i,:] \u00B7 W[:,j]', fx + 8, 14)
        }

        // 6) Detail panel (below)
        const panelX = m1x
        const panelY = baseY + blockH + panelGap
        const panelW = m3x + m3W - m1x

        if (selProj) {
          const { i: si, j: sj } = selProj
          const rowI = pca.centered[si]
          const colJ = pca.evecs[sj]
          const dp = rowI.reduce((s: number, v: number, k: number) => s + v * colJ[k], 0)

          p.fill(255, 248, 240); p.stroke(245, 158, 11, 150); p.strokeWeight(1.5); p.rect(panelX, panelY, panelW, panelH, 10)
          p.noStroke()
          p.fill(180, 100, 0); p.textSize(11); p.textAlign(p.LEFT, p.TOP)
          const cellLabel = cellTypes[si] + '-' + (si + 1)
          p.text('Y[' + cellLabel + ',PC' + (sj + 1) + '] ' + (isZh ? '计算过程' : 'calculation'), panelX + 12, panelY + 10)

          p.fill(60); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
          p.text('= Xc[' + cellLabel + ',:] \u00B7 W[:,PC' + (sj + 1) + ']', panelX + 12, panelY + 28)

          const termH = 30; const termY = panelY + 48
          const nShow = Math.min(5, rowI.length)
          const itemW = Math.min(130, (panelW - 24) / nShow)
          const totalItemsW = itemW * nShow
          const startX = panelX + (panelW - totalItemsW) / 2

          for (let idx = 0; idx < nShow; idx++) {
            const itemX = startX + idx * itemW
            const rv = rowI[idx], cv = colJ[idx], prod = rv * cv
            p.fill(255); p.stroke(230); p.strokeWeight(1); p.rect(itemX + 3, termY, itemW - 6, termH, 6)
            p.noStroke(); p.fill(100); p.textSize(8); p.textAlign(p.CENTER, p.TOP)
            p.text(geneNames[idx], itemX + itemW / 2, termY + 3)
            p.fill(60); p.textSize(9); p.textAlign(p.CENTER, p.CENTER)
            p.text(rv.toFixed(2) + '\u00D7' + cv.toFixed(2) + '=' + prod.toFixed(2), itemX + itemW / 2, termY + termH / 2 + 2)
          }
          if (rowI.length > 5) {
            p.fill(120); p.textSize(9); p.textAlign(p.LEFT, p.CENTER)
            p.text('...', startX + totalItemsW + 4, termY + termH / 2)
          }

          const sumY = termY + termH + 8
          p.stroke(200); p.strokeWeight(1); p.line(panelX + 16, sumY, panelX + panelW - 16, sumY)
          p.noStroke(); p.fill('#059669'); p.textSize(11); p.textAlign(p.CENTER, p.TOP)
          p.text('= ' + dp.toFixed(4), panelX + panelW / 2, sumY + 6)

          // Legend
          p.fill(255, 165, 0); p.rect(panelX + 12, panelY + panelH - 22, 10, 10, 2)
          p.fill(80); p.textSize(8); p.textAlign(p.LEFT, p.TOP)
          p.text('Xc[' + cellLabel + ',:]', panelX + 26, panelY + panelH - 21)
          p.fill(139, 92, 246); p.rect(panelX + 130, panelY + panelH - 22, 10, 10, 2)
          p.fill(80); p.text('W[:,PC' + (sj + 1) + ']', panelX + 144, panelY + panelH - 21)
        } else {
          p.fill(245); p.stroke(230); p.strokeWeight(1); p.rect(panelX, panelY, panelW, panelH, 10)
          p.noStroke(); p.fill(180); p.textSize(11); p.textAlign(p.CENTER, p.CENTER)
          p.text(isZh ? '点击 Y 矩阵的任意元素查看投影计算' : 'Click any element in Y matrix to see projection calculation', panelX + panelW / 2, panelY + panelH / 2)
        }
      }

      p.mousePressed = () => {
        const m3y = baseY + (blockH - m3H) / 2
        const gx = Math.floor((p.mouseX - m3x) / cSz)
        const gy = Math.floor((p.mouseY - m3y) / cSz)
        if (gx >= 0 && gx < nPC2 && gy >= 0 && gy < dC) { setSelProj({ i: gy, j: gx }); p.redraw() }
        else { setSelProj(null); p.redraw() }
      }
    }
    mk('s3p', s3ProjRef.current, sk)
    return () => rm('s3p')
  }, [activeStep, s3Sub, selProj, pca, geneNames, cellTypes, nC, nG, nPC, isZh])
  // ── Step 4: Elbow + PC scatter ──
  useEffect(() => {
    if (activeStep !== 3 || !s4ERef.current) return
    const sk = (p: any) => {
      const W = 380, H = 340, M = { t: 40, r: 35, b: 65, l: 60 }, pw = W - M.l - M.r, ph = H - M.t - M.b, bW = pw / 10
      p.setup = () => { p.createCanvas(W, H).parent(s4ERef.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        const n = varexp.length
        const cv: number[] = []; varexp.reduce((a, v) => { cv.push(a + v); return a + v }, 0)

        // Grid lines (horizontal)
        p.stroke(235); p.strokeWeight(0.5)
        for (let i = 1; i <= 5; i++) {
          const gy = M.t + ph - ph * i / 5
          p.line(M.l, gy, M.l + pw, gy)
        }

        // Bars
        for (let i = 0; i < n; i++) {
          const bH = varexp[i] * ph, x = M.l + i * bW, y = M.t + ph - bH
          const isX = i === xPC, isY = i === yPC
          if (isX) p.fill(59, 130, 246, 220)
          else if (isY) p.fill(236, 72, 153, 220)
          else p.fill(139, 92, 246, 140)
          p.stroke(isX || isY ? (isX ? [59,130,246] : [236,72,153]) : [200,200,200]); p.strokeWeight(isX || isY ? 2.5 : 1)
          p.rect(x + 2, y, bW - 4, bH, 2, 2, 0, 0)
          p.noStroke(); p.fill(isX || isY ? 255 : 90); p.textSize(isX||isY?8:7)
          p.textAlign(p.CENTER, p.TOP)
          p.text('PC' + (i + 1), x + bW / 2, M.t + ph + 6)
        }

        // Cumulative line
        p.noFill(); p.stroke(234, 67, 53); p.strokeWeight(2); p.beginShape()
        for (let i = 0; i < n; i++) { const x = M.l + (i + 0.5) * bW, y = M.t + ph - cv[i] * ph; p.vertex(x, y) }
        p.endShape()
        // Cumulative dots
        p.fill(234, 67, 53); p.noStroke()
        for (let i = 0; i < n; i++) { const x = M.l + (i + 0.5) * bW, y = M.t + ph - cv[i] * ph; p.ellipse(x, y, 4, 4) }

        // Axes
        p.stroke(150); p.strokeWeight(1)
        p.line(M.l, M.t + ph, M.l + pw, M.t + ph)
        p.line(M.l, M.t, M.l, M.t + ph)

        // Y-axis ticks & labels (percentage)
        p.fill(120); p.textSize(8); p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 5; i++) {
          const y = M.t + ph - ph * i / 5
          p.stroke(200); p.strokeWeight(0.5)
          p.line(M.l - 3, y, M.l, y)
          p.noStroke()
          p.text((i * 20) + '%', M.l - 6, y)
        }

        // Axis labels
        p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        p.text(isZh ? '主成分' : 'Principal Component', M.l + pw / 2, M.t + ph + 22)
        p.push(); p.translate(18, M.t + ph / 2); p.rotate(-Math.PI / 2)
        p.text(isZh ? '方差解释率' : 'Variance Explained', 0, 0); p.pop()

        // Legend
        p.fill(59, 130, 246); p.noStroke(); p.ellipse(M.l + 5, M.t + 8, 7, 7)
        p.fill(80); p.textSize(8); p.textAlign(p.LEFT, p.CENTER); p.text(isZh ? '累积方差' : 'Cumulative', M.l + 13, M.t + 8)

        // Selected labels (top-right)
        p.fill(59, 130, 246); p.textSize(9); p.textAlign(p.LEFT, p.TOP)
        p.text('PC' + (xPC + 1) + ': ' + (varexp[xPC] * 100).toFixed(1) + '%', M.l + pw - 78, M.t + 4)
        p.fill(236, 72, 153)
        p.text('PC' + (yPC + 1) + ': ' + (varexp[yPC] * 100).toFixed(1) + '%', M.l + pw - 78, M.t + 20)
      }
      p.mousePressed = () => {
        const n = varexp.length, bW = pw / n, ph = H - M.t - M.b
        const mx = p.mouseX - M.l, my = p.mouseY - M.t
        if (mx >= 0 && mx < pw && my >= 0 && my <= ph) {
          const clickedPC = Math.min(Math.floor(mx / bW), n - 1)
          const barTop = M.t + ph - varexp[clickedPC] * ph
          if (p.mouseY < barTop + ph / 2) { setXPC(clickedPC); if (clickedPC === yPC) setYPC(Math.min(yPC + 1, n - 1)) }
          else { setYPC(clickedPC); if (clickedPC === xPC) setXPC(Math.min(xPC + 1, n - 1)) }
          p.redraw()
        }
      }
    }
    mk('s4e', s4ERef.current, sk)
    return () => rm('s4e')
  }, [activeStep, xPC, yPC, varexp, isZh])

  useEffect(() => {
    if (activeStep !== 3 || !s4SRef.current) return
    const sk = (p: any) => {
      const W = 520, H = 400, M = { t: 40, r: 110, b: 55, l: 55 }, pw = W - M.l - M.r, ph = H - M.t - M.b
      let hov: number | null = null
      let zm_local = 1, px2 = 0, py2 = 0, pan = false, psx = 0, psy = 0, ppx_ = 0, ppy_ = 0

      const xs = pcaProjected.map((row: number[]) => row[xPC])
      const ys = pcaProjected.map((row: number[]) => row[yPC])
      let mnX = Math.min(...xs), mxX = Math.max(...xs) || 1
      let mnY = Math.min(...ys), mxY = Math.max(...ys) || 1
      const pdX = (mxX - mnX) * 0.05 || 0.5, pdY = (mxY - mnY) * 0.05 || 0.5
      mnX -= pdX; mxX += pdX; mnY -= pdY; mxY += pdY

      // Base screen coords (without zoom/pan)
      const rx = xs.map((v: number) => M.l + (v - mnX) / (mxX - mnX) * pw)
      const ry = ys.map((v: number) => M.t + ph - (v - mnY) / (mxY - mnY) * ph)

      // Transform with zoom/pan (center-based like Step 1)
      const ts = (a: number, b: number) => ({
        x: (a - pw / 2 - M.l) * zm_local + pw / 2 + M.l + px2,
        y: (b - ph / 2 - M.t) * zm_local + ph / 2 + M.t + py2
      })

      p.setup = () => { p.createCanvas(W, H).parent(s4SRef.current!); p.textFont('Inter'); p.noLoop() }

      p.draw = () => {
        p.background(255)

        // Grid
        p.stroke(235); p.strokeWeight(0.5)
        for (let i = 0; i <= 5; i++) {
          p.line(M.l + pw * i / 5, M.t, M.l + pw * i / 5, M.t + ph)
          p.line(M.l, M.t + ph * i / 5, M.l + pw, M.t + ph * i / 5)
        }

        // Axes
        p.noFill(); p.stroke(180); p.strokeWeight(1)
        p.rect(M.l, M.t, pw, ph)

        // Crosshair for hovered cell
        if (hov !== null && hov >= 0 && hov < nC) {
          const { x: hx, y: hy } = ts(rx[hov], ry[hov])
          p.stroke(200); p.strokeWeight(0.5)
          for (let d = M.t; d < hy - 5; d += 6) p.line(hx, d, hx, Math.min(d + 3, hy - 5))
          for (let d = hx + 5; d < M.l + pw; d += 6) p.line(d, hy, Math.min(d + 3, M.l + pw), hy)
        }

        // Cells
        const ut = Array.from(new Set(cellTypes))
        ut.forEach((t, tidx) => {
          const [r, g, b] = gc(t)
          const idxs = cellTypes.map((ct: string, i: number) => ct === t ? i : -1).filter((i: number) => i >= 0)
          idxs.forEach((i: number) => {
            const { x, y } = ts(rx[i], ry[i])
            if (x < M.l - 8 || x > M.l + pw + 8 || y < M.t - 8 || y > M.t + ph + 8) return
            const isSel = s4Sel === i
            const isH = hov === i
            if (isSel) { p.fill(r, g, b, 255); p.stroke(0); p.strokeWeight(1.5); p.ellipse(x, y, 12, 12) }
            else { p.fill(r, g, b, isH ? 220 : 160); p.noStroke(); p.ellipse(x, y, isH ? 10 : 8, isH ? 10 : 8) }
          })
        })

        // Axis tick labels
        p.fill(120); p.textSize(8); p.textAlign(p.CENTER, p.TOP)
        for (let i = 0; i <= 5; i++) p.text((mnX + (mxX - mnX) * i / 5).toFixed(1), M.l + pw * i / 5, M.t + ph + 2)
        p.textAlign(p.RIGHT, p.CENTER)
        for (let i = 0; i <= 5; i++) p.text((mnY + (mxY - mnY) * i / 5).toFixed(1), M.l - 4, M.t + ph - ph * i / 5)

        // Axis labels
        p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        p.text('PC' + (xPC + 1) + ' (' + (varexp[xPC] * 100).toFixed(1) + '%)', M.l + pw / 2, M.t + ph + 16)
        p.push(); p.translate(14, M.t + ph / 2); p.rotate(-Math.PI / 2)
        p.text('PC' + (yPC + 1) + ' (' + (varexp[yPC] * 100).toFixed(1) + '%)', 0, 0); p.pop()

        // Legend (right side)
        p.textSize(9); p.textAlign(p.LEFT, p.CENTER)
        ut.forEach((t, idx) => {
          const [r, g, b] = gc(t)
          const ly = M.t + 10 + idx * 16
          p.fill(r, g, b); p.noStroke(); p.ellipse(M.l + pw + 12, ly, 7, 7)
          p.fill(80); p.text(t, M.l + pw + 22, ly)
        })

        // Loading arrows
        const loadX = pca.evecs.slice(0, Math.min(10, nG)).map((vec: number[], pc: number) => ({ gene: geneNames[pc], load: vec[xPC] })).sort((a: any, b: any) => Math.abs(b.load) - Math.abs(a.load)).slice(0, 3)
        if (loadX.length) {
          p.fill(60); p.textSize(8); p.textAlign(p.LEFT, p.TOP)
          p.text(isZh ? 'X轴载荷:' : 'X loadings:', M.l + pw + 12, M.t + 10 + ut.length * 16 + 8)
          loadX.forEach((lg: any, i: number) => {
            const len = 18 * Math.abs(lg.load), x0 = M.l + pw + 14, y0 = M.t + 10 + ut.length * 16 + 22 + i * 18
            p.stroke(66, 133, 244); p.strokeWeight(1.5); p.line(x0, y0, x0 + len, y0)
            p.fill(80); p.textSize(7); p.text(lg.gene, x0 + len + 3, y0 - 3)
          })
        }
        const loadY = pca.evecs.slice(0, Math.min(10, nG)).map((vec: number[], pc: number) => ({ gene: geneNames[pc], load: vec[yPC] })).sort((a: any, b: any) => Math.abs(b.load) - Math.abs(a.load)).slice(0, 3)
        if (loadY.length) {
          p.fill(60); p.textSize(8); p.textAlign(p.LEFT, p.TOP)
          p.text(isZh ? 'Y轴载荷:' : 'Y loadings:', M.l + pw + 12, M.t + 10 + ut.length * 16 + 8 + (loadX.length ? loadX.length * 18 + 10 : 0))
          loadY.forEach((lg: any, i: number) => {
            const len = 18 * Math.abs(lg.load), x0 = M.l + pw + 14
            const y0 = M.t + 10 + ut.length * 16 + 22 + (loadX.length ? loadX.length * 18 + 10 : 0) + i * 18
            p.stroke(245, 158, 11); p.strokeWeight(1.5); p.line(x0, y0, x0 + len, y0)
            p.fill(80); p.textSize(7); p.text(lg.gene, x0 + len + 3, y0 - 3)
          })
        }

        // Hover info panel
        const hi = s4Sel !== null ? s4Sel : hov
        if (hi !== null && hi >= 0 && hi < nC) {
          const { x: hx, y: hy } = ts(rx[hi], ry[hi])
          const bx = hx + 14 > M.l + pw - 130 ? hx - 145 : hx + 14
          const by = hy - 72 < M.t ? M.t + 4 : hy - 72
          p.fill(255, 255, 255, 235); p.stroke(180); p.strokeWeight(1); p.rect(bx, by, 140, 66, 6)
          p.noStroke(); p.fill(50); p.textSize(10); p.textAlign(p.LEFT, p.TOP)
          p.text((isZh ? '细胞' : 'Cell') + ' #' + (hi + 1), bx + 8, by + 6)
          p.fill(80); p.textSize(9)
          p.text((isZh ? '类型' : 'Type') + ': ' + cellTypes[hi], bx + 8, by + 22)
          p.text('PC' + (xPC + 1) + ': ' + xs[hi].toFixed(3), bx + 8, by + 36)
          p.text('PC' + (yPC + 1) + ': ' + ys[hi].toFixed(3), bx + 8, by + 50)
        }

        // Zoom percentage
        if (zm_local !== 1) {
          p.fill(150); p.noStroke(); p.textSize(9); p.textAlign(p.RIGHT, p.BOTTOM)
          p.text((zm_local * 100).toFixed(0) + '%', W - 10, H - 5)
        }
        // Hint text
        p.fill(180); p.noStroke(); p.textSize(9); p.textAlign(p.LEFT, p.BOTTOM)
        p.text(isZh ? '悬停查看 · 滚轮缩放 · 拖拽平移' : 'Hover · Scroll zoom · Drag pan', M.l, H - 3)
      }

      p.mouseMoved = () => {
        let c: number | null = null, cd = 15
        for (let i = 0; i < nC; i++) {
          const { x, y } = ts(rx[i], ry[i])
          const d = Math.hypot(p.mouseX - x, p.mouseY - y)
          if (d < cd) { c = i; cd = d }
        }
        if (c !== hov) { hov = c; p.redraw() }
      }
      p.mouseWheel = (e: any) => {
        if (p.mouseX < M.l || p.mouseX > M.l + pw || p.mouseY < M.t || p.mouseY > M.t + ph) return
        zm_local = Math.max(0.5, Math.min(5, zm_local + (e.delta > 0 ? -0.12 : 0.12)))
        p.redraw(); return false
      }
      p.mousePressed = () => {
        if (p.mouseX >= M.l && p.mouseX <= M.l + pw && p.mouseY >= M.t && p.mouseY <= M.t + ph) {
          pan = true; psx = p.mouseX; psy = p.mouseY; ppx_ = px2; ppy_ = py2
        }
      }
      p.mouseDragged = () => {
        if (!pan) return
        px2 = ppx_ + (p.mouseX - psx); py2 = ppy_ + (p.mouseY - psy)
        p.redraw()
      }
      p.mouseReleased = () => { pan = false }
      p.mouseClicked = () => {
        if (hov !== null) { setS4Sel(prev => prev === hov ? null : hov); p.redraw() }
      }
    }
    mk('s4s', s4SRef.current, sk)
    return () => rm('s4s')
  }, [activeStep, xPC, yPC, s4Sel, s4Hover, pca, cellTypes, nC, geneNames, nG, varexp, isZh])

  // ── Render ──
  if (activeStep === 0) return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="text-sm text-gray-600">{isZh?'X轴基因:':'X-axis:'}</label>
        <select value={xG} onChange={e=>setXG(+e.target.value)} className="border rounded-lg px-2 py-1 text-sm bg-white">{geneNames.map((g,i)=><option key={i} value={i}>{g}</option>)}</select>
        <label className="text-sm text-gray-600 ml-2">{isZh?'Y轴基因:':'Y-axis:'}</label>
        <select value={yG} onChange={e=>setYG(+e.target.value)} className="border rounded-lg px-2 py-1 text-sm bg-white">{geneNames.map((g,i)=><option key={i} value={i}>{g}</option>)}</select>
      </div>
      <div ref={s1Ref} className="flex justify-center"/>
    </div>
  )

  if (activeStep === 1) return (
    <div>
      <div ref={s2Ref} className="flex justify-center"/>
      <div className="flex items-center gap-3 mt-2 px-4">
        <span className="text-sm text-gray-500">0°</span>
        <input type="range" min={0} max={359} value={pAngle} onChange={e=>setPAngle(+e.target.value)} className="flex-1 accent-red-500 h-2 cursor-pointer"/>
        <span className="text-sm text-gray-500">359°</span>
        <span className="text-sm font-mono text-gray-700 w-12 text-right">{pAngle}°</span>
      </div>
    </div>
  )

  if (activeStep === 2) {
    const subs = [
      {label: isZh?'A 中心化数据':'A Centered Data', color:'#10b981'},
      {label: isZh?'B 协方差计算':'B Covariance', color:'#f59e0b'},
      {label: isZh?'C 特征值分解':'C Eigendecomp.', color:'#ef4444'},
      {label: isZh?'D 投影计算':'D Projection', color:'#3b82f6'},
    ]
    return (
      <div>
        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          {subs.map((s,i)=>(
            <button key={i} onClick={()=>{setS3Sub(i);setSelCov(null);setSelGeneCol(null)}}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={s3Sub===i?{background:s.color,color:'white',boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}:{background:'#f3f4f6',color:'#6b7280'}}>
              {s.label}
            </button>
          ))}
        </div>
        {s3Sub===0 && <div><div ref={s3MatRef} className="flex justify-center"/></div>}
        {s3Sub===1 && <div><div ref={s3CovRef} className="flex justify-center"/></div>}
        {s3Sub===2 && (
          <div>
            <div ref={s3EigenRef} className="flex justify-center"/>
            <div className="flex items-center gap-3 mt-2 px-4">
              <span className="text-sm text-gray-500">{isZh?'迭代次数':'Iterations'}:</span>
              <input type="range" min={1} max={20} value={eigenStep} onChange={e=>setEigenStep(+e.target.value)} className="flex-1 accent-red-500 h-2 cursor-pointer"/>
              <span className="text-sm font-mono text-gray-700 w-8 text-right">{eigenStep}</span>
            </div>
          </div>
        )}
        {s3Sub===3 && <div><div ref={s3ProjRef} className="flex justify-center"/></div>}
      </div>
    )
  }

  if (activeStep === 3) return (
    <div>
      {/* ── PC selector ── */}
      <div className="flex items-center justify-center gap-6 mb-6 text-sm">
        <label className="flex items-center gap-2">
          <span className={isZh ? 'text-gray-600' : 'text-gray-500'}>{isZh?'X 轴 PC':'X PC'}:</span>
          <select value={xPC} onChange={e => { setXPC(+e.target.value); if (+e.target.value === yPC) setYPC(Math.min(yPC + 1, pca.evecs.length - 1)) }}
                  className="border rounded px-2 py-1 bg-white text-sm">
            {Array.from({ length: Math.min(10, pca.evals.length) }, (_, i) => (
              <option key={i} value={i}>PC{i + 1} ({((varexp[i] || 0) * 100).toFixed(1)}%)</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className={isZh ? 'text-gray-600' : 'text-gray-500'}>{isZh?'Y 轴 PC':'Y PC'}:</span>
          <select value={yPC} onChange={e => { setYPC(+e.target.value); if (+e.target.value === xPC) setXPC(Math.min(xPC + 1, pca.evecs.length - 1)) }}
                  className="border rounded px-2 py-1 bg-white text-sm">
            {Array.from({ length: Math.min(10, pca.evals.length) }, (_, i) => (
              <option key={i} value={i}>PC{i + 1} ({((varexp[i] || 0) * 100).toFixed(1)}%)</option>
            ))}
          </select>
        </label>
      </div>

      {/* ── Plots ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-center text-sm font-medium mb-3 text-gray-700">
            {isZh ? '方差解释率 (Scree Plot)' : 'Variance Explained'}
          </h4>
          <div ref={s4ERef} className="flex justify-center"/>
        </div>
        <div>
          <h4 className="text-center text-sm font-medium mb-3 text-gray-700">
            {isZh ? '细胞投影 (PC' + (xPC + 1) + ' vs PC' + (yPC + 1) + ')' : 'Cell Projection (PC' + (xPC + 1) + ' vs PC' + (yPC + 1) + ')'}
          </h4>
          <div ref={s4SRef} className="flex justify-center"/>
        </div>
      </div>

      {/* ── PC Projection Table ── */}
      <div className="mt-6">
        <h4 className="text-center text-sm font-medium mb-3 text-gray-700">
          {isZh ? 'PC 投影计算（以细胞 #1 为例）' : 'PC Projection Calculation (Cell #1 Example)'}
        </h4>
        <PCProjectionTable
          data={data}
          geneNames={geneNames}
          pca={pca}
          xPC={xPC}
          yPC={yPC}
          isZh={isZh}
        />
      </div>

      {/* ── Tips ── */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-gray-600">
        <p className="mb-1">
          <strong>{isZh ? '方差图解:' : 'Variance plot:'}</strong>
          {isZh ? '柱状图显示各 PC 解释的方差比例，折线图显示累积方差。选择 X/Y PC 查看对应散点图。'
                : 'Bars = variance per PC, line = cumulative. Click bars or use dropdowns to select PCs.'}
        </p>
        <p>
          <strong>{isZh ? '细胞投影:' : 'Cell projection:'}</strong>
          {isZh ? '每个点代表一个细胞，颜色对应细胞类型。箭头显示对当前 PCs 贡献最大的基因（loading）。'
                : 'Each point is a cell (colored by type). Arrows show top gene loadings for the selected PCs.'}
        </p>
        <p className="mt-1">
          <strong>{isZh ? 'PC 计算:' : 'PC calculation:'}</strong>
          {isZh ? '每个 PC 值是基因表达值与对应 loading 的线性组合：PCᵢ = Σ (表达ⱼ × loadingⱼᵢ)。表格展示了前几个贡献最大的基因。'
                : 'Each PC is a linear combination of gene expressions and loadings: PCᵢ = Σ (exprⱼ × loadingⱼᵢ). Table shows top contributing genes.'}
        </p>
      </div>
    </div>
  )

  return null
}

// ── PC Projection Table Component ──
interface PCProjectionTableProps {
  data: number[][]
  geneNames: string[]
  pca: { evecs: number[][]; projected: number[][] }
  xPC: number
  yPC: number
  isZh: boolean
}

function PCProjectionTable({ data, geneNames, pca, xPC, yPC, isZh }: PCProjectionTableProps) {
  const cellIdx = 0
  const cellExpr = data[cellIdx]
  const nShow = Math.min(6, geneNames.length)

  // Sort genes by combined loading magnitude
  const geneInfos = geneNames.map((name, g) => ({
    name,
    expr: cellExpr[g],
    xLoad: pca.evecs[g]?.[xPC] ?? 0,
    yLoad: pca.evecs[g]?.[yPC] ?? 0,
    xContrib: (cellExpr[g] ?? 0) * (pca.evecs[g]?.[xPC] ?? 0),
    yContrib: (cellExpr[g] ?? 0) * (pca.evecs[g]?.[yPC] ?? 0),
  }))

  // Sort by absolute x contribution + absolute y contribution
  geneInfos.sort((a, b) =>
    Math.abs(b.xContrib) + Math.abs(b.yContrib) - Math.abs(a.xContrib) - Math.abs(a.yContrib)
  )

  const topGenes = geneInfos.slice(0, nShow)
  const remaining = geneInfos.slice(nShow)
  const sumX = geneInfos.reduce((s, g) => s + g.xContrib, 0)
  const sumY = geneInfos.reduce((s, g) => s + g.yContrib, 0)
  const remX = remaining.reduce((s, g) => s + g.xContrib, 0)
  const remY = remaining.reduce((s, g) => s + g.yContrib, 0)

  const fmt = (v: number) => v.toFixed(2)
  const fmt4 = (v: number) => v.toFixed(4)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Formula header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-xs text-gray-600 font-mono">
          {isZh
            ? `PC${xPC + 1} = Σ (基因表达 × Loading${xPC + 1})    PC${yPC + 1} = Σ (基因表达 × Loading${yPC + 1})`
            : `PC${xPC + 1} = Σ (gene_expr × Loading${xPC + 1})    PC${yPC + 1} = Σ (gene_expr × Loading${yPC + 1})`
          }
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left font-medium text-gray-600">{isZh ? '基因' : 'Gene'}</th>
              <th className="px-3 py-2 text-right font-medium text-gray-600">{isZh ? '表达值' : 'Expr'}</th>
              <th className="px-3 py-2 text-right font-medium text-blue-600">
                {isZh ? `PC${xPC + 1} Loading` : `PC${xPC + 1} Load`}
              </th>
              <th className="px-3 py-2 text-right font-medium text-pink-600">
                {isZh ? `PC${yPC + 1} Loading` : `PC${yPC + 1} Load`}
              </th>
              <th className="px-3 py-2 text-right font-medium text-blue-700">
                {isZh ? `PC${xPC + 1} 贡献` : `PC${xPC + 1} Contr.`}
              </th>
              <th className="px-3 py-2 text-right font-medium text-pink-700">
                {isZh ? `PC${yPC + 1} 贡献` : `PC${yPC + 1} Contr.`}
              </th>
            </tr>
          </thead>
          <tbody>
            {topGenes.map((g, i) => (
              <tr key={g.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 font-mono text-gray-800">{g.name}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-600">{fmt(g.expr)}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-600">{fmt4(g.xLoad)}</td>
                <td className="px-3 py-2 text-right font-mono text-pink-600">{fmt4(g.yLoad)}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-700">
                  <span className={g.xContrib >= 0 ? '' : 'text-red-500'}>{fmt(g.xContrib)}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-pink-700">
                  <span className={g.yContrib >= 0 ? '' : 'text-red-500'}>{fmt(g.yContrib)}</span>
                </td>
              </tr>
            ))}
            {/* Remaining genes summary */}
            {remaining.length > 0 && (
              <tr className="bg-amber-50 border-t border-dashed border-gray-200">
                <td className="px-3 py-2 text-gray-500 italic">
                  {isZh ? `+ ${remaining.length} 个其他基因` : `+ ${remaining.length} other genes`}
                </td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-right font-mono text-blue-700">{fmt(remX)}</td>
                <td className="px-3 py-2 text-right font-mono text-pink-700">{fmt(remY)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 border-t-2 border-indigo-200">
              <td className="px-3 py-2 font-semibold text-indigo-900">
                {isZh ? `细胞 #${cellIdx + 1} 的 PC 值` : `Cell #${cellIdx + 1} PC Value`}
              </td>
              <td className="px-3 py-2" />
              <td className="px-3 py-2" />
              <td className="px-3 py-2" />
              <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">
                {fmt(sumX)}
                <div className="text-[10px] font-normal text-indigo-500">
                  {isZh ? '(实际' : '(actual'} {pcaProjected[cellIdx]?.[xPC]?.toFixed(2) ?? '?'}{')'}
                </div>
              </td>
              <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">
                {fmt(sumY)}
                <div className="text-[10px] font-normal text-indigo-500">
                  {isZh ? '(实际' : '(actual'} {pcaProjected[cellIdx]?.[yPC]?.toFixed(2) ?? '?'}{')'}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
