import { NextResponse } from "next/server";
import {
  authEnabled, exchangeCode, fetchProfile, signSession,
  SESSION_COOKIE, STATE_COOKIE, VERIFIER_COOKIE,
} from "@/lib/auth";
import { storeMicrosoftTokens } from "@/lib/integrations/microsoft";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  if (!authEnabled()) return NextResponse.redirect(new URL("/", origin));

  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent(error)}`, origin));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.match(new RegExp(`${STATE_COOKIE}=([^;]+)`))?.[1];
  const verifier = request.headers.get("cookie")?.match(new RegExp(`${VERIFIER_COOKIE}=([^;]+)`))?.[1];

  if (!code || !state || !cookieState || state !== cookieState || !verifier) {
    return NextResponse.redirect(new URL("/signin?error=invalid_state", origin));
  }

  const exchange = await exchangeCode({ origin, code, verifier: decodeURIComponent(verifier) });
  if (!exchange.ok) {
    return NextResponse.redirect(new URL(`/signin?error=${encodeURIComponent("token_exchange")}`, origin));
  }

  const profile = await fetchProfile(exchange.tokens.accessToken);
  storeMicrosoftTokens({ ...exchange.tokens, account: profile.email });
  const token = signSession(profile);

  const res = NextResponse.redirect(new URL("/", origin));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(VERIFIER_COOKIE);
  return res;
}
