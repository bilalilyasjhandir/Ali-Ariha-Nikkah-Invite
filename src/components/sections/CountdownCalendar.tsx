"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EVENT } from "@/lib/event";
import { FOIL } from "../paper/foil";
import { PaperButton } from "./ui";

const EASE = [0.22, 0, 0.1, 1] as const;

const TITLE = `The Nikkah of ${EVENT.groom.short} & ${EVENT.bride.short}`;
const LOCATION = `${EVENT.venue.name}, ${EVENT.venue.address}`;
const DETAILS = EVENT.schedule.map((s) => `${s.time} ${s.period} - ${s.title}`).join("\n");

// 2026-10-28T12:00:00Z -> 20261028T120000Z
const stamp = (t: string | number) =>
  new Date(t)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

const GOOGLE_URL =
  "https://calendar.google.com/calendar/render?" +
  new URLSearchParams({ action: "TEMPLATE", text: TITLE, details: DETAILS, location: LOCATION }) +
  `&dates=${stamp(EVENT.startsAt)}/${stamp(EVENT.endsAt)}`;

const escapeIcs = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
// RFC 5545: content lines longer than 75 octets are folded onto a leading space
const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");

function buildIcs() {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ali & Ariha//Nikkah Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // stable, so adding it twice updates the event instead of duplicating it
    `UID:${`${stamp(EVENT.startsAt)}-nikkah-${EVENT.groom.short}-${EVENT.bride.short}`.toLowerCase()}@invitation`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(EVENT.startsAt)}`,
    `DTEND:${stamp(EVENT.endsAt)}`,
    `SUMMARY:${escapeIcs(TITLE)}`,
    `LOCATION:${escapeIcs(LOCATION)}`,
    `DESCRIPTION:${escapeIcs(DETAILS)}`,
    `URL:${window.location.origin}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map((line) => `${fold(line)}\r\n`)
    .join("");
}

function downloadIcs() {
  const url = URL.createObjectURL(new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "ali-ariha-nikkah.ics";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// stable, so it runs once when the choices appear, not on every render
const focusOnMount = (el: HTMLElement | null) => el?.focus({ preventScroll: true });

const link =
  "inline-flex items-center min-h-[44px] px-[1.5cqw] font-serif italic text-[max(15px,4.8cqw)] leading-none text-ink underline decoration-silver/80 decoration-[0.5px] underline-offset-[0.3em] transition-colors hover:text-ink-mid hover:decoration-ink-mid cursor-pointer";

// One letterpressed pill; tapped, it gives way to the two ways of saving the
// date, in the same spot, so the card never reflows.
export function CountdownCalendar() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-[max(48px,13cqw)] items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="choices"
            className="flex items-center gap-[3cqw]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <a ref={focusOnMount} href={GOOGLE_URL} target="_blank" rel="noopener noreferrer" className={link}>
              Google Calendar
            </a>
            <span aria-hidden className="size-[1.3cqw] rotate-45" style={{ background: FOIL }} />
            <button type="button" onClick={downloadIcs} className={link}>
              Apple &amp; Outlook
            </button>
          </motion.div>
        ) : (
          <motion.div key="button" exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease: EASE }}>
            <PaperButton onClick={() => setOpen(true)}>{EVENT.copy.countdown.calendar}</PaperButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
