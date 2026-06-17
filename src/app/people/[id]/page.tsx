import Link from "next/link";
import { notFound } from "next/navigation";
import { getContact, listActivities, listEmails } from "@/lib/queries";
import { Badge, EmailList, Timeline, fmtAgo, fmtDate } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = getContact(Number(id));
  if (!contact) notFound();

  const emails = listEmails({ contactId: contact.id });
  const activities = listActivities({ contactId: contact.id });
  const lastEmail = emails[0];

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 className="page-title">{contact.name}</h1>
          <p className="page-sub">
            {contact.title} · <Link href={`/companies/${contact.company_id}`} style={{ color: "var(--orange)", fontWeight: 700 }}>{contact.company_name}</Link>
          </p>
        </div>
        <Link href="/people" className="btn ghost">All people</Link>
      </div>

      <div className="grid two-col">
        <div>
          {lastEmail && (
            <div className="card last-email-card" style={{ marginBottom: 14 }}>
              <div className="section-h" style={{ marginTop: 0 }}>Last Email · {fmtAgo(lastEmail.sent_at)}</div>
              <div className="email-subject"><Badge value={lastEmail.direction} /> {lastEmail.subject}</div>
              <p style={{ fontSize: 13, margin: "8px 0", color: "var(--dark-grey)" }}>{lastEmail.snippet}</p>
              <div className="tl-meta">{fmtDate(lastEmail.sent_at)}</div>
            </div>
          )}
          <div className="card">
            <div className="section-h" style={{ marginTop: 0 }}>Email History ({emails.length})</div>
            <EmailList emails={emails} linkContacts={false} />
          </div>
        </div>

        <div>
          <div className="card">
            <div className="section-h" style={{ marginTop: 0 }}>Contact Info</div>
            <div className="kv">
              <b>Email:</b> <a href={`mailto:${contact.email}`}>{contact.email}</a><br />
              <b>Phone:</b> {contact.phone ?? "Not on file"}<br />
              <b>Company:</b> {contact.company_name}<br />
              <b>Added:</b> {fmtDate(contact.created_at)}
            </div>
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <div className="section-h" style={{ marginTop: 0 }}>Activity</div>
            <Timeline items={activities} />
          </div>
        </div>
      </div>
    </>
  );
}
