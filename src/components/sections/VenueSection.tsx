"use client";

import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { Section } from "./Section";
import { Eyebrow, PaperLink, Reveal, RevealItem, ScriptTitle } from "./ui";
import { VenueMap } from "./VenueMap";

export function VenueSection() {
  const { venue, date, copy } = EVENT;
  return (
    <Section id="venue" label="The venue" tilt={0.9}>
      <Paper blooms={BLOOMS.bottomLeft}>
        <Reveal className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center [text-wrap:balance]">
          <RevealItem>
            <Eyebrow>{copy.venue.eyebrow}</Eyebrow>
          </RevealItem>
          <RevealItem>
            <ScriptTitle className="mt-[1.5cqw]">{venue.name}</ScriptTitle>
          </RevealItem>
          <RevealItem>
            <p className="mt-[1.2cqw] font-serif font-medium text-[4.6cqw] leading-[1.35] text-ink/85">{venue.address}</p>
          </RevealItem>
          <RevealItem>
            <p className="mt-[3cqw] font-sans text-[3.4cqw] leading-[1.6] tracking-[0.14em] uppercase text-ink-mid">
              <span className="whitespace-nowrap">{date.long}</span>
              <br />
              <span className="whitespace-nowrap">{date.time}</span>
            </p>
          </RevealItem>
          <RevealItem className="mt-[6cqw]">
            <VenueMap />
          </RevealItem>
          <RevealItem className="mt-[6.5cqw]">
            <PaperLink href={venue.mapsUrl} target="_blank" rel="noopener">
              {copy.venue.button}
            </PaperLink>
          </RevealItem>
        </Reveal>
      </Paper>
    </Section>
  );
}
