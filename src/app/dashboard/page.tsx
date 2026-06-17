import Link from "next/link";
import { dashboardStats, emailsByMonth, emailsPerDay, listActivities, listEngagements, listEmails } from "@/lib/queries";
import { getSelectedYear, yearFilter } from "@/lib/year";
import { ActivitySpark, StageBars } from "@/components/charts";
import { PageTitle, Badge, Timeline, Avatar, money, fmtAgo } from "@/components/ui";
import { IconDollar, IconMail, IconTasks, IconTrendUp } from "@/components/icons";
import { STAGES, CLOSED_STAGES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const selected = await getSelectedYear();
  const year = yearFilter(selected);
  const stats = dashboardStats(year);
  const activity = listActivities({ limit: 8, year });
  const engagements = listEngagements(undefined, year);
  const recentEmails = listEmails({ limit: 5, year });

  const open = engagements.filter((e) => !CLOSED_STAGES.includes(e.stage));
  const emailVolume = year ? emailsByMonth(year) : emailsPerDay(14);
  const emailChartLabel = year ? `Email Volume · ${year}` : "Email Volume · 14 Days";
  const stageData = STAGES.filter((s) => s.key !== "lost").map((s) => ({
    label: s.label,
    value: engagements.filter((e) => e.stage === s.key).reduce((a, b) => a + b.value, 0),
    accent: s.key === "won",
  }));

  return (
    <>
      <PageTitle first="CLIENT" accent="HUB" sub={selected === "all" ? "One place for every client relationship: people, emails, documents, and work in flight." : `Showing ${selected}. Use the year filter in the top bar to change the view.`} />

      <div className="grid kpis">
        <div className="card kpi">
          <div className="kpi-label">Active Engagements</div>
          <div className="kpi-row">
            <div className="kpi-value">{stats.activeEngagements}</div>
            <span className="kpi-icon"><IconTrendUp width={18} height={18} /></span>
          </div>
        </div>
        <div className="card kpi accent">
          <div className="kpi-label">Pipeline Value</div>
          <div className="kpi-row">
            <div className="kpi-value accent">{money(stats.pipelineValue)}</div>
            <span className="kpi-icon"><IconDollar width={18} height={18} /></span>
          </div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">Open Tasks</div>
          <div className="kpi-row">
            <div className="kpi-value">{stats.openTasks}</div>
            <span className="kpi-icon"><IconTasks width={18} height={18} /></span>
          </div>
        </div>
        <div className="card kpi">
          <div className="kpi-label">{year ? `Emails in ${year}` : "Emails This Week"}</div>
          <div className="kpi-row">
            <div className="kpi-value">{stats.emailsThisWeek}</div>
            <span className="kpi-icon"><IconMail width={18} height={18} /></span>
          </div>
        </div>
      </div>

      <div className="grid two-col" style={{ marginBottom: 16 }}>
        <div className="card anim-rise">
          <div className="section-h" style={{ marginTop: 0 }}>Pipeline by Stage</div>
          <StageBars data={stageData} />
        </div>
        <div className="card anim-rise">
          <div className="section-h" style={{ marginTop: 0 }}>{emailChartLabel}</div>
          <ActivitySpark data={emailVolume} />
        </div>
      </div>

      <div className="grid two-col">
        <div>
          <div className="card anim-rise">
            <div className="section-h" style={{ marginTop: 0 }}>Recent Activity</div>
            <Timeline items={activity} showCompany />
          </div>
          <div className="card" style={{ marginTop: 14 }}>
            <div className="section-h" style={{ marginTop: 0 }}>
              Latest Emails · <Link href="/emails" style={{ color: "var(--orange)" }}>view all</Link>
            </div>
            {recentEmails.map((e) => (
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

        <div className="card">
          <div className="section-h" style={{ marginTop: 0 }}>
            Open Pipeline · <Link href="/pipeline" style={{ color: "var(--orange)" }}>board</Link>
          </div>
          {STAGES.filter((s) => !CLOSED_STAGES.includes(s.key)).map((s) => {
            const rows = open.filter((e) => e.stage === s.key);
            if (!rows.length) return null;
            return (
              <div key={s.key} style={{ marginBottom: 14 }}>
                <div className="tl-meta" style={{ marginBottom: 6 }}>
                  <Badge value={s.key} /> {money(rows.reduce((a, b) => a + b.value, 0))}
                </div>
                {rows.map((e) => (
                  <div key={e.id} style={{ fontSize: 13, padding: "4px 0" }}>
                    <Link href={`/companies/${e.company_id}`}><b>{e.company_name}</b></Link> · {e.name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
