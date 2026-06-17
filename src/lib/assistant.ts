import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/* Read-only database access for the AI assistant. */

const DB_PATH = path.join(process.cwd(), "data", "hub.db");

let roDb: Database.Database | null = null;

function getReadOnlyDb(): Database.Database {
  if (roDb) return roDb;
  roDb = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  return roDb;
}

const MAX_ROWS = 200;

export function runReadOnlyQuery(sql: string): { rows: unknown[]; rowCount: number } | { error: string } {
  const trimmed = sql.trim().replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(trimmed)) {
    return { error: "Only SELECT queries are allowed." };
  }
  try {
    const stmt = getReadOnlyDb().prepare(trimmed); // throws if multiple statements
    if (!stmt.reader) return { error: "Query must return rows." };
    const rows = stmt.all().slice(0, MAX_ROWS);
    return { rows, rowCount: rows.length };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Query failed." };
  }
}

export function getSchemaText(): string {
  return fs.readFileSync(path.join(process.cwd(), "src/lib/schema.sql"), "utf-8");
}

export function buildSystemPrompt(): string {
  return `You are Patty, the Service Physics client hub assistant (named after Patagonia). Service Physics is an operations consultancy for restaurant and hospitality brands (drive-thru throughput, kitchen line design, labor models, service blueprints).

The hub is an internal CRM containing companies (clients/prospects), contacts, engagements (consulting projects with pipeline stages), emails, meetings (with summaries and action items from Zoom/Granola/Otter), documents, tasks (synced with ClickUp), and an activity timeline.

You answer questions by querying the hub's SQLite database with the run_sql tool. Rules:
- Use the run_sql tool whenever the answer depends on hub data. Run as many queries as you need. Do not guess at data.
- SELECT queries only. Results cap at ${MAX_ROWS} rows.
- Dates are stored as 'YYYY-MM-DD HH:MM:SS' strings; use SQLite date functions (date('now'), datetime('now','-7 days')).
- Engagement/funnel stages (Service Physics sales funnel): intro (Intro Call), pitch (Pitch Call), no_fee_proposal (No-Fee Proposal), fee_proposal (Fee Proposal), won, lost. Open pipeline = intro/pitch/no_fee_proposal/fee_proposal; won = signed/active. Task statuses: todo, in_progress, review, done. Email direction: 'in' (received) or 'out' (sent by us).
- Companies carry a client profile: year_founded, headquarters, employees, units, ownership (company-owned vs franchise), annual_revenue, focus_brand, competitors.
- meetings.action_items is a JSON array string.
- When referencing companies or people in your answer, write their names, not IDs.
- Keep answers concise and direct. Use plain prose or short dash lists. Format money as $X,XXX. If data is empty or missing, say so plainly.
- This is sample/stub data while integrations are not yet connected; no need to caveat that unless asked.

Database schema:
${getSchemaText()}`;
}
