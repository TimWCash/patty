import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Microsoft Entra ID (Azure AD) sign-in via OAuth 2.0 authorization-code + PKCE.
 *
 * Configure with environment variables (e.g. in .env.local):
 *   AZURE_AD_TENANT_ID      - directory (tenant) ID, or "common" / "organizations"
 *   AZURE_AD_CLIENT_ID      - application (client) ID from the Entra app registration
 *   AZURE_AD_CLIENT_SECRET  - a client secret value
 *   AUTH_SECRET             - (optional) key used to sign the session cookie;
 *                             falls back to AZURE_AD_CLIENT_SECRET
 *
 * Redirect URI to register in Entra: {origin}/api/auth/callback
 *
 * When AZURE_AD_CLIENT_ID is absent the app runs in open preview mode (no gate).
 */

/** Delegated Graph scopes: sign-in + read mail, OneDrive files, and SharePoint sites. */
export const GRAPH_SCOPES = "openid profile email offline_access User.Read Mail.Read Files.Read.All Sites.Read.All";

export const SESSION_COOKIE = "patty_session";
export const STATE_COOKIE = "patty_oauth_state";
export const VERIFIER_COOKIE = "patty_oauth_verifier";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface AuthConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  configured: boolean;
}

export function authConfig(): AuthConfig {
  const tenantId = process.env.AZURE_AD_TENANT_ID ?? "common";
  const clientId = process.env.AZURE_AD_CLIENT_ID ?? "";
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET ?? "";
  return { tenantId, clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

export function authEnabled(): boolean {
  return authConfig().configured;
}

function signingKey(): string {
  return process.env.AUTH_SECRET || process.env.AZURE_AD_CLIENT_SECRET || "patty-dev-secret";
}

export interface Session {
  sub: string;
  name: string;
  email: string;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export function signSession(data: Omit<Session, "exp">): string {
  const payload: Session = { ...data, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const mac = b64url(crypto.createHmac("sha256", signingKey()).update(body).digest());
  return `${body}.${mac}`;
}

export function verifySessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = b64url(crypto.createHmac("sha256", signingKey()).update(body).digest());
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** PKCE + state helpers (Node runtime). */
export function randomToken(bytes = 32): string {
  return b64url(crypto.randomBytes(bytes));
}

export function codeChallenge(verifier: string): string {
  return b64url(crypto.createHash("sha256").update(verifier).digest());
}

export function authorizeUrl(opts: { origin: string; state: string; challenge: string }): string {
  const { tenantId, clientId } = authConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: `${opts.origin}/api/auth/callback`,
    response_mode: "query",
    scope: GRAPH_SCOPES,
    state: opts.state,
    code_challenge: opts.challenge,
    code_challenge_method: "S256",
  });
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
}

export async function exchangeCode(opts: { origin: string; code: string; verifier: string }): Promise<
  { ok: true; tokens: TokenSet } | { ok: false; error: string }
> {
  const { tenantId, clientId, clientSecret } = authConfig();
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code: opts.code,
      redirect_uri: `${opts.origin}/api/auth/callback`,
      code_verifier: opts.verifier,
      scope: GRAPH_SCOPES,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `Token exchange failed (${res.status}): ${text.slice(0, 200)}` };
  }
  const data = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token) return { ok: false, error: "No access token returned." };
  return {
    ok: true,
    tokens: { accessToken: data.access_token, refreshToken: data.refresh_token ?? null, expiresIn: data.expires_in ?? 3600 },
  };
}

/** Refresh an expired access token using the stored refresh token. */
export async function refreshAccessToken(refreshToken: string): Promise<TokenSet | null> {
  const { tenantId, clientId, clientSecret } = authConfig();
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: GRAPH_SCOPES,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  return { accessToken: data.access_token, refreshToken: data.refresh_token ?? refreshToken, expiresIn: data.expires_in ?? 3600 };
}

export async function fetchProfile(accessToken: string): Promise<{ sub: string; name: string; email: string }> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return { sub: "unknown", name: "Microsoft user", email: "" };
  const me = (await res.json()) as { id?: string; displayName?: string; mail?: string; userPrincipalName?: string };
  return {
    sub: me.id ?? "unknown",
    name: me.displayName ?? "Microsoft user",
    email: me.mail ?? me.userPrincipalName ?? "",
  };
}
