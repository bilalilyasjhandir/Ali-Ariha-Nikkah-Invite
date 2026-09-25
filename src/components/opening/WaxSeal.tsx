"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { IMG, SIZE } from "./geometry";
import crackData from "./seal-crack.json";

type Crumb = { file: string; x: number; y: number; w: number; h: number };
type CrackData = {
  points: number[][];
  branch?: number[][];
  tip_index?: number;
  crumbs?: Crumb[];
  halo_canvas?: [number, number];
};
const crack = crackData as unknown as CrackData;

// Layers that start invisible sit at this opacity instead of 0: the browser
// skips rasterising fully transparent layers, and rasterising one for the
// first time mid-animation drops frames on a phone.
export const WARM = 0.003;
const warm = (v: number) => Math.max(WARM, v);

const SEAL_SHADOW =
  "drop-shadow(3px 6px 5px rgba(34,28,24,0.32)) drop-shadow(1px 2px 1.5px rgba(34,28,24,0.28))";

function SealImage({ src, onLoad }: { src: string; onLoad?: () => void }) {
  return (
    <Image
      src={src}
      alt=""
      width={SIZE.seal.w}
      height={SIZE.seal.h}
      loading="eager"
      onLoad={onLoad}
      draggable={false}
      className="absolute inset-0 w-full h-full select-none"
    />
  );
}

// The halo may be baked on a larger canvas than the seal (the glow reaches past it).
const HALO = crack.halo_canvas ?? [SIZE.seal.w, SIZE.seal.h];
const HALO_INSET = `${(-(HALO[0] - SIZE.seal.w) / 2 / SIZE.seal.w) * 100}%`;

function Halo({ onLoad }: { onLoad?: () => void }) {
  return (
    <div className="absolute" style={{ inset: HALO_INSET }}>
      <Image
        src={IMG.sealHalo}
        alt=""
        width={HALO[0]}
        height={HALO[1]}
        loading="eager"
        onLoad={onLoad}
        draggable={false}
        className="absolute inset-0 w-full h-full select-none"
      />
    </div>
  );
}

// Whole seal until the moment it breaks. While waiting it breathes, with a
// whisper of the light that is about to escape from under it.
export function SealWhole({
  press,
  breathing,
  onLoad,
}: {
  press: MotionValue<number>;
  breathing: boolean;
  onLoad?: () => void;
}) {
  return (
    <motion.div className="absolute inset-0" style={{ scale: press }}>
      {breathing && (
        <div className="seal-glow-breathe absolute inset-0 opacity-0 animate-[seal-glow-breathe_3.2s_ease-in-out_2s_infinite]">
          <Halo />
        </div>
      )}
      <div className={`absolute inset-0 ${breathing ? "seal-breathe animate-[seal-breathe_3.2s_ease-in-out_2s_infinite]" : ""}`}>
        <div className="absolute inset-0" style={{ filter: SEAL_SHADOW }}>
          <SealImage src={IMG.seal} onLoad={onLoad} />
        </div>
      </div>
    </motion.div>
  );
}

export function SealPiece({
  src,
  press,
  onLoad,
}: {
  src: string;
  press: MotionValue<number>;
  onLoad?: () => void;
}) {
  return (
    <motion.div className="absolute inset-0" style={{ scale: press, filter: SEAL_SHADOW }}>
      <SealImage src={src} onLoad={onLoad} />
    </motion.div>
  );
}

// Light escaping through the fracture and catching the relief around it. Baked
// with brightness as alpha (see README): a CSS screen blend can't reach through
// the animated layers above it.
export function SealLight({
  amount,
  press,
  onLoad,
}: {
  amount: MotionValue<number>;
  press: MotionValue<number>;
  onLoad?: () => void;
}) {
  const opacity = useTransform(amount, warm);
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity, scale: press, willChange: "opacity, transform" }}
    >
      <SealImage src={IMG.sealLight} onLoad={onLoad} />
    </motion.div>
  );
}

// A band of silver light travelling across the wax, cut to the seal's own
// outline: the moment the wax itself lights up.
export function SealSheen({ sweep, press }: { sweep: MotionValue<number>; press: MotionValue<number> }) {
  const x = useTransform(sweep, [0, 1], ["-120%", "120%"]);
  const opacity = useTransform(sweep, (v) => warm(Math.sin(Math.PI * Math.min(1, Math.max(0, v))) * 0.55));
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        scale: press,
        opacity,
        willChange: "opacity, transform",
        maskImage: `url(${IMG.seal})`,
        WebkitMaskImage: `url(${IMG.seal})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
      }}
    >
      <motion.div
        className="absolute inset-y-0 w-full"
        style={{
          x,
          willChange: "transform",
          background:
            "linear-gradient(112deg, transparent 22%, rgba(236,245,252,0.15) 36%, rgba(246,251,255,0.9) 50%, rgba(236,245,252,0.15) 64%, transparent 78%)",
        }}
      />
    </motion.div>
  );
}

// The fracture growing outward in both directions from the flap tip.
const pts = crack.points;
const tip = crack.tip_index ?? pts.reduce((best, p, i) => (p[1] > pts[best][1] ? i : best), 0);
const toPath = (p: number[][]) => (p.length ? `M ${p.map(([x, y]) => `${x} ${y}`).join(" L ")}` : "");
const LEFT = toPath(pts.slice(0, tip + 1).reverse());
const RIGHT = toPath(pts.slice(tip));
const BRANCH = toPath(crack.branch ?? []);

export function CrackLight({
  draw,
  opacity,
  flash,
}: {
  draw: MotionValue<number>;
  opacity: MotionValue<number>;
  flash: MotionValue<number>;
}) {
  const glowWidth = useTransform(flash, [0, 1], [18, 38]);
  const glowOpacity = useTransform(flash, [0, 1], [0.85, 1]);
  const branchDraw = useTransform(draw, [0.6, 1], [0, 1]);
  const paths = [LEFT, RIGHT];
  return (
    <motion.svg
      viewBox={`0 0 ${SIZE.seal.w} ${SIZE.seal.h}`}
      className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
      style={{ opacity, willChange: "opacity" }}
      aria-hidden
    >
      <defs>
        <filter id="crack-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {paths.map((d, i) => (
        <motion.path
          key={`g${i}`}
          d={d}
          fill="none"
          stroke="rgb(226,239,248)"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#crack-glow)"
          style={{ pathLength: draw, strokeWidth: glowWidth, opacity: glowOpacity }}
        />
      ))}
      {paths.map((d, i) => (
        <motion.path
          key={`c${i}`}
          d={d}
          fill="none"
          stroke="#f4f9fc"
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength: draw }}
        />
      ))}
      {BRANCH && (
        <motion.path
          d={BRANCH}
          fill="none"
          stroke="#eef6fb"
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ pathLength: branchDraw }}
        />
      )}
    </motion.svg>
  );
}

// Light spilling out from under the wax onto the paper. It never covers the
// seal itself (the pool is hollow and the halo is baked with the seal cut
// out), so the wax — and the cap as it lifts away — stays solid.
export function SealBloom({ amount, onLoad }: { amount: MotionValue<number>; onLoad?: () => void }) {
  const scale = useTransform(amount, [0, 1], [0.85, 1]);
  const opacity = useTransform(amount, warm);
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute -inset-[70%]"
        style={{
          opacity,
          scale,
          willChange: "opacity, transform",
          // closest-side: 100% = the pool's radius; the seal's edge sits at ~35%
          background:
            "radial-gradient(circle closest-side at 50% 46%, transparent 30%, rgba(230,242,251,0.85) 36%, rgba(222,237,249,0.5) 48%, rgba(214,232,246,0.2) 66%, transparent 90%)",
        }}
      />
      <motion.div className="absolute inset-0" style={{ opacity, scale, willChange: "opacity, transform" }}>
        <Halo onLoad={onLoad} />
      </motion.div>
    </div>
  );
}

// Chips of wax skipping out from the break and landing on the paper. Their
// lighting is baked, so they only turn a little.
function CrumbSprite({ crumb, index, progress }: { crumb: Crumb; index: number; progress: MotionValue<number> }) {
  const cx = SIZE.seal.w / 2;
  const cy = SIZE.seal.h / 2;
  const dx0 = crumb.x - cx;
  const dy0 = crumb.y - cy;
  const len = Math.hypot(dx0, dy0) || 1;
  // outward from the seal, then down onto the paper
  const reach = 70 + (index % 3) * 34;
  const dx = (dx0 / len) * reach + (index % 2 ? 14 : -12);
  const dy = (dy0 / len) * reach * 0.35 + 60 + index * 14;
  const toPct = (v: number) => (v / SIZE.seal.w) * 100;

  const x = useTransform(progress, [0, 1], ["0%", `${(dx / crumb.w) * 100}%`]);
  const y = useTransform(progress, [0, 0.38, 1], ["0%", `${(-34 / crumb.h) * 100}%`, `${(dy / crumb.h) * 100}%`]);
  const rotate = useTransform(progress, [0, 1], [0, (index % 2 ? 1 : -1) * (14 + index * 4)]);
  const opacity = useTransform(progress, (v) => (v > 0.001 ? 1 : WARM));

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${toPct(crumb.x - crumb.w / 2)}%`,
        top: `${toPct(crumb.y - crumb.h / 2)}%`,
        width: `${toPct(crumb.w)}%`,
        height: `${toPct(crumb.h)}%`,
        x,
        y,
        rotate,
        opacity,
        willChange: "transform, opacity",
        filter: "drop-shadow(1px 2px 1.2px rgba(34,28,24,0.35))",
      }}
    >
      <Image
        src={`/images/opening/${crumb.file}`}
        alt=""
        width={crumb.w}
        height={crumb.h}
        loading="eager"
        draggable={false}
        className="w-full h-full select-none"
      />
    </motion.div>
  );
}

export function SealCrumbs({ progress }: { progress: MotionValue<number> }) {
  if (!crack.crumbs?.length) return null;
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {crack.crumbs.map((c, i) => (
        <CrumbSprite key={c.file} crumb={c} index={i} progress={progress} />
      ))}
    </div>
  );
}
