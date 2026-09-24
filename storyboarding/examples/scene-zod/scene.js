/* scene: zod — a schema in the editor checks each request, field by field.
   Stage: editor (schema) on top, request body -> result below, "same schema also gives you" tiles at the bottom.
   Shots: schema types in | valid body parses | invalid body gets exact issues | same schema -> JSON Schema, compile. */
const SHOTS = SB.shots || [];
const SEQ = sequence(SHOTS.map(s => ({ name: s.name, sec: s.sec || 8, intro: s.intro || 0 })));
const ED = { x:60, y:184, w:960, h:356 }, IN = { x:60, y:580, w:420, h:320 }, RS = { x:600, y:580, w:420, h:320 };
const TY = 960, TH = 290, TW = 306;
const CODE = { x:108, y:ED.y + 77, size:17, lh:28 };
const PATH_IN = [[IN.x + IN.w, 640], [520, 640], [520, ED.y + ED.h]];
const PATH_OUT = [[560, ED.y + ED.h], [560, 640], [RS.x, 640]];
// parse shot timing, seconds into the shot
const GO = [1.2, 2.0], CHECK0 = 2.1, STEP = 0.6;
const backAt = s => CHECK0 + (s.checks || []).length * STEP + 0.1;   // token leaves the schema
const resAt = s => backAt(s) + 0.8;                                    // result starts filling

function prepare() {}

function draw(t) {
  if (!SHOTS.length) return;
  const E = SEQ.at(t), s = SHOTS[E.i], r = E.r, cam = cameraAmount(r, E.I);
  const focus = { x:ED.x, y:ED.y, w:620, h:ED.h };
  beginCamera(cam, focus);
  header(t, E.i);
  const parse = s.kind === 'parse', shown = parse ? s : (s.kind === 'outputs' ? lastParse(E.i) : null);
  const settled = !parse;                     // outputs shot shows the last parse, finished
  editor(s, E, t);
  spot(ED.x-8, ED.y-8, ED.w+16, ED.h+16, s.kind === 'schema' ? 1 : parse ? band(r, GO[0], backAt(s) + 0.3, 0.3) : band(r, 0, 1.4, 0.3));
  inputCard(shown, parse ? r : 99, settled);
  spot(IN.x-8, IN.y-8, IN.w+16, IN.h+16, parse ? band(r, -1, backAt(s), 0.3) : 0);
  resultCard(shown, parse ? r : 99);
  spot(RS.x-8, RS.y-8, RS.w+16, RS.h+16, parse ? band(r, backAt(s), 99, 0.3) : 0);
  if (parse) travel(s, r);
  tiles(s, E);
  footer();
  endCamera(cam, { x:ED.x-4, y:ED.y-4, w:focus.w+8, h:ED.h+8 });
}

function lastParse(i) { for (let k = i; k >= 0; k--) if (SHOTS[k].kind === 'parse') return SHOTS[k]; return null; }

function rowHL(x, y, w, h, col, a) { if (a <= 0) return; fillR(x, y, w, h, 4, hexA(col, 0.14*a)); fillR(x, y, 3, h, 1, colorOf(col), a); }

function editor(s, E, t) {
  windowChrome(ED.x, ED.y, ED.w, ED.h, meta.file || 'schema.ts', { label: meta.editorLabel });
  const lines = meta.schema || [], typeF = s.kind === 'schema' ? typeProgress(E.r, E.I) : 1;
  lines.forEach((_, i) => txt(String(i+1), CODE.x - 22, CODE.y + i*CODE.lh, { font:`400 13px ${M}`, color:C.faint, align:'right' }));
  if (s.kind === 'parse') (s.checks || []).forEach((c, k) => {
    const at = CHECK0 + k*STEP, y = CODE.y + c.schema*CODE.lh - CODE.size - 5;
    const active = band(E.r, at, at + STEP, 0.08), done = win(E.r, at + 0.3, at + 0.4);
    rowHL(CODE.x - 12, y, 560, CODE.lh, 'acc', active);
    if (!c.ok) rowHL(CODE.x - 12, y, 560, CODE.lh, 'human', done);
  });
  if (s.kind === 'outputs') rowHL(CODE.x - 12, CODE.y + 2*CODE.lh - CODE.size - 5, 560, CODE.lh*6, 'acc', band(E.r, 0.2, 1.4, 0.3));
  codeBlock(CODE.x, CODE.y, lines, { size:CODE.size, lh:CODE.lh, typeF, t, maxw:560 });
}

function cardFrame(b, title, titleFont) {
  panel(b.x, b.y, b.w, b.h);
  txt(title || '', b.x + 20, b.y + 32, { font: titleFont, color:C.text });
  ln(b.x + 16, b.y + 48.5, b.x + b.w - 16, b.y + 48.5, C.line, 1);
}

function inputCard(s, r, settled) {
  cardFrame(IN, meta.inputTitle, `600 15px ${S}`);
  if (meta.inputBadge) { const bw = mw(meta.inputBadge, `500 12px ${M}`) + 20; pill(IN.x + IN.w - 20 - bw, IN.y + 17, meta.inputBadge, 'warn'); }
  if (!s) { txt(meta.inputEmpty || '', IN.x + 20, IN.y + 84, { font:`400 13px ${M}`, color:C.faint }); return; }
  const y0 = IN.y + 94, lh = 34;
  (s.checks || []).forEach((c, k) => {
    if (c.input < 0) return;
    const at = CHECK0 + k*STEP, y = y0 + c.input*lh - 21;
    rowHL(IN.x + 10, y, IN.w - 20, lh, 'acc', settled ? 0 : band(r, at, at + STEP, 0.08));
    const st = settled ? 1 : win(r, at + 0.3, at + 0.4);
    if (st > 0) { const col = c.ok ? C.ok : C.human, cx = IN.x + IN.w - 34, cy = y + lh/2;
      if (!settled && st < 1) ripple(cx, cy, st, col, 6, 20);
      dot(cx, cy, 9, col, st); txt(c.ok ? 'ok' : '!', cx, cy + 3.5, { font:`600 9px ${M}`, color:C.bg, align:'center', alpha:st }); }
  });
  s.input.forEach((line, j) => { const a = settled ? 1 : appear(r, 0.2, j); if (a <= 0) return;
    codeBlock(IN.x + 24, y0 + j*lh + (1-a)*6, [line], { size:16, alpha:a }); });
}

function resultCard(s, r) {
  cardFrame(RS, meta.resultTitle, `600 15px ${M}`);
  const at = s ? resAt(s) : 99;
  if (!s || r < at) { txt(meta.resultEmpty || '', RS.x + 20, RS.y + 84, { font:`400 13px ${M}`, color:C.faint }); return; }
  const res = s.result, col = res.ok ? 'ok' : 'human', pa = appear(r, at, 0);
  pill(RS.x + 20, RS.y + 66 + (1-pa)*6, res.pill, col, pa);
  if (res.lines) res.lines.forEach((line, j) => { const a = appear(r, at + 0.15, j + 1); if (a <= 0) return;
    const y = RS.y + 128 + j*26 + (1-a)*6;
    if (j === 0) txt(line, RS.x + 24, y, { font:`400 12px ${M}`, color:C.dim, alpha:a });
    else codeBlock(RS.x + 24, y, [line], { size:14, alpha:a }); });
  if (res.issues) res.issues.forEach((is, j) => { const a = appear(r, at + 0.15, j*2 + 1); if (a <= 0) return;
    const y = RS.y + 130 + j*88 + (1-a)*6;
    dot(RS.x + 28, y - 5, 4.5, C.human, a);
    txt(is.code, RS.x + 42, y, { font:`600 14px ${M}`, color:C.human, alpha:a });
    txt('path ' + is.path, RS.x + RS.w - 20, y, { font:`400 12px ${M}`, color:C.dim, alpha:a, align:'right' });
    const mf = `400 13px ${M}`;
    wrapText(is.message, mf, RS.w - 62, 2).forEach((l, k) => txt(l, RS.x + 42, y + 26 + k*20, { font:mf, color:C.text, alpha:a })); });
}

function trace(pts, q, col) {
  if (q <= 0) return;
  const tip = along(pts, q);
  let k = 1, L = 0, total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]);
  for (; k < pts.length; k++) { const d = Math.hypot(pts[k][0]-pts[k-1][0], pts[k][1]-pts[k-1][1]); if (L + d >= q*total - 0.01) break; ln(pts[k-1][0], pts[k-1][1], pts[k][0], pts[k][1], col, 2); L += d; }
  if (k < pts.length) arrow(pts[k-1][0], pts[k-1][1], tip[0], tip[1], col, 1, 2);
}

function travel(s, r) {
  [PATH_IN, PATH_OUT].forEach(p => { for (let i = 1; i < p.length; i++) ln(p[i-1][0], p[i-1][1], p[i][0], p[i][1], C.line2, 1.5, 1, [4, 5]); });
  const qi = ease(win(r, GO[0], GO[1])), b0 = backAt(s), qo = ease(win(r, b0, b0 + 0.7));
  const outCol = s.result && !s.result.ok ? C.human : C.ok;
  trace(PATH_IN, qi, C.acc);
  trace(PATH_OUT, qo, outCol);
  if (r > GO[0] && r < GO[1] + 0.1) { const [x, y] = along(PATH_IN, qi); token(x, y, 'acc'); }
  if (r > b0 && r < b0 + 0.8) { const [x, y] = along(PATH_OUT, qo); token(x, y, outCol); }
  if (r > GO[1] && r < b0) { const x = 540, y = ED.y + ED.h; pulseRing(x, y - 4, C.acc, r*3); }
}

function tiles(s, E) {
  txt(meta.tilesTitle || 'The same schema also gives you', 60, TY - 16, { font:`600 15px ${S}`, color:C.text });
  const tl = meta.tiles || [], lit = s.tiles || [];
  tl.forEach((tile, i) => {
    const x = 60 + i*(TW + 21), order = lit.indexOf(i);
    const at = s.kind === 'schema' ? E.I + 0.6 : 0.6 + order*1.8, on = order >= 0 ? win(E.r, at, at + 0.3) : 0;
    fillR(x, TY, TW, TH, 12, C.surf); strokeR(x+.5, TY+.5, TW-1, TH-1, 12, on > 0 ? C.acc : C.line2, on > 0 ? 1.5 : 1, on > 0 ? on : 1);
    txt(fitText(tile.title, `600 14px ${M}`, TW - 36), x + 18, TY + 32, { font:`600 14px ${M}`, color: on > 0.5 ? C.acc : C.text });
    txt(tile.note || '', x + 18, TY + 52, { font:`400 11px ${M}`, color:C.dim });
    if (tile.big) {
      txt(tile.big, x + 18, TY + 170, { font:`600 64px ${M}`, color: on > 0.5 ? C.acc : C.text });
      txt(tile.sub || '', x + 18, TY + 206, { font:`400 13px ${M}`, color:C.dim });
    } else codeBlock(x + 18, TY + 92, tile.lines || [], { size:14, lh:28 });
    spot(x - 4, TY - 4, TW + 8, TH + 8, s.kind === 'parse' ? 0 : on);
  });
}

boot({ clock: SEQ, count: SHOTS.length, prepare, draw, times: shotKeys(SEQ, [0.2, 0.45, 0.62, 0.97]) });
