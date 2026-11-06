import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkPassword, makeSession } from "@/lib/audit/admin-auth";
import { overLimit, clientIp, hashIp } from "@/lib/audit/ratelimit";
import { ensureSchema } from "@/lib/audit/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureSchema();
  if (await overLimit(`admin-login:${hashIp(clientIp(req))}`, 10, 900)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }
  let password = "";
  try {
    const b = await req.json();
    password = typeof b.password === "string" ? b.password.slice(0, 200) : "";
  } catch {
    /* empty */
  }
  if (!checkPassword(password)) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  const s = makeSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, s.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: s.maxAge });
  return res;
}
