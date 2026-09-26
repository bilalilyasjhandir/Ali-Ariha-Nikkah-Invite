"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { SectionId } from "@/lib/event";

// One screen of the invitation: a card resting on the linen. It snaps into
// place, and the first time it arrives the card settles down onto the table
// with a slight, hand-laid tilt.
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
        initial={reduce ? { opacity: 0, rotate: tilt } : { opacity: 0, y: 36, rotate: tilt * 2.5, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: reduce ? 0.3 : 0.9, ease: [0.22, 0, 0.1, 1] }}
      >
        {children}
      </motion.div>
    </section>
  );
}
