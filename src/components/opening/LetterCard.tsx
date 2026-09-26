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
        <p className="font-arabic text-[6.4cqw] leading-[1.5] text-ink" style={PRESS}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="mt-[0.6cqw] font-arabic text-[5.2cqw] leading-[1.5] text-ink" style={PRESS}>
          وَخَلَقْنَاكُمْ أَزْوَاجًا
        </p>
        <p className="mt-[0.8cqw] font-sans text-[3.5cqw] tracking-[0.14em] uppercase text-ink-mid">
          And We created you in pairs
        </p>

        <div className="my-[5cqw]">
          <FoilRule />
        </div>

        <p className="font-sans text-[3.5cqw] tracking-[0.14em] uppercase text-ink-mid">Together with their families</p>

        <p className="mt-[3.5cqw] font-script text-[11.5cqw] leading-[1.2] text-ink" style={PRESS}>
          {groom.name}
        </p>
        <p className="font-serif font-medium text-[4.6cqw] leading-[1.35] text-ink/85">{groom.parents}</p>

        <div className="my-[2.2cqw]">
          <FoilAmpersand />
        </div>

        <p className="font-script text-[11.5cqw] leading-[1.2] text-ink" style={PRESS}>
          {bride.name}
        </p>
        <p className="font-serif font-medium text-[4.6cqw] leading-[1.35] text-ink/85">{bride.parents}</p>

        <p className="mt-[5.5cqw] font-serif italic text-[4.7cqw] leading-[1.35] text-ink" style={PRESS}>
          joyfully invite you
          <br />
          to celebrate their Nikkah
        </p>

        <div className="mt-[5.5cqw]">
          <FoilMonogram />
        </div>
      </div>
    </Paper>
  );
}
