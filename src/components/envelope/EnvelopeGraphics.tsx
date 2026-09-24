import Image from "next/image";

export const ENVELOPE_VIEWBOX = { width: 320, height: 200 };

export function EnvelopeBack() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      <rect
        x={1}
        y={1}
        width={318}
        height={198}
        rx={10}
        fill="var(--color-paper-card)"
        stroke="var(--color-silver-soft)"
        strokeWidth={1.25}
      />
    </svg>
  );
}

export function EnvelopePocket() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="absolute inset-0 w-full h-full"
      aria-hidden
    >
      <path
        d="M6,46 L160,120 L314,46 L314,190 Q314,194 310,194 L10,194 Q6,194 6,190 Z"
        fill="var(--color-paper-card)"
        stroke="var(--color-silver-soft)"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EnvelopeFlap() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="absolute inset-0 w-full h-full overflow-visible"
      aria-hidden
    >
      <path
        d="M7,7 Q6,6 8,6 L312,6 Q314,6 313,7 L160,120 Z"
        fill="var(--color-paper-card)"
        stroke="var(--color-silver-soft)"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WaxSeal({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute left-1/2 top-[59%] -translate-x-1/2 -translate-y-1/2 ${className}`}
      style={{
        width: "18%",
        aspectRatio: "1 / 1",
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background:
            "radial-gradient(circle at 34% 30%, #d7dade 0%, #aeb3b9 45%, #888e95 100%)",
          boxShadow:
            "0 6px 14px -4px rgba(31,33,43,0.45), inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -2px 3px rgba(0,0,0,0.25)",
        }}
      >
        <Image
          src="/images/monogram.webp"
          alt=""
          aria-hidden
          width={650}
          height={610}
          className="w-[62%] h-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-90 mix-blend-multiply select-none pointer-events-none"
        />
      </div>
    </div>
  );
}
