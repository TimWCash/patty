import { getSetting } from "@/lib/queries";
import { saveSettings } from "@/lib/actions";
import { microsoftStatus } from "@/lib/integrations/microsoft";
import { clickupStatus } from "@/lib/integrations/clickup";
import { meetingsStatus } from "@/lib/integrations/meetings";
import { PageTitle } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { getPerms } from "@/lib/access";

export const dynamic = "force-dynamic";

type State = "connected" | "ready" | "off";
function Pill({ state, label }: { state: State; label: string }) {
  const cls = state === "connected" ? "won" : state === "ready" ? "fee_proposal" : "lost";
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default async function SettingsPage() {
  if (!(await getPerms()).canSettings) {
    return (
      <>
        <PageTitle first="" accent="CONNECTIONS" />
        <div className="card"><div className="empty">Connections are admin-only. Ask an admin for access.</div></div>
      </>
    );
  }
  const ms = microsoftStatus();
  const cu = clickupStatus();
  const mt = meetingsStatus();

  const msState: State = ms.connected ? "connected" : ms.configured ? "ready" : "off";
  const spState: State = ms.connected && ms.sharePointSite ? "connected" : ms.sharePointSite ? "ready" : "off";
  const cuState: State = cu.configured ? "connected" : "off";
  const mtConfigured = mt.zoom.configured || mt.granola.configured || mt.otter.configured;
  const mtState: State = mtConfigured ? "connected" : "off";

  const connected = [msState, cuState, spState, mtState].filter((s) => s === "connected").length;

  return (
    <>
      <PageTitle first="" accent="CONNECTIONS" sub="Give Patty access to your tools. Each connection lights up live data in place of the sample data." />

      <div className="card anim-rise" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 16 }}>
        <div className="readiness-ring" style={{ ["--p" as string]: connected * 25 } as React.CSSProperties}>
          <span>{connected}/4</span>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 15 }}>
            {connected === 4 ? "All connected — Patty is live." : `${connected} of 4 connections active`}
          </div>
          <div className="tl-meta">Microsoft 365 · ClickUp · SharePoint · Meeting notes. Connect each below; nothing is destructive.</div>
        </div>
      </div>

      <form action={saveSettings}>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          {/* Microsoft 365 */}
          <div className="card">
            <div className="section-h" style={{ marginTop: 0 }}>
              Microsoft 365 <Pill state={msState} label={ms.connected ? `Connected · ${ms.account ?? "signed in"}` : ms.configured ? "Ready — sign in to connect" : "Not configured"} />
            </div>
            <p className="page-sub" style={{ marginBottom: 12 }}>
              Powers <b>Outlook email</b>, <b>OneDrive &amp; SharePoint documents</b>, and <b>sign-in + roles</b>.
            </p>
            <div className="conn-steps">
              <div><b>1.</b> Register an app in Microsoft Entra ID (admin center).</div>
              <div><b>2.</b> Redirect URI: <code className="endpoint">{"{your-url}"}/api/auth/callback</code></div>
              <div><b>3.</b> Delegated Graph scopes: <code>User.Read Mail.Read Files.Read.All Sites.Read.All offline_access</code></div>
              <div><b>4.</b> Put the tenant/client/secret in the server env (<code>AZURE_AD_*</code>) and restart.</div>
            </div>
            <p className="tl-meta" style={{ margin: "10px 0 4px" }}>
              {ms.configured
                ? "Environment configured. Team members sign in with Microsoft to activate Outlook + documents."
                : "Set AZURE_AD_TENANT_ID / CLIENT_ID / CLIENT_SECRET in .env.local (see .env.local.example)."}
            </p>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>SharePoint site</b> <span className="tl-meta">(document library to list)</span>
              <input type="text" name="sharepoint_site_url" defaultValue={getSetting("sharepoint_site_url") ?? ""} placeholder="servicephysics.sharepoint.com/sites/Clients" />
            </label>
          </div>

          {/* ClickUp */}
          <div className="card">
            <div className="section-h" style={{ marginTop: 0 }}>
              ClickUp <Pill state={cuState} label={cu.configured ? "Connected" : "Not connected"} />
            </div>
            <p className="page-sub" style={{ marginBottom: 12 }}>
              Powers <b>two-way task sync</b>, <b>status/notes write-back</b>, and <b>new-lead cards</b>.
            </p>
            <label className="kv"><b>API Token</b>
              <input type="password" name="clickup_token" defaultValue={getSetting("clickup_token") ?? ""} placeholder="pk_..." />
            </label>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>List ID</b>
              <input type="text" name="clickup_list_id" defaultValue={getSetting("clickup_list_id") ?? ""} placeholder="e.g. 901804123456" />
            </label>
            <div className="section-h" style={{ margin: "16px 0 8px" }}>New-Lead Card</div>
            <label className="kv"><b>Lead list ID</b> <span className="tl-meta">(optional)</span>
              <input type="text" name="clickup_lead_list_id" defaultValue={getSetting("clickup_lead_list_id") ?? ""} placeholder="defaults to List ID above" />
            </label>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Lead card template ID</b>
              <input type="text" name="clickup_lead_template_id" defaultValue={getSetting("clickup_lead_template_id") ?? ""} placeholder="task template to duplicate" />
            </label>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Custom field mapping (JSON)</b>
              <textarea name="clickup_lead_field_map" rows={3} defaultValue={getSetting("clickup_lead_field_map") ?? ""} placeholder={'{ "field_id_abc": "email" }'} style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }} />
            </label>
          </div>

          {/* Meeting notes */}
          <div className="card">
            <div className="section-h" style={{ marginTop: 0 }}>
              Meeting Notes <Pill state={mtState} label={mtConfigured ? "Connected" : "Not connected"} />
            </div>
            <p className="page-sub" style={{ marginBottom: 12 }}>
              Powers <b>meeting summaries &amp; action items</b> from Zoom AI, Granola, and Otter.
            </p>
            <label className="kv"><b>Zoom Account ID</b>
              <input type="text" name="zoom_account_id" defaultValue={getSetting("zoom_account_id") ?? ""} placeholder="Server-to-Server OAuth app" />
            </label>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Zoom Client ID</b>
              <input type="text" name="zoom_client_id" defaultValue={getSetting("zoom_client_id") ?? ""} placeholder="Client ID" />
            </label>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Zoom Client Secret</b>
              <input type="password" name="zoom_client_secret" defaultValue={getSetting("zoom_client_secret") ?? ""} placeholder="Secret" />
            </label>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Granola Webhook Secret</b>
              <input type="password" name="granola_webhook_secret" defaultValue={getSetting("granola_webhook_secret") ?? ""} placeholder="Via Zapier or connector" />
            </label>
            <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Otter Inbound Address</b>
              <input type="text" name="otter_inbound_address" defaultValue={getSetting("otter_inbound_address") ?? ""} placeholder="notes@hub.servicephysics.com" />
            </label>
          </div>

          {/* Website leads */}
          <div className="card">
            <div className="section-h" style={{ marginTop: 0 }}>
              Website Leads <Pill state="connected" label="Endpoint live" />
            </div>
            <p className="page-sub" style={{ marginBottom: 12 }}>
              Your Contact Us form already posts to Patty &mdash; no key needed. Each submission creates a prospect,
              opens a follow-up task, and (with ClickUp connected) a themed lead card.
            </p>
            <div className="conn-steps">
              <div><b>Endpoint:</b> <code className="endpoint">POST {"{your-url}"}/api/leads</code></div>
              <div>Point your website form here, or copy the snippet on the <b>Leads</b> page.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <SubmitButton>Save connections</SubmitButton>
        </div>
      </form>
    </>
  );
}
