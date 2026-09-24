# Shared fields and rules (all templates)

Every storyboard is one JSON file:

```json
{ "template": "trace | router | cli | compare", "meta": {…}, "deciders": {…}, …template fields… }
```

## Look and pace (fixed by the kit)

Ink background with a dot grid, IBM Plex Mono/Sans, one accent color plus semantic colors, 1080×1350.
Every template plays N episodes of equal length. Each episode opens with a camera push onto the typed input (the only focus), then pulls back and the main action runs with a spotlight on whatever is currently moving. You control the content and the timing knobs below; the easing, stagger and spotlight stay the same.

## meta (shared)

| field | default | notes |
|---|---|---|
| `name` | required | wordmark, ≤ 22 chars |
| `tagline` | `[]` | 1–2 lines, ≤ 74 chars each, plain description of what the project does |
| `headerRight` | — | small line under the counter, ≤ 26 |
| `counterLabel` | `run` | word above the episode counter; `""` hides the counter |
| `counterStart` | 1 | first counter value, shown as `#0412` |
| `footerLeft` | — | repo URL |
| `footerRight` | `simulated` | version, `simulated`, handle |
| `introSeconds` | 2.3 | camera push on the typed input; 0 disables |
| `runSeconds` | 8 (router 5.5) | main part of each episode |
| `colors` | — | override any of `bg surf surf2 line line2 text dim faint acc ok human link warn alt cool teal` |

Color fields anywhere (`color`, `toastColor`, …) take a palette key (`acc`, `ok`, `human`, `alt`, `cool`, `teal`, `warn`) or a `#hex`.

## deciders

Who or what makes the choice in an episode. Defaults: `model` (accent), `rule` (cool blue), `fallback` (lavender, picks below the gate), `human` (rose). Rename or add to match the project's own words:

```json
"deciders": { "jev": {"label":"jev","color":"acc"}, "llm": {"label":"llm","color":"alt","pick":"llm pick"} }
```
`pick` marks a decider that may choose below the gate; used by trace.

## Input bar chip

trace, router and compare show a typed request in the top bar. An optional chip under it names what the request mapped to:
`"chip": {"label":"pack", "value":"portal.collect", "note":"read + local file", "color":"acc"}` (trace builds this from `packs` automatically).

## Data rules (enforced where possible)

- Project facts come from the repo: names, commands, stages, what is gated, version, URL.
- Example data is invented, in an industry unrelated to the repo owner's own business. No real people, customers, emails, phone numbers, secrets or rows copied from repo data.
- Web addresses in example content use `*.example` hosts (trace enforces this on `url`).
- Numbers not in the repo are illustration; keep them plausible and say `simulated` in `footerRight`.
