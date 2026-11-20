/** Chronicle Studio — application shell. Reuses the project's engine modules in ../src. */
import {BASELINE,FIRST_YEAR,LAST_YEAR,displayYear,eventLabel} from '../src/data.js';
import {EXAMPLES} from '../src/examples.js';
import {DEFAULT_CONFIG,PROVIDERS,IMAGE_PROVIDERS,safeConfig,configured,imageConfigured,validEndpoint,makeId,simulate,exploreCore,generateImage,explainError,worldEvents,worldFacts,sanitizeWorldline,dialogueEntries,sanitizeChats,callChat} from '../src/core.js';
import {mergeKnowledge,sanitizeKnowledge} from '../src/exploration-knowledge.mjs';
import {planWorldlineDeletion} from '../src/worldline-deletion.mjs';
import {formatAnswer} from '../src/answer-format.js';
import {renderUsageDashboard} from '../src/usage-dashboard.mjs';
import {setUsagePrice,clearUsageMeter} from '../src/usage-meter.mjs';
import {Timeline,Minimap,ERAS,categoryColor,laneColor} from './timeline.js';
import {translate} from './i18n.js';

/* ================= utilities ================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clip=(s,n)=>{s=String(s??'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s};
const P={
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
 branch:'<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="9" r="2"/><path d="M6 7v10M18 11c0 4-5 4-10 6"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
 db:'<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8v-13M4.5 12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8"/>',
 core:'<path d="M12 3l2.2 4.6L19 9l-3.5 3.4.8 4.9L12 15l-4.3 2.3.8-4.9L5 9l4.8-1.4Z"/>',
 chat:'<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 9"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>',
 arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',up:'<path d="M12 19V5M6 11l6-6 6 6"/>',back:'<path d="m15 18-6-6 6-6"/>',chev:'<path d="m9 6 6 6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',
 fit:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/>',
 fullscreen:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 11V8h3m7 5v3h-3"/>',
 download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
 edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
 stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',sidebar:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
 refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',shuffle:'<path d="M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5"/>',
 check:'<path d="m5 12 5 5 9-10"/>',ruler:'<path d="M3 17 17 3l4 4L7 21Z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
 eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',key:'<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
};
const icon=(n,s=16)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||P.spark}</svg>`;

/* ================= persistent state ================= */
const STATE_KEY='chronicle-of-ages-v1',CONFIG_KEY='chronicle-of-ages-connection-v1',THEME_KEY='chronicle-of-ages-theme',UI_KEY='chronicle-of-ages-studio-v1';
const PREVIOUS_UI_KEY='chronicle-of-ages-workspace-v1';
function loadState(){
 try{const d=JSON.parse(localStorage.getItem(STATE_KEY)||'{}');const branches=Array.isArray(d.branches)?d.branches.map(sanitizeWorldline).filter(Boolean):[];
  return {lang:d.lang==='zh'?'zh':(d.lang==='en'?'en':(navigator.language||'').startsWith('zh')?'zh':'en'),autoComplete:d.autoComplete!==false,branches,activeId:branches.some(b=>b.id===d.activeId)?d.activeId:null,chats:d.chats&&typeof d.chats==='object'?d.chats:{},baselineKnowledge:Array.isArray(d.baselineKnowledge)?d.baselineKnowledge.map(sanitizeKnowledge).filter(Boolean):[]}}
 catch{return {lang:'en',autoComplete:true,branches:[],activeId:null,chats:{},baselineKnowledge:[]}}
}
const state=loadState();
let config;
try{const s=JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}');const key=s.remember?s.key:(sessionStorage.getItem('chronicle-key')||'');const imageKey=s.remember?(s.imageKey||(s.imageModel?s.key:'')):(sessionStorage.getItem('chronicle-image-key')||(s.imageModel?key:''));config=safeConfig({...s,key,imageKey})}catch{config={...DEFAULT_CONFIG}}
function loadWorkspace(){
 try{
  const saved=JSON.parse(localStorage.getItem(UI_KEY)||'null');
  if(saved)return saved;
  const previous=JSON.parse(localStorage.getItem(PREVIOUS_UI_KEY)||'null');
  if(previous?.version!==1)return {};
  state.activeId=state.branches.some(b=>b.id===previous.activeId)?previous.activeId:null;
  const tabs={event:previous.selected?.source==='database'?'database':'chronicle',fact:'database',cluster:'chronicle',knowledge:'database',core:'core',image:'visual'};
  const view=['event','fact'].includes(previous.selected?.kind)&&typeof previous.selected.id==='string'?previous.selected:null;
  return {
   tab:tabs[previous.tab]||'overview',dbTab:previous.databaseTab==='dialogue'?'dialogue':'facts',
   dbQuery:previous.factQuery,detail:view,mobile:previous.mobilePanel?'inspector':null,
   input:previous.input,coreDrafts:previous.coreDrafts,imageDrafts:previous.imageDrafts,legacyViewport:previous.viewport,
   settings:previous.modal==='settings',scroll:previous.tab==='core'?previous.chatScroll:previous.panelScroll,
  };
 }catch{return {}}
}
const savedUI=loadWorkspace();
const ui={
 tab:['overview','chronicle','database','core','visual'].includes(savedUI.tab)?savedUI.tab:'overview',view:savedUI.detail||null,
 dbTab:['events','facts','dialogue'].includes(savedUI.dbTab)?savedUI.dbTab:'events',dbQuery:typeof savedUI.dbQuery==='string'?savedUI.dbQuery:'',chronQuery:'',chronScope:'all',chronCat:null,
 sidebar:savedUI.sidebar!==false,inspector:savedUI.inspector!==false,inspectorW:Number(savedUI.inspectorW)||440,
 input:typeof savedUI.input==='string'?savedUI.input:'',parentId:savedUI.parentId,coreDrafts:savedUI.coreDrafts||{},imageDrafts:savedUI.imageDrafts||{},
 narrativeOpen:false,busy:null,ask:null,imageBusy:false,modal:null,settingsTab:savedUI.settingsTab||'text',ideas:[],mobile:savedUI.mobile||null,
};
let theme;try{theme=localStorage.getItem(THEME_KEY)}catch{}
if(theme!=='dark'&&theme!=='light')theme=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';

/* ================= helpers ================= */
const L=()=>state.lang;
const T=(k,v)=>translate(state.lang,k,v);
const zh=()=>state.lang==='zh';
const active=()=>state.branches.find(b=>b.id===state.activeId)||null;
const byId=id=>id?state.branches.find(b=>b.id===id)||null:null;
const worldTitle=b=>b?((zh()?b.titleZh||b.titleEn:b.titleEn||b.titleZh)||b.prompt||'—'):T('reality');
const worldSummary=b=>b?((zh()?b.summaryZh||b.summaryEn:b.summaryEn||b.summaryZh)||''):T('realityDesc');
const evTitle=e=>eventLabel(e,L());
const evDesc=e=>zh()?(e.descriptionZh||e.descriptionEn||e.text||''):(e.descriptionEn||e.descriptionZh||e.text||'');
const factName=f=>zh()?(f.nameZh||f.nameEn||f.name):(f.nameEn||f.nameZh||f.name);
const factDesc=f=>zh()?(f.descriptionZh||f.descriptionEn||f.text||''):(f.descriptionEn||f.descriptionZh||f.text||'');
const yr=y=>displayYear(y,L());
const shortYear=y=>y<0?(zh()?`前${-y}`:`${-y} BCE`):(zh()?`${y}`:`${y}`);
const yearPill=y=>y<0?(zh()?`前${-y}年`:`${-y} BCE`):(zh()?`${y}年`:`${y} CE`);
const ids=()=>new Set(state.branches.map(b=>b.id));
const parentOf=b=>b&&b.parentId&&byId(b.parentId)?b.parentId:null;
const childrenOf=id=>state.branches.filter(b=>parentOf(b)===(id||null)).sort((a,c)=>a.anchorYear-c.anchorYear);
function lineage(b){const out=[],seen=new Set();while(b&&!seen.has(b.id)){seen.add(b.id);out.unshift(b);b=byId(parentOf(b))}return out}
function descendants(id){let n=0;for(const c of childrenOf(id))n+=1+descendants(c.id);return n}
const eventsOf=b=>worldEvents(state.branches,b);
const factsOf=b=>b?worldFacts(state.branches,b):state.baselineKnowledge;
const colorOf=b=>b?laneColor(state.branches,b.id):'var(--baseline)';
const chatKey=()=>active()?.id||'baseline';
function originOf(e,b){
 if(e.origin==='recorded')return 'recorded';
 if(b&&(b.events||[]).some(x=>x.id===e.id))return e.origin==='user'?'yours':'derived';
 return e.origin==='user'?'yours':'inherited';
}
function factOrigin(f,b){
 const own=b?[...(b.facts||[]),...(b.knowledge||[])]:state.baselineKnowledge;
 if(!own.some(x=>x.id===f.id))return 'inherited';
 return f.userAuthored?'yours':'derived';
}
const editableEvent=e=>{const b=active();return !!b&&(b.events||[]).some(x=>x.id===e.id)};
const editableFact=f=>{const b=active();const own=b?[...(b.facts||[]),...(b.knowledge||[])]:state.baselineKnowledge;return own.some(x=>x.id===f.id)};
function findEvent(id,branchId){
 const b=branchId!==undefined?byId(branchId):active();
 return eventsOf(b).find(e=>e.id===id)||eventsOf(active()).find(e=>e.id===id)||state.branches.flatMap(x=>x.events||[]).find(e=>e.id===id)||BASELINE.find(e=>e.id===id)||null;
}
const findFact=id=>factsOf(active()).find(f=>f.id===id)||null;
const prose=v=>typeof v==='string'?v:v==null?'':JSON.stringify(v,null,2);
const tag=(o)=>`<span class="tag tag-${o}">${h(T(o))}</span>`;
function eraOf(y){for(const [a,b,k] of ERAS)if(y<b||b===LAST_YEAR)return k;return 'eraContemporary'}

/* ================= persistence ================= */
function persist(){
 try{localStorage.setItem(STATE_KEY,JSON.stringify({version:2,lang:state.lang,autoComplete:state.autoComplete,branches:state.branches,activeId:state.activeId,chats:state.chats,baselineKnowledge:state.baselineKnowledge}));return true}
 catch{toast(T('errStorage'),'error');return false}
}
let uiTimer;
function saveWorkspace(){
 clearTimeout(uiTimer);
 const detail=['event','fact'].includes(ui.view?.kind)?ui.view:null;
 const snapshot={
  tab:ui.tab,dbTab:ui.dbTab,dbQuery:ui.dbQuery,sidebar:ui.sidebar,inspector:ui.inspector,inspectorW:ui.inspectorW,
  input:ui.input,parentId:ui.parentId,coreDrafts:ui.coreDrafts,imageDrafts:ui.imageDrafts,
  view:timeline.getView(),detail,mobile:ui.mobile,scroll:$('#insp-body').scrollTop,settings:ui.modal==='settings',settingsTab:ui.settingsTab,
 };
 try{localStorage.setItem(UI_KEY,JSON.stringify(snapshot))}catch{}
}
function saveUI(){clearTimeout(uiTimer);uiTimer=setTimeout(saveWorkspace,200)}
function persistConfig(){
 const c={...config};if(!c.remember){delete c.key;delete c.imageKey}
 localStorage.setItem(CONFIG_KEY,JSON.stringify(c));
 for(const [n,k] of [['chronicle-key',config.key],['chronicle-image-key',config.imageKey]]){if(!config.remember&&k)sessionStorage.setItem(n,k);else sessionStorage.removeItem(n)}
}

/* ================= toast & dialogs ================= */
function toast(msg,kind='info'){
 const root=$('#toast-root'),el=document.createElement('div');el.className=`toast toast-${kind}`;el.setAttribute('role',kind==='error'?'alert':'status');
 el.innerHTML=`<span class="toast-icon">${icon(kind==='error'?'close':kind==='success'?'check':'spark',14)}</span><span class="toast-msg"></span><button class="toast-x" aria-label="${h(T('close'))}">${icon('close',13)}</button>`;
 el.querySelector('.toast-msg').textContent=msg;el.querySelector('.toast-x').onclick=()=>dismiss();
 root.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));
 const dismiss=()=>{el.classList.remove('in');setTimeout(()=>el.remove(),250)};
 if(kind!=='error')setTimeout(dismiss,3800);else setTimeout(dismiss,12000);
}
function confirmDialog({title,body,danger=false,ok}){
 return new Promise(resolve=>{
  const root=document.createElement('div');root.className='modal-backdrop confirm-backdrop';
  root.innerHTML=`<div class="modal confirm" role="alertdialog" aria-modal="true"><h3>${h(title)}</h3>${body?`<p>${h(body).replace(/\n/g,'<br>')}</p>`:''}<div class="modal-actions"><button class="btn ghost" data-r="0">${h(T('cancel'))}</button><button class="btn ${danger?'danger':'primary'}" data-r="1">${h(ok||T('confirm'))}</button></div></div>`;
  const done=v=>{root.classList.remove('in');setTimeout(()=>root.remove(),180);document.removeEventListener('keydown',key,true);resolve(v)};
  const key=e=>{if(e.key==='Escape'){e.stopPropagation();done(false)}if(e.key==='Enter'){e.preventDefault();done(true)}};
  root.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(b)done(b.dataset.r==='1');else if(e.target===root)done(false)});
  document.addEventListener('keydown',key,true);document.body.appendChild(root);requestAnimationFrame(()=>root.classList.add('in'));root.querySelector('[data-r="1"]').focus();
 });
}

/* ================= shell ================= */
let timeline,minimap;
function mount(){
 document.getElementById('app').innerHTML=`
<div class="shell" id="shell">
 <header class="topbar">
  <button class="icon-btn mobile-only" data-action="toggle-sidebar" aria-label="Menu">${icon('menu',18)}</button>
  <div class="brand"><img src="./assets/app-icon.svg" width="30" height="30" alt=""><div class="brand-text"><div class="brand-name">Chronicle of Ages</div><div class="brand-sub" id="brand-sub"></div></div></div>
  <nav class="crumbs" id="crumbs" aria-label="Lineage"></nav>
  <div class="top-actions">
   <button class="search-trigger" data-action="palette" id="search-trigger">${icon('search',15)}<span id="search-label"></span><kbd>Ctrl K</kbd></button>
   <div class="seg seg-sm" role="group" aria-label="Language"><button data-action="lang" data-value="en" id="lang-en">EN</button><button data-action="lang" data-value="zh" id="lang-zh">中</button></div>
   <button class="icon-btn" data-action="theme" id="theme-btn"></button>
   <button class="icon-btn settings-btn" data-action="settings" id="settings-btn">${icon('settings',18)}<span class="status-dot" id="status-dot"></span></button>
  </div>
 </header>
 <div class="body" id="body">
  <aside class="sidebar" id="sidebar"></aside>
  <main class="stage">
   <div class="stage-head" id="stage-head"></div>
   <div class="canvas-wrap" id="canvas-wrap">
    <canvas id="timeline" aria-label="Interactive timeline. Drag to pan, scroll to zoom."></canvas>
    <div class="tl-tooltip" id="tooltip" hidden></div>
    <div class="tl-controls glass" id="tl-controls"></div>
    <div class="dock">
     <form class="composer glass" id="composer" autocomplete="off">
      <div class="composer-top"><span class="composer-label">${icon('spark',14)}<span id="composer-label"></span></span><label class="parent-pick"><span id="branch-from"></span><select id="parent-select"></select></label></div>
      <textarea id="prompt" rows="1" maxlength="2000"></textarea>
      <div class="composer-bottom"><div class="ideas" id="ideas"></div><div class="composer-actions"><span class="kbd-hint" id="kbd-hint"></span><button type="submit" class="btn primary" id="sim-btn"></button></div></div>
      <div class="composer-connect" id="composer-connect" hidden></div>
     </form>
     <div class="busy-card glass" id="busy-card" hidden></div>
    </div>
   </div>
   <div class="minimap"><canvas id="minimap" aria-hidden="true"></canvas></div>
  </main>
  <div class="resizer" id="resizer" role="separator" aria-orientation="vertical" tabindex="0"></div>
  <aside class="inspector" id="inspector">
   <div class="insp-tabs" id="insp-tabs" role="tablist"></div>
   <div class="insp-body" id="insp-body"></div>
   <form class="core-form" id="core-form" hidden autocomplete="off"><textarea id="core-q" rows="1" maxlength="1800"></textarea><button type="submit" class="send-btn" id="core-send"></button></form>
  </aside>
  <button class="scrim" id="scrim" data-action="close-drawers" aria-label="Close"></button>
 </div>
</div>`;
 timeline=new Timeline($('#timeline'),{
  onEvent:(e,branchId)=>selectEventFromTimeline(e,branchId),
  onWorld:id=>{setActive(id??null);openTab('overview')},
  onHover:showTooltip,onView:()=>saveUI(),
  onFrame:()=>{if(minimap&&!minimapQueued){minimapQueued=true;requestAnimationFrame(()=>{minimapQueued=false;minimap.draw()})}},
 });
 minimap=new Minimap($('#minimap'),timeline);
 document.addEventListener('click',onClick);document.addEventListener('submit',onSubmit);document.addEventListener('input',onInput);document.addEventListener('change',onChange);document.addEventListener('keydown',onKey);
 const p=$('#prompt');p.value=ui.input;autoGrow(p);p.addEventListener('focus',()=>$('#composer').classList.add('focused'));p.addEventListener('blur',()=>$('#composer').classList.remove('focused'));
 const cq=$('#core-q');cq.addEventListener('input',()=>autoGrow(cq,140));
 $('#import-file').addEventListener('change',importFile);
 setupResizer();shuffleIdeas();applyTheme();render();
 if(savedUI.view)timeline.setView(savedUI.view);
 else if(Number.isFinite(savedUI.legacyViewport?.year)&&savedUI.legacyViewport.zoom>0)timeline.focusYear(savedUI.legacyViewport.year,savedUI.legacyViewport.zoom,false);
 else timeline.fit(false);
 if(Number.isFinite(savedUI.scroll))$('#insp-body').scrollTop=savedUI.scroll;
 if(savedUI.settings)openSettings();
 $('#insp-body').addEventListener('scroll',saveUI);
 document.addEventListener('fullscreenchange',renderControls);
 window.addEventListener('chronicle-usage-updated',()=>{if(ui.modal==='settings')refreshUsage()});
 window.addEventListener('pagehide',saveWorkspace);
 window.addEventListener('beforeunload',e=>{if(ui.busy){e.preventDefault();e.returnValue=''}});
}
let minimapQueued=false;
function autoGrow(el,max=170){el.style.height='auto';el.style.height=Math.min(max,el.scrollHeight)+'px'}
function setupResizer(){
 const r=$('#resizer'),body=$('#body');body.style.setProperty('--insp-w',ui.inspectorW+'px');
 const set=w=>{ui.inspectorW=Math.round(Math.max(340,Math.min(Math.min(860,body.clientWidth-460),w)));body.style.setProperty('--insp-w',ui.inspectorW+'px');saveUI()};
 r.addEventListener('pointerdown',e=>{r.setPointerCapture(e.pointerId);document.body.classList.add('resizing')});
 r.addEventListener('pointermove',e=>{if(r.hasPointerCapture(e.pointerId))set(body.getBoundingClientRect().right-e.clientX)});
 r.addEventListener('pointerup',e=>{r.releasePointerCapture(e.pointerId);document.body.classList.remove('resizing')});
 r.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')set(ui.inspectorW+24);if(e.key==='ArrowRight')set(ui.inspectorW-24)});
}
function applyTheme(){
 document.documentElement.dataset.theme=theme;
 const b=$('#theme-btn');if(b){b.innerHTML=icon(theme==='dark'?'sun':'moon',18);b.title=T('theme');b.setAttribute('aria-label',T('theme'))}
 timeline?.refreshColors();minimap?.draw();
}
const isMobile=()=>matchMedia('(max-width: 900px)').matches;

/* ================= render ================= */
function render(){
 saveUI();
 document.documentElement.lang=zh()?'zh-CN':'en';
 document.title=`${active()?worldTitle(active())+' · ':''}Chronicle of Ages`;
 const shell=$('#shell');shell.classList.toggle('no-sidebar',!ui.sidebar);shell.classList.toggle('no-inspector',!ui.inspector);
 shell.classList.toggle('m-sidebar',ui.mobile==='sidebar');shell.classList.toggle('m-inspector',ui.mobile==='inspector');
 $('#brand-sub').textContent=T('brandSub');$('#search-label').textContent=T('search');
 $('#lang-en').classList.toggle('on',!zh());$('#lang-zh').classList.toggle('on',zh());
 $('#settings-btn').title=T('settings');$('#settings-btn').setAttribute('aria-label',T('settings'));
 $('#status-dot').className='status-dot '+(configured(config)?'ok':'warn');
 applyTheme();renderCrumbs();renderSidebar();renderStageHead();renderControls();renderComposer();renderInspector();syncTimeline();
}
function syncTimeline(){
 timeline.setData({branches:state.branches,baseline:BASELINE,activeId:state.activeId,selectedId:ui.view?.kind==='event'?ui.view.id:null,lang:L(),t:T,
  formatTick:shortYear,formatYear:yearPill,label:evTitle,worldTitle});
 minimap.draw();
}
function renderCrumbs(){
 const b=active(),chain=lineage(b);
 const parts=[`<button class="crumb ${!b?'on':''}" data-action="set-active" data-id=""><span class="dot" style="--c:var(--baseline)"></span>${h(T('realityShort'))}</button>`];
 for(const x of chain)parts.push(`<span class="crumb-sep">${icon('chev',12)}</span><button class="crumb ${x.id===state.activeId?'on':''}" data-action="set-active" data-id="${h(x.id)}"><span class="dot" style="--c:${colorOf(x)}"></span>${h(clip(worldTitle(x),34))}</button>`);
 $('#crumbs').innerHTML=parts.join('');
}
function renderSidebar(){
 const node=(b,depth)=>{
  const kids=childrenOf(b.id),on=b.id===state.activeId,inChain=lineage(active()).some(x=>x.id===b.id);
  return `<li><button class="world-item ${on?'on':''} ${inChain&&!on?'chain':''}" data-action="set-active" data-id="${h(b.id)}" style="--c:${colorOf(b)};--d:${depth}">
   <span class="wi-line"></span><span class="wi-dot"></span><span class="wi-text"><span class="wi-title">${h(worldTitle(b))}</span><span class="wi-sub">${h(yearPill(b.anchorYear))} · ${(b.events||[]).length} ${h(T('events'))}${kids.length?` · ${icon('branch',11)}${kids.length}`:''}</span></span></button>
   ${kids.length?`<ul>${kids.map(k=>node(k,depth+1)).join('')}</ul>`:''}</li>`;
 };
 const roots=childrenOf(null);
 $('#sidebar').innerHTML=`<div class="side-head"><span class="side-title">${h(T('worlds'))}<span class="count">${state.branches.length}</span></span><button class="icon-btn sm" data-action="new-world" title="${h(T('newWorld'))}" aria-label="${h(T('newWorld'))}">${icon('plus',16)}</button></div>
 <div class="side-scroll"><ul class="world-tree"><li><button class="world-item root ${!state.activeId?'on':''}" data-action="set-active" data-id="" style="--c:var(--baseline);--d:0"><span class="wi-dot"></span><span class="wi-text"><span class="wi-title">${h(T('reality'))}</span><span class="wi-sub">${h(T('dateRange'))}</span></span></button>
 ${roots.length?`<ul>${roots.map(b=>node(b,1)).join('')}</ul>`:''}</li></ul>
 ${!state.branches.length?`<div class="side-empty">${icon('branch',22)}<p>${h(zh()?'还没有世界线。在下方输入一个历史转折，开始第一次推演。':'No worldlines yet. Describe a turning point below to compute your first one.')}</p></div>`:''}</div>
 <div class="side-foot"><button class="btn ghost sm" data-action="import">${icon('upload',14)}${h(T('importArchive'))}</button><button class="btn ghost sm" data-action="export" ${state.branches.length||state.baselineKnowledge.length||Object.keys(state.chats).length?'':'disabled'}>${icon('download',14)}${h(T('exportAll'))}</button></div>`;
}
function renderStageHead(){
 const b=active();
 const chips=b?[`<span class="chip" style="--c:${colorOf(b)}">${icon('branch',12)}${h(T('forkedAt'))} ${h(b.timeMode==='gradual'?yearPill(b.anchorYear)+' – '+yearPill(b.transitionEndYear):yearPill(b.anchorYear))}</span>`,`<span class="chip">${eventsOf(b).length} ${h(T('events'))}</span>`,`<span class="chip">${factsOf(b).length} ${h(T('records'))}</span>`]
  :[`<span class="chip">${h(T('dateRange'))}</span>`,`<span class="chip">${BASELINE.length} ${h(T('events'))}</span>`,`<span class="chip">${state.branches.length} ${h(T('worlds'))}</span>`];
 $('#stage-head').innerHTML=`<div class="sh-main"><div class="eyebrow" style="--c:${colorOf(b)}"><span class="dot"></span>${h(b?T('activeWorld'):T('baseline'))}</div><h1 class="sh-title">${h(worldTitle(b))}</h1></div><div class="sh-chips">${chips.join('')}</div>
 <div class="sh-actions"><button class="icon-btn sm desktop-only" data-action="toggle-sidebar" title="${h(T('worlds'))}">${icon('sidebar',16)}</button><button class="icon-btn sm" data-action="toggle-inspector" title="${h(T('tabOverview'))}">${icon('panel',16)}</button></div>`;
}
function renderControls(){
 const label=T(document.fullscreenElement?'exitFullscreen':'fullscreen');
 $('#tl-controls').innerHTML=`<button class="icon-btn sm" data-action="zoom-in" title="${h(T('zoomIn'))} (+)">${icon('plus',16)}</button><button class="icon-btn sm" data-action="zoom-out" title="${h(T('zoomOut'))} (−)">${icon('minus',16)}</button><span class="sep"></span><button class="icon-btn sm" data-action="fit" title="${h(T('fit'))} (F)">${icon('fit',15)}</button><button class="icon-btn sm" data-action="focus-world" title="${h(T('focusWorld'))}">${icon('target',15)}</button><span class="sep"></span><button class="icon-btn sm ${timeline?.linear?'on':''}" data-action="toggle-scale" title="${h(timeline?.linear?T('linear'):T('focusScale'))}">${icon('ruler',15)}</button>`;
 if(document.fullscreenEnabled)$('#tl-controls').insertAdjacentHTML('beforeend',`<button class="icon-btn sm" data-action="fullscreen" title="${h(label)}" aria-label="${h(label)}">${icon('fullscreen',15)}</button>`);
}
async function toggleFullscreen(){
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
 }catch{toast(T('fullscreenError'),'error')}
}
function shuffleIdeas(){const pool=[...EXAMPLES];ui.ideas=[];while(pool.length&&ui.ideas.length<3)ui.ideas.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0])}
function composerParent(){const id=ui.parentId===undefined?state.activeId:ui.parentId;return id&&byId(id)?id:null}
function renderComposer(){
 $('#composer-label').textContent=T('composerLabel');$('#branch-from').textContent=T('branchFrom');
 const parent=composerParent();
 const opts=[`<option value="">${h(T('reality'))}</option>`];const walk=(id,d)=>{for(const b of childrenOf(id)){opts.push(`<option value="${h(b.id)}" ${b.id===parent?'selected':''}>${'\u00a0\u00a0'.repeat(d)}${d?'└ ':''}${h(clip(worldTitle(b),44))}</option>`);walk(b.id,d+1)}};walk(null,0);
 $('#parent-select').innerHTML=opts.join('');$('#parent-select').value=parent||'';
 const p=$('#prompt');p.placeholder=T('composerPlaceholder')+(ui.ideas[0]?.[L()]||'');p.setAttribute('aria-label',T('composerLabel'));
 $('#ideas').innerHTML=ui.ideas.slice(0,isMobile()?1:2).map((x,i)=>`<button type="button" class="idea" data-action="use-idea" data-i="${i}" title="${h(x[L()])}">${h(clip(x[L()],46))}</button>`).join('')+`<button type="button" class="idea idea-icon" data-action="shuffle" title="${h(T('shuffle'))}" aria-label="${h(T('shuffle'))}">${icon('shuffle',13)}</button>`;
 $('#kbd-hint').textContent=T('ctrlEnter');
 $('#sim-btn').innerHTML=`${h(T('simulate'))}${icon('arrow',15)}`;$('#sim-btn').disabled=!!ui.busy;
 const cc=$('#composer-connect');cc.hidden=configured(config);cc.innerHTML=`${icon('key',14)}<span>${h(T('connectFirst'))}</span><button type="button" class="link" data-action="settings">${h(T('connect'))}${icon('arrow',13)}</button>`;
 $('#composer').hidden=!!ui.busy;$('#busy-card').hidden=!ui.busy;if(ui.busy)renderBusy(true);
}
function renderBusy(full=false){
 const b=ui.busy,card=$('#busy-card');if(!b)return;
 const rc=b.received>=1000?(b.received/1000).toFixed(1)+'k':String(b.received);
 const complete=b.status==='complete',status=complete?T('busyComplete'):b.received?T('busyStreaming'):T('busyWaiting');
 if(full||!card.querySelector('.busy-chars')){
  const parent=byId(b.parentId);
  card.innerHTML=`<div class="busy-top"><div class="orbit"><span></span><span></span><span></span></div><div class="busy-head"><div class="busy-title">${h(T('busyTitle'))}</div><div class="busy-status" aria-live="polite"></div></div><button class="btn ghost sm" data-action="stop-sim">${icon('stop',13)}${h(T('stop'))}</button></div>
  <div class="busy-prompt"><span class="dot" style="--c:${colorOf(parent)}"></span>${h(T('branchFrom'))} ${h(worldTitle(parent))} — “${h(clip(b.prompt,180))}”</div>
  <div class="busy-bar" role="progressbar" aria-label="${h(T('busyTitle'))}"><span></span></div>
  <div class="busy-stats"><span>${h(T('received'))} <b class="busy-chars"></b> ${h(T('chars'))}</span><span class="busy-note">${h(T('busyNote'))}</span></div>`;
 }
 card.querySelector('.busy-chars').textContent=rc;card.querySelector('.busy-status').textContent=status;
 const progress=card.querySelector('.busy-bar');
 progress.setAttribute('aria-valuetext',status);
 if(complete)progress.setAttribute('aria-valuenow','100');else progress.removeAttribute('aria-valuenow');
 progress.firstElementChild.style.width=(complete?100:b.received?22:0)+'%';
 progress.firstElementChild.style.left=(complete?0:(b.received/16)%78)+'%';
}

/* ================= inspector ================= */
const TABS=[['overview','globe','tabOverview'],['chronicle','list','tabChronicle'],['database','db','tabDatabase'],['core','core','tabCore'],['visual','image','tabVisual']];
function renderInspector(){
 const askCount=dialogueEntries(state.chats[chatKey()]).length;
 $('#insp-tabs').innerHTML=TABS.map(([k,ic,l])=>`<button role="tab" class="insp-tab ${ui.tab===k?'on':''}" data-action="tab" data-value="${k}" aria-selected="${ui.tab===k}">${icon(ic,15)}<span>${h(T(l))}</span>${k==='core'&&ui.ask?'<i class="pulse"></i>':k==='core'&&askCount?`<i class="badge">${askCount}</i>`:''}</button>`).join('')+`<button class="icon-btn sm insp-close" data-action="close-inspector" aria-label="${h(T('close'))}">${icon('close',15)}</button>`;
 const body=$('#insp-body');let html='';
 const v=ui.view;
 if(v?.kind==='event')html=viewEvent();else if(v?.kind==='fact')html=viewFact();else if(v?.kind==='editor')html=viewEditor();
 else if(ui.tab==='chronicle')html=viewChronicle();else if(ui.tab==='database')html=viewDatabase();else if(ui.tab==='core')html=viewCore();else if(ui.tab==='visual')html=viewVisual();else html=viewOverview();
 const keepScroll=body.dataset.key===currentViewKey();const top=body.scrollTop;
 body.innerHTML=html;body.dataset.key=currentViewKey();
 if(keepScroll)body.scrollTop=top;else body.scrollTop=0;
 const coreForm=$('#core-form'),showCore=ui.tab==='core'&&!v;coreForm.hidden=!showCore;
 if(showCore){
  const q=$('#core-q');q.placeholder=T('askPlaceholder');q.setAttribute('aria-label',T('askPlaceholder'));
  if(document.activeElement!==q){q.value=ui.coreDrafts[chatKey()]||'';autoGrow(q,140)}
  const busyHere=ui.ask?.key===chatKey();q.disabled=!!ui.ask;
  $('#core-send').innerHTML=busyHere?icon('stop',16):icon('up',17);$('#core-send').dataset.mode=busyHere?'stop':'send';$('#core-send').setAttribute('aria-label',busyHere?T('stop'):T('send'));
  if(!keepScroll||ui.scrollChat){body.scrollTop=body.scrollHeight;ui.scrollChat=false}
 }
}
const currentViewKey=()=>JSON.stringify([ui.tab,ui.view?.kind,ui.view?.id,state.activeId,ui.dbTab]);
function openTab(tab){ui.tab=tab;ui.view=null;if(isMobile())ui.mobile='inspector';else ui.inspector=true;saveUI();render()}
function openView(view){ui.view={from:ui.tab,...view};if(isMobile())ui.mobile='inspector';else ui.inspector=true;render()}
function backFromView(){ui.view=null;render()}

function section(title,content,{open=true,cls=''}={}){
 if(!content)return '';
 return `<details class="sec ${cls}" ${open?'open':''}><summary><span>${h(title)}</span>${icon('down',14)}</summary><div class="sec-body">${content}</div></details>`;
}
function stat(v,l){return `<div class="stat"><b>${h(v)}</b><span>${h(l)}</span></div>`}
function viewOverview(){
 const b=active();
 if(!b)return viewReality();
 const sim=b.simulation||{},v4=sim.version===4,parent=byId(parentOf(b)),kids=childrenOf(b.id),c=colorOf(b);
 const chats=dialogueEntries(state.chats[b.id]).length,index=state.branches.indexOf(b)+1;
 const assumptions=Array.isArray(sim.assumptions)?sim.assumptions.map(prose).filter(Boolean):[];
 const milestones=(b.events||[]).filter(e=>e.milestone).sort((x,y)=>x.year-y.year);
 const narrative=v4?prose(sim.narrative):'';
 const long=narrative.length>1400;
 let legacy='';
 if(!v4&&sim.snapshots){const last=sim.snapshots.at(-1)?.state;legacy=(last?.regions||[]).map(r=>`<div class="region"><h4>${h(r.region)}</h4><p>${h(r.summary)}</p></div>`).join('')}
 return `<div class="ov-hero" style="--c:${c}">
  <div class="eyebrow"><span class="dot"></span>${h(T('activeWorld'))} · ${String(index).padStart(3,'0')}</div>
  <h2 class="ov-title">${h(worldTitle(b))}<button class="icon-btn xs" data-action="rename" title="${h(T('renameWorld'))}" aria-label="${h(T('renameWorld'))}">${icon('edit',13)}</button></h2>
  <div class="chips"><span class="chip" style="--c:${c}">${icon('branch',12)}${h(b.timeMode==='gradual'?yearPill(b.anchorYear)+' – '+yearPill(b.transitionEndYear):yearPill(b.anchorYear))}</span><span class="chip">${h(b.timeMode==='gradual'?T('gradualFork'):T('pointFork'))}</span>${b.createdAt?`<span class="chip">${h(new Date(b.createdAt).toLocaleDateString(zh()?'zh-CN':'en-US'))}</span>`:''}</div>
  <div class="ov-summary prose">${formatAnswer(worldSummary(b))}</div>
 </div>
 <div class="stats">${stat((b.events||[]).length,T('ownEvents'))}${stat(eventsOf(b).length,T('timelineEvents'))}${stat(factsOf(b).length,T('worldRecords'))}${stat(chats,T('conversations'))}</div>
 <div class="actions"><button class="btn primary" data-action="tab" data-value="core">${icon('core',15)}${h(T('askCore'))}</button><button class="btn" data-action="branch-here">${icon('branch',15)}${h(T('branchHere'))}</button></div>
 ${section(T('premise'),b.prompt?`<blockquote class="premise">${h(b.prompt)}</blockquote>`:'')}
 ${section(T('interpretation'),v4&&sim.expandedInput?`<div class="prose">${formatAnswer(prose(sim.expandedInput))}</div>`:'',{open:false})}
 ${section(T('forkExplanation'),(zh()?b.timeBasisZh:b.timeBasisEn)||b.timeBasisEn?`<div class="prose">${formatAnswer((zh()?b.timeBasisZh:b.timeBasisEn)||b.timeBasisEn)}</div>`:'',{open:false})}
 ${section(T('assumptions'),assumptions.length?`<ul class="bullets">${assumptions.map(a=>`<li>${h(a)}</li>`).join('')}</ul>`:'',{open:false})}
 ${section(T('narrative'),narrative?`<div class="prose narrative ${long&&!ui.narrativeOpen?'clamped':''}">${formatAnswer(narrative)}</div>${long?`<button class="link" data-action="toggle-narrative">${h(ui.narrativeOpen?T('readLess'):T('readMore'))}${icon(ui.narrativeOpen?'up':'down',13)}</button>`:''}`:'')}
 ${section(T('worldState'),v4&&sim.worldState?`<div class="prose">${formatAnswer(prose(sim.worldState))}</div>`:'')}
 ${section(T('milestones'),milestones.length?`<div class="mini-list">${milestones.map(e=>evRow(e,b,true)).join('')}</div>`:'')}
 ${section(T('impacts'),b.impacts?.length?`<ul class="bullets">${b.impacts.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`:'',{open:false})}
 ${section(T('regions'),legacy,{open:false})}
 ${section(zh()?'谱系':'Lineage',`<div class="lineage"><button class="lin-item" data-action="set-active" data-id="${h(parent?.id||'')}"><span class="dot" style="--c:${colorOf(parent)}"></span><span class="lin-k">${h(T('parentWorld'))}</span><span class="lin-v">${h(worldTitle(parent))}</span></button>${kids.map(k=>`<button class="lin-item" data-action="set-active" data-id="${h(k.id)}"><span class="dot" style="--c:${colorOf(k)}"></span><span class="lin-k">${h(T('childWorlds'))}</span><span class="lin-v">${h(worldTitle(k))}</span></button>`).join('')}</div>`)}
 <div class="danger-zone"><button class="btn ghost danger-text sm" data-action="delete-world" ${ui.busy||ui.ask||ui.imageBusy?'disabled':''}>${icon('trash',14)}${h(T('deleteWorld'))}</button></div>`;
}
function viewReality(){
 const steps=[['step1T','step1D','key'],['step2T','step2D','spark'],['step3T','step3D','core']];
 const ex=[...EXAMPLES].sort(()=>Math.random()-.5).slice(0,4);
 return `<div class="ov-hero reality" style="--c:var(--baseline)">
  <div class="eyebrow"><span class="dot"></span>${h(T('baseline'))}</div>
  <h2 class="ov-title">${h(T('reality'))}</h2>
  <div class="chips"><span class="chip">${h(T('dateRange'))}</span></div>
  <p class="ov-summary">${h(T('realityDesc'))}</p>
 </div>
 <div class="stats">${stat(BASELINE.length,T('recordedEvents'))}${stat(state.branches.length,T('worldsCreated'))}${stat(state.baselineKnowledge.length,T('worldRecords'))}${stat(dialogueEntries(state.chats.baseline).length,T('conversations'))}</div>
 ${!state.branches.length||!configured(config)?`<div class="block"><div class="block-title">${h(T('howItWorks'))}</div><ol class="steps">${steps.map(([t,d,ic],i)=>`<li class="step ${i===0&&configured(config)?'done':''}"><span class="step-n">${i===0&&configured(config)?icon('check',14):i+1}</span><div><b>${h(T(t))}</b><p>${h(T(d))}</p></div>${i===0&&!configured(config)?`<button class="btn sm primary" data-action="settings">${h(T('connect'))}</button>`:''}</li>`).join('')}</ol></div>`:''}
 <div class="block"><div class="block-title">${h(T('startWith'))}</div><div class="idea-grid">${ex.map(x=>`<button class="idea-card" data-action="fill-prompt" data-text="${h(x[L()])}">${icon('spark',14)}<span>${h(x[L()])}</span></button>`).join('')}</div></div>
 ${state.branches.length?`<div class="block"><div class="block-title">${h(T('worlds'))}</div><div class="lineage">${state.branches.slice().reverse().slice(0,8).map(k=>`<button class="lin-item" data-action="set-active" data-id="${h(k.id)}"><span class="dot" style="--c:${colorOf(k)}"></span><span class="lin-k">${h(yearPill(k.anchorYear))}</span><span class="lin-v">${h(worldTitle(k))}</span></button>`).join('')}</div></div>`:''}
 <div class="block"><div class="block-title">${h(T('keyboard'))}</div><div class="shortcuts"><span><kbd>Ctrl K</kbd>${h(T('search'))}</span><span><kbd>/</kbd>${h(T('composerLabel'))}</span><span><kbd>Ctrl ⏎</kbd>${h(T('simulate'))}</span><span><kbd>F</kbd>${h(T('fit'))}</span><span><kbd>+</kbd><kbd>−</kbd>${h(T('zoomIn'))}/${h(T('zoomOut'))}</span><span><kbd>[</kbd><kbd>]</kbd>${h(T('previous'))}/${h(T('next'))}</span></div></div>`;
}
function evRow(e,b,compact=false){
 const o=originOf(e,b);
 return `<button class="ev-row ${compact?'compact':''}" data-action="open-event" data-id="${h(e.id)}" data-branch="${h(b?.id||'')}" style="--cat:${categoryColor(e.category)}"><span class="ev-year">${h(yearPill(e.year))}</span><span class="ev-dot"></span><span class="ev-main"><span class="ev-title">${h(evTitle(e))}</span>${compact?'':`<span class="ev-sub">${h(clip(evDesc(e),130))}</span>`}</span>${compact?'':tag(o)}</button>`;
}
function chronicleEvents(){
 const b=active(),q=ui.chronQuery.trim().toLowerCase();
 let list=ui.chronScope==='own'&&b?(b.events||[]).slice().sort((x,y)=>x.year-y.year):eventsOf(b);
 if(ui.chronCat)list=list.filter(e=>String(e.category||'history').toLowerCase()===ui.chronCat);
 if(q)list=list.filter(e=>(evTitle(e)+' '+evDesc(e)+' '+(e.category||'')+' '+e.year).toLowerCase().includes(q));
 return list;
}
function chronicleList(){
 const b=active(),list=chronicleEvents();if(!list.length)return `<div class="empty">${icon('search',22)}<p>${h(T('noEvents'))}</p></div>`;
 const groups=new Map();for(const e of list){const k=eraOf(e.year);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e)}
 return [...groups].map(([k,evs])=>`<div class="era-group"><div class="era-head"><span>${h(T(k))}</span><i>${evs.length}</i></div>${evs.map(e=>evRow(e,b)).join('')}</div>`).join('');
}
function viewChronicle(){
 const b=active(),all=ui.chronScope==='own'&&b?(b.events||[]):eventsOf(b),counts=new Map();
 for(const e of all){const c=String(e.category||'history').toLowerCase();counts.set(c,(counts.get(c)||0)+1)}
 const cats=[...counts].sort((a,c)=>c[1]-a[1]).slice(0,9);
 return `<div class="view-head"><h2>${h(T('tabChronicle'))}</h2><span class="muted">${h(worldTitle(b))}</span></div>
 <div class="toolbar"><label class="search-field">${icon('search',14)}<input id="chron-q" type="search" value="${h(ui.chronQuery)}" placeholder="${h(T('filterEvents'))}"></label>
 ${b?`<div class="seg seg-sm"><button data-action="chron-scope" data-value="all" class="${ui.chronScope!=='own'?'on':''}">${h(T('allHistory'))}</button><button data-action="chron-scope" data-value="own" class="${ui.chronScope==='own'?'on':''}">${h(T('ownOnly'))}</button></div>`:''}</div>
 <div class="cat-chips">${cats.map(([c,n])=>`<button class="cat ${ui.chronCat===c?'on':''}" data-action="chron-cat" data-value="${h(c)}" style="--cat:${categoryColor(c)}"><i></i>${h(c)}<span>${n}</span></button>`).join('')}</div>
 <div id="chron-list">${chronicleList()}</div>`;
}
function dbList(){
 const b=active(),q=ui.dbQuery.trim().toLowerCase(),m=x=>!q||JSON.stringify(x).toLowerCase().includes(q);
 if(ui.dbTab==='events'){const evs=eventsOf(b).filter(m).slice().reverse();return evs.length?evs.map(e=>evRow(e,b)).join(''):`<div class="empty">${icon('list',22)}<p>${h(T('noRecords'))}</p></div>`}
 if(ui.dbTab==='facts'){const fs=factsOf(b).filter(m);return fs.length?fs.map(f=>`<button class="ev-row fact" data-action="open-fact" data-id="${h(f.id)}"><span class="ev-year">${h(yearPill(f.firstYear))}</span><span class="ev-dot sq"></span><span class="ev-main"><span class="ev-title">${h(factName(f))}</span><span class="ev-sub">${h(clip(factDesc(f),130))}</span></span>${tag(factOrigin(f,b))}</button>`).join(''):`<div class="empty">${icon('db',22)}<p>${h(T('noRecordsFacts'))}</p></div>`}
 const ds=dialogueEntries(state.chats[chatKey()]).filter(m).slice().reverse();
 return ds.length?ds.map(d=>`<details class="dlg"><summary>${icon('chat',14)}<span>${h(d.question)}</span>${icon('down',13)}</summary><div class="prose">${formatAnswer(d.answer)}</div></details>`).join(''):`<div class="empty">${icon('chat',22)}<p>${h(T('noDialogue'))}</p></div>`;
}
function viewDatabase(){
 const b=active();
 const n={events:eventsOf(b).length,facts:factsOf(b).length,dialogue:dialogueEntries(state.chats[chatKey()]).length};
 return `<div class="view-head"><h2>${h(T('tabDatabase'))}</h2><button class="btn sm primary" data-action="new-record">${icon('plus',14)}${h(T('addRecord'))}</button></div>
 <div class="seg full">${['events','facts','dialogue'].map(k=>`<button data-action="db-tab" data-value="${k}" class="${ui.dbTab===k?'on':''}">${h(T(k==='events'?'dbEvents':k==='facts'?'dbFacts':'dbDialogue'))}<i>${n[k]}</i></button>`).join('')}</div>
 <label class="search-field">${icon('search',14)}<input id="db-q" type="search" value="${h(ui.dbQuery)}" placeholder="${h(T('searchDb'))}"></label>
 <div id="db-list">${dbList()}</div>`;
}
const KNOWN_EVENT=new Set(['id','year','en','zh','title','text','descriptionEn','descriptionZh','category','origin','milestone','causes','links','source','certainty','name']);
function extraFields(obj,known){
 const rows=[];for(const [k,v] of Object.entries(obj||{})){if(known.has(k)||v==null||v==='')continue;
  let val;if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')val=h(String(v));else if(Array.isArray(v)&&v.every(x=>typeof x==='string')){if(!v.length)continue;val=`<ul class="bullets">${v.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`}else{val=`<pre>${h(JSON.stringify(v,null,2))}</pre>`}
  rows.push(`<div class="kv"><dt>${h(k.replace(/([a-z])([A-Z])/g,'$1 $2'))}</dt><dd>${val}</dd></div>`)}
 return rows.length?`<dl class="kvs">${rows.join('')}</dl>`:'';
}
function backBar(){return `<div class="back-bar"><button class="link" data-action="back">${icon('back',14)}${h(T('back'))}</button></div>`}
function viewEvent(){
 const v=ui.view,e=findEvent(v.id,v.branchId);if(!e){ui.view=null;return viewOverview()}
 const b=active(),o=originOf(e,b),list=eventsOf(b),i=list.findIndex(x=>x.id===e.id),prev=i>0?list[i-1]:null,next=i>=0&&i<list.length-1?list[i+1]:null,edit=editableEvent(e);
 const causes=(e.causes||[]).map(id=>{const r=list.find(x=>x.id===id);const mech=(e.links||[]).find(l=>l.causeId===id)?.mechanism;return `<li>${r?`<button class="link" data-action="open-event" data-id="${h(r.id)}" data-branch="${h(b?.id||'')}">${h(evTitle(r))}</button>`:h(id)}${mech?`<p class="muted">${h(mech)}</p>`:''}</li>`}).join('');
 return `${backBar()}<div class="detail-hero" style="--cat:${categoryColor(e.category)}"><div class="detail-year">${h(yr(e.year))}</div><h2>${h(evTitle(e))}</h2><div class="chips"><span class="chip cat-chip"><i></i>${h(e.category||'history')}</span>${tag(o)}${e.milestone?`<span class="tag tag-milestone">${h(T('milestone'))}</span>`:''}</div></div>
 <div class="prose detail-prose">${formatAnswer(evDesc(e))}</div>
 ${causes?section(T('causes'),`<ul class="bullets">${causes}</ul>`):''}
 ${section(T('moreFields'),extraFields(e,KNOWN_EVENT),{open:false})}
 <div class="actions wrap"><button class="btn" data-action="focus-event" data-year="${e.year}">${icon('target',14)}${h(T('focusTimeline'))}</button><button class="btn" data-action="ask-about" data-text="${h(evTitle(e))}">${icon('core',14)}${h(T('askAbout'))}</button>${edit?`<button class="btn" data-action="edit-event" data-id="${h(e.id)}">${icon('edit',14)}${h(T('edit'))}</button><button class="btn ghost danger-text" data-action="delete-event" data-id="${h(e.id)}">${icon('trash',14)}${h(T('delete'))}</button>`:''}</div>
 ${edit?'':`<p class="note">${h(T('readOnlyNote'))}</p>`}
 <div class="pager">${prev?`<button class="pager-btn" data-action="open-event" data-id="${h(prev.id)}" data-branch="${h(b?.id||'')}">${icon('back',14)}<span><small>${h(T('previous'))} · ${h(yearPill(prev.year))}</small>${h(clip(evTitle(prev),40))}</span></button>`:'<span></span>'}${next?`<button class="pager-btn next" data-action="open-event" data-id="${h(next.id)}" data-branch="${h(b?.id||'')}"><span><small>${h(T('next'))} · ${h(yearPill(next.year))}</small>${h(clip(evTitle(next),40))}</span>${icon('chev',14)}</button>`:'<span></span>'}</div>`;
}
const KNOWN_FACT=new Set(['id','year','firstYear','validUntil','name','nameEn','nameZh','text','descriptionEn','descriptionZh','kind','origin','source','evidenceIds','questionRef','discoveredAt','userAuthored','status','commitment','certainty']);
function viewFact(){
 const f=findFact(ui.view.id);if(!f){ui.view=null;return viewDatabase()}
 const edit=editableFact(f);
 return `${backBar()}<div class="detail-hero fact" style="--cat:var(--accent)"><div class="detail-year">${h(yr(f.firstYear))}${f.validUntil&&f.validUntil!==f.firstYear?' – '+h(yr(f.validUntil)):''}</div><h2>${h(factName(f))}</h2><div class="chips"><span class="chip cat-chip"><i></i>${h(f.kind||'other')}</span>${tag(factOrigin(f,active()))}</div></div>
 <div class="prose detail-prose">${formatAnswer(factDesc(f))}</div>
 ${section(T('moreFields'),extraFields(f,KNOWN_FACT),{open:true})}
 <div class="actions wrap"><button class="btn" data-action="ask-about" data-text="${h(factName(f))}">${icon('core',14)}${h(T('askAbout'))}</button>${edit?`<button class="btn" data-action="edit-fact" data-id="${h(f.id)}">${icon('edit',14)}${h(T('edit'))}</button><button class="btn ghost danger-text" data-action="delete-fact" data-id="${h(f.id)}">${icon('trash',14)}${h(T('delete'))}</button>`:''}</div>`;
}
function viewEditor(){
 const v=ui.view,b=active();let rec=null;
 if(v.id)rec=v.type==='event'?(b?.events||[]).find(e=>e.id===v.id):[...(b?[...(b.facts||[]),...(b.knowledge||[])]:state.baselineKnowledge)].find(f=>f.id===v.id);
 const type=v.type||'event',isEvent=type==='event';
 const year=rec?(isEvent?rec.year:rec.firstYear):(b?Math.max(b.anchorYear,Math.min(LAST_YEAR,b.anchorYear+1)):LAST_YEAR);
 const title=rec?(isEvent?evTitle(rec):factName(rec)):'',desc=rec?(isEvent?evDesc(rec):factDesc(rec)):'',cat=rec?(isEvent?rec.category:rec.kind):'';
 const cats=[...new Set([...(isEvent?eventsOf(b).map(e=>e.category):factsOf(b).map(f=>f.kind)),...(isEvent?['politics','economy','society','culture','science','technology','conflict','exploration']:['person','place','institution','technology','economy','culture','other'])].filter(Boolean))];
 const canEvent=!!b;
 return `${backBar()}<div class="view-head"><h2>${h(T(v.id?(isEvent?'editEvent':'editFact'):(isEvent?'newEvent':'newFact')))}</h2><span class="muted">${h(worldTitle(b))}</span></div>
 <form id="record-form" class="form" data-type="${type}" data-id="${h(v.id||'')}" novalidate>
  ${v.id?'':`<div class="field"><label>${h(T('recordType'))}</label><div class="seg full"><button type="button" data-action="editor-type" data-value="event" class="${isEvent?'on':''}" ${canEvent?'':'disabled'}>${h(T('event'))}</button><button type="button" data-action="editor-type" data-value="fact" class="${!isEvent?'on':''}">${h(T('fact'))}</button></div>${canEvent?'':`<p class="hint">${h(zh()?'现实历史中的史实事件为只读，可添加世界设定。':'Recorded history is read-only; you can add world settings.')}</p>`}</div>`}
  <div class="field"><label for="rf-year">${h(T('yearLabel'))}</label><div class="year-input"><input id="rf-year" name="year" type="number" min="1" max="3200" step="1" required value="${Math.abs(year)}"><select name="era"><option value="ce" ${year>0?'selected':''}>${h(T('ce'))}</option><option value="bce" ${year<0?'selected':''}>${h(T('bce'))}</option></select></div></div>
  <div class="field"><label for="rf-title">${h(isEvent?T('title'):T('name'))}</label><input id="rf-title" name="title" maxlength="300" required value="${h(title)}"></div>
  <div class="field"><label for="rf-cat">${h(isEvent?T('category'):T('kind'))}</label><input id="rf-cat" name="category" maxlength="60" list="rf-cats" value="${h(cat||'')}"><datalist id="rf-cats">${cats.map(c=>`<option value="${h(c)}">`).join('')}</datalist></div>
  <div class="field"><label for="rf-desc">${h(T('description'))}</label><textarea id="rf-desc" name="description" rows="8" required>${h(desc)}</textarea></div>
  <div class="form-error" id="rf-error" role="alert"></div>
  <div class="actions"><button type="button" class="btn ghost" data-action="back">${h(T('cancel'))}</button><button type="submit" class="btn primary">${icon('check',14)}${h(T('save'))}</button></div>
 </form>`;
}
function viewCore(){
 const b=active(),key=chatKey(),chat=Array.isArray(state.chats[key])?state.chats[key]:[];
 const sugg=b?['suggest1','suggest2','suggest3','suggest4']:['suggestR1','suggestR2','suggest3'];
 const head=`<div class="core-head" style="--c:${colorOf(b)}"><span class="dot"></span><span class="core-world">${h(worldTitle(b))}</span>${chat.length?`<button class="icon-btn xs" data-action="clear-chat" title="${h(T('clearChat'))}" ${ui.ask?'disabled':''}>${icon('trash',13)}</button>`:''}</div>`;
 const intro=`<div class="core-intro"><div class="core-glyph">${icon('core',26)}</div><h2>${h(T('coreTitle'))}</h2><p>${h(b?T('coreIntro'):T('coreIntroReality'))}</p><div class="sugg">${sugg.map(k=>`<button class="sugg-chip" data-action="ask" data-text="${h(T(k))}">${h(T(k))}</button>`).join('')}</div></div>`;
 const msgs=chat.map((m,i)=>m.role==='user'?`<div class="msg user"><div class="bubble">${h(m.content)}</div></div>`
  :`<div class="msg ai ${m.error?'error':''}"><div class="msg-role">${icon('core',12)}${h(T('coreTitle'))}</div><div class="bubble prose">${m.error?h(m.content):formatAnswer(m.content)}</div><div class="msg-actions">${m.error?`<button class="link" data-action="retry-ask" data-i="${i}">${icon('refresh',13)}${h(T('retry'))}</button>`:`<button class="link" data-action="copy-msg" data-i="${i}">${icon('copy',13)}${h(T('copy'))}</button>${m.saved?`<span class="saved-note">${icon('db',12)}${m.saved} ${h(T('savedSettings'))}</span>`:''}`}</div></div>`).join('');
 const pending=ui.ask?.key===key?`<div class="msg ai pending"><div class="msg-role">${icon('core',12)}${h(T('coreTitle'))}</div><div class="thinking"><span></span><span></span><span></span><em>${h(T('thinking'))}</em></div></div>`:'';
 return head+(chat.length||pending?`<div class="chat">${msgs}${pending}</div>`:intro);
}
function viewVisual(){
 const b=active();
 if(!b)return `<div class="view-head"><h2>${h(T('visualTitle'))}</h2></div><div class="empty big">${icon('image',28)}<p>${h(T('needWorld'))}</p></div>`;
 const img=/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(b.image?.data||'')?b.image.data:null;
 return `<div class="view-head"><h2>${h(T('visualTitle'))}</h2><span class="muted">${h(worldTitle(b))}</span></div><p class="muted">${h(T('visualIntro'))}</p>
 <div class="frame ${ui.imageBusy?'busy':''}">${img?`<img src="${h(img)}" alt="${h(b.image.prompt)}">`:`<div class="frame-empty">${icon('image',30)}<span>${h(T('noImage'))}</span></div>`}${ui.imageBusy?'<div class="frame-shimmer"></div>':''}</div>
 ${img?`<div class="actions"><a class="btn sm" href="${h(img)}" download="chronicle-${h(b.id.slice(0,8))}.png" target="_blank" rel="noopener">${icon('download',14)}${h(T('download'))}</a></div>`:''}
 ${imageConfigured(config)?'':`<div class="notice">${icon('key',15)}<span>${h(zh()?'尚未配置生图模型。':'No image model configured.')}</span><button class="btn sm" data-action="settings" data-tab="image">${h(T('configureImages'))}</button></div>`}
 <form id="image-form" class="form"><div class="field"><label for="img-p">${h(T('imagePrompt'))}</label><textarea id="img-p" name="image-prompt" rows="3" maxlength="1100" placeholder="${h(T('imagePlaceholder'))}">${h(ui.imageDrafts[b.id]??b.image?.prompt??'')}</textarea></div>
 <button class="btn primary" type="submit" ${ui.imageBusy?'disabled':''}>${icon('image',15)}${h(ui.imageBusy?T('generating'):T('generate'))}</button>${config.imageModel?`<span class="muted sm"> ${h(config.imageModel)}</span>`:''}</form>`;
}

/* ================= tooltip ================= */
function showTooltip(hit,e){
 const tip=$('#tooltip');if(!hit||hit.kind==='lane'){tip.hidden=true;return}
 let html='';
 if(hit.kind==='event'){const ev=hit.event;html=`<div class="tt-top"><span class="tt-dot" style="--cat:${categoryColor(ev.category)}"></span>${h(yr(ev.year))} · ${h(ev.category||'history')}</div><div class="tt-title">${h(evTitle(ev))}</div><div class="tt-desc">${h(clip(evDesc(ev),160))}</div>`}
 else if(hit.kind==='cluster')html=`<div class="tt-top">${h(yearPill(hit.from))} – ${h(yearPill(hit.to))}</div><div class="tt-title">${hit.events.length} ${h(T('events'))}</div><div class="tt-desc">${hit.events.slice(0,4).map(x=>h(clip(evTitle(x),40))).join('<br>')}${hit.events.length>4?'<br>…':''}</div><div class="tt-hint">${h(zh()?'点击放大':'Click to zoom in')}</div>`;
 else if(hit.kind==='world'){const b=byId(hit.id);html=`<div class="tt-top">${h(b?yearPill(b.anchorYear)+' →  2026':T('dateRange'))}</div><div class="tt-title">${h(worldTitle(b))}</div><div class="tt-desc">${h(clip(worldSummary(b),150))}</div>`}
 tip.innerHTML=html;tip.hidden=false;
 if(e){const r=$('#canvas-wrap').getBoundingClientRect();let x=e.clientX-r.left+14,y=e.clientY-r.top+16;const w=tip.offsetWidth,hh=tip.offsetHeight;if(x+w>r.width-8)x=e.clientX-r.left-w-14;if(y+hh>r.height-8)y=e.clientY-r.top-hh-12;tip.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`}
}

/* ================= actions ================= */
function setActive(id){
 id=id||null;if(id&&!byId(id))id=null;
 if(state.activeId!==id){state.activeId=id;ui.parentId=undefined;ui.narrativeOpen=false;ui.chronScope='all';ui.chronCat=null;ui.view=null;persist()}
 if(isMobile())ui.mobile=null;
 render();
}
function selectEventFromTimeline(e,laneId){
 openView({kind:'event',id:e.id,branchId:laneId||null});
}
async function onClick(ev){
 const t=ev.target.closest('[data-action]');if(!t)return;
 const a=t.dataset.action,v=t.dataset.value;
 switch(a){
  case 'tab':return openTab(v);
  case 'back':return backFromView();
  case 'set-active':return setActive(t.dataset.id);
  case 'lang':state.lang=v;persist();render();if(ui.modal)renderModal();return;
  case 'theme':theme=theme==='dark'?'light':'dark';try{localStorage.setItem(THEME_KEY,theme)}catch{}applyTheme();return;
  case 'settings':return openSettings(t.dataset.tab);
  case 'palette':return openPalette();
  case 'toggle-sidebar':if(isMobile())ui.mobile=ui.mobile==='sidebar'?null:'sidebar';else ui.sidebar=!ui.sidebar;saveUI();render();return;
  case 'toggle-inspector':if(isMobile())ui.mobile=ui.mobile==='inspector'?null:'inspector';else ui.inspector=!ui.inspector;saveUI();render();return;
  case 'close-inspector':if(isMobile())ui.mobile=null;else ui.inspector=false;saveUI();render();return;
  case 'close-drawers':ui.mobile=null;render();return;
  case 'zoom-in':return timeline.zoomBy(1.6);
  case 'zoom-out':return timeline.zoomBy(1/1.6);
  case 'fit':return timeline.fit();
  case 'focus-world':return timeline.focusLane(state.activeId);
  case 'fullscreen':return toggleFullscreen();
  case 'toggle-scale':timeline.setLinear(!timeline.linear);renderControls();saveUI();return;
  case 'new-world':case 'branch-here':ui.parentId=undefined;renderComposer();if(isMobile())ui.mobile=null,render();$('#prompt').focus();return;
  case 'use-idea':{const x=ui.ideas[Number(t.dataset.i)];if(x)fillPrompt(x[L()]);return}
  case 'fill-prompt':return fillPrompt(t.dataset.text);
  case 'shuffle':shuffleIdeas();renderComposer();return;
  case 'stop-sim':ui.busy?.controller.abort();return;
  case 'chron-scope':ui.chronScope=v;renderInspector();return;
  case 'chron-cat':ui.chronCat=ui.chronCat===v?null:v;renderInspector();return;
  case 'db-tab':ui.dbTab=v;saveUI();renderInspector();return;
  case 'open-event':{const bid=t.dataset.branch;openView({kind:'event',id:t.dataset.id,branchId:bid||null});return}
  case 'open-fact':return openView({kind:'fact',id:t.dataset.id});
  case 'focus-event':{const y=Number(t.dataset.year);timeline.focusYear(y,Math.max(timeline.pxPerYear(y),y>1800?14:y>0?3:1.2),true,ui.view?.branchId);if(isMobile()){ui.mobile=null;render()}return}
  case 'ask-about':{const text=(zh()?'请详细介绍「':'Tell me more about “')+t.dataset.text+(zh()?'」：它的背景、经过与长期影响。':'” — its background, course and long-term consequences.');ui.coreDrafts[chatKey()]=text;openTab('core');setTimeout(()=>{const q=$('#core-q');q.value=text;autoGrow(q,140);q.focus()},30);return}
  case 'ask':return ask(t.dataset.text);
  case 'retry-ask':return retryAsk(Number(t.dataset.i));
  case 'copy-msg':{const m=state.chats[chatKey()]?.[Number(t.dataset.i)];if(m){try{await navigator.clipboard.writeText(m.content);toast(T('copied'),'success')}catch{}}return}
  case 'clear-chat':if(await confirmDialog({title:T('clearChat'),body:T('confirmClearChat'),danger:true})){delete state.chats[chatKey()];persist();render()}return;
  case 'toggle-narrative':ui.narrativeOpen=!ui.narrativeOpen;renderInspector();return;
  case 'rename':return renameWorld();
  case 'delete-world':return deleteWorld();
  case 'new-record':return openView({kind:'editor',type:active()?'event':'fact'});
  case 'editor-type':ui.view={...ui.view,type:v};renderInspector();return;
  case 'edit-event':return openView({kind:'editor',type:'event',id:t.dataset.id,back:ui.view});
  case 'edit-fact':return openView({kind:'editor',type:'fact',id:t.dataset.id,back:ui.view});
  case 'delete-event':return deleteEvent(t.dataset.id);
  case 'delete-fact':return deleteFact(t.dataset.id);
  case 'export':return exportData();
  case 'import':return $('#import-file').click();
  case 'close-modal':return closeModal();
  case 'settings-tab':ui.settingsTab=v;$$('.snav-btn').forEach(b=>b.classList.toggle('on',b.dataset.value===v));$$('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==v);if(v==='usage')refreshUsage();saveUI();return;
  case 'preset':return applyPreset(v);
  case 'toggle-key':{const inp=$('#'+t.dataset.target);inp.type=inp.type==='password'?'text':'password';t.textContent=inp.type==='password'?T('show'):T('hide');return}
  case 'test-config':return testConfig();
  case 'save-usage-price':return saveUsagePrice();
  case 'clear-usage':if(await confirmDialog({title:zh()?'清空用量记录？':'Clear usage history?',body:zh()?'世界线和模型配置不受影响。':'Worldlines and model settings are preserved.',danger:true})){clearUsageMeter();refreshUsage()}return;
 }
}
function fillPrompt(text){const p=$('#prompt');p.value=text;ui.input=text;autoGrow(p);if(isMobile()){ui.mobile=null;render()}p.focus();saveUI()}
function onInput(e){
 const id=e.target.id;
 if(id==='prompt'){ui.input=e.target.value;autoGrow(e.target);saveUI();return}
 if(id==='chron-q'){ui.chronQuery=e.target.value;$('#chron-list').innerHTML=chronicleList();return}
 if(id==='db-q'){ui.dbQuery=e.target.value;$('#db-list').innerHTML=dbList();saveUI();return}
 if(id==='core-q'){ui.coreDrafts[chatKey()]=e.target.value;saveUI();return}
 if(id==='img-p'){const b=active();if(b)ui.imageDrafts[b.id]=e.target.value;saveUI();return}
 if(id==='palette-q'){paletteState.q=e.target.value;paletteState.i=0;renderPaletteResults();return}
 if(['s-model','s-endpoint'].includes(id))refreshUsage();
}
function onChange(e){
 if(e.target.id==='parent-select'){ui.parentId=e.target.value||null;saveUI();return}
 if(e.target.name==='provider')return applyPreset(e.target.value);
 if(e.target.id==='s-imageProvider'){const p=IMAGE_PROVIDERS[e.target.value];if(p)$('#s-imageEndpoint').value=p.imageEndpoint;return}
 if(e.target.id==='s-text-on'||e.target.id==='s-image-on')syncSettingsEnabled();
}
async function onSubmit(e){
 e.preventDefault();const id=e.target.id;
 if(id==='composer')return runSimulation();
 if(id==='core-form'){if($('#core-send').dataset.mode==='stop'){ui.ask?.controller.abort();return}return ask($('#core-q').value)}
 if(id==='image-form')return runImage(e.target);
 if(id==='record-form')return saveRecord(e.target);
 if(id==='settings-form')return saveSettings();
}
function onKey(e){
 const tag=(e.target.tagName||'').toLowerCase(),typing=tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();return}
 if(e.key==='Escape'){if(paletteState.open){closePalette();return}if(ui.modal){closeModal();return}if(ui.mobile){ui.mobile=null;render();return}if(ui.view){backFromView();return}if(typing)e.target.blur();return}
 if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){if(e.target.id==='prompt'){e.preventDefault();runSimulation()}else if(e.target.id==='core-q'){e.preventDefault();$('#core-form').requestSubmit()}return}
 if(e.key==='Enter'&&!e.shiftKey&&e.target.id==='core-q'&&!e.isComposing){e.preventDefault();$('#core-form').requestSubmit();return}
 if(typing||ui.modal||paletteState.open||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='/'){e.preventDefault();$('#prompt').focus();return}
 if(e.key==='+'||e.key==='='){timeline.zoomBy(1.5);return}
 if(e.key==='-'||e.key==='_'){timeline.zoomBy(1/1.5);return}
 if(e.key==='f'||e.key==='F'){timeline.fit();return}
 if(e.key==='ArrowLeft'){timeline.originX+=120;timeline.clampView();timeline.invalidate();return}
 if(e.key==='ArrowRight'){timeline.originX-=120;timeline.clampView();timeline.invalidate();return}
 if(e.key==='['||e.key===']'){
  const b=active(),list=eventsOf(b);if(!list.length)return;let i=ui.view?.kind==='event'?list.findIndex(x=>x.id===ui.view.id):-1;
  i=e.key===']'?Math.min(list.length-1,i+1):Math.max(0,i<0?list.length-1:i-1);const ev=list[i];
  const lane=(b?.events||[]).some(x=>x.id===ev.id)?b.id:(lineage(b).find(x=>(x.events||[]).some(y=>y.id===ev.id))?.id??null);
  openView({kind:'event',id:ev.id,branchId:lane});timeline.focusYear(ev.year);return;
 }
}

/* ================= simulation ================= */
async function runSimulation(){
 if(ui.busy)return;
 const prompt=String($('#prompt').value||'').trim();
 if(!prompt){toast(T('errEmpty'),'error');$('#prompt').focus();return}
 if(prompt.length>2000){toast(T('errLength'),'error');return}
 if(!configured(config)){openSettings('text');toast(T('errNoText'),'error');return}
 const parentId=composerParent(),ac=new AbortController();
 ui.busy={prompt,parentId,received:0,status:'waiting',controller:ac};
 renderComposer();
 try{
  const result=await simulate({prompt,branches:state.branches,parentId,autoComplete:state.autoComplete,config,lang:L(),signal:ac.signal,
   onProgress:u=>{if(!ui.busy)return;if(Number.isFinite(u.receivedChars))ui.busy.received=u.receivedChars;if(u.status)ui.busy.status=u.status;renderBusy()}});
  state.branches.push(result);state.activeId=result.id;ui.parentId=undefined;ui.view=null;ui.tab='overview';ui.input='';$('#prompt').value='';autoGrow($('#prompt'));
  const ok=persist();if(isMobile())ui.mobile='inspector';else ui.inspector=true;render();
  setTimeout(()=>timeline.focusLane(result.id),60);
  toast(ok?T('simComplete'):T('errStorage'),ok?'success':'error');
 }catch(err){
  if(err?.name==='AbortError')toast(zh()?'推演已停止。':'Simulation stopped.');
  else toast(explainError(err,L()),'error');
 }finally{ui.busy=null;render();saveUI()}
}

/* ================= core ================= */
async function ask(text){
 const question=String(text||'').trim();if(!question||ui.ask)return;
 if(!configured(config)){openSettings('text');toast(T('errNoText'),'error');return}
 const branch=active(),key=chatKey(),history=Array.isArray(state.chats[key])?state.chats[key]:[],previous=history.filter(m=>!m.error).slice();
 history.push({role:'user',content:question});state.chats[key]=history;ui.coreDrafts[key]='';$('#core-q').value='';autoGrow($('#core-q'),140);
 const ac=new AbortController();ui.ask={key,controller:ac};ui.scrollChat=true;
 if(ui.tab!=='core'||ui.view)openTab('core');else renderInspector();
 try{
  const explored=await exploreCore({question,branch,branches:state.branches,config,lang:L(),history:previous,signal:ac.signal,baselineKnowledge:state.baselineKnowledge});
  const target=branch?byId(branch.id):null;if(branch&&!target)return;
  const old=target?(target.knowledge||[]):state.baselineKnowledge,merged=mergeKnowledge(old,explored.knowledge);
  if(merged.stats.conflicts||merged.stats.invalid)throw Object.assign(new Error('EXPLORATION_COMMIT_CONFLICT'),{code:'EXPLORATION_COMMIT_CONFLICT'});
  if(target)target.knowledge=merged.facts;else state.baselineKnowledge=merged.facts;
  history.push({role:'assistant',content:explored.answer,...(merged.stats.added?{saved:merged.stats.added}:{})});
  if(!persist()){history.splice(-2,2);if(target)target.knowledge=old;else state.baselineKnowledge=old}
 }catch(err){
  history.push({role:'assistant',content:err?.name==='AbortError'?(zh()?'已停止。':'Stopped.'):explainError(err,L()),error:true});persist();
 }finally{ui.ask=null;ui.scrollChat=true;render()}
}
function retryAsk(i){
 const key=chatKey(),chat=state.chats[key];if(!chat||ui.ask)return;
 const q=chat[i-1]?.role==='user'?chat[i-1].content:null;if(!q)return;chat.splice(i-1,2);persist();ask(q);
}

/* ================= world editing ================= */
async function renameWorld(){
 const b=active();if(!b)return;
 const root=document.createElement('div');root.className='modal-backdrop confirm-backdrop';
 root.innerHTML=`<form class="modal confirm"><h3>${h(T('renameWorld'))}</h3><input class="input" name="t" maxlength="200" value="${h(worldTitle(b))}" required><div class="modal-actions"><button type="button" class="btn ghost" data-r="0">${h(T('cancel'))}</button><button class="btn primary" type="submit">${h(T('save'))}</button></div></form>`;
 document.body.appendChild(root);requestAnimationFrame(()=>root.classList.add('in'));const inp=root.querySelector('input');inp.select();
 const close=()=>{root.classList.remove('in');setTimeout(()=>root.remove(),180)};
 root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-r]'))close()});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
 root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();const v=inp.value.trim();if(!v)return;
  const same=b.titleEn===b.titleZh;if(zh()||same)b.titleZh=v;if(!zh()||same)b.titleEn=v;if(b.simulation?.version===4&&same)b.simulation.title=v;persist();render();close()});
}
async function deleteWorld(){
 const b=active();if(!b||ui.busy||ui.ask||ui.imageBusy)return;
 const plan=planWorldlineDeletion(state.branches,b.id,state.chats);if(!plan)return;
 const ok=await confirmDialog({title:T('confirmDeleteWorld',{title:worldTitle(b)}),body:[plan.descendantCount?T('confirmDeleteDesc',{n:plan.descendantCount}):'',T('confirmDeleteWorldBody')].filter(Boolean).join('\n'),danger:true,ok:T('delete')});
 if(!ok)return;
 const prev={branches:state.branches,chats:state.chats,activeId:state.activeId};
 state.branches=plan.branches;state.chats=plan.chats;state.activeId=byId(b.parentId)?b.parentId:null;ui.view=null;ui.parentId=undefined;
 if(!persist()){Object.assign(state,prev);render();return}
 render();toast(T('worldsDeleted',{n:plan.removedCount}),'success');
}
function readYear(form){
 const n=Number(form.elements.year.value),era=form.elements.era.value;
 if(!Number.isInteger(n)||n<1)return null;const y=era==='bce'?-n:n;
 return y>=FIRST_YEAR&&y<=LAST_YEAR?y:null;
}
function saveRecord(form){
 const err=$('#rf-error'),type=form.dataset.type,id=form.dataset.id,b=active();
 const year=readYear(form),title=form.elements.title.value.trim(),desc=form.elements.description.value.trim(),cat=form.elements.category.value.trim();
 if(year===null){err.textContent=T('errYear');return}
 if(!title){err.textContent=T('errTitle');return}
 if(!desc){err.textContent=T('errDesc');return}
 const snapshot=JSON.stringify({branches:state.branches,baselineKnowledge:state.baselineKnowledge});
 const restore=()=>{const s=JSON.parse(snapshot);state.branches=s.branches;state.baselineKnowledge=s.baselineKnowledge};
 let savedId=id;
 if(type==='event'){
  if(!b){err.textContent=T('needWorld');return}
  if(year<b.anchorYear){err.textContent=`${T('errYearFork')} (${yr(b.anchorYear)}).`;return}
  if(id){const e=(b.events||[]).find(x=>x.id===id);if(!e)return;
   const same=e.en===e.zh;if(zh()||same){e.zh=title}if(!zh()||same){e.en=title;e.title=title}
   const sameD=e.descriptionEn===e.descriptionZh;if(zh()||sameD)e.descriptionZh=desc;if(!zh()||sameD){e.descriptionEn=desc;e.text=desc}
   e.year=year;e.category=cat||'history';
  }else{savedId=b.id+':user:'+makeId();b.events.push({id:savedId,year,en:title,zh:title,title,descriptionEn:desc,descriptionZh:desc,text:desc,category:cat||'history',origin:'user',milestone:false,causes:[],links:[]});
   if(b.simulation?.version===4)b.simulation.fullEventCount=b.events.length}
  b.events.sort((x,y)=>x.year-y.year);
  if(!sanitizeWorldline(b)){restore();err.textContent='Invalid record.';return}
 }else{
  const pool=b?null:state.baselineKnowledge;
  const own=b?[...(b.facts||[]),...(b.knowledge||[])]:pool;
  if(id){const f=own.find(x=>x.id===id);if(!f)return;
   Object.assign(f,{year,firstYear:year,validUntil:Math.max(year,Number.isInteger(f.validUntil)?f.validUntil:year),name:title,nameEn:title,nameZh:title,text:desc,descriptionEn:desc,descriptionZh:desc,kind:cat||f.kind||'other'});
   if(f.source!=='prompt-llm'){const ok=sanitizeKnowledge(f);if(!ok){restore();err.textContent='Invalid record.';return}}
  }else{savedId=makeId();const f=sanitizeKnowledge({id:savedId,source:'prompt-llm',year,firstYear:year,validUntil:year,name:title,nameEn:title,nameZh:title,text:desc,descriptionEn:desc,descriptionZh:desc,kind:cat||'other',userAuthored:true,evidenceIds:[],assumptions:[],questionRef:''});
   if(!f){err.textContent='Invalid record.';return}
   if(b){b.knowledge=[...(b.knowledge||[]),f]}else state.baselineKnowledge.push(f)}
  if(b&&!sanitizeWorldline(b)){restore();err.textContent='Invalid record.';return}
 }
 if(!persist()){restore();return}
 toast(T('saved'),'success');
 ui.view={kind:type==='event'?'event':'fact',id:savedId,branchId:b?.id||null,from:'database'};render();
}
async function deleteEvent(id){
 const b=active();if(!b)return;if(!await confirmDialog({title:T('delete'),body:T('confirmDeleteRecord'),danger:true,ok:T('delete')}))return;
 b.events=b.events.filter(e=>e.id!==id);if(b.simulation?.milestoneIds)b.simulation.milestoneIds=b.simulation.milestoneIds.filter(x=>x!==id);if(b.simulation?.version===4)b.simulation.fullEventCount=b.events.length;
 persist();ui.view=null;render();toast(T('deleted'));
}
async function deleteFact(id){
 if(!await confirmDialog({title:T('delete'),body:T('confirmDeleteRecord'),danger:true,ok:T('delete')}))return;
 const b=active();if(b){b.facts=(b.facts||[]).filter(f=>f.id!==id);b.knowledge=(b.knowledge||[]).filter(f=>f.id!==id)}else state.baselineKnowledge=state.baselineKnowledge.filter(f=>f.id!==id);
 persist();ui.view=null;render();toast(T('deleted'));
}

/* ================= image ================= */
async function runImage(form){
 if(ui.imageBusy)return;const b=active();if(!b){toast(T('needWorld'),'error');return}
 const prompt=String(new FormData(form).get('image-prompt')||'').trim();if(!prompt){form.elements['image-prompt'].focus();return}
 if(!imageConfigured(config)){openSettings('image');return}
 ui.imageBusy=true;renderInspector();
 try{const result=await generateImage({prompt,branch:b,config,signal:new AbortController().signal});const target=byId(b.id);if(target){target.image=result;persist();toast(zh()?'插图已生成。':'Illustration ready.','success')}}
 catch(err){toast(explainError(err,L()),'error')}
 finally{ui.imageBusy=false;renderInspector()}
}

/* ================= import / export ================= */
function exportData(){
 const snap={format:'chronicle-of-ages',version:2,exportedAt:new Date().toISOString(),worldlines:state.branches,chats:state.chats,baselineKnowledge:state.baselineKnowledge};
 const url=URL.createObjectURL(new Blob([JSON.stringify(snap,null,2)],{type:'application/json'})),a=document.createElement('a');
 a.href=url;a.download=`chronicle-of-ages-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast(T('exported'),'success');
}
async function importFile(e){
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(ui.busy||ui.ask||ui.imageBusy){toast(T('importBusy'),'error');return}
 try{
  if(file.size>20_000_000)throw new Error('large');const raw=JSON.parse(await file.text());
  if(raw.format!=='chronicle-of-ages'||![1,2].includes(raw.version)||!Array.isArray(raw.worldlines)||raw.worldlines.length>100)throw new Error('invalid');
  const valid=raw.worldlines.map(sanitizeWorldline).filter(Boolean);
  if(valid.length!==raw.worldlines.length||new Set(valid.map(x=>x.id)).size!==valid.length)throw new Error('invalid');
  if((state.branches.length||state.baselineKnowledge.length||Object.keys(state.chats).length)&&!await confirmDialog({title:T('importArchive'),body:zh()?'导入会替换当前浏览器中的全部世界线与对话。建议先导出备份。':'Importing replaces all worldlines and conversations in this browser. Consider exporting a backup first.',ok:T('importArchive')}))return;
  if(ui.busy||ui.ask||ui.imageBusy){toast(T('importBusy'),'error');return}
  const previous={...state};
  state.branches=valid;state.activeId=null;state.chats=sanitizeChats(raw.chats??state.chats,valid.map(b=>b.id));state.baselineKnowledge=Array.isArray(raw.baselineKnowledge)?raw.baselineKnowledge.map(sanitizeKnowledge).filter(Boolean):[];
  if(!persist()){Object.assign(state,previous);return}
  ui.view=null;ui.parentId=undefined;closeModal();render();timeline.fit();toast(T('imported'),'success');
 }catch{toast(T('invalidImport'),'error')}
}

/* ================= settings ================= */
function openSettings(tab){ui.modal='settings';if(tab)ui.settingsTab=tab;renderModal();saveUI()}
function closeModal(){const r=$('#modal-root');r.firstElementChild?.classList.remove('in');setTimeout(()=>{if(!ui.modal)r.innerHTML=''},180);ui.modal=null;saveUI()}
function storageUsed(){let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);n+=(k.length+(localStorage.getItem(k)||'').length)*2}}catch{}return n>1048576?(n/1048576).toFixed(2)+' MB':(n/1024).toFixed(0)+' KB'}
function renderModal(){
 const r=$('#modal-root');if(ui.modal!=='settings'){r.innerHTML='';return}
 const c=config,tab=ui.settingsTab;
 const presets=[['deepseek','DeepSeek Flash','api.deepseek.com'],['openrouter','OpenRouter','openrouter.ai'],['openai','OpenAI','api.openai.com'],['custom',T('custom'),zh()?'任意 OpenAI 兼容接口':'Any OpenAI-compatible API']];
 const nav=[['text','spark','sText'],['image','image','sImage'],['usage','db','sUsage'],['data','download','sData']];
 r.innerHTML=`<div class="modal-backdrop" id="settings-backdrop"><div class="modal settings" role="dialog" aria-modal="true" aria-labelledby="settings-title">
 <div class="modal-head"><h2 id="settings-title">${icon('settings',18)}${h(T('settingsTitle'))}</h2><button class="icon-btn sm" data-action="close-modal" aria-label="${h(T('close'))}">${icon('close',16)}</button></div>
 <div class="settings-layout"><nav class="snav">${nav.map(([k,ic,l])=>`<button type="button" class="snav-btn ${tab===k?'on':''}" data-action="settings-tab" data-value="${k}">${icon(ic,15)}<span>${h(T(l))}</span></button>`).join('')}</nav>
 <form id="settings-form" class="settings-main" autocomplete="off" novalidate>
  <section data-pane="text" ${tab==='text'?'':'hidden'}>
   <p class="pane-note">${h(T('textNote'))}</p>
   <label class="switch"><input type="checkbox" id="s-text-on" ${c.textEnabled?'checked':''}><span class="track"></span><span>${h(T('enableText'))}</span></label>
   <div class="field"><label>${h(T('presets'))}</label><div class="preset-grid">${presets.map(([k,n,d])=>`<label class="preset ${c.provider===k?'on':''}"><input type="radio" name="provider" value="${k}" ${c.provider===k?'checked':''}><b>${h(n)}</b><span>${h(d)}</span></label>`).join('')}</div></div>
   <div class="field"><label for="s-endpoint">${h(T('endpoint'))}</label><input class="input mono" id="s-endpoint" type="url" spellcheck="false" value="${h(c.endpoint)}" placeholder="https://…/chat/completions"></div>
   <div class="field"><label for="s-model">${h(T('model'))}</label><input class="input mono" id="s-model" spellcheck="false" maxlength="180" value="${h(c.model)}" placeholder="deepseek-flash · openai/gpt-4.1 · …"></div>
   <div class="field"><label for="s-key">${h(T('apiKey'))}</label><div class="key-row"><input class="input mono" id="s-key" type="password" spellcheck="false" autocomplete="off" value="${h(c.key)}" placeholder="sk-…"><button type="button" class="btn sm ghost" data-action="toggle-key" data-target="s-key">${h(T('show'))}</button></div></div>
   <div class="test-row"><button type="button" class="btn sm" data-action="test-config" id="test-btn">${icon('check',14)}${h(T('test'))}</button><span class="test-msg" id="test-msg"></span></div>
   <p class="hint">${h(T('corsNote'))}</p>
  </section>
  <section data-pane="image" ${tab==='image'?'':'hidden'}>
   <p class="pane-note">${h(T('imageNote'))}</p>
   <label class="switch"><input type="checkbox" id="s-image-on" ${c.imageEnabled?'checked':''}><span class="track"></span><span>${h(T('enableImage'))}</span></label>
   <div class="field"><label for="s-imageProvider">${h(T('provider'))}</label><select class="input" id="s-imageProvider">${['openrouter','openai','custom'].map(k=>`<option value="${k}" ${c.imageProvider===k?'selected':''}>${k==='custom'?h(T('custom')):k==='openai'?'OpenAI':'OpenRouter'}</option>`).join('')}</select></div>
   <div class="field"><label for="s-imageEndpoint">${h(T('endpoint'))}</label><input class="input mono" id="s-imageEndpoint" type="url" spellcheck="false" value="${h(c.imageEndpoint)}" placeholder="https://…/images/generations"></div>
   <div class="field"><label for="s-imageModel">${h(T('model'))}</label><input class="input mono" id="s-imageModel" spellcheck="false" value="${h(c.imageModel)}" placeholder="gpt-image-1"></div>
   <div class="field"><label for="s-imageKey">${h(T('apiKey'))}</label><div class="key-row"><input class="input mono" id="s-imageKey" type="password" spellcheck="false" autocomplete="off" value="${h(c.imageKey)}" placeholder="sk-…"><button type="button" class="btn sm ghost" data-action="toggle-key" data-target="s-imageKey">${h(T('show'))}</button></div></div>
  </section>
  <section data-pane="usage" ${tab==='usage'?'':'hidden'}><div id="usage-dashboard" class="usage-host"></div></section>
  <section data-pane="data" ${tab==='data'?'':'hidden'}>
   <p class="pane-note">${h(T('dataNote'))}</p>
   <div class="data-cards"><div class="data-card"><b>${state.branches.length}</b><span>${h(T('worlds'))}</span></div><div class="data-card"><b>${Object.values(state.chats).reduce((n,c)=>n+dialogueEntries(c).length,0)}</b><span>${h(T('conversations'))}</span></div><div class="data-card"><b>${h(storageUsed())}</b><span>${h(T('storageUsed'))}</span></div></div>
   <div class="actions"><button type="button" class="btn" data-action="export">${icon('download',14)}${h(T('exportAll'))}</button><button type="button" class="btn" data-action="import">${icon('upload',14)}${h(T('importArchive'))}</button></div>
  </section>
  <footer class="settings-foot"><label class="switch"><input type="checkbox" id="s-remember" ${c.remember?'checked':''}><span class="track"></span><span>${h(T('remember'))}<small>${h(T('rememberNote'))}</small></span></label><div class="form-error" id="settings-error"></div><button type="submit" class="btn primary">${icon('check',14)}${h(T('saveSettings'))}</button></footer>
 </form></div></div></div>`;
 const bd=$('#settings-backdrop');bd.addEventListener('mousedown',e=>{if(e.target===bd)closeModal()});
 requestAnimationFrame(()=>bd.classList.add('in'));syncSettingsEnabled();if(tab==='usage')refreshUsage();
}
function syncSettingsEnabled(){
 const t=$('#s-text-on')?.checked,i=$('#s-image-on')?.checked;
 $$('[data-pane="text"] .field input, [data-pane="text"] .preset input').forEach(x=>x.disabled=!t);
 $$('[data-pane="image"] .field input, [data-pane="image"] .field select').forEach(x=>x.disabled=!i);
}
function applyPreset(k){
 const p=PROVIDERS[k];$$('.preset').forEach(x=>x.classList.toggle('on',x.querySelector('input').value===k));const r=$(`.preset input[value="${k}"]`);if(r)r.checked=true;
 if(!p)return;if(p.endpoint)$('#s-endpoint').value=p.endpoint;else if(k==='custom')$('#s-endpoint').value='';
 if(p.model)$('#s-model').value=p.model;else if(/^deepseek-flash$/.test($('#s-model').value))$('#s-model').value='';
 if(k==='deepseek')$('#s-key').focus();refreshUsage();
}
function readSettings(){
 const v=id=>$('#'+id)?.value??'';
 return safeConfig({provider:$('[name="provider"]:checked')?.value||config.provider,endpoint:v('s-endpoint'),model:v('s-model'),key:v('s-key'),
  imageProvider:v('s-imageProvider'),imageEndpoint:v('s-imageEndpoint'),imageModel:v('s-imageModel'),imageKey:v('s-imageKey'),
  textEnabled:!!$('#s-text-on')?.checked,imageEnabled:!!$('#s-image-on')?.checked,remember:!!$('#s-remember')?.checked});
}
function saveSettings(){
 const next=readSettings(),err=$('#settings-error');
 if(!next.textEnabled&&!next.imageEnabled){err.textContent=zh()?'请至少启用一项。':'Enable at least one channel.';return}
 if((next.textEnabled&&next.endpoint&&!validEndpoint(next.endpoint))||(next.imageEnabled&&next.imageEndpoint&&!validEndpoint(next.imageEndpoint))){err.textContent=explainError(new Error('INVALID_ENDPOINT'),L());return}
 config=next;try{persistConfig()}catch{toast(T('errStorage'),'error')}
 closeModal();render();toast(T('settingsSaved'),'success');
}
async function testConfig(){
 const next=readSettings(),msg=$('#test-msg'),btn=$('#test-btn');msg.className='test-msg';
 if(!configured(next)){msg.textContent=explainError(new Error('NOT_CONFIGURED'),L());msg.classList.add('bad');return}
 if(!validEndpoint(next.endpoint)){msg.textContent=explainError(new Error('INVALID_ENDPOINT'),L());msg.classList.add('bad');return}
 btn.disabled=true;msg.textContent=T('testing');const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),20000);
 try{await callChat(next,[{role:'user',content:'Reply with OK.'}],{signal:ac.signal,maxTokens:32,temperature:0,purpose:'connection-test',stage:'connection-test'});msg.textContent=T('testOk');msg.classList.add('good')}
 catch(e){msg.textContent=explainError(e,L());msg.classList.add('bad')}
 finally{clearTimeout(timer);btn.disabled=false}
}
function refreshUsage(){
 const host=$('#usage-dashboard');if(!host)return;
 host.innerHTML=renderUsageDashboard({lang:L(),provider:$('[name="provider"]:checked')?.value||config.provider,model:$('#s-model')?.value||config.model,endpoint:$('#s-endpoint')?.value||config.endpoint});
}
function saveUsagePrice(){
 const provider=$('[name="provider"]:checked')?.value||config.provider,model=String($('#s-model')?.value||config.model).trim(),input=$('#usage-price-input')?.value,output=$('#usage-price-output')?.value;
 if(!model||input===''||output===''){toast(zh()?'请填写模型名称和输入、输出单价。':'Enter the model and both rates.','error');return}
 try{if(!setUsagePrice({provider,model,inputPerMillion:input,outputPerMillion:output}))throw 0;refreshUsage();toast(zh()?'单价已保存。':'Prices saved.','success')}
 catch{toast(zh()?'单价必须是非负数字。':'Prices must be nonnegative numbers.','error')}
}

/* ================= command palette ================= */
const paletteState={open:false,q:'',i:0,items:[]};
function openPalette(){
 if(paletteState.open)return;paletteState.open=true;paletteState.q='';paletteState.i=0;
 const root=document.createElement('div');root.className='modal-backdrop palette-backdrop';root.id='palette';
 root.innerHTML=`<div class="palette" role="dialog" aria-modal="true"><label class="palette-input">${icon('search',17)}<input id="palette-q" placeholder="${h(T('searchHint'))}" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></label><div class="palette-results" id="palette-results" role="listbox"></div></div>`;
 document.body.appendChild(root);requestAnimationFrame(()=>root.classList.add('in'));
 root.addEventListener('mousedown',e=>{if(e.target===root)closePalette()});
 root.addEventListener('click',e=>{const it=e.target.closest('[data-pi]');if(it)runPaletteItem(Number(it.dataset.pi))});
 root.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){e.preventDefault();paletteState.i=Math.min(paletteState.items.length-1,paletteState.i+1);renderPaletteResults()}
  else if(e.key==='ArrowUp'){e.preventDefault();paletteState.i=Math.max(0,paletteState.i-1);renderPaletteResults()}
  else if(e.key==='Enter'){e.preventDefault();runPaletteItem(paletteState.i)}
 });
 $('#palette-q').focus();renderPaletteResults();
}
function closePalette(){const r=$('#palette');paletteState.open=false;if(r){r.classList.remove('in');setTimeout(()=>r.remove(),160)}}
function paletteItems(){
 const q=paletteState.q.trim().toLowerCase(),m=s=>!q||String(s).toLowerCase().includes(q),items=[];
 const acts=[['actNew','spark',()=>{$('#prompt').focus()}],['actSettings','settings',()=>openSettings()],['actFit','fit',()=>timeline.fit()],['actTheme',theme==='dark'?'sun':'moon',()=>{theme=theme==='dark'?'light':'dark';try{localStorage.setItem(THEME_KEY,theme)}catch{}applyTheme()}],['actLang','globe',()=>{state.lang=zh()?'en':'zh';persist();render()}],['actExport','download',exportData],['actImport','upload',()=>$('#import-file').click()]];
 for(const [k,ic,fn] of acts)if(m(T(k)))items.push({group:T('actions'),icon:ic,label:T(k),run:fn});
 const worlds=[{id:null,title:T('reality'),sub:T('dateRange')},...state.branches.map(b=>({id:b.id,title:worldTitle(b),sub:yearPill(b.anchorYear)+' · '+clip(b.prompt,60)}))];
 for(const w of worlds)if(m(w.title+' '+w.sub))items.push({group:T('paletteWorlds'),icon:'branch',color:colorOf(byId(w.id)),label:w.title,sub:w.sub,run:()=>{setActive(w.id);openTab('overview');timeline.focusLane(w.id)}});
 if(q){
  const b=active(),evs=eventsOf(b).filter(e=>m(evTitle(e)+' '+evDesc(e)+' '+e.year)).slice(0,14);
  for(const e of evs)items.push({group:T('paletteEvents'),icon:'list',color:categoryColor(e.category),label:evTitle(e),sub:yearPill(e.year),run:()=>{const lane=(b?.events||[]).some(x=>x.id===e.id)?b.id:(lineage(b).find(x=>(x.events||[]).some(y=>y.id===e.id))?.id??null);openView({kind:'event',id:e.id,branchId:lane});timeline.focusYear(e.year,Math.max(timeline.pxPerYear(e.year),e.year>1800?10:2))}});
  // other worlds' events
  for(const x of state.branches){if(x.id===b?.id)continue;for(const e of (x.events||[]).filter(e=>m(evTitle(e))).slice(0,3))items.push({group:T('paletteEvents'),icon:'list',color:colorOf(x),label:evTitle(e),sub:yearPill(e.year)+' · '+clip(worldTitle(x),40),run:()=>{state.activeId=x.id;persist();openView({kind:'event',id:e.id,branchId:x.id});timeline.focusYear(e.year)}})}
  for(const f of factsOf(b).filter(f=>m(factName(f)+' '+factDesc(f))).slice(0,8))items.push({group:T('paletteRecords'),icon:'db',label:factName(f),sub:yearPill(f.firstYear),run:()=>{ui.tab='database';ui.dbTab='facts';openView({kind:'fact',id:f.id})}});
 }
 return items.slice(0,60);
}
function renderPaletteResults(){
 const host=$('#palette-results');if(!host)return;paletteState.items=paletteItems();
 if(!paletteState.items.length){host.innerHTML=`<div class="palette-empty">${h(T('noResults'))}</div>`;return}
 let g='',html='';paletteState.items.forEach((it,i)=>{if(it.group!==g){g=it.group;html+=`<div class="palette-group">${h(g)}</div>`}
  html+=`<button class="palette-item ${i===paletteState.i?'on':''}" data-pi="${i}" role="option" aria-selected="${i===paletteState.i}"><span class="pi-icon" ${it.color?`style="--c:${it.color}"`:''}>${icon(it.icon,15)}</span><span class="pi-label">${h(it.label)}</span>${it.sub?`<span class="pi-sub">${h(it.sub)}</span>`:''}</button>`});
 host.innerHTML=html;host.querySelector('.palette-item.on')?.scrollIntoView({block:'nearest'});
}
function runPaletteItem(i){const it=paletteState.items[i];if(!it)return;closePalette();setTimeout(()=>it.run(),10)}

/* ================= boot ================= */
window.addEventListener('resize',()=>{if(!isMobile()&&ui.mobile){ui.mobile=null;render()}});
window.addEventListener('error',e=>console.error('Chronicle Studio:',e.error||e.message));
mount();
