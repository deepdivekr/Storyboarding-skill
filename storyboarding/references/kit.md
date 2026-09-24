# Kit reference (for free scenes)

A free scene is one JS file, `scene.js`, next to `storyboard.json`. `build.py` inlines it after `assets/kit.js`, so every name below is in scope. Put all words, commands, and data in the JSON (`SB`), and keep drawing code in the scene. The scene reads `SB` and `meta` (= `SB.meta`).

## Contract

```js
const SHOTS = SB.shots || [];
const SEQ = sequence(SHOTS.map(s => ({ name: s.name, sec: s.sec || 8, intro: s.intro || 0 })));

function prepare() { /* once, after fonts load: precompute positions, seeded randomness (rng(42)) */ }

function draw(t) {                       // pure: paint frame t (seconds), nothing else
  const E = SEQ.at(t), s = SHOTS[E.i];   // E = { i, r (s into shot), p (0..1 after intro), intro, I, shot }
  const cam = cameraAmount(E.r, E.I);
  beginCamera(cam, FOCUS_RECT);           // clears, dot grid, camera push while cam > 0
  header(t, E.i);                         // wordmark, tagline, counter
  /* ...parts, each followed by spot(...) for the spotlight... */
  footer();
  endCamera(cam, FOCUS_RECT_PADDED);      // darkens everything outside the focus during the push
}

boot({ clock: SEQ, count: SHOTS.length, prepare, draw, times: shotKeys(SEQ, [0.2, 0.6, 0.95]) });
```

`times` sets the keyframes that `render.py --keyframes` captures and checks. Add a fraction wherever something important happens, such as the moment a result lands.

Use `SB.episodes` + `clock(n, runSeconds)` + `keys` (see the templates) instead of `sequence` only when every beat really has the same length and structure.

## Canvas and layout

1080×1350 px, origin top-left. Keep to these zones so headers and footers stay the same across all videos:

| zone | y | contents |
|---|---|---|
| header | 0–170 | `header(t, i)`: wordmark 46px at (58,100), tagline under it, counter top-right |
| stage | 184–1260 | your parts; margins x 60 → 1020 (960 wide) |
| footer | 1290–1320 | `footer()`: `meta.footerLeft` / `meta.footerRight` |

- A gutter between panels is 20–40 px. Put 16–24 px of padding inside panels.
- Use at most **3 panels** on screen at once, plus the header. One is usually the hero; give it about half the stage.
- Line heights: body text 24–28, code `size*1.65`.

## Type scale (fonts: `M` mono, `S` sans)

| use | font |
|---|---|
| panel title | ``600 14–17px ${S}`` |
| hero value / big number | ``600 30–46px ${M}`` |
| body, list rows, terminal | ``400 13–16px ${M}`` |
| code | `codeBlock` size 14–16 |
| captions, notes | ``400 11–12px ${M}``, color `C.dim` or `C.faint` |

Never go under 11 px. The video gets watched on phones.

## Color

`C.bg surf surf2 line line2 text dim faint` are neutrals. There is **one accent**, `C.acc`. The semantic colors are `C.ok` (success), `C.human` (error, a person, attention), `C.warn`, `C.alt` (secondary actor), `C.cool`, `C.teal`, and `C.link`. Use accent for "this is happening now" and semantics for outcomes. Don't give each panel its own color. `colorOf('ok')` resolves a key or `#hex`, and `hexA(col, a)` makes a translucent version.

## Motion rules (what makes it look like the kit)

1. **Shot structure.** Push the camera onto what's being typed or entered (`intro` seconds). Pull back, let the main action run left→right or top→bottom, then hold the result for at least 1.2 s before the next shot.
2. **One focus at a time.** After each part, call `spot(x,y,w,h,on)`, where `on` is 1 while that part is active and 0 when it isn't. The base dim is 35%, so context stays readable. `band(p, a, b)` gives a smooth on window.
3. **Stagger lists.** `appear(r, at, j)` reveals item j at `at + j*0.07` s over 0.12 s. Multiply alpha by it and slide up by `(1-a)*6` px.
4. **Things travel.** When data moves between parts, move a `token()` along a path with `along(pts, ease(q))`, then draw its `arrow()`. The arrival should trigger the next reaction, such as a highlight, a count or a stamp.
5. **Easing.** Use `ease` (cubic in-out) for everything. Don't bounce, spin, or shake.
6. **Deterministic.** Everything must be a function of `t`. Use `rng(seed)` in `prepare()` for noise. There is no clock and no randomness at draw time.
7. **Seamless loop.** The last frame of the last shot flows into shot 1. Shot 1 starts from an empty or neutral state.

## API

Drawing (all respect `GA`, a global alpha multiplier you can set temporarily and reset to 1):

| function | does |
|---|---|
| `txt(s, x, y, {font, color, align, alpha, ls})` | text at its baseline |
| `mw(s, font)` | text width |
| `fitText(s, font, maxw)` | truncates with `…` to fit. **Use for any text that comes from data** |
| `wrapText(s, font, maxw, maxLines)` → lines | word-wraps. Use it for messages and quotes from the repo, which must not be cut |
| `fillR / strokeR(x,y,w,h,r,col,…)` | rounded rect |
| `panel(x,y,w,h)` | standard surface with border |
| `windowChrome(x,y,w,h,title,{label,badge,lock})` | app or editor window with a title bar (content starts at y+39) |
| `ln(x1,y1,x2,y2,col,w,a,dash)`, `dot(x,y,r,col,a)` | line, dot |
| `pill(x,y,text,col,a)` → width | rounded label (status, tag) |
| `tagChip(x,y,id,col,a)` | tiny id chip (`e1`) |
| `btn(x,y,w,h,label,primary)` | button |
| `cursor(x,y)` | mouse pointer |
| `toastAt(x,y,text,col,a)` | one-line toast |
| `arrow(x1,y1,x2,y2,col,q,w,a)` | line drawn to fraction q, with a head |
| `along(pts, q)` → [x,y] | point on a polyline |
| `token(x,y,col,a)` | glowing ring for the thing in transit |
| `progressBar(x,y,w,q,col,a)` | 8px bar |
| `spinner(x,y,t,col)` | in-progress ring |
| `ripple(x,y,q,col)`, `glowDot`, `pulseRing(x,y,col,phase)` | arrival and live accents |
| `scanLine(x,y,w,h,p,col)` | a sweep across a region |
| `codeBlock(x,y,lines,{typeF,t,hl,hlColor,size,lh,maxw,alpha})` → height | code with light syntax color, typing, and highlighted lines |
| `fileTree(x,y,[{path,mark,note}],{lh,w,reveal(i),fresh(i)})` → height | indented tree built from paths; mark `+ ~ -` |
| `inputBar(y, who, text, typeF, chip, chipF, t)` → focus rect | typed request bar (960 wide, 64 high) |
| `countUp(a,b,q,dec)` → string | eased number |

Timing: `sequence`, `shotKeys`, `cameraAmount(r, I)`, `typeProgress(r, I)`, `chipProgress(r, I)`, `appear(r, at, j)`, `win(u,a,b)`, `band(u,a,b,e)`, `ease`, `lerp`, `clamp`, `mod`, `rng(seed)`.
Frame: `beginCamera(cam, focus)`, `endCamera(cam, hole)`, `header(t, i)`, `footer()`, `spot(x,y,w,h,on)`, `veil(x,y,w,h,f)`.
Constants: `W H C DEC M S RHYTHM INTRO meta SB`.

If you need a part the kit doesn't have (a gauge, a diff, a chat bubble, a map), write it in the scene with these primitives and use the same surfaces, radii (6–14), line colors, and type scale.

## Checks that run for you

- `build.py` rejects scenes that fetch, import, use URLs, eval, `Math.random`/`Date`, storage or timers, and any email-like string.
- `render.py --keyframes` saves PNGs and lists **layout issues**: text off the canvas, and text overlapping other text. Text that's hidden under an opaque panel drawn later is ignored. Something in flight can overlap briefly. Confirm that on the image and move on. Anything else gets fixed.
