import Link from "next/link";
import { listMeetings } from "@/lib/queries";
import { getSelectedYear, yearFilter } from "@/lib/year";
import { meetingsStatus } from "@/lib/integrations/meetings";
import { PageTitle, fmtAgo } from "@/components/ui";
import { IconCheck, IconClock, IconVideo } from "@/components/icons";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = { zoom: "Zoom AI", granola: "Granola", otter: "Otter.ai" };

export default async function MeetingsPage() {
  const selected = await getSelectedYear();
  const meetings = listMeetings({ year: yearFilter(selected) });
  const status = meetingsStatus();
  const connected = Object.values(status).filter((s) => s.configured).length;

  return (
    <>
      <PageTitle first="CLIENT" accent="MEETINGS" sub="Notes, summaries, and action items pulled in from Zoom AI Companion, Granola, and Otter." />

      <div className="banner">
        <b>{connected ? `${connected} of 3 sources configured.` : "Meeting sources not connected."}</b>
        Showing sample summaries. Zoom syncs via its summary API, Granola and Otter via webhooks.
        Configure in <Link href="/settings" style={{ fontWeight: 700, color: "var(--orange)" }}>Settings</Link>.
      </div>

      {meetings.length === 0 && <div className="card"><div className="empty">No meetings in {selected}.</div></div>}

      <div className="meeting-grid">
        {meetings.map((m) => {
          const items: string[] = m.action_items ? JSON.parse(m.action_items) : [];
          return (
            <article className="card meeting-card anim-rise" key={m.id}>
              <div className="meeting-head">
                <span className={`source-badge ${m.source}`}>
                  <IconVideo width={12} height={12} /> {SOURCE_LABEL[m.source]}
                </span>
                <span className="tl-meta" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <IconClock width={12} height={12} /> {fmtAgo(m.occurred_at)} · {m.duration_min} min
                </span>
              </div>
              <h3 className="meeting-title">{m.title}</h3>
              <div className="tl-meta" style={{ marginBottom: 10 }}>
                {m.company_id && <Link href={`/companies/${m.company_id}`} style={{ fontWeight: 700, color: "var(--light-teal)" }}>{m.company_name}</Link>}
                {m.contact_name ? <> · with {m.contact_name}</> : null}
              </div>
              <p className="meeting-summary">{m.summary}</p>
              {items.length > 0 && (
                <div className="action-items">
                  <div className="section-h" style={{ margin: "12px 0 8px" }}>Action Items</div>
                  <ul>
                    {items.map((it) => (
                      <li key={it}>
                        <IconCheck width={13} height={13} className="ai-check" /> {it}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
