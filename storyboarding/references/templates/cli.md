# cli

A terminal session and what it changed. A command is typed, output streams line by line, changed files appear in a side panel, checks run one after another, and session metrics count up with a history of commands at the bottom.
Fits: command-line tools, build and dev tools, migration and codegen tools, formatters and linters, libraries that ship a CLI.

```json
{ "template":"cli", "meta":{…}, "episodes":[…] }
```
Complete example: `examples/cli-schemashift.json`.

## meta (cli-only)

| field | notes |
|---|---|
| `shellTitle` | terminal window title, ≤ 40 |
| `surfaceLabel` | caption above the terminal, default `terminal` |
| `prompt` | prompt glyph, default `$` |
| `changesTitle`, `changesEmpty`, `checksTitle`, `metricsTitle`, `historyTitle` | panel captions |
| `metrics` | up to 4 tiles `{key, label ≤ 18, unit?, sum?, decimals?}`. `sum: true` accumulates across episodes; otherwise the tile shows the latest episode's value. |

## episodes

| field | notes |
|---|---|
| `command` | typed after the prompt, ≤ 50. Use the tool's real syntax. |
| `lines` | 1–20 `{text, kind}`. kind: `out` `head` `dim` `ok` `warn` `err` `progress`. text ≤ 70 (progress ≤ 54). `progress` lines animate a bar and then show `done` (≤ 14). |
| `files` | up to 10 `{path, change: "+" "~" "-", line?}`; `line` is the output line index at which the file appears. |
| `checks` | up to 8 `{name ≤ 22, result: pass fail skip, note ≤ 10}`, run in order after the output |
| `metrics` | values for `meta.metrics` keys |
| `result` (≤ 22), `duration` (≤ 8) | history row; `fail`/`error`/`warn` in result change its color |
| `toast`, `toastColor` | banner at the bottom of the terminal, ≤ 44 |

A good session tells a small story: plan or dry run, the real run, then a case the tool refuses or warns about.
