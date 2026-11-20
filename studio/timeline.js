/** Chronicle Studio — interactive worldline river (Canvas 2D). */
import {FIRST_YEAR,LAST_YEAR} from '../src/data.js';

/* ---------- time scale ---------- */
// "Focus" scale gives recent, denser centuries more room; "linear" is proportional.
const KNOTS=[[-3200,0],[-1000,.13],[1,.255],[1000,.41],[1500,.54],[1800,.69],[1900,.80],[1950,.875],[2026,1]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function warp(y,linear=false){
  y=clamp(y,FIRST_YEAR,LAST_YEAR);
  if(linear)return (y-FIRST_YEAR)/(LAST_YEAR-FIRST_YEAR);
  for(let i=1;i<KNOTS.length;i++){const [y1,u1]=KNOTS[i];if(y<=y1){const [y0,u0]=KNOTS[i-1];return u0+(y-y0)/(y1-y0)*(u1-u0)}}
  return 1;
}
export function unwarp(u,linear=false){
  u=clamp(u,0,1);
  if(linear)return FIRST_YEAR+u*(LAST_YEAR-FIRST_YEAR);
  for(let i=1;i<KNOTS.length;i++){const [y1,u1]=KNOTS[i];if(u<=u1){const [y0,u0]=KNOTS[i-1];return y0+(u-u0)/(u1-u0)*(y1-y0)}}
  return LAST_YEAR;
}
function slope(y,linear=false){
  if(linear)return 1/(LAST_YEAR-FIRST_YEAR);
  y=clamp(y,FIRST_YEAR,LAST_YEAR);
  for(let i=1;i<KNOTS.length;i++){const [y1,u1]=KNOTS[i];if(y<=y1){const [y0,u0]=KNOTS[i-1];return (u1-u0)/(y1-y0)}}
  return 1/(LAST_YEAR-FIRST_YEAR);
}
export const ERAS=[[-3200,-500,'eraAncient'],[-500,500,'eraClassical'],[500,1450,'eraMedieval'],[1450,1800,'eraEarlyModern'],[1800,1945,'eraModern'],[1945,2026,'eraContemporary']];

/* ---------- colors ---------- */
export const LANE_COLORS=['#e3a857','#5cc4b8','#b48cf2','#f07a8a','#6aa8f7','#9fcf6e','#e88f5a','#4fc1e0','#f2c14e','#d983c8'];
const CATEGORY={civilization:'#d4a35a',governance:'#7aa2f7',politics:'#7aa2f7',culture:'#bb9af7',religion:'#bb9af7',conflict:'#f7768e',war:'#f7768e',military:'#f7768e',technology:'#2ac3de',science:'#5fd3b5',society:'#e0af68',economy:'#e8c26a',exploration:'#9ece6a',environment:'#7fcf8a',history:'#a3abc9'};
export function categoryColor(cat){
  const key=String(cat||'history').toLowerCase().trim();
  if(CATEGORY[key])return CATEGORY[key];
  for(const k of Object.keys(CATEGORY))if(key.includes(k))return CATEGORY[k];
  let hsh=0;for(const ch of key)hsh=(hsh*31+ch.charCodeAt(0))>>>0;
  return LANE_COLORS[hsh%LANE_COLORS.length];
}
export function laneColor(branches,id){
  if(!id)return null;const i=branches.findIndex(b=>b.id===id);
  return LANE_COLORS[(i<0?0:i)%LANE_COLORS.length];
}

const RULER=46,LANE_TOP=RULER+70,LANE_GAP=80,MIN_PX=10;

export class Timeline{
  constructor(canvas,opts={}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.opts=opts;
    this.scale=0;this.originX=0;this.offsetY=0;this.linear=false;
    this.data={branches:[],baseline:[],activeId:null,selectedId:null,lang:'en',t:k=>k,formatTick:String,formatYear:String,label:e=>e.en};
    this.hits=[];this.hover=null;this.pointer=null;this.pointers=new Map();this.anim=null;this.frame=0;this.textCache=new Map();
    this.colors={};this.refreshColors();
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(canvas);
    this.bind();this.resize();
  }
  /* ----- public api ----- */
  setData(patch){Object.assign(this.data,patch);this.layout();this.invalidate()}
  setLinear(on){const c=this.centerYear();this.linear=!!on;this.fit(false);this.invalidate();return c}
  refreshColors(){
    const cs=getComputedStyle(document.documentElement),v=(n,f)=>(cs.getPropertyValue(n)||'').trim()||f;
    this.colors={ink:v('--tl-ink','#e9e6df'),muted:v('--tl-muted','#8a8f9c'),grid:v('--tl-grid','rgba(255,255,255,.05)'),eraA:v('--tl-era-a','rgba(255,255,255,.018)'),eraB:v('--tl-era-b','rgba(255,255,255,0)'),ruler:v('--tl-ruler','rgba(12,14,20,.86)'),halo:v('--tl-halo','#0d0f15'),baseline:v('--tl-baseline','#cfc6b4'),accent:v('--accent','#e3a857'),out:v('--tl-out','rgba(0,0,0,.25)'),font:v('--font-sans','system-ui, sans-serif')};
    this.textCache.clear();if(this.lanes)this.layout();this.invalidate();
  }
  get W(){return this.canvas.clientWidth||1}
  get H(){return this.canvas.clientHeight||1}
  x(year){return this.originX+warp(year,this.linear)*this.scale}
  yearAt(px){return unwarp((px-this.originX)/this.scale,this.linear)}
  centerYear(){return this.yearAt(this.W/2)}
  pxPerYear(year=this.centerYear()){return slope(year,this.linear)*this.scale}
  getView(){return {centerU:(this.W/2-this.originX)/this.scale,scale:this.scale,offsetY:this.offsetY,linear:this.linear}}
  setView(v){if(!v||!Number.isFinite(v.scale)||!Number.isFinite(v.centerU))return;this.linear=!!v.linear;this.scale=v.scale;this.originX=this.W/2-v.centerU*v.scale;this.offsetY=Number(v.offsetY)||0;this.clampView();this.invalidate()}
  fit(animate=true){this.animateTo({centerU:.5,scale:(this.W-72)/1,offsetY:0},animate)}
  zoomBy(f,px=this.W/2){this.stopAnim();const u=(px-this.originX)/this.scale;this.scale*=f;this.clampView(true);this.originX=px-u*this.scale;this.clampView();this.invalidate();this.emitView()}
  focusYear(year,pxPerYear=null,animate=true,laneId){
    const scale=pxPerYear?pxPerYear/slope(year,this.linear):this.scale;
    const index=this.laneIndex?.get(laneId);
    this.animateTo({centerU:warp(year,this.linear),scale,offsetY:index==null?undefined:this.laneOffsetFor(index)},animate);
  }
  focusRange(a,b,animate=true,laneId){
    if(b<a)[a,b]=[b,a];const u0=warp(a,this.linear),u1=warp(b,this.linear),span=Math.max(u1-u0,0.0006);
    const target={centerU:(u0+u1)/2,scale:(this.W*.72)/span};
    if(laneId!==undefined){const i=this.laneIndex.get(laneId??null);if(i!=null)target.offsetY=this.laneOffsetFor(i)}
    this.animateTo(target,animate);
  }
  focusLane(id,animate=true){
    const lane=this.lanes.find(l=>l.id===(id??null));if(!lane)return;
    if(!lane.id)return this.fit(animate);
    this.focusRange(Math.max(FIRST_YEAR,lane.start-Math.max(40,(LAST_YEAR-lane.start)*.12)),LAST_YEAR,animate,id);
  }
  laneOffsetFor(i){const want=(this.H-LANE_TOP)/2-30-i*LANE_GAP;return Math.min(0,want)}
  invalidate(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.draw()})}
  destroy(){this.ro.disconnect()}

  /* ----- internals ----- */
  resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2.5),w=this.W,h=this.H;
    const center=this.scale?this.getView():null;
    this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);
    if(center)this.setView(center);else{this.scale=(w-72);this.originX=36}
    this.clampView();this.invalidate();
  }
  minScale(){return Math.max(200,(this.W-72))}
  clampView(scaleOnly=false){
    this.scale=clamp(this.scale,this.minScale(),2.4e6);
    if(scaleOnly)return;
    const W=this.W;this.originX=clamp(this.originX,W*.5-this.scale,W*.5);
    const n=this.lanes?.length||1,minY=Math.min(0,this.H-90-(LANE_TOP+(n-1)*LANE_GAP));
    this.offsetY=clamp(this.offsetY,minY,30);
  }
  stopAnim(){if(this.anim){cancelAnimationFrame(this.anim.raf);this.anim=null}}
  animateTo(target,animate=true){
    this.stopAnim();
    const from=this.getView();
    const to={centerU:target.centerU??from.centerU,scale:clamp(target.scale??from.scale,this.minScale(),2.4e6),offsetY:target.offsetY??from.offsetY};
    if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){this.setView({...to,linear:this.linear});this.emitView();return}
    const t0=performance.now(),dur=520,ease=t=>1-Math.pow(1-t,3);
    const step=now=>{
      const k=ease(Math.min(1,(now-t0)/dur));
      const scale=Math.exp(Math.log(from.scale)+(Math.log(to.scale)-Math.log(from.scale))*k);
      this.scale=scale;this.originX=this.W/2-(from.centerU+(to.centerU-from.centerU)*k)*scale;this.offsetY=from.offsetY+(to.offsetY-from.offsetY)*k;
      this.clampView();this.draw();
      if(k<1)this.anim={raf:requestAnimationFrame(step)};else{this.anim=null;this.emitView()}
    };
    this.anim={raf:requestAnimationFrame(step)};
  }
  emitView(){clearTimeout(this.viewTimer);this.viewTimer=setTimeout(()=>this.opts.onView?.(this.getView()),120);this.opts.onFrame?.()}
  layout(){
    const {branches}=this.data,ids=new Set(branches.map(b=>b.id)),kids=new Map();
    for(const b of branches){const p=b.parentId&&ids.has(b.parentId)?b.parentId:null;if(!kids.has(p))kids.set(p,[]);kids.get(p).push(b)}
    for(const list of kids.values())list.sort((a,b)=>a.anchorYear-b.anchorYear||String(a.createdAt).localeCompare(String(b.createdAt)));
    const lanes=[{id:null,branch:null,parent:null,start:FIRST_YEAR,end:FIRST_YEAR,color:this.colors.baseline,events:this.data.baseline}];
    const walk=(pid,depth)=>{for(const b of kids.get(pid)||[]){lanes.push({id:b.id,branch:b,parent:pid,start:b.anchorYear,end:b.timeMode==='gradual'?b.transitionEndYear:b.anchorYear,color:laneColor(branches,b.id),events:b.events||[],depth});walk(b.id,depth+1)}};
    walk(null,1);
    this.lanes=lanes;this.laneIndex=new Map(lanes.map((l,i)=>[l.id,i]));
    // lineage of the active world
    const chain=new Set();let cur=branches.find(b=>b.id===this.data.activeId),guard=0;
    while(cur&&guard++<200){chain.add(cur.id);cur=branches.find(b=>b.id===cur.parentId)}
    this.chain=chain;
  }
  laneY(i){return LANE_TOP+i*LANE_GAP+this.offsetY}
  measure(text,font){const k=font+'|'+text;let w=this.textCache.get(k);if(w==null){this.ctx.font=font;w=this.ctx.measureText(text).width;if(this.textCache.size>4000)this.textCache.clear();this.textCache.set(k,w)}return w}
  fitText(text,font,max){
    if(this.measure(text,font)<=max)return text;
    let lo=0,hi=text.length;while(lo<hi){const mid=(lo+hi+1)>>1;if(this.measure(text.slice(0,mid)+'…',font)<=max)lo=mid;else hi=mid-1}
    return lo?text.slice(0,lo)+'…':'';
  }
  forkGeometry(lane){
    const i=this.laneIndex.get(lane.id),pi=this.laneIndex.get(lane.parent)??0;
    const x0=this.x(lane.start),x1=Math.max(this.x(lane.end),x0+46);
    return {x0,x1,y0:this.laneY(pi),y1:this.laneY(i)};
  }
  tracePath(ctx,lane,from=FIRST_YEAR,to=LAST_YEAR){
    const i=this.laneIndex.get(lane.id),y=this.laneY(i),xe=this.x(to);
    if(!lane.id){ctx.moveTo(this.x(from),y);ctx.lineTo(xe,y);return}
    const g=this.forkGeometry(lane);
    ctx.moveTo(g.x0,g.y0);ctx.bezierCurveTo(g.x0+(g.x1-g.x0)*.55,g.y0,g.x0+(g.x1-g.x0)*.45,g.y1,g.x1,g.y1);ctx.lineTo(Math.max(xe,g.x1),g.y1);
  }
  computeTicks(){
    const W=this.W,left=Math.max(FIRST_YEAR,this.yearAt(0)),right=Math.min(LAST_YEAR,this.yearAt(W));
    const steps=[1,2,5,10,20,25,50,100,200,250,500,1000],out=[];let y=left,guard=0,lastX=-1e9;
    while(y<right&&guard++<600){
      const ppy=slope(y,this.linear)*this.scale,step=steps.find(s=>s*ppy>=92)||1000;
      const t=Math.ceil((y+1e-7)/step)*step;if(t>right)break;
      const px=this.x(t);if(t!==0&&px-lastX>=64){out.push({year:t,x:px});lastX=px}
      y=t;
    }
    return out;
  }
  draw(){
    const ctx=this.ctx,W=this.W,H=this.H,C=this.colors,d=this.data,t=d.t;
    if(!this.lanes)this.layout();
    ctx.clearRect(0,0,W,H);this.hits=[];
    const xa=this.x(FIRST_YEAR),xb=this.x(LAST_YEAR);
    // eras
    ERAS.forEach(([a,b,key],i)=>{const x0=Math.max(this.x(a),0),x1=Math.min(this.x(b),W);if(x1<=x0)return;ctx.fillStyle=i%2?C.eraB:C.eraA;ctx.fillRect(x0,RULER,x1-x0,H-RULER)});
    if(xa>0){ctx.fillStyle=C.out;ctx.fillRect(0,RULER,xa,H-RULER)}
    if(xb<W){ctx.fillStyle=C.out;ctx.fillRect(xb,RULER,W-xb,H-RULER)}
    // grid
    const ticks=this.computeTicks();ctx.strokeStyle=C.grid;ctx.lineWidth=1;ctx.beginPath();
    for(const tk of ticks){const px=Math.round(tk.x)+.5;ctx.moveTo(px,RULER);ctx.lineTo(px,H)}ctx.stroke();
    // endpoint line
    if(xb>0&&xb<W){ctx.save();ctx.setLineDash([3,5]);ctx.strokeStyle=C.muted;ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(Math.round(xb)+.5,RULER);ctx.lineTo(Math.round(xb)+.5,H);ctx.stroke();ctx.restore()}
    const hasActive=!!d.activeId,inChain=l=>!l.id?true:this.chain.has(l.id);
    const rootAnchor=(()=>{let r=null;for(const l of this.lanes)if(l.id&&this.chain.has(l.id)&&(!l.parent||!this.chain.has(l.parent)))r=l.start;return r})();
    // lanes (dim first)
    const order=[...this.lanes].sort((a,b)=>(inChain(a)&&hasActive)-(inChain(b)&&hasActive));
    for(const lane of order){
      const i=this.laneIndex.get(lane.id),y=this.laneY(i);
      if(lane.id&&(y<RULER-LANE_GAP||y>H+LANE_GAP)&&!(this.laneY(this.laneIndex.get(lane.parent)??0)>RULER&&this.laneY(this.laneIndex.get(lane.parent)??0)<H))continue;
      const lit=!hasActive?true:inChain(lane);
      ctx.save();ctx.globalAlpha=lit?1:.32;ctx.strokeStyle=lane.color;ctx.lineCap='round';
      ctx.lineWidth=!lane.id?2:(lane.id===d.activeId?3:2);
      if(lane.id===d.activeId){ctx.shadowColor=lane.color;ctx.shadowBlur=12}
      ctx.beginPath();this.tracePath(ctx,lane);ctx.stroke();ctx.restore();
    }
    // lineage highlight over baseline
    if(hasActive&&rootAnchor!=null){
      const ac=laneColor(d.branches,d.activeId);ctx.save();ctx.strokeStyle=ac;ctx.globalAlpha=.85;ctx.lineWidth=3;ctx.lineCap='round';ctx.shadowColor=ac;ctx.shadowBlur=10;
      ctx.beginPath();const y0=this.laneY(0);ctx.moveTo(this.x(FIRST_YEAR),y0);ctx.lineTo(this.x(rootAnchor),y0);ctx.stroke();ctx.restore();
    }
    // forks + endpoints + lane labels
    for(const lane of this.lanes){
      const i=this.laneIndex.get(lane.id),y=this.laneY(i);if(y<RULER-20||y>H+20)continue;
      const lit=!hasActive||inChain(lane),active=lane.id===d.activeId||(!lane.id&&!hasActive);
      ctx.save();ctx.globalAlpha=lit?1:.4;
      if(lane.id){const g=this.forkGeometry(lane);if(g.x0>-10&&g.x0<W+10&&g.y0>RULER){ctx.fillStyle=C.halo;ctx.strokeStyle=lane.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(g.x0,g.y0,4.5,0,7);ctx.fill();ctx.stroke()}}
      if(xb>-20&&xb<W+20){
        const r=active?7:5.5;ctx.fillStyle=lane.color;ctx.beginPath();ctx.arc(xb,y,r,0,7);ctx.fill();
        if(active){ctx.strokeStyle=lane.color;ctx.globalAlpha=.35;ctx.lineWidth=6;ctx.beginPath();ctx.arc(xb,y,r+4,0,7);ctx.stroke();ctx.globalAlpha=1}
        ctx.fillStyle=C.halo;ctx.beginPath();ctx.arc(xb,y,2,0,7);ctx.fill();
        this.hits.push({kind:'world',id:lane.id,x:xb,y,r:12});
      }
      ctx.restore();
    }
    // events
    for(const lane of this.lanes){
      const i=this.laneIndex.get(lane.id),y=this.laneY(i);if(y<RULER-10||y>H+30)continue;
      const lit=!hasActive||inChain(lane);
      this.drawLane(lane,y,lit);
    }
    // ruler
    ctx.fillStyle=C.ruler;ctx.fillRect(0,0,W,RULER);ctx.fillStyle=C.grid;ctx.fillRect(0,RULER-1,W,1);
    ctx.textBaseline='middle';
    for(const [a,b,key] of ERAS){const x0=Math.max(this.x(a),0),x1=Math.min(this.x(b),W);if(x1-x0<60)continue;const label=t(key).toUpperCase(),f=`600 9.5px ${C.font}`;ctx.font=f;ctx.fillStyle=C.muted;ctx.globalAlpha=.75;const w=this.measure(label,f);ctx.fillText(label,clamp((x0+x1)/2-w/2,x0+8,x1-w-8),13);ctx.globalAlpha=1;
      if(this.x(a)>0&&this.x(a)<W){ctx.fillStyle=C.grid;ctx.fillRect(Math.round(this.x(a)),4,1,18)}}
    ctx.font=`500 11px ${C.font}`;ctx.fillStyle=C.ink;
    for(const tk of ticks){const s=d.formatTick(tk.year),w=this.measure(s,ctx.font);ctx.globalAlpha=.8;ctx.fillText(s,tk.x-w/2,32);ctx.globalAlpha=1;ctx.fillStyle=C.muted;ctx.fillRect(Math.round(tk.x),RULER-5,1,4);ctx.fillStyle=C.ink}
    // hover year
    if(this.pointer&&!this.dragging&&this.pointer.y>RULER&&!this.hover){
      const px=this.pointer.x,yr=Math.round(this.yearAt(px));if(px>=xa&&px<=xb&&yr!==0){
        ctx.save();ctx.strokeStyle=C.accent;ctx.globalAlpha=.45;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(Math.round(px)+.5,RULER);ctx.lineTo(Math.round(px)+.5,H);ctx.stroke();ctx.restore();
        const s=d.formatYear(yr),f=`600 11px ${C.font}`,w=this.measure(s,f)+14;ctx.fillStyle=C.accent;this.roundRect(px-w/2,RULER-15,w,18,9);ctx.fill();ctx.fillStyle=C.halo;ctx.font=f;ctx.fillText(s,px-w/2+7,RULER-6);
      }
    }
    this.opts.onFrame?.();
  }
  drawLane(lane,y,lit){
    const ctx=this.ctx,W=this.W,C=this.colors,d=this.data;
    const items=[];for(const e of lane.events){if(!Number.isFinite(e.year))continue;const px=this.x(e.year);if(px<-30||px>W+30)continue;items.push({e,px})}
    items.sort((a,b)=>a.px-b.px);
    const groups=[];for(const it of items){const g=groups.at(-1);if(g&&it.px-g.last<MIN_PX){g.items.push(it);g.last=it.px}else groups.push({items:[it],last:it.px})}
    const occupied={up:[],down:[]};
    // lane title pill
    const startX=lane.id?this.forkGeometry(lane).x1+10:Math.max(this.x(FIRST_YEAR)+10,12);
    const titleX=Math.max(startX,12),title=lane.id?(d.worldTitle?.(lane.branch)||''):d.t('reality');
    if(titleX<this.x(LAST_YEAR)-70&&titleX<W-40){
      const f=`650 11.5px ${C.font}`,txt=this.fitText(title,f,Math.min(260,this.x(LAST_YEAR)-titleX-40)),w=this.measure(txt,f)+22;
      if(txt){ctx.save();ctx.globalAlpha=lit?1:.45;ctx.fillStyle=C.halo;ctx.strokeStyle=lane.color;ctx.lineWidth=1;this.roundRect(titleX,y-37,w,20,10);ctx.fill();ctx.globalAlpha*=.75;ctx.stroke();ctx.globalAlpha=lit?1:.45;
        ctx.fillStyle=lane.color;ctx.beginPath();ctx.arc(titleX+9,y-27,3,0,7);ctx.fill();ctx.fillStyle=C.ink;ctx.font=f;ctx.textBaseline='middle';ctx.fillText(txt,titleX+16,y-26.5);ctx.restore();
        occupied.up.push([titleX-4,titleX+w+4]);this.hits.push({kind:'world',id:lane.id,rect:[titleX,y-37,w,20]})}
    }
    const nodes=[];
    for(const g of groups){
      if(g.items.length===1){const {e,px}=g.items[0];nodes.push({e,px,single:true})}
      else{const px=g.items.reduce((s,i)=>s+i.px,0)/g.items.length;nodes.push({px,group:g.items.map(i=>i.e),single:false})}
    }
    ctx.save();ctx.globalAlpha=lit?1:.38;
    for(const n of nodes){
      if(n.single){
        const e=n.e,sel=e.id===d.selectedId,hov=this.hover?.kind==='event'&&this.hover.id===e.id,ms=e.milestone||e.origin==='recorded';
        const r=(ms?5:4)+(hov?1.5:0)+(sel?1.5:0),col=categoryColor(e.category);
        if(sel){ctx.strokeStyle=C.accent;ctx.lineWidth=2;ctx.beginPath();ctx.arc(n.px,y,r+5,0,7);ctx.stroke()}
        ctx.fillStyle=C.halo;ctx.beginPath();ctx.arc(n.px,y,r+2,0,7);ctx.fill();
        ctx.fillStyle=col;ctx.beginPath();ctx.arc(n.px,y,r,0,7);ctx.fill();
        if(e.origin==='user'){ctx.fillStyle=C.halo;ctx.beginPath();ctx.arc(n.px,y,1.6,0,7);ctx.fill()}
        this.hits.push({kind:'event',id:e.id,branchId:lane.id,event:e,x:n.px,y,r:r+5});
        n.prio=sel?0:hov?1:e.milestone?2:e.origin==='recorded'?3:4;
      }else{
        const r=Math.min(15,8+Math.log2(n.group.length)*2.2),hov=this.hover?.kind==='cluster'&&Math.abs(this.hover.x-n.px)<1;
        ctx.fillStyle=C.halo;ctx.beginPath();ctx.arc(n.px,y,r+2.5,0,7);ctx.fill();
        ctx.fillStyle=lane.color;ctx.globalAlpha=(lit?1:.38)*(hov?1:.88);ctx.beginPath();ctx.arc(n.px,y,r,0,7);ctx.fill();ctx.globalAlpha=lit?1:.38;
        ctx.fillStyle=C.halo;ctx.font=`700 10px ${C.font}`;ctx.textBaseline='middle';const s=String(n.group.length);ctx.fillText(s,n.px-this.measure(s,ctx.font)/2,y+.5);
        const years=n.group.map(e=>e.year);
        this.hits.push({kind:'cluster',x:n.px,y,r:r+4,from:Math.min(...years),to:Math.max(...years),branchId:lane.id,events:n.group});
        n.prio=5;
      }
    }
    // labels
    const fits=(row,a,b)=>!occupied[row].some(([p,q])=>a<q+8&&b>p-8);
    const sorted=nodes.filter(n=>n.single).sort((a,b)=>a.prio-b.prio);
    for(const n of sorted){
      const sel=n.prio===0,f=`${sel?650:500} 11.5px ${C.font}`,txt=this.fitText(d.label(n.e),f,sel?260:170);if(!txt)continue;
      const w=this.measure(txt,f),a=n.px-w/2,b=n.px+w/2;let row=null;
      if(fits('up',a,b))row='up';else if(fits('down',a,b))row='down';
      if(!row)continue;occupied[row].push([a,b]);
      const ty=row==='up'?y-15:y+18;ctx.font=f;ctx.textBaseline='middle';ctx.lineJoin='round';
      ctx.strokeStyle=C.halo;ctx.lineWidth=4;ctx.strokeText(txt,a,ty);
      ctx.fillStyle=sel?C.accent:C.ink;ctx.globalAlpha=(lit?1:.38)*(n.prio<=2?1:.82);ctx.fillText(txt,a,ty);ctx.globalAlpha=lit?1:.38;
      this.hits.push({kind:'event',id:n.e.id,branchId:lane.id,event:n.e,rect:[a,ty-8,w,16]});
    }
    ctx.restore();
  }
  roundRect(x,y,w,h,r){const c=this.ctx;c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  hitTest(px,py){
    let best=null,bd=1e9;
    for(let i=this.hits.length-1;i>=0;i--){const h=this.hits[i];
      if(h.rect){const [x,y,w,hh]=h.rect;if(px>=x&&px<=x+w&&py>=y&&py<=y+hh)return h;continue}
      const dd=Math.hypot(px-h.x,py-h.y);if(dd<=h.r&&dd<bd){best=h;bd=dd}}
    if(best)return best;
    return null;
  }
  bind(){
    const c=this.canvas,pos=e=>{const r=c.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
    c.addEventListener('pointerdown',e=>{
      c.setPointerCapture(e.pointerId);const p=pos(e);this.pointers.set(e.pointerId,p);this.stopAnim();
      if(this.pointers.size===2){const [a,b]=[...this.pointers.values()];this.pinch={d:Math.hypot(a.x-b.x,a.y-b.y),scale:this.scale};this.drag=null;return}
      this.drag={x:p.x,y:p.y,ox:this.originX,oy:this.offsetY,moved:false};
    });
    c.addEventListener('pointermove',e=>{
      const p=pos(e);this.pointer=p;
      if(this.pointers.has(e.pointerId))this.pointers.set(e.pointerId,p);
      if(this.pinch&&this.pointers.size===2){const [a,b]=[...this.pointers.values()],dd=Math.hypot(a.x-b.x,a.y-b.y),mid=(a.x+b.x)/2;const u=(mid-this.originX)/this.scale;this.scale=this.pinch.scale*dd/this.pinch.d;this.clampView(true);this.originX=mid-u*this.scale;this.clampView();this.invalidate();this.emitView();return}
      if(this.drag){const dx=p.x-this.drag.x,dy=p.y-this.drag.y;if(!this.drag.moved&&Math.hypot(dx,dy)>4){this.drag.moved=true;this.dragging=true;c.classList.add('dragging');this.setHover(null)}
        if(this.drag.moved){this.originX=this.drag.ox+dx;this.offsetY=this.drag.oy+dy;this.clampView();this.invalidate();this.emitView();return}}
      this.setHover(this.hitTest(p.x,p.y),e);this.invalidate();
    });
    const end=e=>{
      const p=pos(e),wasDrag=this.drag?.moved;this.pointers.delete(e.pointerId);if(this.pointers.size<2)this.pinch=null;
      if(this.drag&&!wasDrag&&e.type==='pointerup'){const h=this.hitTest(p.x,p.y);this.click(h)}
      this.drag=null;this.dragging=false;c.classList.remove('dragging');
    };
    c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);
    c.addEventListener('pointerleave',()=>{this.pointer=null;this.setHover(null);this.invalidate()});
    c.addEventListener('wheel',e=>{
      e.preventDefault();const p=pos(e);this.stopAnim();
      if(e.shiftKey){this.offsetY-=e.deltaY||e.deltaX;this.clampView();this.invalidate();this.emitView();return}
      if(e.ctrlKey||Math.abs(e.deltaY)>Math.abs(e.deltaX)){const k=e.deltaMode===1?40:1;this.zoomBy(Math.exp(-e.deltaY*k*(e.ctrlKey?.01:.0018)),p.x)}
      else{this.originX-=e.deltaX;this.clampView();this.invalidate();this.emitView()}
    },{passive:false});
    c.addEventListener('dblclick',e=>{const p=pos(e);if(!this.hitTest(p.x,p.y)){const y=this.yearAt(p.x);this.focusYear(y,this.pxPerYear(y)*2.2)}});
  }
  setHover(h,e){
    const same=(a,b)=>a===b||(a&&b&&a.kind===b.kind&&a.id===b.id&&a.x===b.x);
    if(same(h,this.hover)){if(h&&e)this.opts.onHover?.(h,e);return}
    this.hover=h;this.canvas.style.cursor=h?'pointer':'';this.opts.onHover?.(h,e);
  }
  click(h){
    if(!h){this.opts.onBackground?.();return}
    if(h.kind==='event')this.opts.onEvent?.(h.event,h.branchId);
    else if(h.kind==='cluster'){const pad=Math.max(2,(h.to-h.from)*.35);this.focusRange(h.from-pad,h.to+pad)}
    else if(h.kind==='world')this.opts.onWorld?.(h.id);
  }
}

/** Overview strip under the canvas: whole range, lanes and current viewport. */
export class Minimap{
  constructor(canvas,timeline){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.tl=timeline;
    new ResizeObserver(()=>this.resize()).observe(canvas);this.resize();
    const pos=e=>e.clientX-canvas.getBoundingClientRect().left;
    const jump=(e,anim)=>{const u=clamp((pos(e)-8)/(this.canvas.clientWidth-16),0,1);this.tl.animateTo({centerU:u},anim)};
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);this.down=true;jump(e,false)});
    canvas.addEventListener('pointermove',e=>{if(this.down)jump(e,false)});
    canvas.addEventListener('pointerup',()=>{this.down=false});
  }
  resize(){const dpr=Math.min(window.devicePixelRatio||1,2.5);this.canvas.width=Math.round(this.canvas.clientWidth*dpr);this.canvas.height=Math.round(this.canvas.clientHeight*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);this.draw()}
  draw(){
    const ctx=this.ctx,W=this.canvas.clientWidth,H=this.canvas.clientHeight,tl=this.tl,C=tl.colors,lin=tl.linear;if(!W)return;
    const X=y=>8+warp(y,lin)*(W-16);ctx.clearRect(0,0,W,H);
    ERAS.forEach(([a,b,key],i)=>{ctx.fillStyle=i%2?C.eraB:C.eraA;ctx.fillRect(X(a),0,X(b)-X(a),H);if(X(b)-X(a)>54){ctx.fillStyle=C.muted;ctx.globalAlpha=.55;ctx.font=`600 8.5px ${C.font}`;ctx.textBaseline='top';ctx.fillText(tl.data.t(key).toUpperCase(),X(a)+5,4);ctx.globalAlpha=1}});
    const lanes=tl.lanes||[],n=lanes.length,gap=Math.min(5,(H-22)/Math.max(n,1));
    lanes.forEach((l,i)=>{const y=18+i*gap;ctx.fillStyle=l.color;ctx.globalAlpha=!tl.data.activeId||!l.id||tl.chain.has(l.id)?.9:.35;ctx.fillRect(X(l.id?l.start:FIRST_YEAR),y,X(LAST_YEAR)-X(l.id?l.start:FIRST_YEAR),1.5);
      for(const e of l.events){if(Number.isFinite(e.year))ctx.fillRect(X(e.year),y-1.5,1,4.5)}});
    ctx.globalAlpha=1;
    const u0=(0-tl.originX)/tl.scale,u1=(tl.W-tl.originX)/tl.scale,a=8+clamp(u0,0,1)*(W-16),b=8+clamp(u1,0,1)*(W-16);
    ctx.fillStyle=C.accent;ctx.globalAlpha=.12;ctx.fillRect(a,1,Math.max(3,b-a),H-2);ctx.globalAlpha=.9;ctx.strokeStyle=C.accent;ctx.lineWidth=1.2;tl.roundRect.call({ctx},a,1,Math.max(3,b-a),H-2,4);ctx.stroke();ctx.globalAlpha=1;
  }
}
