"use client";

import { MotionConfig, motion, useReducedMotion, type Variants } from "framer-motion";
import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FOIL, PRESS } from "../paper/foil";
import { Section } from "./Section";
import { Reveal, RevealItem, ScriptTitle } from "./ui";

const EASE = [0.22, 0, 0.1, 1] as const;

// The thread runs vertically, so it gets a lengthwise foil gradient of its own.
const FOIL_DOWN = "linear-gradient(180deg, #8c959e, #b9c0c6 24%, #79828b 50%, #a3abb2 76%, #7d868f)";

// A silver thread hangs from the title and draws down the card: it reaches
// each item's node, the node lands, the item rises under it, and the thread
// carries on to the next.
const BASE = 0.45;
const STEP = 0.78;
const DRAW = 0.5;
const at = (i: number) => BASE + i * STEP;

const draw: Variants = {
  hidden: { scaleY: 0 },
  shown: (i: number) => ({ scaleY: 1, transition: { duration: DRAW, ease: [0.45, 0, 0.35, 1], delay: at(i) } }),
};
const land: Variants = {
  hidden: { opacity: 0, scale: 0.2, rotate: 45 },
  shown: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 45,
    transition: { duration: 0.45, ease: EASE, delay: at(i) + DRAW - 0.06 },
  }),
};
const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE, delay: at(i) + DRAW } }),
};

function Timeline() {
  // with reduced motion the schedule is simply printed, not drawn
  const still = useReducedMotion();
  return (
    <motion.ol
      className="flex w-full flex-col items-center"
      initial={still ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.35 }}
    >
      {EVENT.schedule.map((item, i) => (
        <li key={item.title} className="flex w-full flex-col items-center">
          <motion.span
            aria-hidden
            custom={i}
            variants={draw}
            className="mb-[1.5cqw] mt-[2.4cqw] block h-[6.5cqw] w-px origin-top"
            style={{ background: FOIL_DOWN }}
          />
          <motion.span
            aria-hidden
            custom={i}
            variants={land}
            className="block size-[1.5cqw]"
            style={{ background: FOIL }}
          />
          <motion.div custom={i} variants={rise} className="mt-[2.6cqw]">
            <p className="font-serif text-[6.8cqw] leading-[1.1] text-ink" style={PRESS}>
              <span className="[font-variant-numeric:lining-nums_tabular-nums]">{item.time}</span>
              <span className="ml-[1.4cqw] font-sans text-[3.4cqw] uppercase tracking-[0.16em] text-ink-mid">
                {item.period}
              </span>
            </p>
            <h3 className="mt-[0.8cqw] font-serif font-medium text-[5.6cqw] leading-[1.3] text-ink" style={PRESS}>
              {item.title}
            </h3>
            <p className="mt-[0.6cqw] font-serif italic text-[4.6cqw] leading-[1.4] text-ink-mid [text-wrap:balance]">
              {item.detail}
            </p>
          </motion.div>
        </li>
      ))}
    </motion.ol>
  );
}

export function TimelineSection() {
  return (
    <Section id="schedule" label="The day's schedule" tilt={-0.6}>
      <Paper blooms={BLOOMS.topRight}>
        <MotionConfig reducedMotion="user">
          <div className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center">
            <Reveal className="flex flex-col items-center">
              <RevealItem>
                <ScriptTitle className="[text-wrap:balance]">{EVENT.copy.schedule.title}</ScriptTitle>
              </RevealItem>
            </Reveal>
            <div className="mt-[1.5cqw] w-full">
              <Timeline />
            </div>
          </div>
        </MotionConfig>
      </Paper>
    </Section>
  );
}
