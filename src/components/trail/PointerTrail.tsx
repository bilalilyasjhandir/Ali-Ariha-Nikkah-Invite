"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { IMG } from "../opening/geometry";

// A soft silver-blue light that follows the mouse or a finger, throwing off a
// few glints and, now and then, one of the couple's watercolour blossoms.
// One canvas above everything that never takes a tap. Sprites are drawn once
// up front; the frame loop runs only while something is still fading and stops
// the moment the screen is clear, so an idle page costs nothing.

const GLOW = 0;
const GLINT = 1;
const PETAL = 2;
type Kind = typeof GLOW | typeof GLINT | typeof PETAL;
type Particle = {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  rot: number;
  spin: number;
  sway: number;
};

const MAX = 90;
// distances along the path, in CSS px, between emissions
const GLOW_STEP = 7;
const GLINT_STEP = 34;
const PETAL_STEP = 170;

let pausedUntil = 0;
// While the envelope opens every frame belongs to it.
export const pauseTrail = (ms: number) => {
  pausedUntil = performance.now() + ms;
};

function sprite(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  return c;
}

export function PointerTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Light has to read on ivory paper as well as on the blue linen: a white
    // core inside a cool blue haze does both.
    const glow = sprite(96, (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      r.addColorStop(0, "rgba(255,255,255,0.95)");
      r.addColorStop(0.2, "rgba(214,234,248,0.8)");
      r.addColorStop(0.45, "rgba(132,178,214,0.38)");
      r.addColorStop(0.75, "rgba(132,178,214,0.1)");
      r.addColorStop(1, "rgba(132,178,214,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, s, s);
    });
    const glint = sprite(64, (g, s) => {
      const c = s / 2;
      const halo = g.createRadialGradient(c, c, 0, c, c, c);
      halo.addColorStop(0, "rgba(230,242,251,0.8)");
      halo.addColorStop(0.35, "rgba(160,198,228,0.25)");
      halo.addColorStop(1, "rgba(160,198,228,0)");
      g.fillStyle = halo;
      g.fillRect(0, 0, s, s);
      // a four-pointed star with a slightly deeper silver-blue body
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
    let petal: HTMLCanvasElement | null = null;
    const img = new Image();
    img.src = IMG.flower;
    img.onload = () => {
      petal = sprite(72, (g, s) => g.drawImage(img, 0, 0, s, s));
    };

    const ps: Particle[] = [];
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.age += dt;
        const t = p.age / p.life;
        if (t >= 1) {
          ps.splice(i, 1);
          continue;
        }
        if (p.kind === PETAL) {
          // flutter down: a little gravity, a sideways sway, a slow turn
          p.vy = Math.min(p.vy + 70 * dt, 55);
          p.x += (p.vx + Math.sin(p.age * 3 + p.sway) * 22) * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
          if (!petal) continue;
          const a = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.55) / 0.45);
          ctx.globalAlpha = a * 0.95;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.drawImage(petal, -p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else if (p.kind === GLINT) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          // ease to a stop at the same rate on 60 and 120 Hz screens
          const drag = Math.pow(0.03, dt);
          p.vx *= drag;
          p.vy *= drag;
          // twinkle: swell in, then shrink away
          const s = p.size * Math.sin(Math.PI * Math.min(1, t * 1.15));
          ctx.globalAlpha = 1 - t * 0.4;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.drawImage(glint, -s / 2, -s / 2, s, s);
          ctx.restore();
        } else {
          const s = p.size * (1 - t * 0.55);
          ctx.globalAlpha = (1 - t) * (1 - t) * 0.85;
          ctx.drawImage(glow, p.x - s / 2, p.y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      raf = ps.length ? requestAnimationFrame(tick) : 0;
    };

    const add = (p: Omit<Particle, "age">) => {
      if (ps.length >= MAX) {
        // drop the oldest wisp of light first; glints and petals are the payoff
        const i = ps.findIndex((q) => q.kind === GLOW);
        ps.splice(i === -1 ? 0 : i, 1);
      }
      ps.push({ ...p, age: 0 });
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const glowAt = (x: number, y: number, size = rand(34, 46), life = rand(0.45, 0.6)) =>
      add({ kind: GLOW, x, y, vx: 0, vy: 0, life, size, rot: 0, spin: 0, sway: 0 });
    const glintAt = (x: number, y: number, speed = 18, size = rand(13, 20), a = rand(0, Math.PI * 2)) => {
      add({
        kind: GLINT,
        x: x + rand(-9, 9),
        y: y + rand(-9, 9),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 6,
        life: rand(0.7, 1.05),
        size,
        rot: rand(-0.3, 0.3),
        spin: 0,
        sway: 0,
      });
    };
    const petalAt = (x: number, y: number) =>
      add({
        kind: PETAL,
        x,
        y,
        vx: rand(-18, 18),
        vy: rand(-28, -8),
        life: rand(1.8, 2.4),
        size: rand(15, 22),
        rot: rand(0, Math.PI * 2),
        spin: rand(-1.6, 1.6),
        sway: rand(0, Math.PI * 2),
      });

    let px: number | null = null;
    let py: number | null = null;
    let glowAcc = 0;
    let glintAcc = 0;
    let petalAcc = PETAL_STEP * 0.6;

    const moveTo = (x: number, y: number) => {
      if (performance.now() < pausedUntil || px === null || py === null) {
        px = x;
        py = y;
        return;
      }
      const dx = x - px;
      const dy = y - py;
      const d = Math.hypot(dx, dy);
      if (d < 0.5) return;
      // fill the gap between samples so a quick flick is still a smooth ribbon
      let emitted = 0;
      for (glowAcc += d; glowAcc >= GLOW_STEP && emitted < 12; glowAcc -= GLOW_STEP, emitted++) {
        const k = 1 - glowAcc / d;
        glowAt(px + dx * k, py + dy * k);
      }
      glowAcc = Math.min(glowAcc, GLOW_STEP);
      glintAcc += d;
      if (glintAcc >= GLINT_STEP) {
        glintAcc = 0;
        glintAt(x, y);
      }
      petalAcc += d;
      if (petalAcc >= PETAL_STEP) {
        petalAcc = rand(-40, 20);
        petalAt(x, y);
      }
      px = x;
      py = y;
    };
    // a tap or click: a brighter bloom of light, a ring of glints, two blossoms
    const burst = (x: number, y: number) => {
      if (performance.now() < pausedUntil) return;
      glowAt(x, y, rand(64, 76), 0.75);
      glowAt(x, y, rand(40, 48), 0.6);
      const turn = rand(0, Math.PI * 2);
      for (let i = 0; i < 6; i++) glintAt(x, y, rand(120, 160), rand(20, 27), turn + (i * Math.PI) / 3 + rand(-0.3, 0.3));
      petalAt(x, y);
      petalAt(x, y);
    };
    const lift = () => {
      px = null;
      py = null;
    };

    // Mouse and pen through pointer events; touch through touch events, which
    // keep arriving while the finger scrolls the page (pointer events stop).
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch") moveTo(e.clientX, e.clientY);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") burst(e.clientX, e.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      burst(t.clientX, t.clientY);
      px = t.clientX;
      py = t.clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) moveTo(t.clientX, t.clientY);
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointermove", onPointerMove, opts);
    window.addEventListener("pointerdown", onPointerDown, opts);
    document.documentElement.addEventListener("pointerleave", lift);
    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("touchend", lift, opts);
    window.addEventListener("touchcancel", lift, opts);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", lift);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", lift);
      window.removeEventListener("touchcancel", lift);
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-30 size-full" />;
}
