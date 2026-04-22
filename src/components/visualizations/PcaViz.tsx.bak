'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import p5 from 'p5'

interface PcaVizProps {
  data: number[][]
  geneNames: string[]
  cellTypes: string[]
  lang?: 'en' | 'zh'
  activeStep: number
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

export default function PcaViz({ data, geneNames, cellTypes, lang = 'en', activeStep }: PcaVizProps) {
  const s1Ref = useRef<HTMLDivElement>(null)
  const s2Ref = useRef<HTMLDivElement>(null)
  const s3MatRef = useRef<HTMLDivElement>(null)
  const s3CovRef = useRef<HTMLDivElement>(null)
  const s3EigenRef = useRef<HTMLDivElement>(null)
  const s3ProjRef = useRef<HTMLDivElement>(null)
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

  const pca = useMemo(() => computePCA(data, Math.min(10, nG)), [data, nG])
  const varexp = useMemo(() => { const t = pca.evals.reduce((s: number,v: number)=>s+v,0); return t>0 ? pca.evals.map((v: number)=>v/t) : pca.evals.map(()=>0) }, [pca])

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
        const ut=[...new Set(cellTypes)];p.textSize(9);p.textAlign(p.LEFT,p.CENTER);ut.forEach((t,i)=>{const[r,g,b]=gc(t);p.fill(r,g,b);p.noStroke();p.ellipse(W-85,M.t+10+i*16,8,8);p.fill(80);p.text(t,W-77,M.t+10+i*16)})
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
        const ut=[...new Set(cellTypes)];p.textSize(9);p.textAlign(p.LEFT,p.CENTER);ut.forEach((t,i)=>{const[cr,cg,cb]=gc(t);p.fill(cr,cg,cb);p.noStroke();p.ellipse(W-85,M.t+10+i*16,8,8);p.fill(80);p.text(t,W-77,M.t+10+i*16)})
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
    const dG = Math.min(nG, 7), dC = Math.min(nC, 12), cSz = 20
    const mX = 55, mY = 90
    const W = mX + dG*cSz*2 + 160, H = mY + Math.max(dC, dG)*cSz + 100
    const sk = (p: any) => {
      p.setup=()=>{p.createCanvas(W,H).parent(s3CovRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255)
        // Title
        p.fill(50);p.noStroke();p.textSize(12);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'协方差计算: Σ = (1/(n−1)) · Xcᵀ · Xc':'Covariance: Σ = (1/(n−1)) · Xcᵀ · Xc',mX,8)
        p.fill(130);p.textSize(10)
        p.text(isZh?'点击右侧 Σ 矩阵查看计算过程':'Click Σ matrix to see computation',mX,28)

        // ── Left: Xc ──
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Xc ('+dC+'×'+dG+')',mX,50)
        const mxA=Math.max(...centered.slice(0,dC).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dC;i++){for(let j=0;j<dG;j++){
          const v=centered[i][j],n=v/mxA
          const hi=selCov&&(j===selCov.j||j===selCov.k)
          if(hi){p.fill(j===selCov?.j?[255,165,0,200]:[0,200,100,200])}
          else if(n>=0)p.fill(66,133,244,n*150+55)
          else p.fill(234,67,53,-n*150+55)
          p.stroke(255);p.strokeWeight(0.5);p.rect(mX+j*cSz,mY+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.fill(80);p.textSize(7);p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dC;i++){const[r,g,b]=gc(cellTypes[i]);p.fill(r,g,b);p.text(cellTypes[i].substring(0,3),mX-2,mY+i*cSz+cSz/2)}
        p.fill(60);p.textSize(7);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<dG;j++){const hi=selCov&&(j===selCov.j||j===selCov.k);p.fill(hi?(j===selCov?.j?[255,165,0]:[0,200,100]):[60,60,60]);p.push();p.translate(mX+j*cSz+cSz/2,mY+dC*cSz+2);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()}

        // ── Right: Σ ──
        const cX = mX + dG*cSz + 50
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Σ ('+dG+'×'+dG+')',cX,50)
        const cMx=Math.max(...cov.slice(0,dG).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dG;i++){for(let j=0;j<dG;j++){
          const v=cov[i][j],n=v/cMx
          const isSel=selCov&&i===selCov.j&&j===selCov.k
          if(isSel){p.fill(255,165,0,255);p.stroke(200,120,0);p.strokeWeight(2)}
          else if(n>=0){p.fill(66,133,244,n*180+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*180+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(cX+j*cSz,mY+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.fill(60);p.textSize(7)
        p.textAlign(p.RIGHT,p.CENTER);for(let i=0;i<dG;i++)p.text(geneNames[i],cX-2,mY+i*cSz+cSz/2)
        p.textAlign(p.CENTER,p.TOP);for(let j=0;j<dG;j++){p.push();p.translate(cX+j*cSz+cSz/2,mY+dG*cSz+2);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()}

        // ── Computation detail ──
        if(selCov){
          const{j,k}=selCov
          const colJ=centered.map((r: number[])=>r[j]), colK=centered.map((r: number[])=>r[k])
          const dp=colJ.reduce((s: number,v: number,i: number)=>s+v*colK[i],0)
          const cv=dp/(nC-1)
          const by=mY+Math.max(dC,dG)*cSz+20
          p.fill(255,248,240);p.stroke(255,165,0,120);p.strokeWeight(1);p.rect(mX,by,W-mX-10,55,5)
          p.noStroke();p.fill(50);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
          p.text('Σ['+geneNames[j]+','+geneNames[k]+'] = 1/(n-1) · Xc[:,'+j+']ᵀ · Xc[:,'+k+']',mX+8,by+5)
          p.fill(80);p.textSize(9)
          const terms=colJ.map((v: number,i: number)=>v.toFixed(2)+'×'+colK[i].toFixed(2)).join(' + ')
          p.text('= 1/'+(nC-1)+' · ('+terms.substring(0,90)+(terms.length>90?'...':'')+')',mX+8,by+22)
          p.text('= 1/'+(nC-1)+' · '+dp.toFixed(3)+' = '+cv.toFixed(4),mX+8,by+38)
        }
      }
      p.mousePressed=()=>{
        const cX=mX+dG*cSz+50
        const gx=Math.floor((p.mouseX-cX)/cSz),gy=Math.floor((p.mouseY-mY)/cSz)
        if(gx>=0&&gx<dG&&gy>=0&&gy<dG){setSelCov({j:gy,k:gx});p.redraw()}
      }
    }
    mk('s3c', s3CovRef.current, sk)
    return () => rm('s3c')
  }, [activeStep, s3Sub, selCov, pca, geneNames, cellTypes, nC, nG, isZh])

  // ── Step 3-C: Eigendecomposition ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 2 || !s3EigenRef.current) return
    const dG = Math.min(nG, 8), cSz = 24
    const mX = 50, mY = 90
    const piResult = powerIterSteps(pca.cov, eigenStep)
    const W = 600, H = mY + dG*cSz + 120
    const sk = (p: any) => {
      p.setup=()=>{p.createCanvas(W,H).parent(s3EigenRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255)
        p.fill(50);p.noStroke();p.textSize(12);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'特征值分解: 通过幂迭代找到主成分方向':'Eigendecomposition: Power iteration finds PC directions',mX,8)
        p.fill(130);p.textSize(10)
        p.text(isZh?'协方差矩阵 Σ 反复与向量相乘，收敛到最大方差方向':'Σ multiplies vector repeatedly, converges to max variance direction',mX,28)

        // Show covariance matrix
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Σ',mX,55)
        const cMx=Math.max(...pca.cov.slice(0,dG).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dG;i++){for(let j=0;j<dG;j++){
          const v=pca.cov[i][j],n=v/cMx
          if(n>=0)p.fill(66,133,244,n*180+55);else p.fill(234,67,53,-n*180+55)
          p.stroke(255);p.strokeWeight(0.5);p.rect(mX+j*cSz,mY+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.fill(60);p.textSize(7);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<dG;j++){p.push();p.translate(mX+j*cSz+cSz/2,mY+dG*cSz+2);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()}

        // Arrow
        const ax = mX+dG*cSz+15, ay = mY+dG*cSz/2
        p.fill(100);p.textSize(16);p.textAlign(p.CENTER,p.CENTER);p.text('×',ax+8,ay)

        // Show current vector (last step of power iteration)
        const vecX = ax+25
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP)
        p.text('v (iter '+eigenStep+')',vecX,55)
        const vec = piResult.eigenvector
        const vecMx = Math.max(...vec.map(Math.abs))||1
        for(let i=0;i<dG;i++){
          const val=vec[i],norm=val/vecMx
          if(norm>=0)p.fill(66,133,244,norm*200+55);else p.fill(234,67,53,-norm*200+55)
          p.stroke(255);p.strokeWeight(0.5);p.rect(vecX,mY+i*cSz,cSz*2,cSz)
          p.noStroke();p.fill(norm>0.3||norm<-0.3?255:100);p.textSize(8);p.textAlign(p.CENTER,p.CENTER)
          p.text(val.toFixed(3),vecX+cSz,mY+i*cSz+cSz/2)
        }

        // = sign
        p.fill(100);p.textSize(16);p.textAlign(p.CENTER,p.CENTER);p.text('=',vecX+cSz*2+12,mY+dG*cSz/2)

        // Result vector
        const resX = vecX+cSz*2+25
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP)
        p.text('λ · v',resX,55)
        // Show converged eigenvalue
        p.fill(239,68,68);p.textSize(11)
        p.text('λ₁ = '+piResult.eigenval.toFixed(3),resX,72)
        // Variance explained
        const totalVar = pca.evals.reduce((s: number,v: number)=>s+v,0)
        p.fill(100);p.textSize(9)
        p.text((isZh?'解释率':'Explained')+': '+(piResult.eigenval/totalVar*100).toFixed(1)+'%',resX,88)

        // Convergence bar chart
        const barX = resX + cSz*2 + 20, barY = mY
        p.fill(60);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'前4个特征值':'Top 4 eigenvalues',barX,55)
        const evals4 = pca.evals.slice(0, 4)
        const mxEv = Math.max(...evals4)||1
        const colors = [[16,185,129],[245,158,11],[239,68,68],[59,130,246]]
        for(let i=0;i<evals4.length;i++){
          const barW = (evals4[i]/mxEv)*120
          p.fill(colors[i][0],colors[i][1],colors[i][2],180);p.noStroke()
          p.rect(barX,barY+i*22,barW,16,3)
          p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.CENTER)
          p.text('PC'+(i+1)+': '+evals4[i].toFixed(2),barX+barW+5,barY+i*22+8)
        }

        // Eigendecomposition formula
        p.fill(50);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'特征值分解公式':'Eigendecomposition',barX,barY+100)
        p.fill(80);p.textSize(9)
        p.text('Σ = VΛVᵀ',barX,barY+115)
        p.text(isZh?'V=特征向量, Λ=特征值对角阵':'V=eigenvectors, Λ=eigenvalue diag',barX,barY+130)
      }
    }
    mk('s3e', s3EigenRef.current, sk)
    return () => rm('s3e')
  }, [activeStep, s3Sub, eigenStep, pca, geneNames, nG, isZh])

  // ── Step 3-D: Projection ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 3 || !s3ProjRef.current) return
    const dG = Math.min(nG, 6), dC = Math.min(nC, 10), cSz = 22
    const W = 620, H = 320
    const sk = (p: any) => {
      p.setup=()=>{p.createCanvas(W,H).parent(s3ProjRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255)
        p.fill(50);p.noStroke();p.textSize(12);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'投影: Y = Xc · W (前k个特征向量)':'Projection: Y = Xc · W (top k eigenvectors)',20,8)
        p.fill(130);p.textSize(10)
        p.text(isZh?'每个细胞的新坐标 = 中心化数据 × 特征向量矩阵':'New coords for each cell = centered data × eigenvector matrix',20,28)

        // ── Xc matrix ──
        const m1x=20, m1y=60
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Xc ('+dC+'×'+dG+')',m1x,48)
        const mxA=Math.max(...pca.centered.slice(0,dC).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dC;i++){for(let j=0;j<dG;j++){
          const v=pca.centered[i][j],n=v/mxA
          if(n>=0)p.fill(66,133,244,n*150+55);else p.fill(234,67,53,-n*150+55)
          p.stroke(255);p.strokeWeight(0.5);p.rect(m1x+j*cSz,m1y+i*cSz,cSz,cSz)
        }}

        // × sign
        p.fill(100);p.noStroke();p.textSize(18);p.textAlign(p.CENTER,p.CENTER)
        p.text('×',m1x+dG*cSz+12,m1y+dC*cSz/2)

        // ── W matrix (eigenvectors) ──
        const m2x = m1x+dG*cSz+25, nPC = Math.min(3, dG)
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('W ('+dG+'×'+nPC+')',m2x,48)
        const evMx = Math.max(...pca.evecs.slice(0,nPC).map((r: number[])=>r.map(Math.abs)).flat())||1
        for(let i=0;i<dG;i++){for(let j=0;j<nPC;j++){
          const v=pca.evecs[j][i],n=v/evMx
          if(n>=0)p.fill(139,92,246,n*200+55);else p.fill(234,67,53,-n*200+55)
          p.stroke(255);p.strokeWeight(0.5);p.rect(m2x+j*cSz,m1y+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.fill(80);p.textSize(7);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<nPC;j++)p.text('PC'+(j+1),m2x+j*cSz+cSz/2,m1y+dG*cSz+2)
        p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dG;i++)p.text(geneNames[i],m1x-2,m1y+i*cSz+cSz/2)

        // = sign
        p.fill(100);p.noStroke();p.textSize(18);p.textAlign(p.CENTER,p.CENTER)
        p.text('=',m2x+nPC*cSz+12,m1y+dC*cSz/2)

        // ── Y matrix (result) ──
        const m3x = m2x+nPC*cSz+25
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Y ('+dC+'×'+nPC+')',m3x,48)
        const yMx=Math.max(...pca.projected.slice(0,dC).map((r: number[])=>r.slice(0,nPC).map(Math.abs)).flat())||1
        for(let i=0;i<dC;i++){for(let j=0;j<nPC;j++){
          const v=pca.projected[i][j],n=v/yMx
          if(n>=0)p.fill(16,185,129,n*200+55);else p.fill(234,67,53,-n*200+55)
          p.stroke(255);p.strokeWeight(0.5);p.rect(m3x+j*cSz,m1y+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.fill(80);p.textSize(7);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<nPC;j++)p.text('PC'+(j+1),m3x+j*cSz+cSz/2,m1y+dC*cSz+2)

        // Cell labels on Y
        p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dC;i++){const[r,g,b]=gc(cellTypes[i]);p.fill(r,g,b);p.text(cellTypes[i].substring(0,3),m3x-2,m1y+i*cSz+cSz/2)}

        // Formula at bottom
        const fy = m1y + Math.max(dC,dG)*cSz + 15
        p.fill(50);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'计算公式':'Formula',20,fy)
        p.fill(80);p.textSize(9)
        p.text('Y = Xc · W',20,fy+16)
        p.text(isZh?'Xc: 中心化数据 (n×p)':'Xc: centered data (n×p)',20,fy+32)
        p.text(isZh?'W: 前k个特征向量 (p×k)':'W: top k eigenvectors (p×k)',20,fy+46)
        p.text(isZh?'Y: PC坐标 (n×k)':'Y: PC scores (n×k)',20,fy+60)
      }
    }
    mk('s3p', s3ProjRef.current, sk)
    return () => rm('s3p')
  }, [activeStep, s3Sub, pca, geneNames, cellTypes, nC, nG, isZh])

  // ── Step 4: Elbow + PC scatter (unchanged) ──
  useEffect(() => {
    if (activeStep !== 3 || !s4ERef.current) return
    const sk = (p: any) => {
      const W=270,H=230,M={t:25,r:15,b:40,l:45},pw=W-M.l-M.r,ph=H-M.t-M.b
      p.setup=()=>{p.createCanvas(W,H).parent(s4ERef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255);const n=varexp.length,cv: number[]=[];varexp.reduce((a: number,v: number)=>{cv.push(a+v);return a+v},0);const bW=pw/n
        for(let i=0;i<n;i++){const bH=varexp[i]*ph,x=M.l+i*bW,y=M.t+ph-bH;p.fill(139,92,246,180);p.stroke(255);p.strokeWeight(1);p.rect(x+2,y,bW-4,bH,2,2,0,0);p.noStroke();p.fill(100);p.textSize(8);p.textAlign(p.CENTER,p.TOP);p.text((varexp[i]*100).toFixed(0)+'%',x+bW/2,y-12)}
        p.noFill();p.stroke(234,67,53);p.strokeWeight(2);p.beginShape();for(let i=0;i<n;i++){const x=M.l+(i+0.5)*bW,y=M.t+ph-cv[i]*ph;p.vertex(x,y);p.fill(234,67,53);p.noStroke();p.ellipse(x,y,5,5);p.noFill();p.stroke(234,67,53)}p.endShape()
        p.stroke(150);p.strokeWeight(1);p.line(M.l,M.t+ph,M.l+pw,M.t+ph);p.line(M.l,M.t,M.l,M.t+ph)
        p.noStroke();p.fill(80);p.textSize(10);p.textAlign(p.CENTER,p.TOP);p.text(isZh?'主成分':'PC',M.l+pw/2,M.t+ph+6)
        p.push();p.translate(10,M.t+ph/2);p.rotate(-Math.PI/2);p.text(isZh?'方差解释率':'Variance',0,0);p.pop()
        p.fill(100);p.textSize(8);p.textAlign(p.CENTER,p.TOP);for(let i=0;i<n;i++)p.text('PC'+(i+1),M.l+(i+0.5)*bW,M.t+ph+2)
        p.fill(234,67,53);p.noStroke();p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.ellipse(M.l+5,M.t+5,6,6);p.text(isZh?'累积':'Cumul.',M.l+12,M.t+1)
      }
    }
    mk('s4e', s4ERef.current, sk)
    return () => rm('s4e')
  }, [activeStep, varexp, isZh])

  useEffect(() => {
    if (activeStep !== 3 || !s4SRef.current) return
    const sk = (p: any) => {
      const W=290,H=230,M={t:20,r:15,b:40,l:45},pw=W-M.l-M.r,ph=H-M.t-M.b
      p.setup=()=>{p.createCanvas(W,H).parent(s4SRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255);const xs=pca.projected.map((r: number[])=>r[0]),ys=pca.projected.map((r: number[])=>r[1]);const mnX=Math.min(...xs),mxX=Math.max(...xs)||1,mnY=Math.min(...ys),mxY=Math.max(...ys)||1
        p.stroke(240);p.strokeWeight(1);for(let i=0;i<=4;i++){p.line(M.l+pw*i/4,M.t,M.l+pw*i/4,M.t+ph);p.line(M.l,M.t+ph*i/4,M.l+pw,M.t+ph*i/4)}
        for(let i=0;i<nC;i++){const x=M.l+(xs[i]-mnX)/(mxX-mnX)*pw,y=M.t+ph-(ys[i]-mnY)/(mxY-mnY)*ph;const[r,g,b]=gc(cellTypes[i]);p.fill(r,g,b,200);p.noStroke();p.ellipse(x,y,8,8)}
        p.stroke(150);p.strokeWeight(1);p.line(M.l,M.t+ph,M.l+pw,M.t+ph);p.line(M.l,M.t,M.l,M.t+ph)
        p.noStroke();p.fill(80);p.textSize(10);p.textAlign(p.CENTER,p.TOP);p.text('PC1 ('+(varexp[0]*100).toFixed(1)+'%)',M.l+pw/2,M.t+ph+6)
        p.push();p.translate(10,M.t+ph/2);p.rotate(-Math.PI/2);p.text('PC2 ('+(varexp[1]*100).toFixed(1)+'%)',0,0);p.pop()
        const ut=[...new Set(cellTypes)];p.textSize(8);p.textAlign(p.LEFT,p.CENTER);ut.forEach((t,i)=>{const[r,g,b]=gc(t);p.fill(r,g,b);p.noStroke();p.ellipse(W-72,M.t+8+i*14,7,7);p.fill(80);p.text(t,W-65,M.t+8+i*14)})
      }
    }
    mk('s4s', s4SRef.current, sk)
    return () => rm('s4s')
  }, [activeStep, pca, cellTypes, nC, varexp])

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><div ref={s4ERef} className="flex justify-center"/></div>
      <div><div ref={s4SRef} className="flex justify-center"/></div>
    </div>
  )

  return null
}
