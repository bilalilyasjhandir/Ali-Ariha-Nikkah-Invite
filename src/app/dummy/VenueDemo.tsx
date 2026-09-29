"use client";

import Link from "next/link";
import { useMotionValue } from "framer-motion";
import { useState, useSyncExternalStore } from "react";
import { Celebration } from "@/components/celebration/Celebration";
import { Scene } from "@/components/opening/Scene";
import { Section } from "@/components/sections/Section";
import { VenueCard } from "@/components/sections/VenueCard";
import { VenueCompass } from "@/components/sections/VenueCompass";
import { VenueWheel } from "@/components/sections/VenueWheel";
import { PointerTrail } from "@/components/trail/PointerTrail";

const OPTIONS = {
  wheel: { n: 1, name: "Spinning wheel", Piece: VenueWheel, prompt: "Spin the wheel", other: "compass" },
  compass: { n: 2, name: "Compass & pin", Piece: VenueCompass, prompt: "Tap to find us", other: "wheel" },
} as const;

const PILL =
  "flex min-h-[36px] items-center rounded-full border border-silver/60 bg-paper-card/90 px-3.5 font-sans text-[11px] tracking-[0.14em] uppercase text-ink-mid shadow-[0_1px_4px_rgba(34,28,24,0.15)]";

const noop = () => () => {};

// One option on the real venue card, as a guest would meet it, with a way to
// play it again and to hop to the other option.
export function VenueDemo({ option }: { option: keyof typeof OPTIONS }) {
  const cam = useMotionValue(1);
  const lift = useMotionValue(0);
  const [take, setTake] = useState(0);
  // the card is drawn in the browser only, as the real sections are: its
  // first frame depends on the guest's motion setting, which a server can't know
  const inBrowser = useSyncExternalStore(noop, () => true, () => false);
  const o = OPTIONS[option];
  const other = OPTIONS[o.other];

  return (
    <div className="invite-vars relative">
      <Scene cam={cam} lift={lift} />
      {inBrowser && (
        <div className="relative z-10">
          <Section id="venue" label="The venue" tilt={0.9}>
            <VenueCard key={take} Piece={o.Piece} prompt={o.prompt} />
          </Section>
        </div>
      )}

      <nav
        aria-label="Options"
        className="fixed z-40 inset-x-2 flex flex-wrap items-center justify-center gap-1.5"
        style={{ top: "max(8px, env(safe-area-inset-top))" }}
      >
        <span className={PILL}>
          {o.n} · {o.name}
        </span>
        <button type="button" onClick={() => setTake((t) => t + 1)} className={`${PILL} cursor-pointer text-ink hover:bg-white`}>
          Replay
        </button>
        <Link href={`/dummy/${o.other}`} className={`${PILL} text-ink hover:bg-white`}>
          {other.n} · {other.name} ›
        </Link>
      </nav>

      <Celebration />
      <PointerTrail />
    </div>
  );
}
