"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { EVENT } from "@/lib/event";
import { celebrate } from "../celebration/Celebration";
import { BLOOMS, Paper } from "../paper/Paper";
import { Section } from "./Section";
import { Eyebrow, PaperLink, Reveal, RevealItem, ScriptTitle } from "./ui";
import { VenueMap } from "./VenueMap";
import { VenueWheel } from "./VenueWheel";

const EASE = [0.22, 0, 0.1, 1] as const;

// The venue card with its answer held back: a question stands where the
// venue's name will be, and the map's window holds a paper wheel. Spun, from
// the prompt under the window or by hand, it lands on the couple's monogram
// and lifts away into the map; a silver pin drops onto the venue, and the
// shower blooms from it. Every visit starts with the wheel waiting.
export function VenueSection() {
  const { venue, date, copy } = EVENT;
  const reduce = useReducedMotion();
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const shown = useRef(false);
  const over = useRef(false);

  const start = useCallback(() => setStarted(true), []);
  const reveal = useCallback(() => {
    if (shown.current) return;
    shown.current = true;
    setStarted(true);
    setRevealed(true);
    requestAnimationFrame(() => nameRef.current?.focus({ preventScroll: true }));
  }, []);
  const done = useCallback(
    (x: number, y: number) => {
      reveal();
      if (over.current) return;
      over.current = true;
      if (!reduce) celebrate(x, y);
    },
    [reduce, reveal],
  );
  const swap = (shown: boolean, delay = 0) => ({
    initial: false as const,
    animate: { opacity: shown ? 1 : 0, transform: `translateY(${shown || reduce ? 0 : 6}px)` },
    transition: { duration: reduce ? 0.2 : shown ? 0.8 : 0.35, delay: shown && !reduce ? delay : 0, ease: EASE },
  });

  return (
    <Section id="venue" label="The venue" tilt={0.9}>
      <Paper blooms={BLOOMS.bottomLeft}>
        <Reveal className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center [text-wrap:balance]">
          <RevealItem>
            <Eyebrow>{copy.venue.eyebrow}</Eyebrow>
          </RevealItem>

          {/* the question and the answer share one place */}
          <RevealItem className="mt-[1.5cqw] grid">
            <motion.div className="[grid-area:1/1] flex items-center justify-center" aria-hidden={revealed} {...swap(!revealed)}>
              <ScriptTitle>{copy.venue.question}</ScriptTitle>
            </motion.div>
            <motion.div className="[grid-area:1/1] flex items-center justify-center" aria-hidden={!revealed} {...swap(revealed, 0.15)}>
              <ScriptTitle ref={nameRef} tabIndex={-1} className="outline-none">
                {venue.name}
              </ScriptTitle>
            </motion.div>
          </RevealItem>
          <RevealItem>
            <motion.p
              className="mt-[1.2cqw] font-serif font-medium text-[4.6cqw] leading-[1.35] text-ink/85"
              aria-hidden={!revealed}
              {...swap(revealed, 0.35)}
            >
              {venue.address}
            </motion.p>
          </RevealItem>
          <RevealItem>
            <p className="mt-[3cqw] font-sans text-[3.4cqw] leading-[1.6] tracking-[0.14em] uppercase text-ink-mid">
              <span className="whitespace-nowrap">{date.long}</span>
              <br />
              <span className="whitespace-nowrap">{date.time}</span>
            </p>
          </RevealItem>

          <RevealItem className="mt-[6cqw]">
            <VenueMap revealed={revealed}>
              <VenueWheel go={started} onStart={start} onReveal={reveal} onDone={done} />
            </VenueMap>
          </RevealItem>

          {/* the prompt that sets the wheel going, then the way to the map */}
          <RevealItem className="mt-[6.5cqw] grid min-h-[44px]">
            {!revealed && (
              <motion.button
                type="button"
                onClick={start}
                disabled={started}
                aria-hidden={started || undefined}
                className="[grid-area:1/1] self-center justify-self-center min-h-[44px] px-[4cqw] font-serif italic text-[max(15px,4.5cqw)] text-ink-mid underline decoration-silver decoration-1 underline-offset-[0.28em] rounded-full cursor-pointer hover:text-ink disabled:pointer-events-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/50"
                {...swap(!started)}
              >
                {copy.venue.spin}
              </motion.button>
            )}
            <motion.div className="[grid-area:1/1] self-center justify-self-center" inert={!revealed} {...swap(revealed, 0.5)}>
              <PaperLink href={venue.mapsUrl} target="_blank" rel="noopener">
                {copy.venue.button}
              </PaperLink>
            </motion.div>
          </RevealItem>
        </Reveal>

        <p className="sr-only" aria-live="polite">
          {revealed ? `${venue.name}, ${venue.address}` : ""}
        </p>
      </Paper>
    </Section>
  );
}
