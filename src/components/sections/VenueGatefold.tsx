"use client";

import Image from "next/image";
import { cubicBezier, motion, useReducedMotion, type Transition } from "framer-motion";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { celebrate } from "@/components/celebration/Celebration";
import { EVENT } from "@/lib/event";
import { IMG, SIZE } from "../opening/geometry";
import { BLOOMS } from "../paper/Paper";
import { FOIL, FoilMonogram, FoilText, maskOf } from "../paper/foil";

// The venue card arrives as a gatefold: two doors cut from one printed sheet,
// held shut by a belly band. A tap slips the band off and the doors swing open
// toward the guest, onto the card beneath. It lies over the card rather than
// inside the Paper, whose deckle mask would clip the doors as they swing out.

type Side = "left" | "right";

const { eyebrow, prompt } = EVENT.copy.venue;
// "The Venue", set either side of the medallion
const [WORD_BEFORE, ...after] = eyebrow.split(" ");
const WORD_AFTER = after.join(" ");
// not on the draft card, so not in EVENT.copy
const OPEN_LABEL = `${eyebrow} — ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}`;

// The printed front, in cqw of the whole card.
const CARD_H = (100 * SIZE.card.h) / SIZE.card.w;
const BAND = { top: 76, h: 16 };
const SEAL = 19;
// the band's layer reaches past the band, for the medallion and the shadows
const BAND_PAD = 4;
const PROMPT_TOP = BAND.top + BAND.h + 9;
const COVER_BLOOMS = [...BLOOMS.topLeft, ...BLOOMS.bottomRight];

// The swing: toward the guest and a little past upright, fading as it goes.
const SWING = 115;
const SWING_S = 1.1;
// the doors spring as the band clears them
const DOORS_AT = 0.28;
const STAGGER = 0.06;
// perspective, in card widths
const DEPTH = 3;
const EASE_BAND = [0.33, 0, 0.2, 1] as const;
const EASE_SWING = [0.5, 1, 0.89, 1] as const;

// Where a door's free edge appears, in card widths from its hinge, as the door
// stands at `deg`: it swings in over the hinge and looms larger as it lifts.
function edgeAt(deg: number) {
  const a = (deg * Math.PI) / 180;
  return 0.5 + (0.5 * Math.cos(a) - 0.5) * (DEPTH / (DEPTH - 0.5 * Math.sin(a)));
}
// The shadow a door lays on the card beneath follows that edge out and fades
// as the door lifts away. Sampled over time, so it plays back linearly.
const swingAt = cubicBezier(...EASE_SWING);
const LIFT = Array.from({ length: 13 }, (_, i) => SWING * swingAt(i / 12));
const LIFT_SHIFT = LIFT.map((deg) => (edgeAt(deg) - 0.5) * 100);
const LIFT_FADE = LIFT.map((deg) => Math.max(0, 1 - deg / 70) ** 1.5);

// The window light is from the upper left: the right door's front turns away
// from it as it opens, and the left door's back is the one left in shade.
const FRONT_SHADE: Record<Side, number> = { left: 0.12, right: 0.26 };
const BACK_SHADE: Record<Side, string> = { left: "rgba(30,38,46,0.2)", right: "rgba(30,38,46,0.03)" };

// One door's half of the card: its own three deckled edges, and a clean cut
// where the doors meet.
const half = (side: Side): CSSProperties => ({
  ...maskOf(IMG.cardMask, "200% 100%"),
  maskPosition: side,
  WebkitMaskPosition: side,
});
const paper = (side: Side): CSSProperties => ({
  ...half(side),
  background: `url(${IMG.card}) ${side} / 200% 100% no-repeat`,
});

// Where the doors meet: a hairline of shadow on the left door's cut edge,
// which faces away from the window, and light caught on the right door's. In
// whole pixels: a finer band can fall between a screen's pixels and vanish.
const CUT_EDGE: Record<Side, string> = {
  left: "linear-gradient(to left, rgba(64,54,46,0.3) 1px, rgba(255,255,255,0.3) 1px 2px, transparent 3px)",
  right: "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 2.5px)",
};

// The hairline breaks where the prompt is printed across it: the two halves
// are one continuous sheet, so the doors simply meet unseen there, and the
// words read whole.
const SEAM_GAP = `linear-gradient(#000 ${PROMPT_TOP - 1.5}cqw, transparent ${PROMPT_TOP - 0.5}cqw, transparent ${PROMPT_TOP + 8.5}cqw, #000 ${PROMPT_TOP + 9.5}cqw)`;

const FACE: CSSProperties = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };

// Pale blue-silver stock: the card's own cotton multiplied under a cool tint,
// a bright lip along the top cut and a soft shadow onto the doors. Its ends
// darken a touch where it turns around the card's edges.
const BAND_PAPER: CSSProperties = {
  backgroundColor: "#d7e5ef",
  backgroundImage: [
    "linear-gradient(90deg, rgba(40,56,72,0.14), rgba(40,56,72,0) 2.5cqw calc(100% - 2.5cqw), rgba(40,56,72,0.14))",
    // a satin sheen where the stock catches the window
    "linear-gradient(100deg, rgba(255,255,255,0) 22%, rgba(255,255,255,0.22) 42%, rgba(255,255,255,0) 64%)",
    "linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 45%, rgba(40,56,72,0.07))",
    `url(${IMG.card})`,
  ].join(", "),
  backgroundSize: "100% 100%, 100% 100%, 100% 100%, 140cqw auto",
  backgroundPosition: "center",
  backgroundBlendMode: "normal, normal, normal, multiply",
  boxShadow: [
    "inset 0 1px 0 rgba(255,255,255,0.85)",
    "inset 0 -1px 0 rgba(52,66,80,0.14)",
    "0 0.5cqw 1.1cqw rgba(30,40,52,0.2)",
    "0 0.12cqw 0.25cqw rgba(30,40,52,0.2)",
  ].join(", "),
};

const SEAL_PAPER: CSSProperties = {
  backgroundColor: "#f4f0e9",
  backgroundImage: `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.4), rgba(255,255,255,0) 62%), url(${IMG.card})`,
  backgroundSize: "100% 100%, 100cqw auto",
  backgroundPosition: "center",
  boxShadow: [
    "inset 0 0.2cqw 0.2cqw rgba(255,255,255,0.8)",
    "inset 0 -0.25cqw 0.5cqw rgba(80,68,56,0.14)",
    "0 0.45cqw 1cqw rgba(30,40,52,0.28)",
    "0 0.1cqw 0.2cqw rgba(30,40,52,0.24)",
  ].join(", "),
};

// a foil hairline ring: the foil gradient with its middle masked away
const RING: CSSProperties = {
  background: FOIL,
  backgroundSize: "300% 100%",
  padding: "0.3cqw",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
};

// small caps in foil; the tracking after the last letter is taken back, so
// both words sit the same distance from the medallion
function Word({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`block -mr-[0.34em] font-sans font-medium text-[3.3cqw] leading-none tracking-[0.34em] uppercase ${className}`}>
      <FoilText>{children}</FoilText>
    </span>
  );
}

function Medallion() {
  return (
    <span className="relative block rounded-full" style={{ width: `${SEAL}cqw`, height: `${SEAL}cqw`, ...SEAL_PAPER }}>
      <span className="absolute inset-[1.5cqw] block" style={{ filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.75))" }}>
        <span className="absolute inset-0 block rounded-full sheen animate-[foil-sheen_7s_ease-in-out_infinite]" style={RING} />
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <FoilMonogram className="w-[5.6cqw]" />
      </span>
    </span>
  );
}

// The belly band. Its layer carries the card's deckle, so the band's ends wrap
// the card's edges, and it slips down off the doors to open them.
function Band({ open, reduce }: { open: boolean; reduce: boolean }) {
  const top = BAND.top - BAND_PAD;
  const band = { top: `${BAND_PAD}cqw`, height: `${BAND.h}cqw` };
  return (
    <motion.span
      className="absolute inset-x-0 block"
      style={{
        top: `${top}cqw`,
        height: `${BAND.h + BAND_PAD * 2}cqw`,
        ...maskOf(IMG.cardMask, `100% ${CARD_H}cqw`),
        maskPosition: `0 ${-top}cqw`,
        WebkitMaskPosition: `0 ${-top}cqw`,
      }}
      initial={false}
      animate={{ opacity: open ? 0 : 1, transform: `translateY(${open && !reduce ? 10 : 0}cqw)` }}
      transition={
        reduce
          ? { duration: 0.3 }
          : { duration: 0.45, ease: EASE_BAND, opacity: { duration: 0.36, ease: [0.45, 0, 0.55, 1] } }
      }
    >
      <span className="absolute inset-x-0 block" style={{ ...band, ...BAND_PAPER }} />
      <span className="absolute inset-x-0 grid grid-cols-[1fr_auto_1fr] items-center gap-x-[3.6cqw]" style={band}>
        <Word className="justify-self-end">{WORD_BEFORE}</Word>
        <Medallion />
        <Word className="justify-self-start">{WORD_AFTER}</Word>
      </span>
    </motion.span>
  );
}

// The printed front of one door: the whole front is set out once, shifted so
// this door shows its half, so anything printed across the middle parts with
// the doors.
function Front({ side }: { side: Side }) {
  return (
    <span className="absolute inset-0 block" style={paper(side)}>
      <span className="absolute inset-y-0 block w-[200%]" style={{ [side]: 0 }}>
        {/* decoded with the paint: left to decode asynchronously (next/image's
            default), Chrome drops a blossom that bleeds off the screen's edge
            once its door turns in 3D */}
        {COVER_BLOOMS.map((b, i) => (
          <Image
            key={i}
            src={IMG.flower}
            alt=""
            width={SIZE.flower.w}
            height={SIZE.flower.h}
            loading="eager"
            decoding="sync"
            draggable={false}
            className="absolute h-auto opacity-95 select-none pointer-events-none"
            style={{ width: `${b.w}cqw`, [b.side]: `${b.x}cqw`, [b.end]: `${b.y}cqw`, rotate: `${b.rotate}deg` }}
          />
        ))}
        <span className="absolute inset-x-0 flex justify-center" style={{ top: `${PROMPT_TOP}cqw` }}>
          <span className="rounded-full px-[4cqw] py-[1.2cqw] font-serif italic text-[max(15px,4.5cqw)] leading-none text-ink-mid underline decoration-silver decoration-1 underline-offset-[0.28em] transition-colors duration-300 group-hover:text-ink group-focus-visible:outline group-focus-visible:outline-1 group-focus-visible:outline-offset-2 group-focus-visible:outline-ink/50">
            {prompt}
          </span>
        </span>
      </span>
      <span
        className="absolute inset-y-0 block w-[2cqw]"
        style={{ [side === "left" ? "right" : "left"]: 0, background: CUT_EDGE[side], maskImage: SEAM_GAP, WebkitMaskImage: SEAM_GAP }}
      />
    </span>
  );
}

function Door({
  side,
  open,
  reduce,
  delay,
  onGone,
}: {
  side: Side;
  open: boolean;
  reduce: boolean;
  delay: number;
  onGone?: () => void;
}) {
  const swing: Transition = { duration: SWING_S, delay, ease: EASE_SWING };
  // over the last third of the swing, or simply a fade when motion is reduced
  const fade: Transition = reduce
    ? { duration: 0.3, ease: "easeOut" }
    : { duration: SWING_S / 3, delay: delay + (SWING_S * 2) / 3, ease: "linear" };
  const turn = side === "left" ? -SWING : SWING;
  return (
    <motion.span
      className="absolute inset-y-0 block w-1/2"
      style={{ [side]: 0, transformOrigin: side, transformStyle: "preserve-3d" }}
      initial={false}
      animate={{ transform: `rotateY(${open && !reduce ? turn : 0}deg)` }}
      transition={swing}
    >
      <motion.span
        className="absolute inset-0 block"
        style={FACE}
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={fade}
        onAnimationComplete={() => open && onGone?.()}
      >
        <Front side={side} />
      </motion.span>
      {/* the front turning from the light; never quite 0, so it is already
          rastered when the swing begins */}
      <motion.span
        className="absolute inset-0 block"
        style={FACE}
        initial={false}
        animate={{ opacity: open && !reduce ? FRONT_SHADE[side] : 0.003 }}
        transition={swing}
      >
        <span className="absolute inset-0 block bg-[#1e2630]" style={half(side)} />
      </motion.span>
      {/* the plain back: the same sheet, seen from behind */}
      <motion.span
        className="absolute inset-0 block"
        style={{ ...FACE, transform: "rotateY(180deg)" }}
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={fade}
      >
        <span className="absolute inset-0 block" style={{ ...paper(side), transform: "scaleX(-1)" }}>
          <span className="absolute inset-0 block" style={{ background: BACK_SHADE[side] }} />
        </span>
      </motion.span>
    </motion.span>
  );
}

// the shadow a lifting door lays on the card beneath, just past its free edge
function LiftShadow({ side, open, delay }: { side: Side; open: boolean; delay: number }) {
  const out = side === "left" ? 1 : -1;
  return (
    <motion.span
      className="absolute block w-[9cqw]"
      style={{ top: "1.5cqw", bottom: "1.5cqw", [side]: "50%" }}
      initial={false}
      animate={
        open
          ? { transform: LIFT_SHIFT.map((x) => `translateX(${out * x}cqw)`), opacity: LIFT_FADE }
          : { transform: "translateX(0cqw)", opacity: 1 }
      }
      transition={{ duration: SWING_S, delay, ease: "linear" }}
    >
      <span
        className="absolute inset-0 block"
        style={{
          background: `linear-gradient(to ${side === "left" ? "right" : "left"}, rgba(26,34,42,0.3), rgba(26,34,42,0.1) 40%, transparent)`,
          maskImage: "linear-gradient(transparent, #000 8cqw, #000 calc(100% - 8cqw), transparent)",
          WebkitMaskImage: "linear-gradient(transparent, #000 8cqw, #000 calc(100% - 8cqw), transparent)",
        }}
      />
    </motion.span>
  );
}

// Laid over the venue card, the same size and place. One real button: a tap,
// a click, Enter or Space opens it; a swipe that starts on it still scrolls.
export function VenueGatefold({
  open,
  onOpen,
  onOpened,
}: {
  open: boolean;
  onOpen: () => void;
  // the doors are gone and the gatefold can be unmounted
  onOpened: () => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const ref = useRef<HTMLButtonElement>(null);

  // the shower blooms from the card's centre a third of the way into the swing
  useEffect(() => {
    if (!open || reduce) return;
    const t = window.setTimeout(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r) celebrate(r.left + r.width / 2, r.top + r.height / 2);
    }, (DOORS_AT + SWING_S * 0.35) * 1000);
    return () => clearTimeout(t);
  }, [open, reduce]);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={OPEN_LABEL}
      aria-hidden={open || undefined}
      disabled={open}
      onClick={() => !open && onOpen()}
      className="group absolute inset-0 block cursor-pointer select-none outline-none disabled:cursor-default [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]"
      style={{ perspective: `${DEPTH * 100}cqw` }}
    >
      {!reduce && <LiftShadow side="left" open={open} delay={DOORS_AT} />}
      {!reduce && <LiftShadow side="right" open={open} delay={DOORS_AT + STAGGER} />}
      <Door side="left" open={open} reduce={reduce} delay={DOORS_AT} />
      <Door side="right" open={open} reduce={reduce} delay={DOORS_AT + STAGGER} onGone={onOpened} />
      <Band open={open} reduce={reduce} />
    </button>
  );
}
