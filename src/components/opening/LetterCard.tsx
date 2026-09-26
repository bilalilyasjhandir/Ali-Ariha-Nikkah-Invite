"use client";

import type { MotionValue } from "framer-motion";
import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FoilAmpersand, FoilMonogram, FoilRule, PRESS } from "../paper/foil";

// The invitation card itself: the one that rises out of the envelope.
export function LetterCard({ lift, onPaperLoad }: { lift?: MotionValue<number>; onPaperLoad?: () => void }) {
  const { groom, bride } = EVENT;
  return (
    <Paper blooms={BLOOMS.invitation} lift={lift} onPaperLoad={onPaperLoad}>
      {/* Nothing above the Bismillah; the monogram signs off at the foot. Each
          parent line sits under its own name. */}
      <div className="absolute inset-[7.8cqw] flex flex-col items-center justify-center text-center px-[1.5cqw] [text-wrap:balance]">
        {/* a quiet opening line, so the names carry the card */}
        <p className="font-arabic text-[5.6cqw] leading-[1.5] text-ink" style={PRESS}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="mt-[0.2cqw] font-arabic text-[4.4cqw] leading-[1.5] text-ink-mid">وَخَلَقْنَاكُمْ أَزْوَاجًا</p>
        <p className="mt-[0.6cqw] font-sans text-[2.7cqw] tracking-[0.2em] uppercase text-ink-mid">
          And We created you in pairs
        </p>

        <div className="my-[4.5cqw]">
          <FoilRule width="10cqw" />
        </div>

        <p className="font-sans text-[2.7cqw] tracking-[0.2em] uppercase text-ink-mid">Together with their families</p>

        <p className="mt-[4.5cqw] font-script text-[13.2cqw] leading-[1.15] text-ink" style={PRESS}>
          {groom.name}
        </p>
        <p className="mt-[0.4cqw] font-serif text-[4.2cqw] leading-[1.35] text-ink-mid">{groom.parents}</p>

        <div className="my-[2.6cqw]">
          <FoilAmpersand className="text-[9.5cqw]" />
        </div>

        <p className="font-script text-[13.2cqw] leading-[1.15] text-ink" style={PRESS}>
          {bride.name}
        </p>
        <p className="mt-[0.4cqw] font-serif text-[4.2cqw] leading-[1.35] text-ink-mid">{bride.parents}</p>

        <p className="mt-[6cqw] font-serif italic text-[4.4cqw] leading-[1.4] text-ink" style={PRESS}>
          joyfully invite you
          <br />
          to celebrate their Nikkah
        </p>

        <div className="mt-[5cqw]">
          <FoilMonogram className="w-[6.5cqw]" />
        </div>
      </div>
    </Paper>
  );
}
