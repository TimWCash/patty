/**
 * Microsoft 365 integration (Microsoft Graph).
 *
 * Sign-in (src/lib/auth.ts) grants delegated scopes: User.Read, Mail.Read, Files.Read.
 * The access + refresh tokens from sign-in are stored here and used to call Graph:
 *   GET https://graph.microsoft.com/v1.0/me/messages
 *   GET https://graph.microsoft.com/v1.0/me/drive/root/children
 *
 * When no token is stored (not signed in, or Entra not configured) the hub falls
 * back to the seeded sample data and the pages show a "connect" banner.
 */
import { getDb } from "../db";
import { getSetting } from "../queries";
import { authConfig, refreshAccessToken } from "../auth";

function setToken(key: string, value: string) {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

export function storeMicrosoftTokens(t: { accessToken: string; refreshToken: string | null; expiresIn: number; account: string }) {
  setToken("ms_access_token", t.accessToken);
  if (t.refreshToken) setToken("ms_refresh_token", t.refreshToken);
  setToken("ms_token_expires", String(Math.floor(Date.now() / 1000) + t.expiresIn));
  setToken("ms_account", t.account);
}

export function clearMicrosoftTokens() {
  getDb().prepare("DELETE FROM settings WHERE key IN ('ms_access_token','ms_refresh_token','ms_token_expires','ms_account')").run();
}

export function microsoftStatus(): {
  configured: boolean; connected: boolean; account: string | null; mode: "stub" | "live"; sharePointSite: string | null;
} {
  const configured = authConfig().configured;
  const connected = Boolean(getSetting("ms_access_token"));
  return {
    configured,
    connected,
    account: getSetting("ms_account"),
    mode: connected ? "live" : "stub",
    sharePointSite: getSetting("sharepoint_site_url"),
  };
}

/** Returns a currently-valid Graph access token, refreshing if needed, or null. */
async function getGraphToken(): Promise<string | null> {
  const token = getSetting("ms_access_token");
  if (!token) return null;
  const expires = Number(getSetting("ms_token_expires") ?? "0");
  if (expires > Math.floor(Date.now() / 1000) + 60) return token;

  const refresh = getSetting("ms_refresh_token");
  if (!refresh) return token; // no refresh available; try the (possibly stale) token
  const next = await refreshAccessToken(refresh);
  if (!next) return null;
  storeMicrosoftTokens({ ...next, account: getSetting("ms_account") ?? "" });
  return next.accessToken;
}

export interface GraphMessage {
  id: string;
  subject: string;
  from: string;
  fromEmail: string;
  preview: string;
  receivedAt: string;
  direction: "in" | "out";
}

export async function getOutlookMessages(limit = 12): Promise<GraphMessage[] | null> {
  const token = await getGraphToken();
  if (!token) return null;
  try {
    const url = `https://graph.microsoft.com/v1.0/me/messages?$top=${limit}&$select=subject,from,bodyPreview,receivedDateTime&$orderby=receivedDateTime desc`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      value?: { id: string; subject?: string; bodyPreview?: string; receivedDateTime?: string; from?: { emailAddress?: { name?: string; address?: string } } }[];
    };
    const me = (getSetting("ms_account") ?? "").toLowerCase();
    return (data.value ?? []).map((m) => {
      const addr = m.from?.emailAddress;
      return {
        id: m.id,
        subject: m.subject || "(no subject)",
        from: addr?.name ?? addr?.address ?? "Unknown",
        fromEmail: addr?.address ?? "",
        preview: (m.bodyPreview ?? "").slice(0, 160),
        receivedAt: m.receivedDateTime ?? "",
        direction: addr?.address?.toLowerCase() === me ? "out" : "in",
      };
    });
  } catch {
    return null;
  }
}

export interface GraphDriveItem {
  id: string;
  name: string;
  webUrl: string;
  lastModified: string;
  isFolder: boolean;
}

/**
 * List files from a configured SharePoint document library.
 * settings.sharepoint_site_url e.g. "servicephysics.sharepoint.com/sites/Clients".
 * Resolves the site via Graph, then lists the default drive's root children.
 */
export async function getSharePointDocs(limit = 20): Promise<GraphDriveItem[] | null> {
  const token = await getGraphToken();
  const siteUrl = getSetting("sharepoint_site_url");
  if (!token || !siteUrl) return null;
  try {
    const clean = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const slash = clean.indexOf("/");
    const sitePath = slash === -1 ? `${clean}` : `${clean.slice(0, slash)}:${clean.slice(slash)}`;
    const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${sitePath}?$select=id`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!siteRes.ok) return null;
    const siteId = ((await siteRes.json()) as { id?: string }).id;
    if (!siteId) return null;
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root/children?$top=${limit}&$select=name,webUrl,lastModifiedDateTime,folder`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      value?: { id: string; name?: string; webUrl?: string; lastModifiedDateTime?: string; folder?: object }[];
    };
    return (data.value ?? []).map((d) => ({
      id: d.id,
      name: d.name ?? "Untitled",
      webUrl: d.webUrl ?? "#",
      lastModified: d.lastModifiedDateTime ?? "",
      isFolder: Boolean(d.folder),
    }));
  } catch {
    return null;
  }
}

export async function getDriveItems(limit = 15): Promise<GraphDriveItem[] | null> {
  const token = await getGraphToken();
  if (!token) return null;
  try {
    const url = `https://graph.microsoft.com/v1.0/me/drive/root/children?$top=${limit}&$select=name,webUrl,lastModifiedDateTime,folder`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      value?: { id: string; name?: string; webUrl?: string; lastModifiedDateTime?: string; folder?: object }[];
    };
    return (data.value ?? []).map((d) => ({
      id: d.id,
      name: d.name ?? "Untitled",
      webUrl: d.webUrl ?? "#",
      lastModified: d.lastModifiedDateTime ?? "",
      isFolder: Boolean(d.folder),
    }));
  } catch {
    return null;
  }
}
