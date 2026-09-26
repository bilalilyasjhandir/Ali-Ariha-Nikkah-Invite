"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { adminConfigured, endSession, isAdmin, passwordMatches, startSession } from "@/lib/admin-auth";
import { allowSubmission, deleteRsvp } from "@/lib/rsvp-store";

// Each action is its own public POST endpoint, so each checks the session
// itself: the page only showing a button to signed-in visitors proves nothing.

export type LoginState = { error: string | null };

async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return `admin-login:${ip}`;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!adminConfigured()) return { error: "The admin password hasn’t been set up yet." };
  if (await isAdmin()) {
    revalidatePath("/admin");
    return { error: null };
  }

  // a per-visitor ceiling on guesses (enforced where Redis is connected)
  let allowed = true;
  try {
    allowed = await allowSubmission(await clientKey(), 12);
  } catch {}
  if (!allowed) return { error: "Too many attempts. Please wait an hour and try again." };

  const input = formData.get("password");
  if (typeof input !== "string" || input.length > 200 || !passwordMatches(input)) {
    // slows guessing without being noticeable to someone who simply mistyped
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    return { error: "That password doesn’t match. Please try again." };
  }

  await startSession();
  revalidatePath("/admin");
  return { error: null };
}

// Signing out needs no privilege, and clearing the cookie unconditionally also
// removes one that has gone stale.
export async function logout() {
  await endSession();
  revalidatePath("/admin");
}

export type DeleteResult = { ok: true } | { ok: false; error: string };

export async function removeRsvp(id: unknown): Promise<DeleteResult> {
  if (!(await isAdmin())) return { ok: false, error: "Your session has ended. Please sign in again." };
  if (typeof id !== "string" || !/^[\w-]{1,64}$/.test(id)) return { ok: false, error: "That reply couldn’t be found." };
  try {
    await deleteRsvp(id);
  } catch {
    return { ok: false, error: "It couldn’t be deleted. Please try again." };
  }
  revalidatePath("/admin");
  return { ok: true };
}
