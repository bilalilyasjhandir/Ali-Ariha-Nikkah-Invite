"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from "react";
import { IMG, SIZE } from "../opening/geometry";
import { WARM } from "../opening/WaxSeal";
import { FOIL, FoilMonogram, PRESS } from "../paper/foil";
import type { WindowReveal } from "./VenueCard";

// A volvelle: a cotton wheel pinned into the map's window with a silver brad,
// under a little silver clapper. It turns under the finger and spins off when
// let go, and however it is sent it comes to rest on the couple's monogram.
// Sizes are in cqw of the card; the window is 64 x 56, arched across its width.

const WINDOW_W = 64;
const R = 24.5;
const CX = WINDOW_W / 2;
const CY = 29.2;
// six slices: the monogram's at the top, then the words clockwise
const SLICE = 60;
const WORDS = ["Love", "Duas", "Family", "Joy", "Blessings"];
const WORD = { size: 4.4, r: 15.4 };
const MONO = { w: 5, r: 14.2 };
const MONO_H = (MONO.w * SIZE.monogram.h) / SIZE.monogram.w;
// the slices a faint wash of blue was laid into
const WASHED = [1, 3, 5];
// foil: a double hairline inside the rim, and spokes out from a ring round the brad
const RIMS = [R - 0.9, R - 1.8];
const HUB = 3.3;
const BRAD = 3.6;
// the clapper hangs from a rivet above the rim, its tip resting just inside it
const PIVOT_Y = CY - R - 2.4;
const TIP_R = R - 3.3;
const CLAP_LEN = CY - TIP_R - PIVOT_Y;
const CLAP = { boss: 0.8, half: 0.95, widest: 2 };
const CLAP_BOX = { w: 3.2, h: CLAP_LEN + 2.2 };

// A tap sends the wheel round for SPIN_S; a flick goes at its own speed for
// about as long. The ease-out's power sets how long it crawls at the end.
const SPIN_S = 3.6;
const FLICK_S = [2.8, 4.4] as const;
const POWER = 3;
// deg/s: a tap's speed, and the speeds a flick is taken at
const TAP_SPEED = 1000;
const FLICK = [720, 2600] as const;
// s: how long the hand's push takes to become the wheel's own speed
const WIND = 0.24;
// deg: how far off the monogram's centre line the pointer comes to rest
const REST = [2, 7] as const;
// s: the glow's beat before the reveal, and the lift off the card
const GLOW_S = 0.4;
const LIFT_S = 0.6;
// the clapper: how far a spoke bends it before slipping past (deg), how much
// of the wheel's turn that takes, and the spring it snaps back on
const CLAP_MAX = 13;
const CLAP_ZONE = (CLAP_MAX * CLAP_LEN) / TIP_R;
const CLAP_W = 2 * Math.PI * 9;
const CLAP_DAMP = 0.24;
// ms between haptic ticks, at the most; px a tap may wander
const TICK_MS = 60;
const TAP_PX = 6;

const DEG = 180 / Math.PI;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

// FOIL, as stops for the foil drawn in SVG
const FOIL_STOPS: [number, string][] = [
  [0, "#56606a"],
  [0.2, "#8c959e"],
  [0.28, "#c3c9ce"],
  [0.36, "#7a838c"],
  [0.54, "#5d6771"],
  [0.72, "#9aa2aa"],
  [1, "#5a646e"],
];

const polar = (r: number, a: number): [number, number] => [r * Math.sin(a / DEG), -r * Math.cos(a / DEG)];
const f = (n: number) => n.toFixed(2);

// A loose wash of watercolour in the slice at the top: the slice drawn in from
// its lines and its corners worn round, its edge wandering a little the way a
// brush leaves it. Smoothed through its points (Catmull-Rom as cubic Béziers).
function wash(inset: number, seed: number) {
  const inner = 5.5 + inset;
  const outer = RIMS[1] - 1.6 - inset;
  const half = SLICE / 2 - 6 - inset * 2.2;
  const outline: [number, number][] = [];
  for (let k = 0; k < 8; k++) outline.push([inner + ((outer - inner) * k) / 8, -half]);
  for (let k = 0; k < 9; k++) outline.push([outer, -half + (2 * half * k) / 9]);
  for (let k = 0; k < 8; k++) outline.push([outer - ((outer - inner) * k) / 8, half]);
  for (let k = 0; k < 3; k++) outline.push([inner, half - (2 * half * k) / 3]);
  let pts = outline.map(([r, a]) => polar(r, a));
  for (let pass = 0; pass < 4; pass++) {
    pts = pts.map(([x, y], k): [number, number] => {
      const [a, b] = [pts[(k - 1 + pts.length) % pts.length], pts[(k + 1) % pts.length]];
      return [(a[0] + b[0] + x * 2) / 4, (a[1] + b[1] + y * 2) / 4];
    });
  }
  const mid = (inner + outer) / 2;
  pts = pts.map(([x, y], k): [number, number] => {
    const s = (k / pts.length) * Math.PI * 2;
    const wobble = 0.3 * Math.sin(3 * s + seed) + 0.16 * Math.sin(7 * s + seed * 2.3) + 0.07 * Math.sin(13 * s + seed * 3.7);
    const d = Math.hypot(x, y + mid) || 1;
    return [x + (x / d) * wobble, y + ((y + mid) / d) * wobble];
  });
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}
const WASHES = WASHED.map((i) => ({ i, body: wash(0, i * 1.9), glaze: wash(1.8, i * 3.1 + 1) }));

const SPOKES = Array.from({ length: 6 }, (_, k) => [polar(HUB, SLICE / 2 + k * SLICE), polar(RIMS[1], SLICE / 2 + k * SLICE)]);

// the clapper: a slim silver leaf hung from its rivet by a round boss, drawn
// about the rivet with its point at the bottom
const CLAP_PATH = (() => {
  const L = CLAP_LEN;
  const { boss, half, widest } = CLAP;
  const neck = [boss * Math.sin(40 / DEG), boss * Math.cos(40 / DEG)];
  const side = (s: number) =>
    `C${f(s * 0.2)} ${f(L - 1.2)} ${f(s * half)} ${f(widest + 1.4)} ${f(s * half)} ${f(widest)}` +
    `C${f(s * half)} ${f(widest - 0.5)} ${f(s * neck[0] * 1.15)} ${f(neck[1] + 0.35)} ${f(s * neck[0])} ${f(neck[1])}`;
  const back = (s: number) =>
    `C${f(s * neck[0] * 1.15)} ${f(neck[1] + 0.35)} ${f(s * half)} ${f(widest - 0.5)} ${f(s * half)} ${f(widest)}` +
    `C${f(s * half)} ${f(widest + 1.4)} ${f(s * 0.2)} ${f(L - 1.2)} 0 ${f(L)}`;
  return `M0 ${f(L)}${side(1)}A${boss} ${boss} 0 1 0 ${f(-neck[0])} ${f(neck[1])}${back(-1)}Z`;
})();

// the idle sway: a slow rock of a couple of degrees, now and then
const SWAY: Keyframe[] = [
  { transform: "rotate(0deg)", offset: 0 },
  { transform: "rotate(0deg)", offset: 0.55, easing: "cubic-bezier(0.37, 0, 0.63, 1)" },
  { transform: "rotate(2deg)", offset: 0.7, easing: "cubic-bezier(0.37, 0, 0.63, 1)" },
  { transform: "rotate(-1.4deg)", offset: 0.86, easing: "cubic-bezier(0.37, 0, 0.63, 1)" },
  { transform: "rotate(0deg)", offset: 1 },
];

const box = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `${x}cqw`,
  top: `${y}cqw`,
  width: `${w}cqw`,
  height: `${h}cqw`,
});

// polished silver, domed, lit from the upper left
const DOME =
  "radial-gradient(circle at 36% 30%, #ffffff 0%, #eceef0 12%, #c2c8ce 34%, #939ca4 60%, #747d86 82%, #a2aab1 100%)";

// a foil hairline ring: the foil gradient with its middle masked away
const RING: CSSProperties = {
  background: FOIL,
  backgroundSize: "300% 100%",
  padding: 1,
  borderRadius: "50%",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
};

type Phase = "ready" | "turning" | "landed" | "leaving" | "gone";

export const VenueWheel: WindowReveal = ({ go, onStart, onDone }) => {
  const reduce = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("ready");
  const discRef = useRef<HTMLDivElement>(null);
  const swayRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const clapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const goRef = useRef(() => {});

  const start = useEffectEvent(() => onStart());
  // the shower blooms from the brad
  const finish = useEffectEvent(() => {
    const r = discRef.current?.getBoundingClientRect();
    if (r) onDone(r.left + r.width / 2, r.top + r.height / 2);
  });

  useEffect(() => {
    const disc = discRef.current;
    const sway = swayRef.current;
    const face = faceRef.current;
    const clapper = clapRef.current;
    const handle = handleRef.current;
    if (!disc || !sway || !face || !clapper || !handle) return;

    let mode: "idle" | "drag" | "spin" | "still" = "idle";
    // the wheel's turn (deg, clockwise) now and at the last frame, and the
    // way it last moved
    let angle = 0;
    let prev = 0;
    let travel = 1;
    // the clapper's bend (deg) and how fast it is swinging
    let clap = 0;
    let clapV = 0;
    let tickAt = -Infinity;
    let raf = 0;
    let last = 0;
    let timer = 0;
    // the spin under way
    let path = (t: number) => t;
    let t0 = 0;
    let T = 0;
    let end = 0;
    let landed = false;

    const show = () => {
      face.style.transform = `rotate(${angle}deg)`;
      clapper.style.transform = `rotate(${clap}deg)`;
    };

    // A slow sway now and then, only while the card is on screen. On the
    // compositor; the first touch folds wherever it had got to into the wheel.
    const swayAnim = reduce ? null : sway.animate(SWAY, { duration: 7000, delay: 1200, iterations: Infinity });
    swayAnim?.pause();
    const io = swayAnim && new IntersectionObserver(([e]) => (e.isIntersecting ? swayAnim.play() : swayAnim.pause()), { threshold: 0.3 });
    io?.observe(disc);
    const settleSway = () => {
      if (!swayAnim || swayAnim.playState === "idle") return;
      const m = new DOMMatrixReadOnly(getComputedStyle(sway).transform);
      angle += Math.atan2(m.b, m.a) * DEG;
      prev = angle;
      swayAnim.cancel();
      io?.disconnect();
      show();
    };

    // a tiny haptic tick per spoke, where there is one
    const tick = (now: number) => {
      if (now - tickAt < TICK_MS || !(navigator.userActivation?.hasBeenActive ?? true)) return;
      tickAt = now;
      navigator.vibrate?.(4);
    };

    // The clapper. A spoke meeting its tip bends it over until the spoke slips
    // past; then it springs back, and the next spoke may catch it on the way.
    const flick = (dt: number, now: number) => {
      const moved = angle - prev;
      if (moved) travel = moved > 0 ? 1 : -1;
      // deg the wheel has turned since a spoke last crossed the pointer
      const past = mod(angle - SLICE / 2, SLICE);
      const under = travel > 0 ? past : SLICE - past;
      const crossed = Math.floor((angle - SLICE / 2) / SLICE) !== Math.floor((prev - SLICE / 2) / SLICE);
      if (crossed) tick(now);
      if (crossed && under >= CLAP_ZONE) {
        // too quick to see it bend: bent right over and let go, all in a frame
        clap = -travel * CLAP_MAX;
        clapV = 0;
        return;
      }
      for (let s = dt; s > 0; s -= 1 / 240) {
        const h = Math.min(s, 1 / 240);
        clapV -= (CLAP_W * CLAP_W * clap + 2 * CLAP_DAMP * CLAP_W * clapV) * h;
        clap += clapV * h;
      }
      if (under < CLAP_ZONE) {
        const held = (-travel * CLAP_MAX * under) / CLAP_ZONE;
        if (travel > 0 ? clap > held : clap < held) {
          clap = held;
          clapV = 0;
        }
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (mode === "spin") {
        const t = Math.max(0, (now - t0) / 1000);
        angle = t >= T ? end : path(t);
        // it has come to rest to the eye: glow, then reveal
        if (!landed && Math.abs(end - angle) < 0.5) {
          landed = true;
          setPhase("landed");
          timer = window.setTimeout(() => {
            finish();
            setPhase("leaving");
          }, GLOW_S * 1000);
        }
        if (t >= T) mode = "still";
      }
      flick(dt, now);
      prev = angle;
      show();
      if (mode === "drag" || mode === "spin" || Math.abs(clap) > 0.05 || Math.abs(clapV) > 1) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        clap = clapV = 0;
        show();
        face.style.willChange = clapper.style.willChange = "";
      }
    };
    // layers of their own only while they move
    const wake = () => {
      if (raf) return;
      face.style.willChange = clapper.style.willChange = "transform";
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    // Round to the monogram from wherever the wheel is, setting off at v0
    // (deg/s; 0 from rest) the way `dir` says: fast, then a long crawl. The
    // hand's push, or the flick's own speed, blends into the spin's over WIND.
    const spin = (v0: number, dir: number) => {
      const off = (Math.random() < 0.5 ? -1 : 1) * (REST[0] + Math.random() * (REST[1] - REST[0]));
      const tap = v0 === 0;
      const speed = tap ? TAP_SPEED : clamp(Math.abs(v0), FLICK);
      const to = mod(dir * (-off - angle), 360);
      const turns = Math.max(tap ? 2 : 1, Math.round((speed * SPIN_S) / POWER / 360 - to / 360));
      const dist = to + 360 * turns;
      T = tap ? SPIN_S : clamp((dist * POWER) / speed, FLICK_S);
      const from = angle;
      const lack = v0 - (dir * dist * POWER) / T;
      path = (t) => from + dir * dist * (1 - (1 - t / T) ** POWER) + (t < WIND ? lack * t * (1 - t / WIND) ** 2 : 0);
      end = from + dir * dist;
      t0 = performance.now();
      landed = false;
      mode = "spin";
      setPhase("turning");
      wake();
    };

    goRef.current = () => {
      if (reduce) {
        finish();
        setPhase("leaving");
        return;
      }
      if (mode !== "idle") return;
      settleSway();
      spin(0, 1);
    };

    // The wheel follows the finger round the brad, and spins off when let go.
    let pointer: number | null = null;
    let centre = { x: 0, y: 0 };
    let at = { x: 0, y: 0 };
    let reach = 1;
    let wandered = 0;
    let startAngle = 0;
    const samples: { t: number; a: number }[] = [];

    const onDown = (e: PointerEvent) => {
      if (mode !== "idle" || pointer !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
      e.preventDefault();
      if (reduce) {
        start();
        return;
      }
      pointer = e.pointerId;
      handle.setPointerCapture(e.pointerId);
      handle.style.cursor = "grabbing";
      settleSway();
      const r = disc.getBoundingClientRect();
      centre = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      reach = r.width * 0.2;
      at = { x: e.clientX, y: e.clientY };
      wandered = 0;
      startAngle = angle;
      samples.length = 0;
      samples.push({ t: e.timeStamp, a: angle });
      mode = "drag";
      wake();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const [x0, y0] = [at.x - centre.x, at.y - centre.y];
      const [x1, y1] = [e.clientX - centre.x, e.clientY - centre.y];
      // the turn about the brad, eased close to it, where the smallest
      // movement would otherwise whip the wheel round
      const near = Math.min(1, Math.min(Math.hypot(x0, y0), Math.hypot(x1, y1)) / reach);
      angle += Math.atan2(x0 * y1 - y0 * x1, x0 * x1 + y0 * y1) * DEG * near;
      wandered += Math.hypot(x1 - x0, y1 - y0);
      at = { x: e.clientX, y: e.clientY };
      samples.push({ t: e.timeStamp, a: angle });
      if (samples.length > 16) samples.shift();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      pointer = null;
      handle.style.cursor = "";
      // the flick: how fast it was turning over the last few moments, if the
      // finger hadn't already come to rest
      const recent = samples.filter((s) => e.timeStamp - s.t < 90);
      const [a, b] = [recent[0], recent[recent.length - 1]];
      const v = wandered < TAP_PX || !a || b.t - a.t < 8 ? 0 : ((b.a - a.a) / (b.t - a.t)) * 1000;
      // a tap sends it clockwise; a turn without a flick, the way it was turned
      const dir = wandered < TAP_PX ? 1 : Math.abs(v) > 30 ? Math.sign(v) : Math.sign(angle - startAngle) || 1;
      spin(Math.abs(v) > 30 ? v : 0, dir);
      start();
    };

    handle.addEventListener("pointerdown", onDown);
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      swayAnim?.cancel();
      io?.disconnect();
      goRef.current = () => {};
      handle.removeEventListener("pointerdown", onDown);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
    };
  }, [reduce]);

  const begin = useEffectEvent(() => goRef.current());
  useEffect(() => {
    if (go) begin();
  }, [go]);

  const leaving = phase === "leaving" || phase === "gone";
  if (phase === "gone") return <div aria-hidden className="absolute inset-0 pointer-events-none" />;

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none select-none">
      {/* the disc, its brad and its shadow: they lift off the card together */}
      <motion.div
        ref={discRef}
        className="absolute"
        style={box(CX - R, CY - R, R * 2, R * 2)}
        initial={false}
        animate={
          !leaving
            ? { opacity: 1, transform: "scale(1)" }
            : reduce
              ? { opacity: 0 }
              : { opacity: [1, 1, 0], transform: ["scale(1)", "scale(1.03)", "scale(0.9)"] }
        }
        transition={
          reduce
            ? { duration: 0.3 }
            : {
                transform: { duration: LIFT_S, times: [0, 0.3, 1], ease: [[0.2, 0.6, 0.35, 1], [0.55, 0, 0.8, 0.6]] },
                opacity: { duration: LIFT_S, times: [0, 0.2, 1], ease: ["linear", [0.4, 0, 0.7, 1]] },
              }
        }
        onAnimationComplete={() => leaving && setPhase("gone")}
      >
        <div
          className="absolute inset-0 rounded-full bg-[#efe9df]"
          style={{ boxShadow: "0 0.12cqw 0.25cqw rgba(40,30,20,0.3), 0.3cqw 0.9cqw 1.6cqw rgba(40,30,20,0.2)" }}
        />

        <div ref={swayRef} className="absolute inset-0">
          <div
            ref={faceRef}
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{
              backgroundColor: "#f5f1ea",
              backgroundImage: `url(${IMG.card})`,
              backgroundSize: "110cqw auto",
              backgroundPosition: "center",
            }}
          >
            <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} className="absolute inset-0 size-full">
              <defs>
                <linearGradient id="volvelle-foil" gradientUnits="userSpaceOnUse" x1={-R} y1={-R * 0.5} x2={R} y2={R * 0.5}>
                  {FOIL_STOPS.map(([o, c]) => (
                    <stop key={o} offset={o} stopColor={c} />
                  ))}
                </linearGradient>
              </defs>
              {WASHES.map(({ i, body, glaze }) => (
                <g key={i} transform={`rotate(${i * SLICE})`}>
                  <path d={body} fill="rgba(150,196,222,0.075)" stroke="rgba(118,168,200,0.09)" strokeWidth={0.22} />
                  <path d={glaze} fill="rgba(170,210,232,0.05)" />
                </g>
              ))}
              <g fill="none" stroke="url(#volvelle-foil)" style={{ filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.7))" }}>
                <circle r={HUB} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
                {SPOKES.map(([[x1, y1], [x2, y2]], k) => (
                  <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
                ))}
              </g>
            </svg>

            {WORDS.map((word, i) => (
              <div key={word} className="absolute inset-0" style={{ transform: `rotate(${(i + 1) * SLICE}deg)` }}>
                <span
                  className="absolute left-1/2 font-script leading-none whitespace-nowrap text-ink"
                  style={{ top: `${R - WORD.r}cqw`, fontSize: `${WORD.size}cqw`, transform: "translate(-50%, -50%)", ...PRESS }}
                >
                  {word}
                </span>
              </div>
            ))}

            <div className="absolute" style={box(R - MONO.w / 2, R - MONO.r - MONO_H / 2, MONO.w, MONO_H)}>
              <FoilMonogram className="w-full" />
            </div>

            {/* the monogram's slice, catching the light as the wheel comes to rest */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 50% ${50 - (MONO.r / R / 2) * 100}%, rgba(255,255,255,0.9), rgba(232,242,248,0.55) 20%, rgba(232,242,248,0) 46%)`,
                maskImage: "conic-gradient(from -30deg, transparent, #000 7deg 53deg, transparent 60deg)",
                WebkitMaskImage: "conic-gradient(from -30deg, transparent, #000 7deg 53deg, transparent 60deg)",
              }}
              initial={false}
              animate={{ opacity: phase === "landed" || leaving ? 1 : WARM }}
              transition={{ duration: 0.3, ease: [0.22, 0, 0.1, 1] }}
            />
          </div>
        </div>

        {/* static over the turning face: the light on the paper, the cut edge,
            and the foil rim, whose glint stays put as the wheel turns */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 24%, rgba(255,255,255,0.24), rgba(255,255,255,0) 58%), radial-gradient(circle at 72% 80%, rgba(90,74,60,0.07), rgba(90,74,60,0) 62%)",
            boxShadow:
              "inset 0 0.15cqw 0.1cqw -0.05cqw rgba(255,255,255,0.85), inset 0 -0.2cqw 0.35cqw rgba(90,74,60,0.12), 0 0 0 0.5px rgba(82,68,56,0.22)",
          }}
        />
        {RIMS.map((r) => (
          <div
            key={r}
            className="absolute sheen animate-[foil-sheen_7s_ease-in-out_infinite]"
            style={{ ...RING, inset: `${R - r}cqw`, filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.7))" }}
          />
        ))}

        <div
          className="absolute rounded-full"
          style={{
            ...box(R - BRAD / 2, R - BRAD / 2, BRAD, BRAD),
            background: DOME,
            boxShadow:
              "0 0.1cqw 0.15cqw rgba(30,26,22,0.4), 0.15cqw 0.4cqw 0.6cqw rgba(30,26,22,0.22), inset 0 -0.12cqw 0.2cqw rgba(40,46,54,0.35)",
          }}
        />
      </motion.div>

      {/* the clapper, on its rivet above the rim */}
      <motion.div
        className="absolute"
        style={box(CX - CLAP_BOX.w / 2, PIVOT_Y - CLAP_BOX.w / 2, CLAP_BOX.w, CLAP_BOX.h)}
        initial={false}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: reduce ? 0.3 : 0.4, ease: "easeOut" }}
      >
        <div ref={clapRef} className="absolute inset-0" style={{ transformOrigin: `50% ${CLAP_BOX.w / 2}cqw` }}>
          <svg
            viewBox={`${-CLAP_BOX.w / 2} ${-CLAP_BOX.w / 2} ${CLAP_BOX.w} ${CLAP_BOX.h}`}
            className="absolute inset-0 size-full overflow-visible"
            style={{ filter: "drop-shadow(0.15cqw 0.35cqw 0.25cqw rgba(30,26,22,0.32))" }}
          >
            <defs>
              <linearGradient id="volvelle-clapper" x1="0" y1="0" x2="0.6" y2="1">
                <stop offset="0" stopColor="#f1f3f4" />
                <stop offset="0.35" stopColor="#c6ccd1" />
                <stop offset="0.7" stopColor="#9aa2aa" />
                <stop offset="1" stopColor="#77808a" />
              </linearGradient>
              <radialGradient id="volvelle-rivet" cx="0.36" cy="0.3" r="0.75">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.3" stopColor="#d3d8dc" />
                <stop offset="0.7" stopColor="#8a939b" />
                <stop offset="1" stopColor="#6d7680" />
              </radialGradient>
              {/* the leaf is pressed with a ridge down its middle: the half
                  turned from the light is a shade darker */}
              <clipPath id="volvelle-shade">
                <rect x={0} y={-2} width={2} height={CLAP_BOX.h + 2} />
              </clipPath>
            </defs>
            <path d={CLAP_PATH} fill="url(#volvelle-clapper)" stroke="rgba(46,52,60,0.5)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
            <path d={CLAP_PATH} fill="rgba(38,46,56,0.2)" clipPath="url(#volvelle-shade)" />
            <circle r={0.5} fill="url(#volvelle-rivet)" stroke="rgba(46,52,60,0.45)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </motion.div>

      {/* what the finger takes hold of: the disc's circle, and nothing round it */}
      <div
        ref={handleRef}
        className="absolute rounded-full touch-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
        style={{
          ...box(CX - R, CY - R, R * 2, R * 2),
          pointerEvents: phase === "ready" || phase === "turning" ? "auto" : "none",
          cursor: phase === "ready" ? "grab" : undefined,
        }}
      />
    </div>
  );
};
