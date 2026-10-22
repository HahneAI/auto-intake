import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import type { IntakeSubmission } from "@/lib/shop";

export type StoredIntake = IntakeSubmission & {
  id: string;
  receivedAt: string;
  notes: string;
};

// Vercel's Upstash integration injects KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// No Redis configured (local dev): keep submissions in a JSON file so the flow is still testable.
// Not for production; Vercel's filesystem doesn't persist.
const LOCAL_FILE = path.join(process.cwd(), ".data", "intakes.json");

async function readLocal(): Promise<StoredIntake[]> {
  try {
    return JSON.parse(await fs.readFile(LOCAL_FILE, "utf8"));
  } catch {
    return [];
  }
}

async function writeLocal(items: StoredIntake[]) {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(items, null, 2));
}

export const storageConfigured = Boolean(redis);

const INDEX = "intakes";
const key = (id: string) => `intake:${id}`;

export async function saveIntake(data: IntakeSubmission): Promise<StoredIntake> {
  const receivedAt = new Date();
  const item: StoredIntake = {
    ...data,
    id: `${receivedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    receivedAt: receivedAt.toISOString(),
    notes: "",
  };
  if (redis) {
    await redis.set(key(item.id), item);
    await redis.zadd(INDEX, { score: receivedAt.getTime(), member: item.id });
  } else {
    await writeLocal([item, ...(await readLocal())]);
  }
  return item;
}

export async function listIntakes(): Promise<StoredIntake[]> {
  if (!redis) return readLocal();
  const ids = await redis.zrange<string[]>(INDEX, 0, 199, { rev: true });
  if (ids.length === 0) return [];
  const items = await redis.mget<(StoredIntake | null)[]>(...ids.map(key));
  return items.filter((i): i is StoredIntake => i !== null);
}

export async function getIntake(id: string): Promise<StoredIntake | null> {
  if (!redis) return (await readLocal()).find((i) => i.id === id) ?? null;
  return redis.get<StoredIntake>(key(id));
}

export async function updateNotes(id: string, notes: string) {
  if (!redis) {
    await writeLocal((await readLocal()).map((i) => (i.id === id ? { ...i, notes } : i)));
    return;
  }
  const item = await getIntake(id);
  if (item) await redis.set(key(id), { ...item, notes });
}
