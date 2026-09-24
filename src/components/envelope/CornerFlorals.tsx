import Image from "next/image";

export function CornerFlorals() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-6 -right-8 w-[46vw] max-w-[320px] min-w-[190px] opacity-95 animate-[sway_9s_ease-in-out_infinite]">
        <Image
          src="/images/flower-top-right.webp"
          alt=""
          width={535}
          height={620}
          priority
          className="w-full h-auto select-none"
        />
      </div>
      <div className="absolute -bottom-8 -left-8 w-[50vw] max-w-[360px] min-w-[210px] opacity-95 animate-[sway_11s_ease-in-out_infinite_0.5s]">
        <Image
          src="/images/flower-bottom-left.webp"
          alt=""
          width={780}
          height={626}
          priority
          className="w-full h-auto select-none"
        />
      </div>
    </div>
  );
}
