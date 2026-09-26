"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from "framer-motion";
import {
  CARD_SLOT,
  CARD_SLOT_CENTRE,
  CARD_SLOT_HEIGHT,
  CARD_SLOT_TOP,
  FLAP_LAYER,
  IMG,
  MOUTH_BOTTOM,
  OPEN_FLAP_SHADOW_LAYER,
  PADDED_HINGE_ORIGIN,
  PADDED_LAYER,
  SEAL_IN_FLAP,
  SEAL_IN_FRAME,
  SIZE,
} from "./geometry";
import { LetterCard } from "./LetterCard";
import { music } from "../music/music";
import { CrackLight, SealBloom, SealCrumbs, SealLight, SealPiece, SealSheen, SealWhole, WARM } from "./WaxSeal";

// open-flap shadow, interior, pocket, flap shadow, flap front, flap back,
// seal, seal flap piece, seal body piece, seal light, seal halo, card
const CRITICAL_IMAGES = 12;

const FINE_POINTER = "(pointer: fine)";
function subscribePointer(cb: () => void) {
  const mq = window.matchMedia(FINE_POINTER);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useFinePointer = () =>
  useSyncExternalStore(subscribePointer, () => window.matchMedia(FINE_POINTER).matches, () => false);

// how far the card rises out of the pocket, as a fraction of the envelope height
const RISE = 0.5;
// the camera ends a touch closer to the table than it started: the push-in onto the card
const CAM_END = 1.04;
// the opened flap's tip, above the envelope's top edge (fraction of its height)
const OPEN_FLAP_REACH = 0.44;

const OVERLAY_TINT = "rgba(56,74,92,1)";
const warm = (v: number) => Math.max(WARM, v);

function Layer({
  src,
  w,
  h,
  style,
  onLoad,
}: {
  src: string;
  w: number;
  h: number;
  style: MotionStyle;
  onLoad: () => void;
}) {
  return (
    <motion.div className="absolute pointer-events-none" style={{ willChange: "transform, opacity", ...style }}>
      <Image
        src={src}
        alt=""
        width={w}
        height={h}
        loading="eager"
        onLoad={onLoad}
        draggable={false}
        className="w-full h-full select-none"
      />
    </motion.div>
  );
}

// Light and shade on a turning flap face: a flat tint cut to the flap's own
// lace silhouette, so only its opacity animates (no per-frame filters).
function FaceTint({ mask, color, opacity }: { mask: string; color: string; opacity: MotionValue<number> }) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      style={{
        opacity,
        willChange: "opacity",
        background: color,
        maskImage: `url(${mask})`,
        WebkitMaskImage: `url(${mask})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
      }}
    />
  );
}

// The pocket's mouth edges, seen from inside: the left side flap casts a soft
// shadow onto whatever is in the pocket (the light is from the upper-left), the
// right one only a trace of occlusion — and both cut edges catch a hair of light.
function MouthShadows({ y }: { y: MotionValue<number> }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 1000 1800"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      style={{ y, willChange: "transform" }}
    >
      <defs>
        <filter id="mouth-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="mouth-depth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(52,40,30)" stopOpacity="0.06" />
          <stop offset="0.55" stopColor="rgb(52,40,30)" stopOpacity="0.13" />
          <stop offset="1" stopColor="rgb(52,40,30)" stopOpacity="0.24" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1000" height={MOUTH_BOTTOM * 1800} fill="url(#mouth-depth)" />
      <g filter="url(#mouth-soft)">
        <polygon points="55,0 475,690 487,683 67,-7" fill="rgba(34,28,24,0.4)" />
        <polygon points="945,0 525,690 515,684 935,-6" fill="rgba(34,28,24,0.16)" />
      </g>
    </motion.svg>
  );
}

function MouthEdges({ y }: { y: MotionValue<number> }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 1000 1800"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full z-[6] pointer-events-none overflow-visible"
      style={{ y, willChange: "transform" }}
    >
      <line x1="55" y1="0" x2="475" y2="690" stroke="rgba(255,253,248,0.45)" strokeWidth="2.4" />
      <line x1="945" y1="0" x2="525" y2="690" stroke="rgba(255,253,248,0.7)" strokeWidth="2.4" />
    </motion.svg>
  );
}

const FOIL_TEXT: CSSProperties = {
  // the glint stays narrow and never bleaches the letters
  background:
    "linear-gradient(112deg, #56606a 0%, #8c959e 22%, #c3c9ce 30%, #7a838c 38%, #5d6771 55%, #9aa2aa 72%, #5a646e 100%)",
  backgroundSize: "300% 100%",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};
const FOIL_EDGE = "drop-shadow(0 1px 0 rgba(255,255,255,0.75)) drop-shadow(0 -0.5px 0.4px rgba(40,44,52,0.35))";

function EnvelopeNames({ y }: { y: MotionValue<number> }) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-x-0 z-[6] flex flex-col items-center pointer-events-none"
      style={{ top: "71%", y, willChange: "transform" }}
    >
      <div style={{ filter: FOIL_EDGE }}>
        <p
          className="font-sans uppercase tracking-[0.34em] animate-[foil-sheen_8s_ease-in-out_infinite]"
          style={{ ...FOIL_TEXT, fontSize: "max(12px, calc(var(--ew) * 0.034))" }}
        >
          The Nikkah of
        </p>
      </div>
      <div className="mt-[calc(var(--ew)*0.02)]" style={{ filter: FOIL_EDGE }}>
        <p
          className="font-script leading-[1.25] whitespace-nowrap animate-[foil-sheen_8s_ease-in-out_infinite]"
          style={{ ...FOIL_TEXT, fontSize: "calc(var(--ew) * 0.118)" }}
        >
          Ali <span className="font-serif italic text-[0.78em]">&amp;</span> Ariha
        </p>
      </div>
    </motion.div>
  );
}

function Curtain({ ready }: { ready: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper-card pointer-events-none"
      initial={false}
      animate={{ opacity: ready ? 0 : 1 }}
      transition={{ duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: ready ? 0.15 : 0 }}
    >
      <div className="flex flex-col items-center gap-4 animate-[curtain-breathe_2.4s_ease-in-out_infinite]">
        <div
          className="w-10"
          style={{
            aspectRatio: `${SIZE.monogram.w} / ${SIZE.monogram.h}`,
            background: "linear-gradient(112deg, #6e7883 0%, #aab2b9 30%, #7d868f 55%, #b8bec4 80%, #6e7883 100%)",
            maskImage: `url(${IMG.monogram})`,
            WebkitMaskImage: `url(${IMG.monogram})`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
        <p className="font-script text-3xl text-ink">
          Ali <span className="font-serif italic text-[0.8em]">&amp;</span> Ariha
        </p>
      </div>
    </motion.div>
  );
}

export function OpeningScene({
  cam,
  camLift,
  envH,
  onOpened,
}: {
  cam: MotionValue<number>;
  camLift: MotionValue<number>;
  envH: MotionValue<number>;
  onOpened: () => void;
}) {
  const reduce = useReducedMotion();
  const finePointer = useFinePointer();
  const [loaded, setLoaded] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const ready = (loaded >= CRITICAL_IMAGES && fontsReady) || timedOut;

  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const openingRef = useRef(false);
  const onLoad = () => setLoaded((n) => n + 1);

  useEffect(() => {
    document.fonts?.ready.then(() => setFontsReady(true));
    const t = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(t);
  }, []);

  const intro = useMotionValue(0);
  useEffect(() => {
    if (!ready) return;
    animate(intro, 1, { duration: 1.6, ease: [0.22, 0, 0.1, 1], delay: 0.2 });
    music.preload();
  }, [ready, intro]);
  const introScale = useTransform(intro, [0, 1], [1.035, 1]);

  const stageFade = useMotionValue(1);
  const press = useMotionValue(1);
  const joltY = useMotionValue(0);
  const joltR = useMotionValue(0);
  const sealPress = useMotionValue(1);
  const hint = useMotionValue(1);
  const dim = useMotionValue(0);
  const crack = useMotionValue(0);
  const crackFade = useMotionValue(1);
  const crackFlash = useMotionValue(0);
  const sweep = useMotionValue(0);
  const sealLight = useMotionValue(0);
  const bloom = useMotionValue(0);
  const crumbs = useMotionValue(0);
  const flap = useMotionValue(0);
  const capTwist = useMotionValue(0);
  const envY = useMotionValue(0);
  const cardY = useMotionValue(0);
  const cardScale = useMotionValue(1);
  const cardLift = useMotionValue(0);
  // where the camera looks, relative to the card's centre (fraction of the
  // envelope height). Starting value = the envelope's centre.
  const focusOffset = useMotionValue(0.5 - CARD_SLOT_CENTRE);

  // The camera's vertical shift keeps `card centre + focusOffset` at the centre
  // of the screen. Written into the shared camera so the blossoms follow it.
  const lift = useTransform(() => {
    const h = envH.get();
    return -cam.get() * ((CARD_SLOT_CENTRE - 0.5) * h + cardY.get() + focusOffset.get() * h);
  });
  useMotionValueEvent(lift, "change", (v) => camLift.set(v));

  const hintOpacity = useTransform(() => hint.get() * intro.get());
  const dimOpacity = useTransform(dim, warm);

  // The closed flap's shadow, projected from the window light as the flap
  // rises: it stretches and slides toward the lower-right, softens, and folds
  // back into the hinge once the flap passes over the top.
  const flapShadowCrisp = useTransform(flap, [0, 22], [1, WARM]);
  const flapShadowSoft = useTransform(flap, [0, 22, 60, 90, 112, 128], [WARM, 0.5, 0.58, 0.52, 0.2, WARM]);
  const flapShadowTransform = useTransform(flap, (deg) => {
    const a = (deg * Math.PI) / 180;
    const shear = 0.733 * Math.sin(a);
    const stretch = Math.max(0.001, Math.cos(a) + 0.867 * Math.sin(a));
    return `matrix(1, 0, ${shear}, ${stretch}, 0, 0)`;
  });
  const openFlapShadow = useTransform(flap, [150, 180], [WARM, 1]);
  // outer face tips toward the window, then goes edge-on; the liner turns up out of shadow
  const frontLight = useTransform(flap, [0, 41, 75], [WARM, 0.1, WARM]);
  const frontShade = useTransform(flap, [60, 90], [WARM, 0.06]);
  const backShade = useTransform(flap, [90, 130, 170, 180], [0.18, 0.12, 0.03, WARM]);

  // Discrete switches mid-animation are motion values written straight to the
  // style — a React re-render of this tree costs several frames on a phone.
  // The seal swaps to its two pieces the instant the flap unsticks; past 90°
  // the flap lies behind the envelope plane, so the rising card passes over
  // it; once the card's bottom edge is above the envelope it comes forward
  // over everything without passing through the pocket.
  const cracked = useTransform(flap, (v) => (v > 0.2 ? 1 : WARM));
  const whole = useTransform(flap, (v) => (v > 0.2 ? 0 : 1));
  const flapZ = useTransform(flap, (v) => (v > 90 ? 2 : 8));
  const clearance = useTransform(() => {
    const h = envH.get() || 1;
    return envY.get() - ((CARD_SLOT_TOP + CARD_SLOT_HEIGHT) * h + cardY.get());
  });
  const cardZ = useTransform(clearance, (v) => (v >= 0 ? 14 : 3));
  // the pocket's shade on the card lifts only once the card has left it
  const pocketShade = useTransform(() => {
    const h = envH.get() || 1;
    return warm(1 - Math.max(0, clearance.get()) / (0.1 * h));
  });

  const tiltX = useSpring(0, { stiffness: 80, damping: 20, mass: 0.9 });
  const tiltY = useSpring(0, { stiffness: 80, damping: 20, mass: 0.9 });
  useEffect(() => {
    if (reduce || !finePointer) return;
    const onMove = (e: PointerEvent) => {
      if (openingRef.current) return;
      tiltY.set((e.clientX / window.innerWidth - 0.5) * 7);
      tiltX.set(-(e.clientY / window.innerHeight - 0.5) * 6);
    };
    const onLeave = () => {
      tiltX.set(0);
      tiltY.set(0);
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, finePointer, tiltX, tiltY]);

  async function open() {
    if (openingRef.current || !ready) return;
    openingRef.current = true;
    // no React render at the tap: the button, the breathing and the foil
    // shimmer are all switched off through the DOM
    if (buttonRef.current) buttonRef.current.disabled = true;
    stageRef.current?.setAttribute("data-opening", "");
    tiltX.set(0);
    tiltY.set(0);
    navigator.vibrate?.(8);
    // must run inside the tap itself, before anything is awaited
    music.prime();

    if (reduce) {
      music.start();
      await animate(stageFade, 0, { duration: 0.5 });
      onOpened();
      return;
    }

    const frame = frameRef.current!;
    const eh = frame.offsetHeight;
    envH.set(eh);
    const vh = window.innerHeight;
    const cardW = probeRef.current!.offsetWidth;
    const readingScale = cardW / (frame.offsetWidth * 0.88);

    // Beat 2 framing: pull back and tilt up until the open flap and the whole
    // envelope are on screen.
    const span = OPEN_FLAP_REACH + 1;
    const camOpen = Math.min(0.95, Math.max(0.6, (0.9 * vh) / (span * eh)));
    const focusOpen = (1 - OPEN_FLAP_REACH) / 2 - CARD_SLOT_CENTRE;
    // Beat 3: the card centred for reading — or, if it is taller than the
    // screen, top-anchored 24px down (the page scrolls from there).
    const cardH = cardW * (SIZE.card.h / SIZE.card.w);
    const below = Math.max(0, cardH / 2 + 24 - vh / 2);
    const focusEnd = -below / (CAM_END * eh);
    const gone = (vh / 2 + 40) / CAM_END + (1 + OPEN_FLAP_REACH) * eh;

    window.setTimeout(() => navigator.vibrate?.(14), 1000);
    // the song begins as the flap swings open
    window.setTimeout(() => music.start(), 1300);

    await animate([
      // Beat 1 — the seal alone. It gives under the thumb, a line of light
      // runs out from the flap tip, the wax lights up and the room dims.
      [press, [1, 0.99, 1], { at: 0, duration: 0.45, times: [0, 0.25, 1], ease: "easeOut" }],
      [sealPress, [1, 0.95, 1], { at: 0, duration: 0.45, times: [0, 0.25, 1], ease: "easeOut" }],
      [hint, 0, { at: 0, duration: 0.3 }],
      [crack, 1, { at: 0.05, duration: 0.8, ease: [0.3, 0, 0.2, 1] }],
      [dim, 1, { at: 0.1, duration: 0.5, ease: "easeOut" }],
      [sweep, 1, { at: 0.3, duration: 0.75, ease: [0.4, 0, 0.3, 1] }],
      [sealLight, [0, 1, 1, 0], { at: 0.3, duration: 0.85, times: [0, 0.53, 0.82, 1] }],
      [bloom, [0, 1, 1, 0], { at: 0.3, duration: 1.0, times: [0, 0.5, 0.7, 1] }],

      // the snap: the crack flares, the envelope jolts, the cap twists off with
      // the flap and chips of wax skip away
      [crackFlash, [0, 1, 0], { at: 0.96, duration: 0.2, times: [0, 0.35, 1] }],
      [joltY, [0, 1.5, 0], { at: 0.98, duration: 0.2, times: [0, 0.3, 1], ease: "easeOut" }],
      [joltR, [0, -0.4, 0], { at: 0.98, duration: 0.2, times: [0, 0.3, 1], ease: "easeOut" }],
      [crackFade, 0, { at: 1.02, duration: 0.2 }],
      [flap, [0, 8, 8], { at: 1.0, duration: 0.3, times: [0, 0.6, 1], ease: "easeOut" }],
      [capTwist, 5, { at: 1.0, duration: 0.3, ease: "easeOut" }],
      [crumbs, 1, { at: 1.0, duration: 0.45, ease: [0.2, 0.6, 0.35, 1] }],

      // Beat 2 — the flap swings open and settles with a small bounce, the
      // camera easing back so all of it lands in frame; the room light returns
      [
        flap,
        [8, 180, 176.5, 180],
        { at: 1.3, duration: 1.4, times: [0, 0.8, 0.9, 1], ease: [[0.45, 0, 0.3, 1], "easeOut", "easeIn"] },
      ],
      [cam, camOpen, { at: 1.1, duration: 1.4, ease: [0.45, 0, 0.25, 1] }],
      [focusOffset, focusOpen, { at: 1.1, duration: 1.4, ease: [0.45, 0, 0.25, 1] }],
      [dim, 0, { at: 2.0, duration: 0.8 }],

      // Beat 3 — one continuous move: the card rises out while the camera
      // follows it and pushes in, and the envelope slides away below
      [cardY, -RISE * eh, { at: 2.35, duration: 1.05, ease: [0.3, 0, 0.2, 1] }],
      [cardLift, 1, { at: 2.35, duration: 0.5 }],
      [focusOffset, focusEnd, { at: 2.4, duration: 1.5, ease: [0.45, 0, 0.2, 1] }],
      [cam, CAM_END, { at: 2.45, duration: 1.45, ease: [0.45, 0, 0.2, 1] }],
      [envY, gone, { at: 2.45, duration: 1.45, ease: [0.55, 0, 0.85, 0.4] }],
      [
        cardScale,
        [1, (readingScale / CAM_END) * 1.006, readingScale / CAM_END],
        { at: 2.9, duration: 1.05, times: [0, 0.8, 1], ease: [[0.4, 0, 0.2, 1], "easeInOut"] },
      ],
      // and it touches down on the linen
      [cardLift, 0, { at: 3.7, duration: 0.25, ease: "easeOut" }],
    ]);
    onOpened();
  }

  const face: CSSProperties = { backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };
  const flapImg = (src: string) => (
    <Image src={src} alt="" fill loading="eager" onLoad={onLoad} draggable={false} className="select-none" />
  );

  return (
    <>
      <Curtain ready={ready} />

      <motion.div
        ref={stageRef}
        className="fixed inset-0 z-10 flex items-center justify-center overflow-hidden"
        style={{ opacity: stageFade }}
      >
        <div ref={probeRef} aria-hidden className="absolute invisible" style={{ width: "var(--card-w)" }} />

        <motion.div className="relative" style={{ scale: cam, y: camLift, willChange: "transform" }}>
          <motion.div style={{ scale: introScale, opacity: intro }}>
            <motion.div
              ref={frameRef}
              className="relative"
              style={{
                width: "var(--ew)",
                height: "var(--eh)",
                scale: press,
                y: joltY,
                rotate: joltR,
                rotateX: tiltX,
                rotateY: tiltY,
                transformPerspective: 1600,
                perspective: 2400,
              }}
            >
              <Layer
                src={IMG.flapOpenShadow}
                w={SIZE.flap.w}
                h={SIZE.flap.h}
                onLoad={onLoad}
                style={{ ...OPEN_FLAP_SHADOW_LAYER, y: envY, opacity: openFlapShadow, zIndex: 0 }}
              />

              <Layer
                src={IMG.interior}
                w={SIZE.padded.w}
                h={SIZE.padded.h}
                onLoad={onLoad}
                style={{ ...PADDED_LAYER, y: envY, zIndex: 1 }}
              />

              {/* top flap: outer face with the cap of wax, liner on the back face */}
              <motion.div
                className="absolute pointer-events-none"
                style={{
                  ...FLAP_LAYER,
                  y: envY,
                  rotateX: flap,
                  transformOrigin: "50% 0%",
                  transformStyle: "preserve-3d",
                  zIndex: flapZ,
                  willChange: "transform",
                }}
              >
                <div className="absolute inset-0" style={face}>
                  {flapImg(IMG.flapFront)}
                  <FaceTint mask={IMG.flapFront} color="#fffdf8" opacity={frontLight} />
                  <FaceTint mask={IMG.flapFront} color={OVERLAY_TINT} opacity={frontShade} />
                  <motion.div className="absolute" style={{ ...SEAL_IN_FLAP, opacity: cracked, rotate: capTwist }}>
                    <SealPiece src={IMG.sealFlap} press={sealPress} onLoad={onLoad} />
                  </motion.div>
                </div>
                <div className="absolute inset-0" style={{ ...face, transform: "rotateX(180deg)" }}>
                  {flapImg(IMG.flapBack)}
                  <FaceTint mask={IMG.flapBack} color={OVERLAY_TINT} opacity={backShade} />
                </div>
              </motion.div>

              <motion.div
                className="absolute"
                style={{ ...CARD_SLOT, y: cardY, scale: cardScale, zIndex: cardZ, willChange: "transform" }}
              >
                <LetterCard lift={cardLift} onPaperLoad={onLoad} />
              </motion.div>

              {/* inside the pocket the card is in shadow until it has left it */}
              <motion.div
                className="absolute inset-0 z-[4] pointer-events-none"
                style={{ opacity: pocketShade, willChange: "opacity" }}
              >
                <MouthShadows y={envY} />
              </motion.div>

              <Layer
                src={IMG.pocket}
                w={SIZE.padded.w}
                h={SIZE.padded.h}
                onLoad={onLoad}
                style={{ ...PADDED_LAYER, y: envY, zIndex: 5 }}
              />
              <MouthEdges y={envY} />

              <EnvelopeNames y={envY} />

              <motion.div
                className="absolute pointer-events-none"
                style={{ ...PADDED_LAYER, y: envY, zIndex: 7, willChange: "transform" }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ transform: flapShadowTransform, transformOrigin: PADDED_HINGE_ORIGIN, willChange: "transform" }}
                >
                  <motion.div className="absolute inset-0" style={{ opacity: flapShadowCrisp, willChange: "opacity" }}>
                    {flapImg(IMG.flapShadow)}
                  </motion.div>
                  <motion.div className="absolute inset-0" style={{ opacity: flapShadowSoft, willChange: "opacity" }}>
                    <Image src={IMG.flapShadowSoft} alt="" fill loading="eager" draggable={false} className="select-none" />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* the room dims toward the edges while the light comes out of the
                  wax — sized to cover the screen at the widest camera shot, no
                  bigger (it is a GPU texture) */}
              <motion.div
                aria-hidden
                className="absolute -inset-x-[190%] -inset-y-[70%] z-[9] pointer-events-none"
                style={{
                  opacity: dimOpacity,
                  willChange: "opacity",
                  background:
                    "radial-gradient(circle at 50% 48.7%, rgba(46,34,24,0.04) 0, rgba(46,34,24,0.1) calc(var(--ew) * 0.45), rgba(40,30,22,0.24) calc(var(--ew) * 1.3), rgba(36,28,22,0.3) calc(var(--ew) * 2.4))",
                }}
              />

              <motion.div
                className="absolute z-[10] pointer-events-none"
                style={{ ...SEAL_IN_FRAME, y: envY, willChange: "transform" }}
              >
                <SealBloom amount={bloom} onLoad={onLoad} />
              </motion.div>

              <motion.div
                className="absolute z-[11] pointer-events-none"
                style={{ ...SEAL_IN_FRAME, y: envY, willChange: "transform" }}
              >
                <motion.div className="absolute inset-0" style={{ opacity: whole }}>
                  <SealWhole press={sealPress} breathing={ready} onLoad={onLoad} />
                </motion.div>
                <motion.div className="absolute inset-0" style={{ opacity: cracked }}>
                  <SealPiece src={IMG.sealBody} press={sealPress} onLoad={onLoad} />
                </motion.div>
                <SealCrumbs progress={crumbs} />
              </motion.div>

              <motion.div
                className="absolute z-[12] pointer-events-none"
                style={{ ...SEAL_IN_FRAME, y: envY, willChange: "transform" }}
              >
                <SealSheen sweep={sweep} press={sealPress} />
                <SealLight amount={sealLight} press={sealPress} onLoad={onLoad} />
                <CrackLight draw={crack} opacity={crackFade} flash={crackFlash} />
              </motion.div>

              <button
                ref={buttonRef}
                type="button"
                onClick={open}
                aria-label="Open the invitation"
                className="absolute inset-0 z-[13] cursor-pointer disabled:cursor-default rounded-[2%] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-silver"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ top: "calc(50% + var(--eh) / 2 + 2svh)", opacity: hintOpacity }}
        >
          <div
            className="absolute -inset-x-10 -inset-y-4"
            style={{ background: "radial-gradient(closest-side, rgba(244,240,233,0.82) 35%, rgba(244,240,233,0) 100%)" }}
          />
          <div className="relative flex items-center gap-3">
            <span className="h-px w-7 bg-ink/40 origin-right animate-[hint-line_2.8s_ease-in-out_infinite]" />
            <span className="font-sans text-[13px] tracking-[0.2em] uppercase text-ink whitespace-nowrap">
              {finePointer ? "Click" : "Tap"} the seal to open
            </span>
            <span className="h-px w-7 bg-ink/40 origin-left animate-[hint-line_2.8s_ease-in-out_infinite]" />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
