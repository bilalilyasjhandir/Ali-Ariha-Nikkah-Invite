"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { IMG } from "../opening/geometry";

// A soft silver-blue light that follows the mouse or a finger, throwing off a
// few glints and, now and then, one of the couple's watercolour blossoms.
// One canvas above everything that never takes a tap. Sprites are drawn once
// up front; the frame loop runs only while something is still fading and stops
// the moment the screen is clear, so an idle page costs nothing. Each frame
// clears and draws only the patch the light covers, not the whole screen.

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
    let dpr = 1;
    // the patch drawn last frame (CSS px), which is all the next frame clears
    let dirty: [number, number, number, number] | null = null;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      dirty = null;
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
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      settleTail(now);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dirty) ctx.clearRect(dirty[0], dirty[1], dirty[2] - dirty[0], dirty[3] - dirty[1]);
      // age everything and drop what has faded, keeping the order
      let n = 0;
      for (const p of ps) {
        p.age += dt;
        if (p.age < p.life) ps[n++] = p;
      }
      ps.length = n;
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      const cover = (x: number, y: number, r: number) => {
        x0 = Math.min(x0, x - r);
        y0 = Math.min(y0, y - r);
        x1 = Math.max(x1, x + r);
        y1 = Math.max(y1, y + r);
      };
      // a sprite turned about its centre, without a save/restore per sprite
      const turned = (img: CanvasImageSource, x: number, y: number, rot: number, size: number) => {
        const c = Math.cos(rot) * dpr;
        const sn = Math.sin(rot) * dpr;
        ctx.setTransform(c, sn, -sn, c, x * dpr, y * dpr);
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        cover(x, y, size * 0.71);
      };
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        const t = p.age / p.life;
        if (p.kind === PETAL) {
          // flutter down: a little gravity, a sideways sway, a slow turn
          p.vy = Math.min(p.vy + 70 * dt, 55);
          p.x += (p.vx + Math.sin(p.age * 3 + p.sway) * 22) * dt;
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
          if (!petal) continue;
          const a = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.55) / 0.45);
          ctx.globalAlpha = a * 0.95;
          turned(petal, p.x, p.y, p.rot, p.size);
        } else if (p.kind === GLINT) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          // ease to a stop at the same rate on 60 and 120 Hz screens
          const drag = Math.pow(0.03, dt);
          p.vx *= drag;
          p.vy *= drag;
          // twinkle: swell in, then shrink away
          const size = p.size * Math.sin(Math.PI * Math.min(1, t * 1.15));
          ctx.globalAlpha = 1 - t * 0.4;
          turned(glint, p.x, p.y, p.rot, size);
        } else {
          const size = p.size * (1 - t * 0.55);
          ctx.globalAlpha = (1 - t) * (1 - t) * 0.85;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.drawImage(glow, p.x - size / 2, p.y - size / 2, size, size);
          cover(p.x, p.y, size / 2);
        }
      }
      ctx.globalAlpha = 1;
      dirty = x0 < x1 ? [Math.floor(x0 - 2), Math.floor(y0 - 2), Math.ceil(x1 + 2), Math.ceil(y1 + 2)] : null;
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

    // The light runs along a curve through the midpoints between pointer
    // samples, so a quick flick is one smooth arc rather than straight chords.
    // It trails the pointer by half a sample; once the pointer rests, that
    // last half is drawn in too.
    let live = false;
    let ax = 0; // the latest sample
    let ay = 0;
    let mx = 0; // how far the light has been laid
    let my = 0;
    let tail = false;
    let lastSample = 0;
    let ex = 0; // where the last glint/petal count was taken
    let ey = 0;
    let toGlow = 0; // distance left before the next wisp of light
    let glintAcc = 0;
    let petalAcc = PETAL_STEP * 0.6;

    const lay = (x0: number, y0: number, x1: number, y1: number) => {
      const d = Math.hypot(x1 - x0, y1 - y0);
      if (!d) return;
      let at = toGlow;
      for (let n = 0; at <= d && n < 12; at += GLOW_STEP, n++) glowAt(x0 + ((x1 - x0) * at) / d, y0 + ((y1 - y0) * at) / d);
      toGlow = at > d ? at - d : GLOW_STEP;
    };
    // a quadratic from where the light is, bending through the last sample,
    // to the midpoint of the newest segment, laid as a few short straights
    const curveTo = (cx: number, cy: number, x: number, y: number) => {
      const steps = Math.min(8, Math.max(1, Math.ceil((Math.hypot(cx - mx, cy - my) + Math.hypot(x - cx, y - cy)) / 10)));
      let px = mx;
      let py = my;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        const qx = u * u * mx + 2 * u * t * cx + t * t * x;
        const qy = u * u * my + 2 * u * t * cy + t * t * y;
        lay(px, py, qx, qy);
        px = qx;
        py = qy;
      }
      mx = x;
      my = y;
    };
    const settleTail = (now: number) => {
      if (!tail || now - lastSample < 40) return;
      tail = false;
      lay(mx, my, ax, ay);
      mx = ax;
      my = ay;
    };
    const begin = (x: number, y: number) => {
      live = true;
      tail = false;
      ax = mx = ex = x;
      ay = my = ey = y;
      toGlow = 0;
    };

    const moveTo = (x: number, y: number) => {
      const now = performance.now();
      if (now < pausedUntil || !live) {
        begin(x, y);
        return;
      }
      const d = Math.hypot(x - ax, y - ay);
      if (d < 0.5) return;
      // a long jump after a rest (a new window, a trackpad lift) starts afresh
      if (d > 100 && now - lastSample > 120) {
        begin(x, y);
        return;
      }
      curveTo(ax, ay, (ax + x) / 2, (ay + y) / 2);
      ax = x;
      ay = y;
      tail = true;
      lastSample = now;
    };
    // glints and blossoms are counted once per event, however many samples
    // it carries, so their number doesn't depend on the mouse's polling rate
    const sparkle = (x: number, y: number) => {
      if (!live || performance.now() < pausedUntil) return;
      const d = Math.hypot(x - ex, y - ey);
      if (d < 0.5) return;
      ex = x;
      ey = y;
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
    };
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
      if (live && tail) settleTail(Infinity);
      live = false;
    };

    // Mouse and pen through pointer events; touch through touch events, which
    // keep arriving while the finger scrolls the page (pointer events stop).
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      // every sample since the last frame, not just the latest, so a fast
      // flick keeps its true shape (Safari has no coalesced events)
      const all = e.getCoalescedEvents?.();
      for (const c of all?.length ? all : [e]) moveTo(c.clientX, c.clientY);
      sparkle(e.clientX, e.clientY);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") burst(e.clientX, e.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      burst(t.clientX, t.clientY);
      begin(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      moveTo(t.clientX, t.clientY);
      sparkle(t.clientX, t.clientY);
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointermove", onPointerMove, opts);
    window.addEventListener("pointerdown", onPointerDown, opts);
    document.documentElement.addEventListener("pointerleave", lift);
    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("touchend", lift, opts);
    window.addEventListener("touchcancel", lift, opts);
    const onHidden = () => document.hidden && lift();
    document.addEventListener("visibilitychange", onHidden);

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
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-30 size-full" />;
}
