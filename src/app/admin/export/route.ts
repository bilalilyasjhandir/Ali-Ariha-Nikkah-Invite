import { isAdmin } from "@/lib/admin-auth";
import { listRsvps, StorageNotConfiguredError, type Rsvp } from "@/lib/rsvp-store";
import { londonStamp } from "../format";

const PRIVATE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

// Every cell quoted, quotes doubled. Guests type the names and blessings, so a
// cell that would start a spreadsheet formula gets a leading apostrophe.
function cell(value: string | number) {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Please sign in at /admin first.", { status: 401, headers: PRIVATE });
  }

  let rsvps: Rsvp[];
  try {
    rsvps = await listRsvps();
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) return new Response(e.message, { status: 503, headers: PRIVATE });
    throw e;
  }

  const rows = [
    ["Received (UK time)", "Name", "Reply", "Guests", "Blessing"],
    ...rsvps.map((r) => [
      londonStamp(r.createdAt),
      r.name,
      r.attending ? "Attending" : "Declined",
      r.attending ? r.guests : 0,
      r.blessing ?? "",
    ]),
  ];
  // the BOM tells Excel the file is UTF-8, so names like "Zoë" survive
  const csv = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  const today = londonStamp(new Date().toISOString()).slice(0, 10);

  return new Response(csv, {
    headers: {
      ...PRIVATE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rsvps-ali-ariha-${today}.csv"`,
    },
  });
}
