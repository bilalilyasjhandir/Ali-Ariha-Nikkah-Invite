"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import { IMG, SIZE } from "../opening/geometry";
import { maskOf } from "./foil";

// Printed watercolour placements, in card widths (cqw). Negative offsets bleed
// the blossom off the deckle, the way a print that runs to the edge would.
type Bloom = { w: number; side: "left" | "right"; x: number; end: "top" | "bottom"; y: number; rotate: number };

export const BLOOMS = {
  invitation: [
    { w: 31, side: "right", x: -10, end: "top", y: -9, rotate: 14 },
    { w: 38, side: "left", x: -10, end: "bottom", y: -9, rotate: -152 },
  ],
  topLeft: [{ w: 34, side: "left", x: -11, end: "top", y: -10, rotate: -24 }],
  topRight: [{ w: 33, side: "right", x: -11, end: "top", y: -10, rotate: 22 }],
  bottomLeft: [{ w: 36, side: "left", x: -11, end: "bottom", y: -10, rotate: -148 }],
  bottomRight: [{ w: 36, side: "right", x: -11, end: "bottom", y: -10, rotate: 150 }],
  diagonal: [
    { w: 28, side: "left", x: -9, end: "top", y: -8, rotate: -30 },
    { w: 34, side: "right", x: -11, end: "bottom", y: -10, rotate: 146 },
  ],
  none: [],
} satisfies Record<string, Bloom[]>;

// A soft shadow cut to the deckle edge. The blur sits on a wrapper so it
// softens the masked shape instead of being clipped by it. Static filters only.
function PaperShadow({
  x,
  y,
  blur,
  alpha,
  opacity,
}: {
  x: string;
  y: string;
  blur: string;
  alpha: number;
  opacity?: MotionValue<number>;
}) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      style={{ opacity, transform: `translate(${x}, ${y})`, filter: `blur(${blur})`, willChange: "opacity" }}
    >
      <div className="absolute inset-0" style={{ background: `rgba(30,38,46,${alpha})`, ...maskOf(IMG.cardMask, "100% 100%") }} />
    </motion.div>
  );
}

// The heavy deckle-edged cotton card every section is printed on. Children
// are laid out in cqw (1cqw = 1% of the card's width), so everything scales
// with the card. The deboss line sits 7.8cqw in from every edge; keep content
// inside it.
export function Paper({
  children,
  blooms = BLOOMS.none,
  lift,
  onPaperLoad,
  className = "",
}: {
  children?: ReactNode;
  blooms?: readonly Bloom[];
  // 1 = held above the table (soft, far shadow), 0 = resting on it
  lift?: MotionValue<number>;
  onPaperLoad?: () => void;
  className?: string;
}) {
  // Never quite 0: the browser skips rasterising invisible layers, and a blur
  // this size rastered for the first time mid-animation stalls the frame.
  const resting = useTransform(() => (lift ? Math.max(0.02, 1 - lift.get()) : 1));
  const lifted = useTransform(() => (lift ? Math.max(0.02, lift.get()) : 0));
  return (
    <div
      className={`relative w-full ${className}`}
      style={{ aspectRatio: `${SIZE.card.w} / ${SIZE.card.h}`, containerType: "inline-size" }}
    >
      {lift && <PaperShadow x="1.8cqw" y="5cqw" blur="5.5cqw" alpha={0.28} opacity={lifted} />}
      <PaperShadow x="0.7cqw" y="1.6cqw" blur="2.2cqw" alpha={0.26} opacity={resting} />
      <PaperShadow x="0.2cqw" y="0.45cqw" blur="0.5cqw" alpha={0.2} opacity={resting} />

      <div className="absolute inset-0 overflow-hidden" style={maskOf(IMG.cardMask, "100% 100%")}>
        <Image
          src={IMG.card}
          alt=""
          fill
          loading="eager"
          onLoad={onPaperLoad}
          draggable={false}
          className="select-none"
        />
        {blooms.map((b, i) => (
          <Image
            key={i}
            src={IMG.flower}
            alt=""
            width={SIZE.flower.w}
            height={SIZE.flower.h}
            loading="eager"
            draggable={false}
            className="absolute h-auto opacity-95 select-none pointer-events-none"
            style={{
              width: `${b.w}cqw`,
              [b.side]: `${b.x}cqw`,
              [b.end]: `${b.y}cqw`,
              rotate: `${b.rotate}deg`,
            }}
          />
        ))}
        {children}
      </div>
    </div>
  );
}
