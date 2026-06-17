import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { clearMicrosoftTokens } from "@/lib/integrations/microsoft";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  clearMicrosoftTokens();
  const res = NextResponse.redirect(new URL("/signin?signed_out=1", origin));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
