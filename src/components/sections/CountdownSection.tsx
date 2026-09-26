"use client";

import { AnimatePresence, MotionConfig, motion, useInView } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";
import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FOIL, FoilRule, PRESS } from "../paper/foil";
import { CountdownCalendar } from "./CountdownCalendar";
import { Section } from "./Section";
import { Reveal, RevealItem, ScriptTitle } from "./ui";

const EASE = [0.22, 0, 0.1, 1] as const;

// not in EVENT.copy yet: what the card says once the wait is over
const TODAY = EVENT.copy.countdown.today;
const AFTER = EVENT.copy.countdown.after;

const START = Date.parse(EVENT.startsAt) / 1000;
// The day is on GMT (UTC+0), so its UTC date is Bradford's date.
const day = new Date(EVENT.startsAt);
const DAY_END = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + 1) / 1000;

// A clock that ticks on the second while anything is listening, and is
// silent otherwise.
const listeners = new Set<() => void>();
let second = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const nowSecond = () => Math.floor(Date.now() / 1000);

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    const tick = () => {
      second = nowSecond();
      listeners.forEach((l) => l());
      // re-aligned every tick, so it never drifts off the second boundary
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
    };
    second = nowSecond();
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) clearTimeout(timer);
  };
}
const idle = () => () => {};
const getSecond = () => (listeners.size ? second : (second = nowSecond()));
const getServerSecond = () => null;
// The card only re-renders when the phase changes; the figures every second.
const getPhase = () => {
  const now = getSecond();
  return now < START ? "before" : now < DAY_END ? "today" : "after";
};
const getServerPhase = () => "before" as const;

const UNITS = [
  ["Days", "Day"],
  ["Hours", "Hour"],
  ["Minutes", "Minute"],
  ["Seconds", "Second"],
] as const;

function split(remaining: number) {
  return [
    Math.floor(remaining / 86400),
    Math.floor((remaining % 86400) / 3600),
    Math.floor((remaining % 3600) / 60),
    remaining % 60,
  ];
}

// One figure, in a window cut to the height of the lining figures. Keyed by
// its value, so only a figure that changes rolls: the old one drops out of the
// window as the new one rolls in from above, the way an odometer turns.
const WINDOW = "linear-gradient(to bottom, transparent 0.04em, #000 0.16em, #000 0.86em, transparent 0.98em)";

function Digit({ d }: { d: string }) {
  return (
    <span className="relative block overflow-hidden" style={{ maskImage: WINDOW, WebkitMaskImage: WINDOW }}>
      <span className="invisible">0</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={d}
          className="absolute inset-0 text-center"
          initial={{ y: "-72%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "72%", opacity: 0 }}
          transition={{ duration: 0.65, ease: EASE }}
        >
          {d}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Figures({ value }: { value: number | null }) {
  const text = value === null ? "00" : String(value).padStart(2, "0");
  // keyed from the right, so 100 -> 99 days doesn't reshuffle the tens
  return (
    <span className={`inline-flex ${value === null ? "invisible" : ""}`}>
      {[...text].map((d, i) => (
        <Digit key={text.length - i} d={d} />
      ))}
    </span>
  );
}

const numerals = "font-serif font-normal leading-none text-ink [font-variant-numeric:lining-nums_tabular-nums]";

function Clock({ live }: { live: boolean }) {
  const now = useSyncExternalStore(live ? subscribe : idle, getSecond, getServerSecond);
  const parts = now === null ? null : split(Math.max(0, START - now));
  return (
    <>
      <div
        aria-hidden
        className="mx-auto grid w-[75cqw] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center"
      >
        {UNITS.map(([many], i) => (
          <div key={many} className="contents">
            {i > 0 && (
              <span
                className="mx-[1cqw] size-[1.2cqw] rotate-45 justify-self-center"
                style={{ gridColumn: i * 2, gridRow: 1, background: FOIL }}
              />
            )}
            <span
              className={`${numerals} text-center text-[13.2cqw]`}
              style={{ gridColumn: i * 2 + 1, gridRow: 1, ...PRESS }}
            >
              <Figures value={parts ? parts[i] : null} />
            </span>
            <span
              className="mt-[2.4cqw] whitespace-nowrap text-center font-sans text-[3.4cqw] uppercase tracking-[0.08em] indent-[0.08em] text-ink-mid"
              style={{ gridColumn: i * 2 + 1, gridRow: 2 }}
            >
              {many}
            </span>
          </div>
        ))}
      </div>
      {parts && (
        <p className="sr-only">
          {UNITS.map(([many, one], i) => `${parts[i]} ${parts[i] === 1 ? one : many}`).join(", ")} to go
        </p>
      )}
    </>
  );
}

export function CountdownSection() {
  const ref = useRef<HTMLDivElement>(null);
  // only tick while the card is on screen
  const onScreen = useInView(ref);
  const phase = useSyncExternalStore(onScreen ? subscribe : idle, getPhase, getServerPhase);

  return (
    <Section id="countdown" label="Countdown" tilt={0.8}>
      <Paper blooms={BLOOMS.bottomRight}>
        <MotionConfig reducedMotion="user">
          <div ref={ref} className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center">
            <Reveal className="flex w-full flex-col items-center">
              <RevealItem>
                <ScriptTitle className="[text-wrap:balance]">{EVENT.copy.countdown.title}</ScriptTitle>
              </RevealItem>
              <RevealItem className="mt-[4cqw]">
                <FoilRule width="11cqw" />
              </RevealItem>
              <RevealItem className="mt-[13cqw] w-full">
                {phase === "before" ? (
                  <Clock live={onScreen} />
                ) : (
                  <p className="font-serif italic text-[8cqw] leading-[1.2] text-ink [text-wrap:balance]" style={PRESS}>
                    {phase === "today" ? TODAY : AFTER}
                  </p>
                )}
              </RevealItem>
              <RevealItem className="mt-[14cqw]">
                <p className="font-serif font-medium text-[5.2cqw] leading-[1.35] text-ink" style={PRESS}>
                  {EVENT.date.long}
                </p>
                <p className="mt-[0.6cqw] font-serif italic text-[4.7cqw] leading-[1.35] text-ink-mid">
                  {EVENT.date.time}
                </p>
              </RevealItem>
              {phase === "before" && (
                <RevealItem className="mt-[7cqw]">
                  <CountdownCalendar />
                </RevealItem>
              )}
            </Reveal>
          </div>
        </MotionConfig>
      </Paper>
    </Section>
  );
}
