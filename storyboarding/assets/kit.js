/* storyboarding kit — shared look and rhythm for every template.
   Mood: ink background, dot grid, IBM Plex, one accent + semantic colors.
   Pace: episode = intro (camera push on the typed input) + main; fixed easing and stagger. */
const W = 1080, H = 1350;
const RENDER = /[?&]render/.test(location.search);
if (RENDER) document.body.classList.add('render');
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const dpr = RENDER ? 1 : Math.min(2, window.devicePixelRatio || 1);
cv.width = W*dpr; cv.height = H*dpr;
function fit(){ if (RENDER) return; const wr = cv.parentElement.getBoundingClientRect(); const w = Math.min(wr.width, wr.height*0.8); cv.style.width = w+'px'; cv.style.height = (w*1.25)+'px'; }
addEventListener('resize', fit); fit();

const meta = SB.meta || {};
const C = Object.assign({ bg:'#101317', surf:'#171b21', surf2:'#1d222a', line:'#262c35', line2:'#343b46', text:'#e6e8eb', dim:'#7c8491', faint:'#4a515c',
  acc:'#F5A524', ok:'#6CC08B', human:'#E0708A', link:'#8FB4E0', warn:'#F5A524', alt:'#A99BE0', cool:'#6FA8DC', teal:'#5CC6C0' }, meta.colors || {});
// Neutral decision makers; storyboards rename or add their own.
const DEC = Object.assign({
  model:{ label:'model', color:C.acc },
  rule:{ label:'rule', color:C.cool },
  fallback:{ label:'fallback', color:C.alt, pick:'fallback pick' },
  human:{ label:'human', color:C.human },
}, SB.deciders || {});
for (const k in DEC) DEC[k].color = colorOf(DEC[k].color);
const M = '"PM", "DejaVu Sans Mono", monospace', S = '"PS", "Helvetica Neue", Arial, sans-serif';

// rhythm shared by all templates
const RHYTHM = { stagger:0.07, reveal:0.12, fly:0.26, camIn:0.45, camOut:0.5 };
const INTRO = meta.introSeconds == null ? 2.3 : meta.introSeconds;

function mod(a,b){ return ((a%b)+b)%b; }
function clamp(x,a=0,b=1){ return Math.max(a, Math.min(b,x)); }
const lerp = (a,b,t) => a+(b-a)*t;
const ease = t => t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
const win = (u,a,b) => clamp((u-a)/(b-a));
const band = (u,a,b,e=0.15) => clamp((u-a)/e) * clamp((b-u)/e);
function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let GA = 1;
function colorOf(k){ return (typeof k === 'string' && k[0] === '#') ? k : (C[k] || k || C.text); }
function txt(s,x,y,o={}){ ctx.font=o.font||`400 13px ${M}`; ctx.fillStyle=o.color||C.text; ctx.textAlign=o.align||'left'; ctx.textBaseline='alphabetic'; ctx.letterSpacing=(o.ls||0)+'px'; ctx.globalAlpha=(o.alpha==null?1:o.alpha)*GA; ctx.fillText(String(s),x,y); if (TEXTLOG) logText(String(s),x,y); ctx.globalAlpha=1; ctx.letterSpacing='0px'; }
// Render mode records every visible text box (canvas px) so render.py can flag overlaps and clipping.
const TEXTLOG = RENDER ? [] : null;
function logFill(x,y,w,h){ const T = ctx.getTransform(); TEXTLOG.push({ fill:true, x:(T.a*x+T.e)/dpr, y:(T.d*y+T.f)/dpr, w:T.a*w/dpr, h:T.d*h/dpr, z:T.a/dpr }); }
function logText(s,x,y){ if (!s.trim() || ctx.globalAlpha < 0.35) return; const m = ctx.measureText(s), al = ctx.textAlign, x0 = al==='center' ? x-m.width/2 : al==='right' ? x-m.width : x, T = ctx.getTransform();
  TEXTLOG.push({ s:s.slice(0,40), x:(T.a*x0+T.e)/dpr, y:(T.d*(y-m.actualBoundingBoxAscent)+T.f)/dpr, w:T.a*m.width/dpr, h:T.d*(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)/dpr, z:T.a/dpr }); }
function mw(s,font){ ctx.font=font; ctx.letterSpacing='0px'; return ctx.measureText(String(s)).width; }
function rrect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function fillR(x,y,w,h,r,col,a=1){ rrect(x,y,w,h,r); ctx.fillStyle=col; ctx.globalAlpha=a*GA; ctx.fill(); if (TEXTLOG && a*GA > 0.95 && ctx.fillStyle[0] === '#') logFill(x,y,w,h); ctx.globalAlpha=1; }
function strokeR(x,y,w,h,r,col,lw=1,a=1,dash){ rrect(x,y,w,h,r); ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.globalAlpha=a*GA; if(dash) ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1; }
function ln(x1,y1,x2,y2,col,w=1,a=1,dash){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.strokeStyle=col; ctx.lineWidth=w; ctx.globalAlpha=a*GA; if(dash) ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1; }
function dot(x,y,r,col,a=1){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=col; ctx.globalAlpha=a*GA; ctx.fill(); ctx.globalAlpha=1; }
function hexA(h,a){ h = colorOf(h); const n=parseInt(h.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function veil(x,y,w,h,f){ const a = (1-f)*0.66; if (a <= 0.01) return; ctx.fillStyle = hexA(C.bg, a); ctx.fillRect(x,y,w,h); }
function panel(x,y,w,h,r=12){ fillR(x,y,w,h,r,C.surf); strokeR(x+.5,y+.5,w-1,h-1,r,C.line2,1); }
function btn(x,y,w,h,label,primary){ fillR(x,y,w,h,6, primary ? '#2b3140' : '#222831'); txt(label, x+w/2, y+h/2+4.5, { font:`500 12px ${M}`, color: primary ? C.text : '#b8bec8', align:'center' }); }
function cursor(x,y){ ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+18); ctx.lineTo(x+4.5,y+14); ctx.lineTo(x+8,y+21); ctx.lineTo(x+11,y+19.5); ctx.lineTo(x+7.5,y+13); ctx.lineTo(x+13,y+13); ctx.closePath(); ctx.fillStyle='#f4f5f7'; ctx.strokeStyle='#101317'; ctx.lineWidth=1.2; ctx.globalAlpha=GA; ctx.fill(); ctx.stroke(); ctx.globalAlpha=1; }
function tagChip(x,y,id,col,a=1){ fillR(x, y, 22, 13, 3, col, a*0.95); txt(id, x+11, y+10, { font:`600 10px ${M}`, color:C.bg, align:'center', alpha:a }); }
function ripple(x,y,q,col,r0=6,r1=30){ ctx.beginPath(); ctx.arc(x, y, r0+q*(r1-r0), 0, Math.PI*2); ctx.strokeStyle=hexA(col, 0.9*(1-q)); ctx.lineWidth=2; ctx.globalAlpha=GA; ctx.stroke(); ctx.globalAlpha=1; }
function glowDot(x,y,r,col){ ctx.save(); ctx.shadowColor=colorOf(col); ctx.shadowBlur=16; dot(x,y,r,colorOf(col)); ctx.restore(); }
function scanLine(x,y,w,h,p,col){ const sy = lerp(y, y+h, p); ln(x, sy, x+w, sy, col, 1.5, 0.85); fillR(x, sy-36, w, 36, 0, hexA(col, 0.05)); }
function pulseRing(x,y,col,p){ dot(x, y, 4.5, col, 0.6 + 0.4*Math.abs(Math.sin(p))); ctx.beginPath(); ctx.arc(x,y,12+(p%1)*8,0,Math.PI*2); ctx.strokeStyle=hexA(col, 0.5*(1-(p%1))); ctx.lineWidth=1.5; ctx.stroke(); }
function toastAt(x,y,text,col,a){ const tw = mw(text, `500 12px ${M}`) + 24; const xx = Math.min(x, 1004 - tw); fillR(xx, y, tw, 24, 6, hexA(col, 0.16*a)); txt(text, xx+12, y+16, { font:`500 12px ${M}`, color:colorOf(col), alpha:a }); }
function windowChrome(x,y,w,h,title,opts={}){ panel(x,y,w,h); [0,1,2].forEach(i => dot(x+18+i*14, y+19, 4, C.line2)); fillR(x+66, y+8, Math.min(420, w-150), 22, 6, C.bg);
  if (opts.lock) { ctx.strokeStyle=C.dim; ctx.lineWidth=1.4; ctx.globalAlpha=GA; ctx.beginPath(); ctx.arc(x+80, y+17, 3.5, Math.PI, 0); ctx.stroke(); ctx.fillStyle=C.dim; ctx.fillRect(x+75, y+17, 10, 7); ctx.globalAlpha=1; }
  txt(title || '', x+(opts.lock?92:80), y+24, { font:`400 12px ${M}`, color:'#aab0ba' });
  if (opts.badge) txt(opts.badge, x+w-18, y+24, { font:`500 12px ${M}`, color:C.ok, align:'right', alpha: opts.badgeA == null ? 1 : opts.badgeA });
  if (opts.label) txt(opts.label, x+w-18, y-10, { font:`400 12px ${M}`, color:C.faint, align:'right' });
  ln(x, y+38.5, x+w, y+38.5, C.line, 1); }

// ---------- episode clock ----------
// Every template plays N episodes of equal length: INTRO (camera on the input) + main.
function clock(n, main) {
  const len = INTRO + main, period = len * Math.max(1, n);
  return { len, period, at(t){ const tm = mod(t, period), i = Math.floor(tm/len), r = tm - i*len; return { i, r, intro: r < INTRO, p: r < INTRO ? 0 : (r-INTRO)/main }; } };
}
function cameraAmount(r, I=INTRO) { if (I <= 0) return 0; if (r < RHYTHM.camIn) return ease(r/RHYTHM.camIn); if (r < I-RHYTHM.camOut) return 1; if (r < I) return 1 - ease((r-(I-RHYTHM.camOut))/RHYTHM.camOut); return 0; }
function typeProgress(r, I=INTRO) { return r < I ? win(r, Math.min(0.5, I*0.22), Math.max(0.6, I-0.75)) : 1; }
function chipProgress(r, I=INTRO) { return r < I ? win(r, I-0.7, I-0.5) : 1; }
// Push the camera onto `focus` {x,y,w,h}: fit its width, bring it to mid-screen, darken the rest.
function beginCamera(cam, focus) {
  ctx.setTransform(dpr,0,0,dpr,0,0); GA = 1;
  ctx.fillStyle = C.bg; ctx.fillRect(0,0,W,H);
  const Z = Math.min(1.55, 1000 / Math.max(200, focus.w)), z = lerp(1, Z, cam);
  const cy = focus.y + focus.h/2;
  const sx = lerp(focus.x, 40, cam), sy = lerp(cy, 560, cam);
  ctx.setTransform(dpr*z, 0, 0, dpr*z, dpr*(sx - focus.x*z), dpr*(sy - cy*z));
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let x=30;x<W;x+=30) for (let y=30;y<H;y+=30) ctx.fillRect(x,y,1.2,1.2);
}
function endCamera(cam, hole) {
  GA = 1;
  if (cam > 0) { rrect(hole.x, hole.y, hole.w, hole.h, 14); ctx.rect(-400,-400,W+800,H+800); ctx.fillStyle = hexA(C.bg, 0.78*cam); ctx.fill('evenodd'); }
  ctx.setTransform(dpr,0,0,dpr,0,0);
}

// ---------- shared frame ----------
function header(t, idx) {
  const f = `600 46px ${M}`, name = meta.name || 'project';
  const sc = Math.min(1, 560 / mw(name, f));
  ctx.save(); ctx.translate(58, 100); ctx.scale(sc, sc); txt(name, 0, 0, { font:f, color:C.text, ls:-1 }); ctx.restore();
  const w = (mw(name, f) - 12) * sc;
  if (Math.floor(t*1.6) % 2 === 0) { ctx.fillStyle = C.acc; ctx.fillRect(58+w+8, 64, 20, 42); }
  (meta.tagline || []).slice(0,2).forEach((l,i) => txt(l, 60, 136 + i*23, { font:`400 17px ${S}`, color:C.dim }));
  if (meta.counterLabel !== '') {
    txt(meta.counterLabel || 'run', 1020, 64, { font:`400 12px ${M}`, color:C.dim, align:'right', ls:1 });
    txt('#' + String((meta.counterStart || 1) + idx).padStart(4, '0'), 1020, 100, { font:`600 34px ${M}`, color:C.acc, align:'right' });
  }
  if (meta.headerRight) txt(meta.headerRight, 1020, 136, { font:`400 13px ${M}`, color:C.dim, align:'right' });
}
function footer() {
  txt(meta.footerLeft || '', 60, 1308, { font:`400 13px ${M}`, color:C.dim });
  txt(meta.footerRight || 'simulated', 1020, 1308, { font:`400 13px ${M}`, color:C.faint, align:'right' });
}
// Typed input bar at y (height 64) with an optional chip line under it. Returns the focus rect.
function inputBar(y, who, text, typeF, chip, chipF, t) {
  fillR(60,y,960,64,12,C.surf); strokeR(60.5,y+.5,959,63,12,C.line2,1);
  let x = 76;
  if (who) { const cf = `500 13px ${M}`, cw = mw(who, cf) + 24; fillR(76,y+16,cw,32,8,C.surf2); txt(who, 88, y+37, { font:cf, color:C.text }); x = 76 + cw + 14; }
  const rf = `400 16px ${M}`, shown = text.slice(0, Math.floor(text.length * typeF));
  txt(shown, x, y+38, { font:rf, color:C.text });
  if (chipF < 1 && Math.floor(t*4)%2===0) { ctx.fillStyle=C.acc; ctx.fillRect(x+mw(shown, rf)+2, y+22, 8, 20); }
  if (chip && chipF > 0) {
    GA = chipF; const cy = y + 78 + (1-chipF)*6;
    const lab = chip.label || '', lw = lab ? mw(lab, `400 12px ${M}`) + 12 : 0;
    if (lab) txt(lab, 78, cy+14, { font:`400 12px ${M}`, color:C.dim });
    const nf = `600 13px ${M}`, nw = mw(chip.value, nf) + 20, px = 78 + lw, col = colorOf(chip.color || 'acc');
    fillR(px, cy, nw, 20, 10, hexA(col, 0.16)); strokeR(px+.5, cy+.5, nw-1, 19, 10, col, 1, 0.7);
    txt(chip.value, px+10, cy+14.5, { font:nf, color:col });
    if (chip.note) txt(chip.note, px+nw+10, cy+14, { font:`400 12px ${M}`, color:C.dim });
    GA = 1;
  }
  return { x:60, y, w: Math.max(400, x - 60 + mw(text, rf) + 24), h:64 };
}
function parseDuration(s) {
  if (typeof s === 'number') return s;
  let m = 0; String(s || '').replace(/(\d+(?:\.\d+)?)\s*(d|h|m|s|ms)/g, (_, n, u) => { n = +n; m += u==='d'?n*1440:u==='h'?n*60:u==='m'?n:u==='s'?n/60:n/60000; });
  return m;
}
function fmtClock(min) { const s = Math.round(min*60), h = Math.floor(s/3600), mm = Math.floor(s%3600/60), ss = s%60; return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`; }

// ---------- free scenes ----------
// A scene is a list of shots with their own lengths: [{ name, sec, intro }]. intro (s) = camera push on the typed input.
function sequence(shots) {
  const starts = []; let acc = 0;
  shots.forEach(s => { starts.push(acc); acc += s.sec; });
  return { period: acc, len: acc, shots, starts, at(t) {
    const tm = mod(t, acc); let i = shots.length - 1; while (i > 0 && tm < starts[i]) i--;
    const s = shots[i], r = tm - starts[i], I = Math.min(s.intro || 0, s.sec);
    return { i, r, shot: s, I, intro: r < I, p: r < I ? 0 : (r - I) / Math.max(0.001, s.sec - I) }; } };
}
// Keyframe times for render.py: fractions of each shot's length -> [[name, t]].
function shotKeys(seq, fracs=[0.15, 0.55, 0.95]) { return seq.shots.flatMap((s, i) => fracs.map(f => [`${String(i+1).padStart(2,'0')}_${s.name || 'shot'}_${Math.round(f*100)}`, seq.starts[i] + f*s.sec])); }
// Item j of a list appears `at` seconds in, one stagger step after the previous. Returns 0..1.
function appear(r, at, j=0) { const a = at + j*RHYTHM.stagger; return ease(win(r, a, a + RHYTHM.reveal)); }
// Spotlight: keep the area lit while `on` is 1, dim it (not hide) when 0.
function spot(x,y,w,h,on) { veil(x,y,w,h, 0.35 + 0.65*clamp(on)); }
function fitText(s, font, maxw) { s = String(s); if (mw(s, font) <= maxw) return s; while (s.length > 1 && mw(s + '…', font) > maxw) s = s.slice(0, -1); return s + '…'; }
// Word-wrap into at most maxLines lines (the last one truncated if it still doesn't fit).
function wrapText(s, font, maxw, maxLines=3) { const out = []; let cur = ''; for (const w of String(s).split(/\s+/)) { const next = cur ? cur + ' ' + w : w; if (mw(next, font) <= maxw || !cur) cur = next; else { out.push(cur); cur = w; } } if (cur) out.push(cur);
  if (out.length > maxLines) { const rest = out.slice(maxLines-1).join(' '); out.length = maxLines-1; out.push(fitText(rest, font, maxw)); } return out.map(l => fitText(l, font, maxw)); }
function pill(x,y,text,col,a=1,font=`500 12px ${M}`) { col = colorOf(col); const w = mw(text, font) + 20; fillR(x, y, w, 22, 11, hexA(col, 0.16*a)); strokeR(x+.5, y+.5, w-1, 21, 11, col, 1, 0.7*a); txt(text, x+10, y+15, { font, color:col, alpha:a }); return w; }
// Line from (x1,y1) toward (x2,y2), drawn to fraction q, with a head at the tip.
function arrow(x1,y1,x2,y2,col,q=1,w=1.5,a=1) { if (q <= 0) return; col = colorOf(col); const x = lerp(x1,x2,q), y = lerp(y1,y2,q), ang = Math.atan2(y2-y1, x2-x1);
  ln(x1,y1,x,y,col,w,a); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x-9*Math.cos(ang-0.45), y-9*Math.sin(ang-0.45)); ctx.lineTo(x-9*Math.cos(ang+0.45), y-9*Math.sin(ang+0.45)); ctx.closePath(); ctx.fillStyle=col; ctx.globalAlpha=a*GA; ctx.fill(); ctx.globalAlpha=1; }
// Point at fraction q of the length of polyline pts [[x,y],...].
function along(pts, q) { let L = 0; const seg = []; for (let i=1;i<pts.length;i++){ const d = Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); seg.push(d); L += d; }
  let d = clamp(q)*L; for (let i=0;i<seg.length;i++){ if (d <= seg[i] || i === seg.length-1) { const f = seg[i] ? clamp(d/seg[i]) : 0; return [lerp(pts[i][0],pts[i+1][0],f), lerp(pts[i][1],pts[i+1][1],f)]; } d -= seg[i]; } return pts[0]; }
// The moving thing: a glowing ring, used for a request/record/job travelling through the system.
function token(x,y,col='acc',a=1) { col = colorOf(col); ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=14; ctx.globalAlpha=a*GA; ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.strokeStyle=col; ctx.lineWidth=2.2; ctx.stroke(); ctx.restore(); dot(x,y,3.6,col,a); }
function progressBar(x,y,w,q,col='acc',a=1) { fillR(x, y, w, 8, 4, '#232932', a); if (q > 0) fillR(x, y, Math.max(8, w*clamp(q)), 8, 4, colorOf(col), a); }
function spinner(x,y,t,col='acc',r=6) { const a0 = t*8; ctx.beginPath(); ctx.arc(x, y, r, a0, a0+Math.PI*1.4); ctx.strokeStyle=colorOf(col); ctx.lineWidth=2; ctx.globalAlpha=GA; ctx.stroke(); ctx.globalAlpha=1; }
function countUp(a, b, q, dec=0) { return lerp(a, b, ease(clamp(q))).toFixed(dec); }
// Code with light highlighting. lines: strings. o: { typeF 0..1 over all chars, t (cursor blink), hl: line index or [i..], hlColor, size, lh, maxw }.
const CODE_KW = /^(const|let|var|function|return|import|from|export|def|class|if|else|for|while|await|async|new|type|interface|fn|pub|use|struct|impl|match|package|func|true|false|null|None|True|False|self)$/;
function codeTokens(line) { const out = []; const re = /(\/\/.*|#.*)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`[^`]*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+|.)/g; let m;
  while ((m = re.exec(line))) out.push([m[0], m[1] ? C.faint : m[2] ? C.ok : m[3] ? C.alt : m[4] ? (CODE_KW.test(m[4]) ? C.acc : line[re.lastIndex] === '(' ? C.link : C.text) : '#9aa1ac']);
  return out; }
function codeBlock(x, y, lines, o={}) {
  const size = o.size || 15, lh = o.lh || Math.round(size*1.65), font = `400 ${size}px ${M}`, hls = [].concat(o.hl == null ? [] : o.hl), hc = colorOf(o.hlColor || 'acc');
  const total = lines.reduce((n, l) => n + l.length, 0); let left = o.typeF == null ? Infinity : Math.floor(total * o.typeF);
  lines.forEach((line, i) => { const by = y + i*lh;
    if (hls.includes(i)) { fillR(x-12, by-size-3, (o.maxw || 600)+24, lh, 4, hexA(hc, 0.13)); fillR(x-12, by-size-3, 3, lh, 1, hc); }
    if (left <= 0) return; let cx = x;
    for (const [tk, col] of codeTokens(line)) { if (left <= 0) break; const part = tk.slice(0, left); left -= part.length; txt(part, cx, by, { font, color:col, alpha:o.alpha }); cx += mw(part, font); }
    if (o.typeF != null && o.typeF < 1 && left <= 0 && Math.floor((o.t || 0)*4)%2===0) { ctx.fillStyle=C.acc; ctx.fillRect(cx+2, by-size+1, 8, size+2); } });
  return lines.length * lh; }
// Files as an indented tree. items: [{ path:'src/cli.ts', mark:'+'|'~'|'-'|'', note }]; folders are drawn from the paths.
function fileTree(x, y, items, o={}) {
  const lh = o.lh || 26, font = `400 13px ${M}`, rows = [], seen = new Set();
  items.forEach(it => { const parts = it.path.split('/'); parts.forEach((pt, d) => { const key = parts.slice(0, d+1).join('/'); if (seen.has(key)) return; seen.add(key); rows.push(d === parts.length-1 ? { name:pt, d, it } : { name:pt + '/', d, dir:true }); }); });
  rows.forEach((r, i) => { const ry = y + i*lh, a = o.reveal ? o.reveal(i) : 1; if (a <= 0) return;
    const mk = r.it && r.it.mark, col = mk === '+' ? C.ok : mk === '-' ? C.human : mk === '~' ? C.acc : null;
    if (col && o.fresh) { const f = o.fresh(i); if (f > 0) fillR(x-8, ry-17, (o.w || 300), 24, 5, hexA(col, 0.12*f)); }
    txt(r.name, x + r.d*18, ry, { font, color: r.dir ? C.dim : C.text, alpha:a });
    if (mk) txt(mk, x - 2 + (o.w || 300) - 20, ry, { font:`600 13px ${M}`, color:col, alpha:a, align:'right' });
    if (r.it && r.it.note) txt(r.it.note, x + r.d*18 + mw(r.name, font) + 12, ry, { font:`400 11px ${M}`, color:C.faint, alpha:a }); });
  return rows.length * lh; }

// ---------- boot ----------
async function loadFonts() {
  const defs = [['PM',FONTS.m400,{weight:'400'}],['PM',FONTS.m500,{weight:'500'}],['PM',FONTS.m600,{weight:'600'}],['PS',FONTS.s400,{weight:'400'}],['PS',FONTS.s600,{weight:'600'}]];
  await Promise.all(defs.map(async ([fam,b64,desc]) => { if (!b64) return; try { const f = new FontFace(fam, `url(data:font/woff2;base64,${b64})`, desc); await f.load(); document.fonts.add(f); } catch(e){} }));
}
function boot(T) {
  loadFonts().then(() => {
    T.prepare();
    if (RENDER) { window.renderAt = t => { TEXTLOG.length = 0; T.draw(t); }; window.__texts = () => TEXTLOG; window.__period = T.clock.period; window.__info = { n:T.count, len:T.clock.len, keys:T.keys, times:T.times }; window.__ready = true; T.draw(0); return; }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let playing = !reduce, t0 = performance.now(), acc = reduce ? INTRO + 3 : 0;
    cv.addEventListener('click', () => { playing = !playing; t0 = performance.now(); if (playing) loop(); });
    function loop(){ if (!playing) return; const now = performance.now(); acc += (now-t0)/1000; t0 = now; T.draw(acc); requestAnimationFrame(loop); }
    T.draw(acc); if (playing) requestAnimationFrame(loop);
  });
}
