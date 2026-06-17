import { getDb } from "./db";
import { createLeadCard } from "./integrations/clickup";

export interface LeadInput {
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  message?: string;
  source?: string;
}

export interface LeadResult {
  leadId: number;
  companyId: number;
  contactId: number;
}

/**
 * Handle an inbound website contact-form submission:
 *  - find or create a prospect company (match by name, else by email domain)
 *  - find or create the contact (match by email)
 *  - log an activity, file a "new" lead, and open a follow-up task
 *  - push the follow-up task to ClickUp when connected
 */
export async function createLeadFromForm(input: LeadInput): Promise<LeadResult> {
  const db = getDb();
  const name = input.name.trim();
  const email = input.email?.trim() || null;
  const companyName = input.company?.trim() || `${name}'s inquiry`;
  const phone = input.phone?.trim() || null;
  const message = input.message?.trim() || null;
  const domain = email?.includes("@") ? email.split("@")[1].toLowerCase() : null;

  // 1. Find or create the company (prospect).
  let company = db
    .prepare("SELECT id FROM companies WHERE lower(name) = lower(?)")
    .get(companyName) as { id: number } | undefined;
  if (!company && domain) {
    company = db
      .prepare("SELECT id FROM companies WHERE website LIKE ?")
      .get(`%${domain}%`) as { id: number } | undefined;
  }
  let companyId: number;
  if (company) {
    companyId = company.id;
  } else {
    companyId = Number(
      db
        .prepare("INSERT INTO companies (name, industry, website, status, notes) VALUES (?,?,?,?,?)")
        .run(companyName, "Inbound lead", domain ?? "", "prospect", "Created from a website contact-form submission.").lastInsertRowid
    );
  }

  // 2. Find or create the contact.
  let contact = email
    ? (db.prepare("SELECT id FROM contacts WHERE lower(email) = lower(?)").get(email) as { id: number } | undefined)
    : undefined;
  let contactId: number;
  if (contact) {
    contactId = contact.id;
  } else {
    contactId = Number(
      db
        .prepare("INSERT INTO contacts (company_id, name, title, email, phone) VALUES (?,?,?,?,?)")
        .run(companyId, name, "Website inquiry", email, phone).lastInsertRowid
    );
  }

  // 3. Activity on the timeline.
  db.prepare("INSERT INTO activities (company_id, contact_id, kind, body) VALUES (?,?,?,?)").run(
    companyId,
    contactId,
    "lead",
    `Website inquiry from ${name}${email ? ` (${email})` : ""}${message ? `: ${message}` : "."}`
  );

  // 4. File the lead (new / unreviewed).
  const leadId = Number(
    db
      .prepare("INSERT INTO leads (name, email, company, phone, message, source, status, company_id, contact_id) VALUES (?,?,?,?,?,?, 'new', ?, ?)")
      .run(name, email, input.company?.trim() || null, phone, message, input.source?.trim() || "website", companyId, contactId).lastInsertRowid
  );

  // 5. Follow-up task in Patty, due in 2 days.
  const due = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const title = `Follow up: ${name}${companyName ? ` (${companyName})` : ""} — website inquiry`;
  const taskId = Number(
    db
      .prepare("INSERT INTO tasks (company_id, title, status, assignee, due_date) VALUES (?,?,?,?,?)")
      .run(companyId, title, "todo", "Steve", due).lastInsertRowid
  );

  // 6. Create the ClickUp card — duplicated from the themed lead template when configured.
  const { clickupTaskId } = await createLeadCard({
    name, company: companyName, email, phone, message, source: input.source?.trim() || "website", pattyCompanyId: companyId,
  });
  if (clickupTaskId) {
    db.prepare("UPDATE tasks SET clickup_task_id = ?, synced_at = datetime('now') WHERE id = ?").run(clickupTaskId, taskId);
  }

  return { leadId, companyId, contactId };
}
