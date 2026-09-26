"use server";

import { headers } from "next/headers";
import { BLESSING_MAX, GUESTS_MAX, NAME_MAX } from "@/components/sections/RsvpRules";
import { addRsvp, allowSubmission } from "@/lib/rsvp-store";

export type RsvpField = "name" | "attending" | "guests" | "blessing";

export type RsvpState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<RsvpField, string>> }
  | { status: "error"; error: string }
  | { status: "success"; name: string; attending: boolean };

const MESSAGES = {
  name: "Please tell us your name.",
  // each fits on the one line where the field's caption sits
  nameLong: `Please keep it under ${NAME_MAX} characters.`,
  attending: "Please let us know if you can join us.",
  guests: `Please choose 1 to ${GUESTS_MAX} guests.`,
  blessingLong: `Please keep it under ${BLESSING_MAX} characters.`,
  busy: "We’ve had a lot of replies from here just now. Please try again a little later.",
  closed: "Sorry — RSVPs aren’t open just yet. Please try again a little later.",
};

// FormData values can be files; anything that isn't plain text counts as empty.
const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

// C0/C1 control characters (and stray line/paragraph separators); newlines are
// handled separately so a blessing can keep its line breaks.
const CONTROL = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u2028\u2029]/g;

function cleanName(raw: string) {
  return raw.normalize("NFC").replace(/[\r\n]+/g, " ").replace(CONTROL, "").replace(/\s+/g, " ").trim();
}

function cleanBlessing(raw: string) {
  return raw
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "unknown";
}

export async function submitRsvp(_prev: RsvpState, form: FormData): Promise<RsvpState> {
  const name = cleanName(text(form.get("name")));

  // Bots fill every field they find; a person never sees this one. Pretend it
  // worked so the bot moves on, and keep nothing.
  if (text(form.get("website")).trim()) return { status: "success", name, attending: true };

  const choice = text(form.get("attending"));
  const attending = choice === "yes" ? true : choice === "no" ? false : null;
  const blessing = cleanBlessing(text(form.get("blessing")));
  const guestsRaw = text(form.get("guests")).trim();
  const guests = /^\d{1,2}$/.test(guestsRaw) ? Number(guestsRaw) : NaN;

  const fieldErrors: Partial<Record<RsvpField, string>> = {};
  if (!name) fieldErrors.name = MESSAGES.name;
  else if ([...name].length > NAME_MAX) fieldErrors.name = MESSAGES.nameLong;
  if (attending === null) fieldErrors.attending = MESSAGES.attending;
  if (attending && !(guests >= 1 && guests <= GUESTS_MAX)) fieldErrors.guests = MESSAGES.guests;
  if ([...blessing].length > BLESSING_MAX) fieldErrors.blessing = MESSAGES.blessingLong;
  if (Object.keys(fieldErrors).length || attending === null) return { status: "invalid", fieldErrors };

  try {
    // counted after validation, so a guest correcting a typo never locks themselves out
    if (!(await allowSubmission(await clientIp()))) return { status: "error", error: MESSAGES.busy };
    await addRsvp({ name, attending, guests: attending ? guests : 0, blessing });
  } catch (err) {
    console.error("[rsvp] could not save a reply:", err);
    return { status: "error", error: MESSAGES.closed };
  }

  return { status: "success", name, attending };
}
