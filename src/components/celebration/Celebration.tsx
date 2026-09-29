"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { IMG } from "../opening/geometry";

// A shower of the couple's blossoms, pale silk ribbons and silver glints, for
// the moments something is revealed. Call celebrate() with the point (viewport
// px) it should bloom from: a soft flash of light there, then everything
// springs up and out across the screen and flutters down. It does nothing
// under reduced motion. One canvas above the cards that never takes a tap;
// the frame loop runs only while the shower is falling.

let fire: ((x: number, y: number) => void) | null = null;
export const celebrate = (x: number, y: number) => fire?.(x, y);

const RIBBON = 0;
const BLOSSOM = 1;
const GLINT = 2;
const GLOW = 3;
type Kind = typeof RIBBON | typeof BLOSSOM | typeof GLINT | typeof GLOW;

type Piece = {
  kind: Kind;
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  // the burst: from the origin out to an apex, easing to a stop
  ox: number;
  oy: number;
  ax: number;
  ay: number;
  rise: number;
  // then the fall
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  flip: number;
  flipRate: number;
  sway: number;
  swayRate: number;
  delay: number;
  age: number;
  life: number;
};

// Silk in the card's own blues, from ice to dusty blue, with silver and pearl.
// Each has a lit face and a shaded one, so a tumbling ribbon catches the light.
const SILKS = [
  { shade: "#9dbccf", base: "#cfe2ed", hi: "#f4f9fc" },
  { shade: "#7ea4bd", base: "#a9c9dc", hi: "#e3f0f7" },
  { shade: "#5d86a1", base: "#86aec7", hi: "#cfe2ee" },
  { shade: "#8d969e", base: "#c2c8ce", hi: "#f6f7f8" },
  { shade: "#bcc5cc", base: "#e9edf0", hi: "#ffffff" },
];
const EDGE = "rgba(58,84,104,0.34)";

// ribbon centrelines in a unit box (x along the ribbon): straight, a C-curl
// and an S-twist
const SHAPES: ((g: CanvasRenderingContext2D, s: number) => void)[] = [
  (g, s) => {
    g.moveTo(s * 0.12, s * 0.5);
    g.lineTo(s * 0.88, s * 0.5);
  },
  (g, s) => {
    g.moveTo(s * 0.14, s * 0.62);
    g.quadraticCurveTo(s * 0.5, s * 0.2, s * 0.86, s * 0.62);
  },
  (g, s) => {
    g.moveTo(s * 0.1, s * 0.5);
    g.bezierCurveTo(s * 0.38, s * 0.18, s * 0.62, s * 0.82, s * 0.9, s * 0.5);
  },
];

function sprite(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  return c;
}

function ribbon(shape: number, silk: (typeof SILKS)[number], lit: boolean) {
  return sprite(64, (g, s) => {
    const w = s * 0.2;
    g.lineCap = "butt";
    g.lineJoin = "round";
    // a hairline of shadow first, so pale silk still reads on ivory
    g.beginPath();
    SHAPES[shape](g, s);
    g.strokeStyle = EDGE;
    g.lineWidth = w + 1.6;
    g.stroke();
    // satin: the light runs along the ribbon where it bends
    const grad = g.createLinearGradient(0, 0, s, s * 0.3);
    const [a, b, c] = lit ? [silk.shade, silk.base, silk.hi] : [silk.shade, silk.shade, silk.base];
    grad.addColorStop(0, a);
    grad.addColorStop(0.3, b);
    grad.addColorStop(0.5, c);
    grad.addColorStop(0.72, b);
    grad.addColorStop(1, a);
    g.beginPath();
    SHAPES[shape](g, s);
    g.strokeStyle = grad;
    g.lineWidth = w;
    g.stroke();
  });
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export function Celebration() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let dpr = 1;
    let vw = 0;
    let vh = 0;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Sprites are drawn once, the first time there is something to celebrate.
    let sprites: {
      ribbons: [HTMLCanvasElement, HTMLCanvasElement][];
      glint: HTMLCanvasElement;
      glow: HTMLCanvasElement;
      blossom: HTMLCanvasElement | null;
    } | null = null;
    const flower = new Image();
    flower.src = IMG.flower;
    const prepare = () => {
      if (sprites) return sprites;
      const ribbons: [HTMLCanvasElement, HTMLCanvasElement][] = [];
      for (let shape = 0; shape < SHAPES.length; shape++)
        for (const silk of SILKS) ribbons.push([ribbon(shape, silk, true), ribbon(shape, silk, false)]);
      const glint = sprite(64, (g, s) => {
        const c = s / 2;
        const halo = g.createRadialGradient(c, c, 0, c, c, c);
        halo.addColorStop(0, "rgba(232,243,251,0.85)");
        halo.addColorStop(0.35, "rgba(160,198,228,0.28)");
        halo.addColorStop(1, "rgba(160,198,228,0)");
        g.fillStyle = halo;
        g.fillRect(0, 0, s, s);
        g.translate(c, c);
        g.beginPath();
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? c * 0.92 : c * 0.12;
          const a = (i * Math.PI) / 4;
          g.lineTo(Math.sin(a) * r, -Math.cos(a) * r);
        }
        g.closePath();
        const body = g.createRadialGradient(0, 0, 0, 0, 0, c * 0.92);
        body.addColorStop(0, "#ffffff");
        body.addColorStop(0.3, "#dcebf6");
        body.addColorStop(1, "rgba(96,140,176,0.95)");
        g.fillStyle = body;
        g.fill();
      });
      const glow = sprite(128, (g, s) => {
        const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        r.addColorStop(0, "rgba(255,255,255,0.9)");
        r.addColorStop(0.25, "rgba(220,236,248,0.6)");
        r.addColorStop(0.6, "rgba(140,184,218,0.18)");
        r.addColorStop(1, "rgba(140,184,218,0)");
        g.fillStyle = r;
        g.fillRect(0, 0, s, s);
      });
      const blossom = flower.complete && flower.naturalWidth ? sprite(96, (g, s) => g.drawImage(flower, 0, 0, s, s)) : null;
      sprites = { ribbons, glint, glow, blossom };
      return sprites;
    };

    const ps: Piece[] = [];
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // everything falls at a pace set by the screen, so a phone and a
      // laptop see the same shower in the same time
      const g = vh * 1.25;
      let n = 0;
      for (const p of ps) {
        p.age += dt;
        const t = p.age - p.delay;
        if (t < 0) {
          ps[n++] = p;
          continue;
        }
        if (t >= p.life || p.y > vh + p.size) continue;
        ps[n++] = p;

        if (p.kind === GLOW) {
          const k = t / p.life;
          const s = p.size * (0.6 + 0.8 * easeOut(k));
          ctx.globalAlpha = (1 - k) ** 2 * 0.9;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.drawImage(p.front, p.ox - s / 2, p.oy - s / 2, s, s);
          continue;
        }

        if (t < p.rise) {
          // the burst: out to the apex, easing to a stop
          const k = easeOut(t / p.rise);
          p.x = p.ox + (p.ax - p.ox) * k;
          p.y = p.oy + (p.ay - p.oy) * k;
        } else {
          // the fall: gravity against the air, drifting side to side
          const drag = p.kind === RIBBON ? 4.6 : p.kind === BLOSSOM ? 5.6 : 9;
          const pull = p.kind === GLINT ? 0.45 : 1;
          p.vy += (g * pull - drag * p.vy) * dt;
          p.vx -= p.vx * 2 * dt;
          const drift = Math.min(1, (t - p.rise) / 0.5);
          p.x += (p.vx + Math.sin(t * p.swayRate + p.sway) * vh * 0.045 * drift) * dt;
          p.y += p.vy * dt;
        }
        p.rot += p.spin * dt;
        p.flip += p.flipRate * dt;

        const fadeIn = Math.min(1, t / 0.12);
        const fadeOut = Math.min(1, (p.life - t) / 0.7);
        const c = Math.cos(p.rot) * dpr;
        const s = Math.sin(p.rot) * dpr;
        if (p.kind === GLINT) {
          // twinkle: swell, shimmer, shrink away
          const k = t / p.life;
          const size = p.size * Math.sin(Math.PI * Math.min(1, k * 1.1)) * (0.85 + 0.15 * Math.sin(t * 14 + p.sway));
          ctx.globalAlpha = fadeIn * (1 - k * 0.3);
          ctx.setTransform(c, s, -s, c, p.x * dpr, p.y * dpr);
          ctx.drawImage(p.front, -size / 2, -size / 2, size, size);
        } else {
          // a ribbon tumbles about its length (its width goes thin, and the
          // shaded face shows); a blossom tilts gently as it turns
          const f = Math.cos(p.flip);
          const squash = p.kind === RIBBON ? f : 0.72 + 0.28 * f;
          ctx.globalAlpha = fadeIn * fadeOut;
          ctx.setTransform(c, s, -s * squash, c * squash, p.x * dpr, p.y * dpr);
          ctx.drawImage(p.kind === RIBBON && f < 0 ? p.back : p.front, -p.size / 2, -p.size / 2, p.size, p.size);
        }
      }
      ps.length = n;
      ctx.globalAlpha = 1;
      if (ps.length) raf = requestAnimationFrame(tick);
      else {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        raf = 0;
      }
    };

    fire = (x, y) => {
      const sp = prepare();
      if (!sp.blossom && flower.complete && flower.naturalWidth) sp.blossom = sprite(96, (g, s) => g.drawImage(flower, 0, 0, s, s));
      // a bigger screen gets more pieces, and slightly bigger ones, but not in
      // proportion to its area, so a phone isn't smothered nor a laptop bare
      const room = Math.sqrt((vw * vh) / (390 * 844));
      const count = (n: number) => Math.round(n * Math.min(2.2, Math.max(0.8, room)));
      const big = Math.min(1.35, Math.max(1, 0.75 + 0.3 * room));
      const apex = () => {
        // out to either edge of the screen, and up to just past its top, so
        // some of the shower drifts back down from above
        const spread = Math.random() + Math.random() - 1;
        const ax = x + spread * (spread < 0 ? x : vw - x) * 0.96;
        const high = -vh * 0.08;
        const low = Math.max(vh * 0.06, y - vh * 0.08);
        return { ax, ay: high + (low - high) * Math.random() ** 1.15 };
      };
      const base = (kind: Kind, size: number, delay: number, rise: number, life: number) => ({
        kind,
        ox: x,
        oy: y,
        x,
        y,
        vx: 0,
        vy: 0,
        size,
        rot: rand(0, Math.PI * 2),
        spin: rand(-2.4, 2.4),
        flip: rand(0, Math.PI * 2),
        flipRate: rand(4, 9) * (Math.random() < 0.5 ? -1 : 1),
        sway: rand(0, Math.PI * 2),
        swayRate: rand(1.6, 3.2),
        delay,
        age: 0,
        rise,
        life,
      });

      ps.push({ ...base(GLOW, Math.min(vw, vh) * 0.42, 0, 0, 0.7), front: sp.glow, back: sp.glow, ax: x, ay: y });
      for (let i = 0; i < count(46); i++) {
        const [front, back] = sp.ribbons[Math.floor(Math.random() * sp.ribbons.length)];
        ps.push({ ...base(RIBBON, rand(24, 36) * big, rand(0, 0.22), rand(0.55, 0.85), rand(5, 6.2)), front, back, ...apex() });
      }
      if (sp.blossom)
        for (let i = 0; i < count(14); i++) {
          const p = base(BLOSSOM, rand(26, 44) * big, rand(0.04, 0.3), rand(0.6, 0.95), rand(5.6, 6.8));
          ps.push({ ...p, spin: rand(-1, 1), flipRate: rand(1.4, 2.6), front: sp.blossom, back: sp.blossom, ...apex() });
        }
      // a ring of glints right where the reveal happened, and a few flung wide
      const ring = count(9);
      for (let i = 0; i < ring + count(6); i++) {
        const near = i < ring;
        const a = (i / ring) * Math.PI * 2 + rand(-0.3, 0.3);
        const r = rand(40, 110) * big;
        const target = near ? { ax: x + Math.cos(a) * r, ay: y + Math.sin(a) * r * 0.8 } : apex();
        const p = base(GLINT, rand(18, 28) * big, rand(0, 0.18), near ? rand(0.4, 0.6) : rand(0.6, 0.85), rand(1.4, 2.4));
        ps.push({ ...p, spin: rand(-0.6, 0.6), front: sp.glint, back: sp.glint, ...target });
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    return () => {
      fire = null;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-30 size-full" />;
}
