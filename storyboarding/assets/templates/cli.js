/* template: cli — a terminal session and what it changed.
   For command-line tools, build/dev tools, migration and codegen tools, libraries with a CLI.
   Episode: command typed -> output streams -> changed files appear -> checks run -> metrics count up, history row added. */
const EPS = SB.episodes || [];
const NE = EPS.length;
const MAIN = meta.runSeconds || 8.0;
const CLK = clock(NE, MAIN);
const TX = 60, TY = 184, TW = 640, TH = 700;         // terminal
const LINE0 = 300, LH = 24;
const STREAM = [0.03, 0.56], CHECKS = [0.6, 0.86], COUNT = [0.86, 0.96];
const METRICS = (meta.metrics || []).slice(0, 4);

function prepare() {
  EPS.forEach(e => {
    e.lines = (e.lines || []).slice(0, 20);
    const n = Math.max(1, e.lines.length), span = STREAM[1] - STREAM[0];
    e.lines.forEach((l, j) => { l.at = STREAM[0] + j * span / n; l.end = STREAM[0] + (j+1) * span / n; });
    (e.files || []).forEach((f, j) => { const li = f.line != null ? Math.min(f.line, n-1) : Math.floor((j+1) * n / ((e.files.length || 1) + 1)); f.at = e.lines[li] ? e.lines[li].at : STREAM[0]; });
    const cs = (e.checks || []).slice(0, 8), cn = Math.max(1, cs.length);
    cs.forEach((c, j) => { c.at = CHECKS[0] + j * (CHECKS[1]-CHECKS[0]) / cn; c.done = c.at + (CHECKS[1]-CHECKS[0]) / cn * 0.8; });
    e.checks = cs;
  });
}

function promptText(e) { return (meta.prompt || '$') + ' ' + e.command; }

function draw(t) {
  if (!NE) return;
  const E = CLK.at(t), i = E.i, ep = EPS[i], p = E.p, cam = cameraAmount(E.r);
  const pw = mw(promptText(ep), `400 17px ${M}`);
  const focus = { x:TX, y:TY+54, w: Math.max(420, pw + 60), h:40 };
  beginCamera(cam, focus);
  header(t, i);
  terminal(ep, E, t);
  veil(TX-8, TY+96, TW+16, TH-96, 0.35 + 0.65*(E.intro ? 0 : band(p, 0, 0.62)));
  changes(ep, E);
  veil(712, TY-24, 316, 380, 0.35 + 0.65*(E.intro ? 0 : band(p, 0.04, 0.62)));
  checks(ep, E, t);
  veil(712, 556, 316, 336, 0.35 + 0.65*(E.intro ? 0 : band(p, 0.56, 0.95)));
  bottom(ep, E);
  veil(52, 904, 976, 360, 0.35 + 0.65*(E.intro ? 0 : band(p, 0.82, 1.3)));
  footer();
  endCamera(cam, { x:TX-4, y:TY+50, w: Math.min(TW+8, pw + 70), h:48 });
}

function terminal(ep, E, t) {
  windowChrome(TX, TY, TW, TH, meta.shellTitle || '~/project', { label: meta.surfaceLabel || 'terminal' });
  fillR(TX+1, TY+39, TW-2, TH-40, 11, '#0c0e11');
  const typeF = typeProgress(E.r), pt = promptText(ep), shown = pt.slice(0, Math.floor(pt.length * typeF));
  const pf = `400 17px ${M}`, pre = (meta.prompt || '$') + ' ';
  txt(pre, TX+20, TY+80, { font:pf, color:C.acc });
  txt(shown.slice(pre.length), TX+20+mw(pre, pf), TY+80, { font:pf, color:C.text });
  if ((E.intro || E.p < 0.03) && Math.floor(t*4)%2===0) { ctx.fillStyle=C.acc; ctx.fillRect(TX+22+mw(shown, pf), TY+64, 9, 20); }
  if (E.intro) return;
  const p = E.p;
  ep.lines.forEach((l, j) => {
    if (p < l.at) return;
    const a = win(p, l.at, l.at+0.02), y = LINE0 + 20 + j*LH, k = l.kind || 'out';
    const col = k==='ok' ? C.ok : k==='warn' ? C.warn : k==='err' ? C.human : k==='head' ? C.text : k==='dim' ? C.faint : '#9aa1ac';
    const font = k==='head' ? `600 13.5px ${M}` : `400 13.5px ${M}`;
    const maxw = TW - 40 - (k === 'progress' ? 150 : 0); let text = l.text; while (mw(text, font) > maxw && text.length > 4) text = text.slice(0, -2) + '…';
    if (k === 'progress') {
      const q = clamp((p - l.at) / Math.max(0.01, l.end - l.at)), full = p >= l.end, bw = 120, bx = TX + TW - 20 - bw;
      txt(text, TX+20, y, { font, color:'#9aa1ac', alpha:a });
      if (!full) { fillR(bx, y-10, bw, 8, 4, '#232932', a); fillR(bx, y-10, bw*ease(q), 8, 4, C.acc, a); }
      else txt(l.done || 'done', TX + TW - 20, y, { font, color:C.ok, alpha:a, align:'right' });
    } else txt(text, TX+20, y, { font, color:col, alpha:a });
  });
  if (p >= STREAM[1] && ep.toast) toastAt(TX+20, TY+TH-44, ep.toast, ep.toastColor || 'ok', win(p, STREAM[1], STREAM[1]+0.05));
}

function changes(ep, E) {
  const X = 720, Y = TY, Wd = 300, Ht = 356;
  panel(X, Y, Wd, Ht);
  txt(meta.changesTitle || 'Changes', X+18, Y+30, { font:`600 14px ${S}`, color:C.text });
  const fs = (ep.files || []).slice(0, 10), shown = E.intro ? [] : fs.filter(f => E.p >= f.at);
  const counts = { '+':0, '~':0, '-':0 }; shown.forEach(f => counts[f.change || '~']++);
  txt(`+${counts['+']}  ~${counts['~']}  -${counts['-']}`, X+Wd-18, Y+30, { font:`400 12px ${M}`, color:C.dim, align:'right' });
  ln(X+14, Y+44.5, X+Wd-14, Y+44.5, C.line, 1);
  if (!shown.length) txt(meta.changesEmpty || 'nothing yet', X+18, Y+74, { font:`400 12px ${M}`, color:C.faint });
  fs.forEach((f, j) => {
    if (E.intro || E.p < f.at) return;
    const a = win(E.p, f.at, f.at+0.03), y = Y+72 + j*28, ch = f.change || '~';
    const col = ch==='+' ? C.ok : ch==='-' ? C.human : C.acc;
    const fresh = clamp(1 - (E.p - f.at)/0.12);
    if (fresh > 0) fillR(X+10, y-17, Wd-20, 24, 5, hexA(col, 0.12*fresh));
    txt(ch, X+20, y, { font:`600 13px ${M}`, color:col, alpha:a });
    let path = f.path; const maxw = Wd - 56; while (mw(path, `400 12.5px ${M}`) > maxw && path.length > 4) path = '…' + path.slice(2);
    txt(path, X+38, y, { font:`400 12.5px ${M}`, color:C.text, alpha:a });
  });
}

function checks(ep, E, t) {
  const X = 720, Y = 560, Wd = 300, Ht = 324;
  panel(X, Y, Wd, Ht);
  txt(meta.checksTitle || 'Checks', X+18, Y+30, { font:`600 14px ${S}`, color:C.text });
  ln(X+14, Y+44.5, X+Wd-14, Y+44.5, C.line, 1);
  ep.checks.forEach((c, j) => {
    const y = Y+76 + j*32, started = !E.intro && E.p >= c.at, finished = !E.intro && E.p >= c.done;
    const res = c.result || 'pass', col = res==='pass' ? C.ok : res==='fail' ? C.human : C.faint;
    if (!started) { dot(X+24, y-4, 4, C.line2); txt(c.name, X+40, y, { font:`400 12.5px ${M}`, color:C.faint }); return; }
    if (!finished) { const a = t*8; ctx.beginPath(); ctx.arc(X+24, y-4, 6, a, a+Math.PI*1.4); ctx.strokeStyle=C.acc; ctx.lineWidth=2; ctx.globalAlpha=GA; ctx.stroke(); ctx.globalAlpha=1; }
    else { dot(X+24, y-4, 6, col); txt(res==='pass' ? 'ok' : res==='fail' ? '!' : '-', X+24, y, { font:`600 8.5px ${M}`, color:C.bg, align:'center' }); }
    txt(c.name, X+40, y, { font:`400 12.5px ${M}`, color: finished ? C.text : C.dim });
    if (finished && c.note) txt(c.note, X+Wd-16, y, { font:`400 11px ${M}`, color:col, align:'right' });
  });
}

function bottom(ep, E) {
  ln(60, 912.5, 1020, 912.5, C.line, 1);
  txt(meta.metricsTitle || 'This session', 60, 946, { font:`600 17px ${S}`, color:C.text });
  const settled = k => k < E.i || (k === E.i && !E.intro && E.p >= COUNT[0]);
  METRICS.forEach((m, c) => {
    const x = 60 + c*242, y = 966, w = 234, h = 130;
    fillR(x, y, w, h, 10, C.surf); strokeR(x+.5, y+.5, w-1, h-1, 10, C.line, 1);
    txt(m.label, x+16, y+28, { font:`500 13px ${M}`, color:C.dim });
    const vals = EPS.map(e => +((e.metrics || {})[m.key] || 0));
    let v = 0; for (let k=0;k<NE;k++) if (settled(k)) v = m.sum ? v + vals[k] : vals[k];
    let shownV = v;
    if (!E.intro && E.p >= COUNT[0] && E.p < COUNT[1]) { const prev = m.sum ? v - vals[E.i] : (E.i ? vals[E.i-1] : 0); shownV = lerp(prev, v, ease(win(E.p, COUNT[0], COUNT[1]))); }
    const dec = m.decimals || 0;
    txt(shownV.toFixed(dec) + (m.unit || ''), x+16, y+80, { font:`600 30px ${M}`, color: (!E.intro && E.p >= COUNT[0]) ? C.acc : C.text });
    const mx = Math.max(1, ...vals); vals.forEach((vv, k) => { if (!settled(k)) return; const bh = 4 + 22*vv/mx; fillR(x+w-16-(NE-k)*12, y+h-14-bh, 7, bh, 2, k===E.i ? C.acc : '#5a616d'); });
  });
  txt(meta.historyTitle || 'history', 60, 1128, { font:`400 12px ${M}`, color:C.dim });
  let row = 0;
  for (let k = Math.max(0, E.i-4); k <= E.i; k++) {
    if (!settled(k)) continue;
    const e = EPS[k], y = 1152 + row*26, cur = k === E.i, a = cur ? win(E.p, COUNT[0], COUNT[0]+0.05) : 1;
    txt('#' + String((meta.counterStart || 1) + k).padStart(4,'0'), 60, y, { font:`400 12px ${M}`, color:C.faint, alpha:a });
    let cmd = e.command; while (mw(cmd, `400 12.5px ${M}`) > 600 && cmd.length > 4) cmd = cmd.slice(0, -2);
    txt(cmd, 130, y, { font:`400 12.5px ${M}`, color: cur ? C.text : '#9aa1ac', alpha:a });
    txt(e.result || 'ok', 900, y, { font:`500 12px ${M}`, color: /fail|error/.test(e.result||'') ? C.human : /warn/.test(e.result||'') ? C.warn : C.ok, alpha:a, align:'right' });
    txt(e.duration || '', 1020, y, { font:`400 12px ${M}`, color:C.dim, alpha:a, align:'right' });
    row++;
  }
}

const TPL = { clock: CLK, count: NE, prepare, draw,
  keys: [['intro', Math.max(0.1, INTRO-0.5)], ['stream', INTRO + 0.35*MAIN], ['checks', INTRO + 0.78*MAIN], ['done', INTRO + 0.98*MAIN]] };
boot(TPL);
