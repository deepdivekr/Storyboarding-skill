# compare

The same task done two ways side by side. Both columns start on the typed task; the tool's column finishes fast and verifies while the manual column keeps grinding with a running clock. Metric bars and a running "saved" total follow.
Fits: tools whose main value is replacing a manual, slow or error-prone workflow (ops automation, data cleanup, release tooling, reporting).

```json
{ "template":"compare", "meta":{…}, "episodes":[…] }
```
Complete example: `examples/compare-keyrot.json`.

## meta (compare-only)

| field | notes |
|---|---|
| `before`, `after` | column captions `{title, short, note}`; `short` is the legend word under the bars |
| `beforeRunning`, `afterRunning` | status text while a column runs |
| `metricsTitle`, `savedLabel` | bottom captions; the saved total sums `before.total − after.total` over finished episodes |
| `prompt` | glyph before `after.command`, default `$` |

## episodes

| field | notes |
|---|---|
| `client`, `request` | typed task, ≤ 14 / ≤ 62 |
| `before` | `{total ≤ 10, steps[≤ 9], result ≤ 32, resultColor?}` |
| `after` | `{command ≤ 44?, total, steps[≤ 7], result}` |
| step | `{text ≤ 38, dur ≤ 8, flag?: "err", note ≤ 40}`. `dur` like `25m`, `2h`, `40s`, `1d 2h`; step pacing inside each column follows these durations. |
| `metrics` | up to 4 `{label ≤ 18, before, after, unit?, decimals?}` numbers |

Keep the manual side honest: realistic steps, one plausible failure (`flag: "err"`) where it really happens in practice. Don't exaggerate the gap beyond what the tool actually removes.
