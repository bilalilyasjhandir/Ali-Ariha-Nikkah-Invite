"use client";

import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FoilRule, PRESS } from "../paper/foil";
import { Section } from "./Section";
import { Reveal, RevealItem } from "./ui";

// A smaller card for rhythm. Its type is set a size up in cqw so it prints at
// the same physical size as the full-width cards.
export function GiftSection() {
  const { eyebrow, body } = EVENT.copy.gift;
  // the first sentence leads in the couple's script; the request follows in roman
  const [lead, ...rest] = body.split(/(?<=[.!?])\s+/);
  return (
    <Section id="gifts" label="A gentle request" tilt={-1.1} width="calc(var(--card-w) * 0.86)">
      <Paper blooms={BLOOMS.bottomRight}>
        <Reveal className="absolute inset-[10cqw] flex flex-col items-center justify-center text-center [text-wrap:balance]">
          <RevealItem>
            <p className="font-sans text-[4.1cqw] tracking-[0.16em] uppercase text-ink-mid">{eyebrow}</p>
          </RevealItem>
          <RevealItem>
            <p className="mt-[3.5cqw] font-script text-[9.6cqw] leading-[1.25] text-ink" style={PRESS}>
              {lead.replace(/\.$/, "")}
            </p>
          </RevealItem>
          <RevealItem className="mt-[7cqw]">
            <FoilRule width="11cqw" />
          </RevealItem>
          {rest.length > 0 && (
            <RevealItem>
              <p className="mt-[7cqw] font-serif italic text-[6cqw] leading-[1.45] text-ink/85">{rest.join(" ")}</p>
            </RevealItem>
          )}
        </Reveal>
      </Paper>
    </Section>
  );
}
