"use client";

import { startTransition, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotionValue } from "framer-motion";
import { SECTION_IDS, type SectionId } from "@/lib/event";
import { Scene } from "./opening/Scene";
import { OpeningScene } from "./opening/OpeningScene";
import { Sections } from "./sections/Sections";
import { MusicButton } from "./music/MusicButton";

// A link straight to a section (…/#rsvp) skips the envelope.
const noop = () => () => {};
const useDeepLink = () =>
  useSyncExternalStore(
    noop,
    () => {
      const id = window.location.hash.slice(1) as SectionId;
      return SECTION_IDS.includes(id) ? id : null;
    },
    () => null,
  );

export function Invitation() {
  // One camera for the whole opening. The envelope and the blossoms lie on the
  // same table, so they share it exactly: `cam` is the zoom and `camLift` the
  // vertical shift in px. The opening drives both; they outlive it, so the
  // blossoms stay where the camera left them.
  const cam = useMotionValue(1);
  const camLift = useMotionValue(0);
  const envH = useMotionValue(0);
  const [opened, setOpened] = useState(false);
  const deepLink = useDeepLink();

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

      {opened || deepLink ? (
        <Sections startAt={deepLink ?? undefined} />
      ) : (
        <OpeningScene cam={cam} camLift={camLift} envH={envH} onOpened={() => startTransition(() => setOpened(true))} />
      )}
      <MusicButton offer={opened || !!deepLink} />
    </div>
  );
}
