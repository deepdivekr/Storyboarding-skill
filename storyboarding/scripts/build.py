#!/usr/bin/env python3
"""Validate a storyboard.json and build a self-contained HTML player.

usage: python build.py storyboard.json -o out.html [--no-check]
Exit code 1 means validation errors; fix the JSON (or scene.js) and rerun.
A storyboard uses a bundled template ("template": "cli") or its own scene ("scene": "scene.js", next to the JSON).
"""
import argparse, base64, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
FONT_FILES = {
    "m400": "ibm-plex-mono-latin-400-normal.woff2",
    "m500": "ibm-plex-mono-latin-500-normal.woff2",
    "m600": "ibm-plex-mono-latin-600-normal.woff2",
    "s400": "ibm-plex-sans-latin-400-normal.woff2",
    "s600": "ibm-plex-sans-latin-600-normal.woff2",
}
LAYOUTS = {"table", "form", "product", "list", "terminal"}
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
HOST = re.compile(r"^(?:https?://)?([^/\s?]+)")

# Length limits keep text inside its slot at 1080x1350.
LIMITS = {
    "meta.name": 22, "meta.tagline[]": 74, "meta.headerRight": 26,
    "pack.name": 20, "pack.note": 26,
    "run.client": 14, "run.request": 62, "run.url": 46, "run.toast": 36,
    "run.verdict": 54, "run.gatePill": 30, "run.winMark": 10,
    "step.detail": 34, "step.latency": 9,
    "cand.role": 9, "cand.label": 16,
    "approval.title": 30, "approval.detail": 40, "approval.rail": 34,
}


def refs_for(layout, page):
    """Element refs that a layout exposes as candidate targets."""
    r = set()
    if layout == "table":
        r |= {f"nav:{i}" for i in range(len(page.get("nav", [])))}
        r |= {f"tool:{i}" for i in range(len(page.get("toolbar", [])))}
        r |= {f"row:{i}" for i in range(min(6, len(page.get("rows", []))))}
    elif layout == "form":
        r |= {f"field:{i}" for i in range(min(4, len(page.get("fields", []))))}
        r |= {f"btn:{i}" for i in range(len(page.get("buttons", [])))}
    elif layout == "product":
        r |= {"price", "stock", "link"}
        r |= {f"btn:{i}" for i in range(min(2, len(page.get("buttons", []))))}
    elif layout == "list":
        r |= {f"item:{i}" for i in range(min(5, len(page.get("items", []))))}
    elif layout == "terminal":
        r |= {f"line:{i}" for i in range(min(10, len(page.get("lines", []))))}
    return r


# Scenes must be self-contained and deterministic: every frame is a pure function of t.
SCENE_BANNED = {
    r"\bfetch\s*\(|XMLHttpRequest|WebSocket|\bimport\s*\(|^\s*import\s": "no network or imports; the player is one offline file",
    r"https?://": "no external URLs in code; put the repo URL in meta.footerLeft",
    r"\beval\s*\(|new\s+Function": "no eval",
    r"Math\.random|Date\.now|new\s+Date|performance\.now": "not deterministic; use rng(seed) and the t passed to draw",
    r"localStorage|sessionStorage|document\.cookie": "no storage",
    r"requestAnimationFrame|setTimeout|setInterval": "the kit drives frames; draw(t) only paints frame t",
}


def check_scene(sb, code):
    errs, warns = [], []
    meta = sb.get("meta", {})
    if not meta.get("name"): errs.append("meta.name is required")
    elif len(meta["name"]) > 22: errs.append(f"meta.name: '{meta['name']}' is {len(meta['name'])} chars, max 22")
    for i, l in enumerate(meta.get("tagline", [])):
        if len(l) > 74: errs.append(f"meta.tagline[{i}] is {len(l)} chars, max 74")
    for pat, why in SCENE_BANNED.items():
        m = re.search(pat, code, re.M)
        if m: errs.append(f"scene: '{m.group(0).strip()}' — {why}")
    if not re.search(r"\bboot\s*\(", code): errs.append("scene: must end with boot({ clock, count, prepare, draw, keys | times })")
    if len(code) > 60000: warns.append(f"scene is {len(code)//1000} KB; templates are 7-25 KB, consider fewer parts")

    def walk(o, path):
        if isinstance(o, dict):
            for k, v in o.items(): walk(v, f"{path}.{k}")
        elif isinstance(o, list):
            for i, v in enumerate(o): walk(v, f"{path}[{i}]")
        elif isinstance(o, str) and EMAIL.search(o):
            errs.append(f"{path}: looks like an email address ('{EMAIL.search(o).group(0)}'); use invented, non-address text")
    walk(sb, "storyboard")
    for m in EMAIL.finditer(code):
        errs.append(f"scene: looks like an email address ('{m.group(0)}'); keep text in the JSON and invented")
    return errs, warns


def check(sb):
    tpl = sb.get("template", "trace")
    if tpl not in TEMPLATES:
        return [f"template must be one of {list(TEMPLATES)}"], []
    errs, warns = [], []
    if tpl != "trace":
        return check_other(sb, tpl)

    def lim(key, val, where):
        n = LIMITS[key]
        if val is not None and len(str(val)) > n:
            errs.append(f"{where}: '{val}' is {len(str(val))} chars, max {n}")

    def scan_text(val, where):
        if isinstance(val, str) and EMAIL.search(val):
            errs.append(f"{where}: looks like an email address ('{EMAIL.search(val).group(0)}'); use invented, non-address text")

    meta = sb.get("meta", {})
    if not meta.get("name"): errs.append("meta.name is required")
    lim("meta.name", meta.get("name"), "meta.name")
    for i, l in enumerate(meta.get("tagline", [])): lim("meta.tagline[]", l, f"meta.tagline[{i}]")
    lim("meta.headerRight", meta.get("headerRight"), "meta.headerRight")
    if len(meta.get("stages", ["x"] * 7)) != 7: errs.append("meta.stages must have exactly 7 labels")

    packs = sb.get("packs", [])
    if not 1 <= len(packs) <= 8: errs.append("packs: need 1 to 8 entries (shown as a 4x2 grid)")
    for i, p in enumerate(packs):
        lim("pack.name", p.get("name"), f"packs[{i}].name"); lim("pack.note", p.get("note"), f"packs[{i}].note")

    deciders = {"jev", "llm", "code"} | set(sb.get("deciders", {}).keys())
    runs = sb.get("runs") or sb.get("episodes", [])
    if not 2 <= len(runs) <= 6: errs.append("runs: use 2 to 6 runs (3 to 5 recommended)")
    for ri, r in enumerate(runs):
        w = f"runs[{ri}]"
        for k in ("client", "request", "layout", "steps", "candidates"):
            if k not in r: errs.append(f"{w}.{k} is required")
        if r.get("layout") not in LAYOUTS: errs.append(f"{w}.layout must be one of {sorted(LAYOUTS)}")
        if not isinstance(r.get("pack"), int) or not 0 <= r.get("pack", -1) < len(packs): errs.append(f"{w}.pack must index into packs")
        if r.get("decider", "jev") not in deciders: errs.append(f"{w}.decider '{r.get('decider')}' is not defined in deciders")
        for k in ("client", "request", "url", "toast", "verdict", "gatePill", "winMark"):
            lim(f"run.{k}", r.get(k), f"{w}.{k}")
        url = r.get("url", "")
        host = (HOST.match(url).group(1) if url and HOST.match(url) else "")
        if r.get("layout") != "terminal" and host and not re.search(r"(^|\.)example(:\d+)?$", host) and not host.startswith("localhost"):
            errs.append(f"{w}.url host '{host}' must be a fictional *.example domain")
        steps = r.get("steps", [])
        if len(steps) != 7: errs.append(f"{w}.steps must have 7 [detail, latency] pairs")
        for si, s in enumerate(steps):
            if not isinstance(s, list) or len(s) != 2: errs.append(f"{w}.steps[{si}] must be [detail, latency]"); continue
            lim("step.detail", s[0], f"{w}.steps[{si}]"); lim("step.latency", s[1], f"{w}.steps[{si}] latency")
        ap = r.get("approval")
        if ap:
            lim("approval.title", ap.get("title"), f"{w}.approval.title"); lim("approval.detail", ap.get("detail"), f"{w}.approval.detail")
            for k in ("railWaiting", "railDone"): lim("approval.rail", ap.get(k), f"{w}.approval.{k}")
        valid = refs_for(r.get("layout"), r.get("page", {}))
        cands = r.get("candidates", [])
        if not 1 <= len(cands) <= 5: errs.append(f"{w}.candidates: need 1 to 5")
        seen = set()
        for ci, c in enumerate(cands):
            cw = f"{w}.candidates[{ci}]"
            if c.get("ref") not in valid: errs.append(f"{cw}.ref '{c.get('ref')}' not in layout refs {sorted(valid)}")
            if c.get("ref") in seen: errs.append(f"{cw}.ref '{c.get('ref')}' used twice")
            seen.add(c.get("ref"))
            p = c.get("p")
            if p is not None and not (isinstance(p, (int, float)) and 0 <= p <= 1): errs.append(f"{cw}.p must be 0..1 or null")
            lim("cand.role", c.get("role"), f"{cw}.role"); lim("cand.label", c.get("label"), f"{cw}.label")
        if not any(c.get("win") for c in cands): errs.append(f"{w}: mark at least one candidate with \"win\": true")
        gate = meta.get("gate", 0.8)
        dec = r.get("decider", "jev")
        for c in cands:
            if c.get("win") and dec != "llm" and (c.get("p") or 0) < gate:
                warns.append(f"{w}: winner {c.get('ref')} has p below the gate; use decider 'llm' for below-gate picks")
    # privacy sweep over every string
    def walk(o, path):
        if isinstance(o, dict):
            for k, v in o.items(): walk(v, f"{path}.{k}")
        elif isinstance(o, list):
            for i, v in enumerate(o): walk(v, f"{path}[{i}]")
        else:
            scan_text(o, path)
    walk(sb, "storyboard")
    return errs, warns


def check_other(sb, tpl):
    """Validation for router, cli and compare storyboards."""
    errs, warns = [], []

    def lim(val, n, where):
        if val is not None and len(str(val)) > n:
            errs.append(f"{where}: '{val}' is {len(str(val))} chars, max {n}")

    def need(obj, key, where):
        if not obj.get(key) and obj.get(key) != 0:
            errs.append(f"{where}.{key} is required")

    meta = sb.get("meta", {})
    need(meta, "name", "meta"); lim(meta.get("name"), 22, "meta.name")
    for i, l in enumerate(meta.get("tagline", [])): lim(l, 74, f"meta.tagline[{i}]")
    lim(meta.get("headerRight"), 26, "meta.headerRight")
    deciders = {"model", "rule", "fallback", "human"} | set(sb.get("deciders", {}).keys())
    eps = sb.get("episodes", [])
    if not 2 <= len(eps) <= 8: errs.append("episodes: use 2 to 8 (3 to 5 recommended)")

    if tpl == "router":
        lanes = sb.get("lanes", [])
        if not 2 <= len(lanes) <= 6: errs.append("lanes: need 2 to 6")
        for i, l in enumerate(lanes): need(l, "name", f"lanes[{i}]"); lim(l.get("name"), 16, f"lanes[{i}].name"); lim(l.get("note"), 20, f"lanes[{i}].note")
        for k, n in (("source", 16), ("core", 30), ("sink", 14)): lim((meta.get(k) or {}).get("title"), n, f"meta.{k}.title")
        for k, n in (("source", 30), ("core", 48), ("sink", 26)): lim((meta.get(k) or {}).get("note"), n, f"meta.{k}.note")
        stats = meta.get("stats", [])
        if len(stats) > 5: errs.append("meta.stats: max 5 rows (one more row is the live counter)")
        for i, r in enumerate(stats): lim(r[0], 18, f"meta.stats[{i}] label"); lim(r[1], 10, f"meta.stats[{i}] value")
        lim(meta.get("panelFooter"), 70, "meta.panelFooter")
        for i, e in enumerate(eps):
            w = f"episodes[{i}]"
            need(e, "request", w); lim(e.get("request"), 62, f"{w}.request"); lim(e.get("client"), 14, f"{w}.client")
            if not isinstance(e.get("lane"), int) or not 0 <= e.get("lane", -1) < len(lanes): errs.append(f"{w}.lane must index into lanes")
            if e.get("decider", "model") not in deciders: errs.append(f"{w}.decider '{e.get('decider')}' is not defined")
            lim(e.get("field"), 18, f"{w}.field"); lim(e.get("status"), 20, f"{w}.status")
            lim(", ".join(str(x) for x in (e.get("score"), e.get("reason")) if x not in (None, "")), 40, f"{w}.score + reason")
            log = e.get("log") or {}; lim(log.get("id"), 10, f"{w}.log.id"); lim(log.get("text"), 30, f"{w}.log.text")
    elif tpl == "cli":
        ms = meta.get("metrics", [])
        if len(ms) > 4: errs.append("meta.metrics: max 4")
        for i, m in enumerate(ms): need(m, "key", f"meta.metrics[{i}]"); lim(m.get("label"), 18, f"meta.metrics[{i}].label")
        lim(meta.get("shellTitle"), 40, "meta.shellTitle")
        for i, e in enumerate(eps):
            w = f"episodes[{i}]"
            need(e, "command", w); lim(e.get("command"), 50, f"{w}.command")
            lines = e.get("lines", [])
            if not 1 <= len(lines) <= 20: errs.append(f"{w}.lines: need 1 to 20")
            for j, l in enumerate(lines):
                prog = l.get("kind") == "progress"
                lim(l.get("text"), 54 if prog else 70, f"{w}.lines[{j}].text"); lim(l.get("done"), 14, f"{w}.lines[{j}].done")
                if l.get("kind", "out") not in {"out", "ok", "warn", "err", "head", "dim", "progress"}: errs.append(f"{w}.lines[{j}].kind unknown")
            for j, f in enumerate(e.get("files", [])[:10]):
                if f.get("change", "~") not in {"+", "~", "-"}: errs.append(f"{w}.files[{j}].change must be + ~ or -")
            if len(e.get("files", [])) > 10: warns.append(f"{w}.files: only the first 10 are shown")
            for j, c in enumerate(e.get("checks", [])):
                lim(c.get("name"), 22, f"{w}.checks[{j}].name"); lim(c.get("note"), 10, f"{w}.checks[{j}].note")
                if c.get("result", "pass") not in {"pass", "fail", "skip"}: errs.append(f"{w}.checks[{j}].result must be pass, fail or skip")
            if len(e.get("checks", [])) > 8: errs.append(f"{w}.checks: max 8")
            lim(e.get("result"), 22, f"{w}.result"); lim(e.get("duration"), 8, f"{w}.duration"); lim(e.get("toast"), 44, f"{w}.toast")
            for m in ms:
                if m.get("key") not in (e.get("metrics") or {}): warns.append(f"{w}.metrics has no '{m.get('key')}' (shows 0)")
    elif tpl == "compare":
        for i, e in enumerate(eps):
            w = f"episodes[{i}]"
            need(e, "request", w); lim(e.get("request"), 62, f"{w}.request"); lim(e.get("client"), 14, f"{w}.client")
            for side, mx in (("before", 9), ("after", 7)):
                sd = e.get(side) or {}
                steps = sd.get("steps", [])
                if not 1 <= len(steps) <= mx: errs.append(f"{w}.{side}.steps: need 1 to {mx}")
                for j, st in enumerate(steps):
                    lim(st.get("text"), 38, f"{w}.{side}.steps[{j}].text"); lim(st.get("dur"), 8, f"{w}.{side}.steps[{j}].dur"); lim(st.get("note"), 40, f"{w}.{side}.steps[{j}].note")
                lim(sd.get("command"), 44, f"{w}.{side}.command"); lim(sd.get("total"), 10, f"{w}.{side}.total"); lim(sd.get("result"), 32, f"{w}.{side}.result")
            if side == "after" and not (e.get("after") or {}).get("steps"): errs.append(f"{w}.after needs steps")
            mets = e.get("metrics", [])
            if len(mets) > 4: errs.append(f"{w}.metrics: max 4")
            for j, m in enumerate(mets):
                lim(m.get("label"), 18, f"{w}.metrics[{j}].label")
                if not all(isinstance(m.get(k), (int, float)) for k in ("before", "after")): errs.append(f"{w}.metrics[{j}] needs numeric before and after")

    def walk(o, path):
        if isinstance(o, dict):
            for k, v in o.items(): walk(v, f"{path}.{k}")
        elif isinstance(o, list):
            for i, v in enumerate(o): walk(v, f"{path}[{i}]")
        elif isinstance(o, str) and EMAIL.search(o):
            errs.append(f"{path}: looks like an email address ('{EMAIL.search(o).group(0)}'); use invented, non-address text")
    walk(sb, "storyboard")
    return errs, warns


TEMPLATES = ("trace", "router", "cli", "compare")


def build(sb, out, scene=None):
    tpl = sb.get("template", "trace")
    fonts = {k: base64.b64encode((ASSETS / "fonts" / f).read_bytes()).decode() for k, f in FONT_FILES.items()}
    html = (ASSETS / "engine.html").read_text()
    html = html.replace("/*__KIT__*/", (ASSETS / "kit.js").read_text())
    code = scene if scene is not None else (ASSETS / "templates" / f"{tpl}.js").read_text()
    html = html.replace("/*__TEMPLATE__*/", code)
    title = f"{sb.get('meta', {}).get('name', 'storyboard')} — storyboard"
    html = html.replace("__TITLE__", title.replace("<", "&lt;"))
    html = html.replace("__FONTS__", json.dumps(fonts))
    html = html.replace("__STORYBOARD__", json.dumps(sb, ensure_ascii=False).replace("</", "<\\/"))
    Path(out).write_text(html)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("-o", "--out", default="storyboard.html")
    ap.add_argument("--no-check", action="store_true")
    a = ap.parse_args()
    sb = json.loads(Path(a.storyboard).read_text())
    scene = None
    if sb.get("scene"):
        sp = Path(a.storyboard).resolve().parent / sb["scene"]
        if not sp.is_file():
            print(f"error: scene file {sp} not found"); sys.exit(1)
        scene = sp.read_text()
    if not a.no_check:
        errs, warns = check_scene(sb, scene) if scene is not None else check(sb)
        for m in warns: print("warn:", m)
        if errs:
            for m in errs: print("error:", m)
            print(f"\n{len(errs)} error(s). Fix the storyboard and rerun.")
            sys.exit(1)
    build(sb, a.out, scene)
    if scene is not None:
        print(f"ok: {a.out}  (scene {sb['scene']})"); return
    tpl = sb.get("template", "trace")
    n = len(sb.get("runs") or sb.get("episodes", []))
    main = sb.get("meta", {}).get("runSeconds", 5.5 if tpl == "router" else 8.0)
    secs = n * (sb.get("meta", {}).get("introSeconds", 2.3) + main)
    print(f"ok: {a.out}  (template {tpl}, {n} episodes, {secs:.1f}s loop)")


if __name__ == "__main__":
    main()
