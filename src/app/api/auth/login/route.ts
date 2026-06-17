import { NextResponse } from "next/server";
import { authEnabled, authorizeUrl, codeChallenge, randomToken, STATE_COOKIE, VERIFIER_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  if (!authEnabled()) {
    return NextResponse.redirect(new URL("/", origin));
  }
  const state = randomToken(16);
  const verifier = randomToken(32);
  const url = authorizeUrl({ origin, state, challenge: codeChallenge(verifier) });

  const res = NextResponse.redirect(url);
  const opts = { httpOnly: true, secure: origin.startsWith("https"), sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set(STATE_COOKIE, state, opts);
  res.cookies.set(VERIFIER_COOKIE, verifier, opts);
  return res;
}
