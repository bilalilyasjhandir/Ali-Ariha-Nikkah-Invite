"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useEffectEvent, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { FOIL_EDGE } from "../paper/foil";
import type { WindowReveal } from "./VenueCard";
import { mapPin } from "./VenueMap";
import { PinDrop, PinPatch, pinSpot, useWindowSize } from "./VenuePin";

// A compass rose engraved and stamped in silver foil on the window's paper,
// its blued needle hovering over it. Set going, the needle spins round and
// settles on the venue; the rose fades into the map coming up beneath it, and
// a silver pin (VenuePin) drops onto the spot. The rose is in cqw of the card
// (the window is 64 x 56, arched across its width).

const WINDOW_W = 64;
const CX = WINDOW_W / 2;
const CY = 29.5;

// the rose, out from its centre: a foil ring whose degrees run between it and
// a second hairline, the longer ones on past it; the cardinal letters; faint
// guide circles; and the star, four long points over four short
const RING = [24, 23.2] as const;
const TICK = { major: 1.35, cardinal: 1.9 };
const LETTER = { r: 20.5, size: 3, cap: 0.7 };
const GUIDES = [13.4, 6.6];
const STAR = { long: 16.2, short: 10.2, waist: 2.6, shortWaist: 1.8, rise: 2.4 };
const VIEW = 25;
// the needle: half its length and its half-width at the pivot; the cap it
// turns on, and the collar in the rose the cap is set in
const NEEDLE = { half: 19.2, width: 1.15 };
const CAP = 1.45;
const COLLAR = 2.5;
// its shadow on the card: down and to the right, whichever way it points
const SHADOW = { x: 1, y: 1.45, blur: 0.45 };
// deg: where it rests before it is set going, a little west of the rose's
// north, the way a real compass's needle sits off its card
const IDLE_AT = -18;


// s: the spin, 2-3 turns in all: up to speed in a blink, then easing down to
// V1 (deg/s) as it comes round to the bearing
const SPIN_S = 1.25;
const SPIN_UP = 0.07;
const TURNS = 2;
const V1 = 420;
// then past it and back on a damped spring (rad/s, and its damping ratio), with
// a tail long enough to die away in. It is still to the eye within 1 degree.
const W0 = 11.5;
const ZETA = 0.36;
const WD = W0 * Math.sqrt(1 - ZETA * ZETA);
const REST_S = SPIN_S + Math.log(V1 / WD) / (ZETA * W0);
// s: a breath once it has found the venue, then the reveal and the rose's
// fade; the pin sets off a moment after, so its layers are drawn after the map's
const PAUSE_S = 0.3;
const REVEAL_S = REST_S + PAUSE_S;
const FADE_S = 0.6;
const DROP_DELAY_S = 0.15;
// the needle's course runs up to the reveal, where what is left of the spring
// is a fraction of a degree; 60 keyframes a second
const COURSE_S = REVEAL_S;
const FPS = 60;

const DEG = 180 / Math.PI;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const polar = (r: number, a: number): [number, number] => [r * Math.sin(a / DEG), -r * Math.cos(a / DEG)];
const f = (n: number) => n.toFixed(2);
const pt = ([x, y]: [number, number]) => `${f(x)} ${f(y)}`;

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

// the degrees: every 5, longer every 45, longest at the cardinals
const TICKS = [
  { w: 0.75, len: RING[0] - RING[1], every: (a: number) => a % 45 !== 0 },
  { w: 0.95, len: TICK.major, every: (a: number) => a % 45 === 0 && a % 90 !== 0 },
  { w: 1.15, len: TICK.cardinal, every: (a: number) => a % 90 === 0 },
].map(({ w, len, every }) => ({
  w,
  d: Array.from({ length: 72 }, (_, k) => k * 5)
    .filter(every)
    .map((a) => `M${pt(polar(RING[0], a))}L${pt(polar(RING[0] - len, a))}`)
    .join(""),
}));

// a small foil lozenge at each of the four points between
const LOZENGES = [45, 135, 225, 315].map((a) => {
  const [r, l, w] = [LETTER.r, 0.75, 0.36];
  const side = Math.atan2(w, r) * DEG;
  return `M${pt(polar(r + l, a))}L${pt(polar(Math.hypot(r, w), a + side))}L${pt(polar(r - l, a))}L${pt(polar(Math.hypot(r, w), a - side))}Z`;
});

const CARDINALS = (["N", "E", "S", "W"] as const).map((l, i) => {
  const [x, y] = polar(LETTER.r, i * 90);
  return { l, x, y: y + (LETTER.size * LETTER.cap) / 2 };
});

// Silver from shadow to light, and the star's points in it. Each point is a
// ridge from the centre out to its tip with a facet falling away to either
// side, lit by how squarely it faces the light (from the upper left, a little
// above the card); nearer the centre, where it stands proudest, a shade brighter.
const SILVER = [
  [0x56, 0x60, 0x6a],
  [0x86, 0x8f, 0x98],
  [0xbd, 0xc4, 0xca],
  [0xe6, 0xea, 0xed],
];
const silver = (t: number) => {
  const x = Math.min(0.999, Math.max(0, t)) * (SILVER.length - 1);
  const [a, b] = [SILVER[Math.floor(x)], SILVER[Math.floor(x) + 1]];
  const k = x - Math.floor(x);
  return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * k)).join(",")})`;
};
const LIGHT = [-0.5, -0.8, 1.2].map((c, _, v) => c / Math.hypot(...v));

const RAW = [45, 135, 225, 315, 0, 90, 180, 270].map((a) => {
  const long = a % 90 === 0;
  const tip = polar(long ? STAR.long : STAR.short, a);
  const sides = [-45, 45].map((s) => polar(long ? STAR.waist : STAR.shortWaist, a + s));
  const facets = sides.map((s) => {
    // the facet's normal, from its two edges out of the raised centre
    const [u, v] = [
      [tip[0], tip[1], -STAR.rise],
      [s[0], s[1], -STAR.rise],
    ];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const up = Math.sign(n[2]) / Math.hypot(...n);
    return { d: `M0 0L${pt(s)}L${pt(tip)}Z`, tip, lit: (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) * up };
  });
  return { facets, edge: `M${pt(sides[0])}L${pt(tip)}L${pt(sides[1])}` };
});
const LITS = RAW.flatMap((p) => p.facets.map((q) => q.lit));
const [LO, HI] = [Math.min(...LITS), Math.max(...LITS)];
const POINTS = RAW.map((p) => ({
  edge: p.edge,
  facets: p.facets.map(({ d, tip, lit }) => {
    const t = (lit - LO) / (HI - LO);
    return { d, tip, near: silver(t * 0.62 + 0.34), far: silver(t * 0.62 + 0.2) };
  }),
}));

// the needle, pointing up from its pivot: a slim lozenge, hollow-ground a
// little, each half pressed with a ridge so one side of it takes the light
const NEEDLE_BOX = { w: NEEDLE.width * 2 + 1, h: NEEDLE.half * 2 + 1 };
const flank = (end: number, side: number) => {
  const { half: L, width: w } = NEEDLE;
  return `Q${f(side * w * 0.38)} ${f(end * L * 0.46)} ${f(side * w)} 0`;
};
const HALF = (end: number, side: number) => `M0 ${f(end * NEEDLE.half)}${flank(end, side)}L0 0Z`;
const NEEDLE_PATH = (() => {
  const { half: L, width: w } = NEEDLE;
  const q = (x: number, y: number) => `${f(x * w * 0.38)} ${f(y * L * 0.46)}`;
  return `M0 ${f(-L)}Q${q(1, -1)} ${f(w)} 0Q${q(1, 1)} 0 ${f(L)}Q${q(-1, 1)} ${f(-w)} 0Q${q(-1, -1)} 0 ${f(-L)}Z`;
})();
const NEEDLE_LIT_EDGE = `M0 ${f(-NEEDLE.half)}${flank(-1, -1)}`;


// the idle drift: now and then the needle is nudged and settles again
const SWING = "cubic-bezier(0.37, 0, 0.63, 1)";
const DRIFT_MS = 10000;
const DRIFT: Keyframe[] = [
  [0, 0],
  [0, 0.1],
  [2.4, 0.18],
  [-1.3, 0.26],
  [0.6, 0.335],
  [-0.2, 0.405],
  [0.3, 0.55],
  [-2, 0.64],
  [1.1, 0.72],
  [-0.5, 0.795],
  [0.15, 0.865],
  [0, 1],
].map(([deg, offset]) => ({ transform: `rotate(${IDLE_AT + deg}deg)`, offset, easing: SWING }));

// The needle's way round from `from` to the bearing, as keyframes at 60 a
// second so it runs on the compositor. The spin's speed is stepped through a
// millisecond at a time: a steady V1, and an extra that dies away, sized to
// carry it exactly round. Then the spring about the bearing.
function course(from: number, bearing: number) {
  const to = from + mod(bearing - from, 360) + 360 * TURNS;
  const ms = Math.round(SPIN_S * 1000);
  const steady = new Float64Array(ms + 1);
  const dying = new Float64Array(ms + 1);
  for (let i = 0; i < ms; i++) {
    const t = i / 1000;
    const up = 1 - Math.exp(-t / SPIN_UP);
    steady[i + 1] = steady[i] + up / 1000;
    dying[i + 1] = dying[i] + (up * (1 - t / SPIN_S) ** 2) / 1000;
  }
  const extra = (to - from - V1 * steady[ms]) / dying[ms];
  const at = (t: number) => {
    if (t < SPIN_S) {
      const i = Math.round(t * 1000);
      return from + V1 * steady[i] + extra * dying[i];
    }
    const s = t - SPIN_S;
    return to + (V1 / WD) * Math.exp(-ZETA * W0 * s) * Math.sin(WD * s);
  };
  const n = Math.round(COURSE_S * FPS);
  const frames: Keyframe[] = Array.from({ length: n + 1 }, (_, k) => ({ transform: `rotate(${(k === n ? to : at(k / FPS)).toFixed(2)}deg)` }));
  return { frames, to };
}


const box = (x: number, y: number, w: number, h: number): CSSProperties => ({
  left: `${x}cqw`,
  top: `${y}cqw`,
  width: `${w}cqw`,
  height: `${h}cqw`,
});

// polished silver, domed, lit from the upper left
const DOME =
  "radial-gradient(circle at 36% 30%, #ffffff 0%, #eceef0 12%, #c2c8ce 34%, #939ca4 60%, #747d86 82%, #a2aab1 100%)";


// The rose in three sheets over one another, so each filter is measured in
// px (on an element inside an SVG, a CSS filter is measured in its units).
const sheet = (children: ReactNode, style?: CSSProperties) => (
  <svg
    viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
    className="absolute overflow-visible"
    style={{ ...box(CX - VIEW, CY - VIEW, VIEW * 2, VIEW * 2), ...style }}
  >
    {children}
  </svg>
);

const ROSE = (
  <>
    {/* faint guides, and the letters pressed into the cotton over a bright lip */}
    {sheet(
      <>
        <defs>
          <linearGradient id="compass-n" x1="0" y1="0" x2="1" y2="0.6">
            {FOIL_STOPS.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
        <g fill="none" stroke="rgba(82,68,56,0.13)">
          {GUIDES.map((r) => (
            <circle key={r} r={r} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g className="font-sans" fontSize={LETTER.size} textAnchor="middle">
          {CARDINALS.map(({ l, x, y }) => (
            <g key={l} fontWeight={l === "N" ? 500 : 400}>
              <text x={x} y={y + 0.14} fill="rgba(255,255,255,0.6)">
                {l}
              </text>
              <text x={x} y={y} className={l === "N" ? undefined : "fill-ink-mid"} fill={l === "N" ? "url(#compass-n)" : undefined}>
                {l}
              </text>
            </g>
          ))}
        </g>
      </>,
    )}

    {/* the ring and its degrees, in foil */}
    {sheet(
      <>
        <defs>
          <linearGradient id="compass-foil" gradientUnits="userSpaceOnUse" x1={-RING[0]} y1={-RING[0] * 0.5} x2={RING[0]} y2={RING[0] * 0.5}>
            {FOIL_STOPS.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#compass-foil)">
          <circle r={RING[0]} strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
          <circle r={RING[1]} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
          {TICKS.map(({ w, d }) => (
            <path key={w} d={d} strokeWidth={w} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
        <g fill="url(#compass-foil)">
          {LOZENGES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </>,
      { filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.7))" },
    )}

    {/* the star, embossed in foil */}
    {sheet(
      <>
        <defs>
          <radialGradient id="compass-collar" cx="0.38" cy="0.32" r="0.8">
            <stop offset="0" stopColor="#eef1f3" />
            <stop offset="0.55" stopColor="#b7bec5" />
            <stop offset="1" stopColor="#7d868f" />
          </radialGradient>
          {POINTS.flatMap((p, i) =>
            p.facets.map((q, j) => (
              <linearGradient key={`${i}${j}`} id={`compass-facet-${i}${j}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={q.tip[0]} y2={q.tip[1]}>
                <stop offset={0} stopColor={q.near} />
                <stop offset={1} stopColor={q.far} />
              </linearGradient>
            )),
          )}
        </defs>
        {POINTS.map((p, i) => (
          <g key={i}>
            {p.facets.map((q, j) => (
              <path key={j} d={q.d} fill={`url(#compass-facet-${i}${j})`} />
            ))}
            <path d={p.edge} fill="none" stroke="rgba(46,52,60,0.45)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {/* the collar the needle's pivot is set in */}
        <circle r={COLLAR} fill="url(#compass-collar)" stroke="rgba(46,52,60,0.5)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      </>,
      { filter: FOIL_EDGE },
    )}
  </>
);

const needleSheet = (children: ReactNode, style?: CSSProperties) => (
  <svg
    viewBox={`${-NEEDLE_BOX.w / 2} ${-NEEDLE_BOX.h / 2} ${NEEDLE_BOX.w} ${NEEDLE_BOX.h}`}
    className="absolute inset-0 size-full overflow-visible"
    style={style}
  >
    {children}
  </svg>
);

const NEEDLE_SVG = needleSheet(
  <>
    <defs>
      {(
        [
          ["blue-lit", -1, "#b3cddf", "#94b5cb"],
          ["blue-shade", -1, "#7a9db6", "#5d8199"],
          ["silver-lit", 1, "#f2f4f5", "#d4d9dd"],
          ["silver-shade", 1, "#a9b1b8", "#858e97"],
        ] as const
      ).map(([id, end, near, far]) => (
        <linearGradient key={id} id={`compass-${id}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={end * NEEDLE.half}>
          <stop offset={0} stopColor={near} />
          <stop offset={1} stopColor={far} />
        </linearGradient>
      ))}
    </defs>
    <path d={HALF(-1, -1)} fill="url(#compass-blue-lit)" />
    <path d={HALF(-1, 1)} fill="url(#compass-blue-shade)" />
    <path d={HALF(1, -1)} fill="url(#compass-silver-lit)" />
    <path d={HALF(1, 1)} fill="url(#compass-silver-shade)" />
    <path d={NEEDLE_LIT_EDGE} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
    <path d={NEEDLE_PATH} fill="none" stroke="rgba(30,42,56,0.62)" strokeWidth={0.55} vectorEffect="non-scaling-stroke" />
  </>,
);

const NEEDLE_SHADOW = needleSheet(<path d={NEEDLE_PATH} fill="rgba(34,28,22,0.38)" />, {
  filter: `blur(${SHADOW.blur}cqw)`,
});


type Phase = "ready" | "seeking" | "leaving" | "gone";

export const VenueCompass: WindowReveal = ({ go, onStart, onReveal, onDone }) => {
  const reduce = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("ready");
  const [dropping, setDropping] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const size = useWindowSize(rootRef);
  const sizeRef = useRef(size);
  const goRef = useRef(() => {});

  const reveal = useEffectEvent(() => onReveal());
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    const root = rootRef.current;
    const needle = needleRef.current;
    const shadow = shadowRef.current;
    if (!root || !needle || !shadow) return;
    // the needle and its shadow turn as one
    const rotors = [needle, shadow];
    let idle = true;
    const timers: number[] = [];
    const after = (s: number, run: () => void) => timers.push(window.setTimeout(run, s * 1000));

    // The drift, on the compositor, and only while the card is on screen.
    const drift = reduce ? [] : rotors.map((el) => el.animate(DRIFT, { duration: DRIFT_MS, delay: 900, iterations: Infinity }));
    drift.forEach((a) => a.pause());
    const io = drift.length ? new IntersectionObserver(([e]) => drift.forEach((a) => (e.isIntersecting ? a.play() : a.pause())), { threshold: 0.3 }) : null;
    io?.observe(root);

    goRef.current = () => {
      if (!idle || !sizeRef.current) return;
      idle = false;
      if (reduce) {
        setPhase("leaving");
        setDropping(true);
        reveal();
        return;
      }
      // off from wherever the drift had got to, round to the venue's bearing
      const m = new DOMMatrixReadOnly(getComputedStyle(needle).transform);
      const from = Math.atan2(m.b, m.a) * DEG;
      drift.forEach((a) => a.cancel());
      io?.disconnect();
      const { w, h } = sizeRef.current;
      const u = w / WINDOW_W;
      const p = mapPin(w, h);
      const { frames, to } = course(from, Math.atan2(p.x - CX * u, CY * u - p.y) * DEG);
      rotors.forEach((el) => el.animate(frames, { duration: COURSE_S * 1000, easing: "linear", fill: "forwards" }));
      setPhase("seeking");
      after(REVEAL_S, () => {
        // set the needle down where it came to rest, so the rose fades as one sheet
        rotors.forEach((el) => {
          el.style.transform = `rotate(${to}deg)`;
          el.getAnimations().forEach((a) => a.cancel());
        });
        reveal();
        setPhase("leaving");
      });
      after(REVEAL_S + DROP_DELAY_S, () => setDropping(true));
    };

    return () => {
      timers.forEach(clearTimeout);
      io?.disconnect();
      rotors.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
      goRef.current = () => {};
    };
  }, [reduce]);

  // (and again once the window has been measured, should a tap beat that)
  const begin = useEffectEvent(() => goRef.current());
  useEffect(() => {
    if (go) begin();
  }, [go, size]);

  const leaving = phase === "leaving" || phase === "gone";
  const spot = size && pinSpot(size);

  return (
    <div ref={rootRef} aria-hidden className="absolute inset-0 pointer-events-none select-none">
      <PinPatch size={size} revealing={leaving} reduce={reduce} />

      {phase !== "gone" && (
        <motion.div
          className="absolute inset-0"
          style={{ transformOrigin: spot ? `${spot.x}px ${spot.tipY}px` : undefined }}
          initial={false}
          animate={!leaving ? { opacity: 1, transform: "scale(1)" } : reduce ? { opacity: 0 } : { opacity: 0, transform: "scale(0.9)" }}
          transition={reduce ? { duration: 0.3 } : { duration: FADE_S, ease: [0.4, 0, 0.6, 1] }}
          onAnimationComplete={() => leaving && setPhase("gone")}
        >
          {ROSE}

          <div
            className="absolute"
            style={{
              ...box(CX - NEEDLE_BOX.w / 2, CY - NEEDLE_BOX.h / 2, NEEDLE_BOX.w, NEEDLE_BOX.h),
              transform: `translate(${SHADOW.x}cqw, ${SHADOW.y}cqw)`,
            }}
          >
            <div ref={shadowRef} className="absolute inset-0" style={{ transform: `rotate(${IDLE_AT}deg)` }}>
              {NEEDLE_SHADOW}
            </div>
          </div>
          <div
            ref={needleRef}
            className="absolute"
            style={{ ...box(CX - NEEDLE_BOX.w / 2, CY - NEEDLE_BOX.h / 2, NEEDLE_BOX.w, NEEDLE_BOX.h), transform: `rotate(${IDLE_AT}deg)` }}
          >
            {NEEDLE_SVG}
          </div>
          <div
            className="absolute rounded-full"
            style={{
              ...box(CX - CAP, CY - CAP, CAP * 2, CAP * 2),
              background: DOME,
              boxShadow:
                "0 0.1cqw 0.15cqw rgba(30,26,22,0.4), 0.15cqw 0.4cqw 0.6cqw rgba(30,26,22,0.22), inset 0 -0.12cqw 0.2cqw rgba(40,46,54,0.35)",
            }}
          />
        </motion.div>
      )}

      {/* the shower blooms from the pin's tip as it lands */}
      <PinDrop size={size} fall={dropping} reduce={reduce} onLanded={onDone} />

      {/* what a tap finds: the rose, and nothing round it */}
      <div
        className="absolute rounded-full cursor-pointer [-webkit-tap-highlight-color:transparent]"
        style={{ ...box(CX - RING[0], CY - RING[0], RING[0] * 2, RING[0] * 2), pointerEvents: phase === "ready" ? "auto" : "none" }}
        onClick={() => {
          goRef.current();
          onStart();
        }}
      />
    </div>
  );
};
