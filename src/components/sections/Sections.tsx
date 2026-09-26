"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SECTION_IDS, type SectionId } from "@/lib/event";
import { LetterCard } from "../opening/LetterCard";
import { ClosingSection } from "./ClosingSection";
import { CountdownSection } from "./CountdownSection";
import { GiftSection } from "./GiftSection";
import { RsvpSection } from "./RsvpSection";
import { ScratchSection } from "./ScratchSection";
import { TimelineSection } from "./TimelineSection";
import { VenueSection } from "./VenueSection";

const LABELS: Record<SectionId, string> = {
  invitation: "Invitation",
  date: "Save the date",
  countdown: "Countdown",
  schedule: "The day's schedule",
  venue: "Venue",
  gifts: "A gentle request",
  rsvp: "RSVP",
  closing: "With gratitude",
};

// Where the section dots sit: a thin column at the right edge, only where
// there is room beside the cards (on a phone the cards fill the width).
function SectionDots({ active, onPick }: { active: number; onPick: (i: number) => void }) {
  return (
    <nav aria-label="Sections" className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-20 flex-col gap-3.5">
      {SECTION_IDS.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(i)}
          aria-label={LABELS[id]}
          aria-current={i === active ? "true" : undefined}
          className="group relative flex items-center justify-center size-4 cursor-pointer"
        >
          <span
            className={`block rounded-full transition-all duration-500 ${
              i === active ? "size-2 bg-ink/70" : "size-1.5 bg-ink/25 group-hover:bg-ink/45"
            }`}
          />
          <span className="pointer-events-none absolute right-6 whitespace-nowrap font-sans text-[11px] tracking-[0.16em] uppercase text-ink/70 opacity-0 transition-opacity group-hover:opacity-100">
            {LABELS[id]}
          </span>
        </button>
      ))}
    </nav>
  );
}

// "There's more below" — shown under the first card until the guest scrolls.
function ScrollCue({ visible }: { visible: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[max(0.6svh,4px)] flex flex-col items-center gap-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: visible ? 1.2 : 0.4, delay: visible ? 1.4 : 0 }}
    >
      <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-ink/70">Scroll</span>
      <span className="block h-4 w-px bg-ink/40 origin-top animate-[scroll-cue_2s_ease-in-out_infinite]" />
    </motion.div>
  );
}

export function Sections({ startAt }: { startAt?: SectionId }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll({ container: scroller });

  useMotionValueEvent(scrollY, "change", (y) => {
    const h = scroller.current?.clientHeight || 1;
    const i = Math.min(SECTION_IDS.length - 1, Math.max(0, Math.round(y / h)));
    setActive((prev) => (prev === i ? prev : i));
    if (y > 8) setScrolled(true);
  });

  useEffect(() => {
    if (startAt && startAt !== "invitation") document.getElementById(startAt)?.scrollIntoView();
  }, [startAt]);

  // Touch swipes and the keyboard snap one section at a time natively. A mouse
  // wheel tick or a light trackpad flick doesn't travel far enough and snaps
  // back to the same card, so each wheel gesture becomes exactly one step. A
  // gesture ends after a short quiet gap, which also swallows trackpad inertia.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let lastEvent = 0;
    let lockedUntil = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const target = e.target as HTMLElement;
      if (target.closest("textarea, [data-native-wheel]")) return;
      e.preventDefault();
      const now = performance.now();
      const newGesture = now - lastEvent > 200;
      lastEvent = now;
      if (!newGesture || now < lockedUntil || Math.abs(e.deltaY) < 2) return;
      const sections = [...el.querySelectorAll<HTMLElement>(":scope > section")];
      const current = sections.reduce(
        (best, s, i) => (Math.abs(s.offsetTop - el.scrollTop) < Math.abs(sections[best].offsetTop - el.scrollTop) ? i : best),
        0,
      );
      const next = Math.min(sections.length - 1, Math.max(0, current + Math.sign(e.deltaY)));
      if (next === current) return;
      lockedUntil = now + 700;
      el.scrollTo({ top: sections[next].offsetTop, behavior: "smooth" });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const pick = (i: number) => document.getElementById(SECTION_IDS[i])?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <div
        ref={scroller}
        className="fixed inset-0 z-10 overflow-y-auto overflow-x-hidden overscroll-none snap-y snap-mandatory no-scrollbar"
      >
        {/* same size and position as the card at the end of the opening, so the
            swap is invisible: centred when it fits, otherwise top-anchored */}
        <section
          id="invitation"
          aria-label={LABELS.invitation}
          className="relative min-h-dvh snap-start snap-always flex items-center justify-center py-6"
        >
          <div style={{ width: "var(--card-w)" }}>
            <LetterCard />
          </div>
          <ScrollCue visible={!scrolled} />
        </section>
        <ScratchSection />
        <CountdownSection />
        <TimelineSection />
        <VenueSection />
        <GiftSection />
        <RsvpSection />
        <ClosingSection />
      </div>
      <SectionDots active={active} onPick={pick} />
    </>
  );
}
