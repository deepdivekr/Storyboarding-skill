/* template: trace — one request walked through 7 stages on a page:
   type request -> page loads -> scan stamps e1..e5 -> scores vs gate -> gate/approval -> execute -> readback -> filed. */
const STAGES = meta.stages || ['plan','observe','decide','check','execute','verify','record'];
const PACKS = SB.packs || [];
const RUNS = SB.runs || SB.episodes || [];
const GATE = meta.gate == null ? 0.8 : meta.gate;
const RUN = 5.6;
const T = { load:[0.55,1.2], scan:[1.2,2.0], judge:[2.3,2.95], gate:[2.95,3.65], exec:[3.65,4.25], read:[4.25,4.85], recipe:[4.85,5.25] };
const STAGE = [[0,0.55],[0.55,2.3],[2.3,2.95],[2.95,3.65],[3.65,4.25],[4.25,4.85],[4.85,5.25]];
const FLY = RHYTHM.fly, U0 = 0.55;
const MAIN = meta.runSeconds || 8.0;
const NR = RUNS.length;
const CLK = clock(NR, MAIN);
const PX = 430, PY = 290, PW = 590, PH = 350;
const RAIL_Y = i => 350 + i*78;
const TROW = i => 662 + 58 + i*28;
const firstDec = DEC[Object.keys(DEC)[0]];

// ---------- illustrations for product layout ----------
const ILLO = {
  bag(x,y){ const cx=x+105; ctx.beginPath(); ctx.moveTo(cx-52,y+48); ctx.lineTo(cx+52,y+48); ctx.lineTo(cx+60,y+182); ctx.quadraticCurveTo(cx,y+192,cx-60,y+182); ctx.closePath(); ctx.fillStyle='#6b4a34'; ctx.globalAlpha=GA; ctx.fill(); ctx.globalAlpha=1;
    fillR(cx-54,y+30,108,22,3,'#7d5a40'); fillR(cx-36,y+84,72,64,4,'#e8e1d6',0.92); ln(cx-24,y+132,cx+24,y+132,'#9b8b78',2); ctx.save(); ctx.translate(cx,y+108); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0,0,10,14,0,0,Math.PI*2); ctx.fillStyle='#5a3f2c'; ctx.globalAlpha=GA; ctx.fill(); ctx.globalAlpha=1; ctx.restore(); },
  box(x,y){ const s='#8b93a0'; ctx.globalAlpha=GA; ctx.strokeStyle=s; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x+50,y+80); ctx.lineTo(x+105,y+55); ctx.lineTo(x+160,y+80); ctx.lineTo(x+160,y+155); ctx.lineTo(x+105,y+180); ctx.lineTo(x+50,y+155); ctx.closePath(); ctx.fillStyle='#5b4a3a'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+50,y+80); ctx.lineTo(x+105,y+105); ctx.lineTo(x+160,y+80); ctx.moveTo(x+105,y+105); ctx.lineTo(x+105,y+180); ctx.stroke(); ctx.globalAlpha=1;
    fillR(x+118,y+125,30,18,2,'#e8e1d6',0.85); },
  device(x,y){ fillR(x+30,y+45,150,100,8,'#2b3140'); fillR(x+38,y+53,134,84,4,'#3d5a80'); fillR(x+85,y+150,40,8,2,'#2b3140'); fillR(x+60,y+158,90,8,4,'#2b3140'); dot(x+105,y+95,14,'#8FB4E0',0.8); },
  bottle(x,y){ fillR(x+90,y+30,30,26,4,'#cfd3d8',0.8); fillR(x+70,y+56,70,130,14,'#4a7a6a'); fillR(x+78,y+100,54,48,4,'#e8e1d6',0.9); ln(x+86,y+130,x+124,y+130,'#9b8b78',2); },
  doc(x,y){ fillR(x+55,y+30,100,140,6,'#e8e1d6',0.9); [60,76,92,108,124].forEach((d,i)=>ln(x+70,y+d,x+(i%2?125:140),y+d,'#9b8b78',2)); fillR(x+70,y+140,40,14,3,'#6CC08B',0.8); },
};
function illo(kind, x, y){ fillR(x,y,210,210,8,'#1b2028'); if (ILLO[kind]) { ILLO[kind](x,y); return; }
  ctx.save(); rrect(x,y,210,210,8); ctx.clip(); ctx.strokeStyle='#262c35'; ctx.lineWidth=1; ctx.globalAlpha=GA; for (let k=-210;k<210;k+=14){ ctx.beginPath(); ctx.moveTo(x+k,y); ctx.lineTo(x+k+210,y+210); ctx.stroke(); } ctx.restore(); ctx.globalAlpha=1; }

// ---------- layouts ----------
// Each layout returns { pieces:[fn(u,run)], boxes:{ref:[x,y,w,h]}, toast:[x,y] }.
// pieces are revealed one by one while the page "loads".
const LAYOUTS = {
  table(d, run) {
    const P = [], B = {};
    const nav = d.nav || [];
    let nx = 530; const navPos = nav.map(s => { const w = mw(s, `400 12px ${M}`); const p = nx; nx += w + 40; return [p, w]; });
    nav.forEach((s,i) => B['nav:'+i] = [navPos[i][0]-6, 338, navPos[i][1]+12, 20]);
    P.push(() => nav.forEach((s,i) => txt(s, navPos[i][0], 352, { font:`400 12px ${M}`, color: i===(d.navActive||0) ? C.text : C.dim })));
    P.push(() => txt(d.heading || '', 446, 380, { font:`500 16px ${M}`, color:C.text }));
    const tools = d.toolbar || [];
    let rx = 1004, lx = 446; const tpos = [];
    tools.forEach((t,i) => { const lab = t.label || t; const w = mw(lab, `500 12px ${M}`) + 36;
      if (t.align === 'left') { tpos[i] = [lx, w]; lx += w + 8; } });
    for (let i=tools.length-1;i>=0;i--) { const t = tools[i]; if (t.align === 'left') continue; const lab = t.label || t; const w = mw(lab, `500 12px ${M}`) + 36; rx -= w; tpos[i] = [rx, w]; rx -= 8; }
    tools.forEach((t,i) => B['tool:'+i] = [tpos[i][0], 406, tpos[i][1], 30]);
    P.push(() => tools.forEach((t,i) => btn(tpos[i][0], 406, tpos[i][1], 30, t.label || t, !!t.primary)));
    const cols = d.columns || [], n = Math.max(1, cols.length), x0 = 480, cw = 524 / n;
    const colX = (j) => { const c = cols[j] || {}; return c.align === 'right' ? x0 + (j+1)*cw - 24 : x0 + j*cw; };
    P.push(() => { fillR(472, 450, 532, 22, 4, '#1b2028'); cols.forEach((c,j) => txt(c.name || c, colX(j), 465, { font:`400 11px ${M}`, color:C.dim, align: c.align === 'right' ? 'right' : 'left' })); });
    const cc = d.cellColors || {};
    (d.rows || []).slice(0,6).forEach((rw, i) => {
      const y = 490 + i*21; B['row:'+i] = [472, y-15, 532, 21];
      P.push(() => rw.forEach((v,j) => { const c = cols[j] || {}; txt(v, colX(j), y, { font:`400 12px ${M}`, color: cc[v] ? colorOf(cc[v]) : (j===0 ? '#aab0ba' : C.text), align: c.align === 'right' ? 'right' : 'left' }); }));
    });
    return { pieces:P, boxes:B, toast:[446, 606] };
  },
  form(d, run) {
    const P = [], B = {};
    P.push(() => txt(d.site || '', 520, 350, { font:`400 12px ${M}`, color:C.dim }));
    P.push(() => txt(d.heading || '', 446, 386, { font:`500 16px ${M}`, color:C.text }));
    const f = (d.fields || []).slice(0,4), gap = f.length > 3 ? 44 : 52;
    f.forEach(([l,v], i) => { const y = 404 + i*gap; B['field:'+i] = [570, y, 300, 30];
      P.push(() => { txt(l, 446, y+20, { font:`400 12px ${M}`, color:C.dim }); fillR(570, y, 300, 30, 6, C.bg); strokeR(570.5, y+.5, 299, 29, 6, C.line2, 1); txt(v, 582, y+20, { font:`400 13px ${M}`, color:C.text }); }); });
    const by = 404 + f.length*gap + 4; let bx = 570;
    const bts = (d.buttons || []).map((b,i,a) => { const w = mw(b, `500 12px ${M}`) + 40; const p = [bx, w]; bx += w + 14; return p; });
    (d.buttons || []).forEach((b,i) => B['btn:'+i] = [bts[i][0], by, bts[i][1], 32]);
    P.push(() => (d.buttons || []).forEach((b,i,a) => btn(bts[i][0], by, bts[i][1], 32, b, i === a.length-1)));
    if (d.note) P.push(() => txt(d.note, 446, 624, { font:`400 12px ${M}`, color:C.faint }));
    return { pieces:P, boxes:B, toast:[720, 604] };
  },
  product(d, run) {
    const P = [], B = {};
    P.push(() => fillR(620, 337, 240, 18, 9, C.bg));
    P.push(() => illo(d.image, 446, 378));
    P.push(() => { txt(d.title || '', 680, 392, { font:`500 16px ${M}`, color:C.text }); txt(d.subtitle || '', 680, 412, { font:`400 12px ${M}`, color:C.dim }); });
    const pf = `600 22px ${M}`;
    B.price = [676, 434, Math.max(150, mw(d.price || '', pf) + 16), 34];
    P.push((u, R) => { const after = d.priceAfter && R.hitAny != null && u >= R.hitAny; txt(after ? d.priceAfter : d.price, 682, 459, { font:pf, color: u >= R.readAt ? C.ok : C.text }); });
    B.stock = [676, 492, Math.max(84, mw(d.stock || '', `400 12px ${M}`) + 12), 20];
    P.push(() => txt(d.stock || '', 680, 507, { font:`400 12px ${M}`, color:'#9aa1ac' }));
    let bx = 680; const bts = (d.buttons || []).slice(0,2).map(b => { const w = mw(b, `500 12px ${M}`) + 44; const p = [bx, w]; bx += w + 10; return p; });
    (d.buttons || []).slice(0,2).forEach((b,i) => B['btn:'+i] = [bts[i][0], 540, bts[i][1], 32]);
    P.push(() => (d.buttons || []).slice(0,2).forEach((b,i) => btn(bts[i][0], 540, bts[i][1], 32, b, i===0)));
    B.link = [676, 598, Math.max(90, mw(d.link || '', `400 12px ${M}`) + 12), 20];
    P.push(() => txt(d.link || '', 680, 612, { font:`400 12px ${M}`, color:C.dim }));
    if (d.priceBefore) P.push((u, R) => { if (u < R.readAt) return; const a = win(u, R.readAt, R.readAt+0.15); const x = B.price[0] + B.price[2] + 14; txt(d.priceBefore, x, 458, { font:`400 12px ${M}`, color:C.dim, alpha:a }); ln(x, 454, x + mw(d.priceBefore, `400 12px ${M}`), 454, C.dim, 1, a); });
    return { pieces:P, boxes:B, toast:[820, 590] };
  },
  list(d, run) {
    const P = [], B = {};
    const side = d.sidebar && d.sidebar.length;
    if (d.query) P.push(() => { fillR(520, 336, 380, 22, 11, C.bg); txt(d.query, 536, 351, { font:`400 12px ${M}`, color:C.text }); });
    if (side) P.push(() => d.sidebar.forEach(([f,n],i) => { txt(f, 446, 372 + i*26, { font:`400 12px ${M}`, color: i===0 ? C.text : C.dim }); if (n) txt(n, 500, 372 + i*26, { font:`400 12px ${M}`, color:C.acc, align:'right' }); }));
    (d.items || []).slice(0,5).forEach((it, i) => {
      if (side) { const y = 364 + i*48; B['item:'+i] = [544, y-16, 460, 40];
        P.push(() => { txt(it.title, 554, y, { font:`500 12.5px ${M}`, color:C.text }); if (it.time) txt(it.time, 996, y, { font:`400 11px ${M}`, color:C.dim, align:'right' }); if (it.sub) txt(it.sub, 554, y+18, { font:`400 12px ${M}`, color:'#9aa1ac' }); });
      } else { const y = 382 + i*50; const tw = mw(it.title, `500 13px ${M}`); B['item:'+i] = [472, y-15, Math.min(530, tw+10), 21];
        P.push(() => { txt(it.title, 476, y, { font:`500 13px ${M}`, color:C.link }); if (it.meta) txt(it.meta, 476, y+18, { font:`400 11px ${M}`, color:C.ok, alpha:0.8 }); if (it.sub) txt(it.sub, 476 + Math.max(200, mw(it.meta||'', `400 11px ${M}`) + 24), y+18, { font:`400 11px ${M}`, color:C.dim }); });
      }
    });
    return { pieces:P, boxes:B, toast:[720, 610] };
  },
  terminal(d, run) {
    const P = [], B = {};
    P.push(() => fillR(PX, PY+72, PW, PH-72, 0, '#0c0e11'));
    (d.lines || []).slice(0,10).forEach((l, i) => {
      const y = 378 + i*24, kind = l.kind || 'out', text = (kind === 'cmd' ? '$ ' : '') + l.text;
      B['line:'+i] = [472, y-15, Math.min(530, mw(text, `400 13px ${M}`) + 10), 21];
      P.push(() => txt(text, 476, y, { font:`400 13px ${M}`, color: kind==='cmd' ? C.text : kind==='ok' ? C.ok : kind==='warn' ? C.warn : kind==='err' ? C.human : '#9aa1ac' }));
    });
    P.unshift(() => txt(d.title || '', 446, 351, { font:`400 12px ${M}`, color:C.dim }));
    return { pieces:P, boxes:B, toast:[720, 610] };
  },
};

// ---------- prepare runs ----------
function prepare() {
  RUNS.forEach(run => {
    const L = (LAYOUTS[run.layout] || LAYOUTS.list)(run.page || {}, run);
    run.L = L;
    run.dec = DEC[run.decider] || firstDec;
    const top = PY+38, span = PH-38;
    const cands = (run.candidates || []).filter(c => L.boxes[c.ref]);
    cands.forEach(c => { c.box = L.boxes[c.ref]; c.cy = c.box[1] + c.box[3]/2; });
    const order = cands.slice().sort((a,b) => (a.box[1]-b.box[1]) || (a.box[0]-b.box[0]));
    order.forEach((c,i) => { c.id = 'e'+(i+1); c.idx = i; c.stamp = T.scan[0] + clamp((c.cy - top)/span) * (T.scan[1]-T.scan[0]) + i*0.02;
      c.left = c.box[1] < 350 || /^(item|line|row):/.test(c.ref); });
    run.order = order; run.winners = order.filter(c => c.win);
    const seg = (T.exec[1]-T.exec[0]) / Math.max(1, run.winners.length);
    run.winners.forEach((c,k) => c.hit = T.exec[0] + k*seg + seg*0.6);
    run.hitAny = run.winners.length ? run.winners[0].hit : null;
    run.readAt = T.read[0] + 0.3;
    run.lockAt = run.dec.pick ? 2.85 : 2.8;
  });
}
function tagPos(c){ const [bx,by,bw,bh] = c.box; return c.left ? [bx-30, by+(bh-13)/2] : [bx-4, by-17]; }

// ---------- draw ----------
function draw(t) {
  if (!NR) return;
  const e = CLK.at(t), ri = e.i, r = e.r, run = RUNS[ri];
  const u = e.intro ? 0 : U0 + e.p * (RUN-U0);
  const cam = cameraAmount(r);
  const pk = PACKS[run.pack];
  const focus = { x:60, y:184, w: 76 + mw(run.client, `500 13px ${M}`) + 38 + mw(run.request, `400 16px ${M}`) + 24 - 60, h:64 };
  beginCamera(cam, focus);
  const fade = e.intro ? 1 : clamp((RUN-u)/0.25);
  header(t, ri);
  inputBar(184, run.client, run.request, typeProgress(r), pk ? { label: meta.packLabel == null ? 'pack' : meta.packLabel, value: pk.name, note: pk.note } : null, chipProgress(r), t);
  veil(52,176,976,80, 0.35 + 0.65*band(u, -1, 0.8));
  browser(run, u, fade);
  veil(422,262,606,384, 0.35 + 0.65*Math.max(band(u, 0.45, 2.35), band(u, 2.9, 4.95)));
  table(run, u, fade);
  veil(422,652,606,236, 0.35 + 0.65*band(u, 1.1, 3.05));
  rail(run, u, fade);
  packsGrid(ri, u);
  veil(52,958,976,300, 0.35 + 0.65*band(u, 4.75, 9));
  GA = 1;
  flyingTags(run, u, fade);
  footer();
  endCamera(cam, { x:56, y:180, w:968, h:108 });
}

function rail(run, u, fade) {
  txt(meta.railTitle || 'trace', 60, 318, { font:`600 14px ${S}`, color:C.dim });
  ln(76, RAIL_Y(0), 76, RAIL_Y(6), C.line2, 2);
  let prog = 0; STAGE.forEach(([a,b],i) => { if (u >= a) prog = i + clamp((u-a)/(b-a)); });
  const py = RAIL_Y(0) + Math.min(prog, 6) * 78;
  GA = fade; ln(76, RAIL_Y(0), 76, py, C.acc, 2); GA = 1;
  STAGES.slice(0,7).forEach((lab, i) => {
    const st = (run.steps || [])[i] || ['', ''];
    const y = RAIL_Y(i), [a,b] = STAGE[i], active = u >= a && u < b, done = u >= b;
    let col = C.acc; if (i===2) col = run.dec.color; if (i===3 && run.approval) col = C.human; if (i===5) col = C.ok;
    dot(76, y, 9, C.bg); ctx.beginPath(); ctx.arc(76,y,8,0,Math.PI*2); ctx.strokeStyle = (active||done) ? col : C.line2; ctx.lineWidth = 2; ctx.globalAlpha = 1; ctx.stroke();
    if (done) { GA = fade; dot(76, y, 4.5, col); GA = 1; }
    if (active) { const p = (u - a) * 5; dot(76, y, 4.5, col, 0.6 + 0.4*Math.abs(Math.sin(p))); ctx.beginPath(); ctx.arc(76,y,12+(p%1)*8,0,Math.PI*2); ctx.strokeStyle=hexA(col, 0.5*(1-(p%1))); ctx.lineWidth=1.5; ctx.stroke(); }
    txt(lab, 102, y+5, { font:`500 16px ${M}`, color: active ? C.text : done ? '#a9afb8' : C.faint });
    GA = fade;
    if (active || done) {
      let d = st[0];
      if (i===3 && run.approval) d = u >= 3.35 ? (run.approval.railDone || d) : (run.approval.railWaiting || d);
      const k = Math.floor(d.length * clamp((u - a)/0.25));
      txt(d.slice(0,k), 102, y+27, { font:`400 12.5px ${M}`, color: active ? (i===2||i===3 ? col : C.text) : C.dim });
      if (done && st[1]) txt(st[1], 400, y+5, { font:`400 12px ${M}`, color:C.faint, align:'right' });
    }
    GA = 1;
  });
  if (u < STAGE[6][1]) { GA = fade; ctx.save(); ctx.shadowColor=C.acc; ctx.shadowBlur=16; dot(76, py, 5, C.acc); ctx.restore(); GA = 1; }
}

function browser(run, u, fade) {
  const X=PX, Y=PY, BW=PW, BH=PH, term = run.layout === 'terminal';
  fillR(X,Y,BW,BH,12,C.surf); strokeR(X+.5,Y+.5,BW-1,BH-1,12,C.line2,1);
  [0,1,2].forEach(i => dot(X+18+i*14, Y+19, 4, C.line2));
  fillR(X+66, Y+8, 420, 22, 6, C.bg);
  GA = fade * win(u, 0.45, 0.6);
  if (!term) { ctx.strokeStyle=C.dim; ctx.lineWidth=1.4; ctx.globalAlpha=GA; ctx.beginPath(); ctx.arc(X+80, Y+17, 3.5, Math.PI, 0); ctx.stroke(); ctx.fillStyle=C.dim; ctx.fillRect(X+75, Y+17, 10, 7); ctx.globalAlpha=1; }
  txt(run.url || '', X+(term?80:92), Y+24, { font:`400 12px ${M}`, color:'#aab0ba' });
  const badge = run.urlBadge != null ? run.urlBadge : (meta.urlBadge || ''); if (badge) txt(badge, X+BW-18, Y+24, { font:`500 12px ${M}`, color:C.ok, align:'right', alpha:win(u,0.7,0.85) });
  GA = 1;
  txt(run.surfaceLabel || meta.surfaceLabel || 'browser', X+BW-18, Y-10, { font:`400 12px ${M}`, color:C.faint, align:'right' });
  ln(X, Y+38.5, X+BW, Y+38.5, C.line, 1);
  ctx.save(); rrect(X,Y+39,BW,BH-39,12); ctx.clip();
  if (u >= T.load[0] && u < T.load[1]+0.1) { GA = fade; fillR(X, Y+39, BW*ease(win(u,T.load[0],T.load[1])), 2, 0, C.acc); }
  GA = fade;
  page(run, u);
  if (u >= T.scan[0] && u < T.scan[1]+0.05) { const sy = lerp(Y+40, Y+BH, win(u,T.scan[0],T.scan[1])); ln(X, sy, X+BW, sy, C.acc, 1.5, 0.85); fillR(X, sy-36, BW, 36, 0, hexA(C.acc, 0.05)); }
  if (u >= T.read[0] && u < T.read[1]) { const sy = lerp(Y+40, Y+BH, win(u,T.read[0],T.read[0]+0.45)); ln(X, sy, X+BW, sy, C.ok, 1.5, 0.85); fillR(X, sy-36, BW, 36, 0, hexA(C.ok, 0.05)); }
  run.order.forEach(c => {
    const [bx,by,bw,bh] = c.box, ap = win(u, c.stamp, c.stamp + 0.08);
    if (ap <= 0) return;
    const locked = c.win && u >= run.lockAt, dimmed = c.p == null;
    const col = locked ? run.dec.color : (dimmed ? C.faint : '#8b93a0');
    if (c.hit != null && u >= c.hit) fillR(bx-3, by-3, bw+6, bh+6, 6, hexA(run.dec.color, 0.18*clamp((u-c.hit)/0.15)));
    strokeR(bx-3.5, by-3.5, bw+7, bh+7, 6, col, locked ? 2 : 1, ap, locked ? null : [4,3]);
    const pop = 1 + 0.25*(1-win(u, c.stamp, c.stamp+0.12)); const [tx, ty] = tagPos(c);
    ctx.save(); ctx.translate(tx+11, ty+6.5); ctx.scale(pop, pop); tagChip(-11, -6.5, c.id, col, ap); ctx.restore();
    if (run.winMark && c.hit != null && u >= c.hit) { const a = win(u, c.hit, c.hit+0.15), mwid = mw(run.winMark, `500 11px ${M}`) + 20; fillR(bx+bw-mwid-6, by+bh-22, mwid, 18, 9, hexA(C.acc, 0.2*a)); txt(run.winMark, bx+bw-6-mwid/2, by+bh-9, { font:`500 11px ${M}`, color:C.acc, align:'center', alpha:a }); }
  });
  if (u >= T.exec[0] && u < T.read[1] && run.winners.length) {
    const n = run.winners.length, seg = (T.exec[1]-T.exec[0]) / n; let cx = X+BW-60, cy = Y+BH-40;
    run.winners.forEach((c, k) => { const [bx,by,bw,bh] = c.box, tx = bx+Math.min(bw*0.6, 90), ty = by+bh*0.55, a = T.exec[0] + k*seg, p = ease(win(u, a, a+seg*0.6));
      if (u >= a) { cx = lerp(cx, tx, p); cy = lerp(cy, ty, p); }
      if (u >= c.hit && u < c.hit+0.35) { const q=(u-c.hit)/0.35; ctx.beginPath(); ctx.arc(tx, ty, 6+q*24, 0, Math.PI*2); ctx.strokeStyle=hexA(C.acc, 0.9*(1-q)); ctx.lineWidth=2; ctx.globalAlpha=GA; ctx.stroke(); ctx.globalAlpha=1; } });
    cursor(cx, cy);
  }
  const ap = run.approval;
  if (ap && u >= T.gate[0] && u < T.gate[1]+0.1) {
    GA = fade * win(u,T.gate[0],T.gate[0]+0.12) * (1 - win(u,3.58,3.72));
    fillR(X, Y+39, BW, BH-39, 0, 'rgba(10,12,15,0.6)');
    const cx = X+130, cy = Y+105;
    fillR(cx, cy, 330, 156, 12, C.surf2); strokeR(cx+.5, cy+.5, 329, 155, 12, C.human, 1.5);
    txt(ap.heading || 'approval needed', cx+20, cy+30, { font:`600 13px ${M}`, color:C.human });
    txt(ap.title || '', cx+20, cy+56, { font:`500 15px ${M}`, color:C.text });
    txt(ap.detail || '', cx+20, cy+78, { font:`400 12px ${M}`, color:C.dim });
    const pressed = u >= 3.35;
    fillR(cx+20, cy+98, 150, 36, 8, pressed ? C.human : '#2b3140');
    txt(pressed ? (ap.done || 'approved') : (ap.button || 'approve once'), cx+95, cy+121, { font:`600 13px ${M}`, color: pressed ? C.bg : C.text, align:'center' });
    if (ap.via) txt(ap.via, cx+186, cy+121, { font:`400 12px ${M}`, color:C.dim });
    if (u >= 3.35 && u < 3.65) { const q=(u-3.35)/0.3; ctx.beginPath(); ctx.arc(cx+95, cy+116, 10+q*40, 0, Math.PI*2); ctx.strokeStyle=hexA(C.human, 0.8*(1-q)); ctx.lineWidth=2; ctx.globalAlpha=GA; ctx.stroke(); ctx.globalAlpha=1; }
  }
  if (!ap && run.gatePill && u >= T.gate[0] && u < T.gate[1]) {
    GA = fade * win(u,T.gate[0],T.gate[0]+0.1) * (1 - win(u,3.5,3.65));
    const pw = mw(run.gatePill, `500 12px ${M}`) + 36;
    fillR(X+BW-16-pw, Y+BH-44, pw, 30, 15, C.surf2); strokeR(X+BW-15.5-pw, Y+BH-43.5, pw-1, 29, 15, C.ok, 1);
    txt(run.gatePill, X+BW-16-pw/2, Y+BH-24, { font:`500 12px ${M}`, color:C.ok, align:'center' });
  }
  ctx.restore(); GA = 1;
}

function page(run, u) {
  if (u < T.load[0]) return;
  const g0 = GA, L = run.L;
  fillR(PX, PY+38, PW, 34, 0, '#1b2028', win(u, T.load[0], T.load[0]+0.1));
  if (run.layout !== 'terminal') fillR(446, 340, 56, 10, 3, '#3a414d', win(u, T.load[0], T.load[0]+0.1));
  const step = Math.min(0.07, 0.6 / Math.max(1, L.pieces.length));
  L.pieces.forEach((fn, i) => { const a = win(u, T.load[0] + 0.08 + i*step, T.load[0] + 0.2 + i*step); if (a <= 0) return;
    GA = g0*a; ctx.save(); ctx.translate(0, (1-a)*6); fn(u, run); ctx.restore(); GA = g0; });
  if (run.toast && u >= run.readAt) { const a = win(u, run.readAt, run.readAt+0.15), [tx, ty] = L.toast, tw = mw(run.toast, `500 12px ${M}`) + 24;
    const x = Math.min(tx, 1004 - tw); fillR(x, ty, tw, 24, 6, hexA(C.ok, 0.16*a)); txt(run.toast, x+12, ty+16, { font:`500 12px ${M}`, color:C.ok, alpha:a }); }
  GA = g0;
}

function table(run, u, fade) {
  const X=430, Y=662;
  fillR(X,Y,590,218,12,C.surf); strokeR(X+.5,Y+.5,589,217,12,C.line2,1);
  GA = fade;
  const gx0 = 800, gw = 190, gate = gx0 + gw*GATE;
  const hdr = run.scoreLabel || `p (${run.dec.label})`;
  [['candidate',446],['role',540],['label',626],[hdr,800]].forEach(([s,x]) => txt(s, x, Y+26, { font:`400 11px ${M}`, color:C.dim }));
  ln(gate, Y+36, gate, Y+184, C.dim, 1, 0.8, [3,3]);
  txt(meta.gateLabel || `gate ${GATE.toFixed(2)}`, gate, Y+26, { font:`400 11px ${M}`, color:C.dim, align:'center' });
  const first = run.order[0];
  if (first && u < first.stamp + FLY) txt(meta.waitingLabel || 'waiting for observe', X+295, Y+120, { font:`400 12px ${M}`, color:C.faint, align:'center', alpha: 1 - win(u, first.stamp, first.stamp+FLY) });
  run.order.forEach(c => {
    const y = TROW(c.idx), vis = win(u, c.stamp + FLY - 0.04, c.stamp + FLY + 0.08);
    if (vis <= 0) return;
    const locked = c.win && u >= run.lockAt;
    if (locked) fillR(X+8, y-17, 574, 26, 6, hexA(run.dec.color, 0.1));
    const col = locked ? run.dec.color : (c.p==null ? C.faint : C.text);
    txt(c.id, 446, y, { font:`600 13px ${M}`, color:col, alpha:vis });
    txt(c.role || '', 540, y, { font:`400 13px ${M}`, color: c.p==null ? C.faint : C.dim, alpha:vis });
    txt(c.label || '', 626, y, { font:`400 13px ${M}`, color:col, alpha:vis });
    if (c.p == null) { txt(meta.unscoredLabel || 'not scored', gx0, y, { font:`400 11px ${M}`, color:C.faint, alpha:vis * win(u, T.judge[0], T.judge[0]+0.2) }); return; }
    fillR(gx0, y-9, gw, 8, 4, '#232932', vis);
    const g = ease(win(u, T.judge[0] + c.idx*0.06, T.judge[0] + 0.35 + c.idx*0.06));
    const barC = (locked || c.p >= GATE) ? run.dec.color : '#6b7280';
    fillR(gx0, y-9, gw*c.p*g, 8, 4, barC);
    if (g > 0) txt((c.p*g).toFixed(2), gx0-10, y, { font:`400 12px ${M}`, color:C.dim, align:'right' });
    if (locked && run.dec.pick) txt(run.dec.pick, 1004, y+14, { font:`500 10px ${M}`, color:run.dec.color, align:'right' });
  });
  if (u >= 2.8 && run.verdict) txt(run.verdict, 446, Y+206, { font:`500 12px ${M}`, color:run.dec.color, alpha:win(u,2.8,3.0) });
  GA = 1;
}

function flyingTags(run, u, fade) {
  GA = fade;
  run.order.forEach(c => { const a = c.stamp, b = c.stamp + FLY; if (u < a || u >= b) return;
    const p = ease((u-a)/FLY), [sx, sy] = tagPos(c), ex = 435, ey = TROW(c.idx) - 11;
    const x = lerp(sx, ex, p), y = lerp(sy, ey, p) - Math.sin(p*Math.PI)*20;
    ln(sx+11, sy+6, x+11, y+6, C.acc, 1, 0.35*(1-p)); tagChip(x, y, c.id, C.acc, 1); });
  GA = 1;
}

function packsGrid(ri, u) {
  ln(60, 912.5, 1020, 912.5, C.line, 1);
  txt(meta.packsTitle || 'Completed runs', 60, 946, { font:`600 17px ${S}`, color:C.text });
  const counts = PACKS.map(p => p.count || 0);
  for (let k=0;k<ri;k++) if (counts[RUNS[k].pack] != null) counts[RUNS[k].pack]++;
  const cur = RUNS[ri].pack, land = T.recipe[1];
  if (u >= land && counts[cur] != null) counts[cur]++;
  const total = counts.reduce((a,b)=>a+b,0);
  txt((meta.packsTotal || '{n} total').replace('{n}', total).replace('{k}', PACKS.length), 1020, 946, { font:`400 13px ${M}`, color:C.dim, align:'right' });
  PACKS.slice(0,8).forEach((pk, i) => {
    const c = i%4, r = Math.floor(i/4), x = 60 + c*242, y = 966 + r*152, w = 234, h = 142;
    const isCur = i === cur && u >= 0.55 && u < RUN-0.1;
    const flash = i === cur && u >= land ? Math.max(0, 1 - (u-land)/0.5) : 0;
    fillR(x,y,w,h,10, flash > 0 ? hexA(C.acc, 0.08 + 0.14*flash) : C.surf);
    strokeR(x+.5,y+.5,w-1,h-1,10, isCur ? C.acc : C.line, isCur ? 1.5 : 1, isCur ? clamp((u-0.55)/0.2) : 1);
    txt(pk.name, x+16, y+30, { font:`500 14px ${M}`, color:C.text });
    txt(pk.note || '', x+16, y+50, { font:`400 11.5px ${M}`, color:C.dim });
    txt(String(counts[i]), x+16, y+118, { font:`600 34px ${M}`, color: isCur ? C.acc : C.text });
    for (let k=0;k<counts[i] && k<32;k++) { const col = k%8, row = Math.floor(k/8), dx = x + w - 16 - (7-col)*11, dy = y + 124 - (3-row)*11, newest = k === counts[i]-1 && flash > 0;
      dot(dx, dy, newest ? 3.4 : 2.6, newest ? C.acc : '#8b93a0', newest ? 1 : 0.8); }
  });
  if (u >= T.recipe[0] && u < land && cur < 8) {
    const p = ease(win(u, T.recipe[0], land)), c = cur%4, r = Math.floor(cur/4);
    const ex = 60 + c*242 + 117, ey = 966 + r*152 + 70, sx = 76, sy = RAIL_Y(6);
    const x = (1-p)*(1-p)*sx + 2*(1-p)*p*((sx+ex)/2) + p*p*ex, y = (1-p)*(1-p)*sy + 2*(1-p)*p*(sy+40) + p*p*ey;
    ctx.save(); ctx.shadowColor = C.acc; ctx.shadowBlur = 18; dot(x, y, 6, C.acc); ctx.restore();
  }
}


function toReal(u){ return INTRO + (u - U0) * MAIN / (RUN - U0); }
const TPL = { clock: CLK, count: NR, prepare, draw,
  keys: [['intro', Math.max(0.1, INTRO-0.5)], ['label', toReal(1.9)], ['judge', toReal(2.9)], ['gate', toReal(3.3)], ['verify', toReal(4.7)]] };
boot(TPL);
