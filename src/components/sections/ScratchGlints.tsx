"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 0, 0.1, 1] as const;

// The last pieces of foil come loose and tumble off the card as the rest of it
// fades, then the light catches the silver printing once. Positions are % of
// the foil panel; sizes and drifts are in cqw (`unit` is px per cqw).
const FLECKS = [
  { x: 16, y: 44, s: 2.9, dx: -6, dy: 30, r: -160, d: 0.0, t: 2.4 },
  { x: 29, y: 22, s: 2.2, dx: -3, dy: 38, r: 130, d: 0.1, t: 2.7 },
  { x: 41, y: 56, s: 3.4, dx: 2, dy: 26, r: 210, d: 0.04, t: 2.3 },
  { x: 55, y: 18, s: 2.4, dx: 4, dy: 40, r: -120, d: 0.16, t: 2.8 },
  { x: 67, y: 40, s: 3.0, dx: 7, dy: 32, r: 170, d: 0.07, t: 2.5 },
  { x: 83, y: 58, s: 2.3, dx: 6, dy: 26, r: -200, d: 0.2, t: 2.2 },
  { x: 24, y: 70, s: 2.5, dx: -5, dy: 22, r: 150, d: 0.13, t: 2.2 },
  { x: 49, y: 78, s: 2.0, dx: -1, dy: 20, r: -140, d: 0.24, t: 2.0 },
  { x: 74, y: 76, s: 2.6, dx: 4, dy: 20, r: 120, d: 0.1, t: 2.1 },
  { x: 60, y: 60, s: 1.9, dx: 2, dy: 28, r: -180, d: 0.3, t: 2.4 },
];

const SHAPES = [
  "polygon(0 22%, 72% 0, 100% 64%, 30% 100%)",
  "polygon(12% 0, 100% 34%, 58% 100%)",
  "polygon(0 8%, 100% 0, 84% 100%, 18% 78%)",
];

// bright satin: pale enough to read as silver on ivory rather than as dust
const FLECK_FOIL = "linear-gradient(128deg, #f3f4f5 0%, #c9ced3 38%, #9aa2aa 70%, #d9dde0 100%)";

// the frame's crown, the monogram and the ends of the date's foil rules
const GLINTS = [
  { x: 50, y: -3.4, s: 10, d: 0.35 },
  { x: 93, y: 52, s: 8, d: 0.62 },
  { x: 50, y: 20, s: 7, d: 0.88 },
  { x: 7, y: 62, s: 8.5, d: 1.1 },
];

const RAY = "rgba(140,148,156,0.95)";
const GLINT_BG = [
  "radial-gradient(circle, #fff 0 5%, rgba(226,230,233,0.95) 9%, rgba(200,206,211,0.5) 16%, rgba(200,206,211,0) 30%)",
  `linear-gradient(90deg, transparent, ${RAY} 50%, transparent) center / 100% 1.5px no-repeat`,
  `linear-gradient(0deg, transparent, ${RAY} 50%, transparent) center / 1.5px 100% no-repeat`,
].join(",");

export function ScratchGlints({ unit }: { unit: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {FLECKS.map((f, i) => (
        <motion.span
          key={`f${i}`}
          className="absolute block"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: `${f.s}cqw`,
            height: `${f.s}cqw`,
            background: FLECK_FOIL,
            clipPath: SHAPES[i % SHAPES.length],
          }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scaleX: 1 }}
          animate={{ opacity: [0, 1, 1, 0], x: f.dx * unit, y: f.dy * unit, rotate: f.r, scaleX: [1, 0.15, -1, 0.3, 1] }}
          transition={{
            delay: f.d,
            duration: f.t,
            x: { delay: f.d, duration: f.t, ease: [0.2, 0.6, 0.4, 1] },
            y: { delay: f.d, duration: f.t, ease: [0.5, 0, 0.85, 0.6] },
            rotate: { delay: f.d, duration: f.t, ease: "linear" },
            scaleX: { delay: f.d, duration: f.t, ease: "linear" },
            opacity: { delay: f.d, duration: f.t, times: [0, 0.06, 0.55, 1], ease: "linear" },
          }}
        />
      ))}
      {GLINTS.map((g, i) => (
        <motion.span
          key={`g${i}`}
          className="absolute block"
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: `${g.s}cqw`,
            height: `${g.s}cqw`,
            marginLeft: `${-g.s / 2}cqw`,
            marginTop: `${-g.s / 2}cqw`,
            background: GLINT_BG,
          }}
          initial={{ opacity: 0, scale: 0.2, rotate: -30 }}
          animate={{ opacity: [0, 1, 0], scale: [0.2, 1, 0.4], rotate: 30 }}
          transition={{ delay: g.d, duration: 1.2, ease: EASE, opacity: { delay: g.d, duration: 1.2, times: [0, 0.35, 1] } }}
        />
      ))}
    </div>
  );
}
