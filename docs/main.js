// Simple seeded RNG (mulberry32)
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

// Lightweight 2D value noise
function Noise(seed){const rand=mulberry32(seed);const g=new Map();const key=(x,y)=>`${x}|${y}`;const grd=(x,y)=>{const k=key(x,y);if(!g.has(k)){const a=rand()*Math.PI*2;g.set(k,[Math.cos(a),Math.sin(a)])}return g.get(k)};const fade=t=>t*t*t*(t*(t*6-15)+10);const dot=(gx,gy,px,py)=>gx*px+gy*py;return function(x,y){const x0=Math.floor(x),y0=Math.floor(y),x1=x0+1,y1=y0+1;const sx=x-x0,sy=y-y0;const g00=grd(x0,y0),g10=grd(x1,y0),g01=grd(x0,y1),g11=grd(x1,y1);const n00=dot(g00[0],g00[1],x-x0,y-y0);const n10=dot(g10[0],g10[1],x-x1,y-y0);const n01=dot(g01[0],g01[1],x-x0,y-y1);const n11=dot(g11[0],g11[1],x-x1,y-y1);const u=fade(sx),v=fade(sy);const nx0=n00*(1-u)+n10*u;const nx1=n01*(1-u)+n11*u;return nx0*(1-v)+nx1*v}}

const $ = sel => document.querySelector(sel);
const canvas = $('#canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const ui = {
  algo: $('#algorithm'),
  palette: $('#palette'),
  seed: $('#seed'),
  seedBtn: $('#btn-seed'),
  animate: $('#animate'),
  res: $('#resolution'),
  speed: $('#speed'),
  random: $('#btn-random'),
  export: $('#btn-export'),
  record: $('#btn-record'),
  share: $('#btn-share'),
  full: $('#btn-full'),
};

// Palettes (coolors-style)
const PALETTES = [
  ['#0f172a','#1e293b','#334155','#64748b','#e2e8f0'],
  ['#0b132b','#1c2541','#3a506b','#5bc0be','#c6f7e2'],
  ['#16161a','#7f5af0','#2cb67d','#ff8906','#fffffe'],
  ['#0f0e17','#ff8906','#f25f4c','#e53170','#a7a9be'],
  ['#0d1321','#1d2d44','#3e5c76','#748cab','#f0ebd8'],
  ['#0b3d91','#3a0ca3','#f72585','#7209b7','#4cc9f0'],
  ['#001219','#005f73','#0a9396','#94d2bd','#e9d8a6'],
];

const ALGOS = {
  FlowField: drawFlowField,
  QuasiCrystal: drawQuasiCrystal,
  ParticleRings: drawRings,
  HexTiling: drawHex,
};

let rng = mulberry32(0);
let noise = Noise(0);
let state = {
  w: 1280, h: 720,
  algo: 'FlowField',
  palette: 2,
  seed: '',
  animate: true,
  speed: 0.6,
};

// Helpers
function pick(arr){return arr[Math.floor(rng()*arr.length)]}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function setSeed(input){
  const s = input && input.trim() ? input.trim() : Math.floor(Math.random()*1e9).toString(36);
  state.seed = s;
  const hash = Array.from(s).reduce((a,c)=>((a<<5)-a + c.charCodeAt(0))|0, 0)>>>0;
  rng = mulberry32(hash||1);
  noise = Noise(hash||1);
}

// Resize handling
function setResolution(mode){
  if(mode==='fit'){
    const ratio = 16/9;
    const W = Math.min(window.innerWidth-320, window.innerWidth); // allow for sidebar
    const H = window.innerHeight-160;
    let w = W, h = Math.round(W/ratio);
    if(h>H){ h=H; w=Math.round(H*ratio); }
    canvas.width = w*2; canvas.height = h*2; // HDPI
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    state.w=canvas.width; state.h=canvas.height;
  } else {
    const base = parseInt(mode,10);
    const h = base; const w = Math.round(base*16/9);
    canvas.width=w; canvas.height=h;
    canvas.style.width = Math.round(w/2)+'px';
    canvas.style.height = Math.round(h/2)+'px';
    state.w=w; state.h=h;
  }
}

// Draw loop
let rafId = 0, t0 = performance.now();
function loop(){
  const t = (performance.now()-t0)/1000 * state.speed;
  const colors = PALETTES[state.palette];
  ctx.fillStyle = colors[0];
  ctx.fillRect(0,0,state.w,state.h);
  ALGOS[state.algo](ctx, state, colors, t);
  if(state.animate) rafId = requestAnimationFrame(loop);
}

// Algorithms
function drawFlowField(ctx, s, colors, t){
  const N = 1600;
  ctx.globalCompositeOperation = 'lighter';
  for(let i=0;i<N;i++){
    const a = (i/N)*Math.PI*2;
    let x = s.w*0.5 + Math.cos(a+i)*s.w*0.25;
    let y = s.h*0.5 + Math.sin(a-i)*s.h*0.25;
    const hue = 180 + 60*Math.sin(i*0.01 + t*0.5);
    ctx.strokeStyle = `hsla(${hue},70%,60%,0.04)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();ctx.moveTo(x,y);
    for(let k=0;k<60;k++){
      const n = noise(x*0.002 + t*0.1, y*0.002);
      const ang = n*Math.PI*2;
      x += Math.cos(ang)*3;
      y += Math.sin(ang)*3;
      ctx.lineTo(x,y);
      if(x<0||y<0||x>s.w||y>s.h) break;
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawQuasiCrystal(ctx, s, colors, t){
  const cx = s.w/2, cy = s.h/2;
  const R = Math.min(cx,cy)*0.95;
  ctx.save();ctx.translate(cx,cy);
  const layers=9; ctx.globalAlpha=0.8;
  for(let i=0;i<layers;i++){
    const ang = i*(Math.PI*2/layers) + t*0.25;
    const col = colors[(i% (colors.length-1))+1];
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for(let a=0;a<Math.PI*2;a+=0.02){
      const r = R*(0.65+0.35*Math.sin(5*a + i*0.6 + t))*(0.85+0.15*Math.sin(3*a + i));
      const x = Math.cos(a+ang)*r;
      const y = Math.sin(a+ang)*r;
      if(a===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore(); ctx.globalAlpha=1;
}

function drawRings(ctx, s, colors, t){
  const cx=s.w/2, cy=s.h/2;
  for(let i=0;i<220;i++){
    const r = (i/220) * Math.min(cx,cy);
    const w = 1 + 2*Math.sin(i*0.15 + t*2);
    const c = colors[1 + (i% (colors.length-1))];
    ctx.strokeStyle = c; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(cx,cy, r, 0, Math.PI*2);
    ctx.stroke();
  }
}

function drawHex(ctx, s, colors, t){
  const size = 28; const h = Math.sin(Math.PI/3)*size; const cols=Math.ceil(s.w/(size*1.5))+2; const rows=Math.ceil(s.h/(h*2))+2;
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      const cx = x*size*1.5 + ((y%2)? size*0.75: size*0.25);
      const cy = y*h*2 + size;
      const n = noise((cx+t*30)*0.003,(cy-t*10)*0.003);
      const idx = 1 + Math.floor((n*0.5+0.5)*(colors.length-1));
      hexagon(ctx, cx, cy, size*(0.8+0.2*n), colors[idx], 0.7);
    }
  }
}

function hexagon(ctx,cx,cy,r,stroke,alpha){
  ctx.save(); ctx.translate(cx,cy); ctx.beginPath();
  for(let i=0;i<6;i++){
    const a=Math.PI/3*i; const x=Math.cos(a)*r; const y=Math.sin(a)*r;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.strokeStyle=stroke; ctx.globalAlpha=alpha; ctx.stroke(); ctx.globalAlpha=1; ctx.restore();
}

// Export PNG
async function exportPNG(){
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href=url; a.download=`art_${state.algo}_${state.seed||'auto'}.png`;
  document.body.appendChild(a); a.click(); a.remove();
}

// Record WebM
async function exportWebM(){
  const seconds = 6; // short clip
  const stream = canvas.captureStream(60);
  const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
  const chunks=[];
  rec.ondataavailable=e=>{ if(e.data.size>0) chunks.push(e.data); };
  rec.onstop=()=>{
    const blob=new Blob(chunks,{type:'video/webm'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`art_${state.algo}_${state.seed||'auto'}.webm`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 5000);
  };
  let frame=0; const fps=60; const total=fps*seconds;
  const oldAnimate=state.animate; state.animate=true; cancelAnimationFrame(rafId);
  function step(){
    loop();
    frame++;
    if(frame>=total){ rec.stop(); cancelAnimationFrame(rafId); state.animate=oldAnimate; if(state.animate) rafId=requestAnimationFrame(loop); return; }
    rafId=requestAnimationFrame(step);
  }
  rec.start(); step();
}

// URL state sync
function encodeState(){
  const s = new URLSearchParams({
    a: state.algo,
    p: String(state.palette),
    s: state.seed||'',
    an: state.animate? '1':'0',
    r: ui.res.value,
    sp: String(state.speed)
  });
  return '#'+s.toString();
}
function applyFromURL(){
  const hash = location.hash.startsWith('#')? location.hash.slice(1):'';
  const p = new URLSearchParams(hash);
  const a = p.get('a'); if(a && ALGOS[a]) state.algo=a;
  const pal = parseInt(p.get('p')||state.palette,10); if(!isNaN(pal)) state.palette=clamp(pal,0,PALETTES.length-1);
  const sd = p.get('s')||''; setSeed(sd);
  const an = p.get('an'); state.animate = an? an==='1': state.animate;
  const r = p.get('r'); if(r) ui.res.value=r;
  const sp = parseFloat(p.get('sp')||state.speed); if(!isNaN(sp)) state.speed=clamp(sp,0,1.5);
}

// UI wiring
function populate(){
  ui.algo.innerHTML = Object.keys(ALGOS).map(n=>`<option value="${n}">${n}</option>`).join('');
  ui.palette.innerHTML = PALETTES.map((p,i)=>`<option value="${i}">${i+1}: ${p[1]} ${p[2]}</option>`).join('');
}

function updateUI(){
  ui.algo.value = state.algo;
  ui.palette.value = String(state.palette);
  ui.seed.value = state.seed;
  ui.animate.checked = state.animate;
}

function restart(){
  cancelAnimationFrame(rafId);
  t0 = performance.now();
  loop();
}

// Event listeners
ui.random.addEventListener('click',()=>{
  setSeed(''); state.palette = Math.floor(rng()*PALETTES.length);
  state.algo = pick(Object.keys(ALGOS));
  updateUI(); location.hash = encodeState(); restart();
});
ui.export.addEventListener('click', exportPNG);
ui.record.addEventListener('click', exportWebM);
ui.share.addEventListener('click', async()=>{
  location.hash = encodeState();
  const url = location.href;
  try{ await navigator.clipboard.writeText(url); toast('URLをコピーしました'); }catch{ prompt('URLをコピーしてください', url); }
});
ui.full.addEventListener('click',()=>{
  if(document.fullscreenElement){ document.exitFullscreen(); }
  else { document.documentElement.requestFullscreen(); }
});
ui.algo.addEventListener('change',()=>{ state.algo=ui.algo.value; location.hash=encodeState(); restart(); });
ui.palette.addEventListener('change',()=>{ state.palette=parseInt(ui.palette.value,10); location.hash=encodeState(); restart(); });
ui.animate.addEventListener('change',()=>{ state.animate=ui.animate.checked; location.hash=encodeState(); cancelAnimationFrame(rafId); if(state.animate) rafId=requestAnimationFrame(loop); else loop(); });
ui.speed.addEventListener('input',()=>{ state.speed=parseFloat(ui.speed.value); });
ui.res.addEventListener('change',()=>{ setResolution(ui.res.value); restart(); });
ui.seedBtn.addEventListener('click',()=>{ setSeed(''); ui.seed.value=state.seed; location.hash=encodeState(); restart(); });
ui.seed.addEventListener('change',()=>{ setSeed(ui.seed.value); location.hash=encodeState(); restart(); });

window.addEventListener('resize',()=>{ if(ui.res.value==='fit'){ setResolution('fit'); restart(); }});

function toast(text){
  const el=document.createElement('div'); el.textContent=text; el.style.cssText='position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#111827;color:#e5e7eb;padding:8px 12px;border:1px solid #374151;border-radius:8px;z-index:1000;';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1600);
}

// Init
populate();
applyFromURL();
updateUI();
setResolution('fit');
loop();

// PWA service worker
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}

