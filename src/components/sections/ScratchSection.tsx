"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { EVENT } from "@/lib/event";
import { IMG, SIZE } from "../opening/geometry";
import { BLOOMS, Paper } from "../paper/Paper";
import { FOIL, FOIL_EDGE, FoilMonogram, FoilRule, PRESS } from "../paper/foil";
import { ScratchFoil } from "./ScratchFoil";
import { ScratchGlints } from "./ScratchGlints";
import { Section } from "./Section";
import { Body, Eyebrow, Reveal, RevealItem } from "./ui";

const STORAGE_KEY = "ali-ariha:date-revealed";
// not on the draft card, so not in EVENT.copy
const REVEAL_LABEL = EVENT.copy.scratch.reveal;
const EASE = [0.22, 0, 0.1, 1] as const;

// The foil panel and the silver frame printed around it, in cqw.
const PATCH = { w: 72, h: 70, corner: 1.6 };
const GAP = 2.4;
// the monogram in the crown of the arch: embossed on the foil, and printed in
// silver on the card beneath it, so it stays put as the foil comes away
const MONO = { w: 5.2, top: 9.5 };
const MONO_H = (MONO.w * SIZE.monogram.h) / SIZE.monogram.w;
const FRAME = { w: PATCH.w + GAP * 2, h: PATCH.h + GAP * 2, corner: PATCH.corner + GAP };
const PATCH_RADIUS = `${PATCH.w / 2}cqw ${PATCH.w / 2}cqw ${PATCH.corner}cqw ${PATCH.corner}cqw`;

// The server always prints the foil; the client then remembers a guest who
// has already scratched it.
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

function FrameArch() {
  const s = 10;
  const w = FRAME.w * s;
  const h = FRAME.h * s;
  const r = w / 2;
  const rb = FRAME.corner * s;
  const d = `M0 ${h - rb} V${r} A${r} ${r} 0 0 1 ${w} ${r} V${h - rb} Q${w} ${h} ${w - rb} ${h} H${rb} Q0 ${h} 0 ${h - rb} Z`;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${w} ${h}`}
      className="absolute inset-0 size-full overflow-visible"
      style={{ filter: FOIL_EDGE }}
    >
      <defs>
        <linearGradient id="scratch-frame-foil" x1="0" y1="0" x2="1" y2="0.45">
          <stop offset="0" stopColor="#56606a" />
          <stop offset="0.22" stopColor="#8c959e" />
          <stop offset="0.3" stopColor="#c3c9ce" />
          <stop offset="0.4" stopColor="#7a838c" />
          <stop offset="0.6" stopColor="#5d6771" />
          <stop offset="0.78" stopColor="#9aa2aa" />
          <stop offset="1" stopColor="#5a646e" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#scratch-frame-foil)" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// month and year, each set between two foil hairlines
function Flank({ children }: { children: ReactNode }) {
  return (
    <span className="flex w-[18.5cqw] flex-col items-stretch">
      <span aria-hidden className="block h-px" style={{ background: FOIL }} />
      <span className="block py-[1.9cqw] pl-[0.2em] font-sans text-[3.5cqw] leading-none tracking-[0.2em] uppercase text-ink">
        {children}
      </span>
      <span aria-hidden className="block h-px" style={{ background: FOIL }} />
    </span>
  );
}

export function ScratchSection() {
  const { date, copy } = EVENT;
  const reduce = useReducedMotion();
  const stored = useSyncExternalStore(subscribe, readStored, () => false);
  const [revealedNow, setRevealedNow] = useState<null | "scratch" | "button">(null);
  const [foilGone, setFoilGone] = useState(false);
  const [unit, setUnit] = useState(0);
  const patchRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLTimeElement>(null);

  const revealed = stored || revealedNow !== null;
  // storage flips to "revealed" the moment the guest reveals it, so from then
  // on the foil follows its own fade rather than the stored flag
  const showFoil = revealedNow ? !foilGone : !stored;

  const reveal = (via: "scratch" | "button") => {
    if (revealed) return;
    setUnit((patchRef.current?.offsetWidth ?? 0) / PATCH.w);
    setRevealedNow(via);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    if (navigator.userActivation?.hasBeenActive ?? true) navigator.vibrate?.(10);
    if (via === "button") dateRef.current?.focus({ preventScroll: true });
  };

  return (
    <Section id="date" label="Save the date" tilt={-1.2}>
      <Paper blooms={BLOOMS.topLeft}>
        <Reveal className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center">
          <RevealItem>
            <Eyebrow className="tracking-[0.24em]">{copy.scratch.eyebrow}</Eyebrow>
          </RevealItem>

          <RevealItem className="mt-[4.2cqw]">
            <Body className="px-[1cqw] font-medium [text-wrap:pretty]">{copy.invitation}</Body>
          </RevealItem>

          <RevealItem className="mt-[6cqw]">
            <div className="relative" style={{ width: `${FRAME.w}cqw`, height: `${FRAME.h}cqw` }}>
              <FrameArch />
              <div
                ref={patchRef}
                className="absolute"
                style={{ left: `${GAP}cqw`, top: `${GAP}cqw`, width: `${PATCH.w}cqw`, height: `${PATCH.h}cqw` }}
              >
                <div
                  aria-hidden
                  className="absolute"
                  style={{ top: `${MONO.top}cqw`, left: `${(PATCH.w - MONO.w) / 2}cqw`, width: `${MONO.w}cqw` }}
                >
                  <FoilMonogram className="w-full" />
                </div>
                <time
                  ref={dateRef}
                  dateTime={EVENT.startsAt}
                  tabIndex={-1}
                  className="absolute inset-0 flex flex-col items-center outline-none"
                  style={{ paddingTop: `${MONO.top + MONO_H + 5.5}cqw` }}
                >
                  <span className="block font-sans text-[3.6cqw] leading-none tracking-[0.26em] pl-[0.26em] uppercase text-ink-mid">
                    {date.weekday}
                  </span>
                  <span className="mt-[3.2cqw] flex items-center gap-[2.6cqw]">
                    <Flank>{date.month}</Flank>
                    <span
                      className="block font-serif text-[23cqw] leading-[0.8] lining-nums text-ink"
                      style={PRESS}
                    >
                      {date.day}
                    </span>
                    <Flank>{date.year}</Flank>
                  </span>
                  <span className="mt-[4.4cqw] block font-serif italic text-[4.9cqw] leading-none text-ink" style={PRESS}>
                    {date.time}
                  </span>
                </time>

                {showFoil && (
                  <motion.div
                    className="absolute inset-0"
                    initial={false}
                    animate={{ opacity: revealedNow ? 0 : 1 }}
                    transition={{ duration: reduce ? 0.2 : 0.9, ease: EASE }}
                    onAnimationComplete={() => revealedNow && setFoilGone(true)}
                  >
                    <ScratchFoil
                      prompt={copy.scratch.prompt}
                      monogram={IMG.monogram}
                      radius={PATCH_RADIUS}
                      cornerRatio={PATCH.corner / PATCH.w}
                      monoBox={{ top: MONO.top / PATCH.w, height: MONO_H / PATCH.w }}
                      onReveal={() => reveal("scratch")}
                    />
                  </motion.div>
                )}

                {revealedNow && !reduce && unit > 0 && <ScratchGlints unit={unit} />}
              </div>
            </div>
          </RevealItem>

          {/* the quiet way in, for keyboards and anyone who would rather not
              scratch; once the date is out, a foil rule closes the card */}
          <RevealItem className="relative mt-[2.4cqw] flex min-h-[44px] items-center justify-center">
            {(!revealed || (revealedNow && !foilGone)) && (
              <motion.button
                type="button"
                onClick={() => reveal("button")}
                disabled={revealed}
                aria-hidden={revealed || undefined}
                initial={false}
                animate={{ opacity: revealed ? 0 : 1 }}
                transition={{ duration: reduce ? 0.2 : 0.5, ease: EASE }}
                className="min-h-[44px] px-[4cqw] font-serif italic text-[max(15px,4.5cqw)] text-ink-mid underline decoration-silver decoration-1 underline-offset-[0.28em] rounded-full cursor-pointer hover:text-ink disabled:pointer-events-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/50"
              >
                {REVEAL_LABEL}
              </motion.button>
            )}
            {revealed && (
              <motion.div
                aria-hidden
                className="absolute inset-0 flex items-center justify-center"
                initial={revealedNow ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: reduce ? 0.2 : 0.9, delay: reduce ? 0 : 0.6, ease: EASE }}
              >
                <FoilRule width="8cqw" />
              </motion.div>
            )}
          </RevealItem>
        </Reveal>

        <p className="sr-only" aria-live="polite">
          {revealedNow === "scratch" ? `${date.long}, ${date.time}` : ""}
        </p>
      </Paper>
    </Section>
  );
}
