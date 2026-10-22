import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "tj_admin";

// Cookie holds a hash of the password, so changing ADMIN_PASSWORD logs everyone out
function sessionValue() {
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? createHash("sha256").update(`auto-intake:${pw}`).digest("hex") : null;
}

export function passwordMatches(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pw).digest();
  return timingSafeEqual(a, b);
}

export async function isAdmin() {
  const expected = sessionValue();
  if (!expected) return false;
  return (await cookies()).get(COOKIE)?.value === expected;
}

export async function startSession() {
  (await cookies()).set(COOKIE, sessionValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 90, // stay signed in on his phone for 90 days
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
