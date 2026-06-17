import Link from "next/link";
import { headers } from "next/headers";
import { listLeads } from "@/lib/queries";
import { getPerms } from "@/lib/access";
import { markLeadReviewed } from "@/lib/actions";
import { PageTitle, fmtAgo } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = listLeads();
  const canReview = (await getPerms()).canLeads;
  const newCount = leads.filter((l) => l.status === "new").length;
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "your-patty-host"}`;
  const endpoint = `${origin}/api/leads`;

  const snippet = `<form action="${endpoint}" method="POST">
  <input name="name" placeholder="Name" required />
  <input name="email" type="email" placeholder="Email" required />
  <input name="company" placeholder="Company" />
  <input name="phone" placeholder="Phone" />
  <textarea name="message" placeholder="How can we help?"></textarea>
  <input name="website" type="text" style="display:none" tabindex="-1" autocomplete="off" />
  <button type="submit">Send</button>
</form>`;

  return (
    <>
      <PageTitle first="WEBSITE" accent="LEADS" sub="Contact-form submissions from servicephysics.com land here, auto-create a prospect profile, and open a follow-up task." />

      <div className="grid two-col" style={{ alignItems: "start" }}>
        <div>
          {newCount > 0 && (
            <div className="alert-bar" style={{ borderLeftColor: "var(--dark-teal)", background: "rgba(18,69,89,0.05)" }}>
              <span className="alert-bar-icon" style={{ background: "rgba(18,69,89,0.12)", color: "var(--dark-teal)" }} aria-hidden="true">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
              </span>
              <div className="alert-bar-body" style={{ color: "var(--dark-teal)" }}>
                <b style={{ color: "var(--dark-teal)" }}>{newCount} new lead{newCount === 1 ? "" : "s"}</b> awaiting review.
              </div>
            </div>
          )}

          {leads.length === 0 && <div className="card"><div className="empty">No leads yet. Submissions will appear here.</div></div>}

          {leads.map((l) => (
            <div className={`card lead-card ${l.status === "new" ? "is-new" : ""}`} key={l.id}>
              <div className="lead-head">
                <div>
                  <span className="lead-name">{l.name}</span>
                  {l.status === "new" && <span className="badge proposal" style={{ marginLeft: 8 }}>New</span>}
                </div>
                <span className="tl-meta">{fmtAgo(l.created_at)} · via {l.source}</span>
              </div>
              <div className="kv" style={{ margin: "4px 0 8px" }}>
                {l.company && <><b>{l.company}</b> · </>}
                {l.email && <a href={`mailto:${l.email}`}>{l.email}</a>}
                {l.phone && <> · {l.phone}</>}
              </div>
              {l.message && <p className="meeting-summary" style={{ marginBottom: 10 }}>{l.message}</p>}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {l.company_id && (
                  <Link href={`/companies/${l.company_id}`} className="btn ghost">View profile</Link>
                )}
                {l.status === "new" && canReview && (
                  <form action={markLeadReviewed.bind(null, l.id)}>
                    <SubmitButton className="btn" pendingText="Saving...">Mark reviewed</SubmitButton>
                  </form>
                )}
                {l.status !== "new" && <span className="tl-meta">Reviewed</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-h" style={{ marginTop: 0 }}>Connect your website</div>
          <p className="page-sub" style={{ marginBottom: 12 }}>
            Point your Contact Us form at this endpoint. Each submission creates a prospect profile,
            logs the inquiry, opens a follow-up task (synced to ClickUp), and alerts the team.
          </p>
          <div className="kv" style={{ marginBottom: 10 }}><b>Endpoint</b><br /><code className="endpoint">POST {endpoint}</code></div>
          <p className="tl-meta" style={{ marginBottom: 8 }}>Drop-in HTML (also accepts JSON):</p>
          <pre className="code-block">{snippet}</pre>
          <p className="tl-meta" style={{ marginTop: 10 }}>
            The hidden <code>website</code> field is a spam honeypot. For production, add a CAPTCHA and rate limiting.
          </p>
        </div>
      </div>
    </>
  );
}
