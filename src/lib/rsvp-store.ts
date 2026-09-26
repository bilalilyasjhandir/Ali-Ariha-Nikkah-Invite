import { Redis } from "@upstash/redis";
import { promises as fs } from "node:fs";
import path from "node:path";

// Where RSVPs are kept. On Vercel: an Upstash Redis database (added from the
// project's Storage tab, which injects the KV_REST_API_* variables). On your own
// machine without those variables: a JSON file in .data/ (gitignored).

export type Rsvp = {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
  blessing: string;
  createdAt: string;
};

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("RSVP storage is not configured: connect an Upstash Redis database to this Vercel project.");
  }
}

const KEY = "rsvps";

function redis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

const FILE = path.join(process.cwd(), ".data", "rsvps.json");

async function readFile(): Promise<Record<string, Rsvp>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

async function writeFile(all: Record<string, Rsvp>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2));
}

function local() {
  // a deployed site's filesystem is read-only and per-instance: never fall back there
  if (process.env.NODE_ENV === "production") throw new StorageNotConfiguredError();
}

// Upstash parses JSON values back into objects on read; accept either form.
const parse = (v: unknown): Rsvp => (typeof v === "string" ? JSON.parse(v) : (v as Rsvp));

export async function listRsvps(): Promise<Rsvp[]> {
  const r = redis();
  let all: Rsvp[];
  if (r) {
    const map = (await r.hgetall<Record<string, unknown>>(KEY)) ?? {};
    all = Object.values(map).map(parse);
  } else {
    local();
    all = Object.values(await readFile());
  }
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addRsvp(input: Omit<Rsvp, "id" | "createdAt">): Promise<Rsvp> {
  const rsvp: Rsvp = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const r = redis();
  if (r) {
    await r.hset(KEY, { [rsvp.id]: JSON.stringify(rsvp) });
  } else {
    local();
    const all = await readFile();
    all[rsvp.id] = rsvp;
    await writeFile(all);
  }
  return rsvp;
}

export async function deleteRsvp(id: string): Promise<void> {
  const r = redis();
  if (r) {
    await r.hdel(KEY, id);
  } else {
    local();
    const all = await readFile();
    delete all[id];
    await writeFile(all);
  }
}

// At most `limit` submissions per key per hour. Only enforced where Redis is
// available; locally it always allows.
export async function allowSubmission(key: string, limit = 8): Promise<boolean> {
  const r = redis();
  if (!r) return true;
  const k = `rl:rsvp:${key}`;
  const n = await r.incr(k);
  if (n === 1) await r.expire(k, 3600);
  return n <= limit;
}
