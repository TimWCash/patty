import Link from "next/link";
import { listEmails } from "@/lib/queries";
import { getSelectedYear, yearFilter } from "@/lib/year";
import { microsoftStatus, getOutlookMessages } from "@/lib/integrations/microsoft";
import { PageTitle, EmailList, Badge, Avatar, fmtAgo } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const selected = await getSelectedYear();
  const emails = listEmails({ year: yearFilter(selected) });
  const ms = microsoftStatus();
  const live = ms.mode === "live" ? await getOutlookMessages(12) : null;

  return (
    <>
      <PageTitle first="EMAIL" accent="ACTIVITY" sub="Client email history across the whole team, threaded to people and companies." />

      {ms.mode === "live" ? (
        <div className="banner" style={{ borderLeftColor: "var(--dark-teal)", background: "rgba(18,69,89,0.05)" }}>
          <b style={{ color: "var(--dark-teal)" }}>Outlook connected{ms.account ? ` · ${ms.account}` : ""}.</b>
          {live ? ` Showing your ${live.length} most recent messages from Microsoft Graph, plus seeded client threads below.` : " Live fetch returned nothing — showing seeded client threads."}
        </div>
      ) : (
        <div className="banner">
          <b>{ms.configured ? "Microsoft 365 configured" : "Outlook not connected"}.</b>
          Showing sample data. Sign in with Microsoft to pull live mail via Graph — configure the Entra app in{" "}
          <Link href="/settings" style={{ fontWeight: 700, color: "var(--orange)" }}>Settings</Link>.
        </div>
      )}

      {live && live.length > 0 && (
        <>
          <div className="section-h" style={{ marginTop: 0 }}>Live from Outlook</div>
          <div className="card" style={{ marginBottom: 20 }}>
            {live.map((m) => (
              <div className="email-item" key={m.id}>
                <div className="email-who">
                  <Avatar name={m.from} tone={m.direction === "out" ? "navy" : "teal"} />
                  <div>
                    <div className="name">{m.from}</div>
                    <div className="co">{m.fromEmail}</div>
                  </div>
                </div>
                <div className="email-content">
                  <div className="email-subject"><Badge value={m.direction} /> {m.subject}</div>
                  <div className="email-snippet">{m.preview}</div>
                </div>
                <div className="email-when">{fmtAgo(m.receivedAt)}</div>
              </div>
            ))}
          </div>
          <div className="section-h">Seeded Client Threads</div>
        </>
      )}

      <div className="card">
        <EmailList emails={emails} />
      </div>
    </>
  );
}
