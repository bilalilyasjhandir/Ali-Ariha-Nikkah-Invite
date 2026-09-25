"use client";

import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";
import type { CSSProperties } from "react";
import { IMG, SIZE } from "./geometry";

type Bloom = { w: number; x: number; y: number; r: number; flip?: boolean };

// Three overlapping blossoms per cluster, laid like a stylist would: one hero
// bloom, one turned away, one mostly tucked under the others.
const CLUSTER_A: Bloom[] = [
  { w: 46, x: 58, y: 64, r: 128, flip: true },
  { w: 72, x: 36, y: 38, r: -16 },
  { w: 32, x: 12, y: 74, r: -104 },
];
const CLUSTER_B: Bloom[] = [
  { w: 36, x: 86, y: 30, r: 58 },
  { w: 74, x: 58, y: 58, r: 162 },
  { w: 42, x: 22, y: 30, r: -40, flip: true },
];
const CLUSTER_C: Bloom[] = [
  { w: 40, x: 30, y: 70, r: -70, flip: true },
  { w: 66, x: 60, y: 42, r: 24 },
];

// Graded toward the seal's dusty blue so the table props and the wax belong
// together; the shadow sits on the un-rotated cluster so it always falls away
// from the window.
const CLUSTER_FILTER =
  "saturate(0.8) hue-rotate(9deg) drop-shadow(9px 16px 20px rgba(38,48,58,0.22)) drop-shadow(1px 3px 3px rgba(38,48,58,0.14))";

function Cluster({ blooms, style, className = "" }: { blooms: Bloom[]; style: CSSProperties; className?: string }) {
  return (
    <div
      className={`absolute aspect-square -translate-x-1/2 -translate-y-1/2 ${className}`}
      style={{ width: "var(--cluster)", filter: CLUSTER_FILTER, ...style }}
    >
      {blooms.map((b, i) => (
        <Image
          key={i}
          src={IMG.flower}
          alt=""
          width={SIZE.flower.w}
          height={SIZE.flower.h}
          loading="eager"
          draggable={false}
          className="absolute h-auto select-none"
          style={{
            width: `${b.w}%`,
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: `translate(-50%, -50%) rotate(${b.r}deg)${b.flip ? " scaleX(-1)" : ""}`,
          }}
        />
      ))}
    </div>
  );
}

// `cam`/`lift` are the shared camera: the blossoms move exactly with the
// envelope. The linen itself stays still; its weave is too fine to read the
// motion, and a static layer can never expose the page edge.
export function Scene({ cam, lift }: { cam: MotionValue<number>; lift: MotionValue<number> }) {
  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${IMG.backdrop})`,
          backgroundSize: "512px 512px",
          backgroundRepeat: "repeat",
        }}
      />
      {/* window light from the upper-left, falling off toward the far corner */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(120% 95% at 6% 0%, rgba(255,253,248,0.46) 0%, rgba(255,253,248,0.14) 45%, transparent 72%)",
            "radial-gradient(95% 80% at 100% 100%, rgba(26,36,46,0.26) 0%, rgba(26,36,46,0.08) 45%, transparent 72%)",
            "radial-gradient(ellipse 80% 75% at 50% 46%, transparent 58%, rgba(24,32,40,0.12) 100%)",
          ].join(", "),
        }}
      />

      <motion.div className="absolute inset-0" style={{ scale: cam, y: lift, willChange: "transform" }}>
        <Cluster blooms={CLUSTER_A} style={{ left: "calc(50% - var(--ew) * 0.5 - var(--side))", top: "13svh" }} />
        <Cluster blooms={CLUSTER_B} style={{ left: "calc(50% + var(--ew) * 0.5 + var(--side))", top: "88svh" }} />
        {/* above the frame at rest; drifts into the top corner as the camera follows
            the card up. Not on phones, where the card fills the width and this
            would pile up against its own printed corner bloom. */}
        <Cluster
          className="hidden md:block"
          blooms={CLUSTER_C}
          style={{ left: "calc(50% + var(--ew) * 0.5 + var(--side))", top: "calc(11.5svh - var(--eh) * 0.483)" }}
        />
      </motion.div>
    </div>
  );
}
