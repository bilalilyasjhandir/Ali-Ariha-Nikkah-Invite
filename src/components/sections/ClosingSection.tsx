"use client";

import { useReducedMotion } from "framer-motion";
import type { MouseEvent } from "react";
import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FoilMonogram, FoilRule, PRESS } from "../paper/foil";
import { Section } from "./Section";
import { Reveal, RevealItem } from "./ui";

// The last page: a short letter, signed off and sealed with the couple's
// monogram (their names already lead the first page). Its blossoms mirror the
// invitation's, so the suite closes as it opened.
export function ClosingSection() {
  const { date, copy } = EVENT;
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
            <p className="mt-[6.5cqw] font-script text-[10cqw] leading-[1.25] text-ink" style={PRESS}>
              {copy.closing.signoff}
            </p>
          </RevealItem>

          <RevealItem className="mt-[6cqw]">
            <FoilRule width="9cqw" />
          </RevealItem>
          <RevealItem className="mt-[7cqw]">
            <FoilMonogram className="w-[11cqw]" />
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
