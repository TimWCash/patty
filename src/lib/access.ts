import { cookies } from "next/headers";
import { getDb } from "./db";
import { getSession, authEnabled } from "./auth";
import { type Role, type Perms, permsFor, isRole } from "./roles";

export interface CurrentUser {
  name: string;
  email: string;
  role: Role;
  preview: boolean; // true when running without Entra (open preview mode)
}

const VIEW_AS_COOKIE = "patty_viewas";

/**
 * Resolve the current user + role.
 * - Open preview mode (no Entra): a synthetic admin, overridable via a "View as"
 *   cookie so each role can be demoed without real sign-in.
 * - Authed mode: role comes from the users table (live, so changes apply without
 *   re-login). First user (or ADMIN_EMAILS) bootstraps as admin; everyone else
 *   defaults to observer (least privilege).
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  if (!authEnabled()) {
    const viewAs = (await cookies()).get(VIEW_AS_COOKIE)?.value;
    const role: Role = isRole(viewAs) ? viewAs : "admin";
    return { name: "Tim Cashman", email: "tim@servicephysics.com", role, preview: true };
  }

  const session = await getSession();
  if (!session) return { name: "Guest", email: "", role: "observer", preview: false };

  const db = getDb();
  const row = db.prepare("SELECT role FROM users WHERE lower(email) = lower(?)").get(session.email) as { role: string } | undefined;
  let role: Role = isRole(row?.role) ? (row!.role as Role) : "observer";

  if (!row) {
    const adminCount = (db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'admin'").get() as { c: number }).c;
    const envAdmins = (process.env.ADMIN_EMAILS ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
    role = adminCount === 0 || envAdmins.includes(session.email.toLowerCase()) ? "admin" : "observer";
    db.prepare("INSERT INTO users (email, name, role) VALUES (?,?,?) ON CONFLICT(email) DO UPDATE SET name = excluded.name").run(session.email, session.name, role);
  }
  return { name: session.name, email: session.email, role, preview: false };
}

export async function getPerms(): Promise<Perms> {
  return permsFor((await getCurrentUser()).role);
}
