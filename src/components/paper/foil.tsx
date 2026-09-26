import type { CSSProperties, ReactNode } from "react";
import { IMG, SIZE } from "../opening/geometry";

// Silver foil: a narrow glint that never bleaches the letters below ~3:1.
export const FOIL =
  "linear-gradient(112deg, #56606a 0%, #8c959e 20%, #c3c9ce 28%, #7a838c 36%, #5d6771 54%, #9aa2aa 72%, #5a646e 100%)";

// foil pressed into cotton: a bright lower lip where the impression catches the light
export const FOIL_EDGE =
  "drop-shadow(0 0.6px 0 rgba(255,255,255,0.75)) drop-shadow(0 -0.4px 0.4px rgba(40,44,52,0.35))";

// letterpress ink: the same lip, fainter
export const PRESS: CSSProperties = {
  textShadow: "0 1px 0 rgba(255,255,255,0.55), 0 -0.5px 0 rgba(40,30,20,0.12)",
};

export const maskOf = (url: string, size = "contain"): CSSProperties => ({
  maskImage: `url(${url})`,
  WebkitMaskImage: `url(${url})`,
  maskSize: size,
  WebkitMaskSize: size,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
});

const foilClip: CSSProperties = {
  background: FOIL,
  backgroundSize: "300% 100%",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

// Any text set in silver foil. Pass the typography through className.
export function FoilText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className="inline-block" style={{ filter: FOIL_EDGE }}>
      <span className={`inline-block animate-[foil-sheen_7s_ease-in-out_infinite] ${className}`} style={foilClip}>
        {children}
      </span>
    </span>
  );
}

export function FoilMonogram({ className = "w-[7.5cqw]" }: { className?: string }) {
  return (
    <div className={className} style={{ filter: FOIL_EDGE }}>
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

export function FoilRule({ width = "13cqw" }: { width?: string }) {
  const line: CSSProperties = { background: FOIL, backgroundSize: "300% 100%" };
  return (
    <div className="flex items-center gap-[2.2cqw]" style={{ filter: "drop-shadow(0 0.5px 0 rgba(255,255,255,0.7))" }}>
      <span className="h-px animate-[foil-sheen_7s_ease-in-out_infinite]" style={{ ...line, width }} />
      <span className="size-[1.5cqw] rotate-45 animate-[foil-sheen_7s_ease-in-out_infinite]" style={line} />
      <span className="h-px animate-[foil-sheen_7s_ease-in-out_infinite]" style={{ ...line, width }} />
    </div>
  );
}

export function FoilAmpersand({ className = "text-[10.5cqw]" }: { className?: string }) {
  return <FoilText className={`block font-serif italic leading-[0.9] ${className}`}>&amp;</FoilText>;
}
