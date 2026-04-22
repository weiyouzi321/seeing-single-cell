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
    const dG = Math.min(nG, 7), dC = Math.min(nC, 10), cSz = 20
    const topY = 70, xctLabelH = 20
    const xctX = 45
    const xcX = xctX + dC * cSz + 50
    const sigmaX = xcX + dG * cSz + 50
    const xcY = topY + xctLabelH + 8
    const detailY = xcY + dC * cSz + 25
    const W = sigmaX + dG * cSz + 20
    const H = detailY + 105

    const sk = (p: any) => {
      p.setup=()=>{p.createCanvas(W,H).parent(s3CovRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255)
        p.fill(50);p.noStroke();p.textSize(13);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'协方差计算':'Covariance Computation',xctX,8)
        p.fill(130);p.textSize(10)
        p.text(isZh?'点击 Σ 元素，观察对应行/列的计算关系':'Click Σ element to see row/column relationship',xctX,28)
        p.fill(245,248,255);p.stroke(200,215,255);p.strokeWeight(1);p.rect(xctX,48,W-xctX-10,22,4)
        p.noStroke();p.fill(60,80,140);p.textSize(11);p.textAlign(p.LEFT,p.TOP)
        p.text('\u03A3 = 1/(n\u22121) \u00B7 Xc\u1D40 \u00B7 Xc',xctX+8,51)

        const mxA=Math.max(...centered.slice(0,dC).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1

        // ── Xcᵀ ──
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Xc\u1D40 ('+dG+'\u00D7'+dC+')',xctX,topY)
        for(let i=0;i<dG;i++){for(let j=0;j<dC;j++){
          const v=centered[j][i],n=v/mxA
          const hiRow=selCov&&i===selCov.j
          if(hiRow){p.fill(255,165,0,220);p.stroke(200,120,0);p.strokeWeight(1.5)}
          else if(n>=0){p.fill(66,133,244,n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(xctX+j*cSz,topY+xctLabelH+8+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.textSize(7);p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dG;i++){const hi=selCov&&i===selCov.j;p.fill(hi?[255,165,0]:[80,80,80]);p.text(geneNames[i],xctX-3,topY+xctLabelH+8+i*cSz+cSz/2)}
        p.textAlign(p.CENTER,p.TOP);p.fill(120);p.textSize(6)
        for(let j=0;j<dC;j++)p.text('c'+j,xctX+j*cSz+cSz/2,topY+xctLabelH+8+dG*cSz+2)

        // ── Xc ──
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Xc ('+dC+'\u00D7'+dG+')',xcX,topY)
        for(let i=0;i<dC;i++){for(let j=0;j<dG;j++){
          const v=centered[i][j],n=v/mxA
          const hiCol=selCov&&j===selCov.k
          if(hiCol){p.fill(0,200,100,220);p.stroke(0,150,80);p.strokeWeight(1.5)}
          else if(n>=0){p.fill(66,133,244,n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(xcX+j*cSz,xcY+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.textSize(7);p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dC;i++){const[r,g,b]=gc(cellTypes[i]);p.fill(r,g,b);p.text(cellTypes[i].substring(0,3),xcX-3,xcY+i*cSz+cSz/2)}
        p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<dG;j++){const hi=selCov&&j===selCov.k;p.fill(hi?[0,200,100]:[60,60,60]);p.push();p.translate(xcX+j*cSz+cSz/2,xcY+dC*cSz+2);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()}

        // ── Σ ──
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('\u03A3 ('+dG+'\u00D7'+dG+')',sigmaX,topY)
        const cMx=Math.max(...cov.slice(0,dG).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dG;i++){for(let j=0;j<dG;j++){
          const v=cov[i][j],n=v/cMx
          const isSel=selCov&&i===selCov.j&&j===selCov.k
          if(isSel){p.fill(255,165,0,255);p.stroke(200,120,0);p.strokeWeight(2)}
          else if(n>=0){p.fill(66,133,244,n*180+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*180+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(sigmaX+j*cSz,topY+xctLabelH+8+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.textSize(7)
        p.textAlign(p.RIGHT,p.CENTER);for(let i=0;i<dG;i++)p.text(geneNames[i],sigmaX-3,topY+xctLabelH+8+i*cSz+cSz/2)
        p.textAlign(p.CENTER,p.TOP);for(let j=0;j<dG;j++){p.push();p.translate(sigmaX+j*cSz+cSz/2,topY+xctLabelH+8+dG*cSz+2);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()}

        // Multiplication arrows
        const midY = topY+xctLabelH+8+Math.min(dG,dC)*cSz/2
        p.fill(150);p.textSize(16);p.textAlign(p.CENTER,p.CENTER)
        p.text('\u00D7',xcX-25,midY)
        p.text('=',sigmaX-25,midY)

        // ── Detail panel ──
        if(selCov){
          const{j,k}=selCov
          const colJ=centered.map((r: number[])=>r[j]), colK=centered.map((r: number[])=>r[k])
          const dp=colJ.reduce((s: number,v: number,i: number)=>s+v*colK[i],0)
          const cv=dp/(nC-1)
          const by=detailY
          p.fill(255,248,240);p.stroke(255,165,0,150);p.strokeWeight(1.5);p.rect(xctX,by,W-xctX-10,78,6)
          p.noStroke()
          p.fill(180,100,0);p.textSize(11);p.textAlign(p.LEFT,p.TOP)
          p.text('\u03A3['+geneNames[j]+','+geneNames[k]+'] \u7684\u8BA1\u7B97\u8FC7\u7A0B',xctX+10,by+5)
          p.fill(60);p.textSize(11)
          p.text('= 1/(n\u22121) \u00B7 Xc\u1D40['+geneNames[j]+',:] \u00B7 Xc[:,'+geneNames[k]+']',xctX+10,by+22)
          const maxT=Math.min(5,colJ.length)
          let terms=colJ.slice(0,maxT).map((v: number,i: number)=>'('+v.toFixed(2)+'\u00D7'+colK[i].toFixed(2)+')').join(' + ')
          if(colJ.length>maxT) terms+=' + ...'
          p.fill(100);p.textSize(9)
          p.text('= 1/'+(nC-1)+' \u00D7 ('+terms+')',xctX+10,by+38)
          p.fill(50);p.textSize(11)
          p.text('= '+dp.toFixed(3)+' / '+(nC-1)+' = '+cv.toFixed(4),xctX+10,by+54)
          p.fill(255,165,0);p.rect(W-130,by+8,10,10,2)
          p.fill(80);p.textSize(8);p.textAlign(p.LEFT,p.TOP)
          p.text(geneNames[j]+' row (\u6A59)',W-116,by+9)
          p.fill(0,200,100);p.rect(W-130,by+28,10,10,2)
          p.fill(80);p.text(geneNames[k]+' col (\u7EFF)',W-116,by+29)
        }
      }
      p.mousePressed=()=>{
        const gy=Math.floor((p.mouseY-(topY+xctLabelH+8))/cSz)
        const gx=Math.floor((p.mouseX-sigmaX)/cSz)
        if(gx>=0&&gx<dG&&gy>=0&&gy<dG){setSelCov({j:gy,k:gx});p.redraw()}
      }
    }
    mk('s3c', s3CovRef.current, sk)
    return () => rm('s3c') }, [activeStep, s3Sub, selCov, pca, geneNames, cellTypes, nC, nG, isZh])

  // ── Step 3-C: Eigendecomposition ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 2 || !s3EigenRef.current) return
    const dG = Math.min(nG, 8), cSz = 20
    const nPC = Math.min(4, dG)
    const piResult = powerIterSteps(pca.cov, eigenStep)
    const vec = piResult.eigenvector, lambda = piResult.eigenval
    const mX = 40, mY = 120
    const sigmaW = dG * cSz
    const vecW = cSz * 2
    const gap1 = 20, gap2 = 14, gap3 = 12
    const vecX = mX + sigmaW + gap1
    const resX = vecX + vecW + gap2
    const approxX = resX + vecW + 6
    const lambdaW = 48, lambdaH = 26
    const lambdaX = approxX + 22
    const timesX = lambdaX + lambdaW + 6
    const v2X = timesX + 10
    const evGap = 35
    const evX = v2X + vecW + evGap
    const W = evX + nPC * (cSz + 2) + 30
    const H = mY + dG * cSz + 130

    const sk = (p: any) => {
      p.setup=()=>{p.createCanvas(W,H).parent(s3EigenRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255)
        p.fill(50);p.noStroke();p.textSize(13);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'特征值分解: 幂迭代法':'Eigendecomposition: Power Iteration',mX,8)
        p.fill(130);p.textSize(10)
        p.text(isZh?'选择PC，观察迭代中 λ 与 v 的动态变化':'Select PC, watch λ and v converge dynamically',mX,26)

        // PC selector with breathing room
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'主成分:':'PC:',mX,52)
        for(let pc=0;pc<nPC;pc++){
          const bx=mX+58+pc*54, by=48, bw=46, bh=22
          const isActive=selPC===pc
          if(isActive){p.fill(139,92,246);p.stroke(100,60,200);p.strokeWeight(2)}
          else{p.fill(245);p.stroke(200);p.strokeWeight(1)}
          p.rect(bx,by,bw,bh,4)
          p.noStroke();p.fill(isActive?255:80);p.textSize(10);p.textAlign(p.CENTER,p.CENTER)
          p.text('PC'+(pc+1),bx+bw/2,by+bh/2)
        }
        // spacer before matrices
        p.fill(255);p.noStroke();p.rect(mX,by+bh+6,400,10)

        // Iter label
        p.fill(80);p.textSize(9);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'迭代:':'Iter:',mX+58+nPC*54+15,52)
        p.fill(60);p.textSize(10)
        p.text(eigenStep,mX+58+nPC*54+65,52)

        // column labels (genes)
        p.textSize(6);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<dG;j++){p.push();p.translate(mX+j*cSz+cSz/2,mY-3);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()}

        // Σ
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('\u03A3',mX,mY-16)
        const cMx=Math.max(...pca.cov.slice(0,dG).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dG;i++){for(let j=0;j<dG;j++){
          const v=pca.cov[i][j],n=Math.abs(v)/cMx
          p.fill(n>=0?[66,133,244,n*0.75+0.25]:[234,67,53,n*0.75+0.25]);p.stroke(255);p.strokeWeight(0.5)
          p.rect(mX+j*cSz,mY+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.textSize(7);p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dG;i++)p.text(geneNames[i],mX-3,mY+i*cSz+cSz/2)

        // ×
        p.fill(120);p.textSize(16);p.textAlign(p.CENTER,p.CENTER);p.text('\u00D7',mX+sigmaW+gap1/2+5,mY+dG*cSz/2)

        // v
        p.fill(139,92,246);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('v',vecX,mY-16)
        const vecMx = Math.max(...vec.map(Math.abs))||1
        for(let i=0;i<dG;i++){
          const val=vec[i],n=Math.abs(val)/vecMx
          p.fill(n>=0?[139,92,246,n*0.75+0.25]:[234,67,53,n*0.75+0.25]);p.stroke(255);p.strokeWeight(0.5)
          p.rect(vecX,mY+i*cSz,vecW,cSz)
          p.noStroke();p.fill(n>0.3?255:100);p.textSize(8);p.textAlign(p.CENTER,p.CENTER)
          p.text(val.toFixed(3),vecX+vecW/2,mY+i*cSz+cSz/2)
        }

        // =
        p.fill(120);p.textSize(16);p.textAlign(p.CENTER,p.CENTER);p.text('=',vecX+vecW+gap2/2+5,mY+dG*cSz/2)

        // Σv
        p.fill(16,185,129);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('\u03A3v',resX,mY-16)
        const sigmaV = Array(dG).fill(0)
        for(let i=0;i<dG;i++) for(let j=0;j<dG;j++) sigmaV[i] += pca.cov[i][j]*vec[j]
        const svMx = Math.max(...sigmaV.map(Math.abs))||1
        for(let i=0;i<dG;i++){
          const val=sigmaV[i],n=Math.abs(val)/svMx
          p.fill(n>=0?[16,185,129,n*0.75+0.25]:[234,67,53,n*0.75+0.25]);p.stroke(255);p.strokeWeight(0.5)
          p.rect(resX,mY+i*cSz,vecW,cSz)
          p.noStroke();p.fill(n>0.3?255:100);p.textSize(8);p.textAlign(p.CENTER,p.CENTER)
          p.text(val.toFixed(3),resX+vecW/2,mY+i*cSz+cSz/2)
        }

        // ≈
        p.fill(120);p.textSize(16);p.textAlign(p.CENTER,p.CENTER);p.text('\u2248',approxX,mY+dG*cSz/2)

        // λ badge (centered vertically among matrix rows)
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text(isZh?'\u03BB:':'λ:',lambdaX,mY-16)
        const lambdaY = mY + (dG*cSz - lambdaH)/2
        p.fill(245,158,11,245);p.stroke(200,120,0);p.strokeWeight(1.5);p.rect(lambdaX+22,lambdaY,lambdaW,lambdaH,5)
        p.noStroke();p.fill(255);p.textSize(12);p.textAlign(p.CENTER,p.CENTER)
        p.text(lambda.toFixed(4),lambdaX+22+lambdaW/2,lambdaY+lambdaH/2)

        // ×
        p.fill(120);p.textSize(16);p.textAlign(p.CENTER,p.CENTER);p.text('\u00D7',timesX,mY+dG*cSz/2)

        // v (from λ)
        p.fill(245,158,11);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('v',v2X,mY-16)
        for(let i=0;i<dG;i++){
          const val=vec[i],n=Math.abs(val)/vecMx
          p.fill(n>=0?[245,158,11,n*0.75+0.25]:[234,67,53,n*0.75+0.25]);p.stroke(255);p.strokeWeight(0.5)
          p.rect(v2X,mY+i*cSz,vecW,cSz)
          p.noStroke();p.fill(n>0.3?255:100);p.textSize(8);p.textAlign(p.CENTER,p.CENTER)
          p.text(val.toFixed(3),v2X+vecW/2,mY+i*cSz+cSz/2)
        }

        // Eigenvectors V
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'特征向量 V (前'+nPC+'个)':'Eigenvectors V (top '+nPC+')',evX,mY-16)
        const evecs = pca.evecs
        const evMx = Math.max(...evecs.slice(0,nPC).map((r: number[])=>r.map(Math.abs)).flat())||1
        for(let pc=0;pc<nPC;pc++){
          for(let i=0;i<dG;i++){
            const v=evecs[pc][i],n=Math.abs(v)/evMx
            const isSel=pc===selPC
            if(isSel){p.fill(139,92,246,n>0.3?255:100);p.stroke(100,60,200);p.strokeWeight(1.5)}
            else{p.fill(n>=0?[66,133,244,n*0.6+0.4]:[234,67,53,n*0.6+0.4]);p.stroke(255);p.strokeWeight(0.5)}
            p.rect(evX+pc*(cSz+2),mY+i*cSz,cSz,cSz)
          }
        }
        p.noStroke()
        for(let pc=0;pc<nPC;pc++){
          p.fill(pc===selPC?139:120,pc===selPC?92:120,pc===selPC?246:120)
          p.textSize(pc===selPC?9:7);p.textAlign(p.CENTER,p.TOP)
          p.text('PC'+(pc+1),evX+pc*(cSz+2)+cSz/2,mY+dG*cSz+2)
        }
        p.textAlign(p.RIGHT,p.CENTER);p.fill(80);p.textSize(7)
        for(let i=0;i<dG;i++)p.text(geneNames[i],evX-5,mY+i*cSz+cSz/2)

        // Convergence bar
        const fy = mY + dG*cSz + 22
        p.fill(245,248,255);p.stroke(200,215,255);p.strokeWeight(1);p.rect(mX,fy,W-mX-10,26,4)
        p.noStroke();p.fill(60,80,140);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?
          'PC'+(selPC+1)+': λ = '+lambda.toFixed(5)+' | Σv'+(selPC+1)+' ≈ λ·v'+(selPC+1)+' ('+eigenStep+' iter)':
          'PC'+(selPC+1)+': λ = '+lambda.toFixed(5)+' | Σv'+(selPC+1)+' ≈ λ·v'+(selPC+1)+' ('+eigenStep+' iter)',
          mX+8,fy+4)
      }

      p.mousePressed=()=>{
        for(let pc=0;pc<nPC;pc++){
          const bx=mX+58+pc*54, by=48, bw=46, bh=22
          if(p.mouseX>=bx&&p.mouseX<=bx+bw&&p.mouseY>=by&&p.mouseY<=by+bh){setSelPC(pc);p.redraw();return}
        }
        const evCol=Math.floor((p.mouseX-evX)/(cSz+2))
        const evRow=Math.floor((p.mouseY-mY)/cSz)
        if(evCol>=0&&evCol<nPC&&evRow>=0&&evRow<dG){setSelPC(evCol);p.redraw();return}
      }
    }
    mk('s3e', s3EigenRef.current, sk)
    return () => rm('s3e')
  }, [activeStep, s3Sub, selPC, eigenStep, pca, geneNames, nG, isZh])

  // ── Step 3-D: Projection ──
  useEffect(() => {
    if (activeStep !== 2 || s3Sub !== 3 || !s3ProjRef.current) return
    const dG = Math.min(nG, 6), dC = Math.min(nC, 10), cSz = 22
    const nPC = Math.min(4, dG)
    const W = 720, H = 420
    const sk = (p: any) => {
      p.setup=()=>{p.createCanvas(W,H).parent(s3ProjRef.current!);p.textFont('Inter');p.noLoop()}
      p.draw=()=>{
        p.background(255)
        p.fill(50);p.noStroke();p.textSize(13);p.textAlign(p.LEFT,p.TOP)
        p.text(isZh?'投影: Y = Xc \u00B7 W':'Projection: Y = Xc \u00B7 W',20,8)
        p.fill(130);p.textSize(10)
        p.text(isZh?'点击 Y 矩阵元素查看向量相乘过程':'Click Y matrix element to see vector multiplication',20,28)

        // ── Xc matrix ──
        const m1x=20, m1y=60
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Xc ('+dC+'\u00D7'+dG+')',m1x,48)
        const mxA=Math.max(...pca.centered.slice(0,dC).map((r: number[])=>r.slice(0,dG).map(Math.abs)).flat())||1
        for(let i=0;i<dC;i++){for(let j=0;j<dG;j++){
          const v=pca.centered[i][j],n=v/mxA
          const hiRow=selProj&&i===selProj.i
          if(hiRow){p.fill(255,165,0,200);p.stroke(200,120,0);p.strokeWeight(1.5)}
          else if(n>=0){p.fill(66,133,244,n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(m1x+j*cSz,m1y+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.textSize(7);p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dC;i++){const[r,g,b]=gc(cellTypes[i]);p.fill(r,g,b);p.text(cellTypes[i].substring(0,3),m1x-3,m1y+i*cSz+cSz/2)}
        p.textAlign(p.CENTER,p.TOP);p.fill(120);p.textSize(6)
        for(let j=0;j<dG;j++){p.push();p.translate(m1x+j*cSz+cSz/2,m1y+dC*cSz+2);p.rotate(-Math.PI/4);p.text(geneNames[j],0,0);p.pop()}

        // \u00D7 sign
        const gap1 = m1x+dG*cSz+12
        p.fill(100);p.noStroke();p.textSize(18);p.textAlign(p.CENTER,p.CENTER)
        p.text('\u00D7',gap1,m1y+dC*cSz/2)

        // ── W matrix (eigenvectors) ──
        const m2x = gap1+15
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('W ('+dG+'\u00D7'+nPC+')',m2x,48)
        const evMx = Math.max(...pca.evecs.slice(0,nPC).map((r: number[])=>r.map(Math.abs)).flat())||1
        for(let i=0;i<dG;i++){for(let j=0;j<nPC;j++){
          const v=pca.evecs[j][i],n=v/evMx
          const hiCol=selProj&&j===selProj.j
          if(hiCol){p.fill(139,92,246,220);p.stroke(100,60,200);p.strokeWeight(1.5)}
          else if(n>=0){p.fill(139,92,246,n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*150+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(m2x+j*cSz,m1y+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.textSize(7);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<nPC;j++)p.text('PC'+(j+1),m2x+j*cSz+cSz/2,m1y+dG*cSz+2)
        p.textAlign(p.RIGHT,p.CENTER);p.fill(80)
        for(let i=0;i<dG;i++)p.text(geneNames[i],m2x-3,m1y+i*cSz+cSz/2)

        // = sign
        const gap2 = m2x+nPC*cSz+12
        p.fill(100);p.noStroke();p.textSize(18);p.textAlign(p.CENTER,p.CENTER)
        p.text('=',gap2,m1y+dC*cSz/2)

        // ── Y matrix (result) ──
        const m3x = gap2+15
        p.fill(60);p.textSize(9);p.textAlign(p.LEFT,p.TOP);p.text('Y ('+dC+'\u00D7'+nPC+')',m3x,48)
        const yMx=Math.max(...pca.projected.slice(0,dC).map((r: number[])=>r.slice(0,nPC).map(Math.abs)).flat())||1
        for(let i=0;i<dC;i++){for(let j=0;j<nPC;j++){
          const v=pca.projected[i][j],n=v/yMx
          const isSel=selProj&&i===selProj.i&&j===selProj.j
          if(isSel){p.fill(245,158,11,255);p.stroke(200,120,0);p.strokeWeight(2)}
          else if(n>=0){p.fill(16,185,129,n*200+55);p.stroke(255);p.strokeWeight(0.5)}
          else{p.fill(234,67,53,-n*200+55);p.stroke(255);p.strokeWeight(0.5)}
          p.rect(m3x+j*cSz,m1y+i*cSz,cSz,cSz)
        }}
        p.noStroke();p.textSize(7);p.textAlign(p.CENTER,p.TOP)
        for(let j=0;j<nPC;j++)p.text('PC'+(j+1),m3x+j*cSz+cSz/2,m1y+dC*cSz+2)
        p.textAlign(p.RIGHT,p.CENTER)
        for(let i=0;i<dC;i++){const[r,g,b]=gc(cellTypes[i]);p.fill(r,g,b);p.text(cellTypes[i].substring(0,3),m3x-3,m1y+i*cSz+cSz/2)}

        // Formula reference at top-right
        const fx = m3x + nPC*cSz + 30
        p.fill(245,248,255);p.stroke(200,215,255);p.strokeWeight(1);p.rect(fx,48,160,22,4)
        p.noStroke();p.fill(60,80,140);p.textSize(10);p.textAlign(p.LEFT,p.TOP)
        p.text('Y[i,j] = Xc[i,:] \u00B7 W[:,j]',fx+8,52)

        // ── Detail panel ──
        if(selProj){
          const{i:si,j:sj}=selProj
          const rowI=pca.centered[si]
          const colJ=pca.evecs[sj]
          const dp=rowI.reduce((s: number,v: number,k: number)=>s+v*colJ[k],0)
          const by = m1y + Math.max(dC,dG)*cSz + 20
          
          p.fill(255,248,240);p.stroke(245,158,11,150);p.strokeWeight(1.5);p.rect(m1x,by,W-m1x-10,85,6)
          p.noStroke()
          p.fill(180,100,0);p.textSize(11);p.textAlign(p.LEFT,p.TOP)
          const cellLabel = cellTypes[si]+'\u00B7'+(si+1)
          p.text('Y['+cellLabel+',PC'+(sj+1)+'] \u7684\u8BA1\u7B97\u8FC7\u7A0B',m1x+10,by+5)
          p.fill(60);p.textSize(11)
          p.text('= Xc[' + cellLabel + ',:] \u00B7 W[:,PC' + (sj+1) + ']',m1x+10,by+22)
          // Show dot product terms
          const maxT = Math.min(5, rowI.length)
          let terms = rowI.slice(0,maxT).map((v: number,k: number)=>'('+v.toFixed(2)+'\u00D7'+colJ[k].toFixed(2)+')').join(' + ')
          if(rowI.length > maxT) terms += ' + ...'
          p.fill(100);p.textSize(9)
          p.text('= '+terms,m1x+10,by+40)
          p.fill(50);p.textSize(11)
          p.text('= '+dp.toFixed(4),m1x+10,by+58)
          // Legend
          p.fill(255,165,0);p.rect(W-150,by+8,10,10,2)
          p.fill(80);p.textSize(8);p.textAlign(p.LEFT,p.TOP)
          p.text('Xc[' + cellLabel + ',:] (\u6A59)',W-136,by+9)
          p.fill(139,92,246);p.rect(W-150,by+28,10,10,2)
          p.fill(80);p.text('W[:,PC' + (sj+1) + '] (\u7D2B)',W-136,by+29)
        }
      }
      p.mousePressed=()=>{
        const m1x=20, m1y=60
        const m2x = m1x+dG*cSz+27
        const m3x = m2x+nPC*cSz+27
        const gx=Math.floor((p.mouseX-m3x)/cSz),gy=Math.floor((p.mouseY-m1y)/cSz)
        if(gx>=0&&gx<nPC&&gy>=0&&gy<dC){setSelProj({i:gy,j:gx});p.redraw()}
      }
    }
    mk('s3p', s3ProjRef.current, sk)
    return () => rm('s3p')
  }, [activeStep, s3Sub, selProj, pca, geneNames, cellTypes, nC, nG, isZh])

  // ── Step 4: Elbow + PC scatter (unchanged) ──
  useEffect(() => {
    if (activeStep !== 3 || !s4ERef.current) return
    const sk = (p: any) => {
      const W = 340, H = 320, M = { t: 45, r: 25, b: 55, l: 55 }, pw = W - M.l - M.r, ph = H - M.t - M.b, bW = pw / 10
      p.setup = () => { p.createCanvas(W, H).parent(s4ERef.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        const n = varexp.length
        const cv: number[] = []; varexp.reduce((a, v) => { cv.push(a + v); return a + v }, 0)

        // Bars
        for (let i = 0; i < n; i++) {
          const bH = varexp[i] * ph, x = M.l + i * bW, y = M.t + ph - bH
          const isX = i === xPC, isY = i === yPC
          if (isX) p.fill(59, 130, 246, 220)
          else if (isY) p.fill(236, 72, 153, 220)
          else p.fill(139, 92, 246, 140)
          p.stroke(isX || isY ? (isX ? 59 : 236) + ',130,246' : '200'); p.strokeWeight(isX || isY ? 2.5 : 1)
          p.rect(x + 2, y, bW - 4, bH, 2, 2, 0, 0)
          p.noStroke(); p.fill(isX || isY ? 255 : 90); p.textSize(isX||isY?8:7)
          p.text('PC' + (i + 1), x + bW / 2, M.t + ph + 4)
        }

        // Cumulative line
        p.noFill(); p.stroke(234, 67, 53); p.strokeWeight(2); p.beginShape()
        for (let i = 0; i < n; i++) { const x = M.l + (i + 0.5) * bW, y = M.t + ph - cv[i] * ph; p.vertex(x, y) }
        p.endShape()

        // Axes
        p.stroke(150); p.strokeWeight(1); p.line(M.l, M.t + ph, M.l + pw, M.t + ph); p.line(M.l, M.t, M.l, M.t + ph)
        p.noStroke(); p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        p.text(isZh ? '主成分' : 'PC', M.l + pw / 2, M.t + ph + 18)
        p.push(); p.translate(16, M.t + ph / 2); p.rotate(-Math.PI / 2)
        p.text(isZh ? '方差解释率' : 'Variance', 0, 0); p.pop()

        // Legend
        p.fill(59, 130, 246); p.noStroke(); p.ellipse(M.l + 5, M.t + 8, 7, 7)
        p.fill(80); p.textSize(8); p.textAlign(p.LEFT, p.CENTER); p.text(isZh ? '累积' : 'Cumulative', M.l + 13, M.t + 8)

        // Selected labels
        p.fill(59, 130, 246); p.textSize(8); p.textAlign(p.LEFT, p.TOP)
        p.text('PC' + (xPC + 1) + ': ' + (varexp[xPC] * 100).toFixed(1) + '%', M.l + pw - 68, M.t + 6)
        p.fill(236, 72, 153)
        p.text('PC' + (yPC + 1) + ': ' + (varexp[yPC] * 100).toFixed(1) + '%', M.l + pw - 68, M.t + 22)
      }
      p.mousePressed = () => {
        const n = varexp.length, bW = (W - 55 - 25) / n, ph = H - 45 - 55
        const mx = p.mouseX - (M.l + 2), my = p.mouseY - M.t
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
      const W = 480, H = 360, M = { t: 50, r: 30, b: 65, l: 45 }, pw = W - M.l - M.r, ph = H - M.t - M.b
      let zm_local = zm.current, px2 = ppx.current, py2 = ppy.current
      p.setup = () => { p.createCanvas(W, H).parent(s4SRef.current!); p.textFont('Inter'); p.noLoop() }
      p.draw = () => {
        p.background(255)
        const xs = pca.projected.map((row: number[]) => row[xPC]), ys = pca.projected.map((row: number[]) => row[yPC])
        const mnX = Math.min(...xs), mxX = Math.max(...xs), mnY = Math.min(...ys), mxY = Math.max(...ys)
        const trx = (v: number) => M.l + ((v - mnX) / (mxX - mnX)) * pw * zm_local + px2
        const try_ = (v: number) => M.t + ph - ((v - mnY) / (mxY - mnY)) * ph * zm_local - py2

        // Grid
        p.stroke(240); p.strokeWeight(1)
        for (let i = 0; i <= 4; i++) { p.line(M.l + pw * i / 4, M.t, M.l + pw * i / 4, M.t + ph); p.line(M.l, M.t + ph * i / 4, M.l + pw, M.t + ph * i / 4) }
        p.stroke(150); p.strokeWeight(1); p.line(M.l, M.t + ph, M.l + pw, M.t + ph); p.line(M.l, M.t, M.l, M.t + ph)

        // Cells
        const ut = Array.from(new Set(cellTypes))
        p.textSize(8); p.textAlign(p.LEFT, p.CENTER)
        let legendY = M.t + ph + 6
        ut.forEach((t, idx) => {
          const [r, g, b] = gc(t)
          const idxs = cellTypes.map((ct: string, i: number) => ct === t ? i : -1).filter(i => i >= 0)
          idxs.forEach(i => {
            const x = trx(xs[i]), y = try_(ys[i])
            const isHov = s4Hover === i, isSel = s4Sel === i
            p.fill(r, g, b, isSel ? 240 : (isHov ? 200 : 150))
            p.stroke(isSel ? 0 : (isHov ? 80 : 200)); p.strokeWeight(isSel ? 2.5 : (isHov ? 1.5 : 1))
            p.ellipse(x, y, isSel ? 11 : 9, isSel ? 11 : 9)
          })
          // Legend
          p.fill(r, g, b, 255); p.noStroke(); p.ellipse(M.l + 8 + (idx % 3) * 65, legendY + Math.floor(idx / 3) * 13, 6, 6)
          p.fill(80); p.textSize(7); p.text(t, M.l + 16 + (idx % 3) * 65, legendY + Math.floor(idx / 3) * 13)
        })

        // Axis labels
        p.noStroke(); p.fill(80); p.textSize(10); p.textAlign(p.CENTER, p.TOP)
        p.text('PC' + (xPC + 1) + ' (' + (varexp[xPC] * 100).toFixed(1) + '%)', M.l + pw / 2, M.t + ph + 6)
        p.push(); p.translate(10, M.t + ph / 2); p.rotate(-Math.PI / 2)
        p.text('PC' + (yPC + 1) + ' (' + (varexp[yPC] * 100).toFixed(1) + '%)', 0, 0); p.pop()

        // Loading arrows (top 3 genes by loading magnitude on xPC)
        const loadX = pca.evecs.slice(0, Math.min(10, nG)).map((vec, pc) => ({ gene: geneNames[pc], load: vec[xPC] })).sort((a, b) => Math.abs(b.load) - Math.abs(a.load)).slice(0, 3)
        if (loadX.length) {
          p.fill(60); p.textSize(8); p.textAlign(p.LEFT, p.TOP)
          p.text(isZh ? 'X轴最大载荷基因:' : 'Top X loadings:', M.l + pw + 10, M.t + 5)
          loadX.forEach((lg, i) => {
            const len = 22 * Math.abs(lg.load), x0 = M.l + pw + 12, y0 = M.t + 22 + i * 20
            p.stroke(66, 133, 244); p.strokeWeight(1.5); p.line(x0, y0, x0 + len, y0)
            p.fill(80); p.textSize(7); p.text(lg.gene, x0 + len + 4, y0 - 3)
          })
        }
        const loadY = pca.evecs.slice(0, Math.min(10, nG)).map((vec, pc) => ({ gene: geneNames[pc], load: vec[yPC] })).sort((a, b) => Math.abs(b.load) - Math.abs(a.load)).slice(0, 3)
        if (loadY.length) {
          p.fill(60); p.textSize(8); p.textAlign(p.RIGHT, p.TOP)
          p.text(isZh ? 'Y轴最大载荷基因:' : 'Top Y loadings:', M.l - 10, M.t + 5)
          loadY.forEach((lg, i) => {
            const len = 22 * Math.abs(lg.load), x0 = M.l - 12, y0 = M.t + 22 + i * 20
            p.stroke(245, 158, 11); p.strokeWeight(1.5); p.line(x0, y0, x0 - len, y0)
            p.fill(80); p.textSize(7); p.textAlign(p.RIGHT, p.CENTER); p.text(lg.gene, x0 - len - 4, y0)
          })
        }

        // Tooltip for hovered/selected cell
        const selIdx = s4Sel !== null ? s4Sel : s4Hover
        if (selIdx !== null) {
          const tx = trx(xs[selIdx]), ty = try_(ys[selIdx])
          const cellLabel = cellTypes[selIdx] + ' #' + (selIdx + 1)
          const tw = p.textWidth(cellLabel) + 12
          p.fill(255, 248, 240, 245); p.stroke(255, 165, 0, 200); p.strokeWeight(1.5); p.rect(tx + 10, ty - 20, tw, 22, 4)
          p.noStroke(); p.fill(180, 100, 0); p.textSize(9); p.textAlign(p.LEFT, p.CENTER); p.text(cellLabel, tx + 16, ty - 9)
        }
      }
      p.mouseMoved = () => {
        const xs = pca.projected.map((row: number[]) => row[xPC]), ys = pca.projected.map((row: number[]) => row[yPC])
        const mnX = Math.min(...xs), mxX = Math.max(...xs), mnY = Math.min(...ys), mxY = Math.max(...ys)
        const trx = (v: number) => M.l + ((v - mnX) / (mxX - mnX)) * pw * zm.current + ppx.current
        const try_ = (v: number) => M.t + ph - ((v - mnY) / (mxY - mnY)) * ph * zm.current - ppy.current
        let found: number | null = null, minD = 15
        xs.forEach((x, i) => { const d = Math.hypot(p.mouseX - trx(x), p.mouseY - try_(ys[i])); if (d < minD) { minD = d; found = i } })
        if (found !== s4Hover) { setS4Hover(found); p.redraw() }
      }
      p.mousePressed = () => {
        if (s4Hover !== null) {
          setS4Sel(s4Hover === s4Sel ? null : s4Hover)
          p.redraw()
        } else {
          // Start pan from this point
          psx.current = p.mouseX
          psy.current = p.mouseY
          p.redraw()
        }
      }
      p.mouseDragged = () => {
        if (s4Hover === null) {
          const dx = p.mouseX - psx.current, dy = p.mouseY - psy.current
          ppx.current += dx; ppy.current += dy
          psx.current = p.mouseX; psy.current = p.mouseY
          p.redraw()
        }
      }
      p.mouseWheel = (e: any) => { zm.current = Math.max(0.5, Math.min(5, zm.current + (e.delta > 0 ? -0.12 : 0.12))); p.redraw() }
    }
    mk('s4s', s4SRef.current, sk)
    return () => rm('s4s')
  }, [activeStep, xPC, yPC, s4Hover, s4Sel, zm, ppx, ppy, pca, cellTypes, nC, varexp])

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
      </div>
    </div>
  )

  return null
}
