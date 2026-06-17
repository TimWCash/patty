/**
 * ClickUp integration.
 *
 * Live mode requires a ClickUp API token (personal or OAuth) and a target list ID,
 * both saved on the Settings page (stored in the settings table).
 *
 * Endpoints used:
 *   PUT  https://api.clickup.com/api/v2/task/{task_id}            (push status changes)
 *   POST https://api.clickup.com/api/v2/task/{task_id}/comment    (post a note as a comment)
 *   POST https://api.clickup.com/api/v2/list/{list_id}/task       (create a task from the CRM)
 *   GET  https://api.clickup.com/api/v2/list/{list_id}/task       (pull tasks + statuses)
 *
 * Auth: "Authorization: {token}" header.
 *
 * When credentials are missing the client runs in "stub" mode: it no-ops the
 * remote call and reports success so the CRM stays usable on sample data.
 */
import { getSetting } from "../queries";
import type { TaskStatus } from "../types";

const API = "https://api.clickup.com/api/v2";

/** Patty task status -> ClickUp status name. ClickUp statuses are list-specific
 *  and lower-cased; override per-workspace via the clickup_status_map setting. */
const DEFAULT_STATUS_MAP: Record<TaskStatus, string> = {
  todo: "to do",
  in_progress: "in progress",
  review: "review",
  done: "complete",
};

function statusMap(): Record<TaskStatus, string> {
  const raw = getSetting("clickup_status_map");
  if (!raw) return DEFAULT_STATUS_MAP;
  try {
    return { ...DEFAULT_STATUS_MAP, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATUS_MAP;
  }
}

export function clickupStatus(): { configured: boolean; mode: "stub" | "live" } {
  const configured = Boolean(getSetting("clickup_token") && getSetting("clickup_list_id"));
  return { configured, mode: configured ? "live" : "stub" };
}

export type PushResult = { ok: boolean; mode: "stub" | "live"; detail: string };

async function call(method: string, path: string, body?: object): Promise<PushResult> {
  const token = getSetting("clickup_token");
  if (!token) return { ok: true, mode: "stub", detail: "No ClickUp token; change kept in Patty only." };
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, mode: "live", detail: `ClickUp ${res.status}: ${text.slice(0, 160)}` };
    }
    return { ok: true, mode: "live", detail: "Synced to ClickUp." };
  } catch (e) {
    return { ok: false, mode: "live", detail: e instanceof Error ? e.message : "ClickUp request failed." };
  }
}

/** Reflect a Patty status change on the linked ClickUp task. */
export async function pushTaskStatus(clickupTaskId: string, status: TaskStatus): Promise<PushResult> {
  return call("PUT", `/task/${clickupTaskId}`, { status: statusMap()[status] });
}

/** Push a Patty title/assignee/due-date edit to the linked ClickUp task. */
export async function pushTaskFields(
  clickupTaskId: string,
  fields: { title?: string; due_date?: string | null }
): Promise<PushResult> {
  const body: Record<string, unknown> = {};
  if (fields.title !== undefined) body.name = fields.title;
  if (fields.due_date) body.due_date = new Date(`${fields.due_date}T12:00:00`).getTime();
  return call("PUT", `/task/${clickupTaskId}`, body);
}

/** Post a CRM note to the linked ClickUp task as a comment. */
export async function pushComment(clickupTaskId: string, text: string): Promise<PushResult> {
  return call("POST", `/task/${clickupTaskId}/comment`, { comment_text: text, notify_all: false });
}

export interface LeadCardContext {
  name: string;
  company: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  source?: string;
  pattyCompanyId?: number;
}

/**
 * Create a ClickUp card for a new website lead.
 *
 * If a lead-card TEMPLATE is configured (settings.clickup_lead_template_id), the
 * card is created FROM that template — duplicating its checklist, custom fields,
 * tags, and description theme — then the lead context is filled in. Otherwise it
 * falls back to a plain task. Both honor the lead list (clickup_lead_list_id),
 * falling back to the default clickup_list_id.
 *
 * Custom-field mapping: settings.clickup_lead_field_map is JSON of
 * { "<clickup_custom_field_id>": "<lead key: name|company|email|phone|message|source>" }.
 * When you provide your themed card's field IDs, drop them here and they auto-fill.
 */
export async function createLeadCard(
  lead: LeadCardContext
): Promise<{ result: PushResult; clickupTaskId: string | null }> {
  const token = getSetting("clickup_token");
  const listId = getSetting("clickup_lead_list_id") || getSetting("clickup_list_id");
  const templateId = getSetting("clickup_lead_template_id");
  if (!token || !listId) {
    return { result: { ok: true, mode: "stub", detail: "No ClickUp list; lead kept in Patty only." }, clickupTaskId: null };
  }

  const name = `New lead: ${lead.name}${lead.company ? ` — ${lead.company}` : ""}`;
  const description = leadCardMarkdown(lead);

  try {
    let taskId: string | null = null;

    if (templateId) {
      // Duplicate the themed card from its task template.
      const res = await fetch(`${API}/list/${listId}/taskTemplate/${templateId}`, {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { result: { ok: false, mode: "live", detail: `ClickUp template ${res.status}: ${text.slice(0, 160)}` }, clickupTaskId: null };
      }
      taskId = ((await res.json()) as { id?: string }).id ?? null;
      // Fill the lead context into the duplicated card's description.
      if (taskId) {
        await fetch(`${API}/task/${taskId}`, {
          method: "PUT",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify({ markdown_description: description }),
        }).catch(() => {});
      }
    } else {
      // No template configured yet: create a plain card with the context.
      const res = await fetch(`${API}/list/${listId}/task`, {
        method: "POST",
        headers: { Authorization: token, "Content-Type": "application/json" },
        body: JSON.stringify({ name, markdown_description: description, status: statusMap().todo }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { result: { ok: false, mode: "live", detail: `ClickUp ${res.status}: ${text.slice(0, 160)}` }, clickupTaskId: null };
      }
      taskId = ((await res.json()) as { id?: string }).id ?? null;
    }

    if (taskId) await applyLeadFieldMap(token, taskId, lead);

    return {
      result: { ok: true, mode: "live", detail: templateId ? "Lead card created from template in ClickUp." : "Lead card created in ClickUp." },
      clickupTaskId: taskId,
    };
  } catch (e) {
    return { result: { ok: false, mode: "live", detail: e instanceof Error ? e.message : "ClickUp request failed." }, clickupTaskId: null };
  }
}

function leadCardMarkdown(lead: LeadCardContext): string {
  return [
    `**New website lead**`,
    ``,
    `- **Name:** ${lead.name}`,
    `- **Company:** ${lead.company || "—"}`,
    `- **Email:** ${lead.email || "—"}`,
    `- **Phone:** ${lead.phone || "—"}`,
    `- **Source:** ${lead.source || "website"}`,
    ``,
    `**Message**`,
    lead.message || "_No message provided._",
  ].join("\n");
}

async function applyLeadFieldMap(token: string, taskId: string, lead: LeadCardContext) {
  const raw = getSetting("clickup_lead_field_map");
  if (!raw) return;
  let map: Record<string, keyof LeadCardContext>;
  try {
    map = JSON.parse(raw);
  } catch {
    return;
  }
  for (const [fieldId, leadKey] of Object.entries(map)) {
    const value = lead[leadKey];
    if (value == null || value === "") continue;
    await fetch(`${API}/task/${taskId}/field/${fieldId}`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ value: String(value) }),
    }).catch(() => {});
  }
}

/** Create a brand-new ClickUp task from a Patty task; returns the new ClickUp id. */
export async function createClickUpTask(
  task: { title: string; status: TaskStatus; due_date?: string | null }
): Promise<{ result: PushResult; clickupTaskId: string | null }> {
  const token = getSetting("clickup_token");
  const listId = getSetting("clickup_list_id");
  if (!token || !listId) {
    return { result: { ok: true, mode: "stub", detail: "No ClickUp list; task kept in Patty only." }, clickupTaskId: null };
  }
  try {
    const res = await fetch(`${API}/list/${listId}/task`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: task.title,
        status: statusMap()[task.status],
        due_date: task.due_date ? new Date(`${task.due_date}T12:00:00`).getTime() : undefined,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { result: { ok: false, mode: "live", detail: `ClickUp ${res.status}: ${text.slice(0, 160)}` }, clickupTaskId: null };
    }
    const data = (await res.json()) as { id?: string };
    return { result: { ok: true, mode: "live", detail: "Created in ClickUp." }, clickupTaskId: data.id ?? null };
  } catch (e) {
    return { result: { ok: false, mode: "live", detail: e instanceof Error ? e.message : "ClickUp request failed." }, clickupTaskId: null };
  }
}
