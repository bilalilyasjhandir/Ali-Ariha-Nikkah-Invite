"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { SectionId } from "@/lib/event";

// One screen of the invitation: a card resting on the linen. It snaps into
// place, and the first time it arrives the card settles down onto the table
// with a slight, hand-laid tilt.
//
// The settle is one transform string rather than y/rotate/scale, so the
// browser runs it on the compositor: the card is painted once and glides,
// instead of being repainted (deckle mask, blurred shadows and all) on every
// frame of the scroll it arrives with.
const lay = (y: number, rotate: number, scale: number) => `translateY(${y}px) rotate(${rotate}deg) scale(${scale})`;
export function Section({
  id,
  label,
  tilt = 0,
  width = "var(--card-w)",
  children,
}: {
  id: SectionId;
  label: string;
  tilt?: number;
  width?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <section
      id={id}
      aria-label={label}
      className="relative min-h-dvh snap-start snap-always flex items-center justify-center py-6"
    >
      <motion.div
        className="relative"
        style={{ width }}
        initial={{ opacity: 0, transform: reduce ? lay(0, tilt, 1) : lay(36, tilt * 2.5, 0.97) }}
        whileInView={{ opacity: 1, transform: lay(0, tilt, 1) }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: reduce ? 0.3 : 0.9, ease: [0.22, 0, 0.1, 1] }}
      >
        {children}
      </motion.div>
    </section>
  );
}
