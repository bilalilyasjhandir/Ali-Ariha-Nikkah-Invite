"use client";

import { useReducedMotion } from "framer-motion";
import type { MouseEvent } from "react";
import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FoilAmpersand, FoilMonogram, PRESS } from "../paper/foil";
import { Section } from "./Section";
import { Reveal, RevealItem } from "./ui";

// The last page: a short letter, signed by the couple and sealed with their
// monogram. Its blossoms mirror the invitation's, so the suite closes as it
// opened.
export function ClosingSection() {
  const { groom, bride, date, copy } = EVENT;
  const reduce = useReducedMotion();

  const backToStart = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("invitation")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <Section id="closing" label="With gratitude" tilt={-0.4}>
      <Paper blooms={BLOOMS.diagonal}>
        <Reveal className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center [text-wrap:balance]">
          <RevealItem>
            <p className="px-[2cqw] font-serif font-medium text-[4.6cqw] leading-[1.5] text-ink/85">{copy.closing.body}</p>
          </RevealItem>
          <RevealItem>
            <p className="mt-[6cqw] font-script text-[8.2cqw] leading-[1.25] text-ink" style={PRESS}>
              {copy.closing.signoff}
            </p>
          </RevealItem>

          <RevealItem className="mt-[7cqw] flex items-center justify-center gap-[3cqw]">
            <span className="font-script text-[12.5cqw] leading-[1.2] text-ink" style={PRESS}>
              {groom.short}
            </span>
            <FoilAmpersand className="text-[9.5cqw] translate-y-[0.4cqw]" />
            <span className="font-script text-[12.5cqw] leading-[1.2] text-ink" style={PRESS}>
              {bride.short}
            </span>
          </RevealItem>
          <RevealItem className="mt-[4cqw]">
            <FoilMonogram className="w-[8cqw]" />
          </RevealItem>
          <RevealItem>
            <p className="mt-[3.5cqw] font-sans text-[3.5cqw] tracking-[0.14em] uppercase text-ink-mid">{date.long}</p>
          </RevealItem>

          <RevealItem className="mt-[6cqw]">
            <a
              href="#invitation"
              onClick={backToStart}
              className="inline-flex min-h-[44px] items-center px-[3cqw] font-sans text-[max(12px,3.4cqw)] tracking-[0.16em] uppercase text-ink-mid underline decoration-silver/55 decoration-1 underline-offset-[1.6cqw] transition-colors hover:text-ink hover:decoration-ink/40"
            >
              {EVENT.copy.closing.again}
            </a>
          </RevealItem>
        </Reveal>
      </Paper>
    </Section>
  );
}
