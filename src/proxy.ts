import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route gate for Microsoft Entra ID sign-in.
 * - If AZURE_AD_CLIENT_ID is not set, the app runs open (preview mode): no gate.
 * - If set, unauthenticated requests are redirected to /signin.
 * Session cookies are HMAC-verified here with Web Crypto so it works at the edge;
 * the signing must match src/lib/auth.ts.
 */

const SESSION_COOKIE = "patty_session";

function signingKey(): string {
  return process.env.AUTH_SECRET || process.env.AZURE_AD_CLIENT_SECRET || "patty-dev-secret";
}

function b64urlFromBytes(bytes: ArrayBuffer): string {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function jsonFromB64url(s: string): unknown {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  let out = "";
  for (let i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i));
  return JSON.parse(decodeURIComponent(escape(out)));
}

async function verify(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [body, mac] = token.split(".");
  if (!body || !mac) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(signingKey()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    if (b64urlFromBytes(sig) !== mac) return false;
    const payload = jsonFromB64url(body) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  if (!process.env.AZURE_AD_CLIENT_ID) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/leads") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const ok = await verify(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  const signin = new URL("/signin", request.url);
  return NextResponse.redirect(signin);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
