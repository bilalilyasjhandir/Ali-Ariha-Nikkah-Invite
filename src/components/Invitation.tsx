"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";
import { Scene } from "./opening/Scene";
import { OpeningScene } from "./opening/OpeningScene";
import { LetterCard } from "./opening/LetterCard";

export function Invitation() {
  // One camera for the whole opening. The envelope and the blossoms lie on the
  // same table, so they share it exactly: `cam` is the zoom and `camLift` the
  // vertical shift in px. The opening drives both; they outlive it, so the
  // blossoms stay where the camera left them.
  const cam = useMotionValue(1);
  const camLift = useMotionValue(0);
  const envH = useMotionValue(0);
  const [opened, setOpened] = useState(false);

  const probe = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const measure = () => envH.set(probe.current?.offsetHeight ?? 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [envH]);

  return (
    <div className="invite-vars relative">
      <div ref={probe} aria-hidden className="fixed invisible pointer-events-none" style={{ height: "var(--eh)" }} />
      <Scene cam={cam} lift={camLift} />

      {!opened ? (
        <OpeningScene cam={cam} camLift={camLift} envH={envH} onOpened={() => startTransition(() => setOpened(true))} />
      ) : (
        <main className="relative z-10">
          {/* Same size and position as the card at the end of the opening, so the
              swap is invisible: centred when it fits, otherwise top-anchored and
              the page scrolls. */}
          <section className="min-h-dvh flex items-center justify-center py-6">
            <div style={{ width: "var(--card-w)" }}>
              <LetterCard />
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
