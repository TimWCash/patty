import { getDb } from "./db";
import type {
  Activity, Company, CompanyWithLastEmail, Contact, ContactWithLastEmail,
  DocumentRow, Email, Engagement, Meeting, TaskRow,
} from "./types";

const LAST_EMAIL_JOIN = `
  LEFT JOIN (
    SELECT e1.* FROM emails e1
    JOIN (SELECT %KEY%, MAX(sent_at) AS max_sent FROM emails GROUP BY %KEY%) latest
      ON e1.%KEY% = latest.%KEY% AND e1.sent_at = latest.max_sent
    GROUP BY e1.%KEY%
  ) le ON le.%KEY% = %TBL%.id
`;

export function listCompanies(q?: string, status?: string): CompanyWithLastEmail[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (q) { where.push("c.name LIKE ?"); params.push(`%${q}%`); }
  if (status) { where.push("c.status = ?"); params.push(status); }
  return db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id) AS contact_count,
      le.sent_at AS last_email_at, le.subject AS last_email_subject,
      le.snippet AS last_email_snippet, le.direction AS last_email_direction
    FROM companies c
    ${LAST_EMAIL_JOIN.replaceAll("%KEY%", "company_id").replaceAll("%TBL%", "c")}
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY le.sent_at DESC NULLS LAST, c.name
  `).all(...params) as CompanyWithLastEmail[];
}

export function getCompany(id: number): Company | undefined {
  return getDb().prepare("SELECT * FROM companies WHERE id = ?").get(id) as Company | undefined;
}

export function listContacts(q?: string, companyId?: number): ContactWithLastEmail[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (q) { where.push("(ct.name LIKE ? OR ct.email LIKE ? OR co.name LIKE ?)"); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (companyId) { where.push("ct.company_id = ?"); params.push(companyId); }
  return db.prepare(`
    SELECT ct.*, co.name AS company_name,
      le.sent_at AS last_email_at, le.subject AS last_email_subject,
      le.snippet AS last_email_snippet, le.direction AS last_email_direction
    FROM contacts ct
    JOIN companies co ON co.id = ct.company_id
    ${LAST_EMAIL_JOIN.replaceAll("%KEY%", "contact_id").replaceAll("%TBL%", "ct")}
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY le.sent_at DESC NULLS LAST, ct.name
  `).all(...params) as ContactWithLastEmail[];
}

export function getContact(id: number): ContactWithLastEmail | undefined {
  return getDb().prepare(`
    SELECT ct.*, co.name AS company_name,
      le.sent_at AS last_email_at, le.subject AS last_email_subject,
      le.snippet AS last_email_snippet, le.direction AS last_email_direction
    FROM contacts ct
    JOIN companies co ON co.id = ct.company_id
    ${LAST_EMAIL_JOIN.replaceAll("%KEY%", "contact_id").replaceAll("%TBL%", "ct")}
    WHERE ct.id = ?
  `).get(id) as ContactWithLastEmail | undefined;
}

export function listEngagements(companyId?: number, year?: number): Engagement[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (companyId) { where.push("e.company_id = ?"); params.push(companyId); }
  if (year) { where.push("strftime('%Y', COALESCE(e.close_date, e.start_date, date('now'))) = ?"); params.push(String(year)); }
  return db.prepare(`
    SELECT e.*, c.name AS company_name FROM engagements e
    JOIN companies c ON c.id = e.company_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY e.value DESC
  `).all(...params) as Engagement[];
}

export function listEmails(opts: { companyId?: number; contactId?: number; limit?: number; year?: number } = {}): Email[] {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.companyId) { where.push("e.company_id = ?"); params.push(opts.companyId); }
  if (opts.contactId) { where.push("e.contact_id = ?"); params.push(opts.contactId); }
  if (opts.year) { where.push("strftime('%Y', e.sent_at) = ?"); params.push(String(opts.year)); }
  return db.prepare(`
    SELECT e.*, ct.name AS contact_name, co.name AS company_name
    FROM emails e
    LEFT JOIN contacts ct ON ct.id = e.contact_id
    JOIN companies co ON co.id = e.company_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY e.sent_at DESC
    ${opts.limit ? "LIMIT " + opts.limit : ""}
  `).all(...params) as Email[];
}

export function listDocuments(companyId?: number): DocumentRow[] {
  return getDb().prepare(`
    SELECT d.*, c.name AS company_name FROM documents d
    JOIN companies c ON c.id = d.company_id
    ${companyId ? "WHERE d.company_id = ?" : ""}
    ORDER BY d.updated_at DESC
  `).all(...(companyId ? [companyId] : [])) as DocumentRow[];
}

export function listTasks(companyId?: number, year?: number): TaskRow[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (companyId) { where.push("t.company_id = ?"); params.push(companyId); }
  if (year) { where.push("strftime('%Y', t.due_date) = ?"); params.push(String(year)); }
  return getDb().prepare(`
    SELECT t.*, c.name AS company_name, e.name AS engagement_name FROM tasks t
    LEFT JOIN companies c ON c.id = t.company_id
    LEFT JOIN engagements e ON e.id = t.engagement_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY t.due_date ASC
  `).all(...params) as TaskRow[];
}

export function listActivities(opts: { companyId?: number; contactId?: number; limit?: number; year?: number } = {}): Activity[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.companyId) { where.push("a.company_id = ?"); params.push(opts.companyId); }
  if (opts.contactId) { where.push("a.contact_id = ?"); params.push(opts.contactId); }
  if (opts.year) { where.push("strftime('%Y', a.created_at) = ?"); params.push(String(opts.year)); }
  return getDb().prepare(`
    SELECT a.*, ct.name AS contact_name, co.name AS company_name
    FROM activities a
    LEFT JOIN contacts ct ON ct.id = a.contact_id
    JOIN companies co ON co.id = a.company_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY a.created_at DESC
    ${opts.limit ? "LIMIT " + opts.limit : ""}
  `).all(...params) as Activity[];
}

export interface StaleClient {
  id: number;
  name: string;
  industry: string | null;
  status: string;
  last_touch: string | null;
}

/** Past clients with no email, meeting, or activity in the last `months` months. */
export function staleClients(months = 6): StaleClient[] {
  return getDb().prepare(`
    SELECT c.id, c.name, c.industry, c.status, MAX(x.t) AS last_touch
    FROM companies c
    LEFT JOIN (
      SELECT company_id, sent_at AS t FROM emails
      UNION ALL SELECT company_id, occurred_at FROM meetings
      UNION ALL SELECT company_id, created_at FROM activities
    ) x ON x.company_id = c.id
    WHERE c.status = 'past'
    GROUP BY c.id
    HAVING last_touch IS NULL OR last_touch < datetime('now', ?)
    ORDER BY last_touch ASC
  `).all(`-${months} months`) as StaleClient[];
}

/** Most recent touch (email/meeting/activity) for one company. */
export function companyLastTouch(companyId: number): string | null {
  const row = getDb().prepare(`
    SELECT MAX(t) AS last_touch FROM (
      SELECT sent_at AS t FROM emails WHERE company_id = ?
      UNION ALL SELECT occurred_at FROM meetings WHERE company_id = ?
      UNION ALL SELECT created_at FROM activities WHERE company_id = ?
    )
  `).get(companyId, companyId, companyId) as { last_touch: string | null };
  return row.last_touch;
}

export interface Lead {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  status: string;
  company_id: number | null;
  contact_id: number | null;
  created_at: string;
}

export function listLeads(status?: string): Lead[] {
  const where = status ? "WHERE status = ?" : "";
  return getDb()
    .prepare(`SELECT * FROM leads ${where} ORDER BY status = 'new' DESC, created_at DESC`)
    .all(...(status ? [status] : [])) as Lead[];
}

export function newLeadCount(): number {
  return (getDb().prepare("SELECT COUNT(*) c FROM leads WHERE status = 'new'").get() as { c: number }).c;
}

export interface UserRow {
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

export function listUsers(): UserRow[] {
  return getDb()
    .prepare("SELECT * FROM users ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'member' THEN 1 WHEN 'contributor' THEN 2 ELSE 3 END, name")
    .all() as UserRow[];
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function listMeetings(opts: { companyId?: number; limit?: number; year?: number } = {}): Meeting[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.companyId) { where.push("m.company_id = ?"); params.push(opts.companyId); }
  if (opts.year) { where.push("strftime('%Y', m.occurred_at) = ?"); params.push(String(opts.year)); }
  return getDb().prepare(`
    SELECT m.*, co.name AS company_name, ct.name AS contact_name
    FROM meetings m
    LEFT JOIN companies co ON co.id = m.company_id
    LEFT JOIN contacts ct ON ct.id = m.contact_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY m.occurred_at DESC
    ${opts.limit ? "LIMIT " + opts.limit : ""}
  `).all(...params) as Meeting[];
}

export function tasksDueSoon(days = 3): TaskRow[] {
  return getDb().prepare(`
    SELECT t.*, c.name AS company_name, e.name AS engagement_name FROM tasks t
    LEFT JOIN companies c ON c.id = t.company_id
    LEFT JOIN engagements e ON e.id = t.engagement_id
    WHERE t.status != 'done' AND t.due_date <= date('now', ?)
    ORDER BY t.due_date ASC
  `).all(`+${days} days`) as TaskRow[];
}

export function emailsPerDay(days = 14): { day: string; count: number }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT date(sent_at) AS d, COUNT(*) AS c FROM emails
    WHERE sent_at >= datetime('now', ?)
    GROUP BY date(sent_at)
  `).all(`-${days} days`) as { d: string; c: number }[];
  const byDay = new Map(rows.map((r) => [r.d, r.c]));
  const out: { day: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const key = dt.toISOString().slice(0, 10);
    out.push({
      day: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: byDay.get(key) ?? 0,
    });
  }
  return out;
}

export function clickupLastResult(): { ok: boolean; at: string; detail: string } | null {
  const raw = getSetting("clickup_last_result");
  if (!raw) return null;
  const [status, at, ...rest] = raw.split("|");
  return { ok: status === "ok", at, detail: rest.join("|") };
}

export function dashboardStats(year?: number) {
  const db = getDb();
  const one = <T>(sql: string, ...p: unknown[]) => db.prepare(sql).get(...p) as T;
  const engYear = year ? "AND strftime('%Y', COALESCE(close_date, start_date, date('now'))) = ?" : "";
  const ey = year ? [String(year)] : [];
  return {
    activeEngagements: one<{ c: number }>(`SELECT COUNT(*) c FROM engagements WHERE stage = 'won' ${engYear}`, ...ey).c,
    pipelineValue: one<{ v: number | null }>(`SELECT SUM(value) v FROM engagements WHERE stage IN ('intro','pitch','no_fee_proposal','fee_proposal') ${engYear}`, ...ey).v ?? 0,
    openTasks: year
      ? one<{ c: number }>("SELECT COUNT(*) c FROM tasks WHERE status != 'done' AND strftime('%Y', due_date) = ?", String(year)).c
      : one<{ c: number }>("SELECT COUNT(*) c FROM tasks WHERE status != 'done'").c,
    emailsThisWeek: year
      ? one<{ c: number }>("SELECT COUNT(*) c FROM emails WHERE strftime('%Y', sent_at) = ?", String(year)).c
      : one<{ c: number }>("SELECT COUNT(*) c FROM emails WHERE sent_at >= datetime('now','-7 days')").c,
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function emailsByMonth(year: number): { day: string; count: number }[] {
  const rows = getDb()
    .prepare("SELECT strftime('%m', sent_at) AS m, COUNT(*) AS c FROM emails WHERE strftime('%Y', sent_at) = ? GROUP BY m")
    .all(String(year)) as { m: string; c: number }[];
  const byMonth = new Map(rows.map((r) => [Number(r.m), r.c]));
  return MONTHS.map((label, i) => ({ day: label, count: byMonth.get(i + 1) ?? 0 }));
}
