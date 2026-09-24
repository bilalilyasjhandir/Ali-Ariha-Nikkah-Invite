"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CornerFlorals } from "./CornerFlorals";
import { EnvelopeBack, EnvelopePocket, EnvelopeFlap, WaxSeal } from "./EnvelopeGraphics";
import { LetterContent } from "./LetterContent";

type Phase = "closed" | "opening" | "opened";

const EASE = [0.65, 0.04, 0.18, 1] as const;
const ENVELOPE_HEIGHT = 190;

export function EnvelopeExperience() {
  const [phase, setPhase] = useState<Phase>("closed");
  const isClosed = phase === "closed";
  const isOpened = phase === "opened";

  return (
    <main className="relative min-h-dvh flex items-center justify-center px-6 py-14 overflow-hidden">
      <CornerFlorals />

      <div className="relative z-10 w-full max-w-[360px]">
        {!isOpened ? (
          <div
            className="relative"
            style={{ height: ENVELOPE_HEIGHT, perspective: 1400 }}
          >
            {/* envelope back panel */}
            <div className="absolute inset-0 z-0">
              <EnvelopeBack />
            </div>

            {/* letter, tucked behind the pocket, grows and rises as it opens */}
            <motion.div
              className="absolute left-1/2 top-1/2 z-10 w-[86%] rounded-[2px] border border-silver-soft/60 bg-paper-card shadow-[0_20px_45px_-18px_rgba(31,33,43,0.45)] overflow-hidden"
              initial={false}
              animate={
                isClosed
                  ? { x: "-50%", y: "-38%", scale: 0.24, opacity: 0 }
                  : { x: "-50%", y: "-128%", scale: 1, opacity: 1 }
              }
              transition={{ duration: 1, ease: EASE, delay: isClosed ? 0 : 0.32 }}
            >
              <LetterContent />
            </motion.div>

            {/* front pocket, hides the base of the letter */}
            <div className="absolute inset-0 z-20">
              <EnvelopePocket />
            </div>

            {/* flap, hinged at the top, opens on tap */}
            <motion.button
              type="button"
              aria-label={isClosed ? "Open the invitation" : undefined}
              tabIndex={isClosed ? 0 : -1}
              disabled={!isClosed}
              onClick={() => isClosed && setPhase("opening")}
              onAnimationComplete={() => {
                if (phase === "opening") setPhase("opened");
              }}
              className="absolute inset-0 z-30 w-full origin-top disabled:cursor-default"
              style={{ transformStyle: "preserve-3d", cursor: isClosed ? "pointer" : "default" }}
              animate={{ rotateX: isClosed ? 0 : -172 }}
              transition={{ duration: 0.85, ease: EASE, delay: isClosed ? 0 : 0.08 }}
            >
              <EnvelopeFlap />
            </motion.button>

            {/* wax seal, cracks and lifts away on open */}
            <motion.div
              className="absolute inset-0 z-40 pointer-events-none"
              animate={
                isClosed
                  ? { opacity: 1, scale: 1, rotate: 0, y: 0 }
                  : { opacity: 0, scale: 1.25, rotate: -16, y: -14 }
              }
              transition={{ duration: 0.45, ease: EASE }}
            >
              <WaxSeal />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: EASE }}
            className="relative rounded-[2px] border border-silver-soft/60 bg-paper-card shadow-[0_25px_60px_-20px_rgba(31,33,43,0.45)]"
          >
            <LetterContent />
          </motion.div>
        )}
      </div>

      {isClosed && (
        <p className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 font-sans text-xs tracking-[0.32em] uppercase text-ink-soft animate-[pulse-invite_2.4s_ease-in-out_infinite]">
          tap to open
        </p>
      )}
    </main>
  );
}
