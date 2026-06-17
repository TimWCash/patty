"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "./db";
import type { TaskStatus } from "./types";
import { createClickUpTask, pushComment, pushTaskStatus, type PushResult } from "./integrations/clickup";
import { getPerms } from "./access";
import { type Perms, type Role, isRole } from "./roles";

async function allowed(check: (p: Perms) => boolean): Promise<boolean> {
  return check(await getPerms());
}

function recordClickUpResult(r: PushResult) {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES ('clickup_last_result', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(`${r.ok ? "ok" : "error"}|${new Date().toISOString()}|${r.detail}`);
}

interface TaskRow {
  id: number;
  title: string;
  status: TaskStatus;
  company_id: number | null;
  clickup_task_id: string | null;
  due_date: string | null;
}

export async function addNote(companyId: number, formData: FormData) {
  if (!(await allowed((p) => p.canNotes))) return;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  const contactId = formData.get("contact_id") ? Number(formData.get("contact_id")) : null;
  getDb()
    .prepare("INSERT INTO activities (company_id, contact_id, kind, body) VALUES (?,?,?,?)")
    .run(companyId, contactId, "note", body);
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/");
}

export async function changeStage(engagementId: number, stage: string) {
  if (!(await allowed((p) => p.canPipeline))) return;
  const db = getDb();
  const eng = db.prepare("SELECT * FROM engagements WHERE id = ?").get(engagementId) as
    | { id: number; company_id: number; name: string }
    | undefined;
  if (!eng) return;
  db.prepare("UPDATE engagements SET stage = ? WHERE id = ?").run(stage, engagementId);
  db.prepare("INSERT INTO activities (company_id, kind, body) VALUES (?,?,?)").run(
    eng.company_id,
    "stage_change",
    `${eng.name} moved to ${stage.replace("_", " ")}.`
  );
  revalidatePath("/pipeline");
  revalidatePath(`/companies/${eng.company_id}`);
  revalidatePath("/");
}

export async function saveSettings(formData: FormData) {
  if (!(await allowed((p) => p.canSettings))) return;
  const db = getDb();
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  const keys = [
    "ms_tenant_id", "ms_client_id", "ms_client_secret",
    "clickup_token", "clickup_list_id",
    "clickup_lead_list_id", "clickup_lead_template_id", "clickup_lead_field_map",
    "sharepoint_site_url",
    "zoom_account_id", "zoom_client_id", "zoom_client_secret",
    "granola_webhook_secret", "otter_inbound_address",
  ];
  for (const key of keys) {
    const v = formData.get(key);
    if (v !== null) upsert.run(key, String(v));
  }
  revalidatePath("/settings");
}

export async function markLeadReviewed(leadId: number) {
  if (!(await allowed((p) => p.canLeads))) return;
  getDb().prepare("UPDATE leads SET status = 'reviewed' WHERE id = ?").run(leadId);
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function setUserRole(email: string, role: string) {
  if (!(await allowed((p) => p.canManageUsers)) || !isRole(role)) return;
  getDb().prepare("UPDATE users SET role = ? WHERE lower(email) = lower(?)").run(role, email);
  revalidatePath("/access");
}

export async function addUser(formData: FormData) {
  if (!(await allowed((p) => p.canManageUsers))) return;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleRaw = String(formData.get("role") ?? "observer");
  const role: Role = isRole(roleRaw) ? roleRaw : "observer";
  const name = String(formData.get("name") ?? "").trim() || email.split("@")[0];
  if (!email || !email.includes("@")) return;
  getDb()
    .prepare("INSERT INTO users (email, name, role) VALUES (?,?,?) ON CONFLICT(email) DO UPDATE SET role = excluded.role, name = excluded.name")
    .run(email, name, role);
  revalidatePath("/access");
}

export async function moveTask(taskId: number, status: TaskStatus) {
  if (!(await allowed((p) => p.canTasks))) return;
  const db = getDb();
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as TaskRow | undefined;
  if (!task) return;
  db.prepare("UPDATE tasks SET status = ?, synced_at = datetime('now') WHERE id = ?").run(status, taskId);
  if (task.company_id) {
    db.prepare("INSERT INTO activities (company_id, kind, body) VALUES (?,?,?)").run(
      task.company_id,
      "task",
      `Task "${task.title}" moved to ${status.replace("_", " ")}.`
    );
  }
  if (task.clickup_task_id) {
    recordClickUpResult(await pushTaskStatus(task.clickup_task_id, status));
  }
  revalidatePath("/tasks");
  if (task.company_id) revalidatePath(`/companies/${task.company_id}`);
  revalidatePath("/");
}

export async function addTaskComment(taskId: number, formData: FormData) {
  if (!(await allowed((p) => p.canNotes))) return;
  const text = String(formData.get("body") ?? "").trim();
  if (!text) return;
  const db = getDb();
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as TaskRow | undefined;
  if (!task) return;
  if (task.company_id) {
    db.prepare("INSERT INTO activities (company_id, kind, body) VALUES (?,?,?)").run(
      task.company_id,
      "note",
      `On task "${task.title}": ${text}`
    );
  }
  if (task.clickup_task_id) {
    db.prepare("UPDATE tasks SET synced_at = datetime('now') WHERE id = ?").run(taskId);
    recordClickUpResult(await pushComment(task.clickup_task_id, text));
  }
  revalidatePath("/tasks");
  if (task.company_id) revalidatePath(`/companies/${task.company_id}`);
}

/** Push every linked task's current status to ClickUp; create unlinked ones. */
export async function syncClickUp() {
  if (!(await allowed((p) => p.canSync))) return;
  const db = getDb();
  const tasks = db.prepare("SELECT * FROM tasks WHERE status != 'done'").all() as TaskRow[];
  let ok = 0, failed = 0, created = 0, lastDetail = "";
  for (const t of tasks) {
    if (t.clickup_task_id) {
      const r = await pushTaskStatus(t.clickup_task_id, t.status);
      if (r.mode === "stub") { lastDetail = r.detail; break; }
      r.ok ? ok++ : failed++;
      if (!r.ok) lastDetail = r.detail;
    } else {
      const { result, clickupTaskId } = await createClickUpTask(t);
      if (result.mode === "stub") { lastDetail = result.detail; break; }
      if (clickupTaskId) {
        db.prepare("UPDATE tasks SET clickup_task_id = ? WHERE id = ?").run(clickupTaskId, t.id);
        created++;
      }
      result.ok ? ok++ : failed++;
      if (!result.ok) lastDetail = result.detail;
    }
  }
  db.prepare("UPDATE tasks SET synced_at = datetime('now')").run();
  const summary = lastDetail && ok === 0 && failed === 0
    ? lastDetail
    : `Pushed ${ok} task${ok === 1 ? "" : "s"}${created ? `, created ${created}` : ""}${failed ? `, ${failed} failed` : ""}.`;
  recordClickUpResult({ ok: failed === 0, mode: tasks.length && lastDetail.includes("Patty only") ? "stub" : "live", detail: summary });
  revalidatePath("/tasks");
}
