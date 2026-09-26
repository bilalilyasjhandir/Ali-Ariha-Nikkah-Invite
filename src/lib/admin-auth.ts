import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Access to /admin. The only secret is ADMIN_PASSWORD (never in the code). The
// session cookie carries an expiry signed with that password, so a stolen
// cookie dies after 7 days and changing the password signs everyone out.

const COOKIE = "ali_ariha_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

const password = () => process.env.ADMIN_PASSWORD || null;

export const adminConfigured = () => password() !== null;

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

export function passwordMatches(input: string): boolean {
  const pw = password();
  if (!pw) return false;
  // hashing first makes both sides the same length, so the comparison time
  // reveals nothing about the password's length or its first matching letters
  return timingSafeEqual(digest(input), digest(pw));
}

const sign = (pw: string, expires: number) =>
  createHmac("sha256", pw).update(`admin-session:${expires}`).digest("base64url");

function verify(token: string, pw: string): boolean {
  const [exp, sig] = token.split(".");
  const expires = Number(exp);
  const now = Math.floor(Date.now() / 1000);
  if (!sig || !Number.isInteger(expires) || expires <= now || expires > now + MAX_AGE + 60) return false;
  const expected = Buffer.from(sign(pw, expires));
  const given = Buffer.from(sig);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function isAdmin(): Promise<boolean> {
  const pw = password();
  if (!pw) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  return !!token && verify(token, pw);
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/admin",
} as const;

// Server Functions / Route Handlers only: cookies can't be written while a page renders.
export async function startSession() {
  const pw = password();
  if (!pw) return;
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  (await cookies()).set(COOKIE, `${expires}.${sign(pw, expires)}`, { ...cookieOptions, maxAge: MAX_AGE });
}

export async function endSession() {
  (await cookies()).set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
}
