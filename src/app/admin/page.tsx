import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { IMG, SIZE } from "@/components/opening/geometry";
import { FOIL, FOIL_EDGE, maskOf } from "@/components/paper/foil";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { EVENT } from "@/lib/event";
import { listRsvps, StorageNotConfiguredError, type Rsvp } from "@/lib/rsvp-store";
import { logout } from "./actions";
import s from "./admin.module.css";
import { DeleteRsvp } from "./DeleteRsvp";
import { guestsLabel, londonDate } from "./format";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "RSVPs — Ali & Ariha",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { themeColor: "#f4f0e9" };

const eyebrow = "font-sans text-[12px] tracking-[0.2em] uppercase text-ink-mid";
const quietButton =
  "inline-flex min-h-[44px] items-center font-sans text-[12px] tracking-[0.18em] uppercase text-ink-mid transition-colors hover:text-ink hover:underline hover:decoration-silver hover:underline-offset-[5px] outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/60";
const hairline = "h-px bg-silver-soft shadow-[0_1px_0_rgba(255,255,255,0.75)]";

export default async function AdminPage() {
  // the answer depends on the visitor's cookie and the live env: never prerender
  await connection();

  if (!adminConfigured()) {
    return (
      <Shell>
        <Card>
          <CardTitle />
          <p className="mt-7 font-serif text-[19px] leading-snug text-ink text-balance">The admin password hasn&rsquo;t been set up yet.</p>
          <p className="mt-3 font-sans text-[14px] leading-relaxed text-ink-mid text-balance">
            In the Vercel project, open Settings &rarr; Environment Variables, add <span className="font-medium text-ink">ADMIN_PASSWORD</span>, then
            redeploy.
          </p>
        </Card>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell>
        <Card>
          <CardTitle />
          <p className="mt-3 font-serif italic text-[18px] text-ink-mid">For the couple&rsquo;s eyes only</p>
          <LoginForm />
        </Card>
      </Shell>
    );
  }

  let rsvps: Rsvp[] | null = null;
  try {
    rsvps = await listRsvps();
  } catch (e) {
    if (!(e instanceof StorageNotConfiguredError)) throw e;
  }

  return (
    <Shell>
      <main className="mx-auto w-full max-w-[1200px] px-5 pt-7 pb-16 sm:px-8 sm:pt-12 lg:px-12">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <Monogram className="w-[26px] shrink-0 sm:w-[30px]" />
            <div>
              <p className={eyebrow}>Guest replies</p>
              <h1 className="mt-1.5 font-serif text-[36px] font-medium leading-[1.05] text-ink sm:text-[46px]">
                {EVENT.groom.short} <Amp /> {EVENT.bride.short}
              </h1>
            </div>
          </div>
          <form action={logout} className="-mr-1 -mt-2 sm:mt-0">
            <button type="submit" className={`${quietButton} px-1`}>
              Sign out
            </button>
          </form>
        </header>
        <p className="mt-2 pl-[42px] font-serif italic text-[17px] leading-snug text-ink-mid sm:pl-[50px] sm:text-[18px]">
          The Nikkah &middot; {EVENT.date.long}
        </p>
        <div className={`mt-6 sm:mt-9 ${hairline}`} />

        {rsvps === null ? (
          <Notice title="RSVP storage isn’t connected yet.">
            Replies can&rsquo;t be saved or shown until it is. In the Vercel project, open the Storage tab, connect an Upstash Redis
            database to this project, then redeploy.
          </Notice>
        ) : (
          <>
            <Summary rsvps={rsvps} />
            <section aria-labelledby="replies-title" className="mt-12 sm:mt-14">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <h2 id="replies-title" className="font-serif text-[28px] font-medium leading-none text-ink sm:text-[30px]">
                  Replies
                  {rsvps.length > 1 && <span className={`${eyebrow} ml-3 hidden align-middle sm:inline`}>newest first</span>}
                </h2>
                {rsvps.length > 0 && (
                  <a
                    href="/admin/export"
                    download
                    className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-silver/80 bg-paper-card/60 px-5 font-sans text-[12px] tracking-[0.18em] uppercase text-ink transition-colors hover:bg-white/70 active:bg-white/90 outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/60"
                    style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 1px 2px rgba(40,34,28,0.1)" }}
                  >
                    Download CSV
                  </a>
                )}
              </div>
              {rsvps.length === 0 ? (
                <Notice title="No replies yet.">As guests send their RSVP, each one will appear here, newest first.</Notice>
              ) : (
                <List rsvps={rsvps} />
              )}
            </section>
          </>
        )}
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={`${s.paper} min-h-svh text-ink`}>
      {/* the invitation's linen would otherwise show in an overscroll bounce */}
      <style>{`body{background:var(--color-paper-card)}`}</style>
      {children}
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div
        className={`${s.paper} relative w-full max-w-[400px] border border-silver-soft px-8 pt-12 pb-10 text-center sm:px-11`}
        style={{ backgroundColor: "#fbf9f5", boxShadow: "0 1px 2px rgba(40,34,28,0.06), 0 22px 44px -26px rgba(40,34,28,0.32)" }}
      >
        {/* the blind-debossed border line of the invitation cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[9px] border border-[rgba(110,98,86,0.16)]"
          style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.9)" }}
        />
        <div className="relative">{children}</div>
      </div>
    </main>
  );
}

function CardTitle() {
  return (
    <>
      <Monogram className="mx-auto w-[30px]" />
      <p className={`${eyebrow} mt-6`}>Guest replies</p>
      <h1 className="mt-2 font-serif text-[42px] font-medium leading-[1.05] text-ink">
        {EVENT.groom.short} <Amp /> {EVENT.bride.short}
      </h1>
    </>
  );
}

function Summary({ rsvps }: { rsvps: Rsvp[] }) {
  const attending = rsvps.filter((r) => r.attending);
  const tiles = [
    { n: rsvps.length, label: "Responses", note: "replies received" },
    { n: attending.length, label: "Attending", note: "households" },
    { n: attending.reduce((t, r) => t + (Number(r.guests) || 0), 0), label: "Guests", note: "attending in total" },
    { n: rsvps.length - attending.length, label: "Declined", note: "sent regrets" },
  ];
  // hairlines only between tiles: a cross on a phone, three rules on a laptop
  const edges = ["border-r border-b lg:border-b-0", "border-b lg:border-b-0 lg:border-r", "border-r", ""];
  return (
    <dl className="mt-2 grid grid-cols-2 lg:mt-4 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <div key={t.label} className={`flex flex-col items-center border-silver-soft px-3 py-6 text-center sm:py-8 lg:py-9 ${edges[i]}`}>
          <dt className={`${eyebrow} order-2 mt-3`}>{t.label}</dt>
          <dd className="order-1 font-serif text-[44px] font-medium leading-none text-ink tabular-nums lining-nums sm:text-[54px]">
            {t.n}
          </dd>
          <dd className="order-3 mt-1 font-serif italic text-[16px] leading-tight text-ink-mid">{t.note}</dd>
        </div>
      ))}
    </dl>
  );
}

function List({ rsvps }: { rsvps: Rsvp[] }) {
  return (
    <>
      <div
        aria-hidden
        className={`${s.head} mt-8 hidden border-b border-silver-soft pb-3 font-sans text-[11.5px] tracking-[0.2em] uppercase text-ink-mid`}
      >
        <span className={s.name}>Name</span>
        <span className={s.reply}>Reply</span>
        <span className={s.guests}>Guests</span>
        <span className={s.blessing}>Blessing</span>
      </div>
      <ul className="mt-6 space-y-4 lg:mt-0 lg:space-y-0">
        {rsvps.map((r) => (
          <Row key={r.id} r={r} />
        ))}
      </ul>
    </>
  );
}

function Row({ r }: { r: Rsvp }) {
  const { date, time } = londonDate(r.createdAt);
  const guests = Number(r.guests) || 0;
  return (
    <li
      className={`${s.row} border border-silver-soft/90 bg-[#fbf9f5]/80 px-4 pt-4 pb-1 transition-opacity has-[[data-deleting]]:opacity-45 sm:px-5 lg:border-0 lg:border-b lg:bg-transparent lg:px-0 lg:pt-6 lg:pb-6`}
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.7)" }}
    >
      <p dir="auto" className={`${s.name} ${s.guestText} text-[21px] font-medium leading-tight text-ink break-words lg:text-[22px]`}>
        {r.name}
      </p>
      <p className={`${s.time} mt-2 justify-self-end font-sans text-[14px] text-ink-mid lg:mt-1.5 lg:justify-self-start lg:text-[13.5px]`}>
        <span className="sr-only">Received </span>
        {date}
        {time && <> &middot; {time}</>}
      </p>
      <div className={`${s.reply} justify-self-end lg:justify-self-start lg:pt-1`}>
        <Badge attending={r.attending} />
      </div>
      <p className={`${s.guests} mt-2 font-sans text-[14px] text-ink-mid lg:mt-0 lg:pt-1 lg:text-[16px] lg:text-ink`}>
        {r.attending ? (
          <>
            <span className="lg:hidden">{guestsLabel(guests)}</span>
            <span className="hidden lg:inline">
              <span className="sr-only">Guests: </span>
              {guests}
            </span>
          </>
        ) : (
          <span className="hidden lg:inline" aria-label="No guests">
            &mdash;
          </span>
        )}
      </p>
      <p
        dir="auto"
        className={`${s.blessing} ${s.guestText} ${r.blessing ? "mt-3" : "hidden lg:block"} italic text-[18px] leading-[1.45] text-ink/90 whitespace-pre-line break-words lg:mt-0 lg:pt-px`}
      >
        {r.blessing ? r.blessing : <span className="not-italic text-ink-soft">&mdash;</span>}
      </p>
      <div className={`${s.action} justify-self-end lg:-mt-2`}>
        <DeleteRsvp id={r.id} name={r.name} />
      </div>
    </li>
  );
}

function Badge({ attending }: { attending: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-[3px] font-sans text-[11px] tracking-[0.16em] uppercase ${
        attending ? "border-ink/25 bg-ink/[0.045] text-ink" : "border-silver-soft text-ink-mid"
      }`}
    >
      <span aria-hidden className={`size-[5px] rotate-45 ${attending ? "bg-ink/70" : "border border-ink-mid/60"}`} />
      {attending ? "Attending" : "Declined"}
    </span>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[30rem] py-16 text-center sm:py-20">
      <Diamond />
      <p className="mt-6 font-serif italic text-[23px] leading-snug text-ink text-balance">{title}</p>
      <p className="mt-2 font-sans text-[14px] leading-relaxed text-ink-mid text-balance">{children}</p>
    </div>
  );
}

// Silver foil, printed rather than shimmering: this is a working page.
const foilFill = { background: FOIL, backgroundSize: "300% 100%" };

function Monogram({ className }: { className: string }) {
  return (
    <div aria-hidden className={className} style={{ filter: FOIL_EDGE }}>
      <div style={{ aspectRatio: `${SIZE.monogram.w} / ${SIZE.monogram.h}`, ...foilFill, ...maskOf(IMG.monogram) }} />
    </div>
  );
}

function Amp() {
  return (
    <span className="inline-block px-[0.04em] font-normal italic" style={{ filter: FOIL_EDGE }}>
      <span style={{ ...foilFill, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>&amp;</span>
    </span>
  );
}

function Diamond() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-3">
      <span className="h-px w-16" style={{ background: "linear-gradient(90deg, transparent, var(--color-silver))" }} />
      <span className="size-[6px] rotate-45" style={foilFill} />
      <span className="h-px w-16" style={{ background: "linear-gradient(90deg, var(--color-silver), transparent)" }} />
    </div>
  );
}
