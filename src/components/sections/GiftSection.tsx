"use client";

import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FoilRule, PRESS } from "../paper/foil";
import { Section } from "./Section";
import { Reveal, RevealItem } from "./ui";

export function GiftSection() {
  const { eyebrow, body } = EVENT.copy.gift;
  // the first sentence leads in the couple's script; the request follows in roman
  const [lead, ...rest] = body.split(/(?<=[.!?])\s+/);
  return (
    <Section id="gifts" label="A gentle request" tilt={-1.1}>
      <Paper blooms={BLOOMS.bottomRight}>
        <Reveal className="absolute inset-[11cqw] flex flex-col items-center justify-center text-center [text-wrap:balance]">
          <RevealItem>
            <p className="font-sans text-[3.5cqw] tracking-[0.16em] uppercase text-ink-mid">{eyebrow}</p>
          </RevealItem>
          <RevealItem>
            <p className="mt-[4cqw] font-script text-[11cqw] leading-[1.25] text-ink" style={PRESS}>
              {lead.replace(/\.$/, "")}
            </p>
          </RevealItem>
          <RevealItem className="mt-[8cqw]">
            <FoilRule width="11cqw" />
          </RevealItem>
          {rest.length > 0 && (
            <RevealItem>
              <p className="mt-[8cqw] font-serif italic text-[5.4cqw] leading-[1.45] text-ink/85">{rest.join(" ")}</p>
            </RevealItem>
          )}
        </Reveal>
      </Paper>
    </Section>
  );
}
