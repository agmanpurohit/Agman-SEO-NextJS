import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal admin session: a signed, expiring, httpOnly cookie. The password and signing
 * secret live only in server environment variables.
 */
export const ADMIN_COOKIE = "ar_admin";
const TTL_SECONDS = 8 * 3600;

const secret = () => {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set (32+ characters)");
  return s;
};
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  // Compare HMACs so length differences don't leak through timing.
  return safeEqual(sign(`pw:${input}`), sign(`pw:${pw}`));
}

export function makeSession() {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const payload = `admin.${exp}`;
  return { value: `${payload}.${sign(payload)}`, maxAge: TTL_SECONDS };
}

export function verifySession(value: string | undefined | null) {
  if (!value) return false;
  const i = value.lastIndexOf(".");
  if (i < 0) return false;
  const payload = value.slice(0, i);
  const sig = value.slice(i + 1);
  try {
    if (!safeEqual(sig, sign(payload))) return false;
  } catch {
    return false;
  }
  const exp = Number(payload.split(".")[1]);
  return Number.isFinite(exp) && exp > Date.now() / 1000;
}

export async function isAdmin() {
  const jar = await cookies();
  return verifySession(jar.get(ADMIN_COOKIE)?.value);
}
