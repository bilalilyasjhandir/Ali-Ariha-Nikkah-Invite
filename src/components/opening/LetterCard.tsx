"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import type { CSSProperties } from "react";
import { IMG, SIZE } from "./geometry";

const FOIL =
  "linear-gradient(112deg, #56606a 0%, #8c959e 20%, #c3c9ce 28%, #7a838c 36%, #5d6771 54%, #9aa2aa 72%, #5a646e 100%)";

const maskOf = (url: string, size = "contain"): CSSProperties => ({
  maskImage: `url(${url})`,
  WebkitMaskImage: `url(${url})`,
  maskSize: size,
  WebkitMaskSize: size,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
});

// foil pressed into cotton: a bright lower lip where the impression catches the light
const FOIL_EDGE = "drop-shadow(0 0.6px 0 rgba(255,255,255,0.75)) drop-shadow(0 -0.4px 0.4px rgba(40,44,52,0.35))";
// letterpress ink: the same lip, fainter
const PRESS: CSSProperties = { textShadow: "0 1px 0 rgba(255,255,255,0.55), 0 -0.5px 0 rgba(40,30,20,0.12)" };

function FoilMonogram() {
  return (
    <div className="w-[7.5cqw]" style={{ filter: FOIL_EDGE }}>
      <div
        className="animate-[foil-sheen_7s_ease-in-out_infinite]"
        style={{
          aspectRatio: `${SIZE.monogram.w} / ${SIZE.monogram.h}`,
          background: FOIL,
          backgroundSize: "320% 100%",
          ...maskOf(IMG.monogram),
        }}
      />
    </div>
  );
}

function FoilRule() {
  const line: CSSProperties = { background: FOIL, backgroundSize: "300% 100%" };
  return (
    <div className="flex items-center gap-[2.2cqw]" style={{ filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.7))" }}>
      <span className="h-px w-[13cqw] animate-[foil-sheen_7s_ease-in-out_infinite]" style={line} />
      <span className="size-[1.5cqw] rotate-45 animate-[foil-sheen_7s_ease-in-out_infinite]" style={line} />
      <span className="h-px w-[13cqw] animate-[foil-sheen_7s_ease-in-out_infinite]" style={line} />
    </div>
  );
}

function FoilAmpersand() {
  return (
    <span className="block" style={{ filter: FOIL_EDGE }}>
      <span
        className="block font-serif italic text-[10.5cqw] leading-[0.9] animate-[foil-sheen_7s_ease-in-out_infinite]"
        style={{
          background: FOIL,
          backgroundSize: "300% 100%",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        &amp;
      </span>
    </span>
  );
}

// A soft shadow cut to the deckle edge. The blur sits on a wrapper so it
// softens the masked shape instead of being clipped by it. Static filters only:
// the landing is a cross-fade between two of these, never an animated filter.
function PaperShadow({
  x,
  y,
  blur,
  alpha,
  opacity,
}: {
  x: string;
  y: string;
  blur: string;
  alpha: number;
  opacity?: MotionValue<number>;
}) {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0"
      style={{ opacity, transform: `translate(${x}, ${y})`, filter: `blur(${blur})`, willChange: "opacity" }}
    >
      <div className="absolute inset-0" style={{ background: `rgba(30,38,46,${alpha})`, ...maskOf(IMG.cardMask, "100% 100%") }} />
    </motion.div>
  );
}

// `lift` 1 = held above the table (soft, far shadow), 0 = resting on it.
export function LetterCard({ lift, onPaperLoad }: { lift?: MotionValue<number>; onPaperLoad?: () => void }) {
  // Never quite 0: the browser skips rasterising invisible layers, and a blur
  // this size rastered for the first time mid-animation stalls the frame.
  const resting = useTransform(() => (lift ? Math.max(0.02, 1 - lift.get()) : 1));
  const lifted = useTransform(() => (lift ? Math.max(0.02, lift.get()) : 0));
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${SIZE.card.w} / ${SIZE.card.h}`, containerType: "inline-size" }}
    >
      {lift && <PaperShadow x="1.8cqw" y="5cqw" blur="5.5cqw" alpha={0.28} opacity={lifted} />}
      <PaperShadow x="0.7cqw" y="1.6cqw" blur="2.2cqw" alpha={0.26} opacity={resting} />
      <PaperShadow x="0.2cqw" y="0.45cqw" blur="0.5cqw" alpha={0.2} opacity={resting} />

      <div className="absolute inset-0 overflow-hidden" style={maskOf(IMG.cardMask, "100% 100%")}>
        <Image
          src={IMG.card}
          alt=""
          fill
          loading="eager"
          onLoad={onPaperLoad}
          draggable={false}
          className="select-none"
        />

        {/* printed watercolour, bleeding off the deckle into the corners */}
        <Image
          src={IMG.flower}
          alt=""
          width={SIZE.flower.w}
          height={SIZE.flower.h}
          loading="eager"
          draggable={false}
          className="absolute w-[31cqw] h-auto -right-[10cqw] -top-[9cqw] rotate-[14deg] opacity-95 select-none"
        />
        <Image
          src={IMG.flower}
          alt=""
          width={SIZE.flower.w}
          height={SIZE.flower.h}
          loading="eager"
          draggable={false}
          className="absolute w-[38cqw] h-auto -left-[10cqw] -bottom-[9cqw] -rotate-[152deg] opacity-95 select-none"
        />

        {/* Nothing above the Bismillah; the monogram signs off at the foot. Each
            parent line sits under its own name. */}
        <div className="absolute inset-[7.8cqw] flex flex-col items-center justify-center text-center px-[1.5cqw] [text-wrap:balance]">
          <p className="font-arabic text-[6.4cqw] leading-[1.5] text-ink" style={PRESS}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="mt-[0.6cqw] font-arabic text-[5.2cqw] leading-[1.5] text-ink" style={PRESS}>
            وَخَلَقْنَاكُمْ أَزْوَاجًا
          </p>
          <p className="mt-[0.8cqw] font-sans text-[3.5cqw] tracking-[0.14em] uppercase text-ink-mid">
            And We created you in pairs
          </p>

          <div className="my-[5cqw]">
            <FoilRule />
          </div>

          <p className="font-sans text-[3.5cqw] tracking-[0.14em] uppercase text-ink-mid">
            Together with their families
          </p>

          <p className="mt-[3.5cqw] font-script text-[11.5cqw] leading-[1.2] text-ink" style={PRESS}>
            Ali Asghar
          </p>
          <p className="font-serif font-medium text-[4.6cqw] leading-[1.35] text-ink/85">
            Son of Mr. &amp; Mrs. Nadeem Asghar
          </p>

          <div className="my-[2.2cqw]">
            <FoilAmpersand />
          </div>

          <p className="font-script text-[11.5cqw] leading-[1.2] text-ink" style={PRESS}>
            Ariha Maryam
          </p>
          <p className="font-serif font-medium text-[4.6cqw] leading-[1.35] text-ink/85">
            Daughter of Mr. &amp; Mrs. Muhammad Akram
          </p>

          <p className="mt-[5.5cqw] font-serif italic text-[4.7cqw] leading-[1.35] text-ink" style={PRESS}>
            joyfully invite you
            <br />
            to celebrate their Nikkah
          </p>

          <div className="mt-[5.5cqw]">
            <FoilMonogram />
          </div>
        </div>
      </div>
    </div>
  );
}
