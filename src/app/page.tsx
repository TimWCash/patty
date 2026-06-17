import Link from "next/link";
import {
  dashboardStats, listEngagements, listEmails, listMeetings, tasksDueSoon, staleClients, newLeadCount,
} from "@/lib/queries";
import { getSelectedYear, yearFilter } from "@/lib/year";
import { Badge, Avatar, money, fmtAgo, fmtDate } from "@/components/ui";
import {
  IconArrowRight, IconBuilding, IconClock, IconDashboard, IconKanban, IconUsers, IconVideo,
} from "@/components/icons";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const SOURCE_LABEL: Record<string, string> = { zoom: "Zoom AI", granola: "Granola", otter: "Otter.ai" };

export default async function Home() {
  const selected = await getSelectedYear();
  const year = yearFilter(selected);
  const stats = dashboardStats(year);
  const due = tasksDueSoon(3);
  const meetings = listMeetings({ limit: 3, year });
  const emails = listEmails({ limit: 4, year });
  const proposals = listEngagements(undefined, year).filter((e) => e.stage === "no_fee_proposal" || e.stage === "fee_proposal");
  const stale = staleClients(6);
  const leadCount = newLeadCount();

  return (
    <>
      <header className="hero anim-rise">
        <div>
          <div className="hero-eyebrow">Patty · Client Hub{selected === "all" ? "" : ` · ${selected}`}</div>
          <h1 className="hero-title">
            {greeting()}. <span className="accent">Here&apos;s where things stand.</span>
          </h1>
          <p className="page-sub">
            {stats.activeEngagements} active engagements · {money(stats.pipelineValue)} in open pipeline · {due.length} tasks need attention in the next 3 days.
          </p>
        </div>
        <div className="hero-actions">
          <Link href="/dashboard" className="btn"><IconDashboard width={14} height={14} /> Full dashboard</Link>
          <Link href="/pipeline" className="btn orange"><IconKanban width={14} height={14} /> Pipeline board</Link>
        </div>
      </header>

      {leadCount > 0 && (
        <div className="alert-bar anim-rise" style={{ borderLeftColor: "var(--dark-teal)", background: "rgba(18,69,89,0.05)" }}>
          <span className="alert-bar-icon" style={{ background: "rgba(18,69,89,0.12)", color: "var(--dark-teal)" }} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
          </span>
          <div className="alert-bar-body" style={{ color: "var(--dark-teal)" }}>
            <b style={{ color: "var(--dark-teal)" }}>{leadCount} new website lead{leadCount === 1 ? "" : "s"}.</b>{" "}
            A contact-form submission created a prospect profile and a follow-up task.{" "}
            <Link href="/leads" style={{ fontWeight: 700, color: "var(--orange)" }}>Review leads</Link>
          </div>
        </div>
      )}

      {stale.length > 0 && (
        <div className="alert-bar anim-rise">
          <span className="alert-bar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          </span>
          <div className="alert-bar-body">
            <b>{stale.length} past client{stale.length === 1 ? "" : "s"} not touched in 6+ months.</b>{" "}
            {stale.slice(0, 3).map((c, i) => (
              <span key={c.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/companies/${c.id}`} style={{ fontWeight: 700, color: "var(--orange)" }}>{c.name}</Link>
                <span className="tl-meta"> ({c.last_touch ? `last touch ${fmtAgo(c.last_touch)}` : "no touch on record"})</span>
              </span>
            ))}
            {stale.length > 3 && <span className="tl-meta">, +{stale.length - 3} more</span>}
          </div>
        </div>
      )}

      <div className="quick-grid">
        <Link href="/companies" className="card quick-card anim-rise">
          <span className="quick-icon"><IconBuilding width={17} height={17} /></span>
          <div><b>Companies</b><div className="tl-meta">8 clients &amp; prospects</div></div>
          <IconArrowRight className="quick-arrow" width={14} height={14} />
        </Link>
        <Link href="/people" className="card quick-card anim-rise">
          <span className="quick-icon"><IconUsers width={17} height={17} /></span>
          <div><b>People</b><div className="tl-meta">20 contacts</div></div>
          <IconArrowRight className="quick-arrow" width={14} height={14} />
        </Link>
        <Link href="/meetings" className="card quick-card anim-rise">
          <span className="quick-icon"><IconVideo width={17} height={17} /></span>
          <div><b>Meetings</b><div className="tl-meta">Notes &amp; action items</div></div>
          <IconArrowRight className="quick-arrow" width={14} height={14} />
        </Link>
        <Link href="/tasks" className="card quick-card anim-rise">
          <span className="quick-icon"><IconClock width={17} height={17} /></span>
          <div><b>Tasks</b><div className="tl-meta">{stats.openTasks} open</div></div>
          <IconArrowRight className="quick-arrow" width={14} height={14} />
        </Link>
      </div>

      <div className="grid two-col">
        <div>
          <div className="card anim-rise">
            <div className="section-h" style={{ marginTop: 0 }}>
              Latest Meeting Notes · <Link href="/meetings" style={{ color: "var(--orange)" }}>all meetings</Link>
            </div>
            {meetings.map((m) => (
              <div className="home-meeting" key={m.id}>
                <div className="meeting-head">
                  <span className={`source-badge ${m.source}`}><IconVideo width={11} height={11} /> {SOURCE_LABEL[m.source]}</span>
                  <span className="tl-meta">{fmtAgo(m.occurred_at)}</span>
                </div>
                <b style={{ fontSize: 13 }}>{m.title}</b>
                <div className="tl-meta" style={{ margin: "2px 0 6px" }}>
                  <Link href={`/companies/${m.company_id}`} style={{ color: "var(--light-teal)", fontWeight: 700 }}>{m.company_name}</Link>
                  {m.contact_name ? <> · {m.contact_name}</> : null}
                </div>
                <p className="meeting-summary clamp-2">{m.summary}</p>
              </div>
            ))}
          </div>

          <div className="card anim-rise" style={{ marginTop: 16 }}>
            <div className="section-h" style={{ marginTop: 0 }}>
              Recent Emails · <Link href="/emails" style={{ color: "var(--orange)" }}>view all</Link>
            </div>
            {emails.map((e) => (
              <div className="email-item" key={e.id}>
                <div className="email-who">
                  <Avatar name={e.contact_name} tone={e.direction === "out" ? "navy" : "teal"} />
                  <div>
                    <div className="name">{e.contact_name}</div>
                    <div className="co">{e.company_name}</div>
                  </div>
                </div>
                <div className="email-content">
                  <div className="email-subject"><Badge value={e.direction} /> {e.subject}</div>
                  <div className="email-snippet">{e.snippet}</div>
                </div>
                <div className="email-when">{fmtAgo(e.sent_at)}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {stale.length > 0 && (
            <div className="card anim-rise" style={{ marginBottom: 16, borderLeft: "3px solid var(--orange)" }}>
              <div className="section-h" style={{ marginTop: 0 }}>Re-engage · Dormant Past Clients</div>
              {stale.map((c) => (
                <div className="due-item" key={c.id}>
                  <div>
                    <Link href={`/companies/${c.id}`}><b style={{ fontSize: 12.5 }}>{c.name}</b></Link>
                    <div className="tl-meta">{c.industry}</div>
                  </div>
                  <span className="tl-meta" style={{ whiteSpace: "nowrap" }}>
                    {c.last_touch ? fmtAgo(c.last_touch) : "no touch"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="card anim-rise">
            <div className="section-h" style={{ marginTop: 0 }}>Due Next 3 Days</div>
            {due.length === 0 && <div className="empty">Nothing due. Clear runway.</div>}
            {due.map((t) => (
              <div className="due-item" key={t.id}>
                <div>
                  <b style={{ fontSize: 12.5 }}>{t.title}</b>
                  <div className="tl-meta">
                    {t.company_name ?? "Internal"} · {t.assignee} · due {fmtDate(t.due_date)}
                  </div>
                </div>
                <Badge value={t.status} />
              </div>
            ))}
          </div>

          <div className="card anim-rise" style={{ marginTop: 16 }}>
            <div className="section-h" style={{ marginTop: 0 }}>Proposals Awaiting Decision</div>
            {proposals.map((e) => (
              <div className="due-item" key={e.id}>
                <div>
                  <b style={{ fontSize: 12.5 }}>{e.name}</b>
                  <div className="tl-meta">
                    <Link href={`/companies/${e.company_id}`} style={{ color: "var(--light-teal)", fontWeight: 700 }}>{e.company_name}</Link> · {e.owner}
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: 13 }}>{money(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
