// Times shown to the couple are UK wall-clock time, whatever the server's zone.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function london(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(parts.formatToParts(d).map((x) => [x.type, x.value]));
  return { year: p.year, month: Number(p.month), day: Number(p.day), time: `${p.hour}:${p.minute}` };
}

// { date: "26 Sep 2026", time: "14:05" }
export function londonDate(iso: string) {
  const t = london(iso);
  return t ? { date: `${t.day} ${MONTHS[t.month - 1]} ${t.year}`, time: t.time } : { date: "—", time: "" };
}

// "2026-09-26 14:05", which spreadsheets sort and recognise as a date
export function londonStamp(iso: string) {
  const t = london(iso);
  if (!t) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.year}-${pad(t.month)}-${pad(t.day)} ${t.time}`;
}

export const guestsLabel = (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`;
