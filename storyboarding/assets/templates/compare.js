/* template: compare — the same task done two ways, side by side.
   For tools whose value is replacing a manual or slower workflow.
   Episode: task typed -> both columns start; the tool column finishes fast and verifies; the manual column grinds on -> metric bars, running total. */
const EPS = SB.episodes || [];
const NE = EPS.length;
const MAIN = meta.runSeconds || 8.0;
const CLK = clock(NE, MAIN);
const COLS = [{ x:60, key:'before' }, { x:550, key:'after' }];
const CW = 470, CY = 300, CH = 580;
const RUNS_AT = { before:[0.03, 0.82], after:[0.03, 0.3] }, BARS = [0.82, 0.95];

function prepare() {
  EPS.forEach(e => ['before','after'].forEach(k => {
    const side = e[k] || {}; side.steps = (side.steps || []).slice(0, k === 'before' ? 9 : 7);
    const [a, b] = RUNS_AT[k], n = Math.max(1, side.steps.length);
    const mins = side.steps.map(s => Math.max(0.01, parseDuration(s.dur)));
    const tot = mins.reduce((x,y) => x+y, 0);
    let acc = 0; side.steps.forEach((s, j) => { s.start = a + (b-a) * acc/tot; acc += mins[j]; s.end = a + (b-a) * acc/tot; });
    side.minutes = parseDuration(side.total) || tot; e[k] = side;
  }));
}

function draw(t) {
  if (!NE) return;
  const E = CLK.at(t), i = E.i, ep = EPS[i], p = E.p, cam = cameraAmount(E.r);
  const focus = { x:60, y:184, w: 76 + mw(ep.client || '', `500 13px ${M}`) + 38 + mw(ep.request, `400 16px ${M}`) + 24 - 60, h:64 };
  beginCamera(cam, focus);
  header(t, i);
  inputBar(184, ep.client, ep.request, typeProgress(E.r), ep.chip || null, chipProgress(E.r), t);
  veil(52,176,976,80, 0.35 + 0.65*(E.intro ? 1 : band(p, -1, 0.06)));
  COLS.forEach(c => column(c, ep, E, t));
  veil(52, CY-12, 976, CH+20, 0.35 + 0.65*(E.intro ? 0 : band(p, 0, 0.86)));
  metrics(ep, E);
  veil(52, 904, 976, 360, 0.35 + 0.65*(E.intro ? 0 : band(p, 0.78, 1.3)));
  footer();
  endCamera(cam, { x:56, y:180, w:968, h: ep.chip ? 108 : 72 });
}

function column(c, ep, E, t) {
  const side = ep[c.key] || {}, after = c.key === 'after', x = c.x, p = E.intro ? 0 : E.p;
  const info = meta[c.key] || {};
  if (after) { ctx.save(); ctx.shadowColor = hexA(C.acc,0.25); ctx.shadowBlur = 18; fillR(x, CY, CW, CH, 12, C.surf); ctx.restore(); strokeR(x+.5, CY+.5, CW-1, CH-1, 12, C.acc, 1.5); }
  else panel(x, CY, CW, CH);
  txt(info.title || (after ? 'with ' + (meta.name || 'tool') : 'by hand'), x+20, CY+34, { font:`600 16px ${S}`, color: after ? C.acc : C.dim });
  if (info.note) txt(info.note, x+CW-20, CY+34, { font:`400 12px ${M}`, color:C.faint, align:'right' });
  // clock
  const [a, b] = RUNS_AT[c.key], q = clamp((p - a)/(b - a)), done = p >= b;
  txt(fmtClock(side.minutes * q), x+20, CY+86, { font:`600 34px ${M}`, color: done ? (after ? C.ok : C.text) : (after ? C.text : '#b8bec8') });
  txt(done ? (side.total || '') : (after ? (meta.afterRunning || 'running') : (meta.beforeRunning || 'in progress')), x+CW-20, CY+84, { font:`400 12px ${M}`, color: done ? (after ? C.ok : C.dim) : C.faint, align:'right' });
  let y0 = CY+124;
  if (side.command) { fillR(x+16, y0-2, CW-32, 30, 6, '#0c0e11'); txt((meta.prompt || '$') + ' ' + side.command, x+28, y0+18, { font:`400 13px ${M}`, color:C.text }); y0 += 44; }
  ln(x+16, y0+0.5, x+CW-16, y0+0.5, C.line, 1);
  const rowH = after ? 40 : 42;
  side.steps.forEach((s, j) => {
    const y = y0 + 30 + j*rowH, started = p >= s.start, finished = p >= s.end, err = s.flag === 'err';
    const col = err ? C.human : (after ? C.ok : '#9aa1ac');
    if (!started) { dot(x+28, y-4, 5, C.line2); txt(s.text, x+46, y, { font:`400 13px ${M}`, color:C.faint }); txt(s.dur || '', x+CW-20, y, { font:`400 12px ${M}`, color:C.faint, align:'right' }); return; }
    if (!finished) { const ang = t*8; ctx.beginPath(); ctx.arc(x+28, y-4, 6, ang, ang+Math.PI*1.4); ctx.strokeStyle = after ? C.acc : C.dim; ctx.lineWidth = 2; ctx.globalAlpha = GA; ctx.stroke(); ctx.globalAlpha = 1;
      fillR(x+10, y-20, CW-20, 26, 5, hexA(after ? C.acc : '#8b93a0', 0.07)); }
    else { dot(x+28, y-4, 6, col); txt(err ? '!' : 'ok', x+28, y-1, { font:`600 8.5px ${M}`, color:C.bg, align:'center' }); }
    txt(s.text, x+46, y, { font:`400 13px ${M}`, color: finished ? (err ? C.human : C.text) : C.text });
    txt(s.dur || '', x+CW-20, y, { font:`400 12px ${M}`, color: finished ? C.dim : C.faint, align:'right' });
    if (finished && err && s.note) txt(s.note, x+46, y+15, { font:`400 11px ${M}`, color:C.human });
  });
  if (after && done && side.result) { const a2 = win(p, b, b+0.04); toastAt(x+16, CY+CH-44, side.result, 'ok', a2); }
  if (!after && done && side.result) { const a2 = win(p, b, b+0.04); toastAt(x+16, CY+CH-44, side.result, side.resultColor || 'dim', a2); }
}

function metrics(ep, E) {
  ln(60, 912.5, 1020, 912.5, C.line, 1);
  txt(meta.metricsTitle || 'Difference', 60, 946, { font:`600 17px ${S}`, color:C.text });
  // running total of saved minutes across episodes
  let saved = 0; EPS.forEach((e, k) => { if (k < E.i || (k === E.i && !E.intro && E.p >= BARS[1])) saved += Math.max(0, e.before.minutes - e.after.minutes); });
  const st = meta.savedLabel || 'saved so far';
  const hrs = saved >= 60 ? (saved/60).toFixed(1) + 'h' : Math.round(saved) + 'm';
  txt(`${st}  ${hrs}`, 1020, 946, { font:`500 14px ${M}`, color:C.acc, align:'right' });
  const ms = (ep.metrics || []).slice(0, 4), g = E.intro ? 0 : ease(win(E.p, BARS[0], BARS[1]));
  const labB = (meta.before || {}).short || 'before', labA = (meta.after || {}).short || 'after';
  txt(labB, 360, 978, { font:`400 11px ${M}`, color:C.dim }); dot(350, 974, 4, '#5a616d');
  txt(labA, 460, 978, { font:`400 11px ${M}`, color:C.dim }); dot(450, 974, 4, C.acc);
  ms.forEach((m, j) => {
    const y = 1012 + j*62, mx = Math.max(m.before, m.after, 0.0001);
    txt(m.label, 60, y+6, { font:`400 14px ${M}`, color:C.text });
    const bx = 300, bw = 560;
    fillR(bx, y-8, bw * (m.before/mx) * g, 12, 4, '#5a616d');
    fillR(bx, y+10, Math.max(3, bw * (m.after/mx) * g), 12, 4, C.acc);
    const fmt = v => (m.decimals != null ? v.toFixed(m.decimals) : (Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(1))) + (m.unit || '');
    if (g > 0.05) { txt(fmt(m.before * g), 1020, y+2, { font:`400 12px ${M}`, color:C.dim, align:'right' }); txt(fmt(m.after * g), 1020, y+20, { font:`600 12px ${M}`, color:C.acc, align:'right' }); }
  });
}

const TPL = { clock: CLK, count: NE, prepare, draw,
  keys: [['intro', Math.max(0.1, INTRO-0.5)], ['race', INTRO + 0.2*MAIN], ['grind', INTRO + 0.6*MAIN], ['result', INTRO + 0.98*MAIN]] };
boot(TPL);
