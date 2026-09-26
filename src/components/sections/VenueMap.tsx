"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { EVENT } from "@/lib/event";
import { IMG } from "../opening/geometry";
import { FOIL } from "../paper/foil";

// The window: an arch cut into the card, with a foil hairline around a narrow
// mat. All in cqw so it scales with the card.
const W = 64;
const H = 56;
const MAT = 1.6;
const innerRadius = `${W / 2}cqw ${W / 2}cqw 1.4cqw 1.4cqw`;
const outerRadius = `${W / 2 + MAT}cqw ${W / 2 + MAT}cqw ${1.4 + MAT}cqw ${1.4 + MAT}cqw`;

// Google draws its own buttons (an "Open in Maps" chip at the top, a layer
// switcher and full-screen control at the foot) in fixed pixels. The frame is
// oversized past them so only the map shows (that also hides Google's own
// credit, so it is printed under the window instead); the extra on the left
// moves the pin off-centre so its label has room to the right.
const CROP = { top: 56, bottom: 100, left: 140 };

// Toned toward ink on cotton, then multiplied with the card's own texture so
// the map's white becomes the paper.
const TONE = "grayscale(1) sepia(0.1) contrast(0.9) brightness(1.05)";

const ring: CSSProperties = {
  background: FOIL,
  backgroundSize: "300% 100%",
  borderRadius: outerRadius,
  padding: 1,
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
};

export function VenueMap() {
  const { venue } = EVENT;
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative mx-auto" style={{ width: `${W + MAT * 2}cqw`, padding: `${MAT}cqw` }}>
      <div
        aria-hidden
        className="absolute inset-0 animate-[foil-sheen_7s_ease-in-out_infinite]"
        style={{ ...ring, filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.7))" }}
      />

      {/* the recess: a bright lip where the cut edge catches the light */}
      <div className="relative" style={{ height: `${H}cqw`, borderRadius: innerRadius, boxShadow: "0 1px 0 rgba(255,255,255,0.75)" }}>
        <div
          className="absolute inset-0 overflow-hidden bg-[#ede8df]"
          style={{ borderRadius: innerRadius, clipPath: `inset(0 round ${innerRadius})` }}
        >
          <div inert className="absolute pointer-events-none" style={{ top: -CROP.top, bottom: -CROP.bottom, left: -CROP.left, right: 0 }}>
            <motion.iframe
              src={`${venue.embedUrl}&z=16`}
              title={`Map of ${venue.name}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
              onLoad={() => setLoaded(true)}
              className="block size-full border-0"
              style={{ filter: TONE }}
              initial={{ opacity: 0 }}
              animate={{ opacity: loaded ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 0, 0.1, 1] }}
            />
          </div>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${IMG.card})`,
              backgroundSize: "100cqw auto",
              backgroundPosition: "center",
              mixBlendMode: "multiply",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: innerRadius,
              boxShadow: "inset 0 1.5px 4px rgba(40,30,20,0.32), inset 0 0 0 1px rgba(82,68,56,0.16)",
            }}
          />
        </div>

        {/* a tap target for the whole window; keyboards and screen readers use
            the button below, which goes to the same place */}
        <a
          href={venue.mapsUrl}
          target="_blank"
          rel="noopener"
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0"
          style={{ borderRadius: innerRadius }}
        />
      </div>
      <p className="absolute right-[2.4cqw] top-full mt-[0.6cqw] font-serif italic text-[3.2cqw] leading-none text-ink-mid">
        {EVENT.copy.venue.mapCredit}
      </p>
    </div>
  );
}
