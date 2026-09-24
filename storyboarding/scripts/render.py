#!/usr/bin/env python3
"""Render a built storyboard HTML to MP4, GIF, or keyframe PNGs.

usage:
  python render.py storyboard.html --keyframes frames/   # a few PNGs per run for review + layout check
  python render.py storyboard.html --mp4 out.mp4 [--fps 30]
  python render.py storyboard.html --gif out.gif [--gif-width 540]

Needs: playwright (chromium) and ffmpeg.
  pip install playwright && python -m playwright install chromium
"""
import argparse, subprocess, sys
from pathlib import Path


def open_page(p, html):
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1350})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(Path(html).resolve().as_uri() + "?render=1")
    pg.wait_for_function("window.__ready === true", timeout=20000)
    if errors:
        print("page errors:", *errors, sep="\n  ")
        sys.exit(1)
    return b, pg


def layout_issues(texts, W=1080, H=1350):
    """Text drawn off the canvas, or two texts overlapping. Boxes are canvas px, in draw order."""
    def inter(a, b):
        return max(0, min(a["x"] + a["w"], b["x"] + b["w"]) - max(a["x"], b["x"])) * max(0, min(a["y"] + a["h"], b["y"] + b["h"]) - max(a["y"], b["y"]))
    # text painted over by a later opaque panel is hidden, not a problem
    texts = [t for i, t in enumerate(texts) if not t.get("fill")
             and not any(f.get("fill") and inter(t, f) > 0.8 * t["w"] * t["h"] for f in texts[i + 1:])]
    out = []
    for t in texts:
        if abs(t["z"] - 1) < 0.01 and (t["x"] < -1 or t["y"] < -1 or t["x"] + t["w"] > W + 1 or t["y"] + t["h"] > H + 1):
            out.append(f"off canvas: '{t['s']}' at ({t['x']:.0f},{t['y']:.0f})")
    for i, a in enumerate(texts):
        for b in texts[i + 1:]:
            if a["z"] != b["z"] or (a["s"] == b["s"] and abs(a["x"] - b["x"]) < 1 and abs(a["y"] - b["y"]) < 1):
                continue
            small = min(a["w"] * a["h"], b["w"] * b["h"])
            if small > 0 and inter(a, b) > 0.2 * small:
                out.append(f"overlap: '{a['s']}' x '{b['s']}' at ({max(a['x'], b['x']):.0f},{max(a['y'], b['y']):.0f})")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("html")
    ap.add_argument("--mp4")
    ap.add_argument("--gif")
    ap.add_argument("--keyframes")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--gif-width", type=int, default=540)
    ap.add_argument("--gif-fps", type=int, default=12)
    a = ap.parse_args()
    if not (a.mp4 or a.gif or a.keyframes):
        ap.error("choose at least one of --mp4, --gif, --keyframes")

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b, pg = open_page(p, a.html)
        period = pg.evaluate("window.__period")
        if a.keyframes:
            out = Path(a.keyframes); out.mkdir(parents=True, exist_ok=True)
            info = pg.evaluate("window.__info")
            shots = info.get("times") or [(f"ep{k+1}_{name}", k * info["len"] + r) for k in range(info["n"]) for name, r in info["keys"]]
            issues = 0
            for name, t in shots:
                pg.evaluate(f"window.renderAt({t})")
                pg.screenshot(path=str(out / f"{name}.png"))
                for m in layout_issues(pg.evaluate("window.__texts()")):
                    print(f"  {name}: {m}"); issues += 1
            print(f"ok: {len(shots)} keyframes in {out}/, layout issues: {issues}")

        if a.mp4 or a.gif:
            target = a.mp4 or str(Path(a.gif).with_suffix(".tmp.mp4"))
            n = int(round(period * a.fps))
            ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(a.fps), "-i", "-",
                                   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "medium",
                                   "-movflags", "+faststart", target], stdin=subprocess.PIPE)
            for i in range(n):
                pg.evaluate(f"window.renderAt({i / a.fps})")
                ff.stdin.write(pg.screenshot(type="png"))
                if i % (a.fps * 5) == 0:
                    print(f"  frame {i}/{n}", flush=True)
            ff.stdin.close(); ff.wait()
            print(f"ok: {target}  ({period:.1f}s, {n} frames)")
        b.close()

    if a.gif:
        src = a.mp4 or str(Path(a.gif).with_suffix(".tmp.mp4"))
        vf = (f"fps={a.gif_fps},scale={a.gif_width}:-1:flags=lanczos,split[x][y];"
              "[x]palettegen=max_colors=128:stats_mode=diff[p];[y][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", vf, "-loop", "0", a.gif], check=True)
        if not a.mp4:
            Path(src).unlink(missing_ok=True)
        print(f"ok: {a.gif}  ({Path(a.gif).stat().st_size/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
