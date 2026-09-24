import Image from "next/image";

export function LetterContent() {
  return (
    <div className="relative flex flex-col items-center text-center px-7 py-10 sm:px-10 sm:py-12">
      <Image
        src="/images/monogram.webp"
        alt=""
        aria-hidden
        width={650}
        height={610}
        className="pointer-events-none select-none absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-auto opacity-70"
      />

      <p className="mt-10 font-arabic text-2xl sm:text-3xl text-ink leading-relaxed">
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </p>

      <p className="mt-5 font-arabic text-xl sm:text-2xl text-ink">
        وَخَلَقْنَاكُمْ أَزْوَاجًا
      </p>
      <p className="mt-1.5 font-sans text-[11px] tracking-[0.18em] uppercase text-ink-soft">
        And We created you in pairs
      </p>

      <div className="my-7 flex items-center gap-3 text-silver">
        <span className="h-px w-10 bg-silver-soft" />
        <span className="text-sm">✦</span>
        <span className="h-px w-10 bg-silver-soft" />
      </div>

      <p className="font-sans text-[11px] tracking-[0.28em] uppercase text-ink-soft">
        Together with their families
      </p>

      <p className="mt-6 font-script text-5xl sm:text-6xl leading-none text-ink">
        Ali Asghar
      </p>
      <p className="my-2 font-serif italic text-lg text-silver">&amp;</p>
      <p className="font-script text-5xl sm:text-6xl leading-none text-ink">
        Ariha Maryam
      </p>

      <div className="mt-7 space-y-1.5 font-serif text-[15px] sm:text-base text-ink-soft">
        <p>Son of Mr. &amp; Mrs. Nadeem Asghar</p>
        <p>Daughter of Mr. &amp; Mrs. Muhammad Akram</p>
      </div>

      <p className="mt-8 max-w-[26ch] font-serif text-[15px] sm:text-base italic text-ink">
        joyfully invite you to celebrate their Nikkah
      </p>
    </div>
  );
}
