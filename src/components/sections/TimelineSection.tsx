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
// carries on to the next. All transform strings, so it runs on the compositor.
// Five stops share one card, so each thread is short and the step brisk.
const BASE = 0.45;
const STEP = 0.56;
const DRAW = 0.36;
const at = (i: number) => BASE + i * STEP;

const draw: Variants = {
  hidden: { transform: "scaleY(0)" },
  shown: (i: number) => ({ transform: "scaleY(1)", transition: { duration: DRAW, ease: [0.45, 0, 0.35, 1], delay: at(i) } }),
};
const land: Variants = {
  hidden: { opacity: 0, transform: "rotate(45deg) scale(0.2)" },
  shown: (i: number) => ({
    opacity: 1,
    transform: "rotate(45deg) scale(1)",
    transition: { duration: 0.45, ease: EASE, delay: at(i) + DRAW - 0.06 },
  }),
};
const rise: Variants = {
  hidden: { opacity: 0, transform: "translateY(10px)" },
  shown: (i: number) => ({ opacity: 1, transform: "translateY(0px)", transition: { duration: 0.75, ease: EASE, delay: at(i) + DRAW } }),
};

function Timeline() {
  // with reduced motion the schedule is simply printed, not drawn
  const still = useReducedMotion();
  return (
    <motion.ol
      className="flex w-full flex-col items-center"
      initial={still ? "shown" : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.35 }}
    >
      {EVENT.schedule.map((item, i) => (
        <li key={item.title} className="flex w-full flex-col items-center">
          <motion.span
            aria-hidden
            custom={i}
            variants={draw}
            className="mb-[1.1cqw] mt-[1.4cqw] block h-[3.4cqw] w-px origin-top"
            style={{ background: FOIL_DOWN }}
          />
          <motion.span
            aria-hidden
            custom={i}
            variants={land}
            className="block size-[1.5cqw]"
            style={{ background: FOIL }}
          />
          <motion.div custom={i} variants={rise} className="mt-[1.6cqw]">
            <p className="font-serif text-[5.9cqw] leading-[1.1] text-ink" style={PRESS}>
              <span className="[font-variant-numeric:lining-nums_tabular-nums]">{item.time}</span>
              <span className="ml-[1.3cqw] font-sans text-[3.1cqw] uppercase tracking-[0.16em] text-ink-mid">
                {item.period}
              </span>
            </p>
            <h3 className="mt-[0.3cqw] font-serif font-medium text-[5cqw] leading-[1.25] text-ink" style={PRESS}>
              {item.title}
            </h3>
            <p className="mt-[0.2cqw] font-serif italic text-[4.1cqw] leading-[1.35] text-ink-mid [text-wrap:balance]">
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
      <Paper blooms={BLOOMS.topRightTucked}>
        <MotionConfig reducedMotion="user">
          <div className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center">
            <Reveal className="flex flex-col items-center">
              <RevealItem>
                <ScriptTitle className="[text-wrap:balance]">{EVENT.copy.schedule.title}</ScriptTitle>
              </RevealItem>
            </Reveal>
            <div className="mt-[0.8cqw] w-full">
              <Timeline />
            </div>
          </div>
        </MotionConfig>
      </Paper>
    </Section>
  );
}
