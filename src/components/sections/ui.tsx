"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
import { PRESS } from "../paper/foil";

// Shared type and motion for every section card, so they read as one suite.
// All sizes are in cqw (1cqw = 1% of the card's width).

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-sans text-[3.5cqw] tracking-[0.16em] uppercase text-ink-mid ${className}`}>{children}</p>
  );
}

// the couple's copperplate, for section titles
export function ScriptTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-script text-[10.5cqw] leading-[1.2] text-ink ${className}`} style={PRESS}>
      {children}
    </h2>
  );
}

export function Body({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-serif text-[4.6cqw] leading-[1.45] text-ink/85 ${className}`}>{children}</p>;
}

// A letterpressed pill: ink on cotton with a hairline silver rule. At least
// 44px tall whatever the card size, so it is always an easy tap.
export function PaperButton({ className = "", children, ...rest }: ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-[2cqw] min-h-[44px] px-[6cqw] py-[2.2cqw] rounded-full border border-silver/70 bg-paper-card/60 font-sans text-[max(12px,3.4cqw)] tracking-[0.16em] uppercase text-ink transition-colors hover:bg-white/70 active:bg-white/90 disabled:opacity-50 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60 ${className}`}
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(40,34,28,0.12)" }}
    >
      {children}
    </button>
  );
}

export function PaperLink({ className = "", children, ...rest }: ComponentProps<"a">) {
  return (
    <a
      {...rest}
      className={`inline-flex items-center justify-center gap-[2cqw] min-h-[44px] px-[6cqw] py-[2.2cqw] rounded-full border border-silver/70 bg-paper-card/60 font-sans text-[max(12px,3.4cqw)] tracking-[0.16em] uppercase text-ink transition-colors hover:bg-white/70 active:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink/60 ${className}`}
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 1px 2px rgba(40,34,28,0.12)" }}
    >
      {children}
    </a>
  );
}

// Content rises in, line by line, the first time a card settles into view.
const group: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 0, 0.1, 1] } },
};
const itemStill: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.3 } },
};

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={group} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.4 }}>
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? itemStill : item}>
      {children}
    </motion.div>
  );
}
