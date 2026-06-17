import Link from "next/link";
import { listDocuments } from "@/lib/queries";
import { microsoftStatus, getDriveItems, getSharePointDocs } from "@/lib/integrations/microsoft";
import { PageTitle, Badge, fmtDate, fmtAgo } from "@/components/ui";
import { IconCloud, IconFolder } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const documents = listDocuments();
  const ms = microsoftStatus();
  const live = ms.mode === "live" ? await getDriveItems(15) : null;
  const sharepoint = ms.mode === "live" && ms.sharePointSite ? await getSharePointDocs(20) : null;

  return (
    <>
      <PageTitle first="CLIENT" accent="DOCUMENTS" sub="Proposals, decks, and reports, linked from SharePoint and OneDrive rather than duplicated." />

      {ms.mode === "live" ? (
        <div className="banner" style={{ borderLeftColor: "var(--dark-teal)", background: "rgba(18,69,89,0.05)" }}>
          <b style={{ color: "var(--dark-teal)" }}>OneDrive connected{ms.account ? ` · ${ms.account}` : ""}.</b>
          {live ? ` Listing ${live.length} items live from Microsoft Graph, plus seeded client documents below.` : " Live fetch returned nothing — showing seeded documents."}
        </div>
      ) : (
        <div className="banner">
          <b>Sample links.</b> Sign in with Microsoft to list files straight from OneDrive/SharePoint via Graph.
          Configure in <Link href="/settings" style={{ fontWeight: 700, color: "var(--orange)" }}>Settings</Link>.
        </div>
      )}

      {sharepoint && sharepoint.length > 0 && (
        <>
          <div className="section-h" style={{ marginTop: 0 }}>Live from SharePoint</div>
          <div className="card" style={{ padding: 0, marginBottom: 20 }}>
            <table className="tbl">
              <thead><tr><th>Item</th><th>Type</th><th>Modified</th></tr></thead>
              <tbody>
                {sharepoint.map((d) => (
                  <tr key={d.id}>
                    <td><a href={d.webUrl} target="_blank" rel="noreferrer"><b>{d.name}</b></a></td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {d.isFolder ? <IconFolder width={14} height={14} /> : <IconCloud width={14} height={14} />}
                        {d.isFolder ? "Folder" : "File"}
                      </span>
                    </td>
                    <td className="muted">{fmtAgo(d.lastModified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {live && live.length > 0 && (
        <>
          <div className="section-h" style={{ marginTop: 0 }}>Live from OneDrive</div>
          <div className="card" style={{ padding: 0, marginBottom: 20 }}>
            <table className="tbl">
              <thead><tr><th>Item</th><th>Type</th><th>Modified</th></tr></thead>
              <tbody>
                {live.map((d) => (
                  <tr key={d.id}>
                    <td><a href={d.webUrl} target="_blank" rel="noreferrer"><b>{d.name}</b></a></td>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {d.isFolder ? <IconFolder width={14} height={14} /> : <IconCloud width={14} height={14} />}
                        {d.isFolder ? "Folder" : "File"}
                      </span>
                    </td>
                    <td className="muted">{fmtAgo(d.lastModified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="section-h">Seeded Client Documents</div>
        </>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr><th>Document</th><th>Company</th><th>Type</th><th>Source</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id}>
                <td><a href={d.url ?? "#"} target="_blank" rel="noreferrer"><b>{d.name}</b></a></td>
                <td><Link href={`/companies/${d.company_id}`}>{d.company_name}</Link></td>
                <td><Badge value={d.type} /></td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, verticalAlign: "middle" }}>
                    {d.source === "sharepoint" ? <IconFolder width={14} height={14} /> : <IconCloud width={14} height={14} />}
                    {d.source === "sharepoint" ? "SharePoint" : "OneDrive"}
                  </span>
                </td>
                <td className="muted">{fmtDate(d.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
