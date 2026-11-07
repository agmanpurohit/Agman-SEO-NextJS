import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, makeSession } from "@/lib/audit/admin-auth";
import { overLimit, currentCount, clientIp, hashIp } from "@/lib/audit/ratelimit";
import { ensureSchema } from "@/lib/audit/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Brute-force protection: 5 tries per IP per 15 minutes, plus a site-wide cap on failed
// logins so an attacker spreading guesses across many IPs is stopped too.
const PER_IP = { limit: 5, window: 900 };
const GLOBAL_FAILS = { key: "admin-login-fail:all", limit: 40, window: 3600 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  await ensureSchema();
  if (await overLimit(`admin-login:${hashIp(clientIp(req))}`, PER_IP.limit, PER_IP.window)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  if ((await currentCount(GLOBAL_FAILS.key, GLOBAL_FAILS.window)) >= GLOBAL_FAILS.limit) {
    return NextResponse.json({ error: "Sign-in is paused after too many failed attempts. Try again within the hour." }, { status: 429 });
  }
  let password = "";
  try {
    const b = await req.json();
    password = typeof b.password === "string" ? b.password.slice(0, 200) : "";
  } catch {
    /* empty */
  }
  if (!checkPassword(password)) {
    await overLimit(GLOBAL_FAILS.key, GLOBAL_FAILS.limit, GLOBAL_FAILS.window);
    await sleep(600 + Math.floor(Math.random() * 400)); // slows guessing and evens out timing
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const s = makeSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, s.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: s.maxAge, priority: "high" });
  return res;
}
