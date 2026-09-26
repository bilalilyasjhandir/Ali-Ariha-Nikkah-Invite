"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useEffectEvent, useRef } from "react";

// Brush radius and every stored stroke point are in units of the foil's width,
// so a resize (rotating a phone) can repaint and replay the scratches exactly.
const BRUSH = 0.078;
const GRID = 36;
const CHECK_EVERY_MS = 120;
const MAX_DPR = 3;

type Pt = { x: number; y: number };

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// a round-topped arch with softened feet
function archPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rb: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h - rb);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h - rb);
  ctx.arcTo(x + w, y + h, x + w - rb, y + h, rb);
  ctx.lineTo(x + rb, y + h);
  ctx.arcTo(x, y + h, x, y + h - rb, rb);
  ctx.closePath();
}

function insideArch(x: number, y: number, w: number, h: number) {
  if (x < 0 || x > w || y < 0 || y > h) return false;
  const r = w / 2;
  return y >= r || (x - r) ** 2 + (y - r) ** 2 <= r * r;
}

let noiseTile: HTMLCanvasElement | null = null;
function noise() {
  if (noiseTile) return noiseTile;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const img = x.createImageData(128, 128);
  const rand = rng(3);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (rand() - 0.5) * 140;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return (noiseTile = c);
}

// One pixel per device row and only a few columns, stretched across the foil:
// every row becomes a hairline streak whose tone drifts gently along its length.
function streaks(rows: number) {
  const cols = 10;
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const x = c.getContext("2d")!;
  const img = x.createImageData(cols, rows);
  const rand = rng(5);
  let slow = 0;
  for (let j = 0; j < rows; j++) {
    slow = slow * 0.93 + (rand() - 0.5) * 0.35;
    const row = slow + (rand() - 0.5) * 1.1;
    for (let i = 0; i < cols; i++) {
      const v = 128 + (row + (rand() - 0.5) * 0.7) * 64;
      const k = (j * cols + i) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
      img.data[k + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

// Solid in the middle, with a flaky, speckled fringe: dragged along a stroke
// it leaves the fine parallel scuffs a coin leaves in real scratch-off foil.
function makeBrush(sizePx: number) {
  const size = Math.max(8, Math.ceil(sizePx));
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const x = c.getContext("2d")!;
  const img = x.createImageData(size, size);
  const rand = rng(11);
  const half = size / 2;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const d = Math.hypot(i + 0.5 - half, j + 0.5 - half) / half;
      let a = 0;
      if (d < 0.5) a = 1;
      else if (d < 1) {
        const t = (d - 0.5) / 0.5;
        a = (1 - t * t * (3 - 2 * t)) * (rand() < 0.45 ? rand() : 1);
      }
      img.data[(j * size + i) * 4 + 3] = Math.round(a * 255);
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

function tinted(img: HTMLImageElement, w: number, h: number, fill: string) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0, c.width, c.height);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = fill;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  const chars = [...text];
  return chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0) + tracking * (chars.length - 1);
}

// canvas has no letter-spacing everywhere yet, so small caps are set by hand
function drawTracked(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, tracking: number) {
  let x = cx - trackedWidth(ctx, text, tracking) / 2;
  for (const c of text) {
    ctx.fillText(c, x, y);
    x += ctx.measureText(c).width + tracking;
  }
}

function balancedLines(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  const words = text.split(" ");
  let best = [text];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const m = Math.max(trackedWidth(ctx, a, tracking), trackedWidth(ctx, b, tracking));
    if (m < bestW) {
      bestW = m;
      best = [a, b];
    }
  }
  return best;
}

type Box = { top: number; height: number };
type Extras = { mono: HTMLImageElement | null; monoBox: Box; family: string | null; prompt: string; cornerRatio: number };

function paintFoil(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, e: Extras) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const rb = w * e.cornerRatio;
  ctx.save();
  archPath(ctx, 0, 0, w, h, rb);
  ctx.clip();

  // satin silver, lit from the upper left
  const base = ctx.createLinearGradient(0, 0, w, h * 0.95);
  const stops: [number, string][] = [
    [0, "#a3aab1"],
    [0.2, "#cfd3d7"],
    [0.33, "#e9ebed"],
    [0.45, "#bcc2c7"],
    [0.62, "#a4abb2"],
    [0.8, "#cdd1d5"],
    [1, "#98a0a7"],
  ];
  for (const [o, c] of stops) base.addColorStop(o, c);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // brushed satin and a fine grain, both at device resolution
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "overlay";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = 0.34;
  ctx.drawImage(streaks(ctx.canvas.height), 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = ctx.createPattern(noise(), "repeat")!;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  const light = ctx.createRadialGradient(w * 0.28, h * 0.16, 0, w * 0.28, h * 0.16, w * 0.9);
  light.addColorStop(0, "rgba(255,255,255,0.34)");
  light.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  const shade = ctx.createLinearGradient(0, h * 0.4, 0, h);
  shade.addColorStop(0, "rgba(40,48,58,0)");
  shade.addColorStop(1, "rgba(40,48,58,0.13)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);

  // a hairline pressed into the foil, echoing the card's blind deboss
  const inset = w * 0.04;
  const iw = w - inset * 2;
  const ih = h - inset * 2;
  ctx.lineWidth = Math.max(1 / dpr, w * 0.003);
  ctx.strokeStyle = "rgba(52,58,66,0.30)";
  archPath(ctx, inset, inset - 0.5, iw, ih, rb * 0.5);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  archPath(ctx, inset, inset + 0.6, iw, ih, rb * 0.5);
  ctx.stroke();

  // the cut edge of the foil catches a little shade
  ctx.lineWidth = 1.5 / dpr;
  ctx.strokeStyle = "rgba(64,72,82,0.24)";
  archPath(ctx, 0, 0, w, h, rb);
  ctx.stroke();

  // the monogram, foil-stamped: shade above, a bright lip below
  if (e.mono) {
    const mh = w * e.monoBox.height;
    const mw = (mh * e.mono.naturalWidth) / e.mono.naturalHeight;
    const mx = (w - mw) / 2;
    const my = w * e.monoBox.top;
    const px = (v: number) => v * dpr;
    ctx.drawImage(tinted(e.mono, px(mw), px(mh), "rgba(255,255,255,0.75)"), mx, my + 0.8, mw, mh);
    ctx.drawImage(tinted(e.mono, px(mw), px(mh), "rgba(46,52,60,0.45)"), mx, my - 0.6, mw, mh);
    ctx.drawImage(tinted(e.mono, px(mw), px(mh), "#8d959d"), mx, my, mw, mh);
  }

  // the prompt, printed on the foil in small caps
  if (e.family) {
    const fs = w * 0.05;
    const tracking = fs * 0.2;
    ctx.font = `500 ${fs}px ${e.family}`;
    ctx.textBaseline = "middle";
    const lines = balancedLines(ctx, e.prompt.toUpperCase(), tracking);
    const lead = fs * 1.9;
    const top = h * 0.66 - ((lines.length - 1) * lead) / 2;
    lines.forEach((line, i) => {
      const y = top + i * lead;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      drawTracked(ctx, line, w / 2, y + 0.8, tracking);
      ctx.fillStyle = "#4a5159";
      drawTracked(ctx, line, w / 2, y, tracking);
    });
  }

  ctx.restore();
  ctx.globalCompositeOperation = "destination-out";
}

// A panel of silver scratch-off foil. It paints itself onto a canvas the size
// of its parent, erases under the finger, and calls onReveal once enough of it
// is gone. Only the foil itself takes the finger (touch-action: none), so a
// swipe anywhere else on the card still moves to the next section.
export function ScratchFoil({
  prompt,
  monogram,
  monoBox,
  radius,
  cornerRatio,
  threshold = 0.45,
  onReveal,
}: {
  prompt: string;
  monogram: string;
  // where the monogram sits, as fractions of the foil's width
  monoBox: Box;
  radius: string;
  cornerRatio: number;
  threshold?: number;
  onReveal: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const reveal = useEffectEvent(() => onReveal());
  const { top: monoTop, height: monoHeight } = monoBox;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const extras: Extras = { mono: null, monoBox: { top: monoTop, height: monoHeight }, family: null, prompt, cornerRatio };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let brush: HTMLCanvasElement | null = null;
    let done = false;
    let active: number | null = null;
    let last: Pt | null = null;
    let raf = 0;
    let lastCheck = 0;
    const stamps: Pt[] = [];
    const queue: (Pt & { start: boolean })[] = [];

    // coverage, on a coarse grid in width units
    const aspect = canvas.offsetHeight / Math.max(1, canvas.offsetWidth) || 1;
    const rows = Math.ceil(GRID * aspect);
    const inside = new Uint8Array(GRID * rows);
    const cleared = new Uint8Array(GRID * rows);
    let insideCount = 0;
    let clearedCount = 0;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < GRID; i++)
        if (insideArch((i + 0.5) / GRID, (j + 0.5) / GRID, 1, aspect)) {
          inside[j * GRID + i] = 1;
          insideCount++;
        }

    const mark = (p: Pt) => {
      const rr = BRUSH * 0.72;
      const i0 = Math.max(0, Math.floor((p.x - rr) * GRID));
      const i1 = Math.min(GRID - 1, Math.floor((p.x + rr) * GRID));
      const j0 = Math.max(0, Math.floor((p.y - rr) * GRID));
      const j1 = Math.min(rows - 1, Math.floor((p.y + rr) * GRID));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const k = j * GRID + i;
          if (!inside[k] || cleared[k]) continue;
          if (Math.hypot((i + 0.5) / GRID - p.x, (j + 0.5) / GRID - p.y) <= rr) {
            cleared[k] = 1;
            clearedCount++;
          }
        }
    };

    const stamp = (p: Pt, record = true) => {
      if (!brush) return;
      const r = BRUSH * w;
      ctx.drawImage(brush, p.x * w - r, p.y * w - r, r * 2, r * 2);
      if (record) {
        stamps.push(p);
        mark(p);
      }
    };

    const paint = () => {
      paintFoil(ctx, w, h, dpr, extras);
      for (const p of stamps) stamp(p, false);
    };

    const resize = () => {
      const nw = canvas.offsetWidth;
      const nh = canvas.offsetHeight;
      const nd = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      if (!nw || !nh || (nw === w && nh === h && nd === dpr)) return;
      w = nw;
      h = nh;
      dpr = nd;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      brush = makeBrush(BRUSH * 2 * w * dpr);
      paint();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // the monogram and the printed prompt arrive once their image and font do
    const family = getComputedStyle(canvas).fontFamily;
    const img = new Image();
    img.decoding = "async";
    img.src = monogram;
    Promise.all([
      img.decode().then(() => img, () => null),
      document.fonts.load(`500 16px ${family}`).then(() => family, () => family),
    ]).then(([mono, fam]) => {
      if (done) return;
      extras.mono = mono;
      extras.family = fam;
      if (w) paint();
    });

    const check = () => {
      lastCheck = performance.now();
      if (!done && insideCount && clearedCount / insideCount >= threshold) {
        done = true;
        active = null;
        reveal();
      }
    };

    const flush = () => {
      raf = 0;
      for (const p of queue) {
        if (p.start || !last) {
          stamp(p);
        } else {
          const dx = p.x - last.x;
          const dy = p.y - last.y;
          const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (BRUSH * 0.28)));
          for (let k = 1; k <= n; k++) stamp({ x: last.x + (dx * k) / n, y: last.y + (dy * k) / n });
        }
        last = p;
      }
      queue.length = 0;
      if (performance.now() - lastCheck > CHECK_EVERY_MS) check();
    };

    // offsetX/Y are in the canvas's own (untransformed) space, so the card's
    // tilt and its settling animation never skew the stroke
    const toPt = (ev: PointerEvent): Pt => ({ x: ev.offsetX / w, y: ev.offsetY / w });
    const enqueue = (p: Pt, start: boolean) => {
      queue.push({ ...p, start });
      if (!raf) raf = requestAnimationFrame(flush);
    };

    let touched = false;
    const onDown = (ev: PointerEvent) => {
      if (done || active !== null || !w) return;
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      ev.preventDefault();
      active = ev.pointerId;
      canvas.setPointerCapture(ev.pointerId);
      enqueue(toPt(ev), true);
      if (!touched && sheenRef.current) {
        touched = true;
        sheenRef.current.style.opacity = "0";
      }
    };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== active || done) return;
      const evs = ev.getCoalescedEvents?.();
      for (const e of evs && evs.length ? evs : [ev]) enqueue(toPt(e), false);
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== active) return;
      active = null;
      if (raf) {
        cancelAnimationFrame(raf);
        flush();
      }
      check();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    return () => {
      done = true;
      ro.disconnect();
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [prompt, monogram, monoTop, monoHeight, cornerRatio, threshold]);

  // A slow band of light crosses the foil now and then, until it is touched.
  // Compositor-only (a transform on WAAPI), and paused while off screen.
  useEffect(() => {
    const band = sheenRef.current?.firstElementChild as HTMLElement | null;
    if (reduce || !band || !band.animate) return;
    const anim = band.animate(
      [
        { transform: "translateX(-100%)", easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
        { transform: "translateX(260%)", offset: 0.36 },
        { transform: "translateX(260%)" },
      ],
      { duration: 6400, delay: 900, iterations: Infinity },
    );
    anim.pause();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? anim.play() : anim.pause()), { threshold: 0.2 });
    io.observe(band.parentElement!);
    return () => {
      io.disconnect();
      anim.cancel();
    };
  }, [reduce]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 size-full font-sans touch-none select-none cursor-pointer [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
        style={{ borderRadius: radius }}
      />
      <div
        ref={sheenRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-700"
        style={{ borderRadius: radius }}
      >
        <div
          className="absolute inset-y-0 left-0 w-[40%]"
          style={{
            transform: "translateX(-100%)",
            background:
              "linear-gradient(104deg, rgba(255,255,255,0) 18%, rgba(255,255,255,0.16) 38%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0.16) 62%, rgba(255,255,255,0) 82%)",
          }}
        />
      </div>
    </>
  );
}
