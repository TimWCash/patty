export type CompanyStatus = "prospect" | "active" | "past";
export type Stage = "intro" | "pitch" | "no_fee_proposal" | "fee_proposal" | "won" | "lost";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type ActivityKind = "note" | "email" | "meeting" | "task" | "stage_change";

export interface Company {
  id: number;
  name: string;
  industry: string | null;
  website: string | null;
  status: CompanyStatus;
  notes: string | null;
  created_at: string;
  // Extended client profile (mirrors the ClickUp client template)
  year_founded: number | null;
  headquarters: string | null;
  employees: string | null;
  units: string | null;
  ownership: string | null;
  annual_revenue: string | null;
  focus_brand: string | null;
  competitors: string | null;
}

export interface CompanyWithLastEmail extends Company {
  contact_count: number;
  last_email_at: string | null;
  last_email_subject: string | null;
  last_email_snippet: string | null;
  last_email_direction: string | null;
}

export interface Contact {
  id: number;
  company_id: number;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface ContactWithLastEmail extends Contact {
  company_name: string;
  last_email_at: string | null;
  last_email_subject: string | null;
  last_email_snippet: string | null;
  last_email_direction: string | null;
}

export interface Engagement {
  id: number;
  company_id: number;
  name: string;
  stage: Stage;
  value: number;
  owner: string | null;
  start_date: string | null;
  close_date: string | null;
  clickup_task_id: string | null;
  company_name?: string;
}

export interface Email {
  id: number;
  contact_id: number | null;
  company_id: number;
  subject: string;
  snippet: string | null;
  body: string | null;
  direction: "in" | "out";
  sent_at: string;
  outlook_id: string | null;
  contact_name?: string;
  company_name?: string;
}

export interface DocumentRow {
  id: number;
  company_id: number;
  engagement_id: number | null;
  name: string;
  type: "proposal" | "deck" | "report" | "contract";
  source: "sharepoint" | "onedrive";
  url: string | null;
  updated_at: string;
  company_name?: string;
}

export interface TaskRow {
  id: number;
  engagement_id: number | null;
  company_id: number | null;
  title: string;
  status: TaskStatus;
  assignee: string | null;
  due_date: string | null;
  clickup_task_id: string | null;
  synced_at: string | null;
  company_name?: string;
  engagement_name?: string;
}

export interface Activity {
  id: number;
  company_id: number;
  contact_id: number | null;
  kind: ActivityKind;
  body: string;
  created_at: string;
  contact_name?: string;
  company_name?: string;
}

export interface Meeting {
  id: number;
  company_id: number | null;
  contact_id: number | null;
  title: string;
  source: "zoom" | "granola" | "otter";
  occurred_at: string;
  duration_min: number | null;
  summary: string | null;
  action_items: string | null;
  external_id: string | null;
  company_name?: string;
  contact_name?: string;
}

export const STAGES: { key: Stage; label: string }[] = [
  { key: "intro", label: "Intro Call" },
  { key: "pitch", label: "Pitch Call" },
  { key: "no_fee_proposal", label: "No-Fee Proposal" },
  { key: "fee_proposal", label: "Fee Proposal" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

/** Open (in-funnel) vs closed stages. */
export const OPEN_STAGES: Stage[] = ["intro", "pitch", "no_fee_proposal", "fee_proposal"];
export const CLOSED_STAGES: Stage[] = ["won", "lost"];

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];
