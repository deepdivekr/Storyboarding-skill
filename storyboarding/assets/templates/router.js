/* template: router — one input, a decision, many lanes.
   For gateways, routers, schedulers, dispatchers, multi-backend libraries.
   Episode: request typed -> token enters the core -> decision flashes -> lane lights up, burst streams, log + stats update. */
const LANES = (SB.lanes || []).slice(0, 6);
const EPS = SB.episodes || [];
const NE = EPS.length;
const MAIN = meta.runSeconds || 5.5;
const CLK = clock(NE, MAIN);
const PAL = ['acc','cool','ok','alt','human','teal'];
const laneY = i => 506 + i*62;
const PX0 = 330, PX1 = 790;
const DIA = { x:550, y:418, hw:62, hh:28 };
const ARR = 0.6;                       // arrival point in episode progress
const firstDec = DEC[Object.keys(DEC)[0]];
let BURSTS = [], BARS = [];

function prepare() {
  const R = rng(1337);
  LANES.forEach((l, i) => { l.col = colorOf(l.color || PAL[i % PAL.length]); });
  BURSTS = LANES.map(() => Array.from({ length: 26 }, () => ({ s:R()*CLK.period, len:3+Math.floor(R()*10), v:70+R()*110, row:[0,0,0,10,-9][Math.floor(R()*5)], r:1.6+R()*0.9, gap:6+R()*3, head:R()<0.25, comet:R()<0.3, a:0.3+R()*0.45 })));
  EPS.forEach((e, i) => {
    e.dec = DEC[e.decider] || firstDec;
    e.arrive = i*CLK.len + INTRO + ARR*MAIN;
    if (BURSTS[e.lane]) { BURSTS[e.lane].push({ s:e.arrive, len:16, v:230, row:0, r:2.8, gap:9, head:true, comet:true, a:1 }); BURSTS[e.lane].push({ s:e.arrive+0.25, len:8, v:170, row:10, r:2.2, gap:8, a:0.8 }); }
  });
  BARS = LANES.map(() => { const a = []; let v = R(); for (let i=0;i<48;i++){ v = clamp(v + (R()-.5)*0.45, 0.08, 1); a.push(v); } return a; });
}

function tokenPos(p, lane) {
  const ly = laneY(lane) - 7;
  const seg = [[0,0.1,[310,334],[340,334]], [0.1,0.2,[340,334],[DIA.x,334]], [0.2,0.28,[DIA.x,334],[DIA.x,DIA.y]], [0.28,0.45,[DIA.x,DIA.y],[DIA.x,DIA.y]], [0.45,0.52,[DIA.x,DIA.y],[DIA.x,462]], [0.52,ARR,[DIA.x,462],[343,ly]]];
  for (const [a,b,s,e] of seg) if (p < b) { const q = ease(clamp((p-a)/(b-a))); return [lerp(s[0],e[0],q), lerp(s[1],e[1],q)]; }
  return [343, ly];
}

function draw(t) {
  if (!NE) return;
  const E = CLK.at(t), i = E.i, ep = EPS[i], p = E.p, cam = cameraAmount(E.r);
  const focus = { x:60, y:184, w: 76 + mw(ep.client || '', `500 13px ${M}`) + 38 + mw(ep.request, `400 16px ${M}`) + 24 - 60, h:64 };
  beginCamera(cam, focus);
  header(t, i);
  inputBar(184, ep.client, ep.request, typeProgress(E.r), ep.chip || null, chipProgress(E.r), t);
  veil(52,176,976,80, 0.35 + 0.65*(E.intro ? 1 : band(p, -1, 0.08)));
  flow(ep, E, t);
  veil(52,288,976,184, 0.35 + 0.65*(E.intro ? 0 : band(p, 0, 0.55)));
  lanes(ep, E, t);
  veil(52,472,976,396, 0.35 + 0.65*(E.intro ? 0 : band(p, 0.45, 1.2)));
  telemetry(ep, E, t);
  veil(40,876,1000,380, 0.35 + 0.65*(E.intro ? 0 : band(p, 0.55, 1.2)));
  footer();
  endCamera(cam, { x:56, y:180, w:968, h: ep.chip ? 108 : 72 });
}

function box(x,y,w,h,title,note,accent){ if (accent) { ctx.save(); ctx.shadowColor = hexA(C.acc,0.35); ctx.shadowBlur = 18; fillR(x,y,w,h,10,C.surf2); ctx.restore(); strokeR(x+.5,y+.5,w-1,h-1,10,C.acc,2); } else { fillR(x,y,w,h,10,C.surf); strokeR(x+.5,y+.5,w-1,h-1,10,C.line2,1.5); }
  txt(title || '', x+20, y+30, { font:`500 19px ${M}`, color:C.text }); txt(note || '', x+20, y+53, { font:`400 12px ${M}`, color:C.dim }); }

function flow(ep, E, t) {
  const p = E.p, src = meta.source || {}, core = meta.core || {}, sink = meta.sink || {};
  box(60,300,250,68, ep.client || src.title, src.note, false);
  box(340,300,420,68, core.title || meta.name, core.note, true);
  box(790,300,230,68, sink.title, sink.note, false);
  ln(310,334.5,340,334.5,C.line2,1.5); ln(760,334.5,790,334.5,C.line2,1.5);
  ln(DIA.x,368,DIA.x,DIA.y-DIA.hh,C.line2,1.5); ln(DIA.x,DIA.y+DIA.hh,DIA.x,462,C.line2,1.5);
  ln(160,462.5,990,462.5,C.line2,1.5);
  const prev = EPS[mod(E.i-1, NE)], cur = (!E.intro && p >= 0.28) ? ep : prev;
  const flash = (!E.intro && p >= 0.28 && p < 0.45) ? Math.sin(((p-0.28)/0.17)*Math.PI) : 0;
  const col = cur.dec.color;
  ctx.beginPath(); ctx.moveTo(DIA.x, DIA.y-DIA.hh); ctx.lineTo(DIA.x+DIA.hw, DIA.y); ctx.lineTo(DIA.x, DIA.y+DIA.hh); ctx.lineTo(DIA.x-DIA.hw, DIA.y); ctx.closePath();
  ctx.save(); ctx.shadowColor = hexA(col, 0.2 + flash*0.6); ctx.shadowBlur = 10 + flash*24; ctx.fillStyle = flash > 0 ? hexA(col, 0.08 + flash*0.22) : C.surf2; ctx.globalAlpha = GA; ctx.fill(); ctx.restore();
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = GA; ctx.stroke(); ctx.globalAlpha = 1;
  txt(String(cur.dec.label).toUpperCase(), DIA.x, DIA.y+6, { font:`600 16px ${M}`, color:C.text, align:'center' });
  txt((meta.decisionLabel || 'decision') + ' · ' + (cur.field || ''), 630, 412, { font:`400 13px ${M}`, color:C.dim });
  txt([cur.score, cur.reason].filter(v => v != null && v !== '').join(', '), 630, 432, { font:`400 13px ${M}`, color:col });
  if (!E.intro && p < ARR + 0.15) { const [x,y] = tokenPos(p, ep.lane); ctx.save(); ctx.shadowColor=C.acc; ctx.shadowBlur=14; ctx.globalAlpha = p < ARR ? 1 : clamp(1-(p-ARR)/0.15); ctx.beginPath(); ctx.arc(x,y,9,0,Math.PI*2); ctx.strokeStyle=C.acc; ctx.lineWidth=2.2; ctx.stroke(); ctx.restore(); dot(x,y,3.6,C.acc); }
}

function laneStatus(li, t) {
  let best = null, bd = 1e9;
  EPS.forEach(e => { if (e.lane !== li) return; const d = mod(t - e.arrive, CLK.period); if (d < bd) { bd = d; best = e; } });
  return best ? best.status || LANES[li].note : LANES[li].note;
}

function lanes(ep, E, t) {
  const p = E.p;
  const hl = (!E.intro && p >= ARR-0.02) ? clamp((p-(ARR-0.02))/0.06) * clamp((1-p)/0.08) : 0;
  if (hl > 0) { const y = laneY(ep.lane); fillR(45, y-34, 990, 62, 8, hexA(LANES[ep.lane].col, 0.07*hl)); }
  LANES.forEach((L, i) => {
    const y = laneY(i), py = y - 7;
    txt(L.name, 60, y, { font:`400 18px ${M}`, color:C.text });
    txt(laneStatus(i, t) || '', 60, y+20, { font:`400 12px ${M}`, color:C.dim });
    ln(PX0, py+0.5, PX1, py+0.5, hexA(L.col,0.12), 1);
    ctx.save(); ctx.beginPath(); ctx.rect(PX0-4, py-24, PX1-PX0+8, 48); ctx.clip();
    BURSTS[i].forEach(b => {
      const age = mod(t - b.s, CLK.period), head = PX0 + age*b.v, tail = head - (b.len-1)*b.gap;
      if (tail > PX1 + 10) return;
      const y0 = py + b.row;
      if (b.comet) ln(Math.max(PX0, tail-30), y0+0.5, Math.min(head, PX1), y0+0.5, L.col, 1, 0.25*b.a);
      for (let d=0; d<b.len; d++) { const x = head - d*b.gap; if (x < PX0 || x > PX1) continue; const edge = clamp((x-PX0)/30)*clamp((PX1-x)/30); dot(x, y0, (d===0 && b.head) ? b.r*1.9 : b.r, L.col, b.a*edge); }
    });
    ctx.restore();
    const step = t*2, s0 = Math.floor(step), fr = step - s0, boost = i === ep.lane ? hl : 0; let lastV = 0;
    for (let b=0;b<12;b++) { let v = lerp(BARS[i][mod(s0+b,48)], BARS[i][mod(s0+b+1,48)], fr); if (b >= 9) v = Math.min(1, v + boost*0.35); const h = 7 + v*22;
      ctx.fillStyle = L.col; ctx.globalAlpha = (b >= 8 ? 0.95 : 0.42)*GA; ctx.fillRect(812 + b*10.4, py + 12 - h, 7, h); ctx.globalAlpha = 1; lastV = v; }
    txt(Math.round((L.rate || 30) * (0.7 + lastV*0.6)) + (meta.rateUnit || '/s'), 1020, y-2, { font:`400 16px ${M}`, color:L.col, align:'right' });
  });
}

function telemetry(ep, E, t) {
  const X = 45, Y = 880, Wd = 990, Ht = 372;
  fillR(X+.5, Y+.5, Wd, Ht, 14, '#0e0f12'); strokeR(X+.5, Y+.5, Wd, Ht, 14, '#26282e', 1.5);
  txt(meta.panelTitle || 'Telemetry', 69, Y+32, { font:`600 15px ${S}`, color:C.text });
  ln(65, Y+48.5, 1015, Y+48.5, '#23252a', 1); ln(380.5, Y+60, 380.5, Y+310, '#23252a', 1); ln(697.5, Y+60, 697.5, Y+310, '#23252a', 1);
  const arrived = !E.intro && E.p >= ARR;
  // 01 route map
  txt(meta.mapTitle || 'Route map', 64, Y+82, { font:`500 14px ${M}`, color:C.text });
  txt(meta.mapNote || `one input, ${LANES.length} lanes`, 64, Y+102, { font:`400 11px ${M}`, color:'#55585f' });
  const O = [90, Y+200], n = LANES.length;
  LANES.forEach((L, i) => { const ny = Y+130 + i*(150/Math.max(1,n-1)); const act = arrived && i === ep.lane;
    ln(O[0], O[1], 220, ny, act ? L.col : '#5a5d64', act ? 1.6 : 1, act ? 1 : 0.8); dot(220, ny, 3.5, act ? L.col : '#8a8d94'); txt(L.name, 232, ny+4, { font:`400 11px ${M}`, color: act ? L.col : C.dim }); });
  dot(O[0], O[1], 6, '#f2efe8');
  // 02 stats
  txt(meta.statsTitle || 'Stats', 400, Y+82, { font:`500 14px ${M}`, color:C.text });
  txt(meta.statsNote || '', 400, Y+102, { font:`400 11px ${M}`, color:'#55585f' });
  const live = meta.liveStat || { label:'routed', start:100 };
  const done = EPS.filter((e, k) => k < E.i || (k === E.i && arrived)).length;
  const rows = [[live.label, String((live.start || 0) + done)]].concat(meta.stats || []).slice(0,6);
  rows.forEach(([l,v], j) => { const y = Y+136 + j*28; txt(l, 400, y, { font:`400 11px ${M}`, color:'#6a6d74', ls:1 }); txt(v, 680, y, { font:`400 13px ${M}`, color: j===0 && arrived && E.p < ARR+0.15 ? C.acc : C.text, align:'right' }); });
  // 03 log
  txt(meta.logTitle || 'Event log', 716, Y+82, { font:`500 14px ${M}`, color:C.text });
  txt(meta.logNote || 'last five', 716, Y+102, { font:`400 11px ${M}`, color:'#55585f' });
  const hist = [];
  for (let k=0; k<NE; k++) { const e = EPS[mod(E.i-k, NE)]; if (k === 0 && !arrived) continue; hist.push([e, k]); if (hist.length === 5) break; }
  hist.forEach(([e, k], j) => { const y = Y+134 + j*32, a = (k===0) ? clamp((E.p-ARR)/0.06) : 1, L = LANES[e.lane] || {};
    txt((e.log && e.log.id) || ('#' + String((meta.counterStart||1) + mod(E.i-k, NE)).padStart(4,'0')), 716, y, { font:`400 13px ${M}`, color:C.text, alpha:a });
    txt((L.name || '') + ' · ' + ((e.log && e.log.text) || e.status || ''), 716, y+15, { font:`400 10.5px ${M}`, color: L.col || C.dim, alpha:a }); });
  ln(65, Y+322.5, 1015, Y+322.5, '#23252a', 1);
  txt(meta.panelFooter || '', 69, Y+345, { font:`400 10.5px ${M}`, color:'#6a6d74', ls:1.4 });
  if (meta.panelBadge) txt(meta.panelBadge, 1011, Y+345, { font:`400 10.5px ${M}`, color:'#c9c6c0', ls:1.4, align:'right' });
}

const TPL = { clock: CLK, count: NE, prepare, draw,
  keys: [['intro', Math.max(0.1, INTRO-0.5)], ['decide', INTRO + 0.36*MAIN], ['arrive', INTRO + 0.75*MAIN]] };
boot(TPL);
