"use client";

import { motion } from "framer-motion";
import { useEffect, useEffectEvent, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { IMG, SIZE } from "../opening/geometry";
import { WARM } from "../opening/WaxSeal";
import { mapPin } from "./VenueMap";

// The silver pin that drops onto the venue once the map comes up, for any
// piece in the map's window: PinPatch goes under the piece, PinDrop over it.
// The pin is in px, like the map it lands on.

type Size = { w: number; h: number };

// the window is 64cqw across; its paper is the card's, 100cqw wide, centred
const WINDOW_W = 64;

// Google draws its marker in px, 26 wide and 38 tall, its tip on mapPin and
// its label starting 15px to the right. So the pin is in px too, just big
// enough to cover it: a head of radius r, its centre `head` over the tip, which
// sits a hair below Google's.
const PIN = { r: 14.6, head: 25, tip: 0.3, pad: 3 };
const PIN_BOX = { w: (PIN.r + PIN.pad) * 2, h: PIN.head + PIN.r + PIN.pad * 2 };
const PIN_TOP = PIN.head + PIN.r + PIN.pad;
const IVORY = 6.4;
// Under the pin, a patch over Google's marker so the map comes up without it
// while the pin is still falling: the window's paper, and over that the map's
// own land tone fading in as the map does (VenueMap's 1.1s). It is the pin's
// outline with the head drawn in by a hair, so it stays hidden once the pin is
// down, and the point run on a hair past the pin's, round Google's soft tip.
const LAND = "#fdfaf4";
const MAP_FADE = { duration: 1.1, ease: [0.22, 0, 0.1, 1] } as const;
const PATCH = { in: 0.45, on: 1 };
// px: the shadow it lands on, and the rings that spread from it
const CONTACT = { w: 20, h: 7, dx: 1.6, dy: 0.6 };
const RIPPLE = { w: 60, h: 20, stroke: 1 };
// s: its fall and its landing; px: the one small hop
export const FALL_S = 0.48;
const BOUNCE_S = 0.38;
const HOP = 4.5;

const DEG = 180 / Math.PI;
const polar = (r: number, a: number): [number, number] => [r * Math.sin(a / DEG), -r * Math.cos(a / DEG)];
const f = (n: number) => n.toFixed(2);
// the window light, from the upper left and a little above the card
const LIGHT = [-0.5, -0.8, 1.2].map((c, _, v) => c / Math.hypot(...v));

// The window as laid out, the card's tilt left out: it places the pin.
export function useWindowSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

// where the pin comes to rest: its tip on Google's marker, and the box round it
export function pinSpot({ w, h }: Size) {
  const at = mapPin(w, h);
  const tipY = at.y + PIN.tip;
  return { x: at.x, tipY, box: { left: at.x - PIN_BOX.w / 2, top: tipY - PIN_TOP, width: PIN_BOX.w, height: PIN_BOX.h } };
}

// a teardrop with its tip at (x, y): a head of radius r, its centre `head` above the tip
const teardrop = (r: number, head: number, x = 0, y = 0) => {
  const s = Math.sqrt(head * head - r * r);
  const [tx, ty] = [(s * r) / head, -(s * s) / head];
  return `M${f(x)} ${f(y)}L${f(x + tx)} ${f(y + ty)}A${f(r)} ${f(r)} 0 1 0 ${f(x - tx)} ${f(y + ty)}Z`;
};
const PIN_PATH = teardrop(PIN.r, PIN.head);
const PATCH_PATH = `path("${teardrop(PIN.r - PATCH.in, PIN.head + PATCH.on, PIN_BOX.w / 2, PIN_TOP + PATCH.on)}")`;

// The pin's fall, drawn out a touch as it gathers speed; the squash as it
// lands, one small hop, and still. About its tip.
type Bezier = [number, number, number, number];
const DROP_S = FALL_S + BOUNCE_S;
const DROP = {
  duration: DROP_S,
  times: [0, FALL_S, FALL_S + 0.07, FALL_S + 0.19, FALL_S + 0.3, DROP_S].map((t) => t / DROP_S),
  ease: [
    [0.4, 0, 0.75, 0.45],
    [0.2, 0.6, 0.4, 1],
    [0.3, 0.6, 0.45, 1],
    [0.5, 0, 0.75, 0.5],
    [0.3, 0.6, 0.4, 1],
  ] as Bezier[],
};
// Until then it waits where it will land, all but invisible, so it is drawn
// with the card: lifted out above the window, where the arch hides it, it
// would not be drawn until it moved, and would hold up the frame it set off in.
const falling = (from: number) => ({
  opacity: DROP.times.map(() => 1),
  transform: [
    `translateY(${f(-from)}px) scale(1, 1)`,
    "translateY(0px) scale(0.95, 1.06)",
    "translateY(0px) scale(1.07, 0.9)",
    `translateY(${-HOP}px) scale(0.98, 1.03)`,
    "translateY(0px) scale(1.02, 0.97)",
    "translateY(0px) scale(1, 1)",
  ],
});
const DOWN = "translateY(0px) scale(1, 1)";

// the shadow it lands on: nothing while the pin is high, gathering over the
// second half of its fall, spreading as it squashes and thinning as it hops
const CONTACT_FALL = {
  animate: {
    opacity: [WARM, WARM, 1, 1, 0.7, 1, 1],
    transform: ["scale(0.3)", "scale(0.3)", "scale(1)", "scale(1.12, 1.05)", "scale(0.85)", "scale(1.03)", "scale(1)"],
  },
  transition: {
    duration: DROP_S,
    times: [0, (FALL_S * 0.5) / DROP_S, ...DROP.times.slice(1)],
    ease: [[0, 0, 1, 1], [0.5, 0, 0.85, 0.6], ...DROP.ease.slice(1)] as Bezier[],
  },
};

// two fine foil rings spreading from where it lands, timed from the fall's
// start: the foil's brighter half, so they read as light, not as a line
const RIPPLE_STOPS: [number, string][] = [
  [0, "#9aa2aa"],
  [0.3, "#dfe3e6"],
  [0.5, "#8c959e"],
  [0.75, "#c9ced3"],
  [1, "#9aa2aa"],
];
const RIPPLE_SVG = (i: number) => (
  <svg viewBox={`0 0 ${RIPPLE.w} ${RIPPLE.h}`} width={RIPPLE.w} height={RIPPLE.h} className="block overflow-visible">
    <defs>
      <linearGradient id={`pin-ripple-${i}`} x1="0" y1="0" x2="1" y2="0.4">
        {RIPPLE_STOPS.map(([o, c]) => (
          <stop key={o} offset={o} stopColor={c} />
        ))}
      </linearGradient>
    </defs>
    <ellipse
      cx={RIPPLE.w / 2}
      cy={RIPPLE.h / 2}
      rx={(RIPPLE.w - RIPPLE.stroke) / 2}
      ry={(RIPPLE.h - RIPPLE.stroke) / 2}
      fill="none"
      stroke={`url(#pin-ripple-${i})`}
      strokeWidth={RIPPLE.stroke}
    />
  </svg>
);
const RIPPLES = [
  { delay: 0, dur: 0.9, peak: 0.9, scale: 1 },
  { delay: 0.14, dur: 1.15, peak: 0.55, scale: 1.3 },
].map(({ delay, dur, peak, scale }) => ({
  animate: { opacity: [0, peak, 0], transform: ["scale(0.2)", `scale(${scale})`] },
  transition: {
    delay: FALL_S + delay,
    duration: dur,
    ease: [0.2, 0.6, 0.35, 1] as Bezier,
    opacity: { delay: FALL_S + delay, duration: dur, times: [0, 0.14, 1], ease: "linear" as const },
  },
}));

// A tone laid down the way the window's paper is, on a box at (x, y) in a
// window w x h: the card's grain multiplied in, lined up with the window's own
// (which is 100cqw wide, centred in the window).
const toned = (color: string, w: number, h: number, x: number, y: number): CSSProperties => {
  const cw = (w * 100) / WINDOW_W;
  const ch = (cw * SIZE.card.h) / SIZE.card.w;
  return {
    backgroundColor: color,
    backgroundImage: `url(${IMG.card})`,
    backgroundSize: `${cw}px ${ch}px`,
    backgroundPosition: `${(w - cw) / 2 - x}px ${(h - ch) / 2 - y}px`,
    backgroundBlendMode: "multiply",
  };
};

// The pin: polished silver, a shade darker on the half turned from the light,
// with a bright bevel round its lit shoulder; set in its head, an ivory disc in
// a fine bezel with a small foil star, a compass rose in miniature.
const HEAD = -PIN.head;
const BEVEL = (() => {
  const [a, b] = [polar(PIN.r - 1.2, -105), polar(PIN.r - 1.2, -5)];
  return `M${f(a[0])} ${f(a[1] + HEAD)}A${PIN.r - 1.2} ${PIN.r - 1.2} 0 0 1 ${f(b[0])} ${f(b[1] + HEAD)}`;
})();
const MINI = [0, 90, 180, 270].flatMap((a) => {
  const tip = polar(3.3, a);
  return [-45, 45].map((side) => {
    const s = polar(0.95, a + side);
    const out = polar(1, a + Math.sign(side) * 90);
    return { d: `M0 ${HEAD}L${f(s[0])} ${f(s[1] + HEAD)}L${f(tip[0])} ${f(tip[1] + HEAD)}Z`, lit: out[0] * LIGHT[0] + out[1] * LIGHT[1] > 0 };
  });
});

const PIN_SVG = (
  <svg
    viewBox={`${-PIN_BOX.w / 2} ${-PIN_TOP} ${PIN_BOX.w} ${PIN_BOX.h}`}
    width={PIN_BOX.w}
    height={PIN_BOX.h}
    className="block overflow-visible"
    style={{ filter: "drop-shadow(0.6px 1.4px 1.1px rgba(30,26,22,0.36))" }}
  >
    <defs>
      <linearGradient id="pin-silver" x1="0.15" y1="0" x2="0.7" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.2" stopColor="#eef1f3" />
        <stop offset="0.44" stopColor="#c0c7cd" />
        <stop offset="0.57" stopColor="#99a2aa" />
        <stop offset="0.72" stopColor="#c3c9cf" />
        <stop offset="1" stopColor="#848d96" />
      </linearGradient>
      <radialGradient id="pin-rim" gradientUnits="userSpaceOnUse" cx={0} cy={HEAD} r={PIN.r}>
        <stop offset="0.66" stopColor="rgba(40,48,58,0)" />
        <stop offset="1" stopColor="rgba(40,48,58,0.2)" />
      </radialGradient>
      <clipPath id="pin-half">
        <rect x={0} y={-PIN_TOP} width={PIN_BOX.w / 2} height={PIN_BOX.h} />
      </clipPath>
      <linearGradient id="pin-bevel" gradientUnits="userSpaceOnUse" x1={-PIN.r} y1={HEAD + 4} x2={2} y2={HEAD - PIN.r}>
        <stop offset="0" stopColor="rgba(255,255,255,0)" />
        <stop offset="0.45" stopColor="#ffffff" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <radialGradient id="pin-shine" gradientUnits="userSpaceOnUse" cx={-5.5} cy={HEAD - 5.5} r={5}>
        <stop offset="0" stopColor="rgba(255,255,255,0.85)" />
        <stop offset="1" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <radialGradient id="pin-ivory" cx="0.42" cy="0.36" r="0.7">
        <stop offset="0" stopColor="#fffdf9" />
        <stop offset="0.6" stopColor="#f3eee5" />
        <stop offset="1" stopColor="#e0d9cc" />
      </radialGradient>
      <radialGradient id="pin-set" cx="0.5" cy="0.64" r="0.62">
        <stop offset="0.74" stopColor="rgba(70,58,46,0)" />
        <stop offset="1" stopColor="rgba(70,58,46,0.3)" />
      </radialGradient>
    </defs>
    <path d={PIN_PATH} fill="url(#pin-silver)" />
    <path d={PIN_PATH} fill="rgba(36,44,54,0.12)" clipPath="url(#pin-half)" />
    <path d={PIN_PATH} fill="url(#pin-rim)" />
    <circle cx={-5.5} cy={HEAD - 5.5} r={5} fill="url(#pin-shine)" />
    <path d={BEVEL} fill="none" stroke="url(#pin-bevel)" strokeWidth={1.1} strokeLinecap="round" />

    <circle cy={HEAD} r={IVORY + 0.6} fill="none" stroke="#eef1f3" strokeWidth={1.2} />
    <circle cy={HEAD} r={IVORY + 1.2} fill="none" stroke="rgba(46,54,64,0.4)" strokeWidth={0.5} />
    <circle cy={HEAD} r={IVORY} fill="url(#pin-ivory)" />
    <circle cy={HEAD} r={IVORY} fill="url(#pin-set)" stroke="rgba(60,68,78,0.45)" strokeWidth={0.5} />
    {MINI.map(({ d, lit }) => (
      <path key={d} d={d} fill={lit ? "#e9edf0" : "#78818a"} stroke="rgba(52,60,70,0.55)" strokeWidth={0.3} strokeLinejoin="round" />
    ))}

    <path d={PIN_PATH} fill="none" stroke="rgba(40,48,58,0.6)" strokeWidth={0.75} />
  </svg>
);

// Goes under the piece: once the map starts coming up (`revealing`), it keeps
// Google's own marker hidden, so only the silver pin ever shows there.
export function PinPatch({ size, revealing, reduce }: { size: Size | null; revealing: boolean; reduce: boolean }) {
  if (!size) return null;
  const { box } = pinSpot(size);
  return (
    <>
      <div className="absolute" style={{ ...box, ...toned("#ede8df", size.w, size.h, box.left, box.top), clipPath: PATCH_PATH }} />
      <motion.div
        className="absolute"
        style={{ ...box, ...toned(LAND, size.w, size.h, box.left, box.top), clipPath: PATCH_PATH }}
        initial={false}
        animate={{ opacity: revealing ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : MAP_FADE}
      />
    </>
  );
}

// Goes over the piece: the pin waits unseen until `fall`, then drops onto the
// venue, lands with a squash and a hop, and ripples out; under reduced motion
// it is simply there. onLanded gets its tip's point on screen at touchdown.
export function PinDrop({
  size,
  fall,
  reduce,
  onLanded,
}: {
  size: Size | null;
  fall: boolean;
  reduce: boolean;
  onLanded: (x: number, y: number) => void;
}) {
  const [landed, setLanded] = useState(false);
  const pinRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const drop = !fall ? "up" : reduce || landed ? "down" : "falling";
  const spot = size && pinSpot(size);
  // from just above the window's top edge, where the arch hides it
  const from = spot ? spot.tipY + 2 : 0;
  const fallFrames = useMemo(() => falling(from), [from]);

  const land = useEffectEvent(() => {
    const r = tipRef.current?.getBoundingClientRect();
    if (r) onLanded(r.left, r.top);
  });
  // Touchdown is read off the fall's own clock, which a busy frame can hold
  // back, rather than a timer, which it can't.
  useEffect(() => {
    if (!fall) return;
    const since = performance.now();
    let raf = requestAnimationFrame(function watch(now) {
      const anim = pinRef.current?.getAnimations().find((a) => a.playState === "running");
      const t = anim ? Number(anim.currentTime) : now - since;
      if (reduce || t >= FALL_S * 1000) land();
      else raf = requestAnimationFrame(watch);
    });
    return () => cancelAnimationFrame(raf);
  }, [fall, reduce]);

  if (!spot) return null;
  return (
    <>
      {/* its shadow on the map, gathering as it comes down */}
      <motion.div
        className="absolute"
        style={{
          left: spot.x - CONTACT.w / 2 + CONTACT.dx,
          top: spot.tipY - CONTACT.h / 2 + CONTACT.dy,
          width: CONTACT.w,
          height: CONTACT.h,
          background: "radial-gradient(closest-side, rgba(30,26,22,0.42), rgba(30,26,22,0.2) 55%, rgba(30,26,22,0))",
        }}
        initial={false}
        animate={
          drop === "down"
            ? { opacity: 1, transform: "scale(1)" }
            : drop === "falling"
              ? CONTACT_FALL.animate
              : { opacity: WARM, transform: "scale(0.3)" }
        }
        transition={reduce ? { duration: 0.3 } : drop === "falling" ? CONTACT_FALL.transition : { duration: 0 }}
      />

      {!reduce &&
        RIPPLES.map((r, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: spot.x - RIPPLE.w / 2, top: spot.tipY - RIPPLE.h / 2, width: RIPPLE.w, height: RIPPLE.h }}
            initial={false}
            animate={drop === "up" ? { opacity: WARM } : r.animate}
            transition={drop === "up" ? { duration: 0 } : r.transition}
          >
            {RIPPLE_SVG(i)}
          </motion.div>
        ))}

      <motion.div
        ref={pinRef}
        className="absolute"
        style={{ ...spot.box, transformOrigin: `50% ${PIN_TOP}px` }}
        initial={false}
        animate={drop === "up" ? { opacity: WARM, transform: DOWN } : drop === "down" ? { opacity: 1, transform: DOWN } : fallFrames}
        transition={reduce ? { duration: 0.3 } : drop === "falling" ? DROP : { duration: 0 }}
        onAnimationComplete={() => drop === "falling" && setLanded(true)}
      >
        {PIN_SVG}
      </motion.div>

      {/* where the pin's tip comes to rest */}
      <div ref={tipRef} className="absolute" style={{ left: spot.x, top: spot.tipY }} />
    </>
  );
}
