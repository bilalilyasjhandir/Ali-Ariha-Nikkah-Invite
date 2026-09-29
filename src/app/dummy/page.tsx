import Link from "next/link";

const LINK =
  "flex min-h-[52px] items-center justify-center rounded-full border border-silver/70 bg-white/60 px-6 font-sans text-[13px] tracking-[0.16em] uppercase text-ink transition-colors hover:bg-white/90";

export default function Options() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-silver/60 bg-paper-card/90 px-8 py-10 text-center shadow-[0_2px_12px_rgba(34,28,24,0.12)]">
        <p className="font-sans text-[11px] tracking-[0.24em] uppercase text-ink-mid">The venue card</p>
        <h1 className="mt-2 font-script text-[40px] leading-[1.2] text-ink [text-wrap:balance]">Two ways to reveal it</h1>
        <nav className="mt-7 flex flex-col gap-3">
          <Link href="/dummy/wheel" className={LINK}>
            1 · The spinning wheel
          </Link>
          <Link href="/dummy/compass" className={LINK}>
            2 · The compass &amp; pin
          </Link>
        </nav>
      </div>
    </main>
  );
}
