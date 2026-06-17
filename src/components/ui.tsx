import Link from "next/link";
import type { Activity, Email } from "@/lib/types";
import { IconArrowRight, IconCheck, IconMail, IconMeeting, IconNote } from "./icons";

export function PageTitle({ first, accent, sub }: { first: string; accent: string; sub?: string }) {
  return (
    <header className="page-head">
      <h1 className="page-title">
        {first} <span className="accent">{accent}</span>
      </h1>
      {sub && <p className="page-sub">{sub}</p>}
    </header>
  );
}

export function Badge({ value }: { value: string }) {
  return (
    <span className={`badge ${value}`}>
      <span className="badge-dot" />
      {value.replace("_", " ")}
    </span>
  );
}

export function Avatar({ name, tone = "teal" }: { name: string | null | undefined; tone?: "teal" | "navy" | "orange" }) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return <span className={`avatar ${tone}`}>{initials}</span>;
}

export function money(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return "-";
  const d = new Date(s.replace(" ", "T"));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtAgo(s: string | null | undefined) {
  if (!s) return "never";
  const then = new Date(s.replace(" ", "T")).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return fmtDate(s);
}

const KIND_ICON: Record<string, React.ReactNode> = {
  note: <IconNote />,
  email: <IconMail />,
  meeting: <IconMeeting />,
  task: <IconCheck />,
  stage_change: <IconArrowRight />,
};

export function Timeline({ items, showCompany = false }: { items: Activity[]; showCompany?: boolean }) {
  if (!items.length) return <div className="empty">No activity yet.</div>;
  return (
    <ul className="timeline">
      {items.map((a) => (
        <li key={a.id}>
          <span className={`tl-icon ${a.kind}`}>{KIND_ICON[a.kind] ?? <IconNote />}</span>
          <div className="tl-body">
            {a.body}
            <div className="tl-meta">
              {fmtAgo(a.created_at)}
              {a.contact_name ? ` · ${a.contact_name}` : ""}
              {showCompany && a.company_name ? ` · ${a.company_name}` : ""}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmailList({ emails, linkContacts = true }: { emails: Email[]; linkContacts?: boolean }) {
  if (!emails.length) return <div className="empty">No emails.</div>;
  return (
    <div>
      {emails.map((e) => (
        <div className="email-item" key={e.id}>
          <div className="email-who">
            <Avatar name={e.contact_name} tone={e.direction === "out" ? "navy" : "teal"} />
            <div>
              <div className="name">
                {linkContacts && e.contact_id ? <Link href={`/people/${e.contact_id}`}>{e.contact_name}</Link> : e.contact_name ?? "-"}
              </div>
              <div className="co">{e.company_name}</div>
            </div>
          </div>
          <div className="email-content">
            <div className="email-subject">
              <Badge value={e.direction} /> {e.subject}
            </div>
            <div className="email-snippet">{e.snippet}</div>
          </div>
          <div className="email-when">{fmtAgo(e.sent_at)}</div>
        </div>
      ))}
    </div>
  );
}
