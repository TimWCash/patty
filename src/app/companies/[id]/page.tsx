import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompany, listActivities, listContacts, listDocuments, listEmails, listEngagements, companyLastTouch,
} from "@/lib/queries";
import { addNote } from "@/lib/actions";
import { getPerms } from "@/lib/access";
import { Badge, Timeline, EmailList, fmtAgo, fmtDate, money } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

const TABS = ["overview", "contacts", "activity", "emails", "documents", "engagements"] as const;

export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const companyId = Number(id);
  const company = getCompany(companyId);
  if (!company) notFound();
  const tab = TABS.includes(rawTab as (typeof TABS)[number]) ? rawTab : "overview";

  const contacts = listContacts(undefined, companyId);
  const emails = listEmails({ companyId });
  const activities = listActivities({ companyId });
  const documents = listDocuments(companyId);
  const engagements = listEngagements(companyId);
  const lastEmail = emails[0];
  const addNoteForCompany = addNote.bind(null, companyId);
  const canNote = (await getPerms()).canNotes;

  const lastTouch = companyLastTouch(companyId);
  const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 183;
  const dormant =
    company.status === "past" && (!lastTouch || new Date(lastTouch.replace(" ", "T")).getTime() < sixMonthsAgo);

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 className="page-title">{company.name}</h1>
          <p className="page-sub">
            <Badge value={company.status} /> · {company.industry} · {company.website}
          </p>
        </div>
        <Link href="/companies" className="btn ghost">All companies</Link>
      </div>

      {dormant && (
        <div className="alert-bar" style={{ marginTop: 4 }}>
          <span className="alert-bar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          </span>
          <div className="alert-bar-body">
            <b>Re-engagement due.</b> This past client hasn&apos;t been touched in over 6 months
            {lastTouch ? ` (last touch ${fmtAgo(lastTouch)})` : " (no touch on record)"}. Log a note below or reach out.
          </div>
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <Link key={t} href={`/companies/${companyId}?tab=${t}`} className={tab === t ? "active" : ""}>
            {t[0].toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid two-col">
          <div>
            {lastEmail ? (
              <div className="card last-email-card">
                <div className="section-h" style={{ marginTop: 0 }}>Last Email · {fmtAgo(lastEmail.sent_at)}</div>
                <div className="email-subject">
                  <Badge value={lastEmail.direction} /> {lastEmail.subject}
                </div>
                <p style={{ fontSize: 13, margin: "8px 0", color: "var(--dark-grey)" }}>{lastEmail.snippet}</p>
                <div className="tl-meta">
                  {lastEmail.direction === "in" ? "From" : "To"}: {lastEmail.contact_name} · {fmtDate(lastEmail.sent_at)}
                </div>
              </div>
            ) : (
              <div className="card"><div className="empty">No email history yet.</div></div>
            )}

            {canNote && (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="section-h" style={{ marginTop: 0 }}>Add a Note</div>
                <form action={addNoteForCompany}>
                  <textarea name="body" rows={3} placeholder="Log a call, meeting takeaway, or next step..." />
                  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                    <select name="contact_id" defaultValue="" style={{ width: "auto" }}>
                      <option value="">No contact</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <SubmitButton>Save note</SubmitButton>
                  </div>
                </form>
              </div>
            )}

            <div className="card" style={{ marginTop: 14 }}>
              <div className="section-h" style={{ marginTop: 0 }}>Recent Activity</div>
              <Timeline items={activities.slice(0, 6)} />
            </div>
          </div>

          <div>
            <div className="card">
              <div className="section-h" style={{ marginTop: 0 }}>Client Profile</div>
              <div className="kv">
                {company.industry && <><b>Industry:</b> {company.industry}<br /></>}
                {company.year_founded && <><b>Founded:</b> {company.year_founded}<br /></>}
                {company.headquarters && <><b>HQ:</b> {company.headquarters}<br /></>}
                {company.units && <><b>Units:</b> {company.units}<br /></>}
                {company.ownership && <><b>Ownership:</b> {company.ownership}<br /></>}
                {company.employees && <><b>Employees:</b> {company.employees}<br /></>}
                {company.annual_revenue && <><b>Annual revenue:</b> {company.annual_revenue}<br /></>}
                {company.focus_brand && <><b>Focus:</b> {company.focus_brand}<br /></>}
                {company.competitors && <><b>Competitors:</b> {company.competitors}<br /></>}
                {company.website && <><b>Website:</b> {company.website}<br /></>}
              </div>
            </div>
            <div className="card" style={{ marginTop: 14 }}>
              <div className="section-h" style={{ marginTop: 0 }}>Account</div>
              <div className="kv">
                <b>Notes:</b> {company.notes ?? "None"}<br />
                <b>Client since:</b> {fmtDate(company.created_at)}<br />
                <b>Contacts:</b> {contacts.length} · <b>Engagements:</b> {engagements.length}
              </div>
            </div>
            <div className="card" style={{ marginTop: 14 }}>
              <div className="section-h" style={{ marginTop: 0 }}>Engagements</div>
              {engagements.map((e) => (
                <div key={e.id} style={{ padding: "6px 0", fontSize: 13 }}>
                  <Badge value={e.stage} /> <b>{e.name}</b>
                  <div className="tl-meta">{money(e.value)} · {e.owner}</div>
                </div>
              ))}
              {!engagements.length && <div className="empty">None yet.</div>}
            </div>
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th><th>Last Email</th></tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/people/${c.id}`}><b>{c.name}</b></Link></td>
                  <td>{c.title}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td style={{ maxWidth: 360 }}>
                    {c.last_email_at ? (
                      <>
                        <b>{fmtAgo(c.last_email_at)}</b> · {c.last_email_subject}
                        <div className="muted" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 340 }}>{c.last_email_snippet}</div>
                      </>
                    ) : <span className="muted">No emails</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "activity" && (
        <div className="card"><Timeline items={activities} /></div>
      )}

      {tab === "emails" && (
        <div className="card"><EmailList emails={emails} /></div>
      )}

      {tab === "documents" && (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr><th>Document</th><th>Type</th><th>Source</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td><a href={d.url ?? "#"} target="_blank" rel="noreferrer"><b>{d.name}</b></a></td>
                  <td><Badge value={d.type} /></td>
                  <td className="muted">{d.source === "sharepoint" ? "SharePoint" : "OneDrive"}</td>
                  <td className="muted">{fmtDate(d.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!documents.length && <div className="empty">No documents linked.</div>}
        </div>
      )}

      {tab === "engagements" && (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr><th>Engagement</th><th>Stage</th><th>Value</th><th>Owner</th><th>Start</th><th>Close</th></tr>
            </thead>
            <tbody>
              {engagements.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.name}</b>{e.clickup_task_id && <> <span className="badge clickup">ClickUp</span></>}</td>
                  <td><Badge value={e.stage} /></td>
                  <td>{money(e.value)}</td>
                  <td>{e.owner}</td>
                  <td className="muted">{fmtDate(e.start_date)}</td>
                  <td className="muted">{fmtDate(e.close_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
