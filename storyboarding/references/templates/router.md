# router

One input, a decision, many lanes. A typed request enters the core box, a diamond flashes the decision, the chosen lane lights up and streams, and the telemetry panel logs it.
Fits: API gateways, model/provider routers, schedulers, dispatchers, queues, load balancers, multi-backend libraries.

```json
{ "template":"router", "meta":{…}, "deciders":{…}, "lanes":[…], "episodes":[…] }
```
Complete example: `examples/router-payroute.json`.

## meta (router-only)

| field | notes |
|---|---|
| `source` / `core` / `sink` | the three boxes in the flow row: `{title, note}`. Titles ≤ 16 / 30 / 14, notes ≤ 30 / 48 / 26. Source title falls back to the episode's `client`. |
| `decisionLabel` | word before the decision field, default `decision` |
| `rateUnit` | lane rate suffix, default `/s` |
| `panelTitle`, `mapTitle`, `mapNote`, `statsTitle`, `statsNote`, `logTitle`, `logNote` | telemetry panel captions |
| `liveStat` | `{label, start}` counter that increments per episode |
| `stats` | up to 5 static `[label ≤ 18, value ≤ 10]` rows |
| `panelFooter` (≤ 70), `panelBadge` | small caps line and badge under the panel |

## lanes

2–6 `{name ≤ 16, note ≤ 20, rate, color?}`. `note` is the idle status; `rate` is the typical throughput number shown on the right. Colors cycle through the palette unless set.

## episodes

| field | notes |
|---|---|
| `client`, `request` | typed input, ≤ 14 / ≤ 62 |
| `lane` | index into `lanes` |
| `decider` | key in `deciders` |
| `field` | what was decided on (`card.bin`, `latency`), ≤ 18 |
| `score`, `reason` | shown together under the field, ≤ 40 combined |
| `status` | lane status after arrival, ≤ 20 |
| `log` | `{id ≤ 10, text ≤ 30}` event log row |
| `chip` | optional chip under the input |

Pick episodes that land on different lanes and use at least two deciders.
