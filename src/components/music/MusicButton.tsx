"use client";

import { motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { music } from "./music";

// each bar sways at its own tempo, so they never line up into a staircase
const BARS = [
  { h: 0.6, dur: 1.05, delay: 0.3 },
  { h: 1, dur: 1.35, delay: 0 },
  { h: 0.45, dur: 0.9, delay: 0.55 },
  { h: 0.8, dur: 1.2, delay: 0.2 },
];

// A small round of card in the top corner: four ink bars that sway while the
// song plays and settle flat when it's paused. `offer` shows it (paused)
// even before any music has played — e.g. when a link skips the envelope.
export function MusicButton({ offer }: { offer: boolean }) {
  const status = useSyncExternalStore(music.subscribe, music.getStatus, () => "idle" as const);
  const visible = status !== "idle" || offer;
  const playing = status === "playing";

  return (
    <motion.button
      type="button"
      onClick={() => music.toggle()}
      aria-label={playing ? "Pause music" : "Play music"}
      aria-pressed={playing}
      title={playing ? "Pause music" : "Play music"}
      className="fixed z-40 grid place-items-center size-11 rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/60"
      style={{
        top: "max(10px, env(safe-area-inset-top))",
        right: "max(10px, env(safe-area-inset-right))",
        pointerEvents: visible ? "auto" : "none",
      }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.85 }}
      transition={{ duration: 0.8, ease: [0.22, 0, 0.1, 1] }}
    >
      <span
        aria-hidden
        className="grid place-items-center size-9 rounded-full bg-paper-card/90 border border-silver/60"
        style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 2px 6px rgba(34,28,24,0.18)" }}
      >
        <span className="flex items-end gap-[3px] h-3.5">
          {BARS.map(({ h, dur, delay }, i) => (
            <span
              key={i}
              className="block w-[2px] h-full rounded-full bg-ink/75 origin-bottom"
              style={{
                transform: `scaleY(${playing ? h : 0.22})`,
                animation: playing ? `music-bar ${dur}s ease-in-out ${delay}s infinite alternate` : "none",
              }}
            />
          ))}
        </span>
      </span>
    </motion.button>
  );
}
