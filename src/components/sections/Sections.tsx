"use client";

import { motion, useMotionValueEvent, useScroll, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, type RefObject } from "react";
import { SECTION_IDS, type SectionId } from "@/lib/event";
import { LetterCard } from "../opening/LetterCard";
import { ClosingSection } from "./ClosingSection";
import { CountdownSection } from "./CountdownSection";
import { GiftSection } from "./GiftSection";
import { RsvpSection } from "./RsvpSection";
import { ScratchSection } from "./ScratchSection";
import { TimelineSection } from "./TimelineSection";
import { VenueSection } from "./VenueSection";

// the section whose top is closest to the scroll position (cards can be
// taller than a short window, so this isn't just scrollTop / height)
const sectionsOf = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>(":scope > section")];
function nearest(el: HTMLElement) {
  const sections = sectionsOf(el);
  return sections.reduce(
    (best, s, i) => (Math.abs(s.offsetTop - el.scrollTop) < Math.abs(sections[best].offsetTop - el.scrollTop) ? i : best),
    0,
  );
}

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
// there is room beside the cards (on a phone the cards fill the width). The
// dots follow the scroll themselves, so a scroll re-renders them and nothing
// else.
function SectionDots({
  scroller,
  scrollY,
  onPick,
}: {
  scroller: RefObject<HTMLDivElement | null>;
  scrollY: MotionValue<number>;
  onPick: (i: number) => void;
}) {
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollY, "change", () => {
    if (scroller.current) setActive(nearest(scroller.current));
  });
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
            className={`block size-2 rounded-full transition-[scale,background-color] duration-500 ${
              i === active ? "bg-ink/70" : "scale-75 bg-ink/25 group-hover:bg-ink/45"
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
function ScrollCue({ scrollY }: { scrollY: MotionValue<number> }) {
  const [visible, setVisible] = useState(true);
  useMotionValueEvent(scrollY, "change", (y) => {
    if (y > 8) setVisible(false);
  });
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
  const { scrollY } = useScroll({ container: scroller });

  useEffect(() => {
    if (startAt && startAt !== "invitation") document.getElementById(startAt)?.scrollIntoView();
  }, [startAt]);

  // Foil shimmer is a repainting background animation, so it only runs on a
  // card that is on screen, and holds still while the page is moving.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const seen = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting);
      },
      // a card merely touching the screen's edge doesn't count as on screen
      { root: el, rootMargin: "-1px 0px" },
    );
    for (const s of el.querySelectorAll(":scope > section")) seen.observe(s);
    let moving = false;
    let still = 0;
    const onScroll = () => {
      if (!moving) {
        moving = true;
        el.setAttribute("data-scrolling", "");
      }
      clearTimeout(still);
      still = window.setTimeout(() => {
        moving = false;
        el.removeAttribute("data-scrolling");
      }, 160);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      seen.disconnect();
      el.removeEventListener("scroll", onScroll);
      clearTimeout(still);
    };
  }, []);

  // Touch swipes and the keyboard snap one section at a time natively. A mouse
  // wheel tick or a light trackpad flick doesn't travel far enough and snaps
  // back to the same card, so each wheel gesture becomes exactly one step.
  // A gesture ends after a short quiet gap (timed by when the input happened,
  // so a busy moment can't split one swipe in two), which also swallows
  // trackpad inertia. A fresh swipe during that inertia shows up as a surge
  // once the momentum has died down, or as a change of direction. A gesture
  // that arrives mid-glide carries on from where the glide is heading.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let lastEvent = -Infinity;
    let lastStep = -Infinity;
    let pace = 0;
    let peak = 0;
    let sign = 0;
    let heading: number | null = null;
    let settle = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const target = e.target as HTMLElement;
      if (target.closest("textarea, [data-native-wheel]")) return;
      e.preventDefault();
      const now = e.timeStamp || performance.now();
      const mag = Math.abs(e.deltaY);
      const dir = Math.sign(e.deltaY);
      const quiet = now - lastEvent > 200;
      const turned = mag > 4 && dir !== sign;
      const surge = mag > 30 && mag > pace * 2.5 && pace < peak * 0.5 && now - lastStep > 300;
      pace = quiet ? mag : pace * 0.6 + mag * 0.4;
      peak = quiet ? mag : Math.max(peak, mag);
      lastEvent = now;
      if (mag > 4) sign = dir;
      if (!(quiet || surge || turned) || mag < 2) return;
      const sections = sectionsOf(el);
      const from = heading ?? nearest(el);
      const next = Math.min(sections.length - 1, Math.max(0, from + dir));
      lastStep = now;
      peak = mag;
      if (next === from) return;
      heading = next;
      el.scrollTo({ top: sections[next].offsetTop, behavior: "smooth" });
    };
    // once the glide has come to rest, the next gesture starts from where it is
    const onScroll = () => {
      clearTimeout(settle);
      settle = window.setTimeout(() => (heading = null), 180);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", onScroll);
      clearTimeout(settle);
    };
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
          <ScrollCue scrollY={scrollY} />
        </section>
        <ScratchSection />
        <CountdownSection />
        <TimelineSection />
        <VenueSection />
        <GiftSection />
        <RsvpSection />
        <ClosingSection />
      </div>
      <SectionDots scroller={scroller} scrollY={scrollY} onPick={pick} />
    </>
  );
}
