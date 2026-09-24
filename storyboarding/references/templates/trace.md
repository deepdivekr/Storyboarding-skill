# trace

One request walked through seven stages on a page: typed request → page loads → scan stamps e1…e5 → scores against a gate → approval or gate pill → cursor executes → readback → filed into a tile.
Fits: agents, automation, browser/RPA tools, anything that observes a UI and acts on it.

```json
{ "template":"trace", "meta":{…}, "deciders":{…}, "packs":[…], "runs":[…] }
```
Complete example: `examples/agent-driver.json`.

## meta (trace-only)

| field | default | notes |
|---|---|---|
| `stages` | plan, observe, decide, check, execute, verify, record | exactly 7 labels, meaning fixed by position (below) |
| `railTitle` | `trace` | title over the stage rail |
| `surfaceLabel` | `browser` | caption above the page window |
| `urlBadge` | none | green badge in the URL bar (e.g. `allowlisted`); per run `urlBadge` overrides, `""` hides |
| `packLabel` | `pack` | label of the chip under the request |
| `packsTitle` | `Completed runs` | title of the tile grid |
| `packsTotal` | `{n} total` | `{n}` total count, `{k}` number of packs |
| `gate` / `gateLabel` | 0.8 / `gate 0.80` | threshold line in the score table |

Stage positions: 1 request mapped to a pack · 2 page loads and the scan stamps e1…e5 into the table · 3 score bars fill, winners lock · 4 approval card or gate pill · 5 cursor clicks winners · 6 green readback scan and toast · 7 token flies into the pack tile. Rename to the project's words, keep the meaning order.

## packs

Up to 8, 4×2 grid: `{ "name": "portal.collect", "note": "read + local file", "count": 12 }`. name ≤ 20, note ≤ 26. Each run adds 1 to its pack.

## runs

| field | notes |
|---|---|
| `client` | who sent it, ≤ 14 |
| `request` | typed request, ≤ 62 |
| `pack` | index into `packs` |
| `decider` | key in `deciders` |
| `layout` | `table` · `form` · `product` · `list` · `terminal` |
| `url` | URL bar text; host must be `*.example` (terminal: window title) |
| `page` | layout content (below) |
| `candidates` | 1–5 `{ref, role, label, p, win?}`; `p` 0–1 or `null` (not scored); role ≤ 9, label ≤ 16 |
| `scoreLabel` | score column header, default `p (<decider label>)` |
| `steps` | exactly 7 `[detail, latency]`; detail ≤ 34, latency ≤ 9 |
| `approval` | optional: `{title, detail, button, done, via, railWaiting, railDone}` |
| `gatePill` | green pill text when there is no approval, ≤ 30 |
| `winMark` | chip on each executed winner (`draft`), ≤ 10 |
| `verdict` | line under the score table, ≤ 54 |
| `toast` | readback result on the page, ≤ 36 |

## Layouts and refs

**table** — `nav[]`, `navActive`, `heading`, `toolbar[{label, align:"left"?, primary?}]`, `columns[{name, align:"right"?}]`, `rows[[…]]` (≤ 6), `cellColors{value: colorKey}`. Refs: `nav:i`, `tool:i`, `row:i`.

**form** — `site`, `heading`, `fields[[label, value]]` (≤ 4), `buttons[]` (last is primary), `note`. Refs: `field:i`, `btn:i`.

**product** — `image` (`bag` `box` `device` `bottle` `doc`, anything else = hatch), `title`, `subtitle`, `price`, `priceAfter` (swaps in on click), `priceBefore` (struck through at readback), `stock`, `buttons[2]`, `link`. Refs: `price`, `stock`, `link`, `btn:0`, `btn:1`.

**list** — search results with `query` + `items[{title, meta, sub}]`, or an inbox with `sidebar[[label,count]]` + `items[{title, sub, time}]`; ≤ 5 items. Refs: `item:i`.

**terminal** — `title`, `lines[{text, kind}]` (≤ 10; kind `cmd` `out` `ok` `warn` `err`). Refs: `line:i`.

## Candidate ordering

The engine numbers candidates e1…e5 by page position (top to bottom, then left to right), and the table lists them in that order:
table `nav:*` → `tool:*` (left-aligned first) → `row:*` · form `field:*` → `btn:*` · product `price` → `stock` → `btn:*` → `link` · list/terminal in index order.
Write step text like `click e5` against this order, then confirm in keyframes.
