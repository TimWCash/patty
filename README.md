# Patty — Service Physics Client Hub

A custom CRM prototype for Service Physics. Real client data from ClickUp. Microsoft 365 + ClickUp integrations.

## Quick Start

```bash
npm install
npm run seed
npm run dev
```

Open http://localhost:3100. Dashboard loads with seeded clients (97 companies, 44 enriched from ClickUp).

## To Activate Integrations

### Microsoft 365 (Outlook email, OneDrive, SharePoint, sign-in + roles)

1. Register an app in Azure Entra ID
   - Redirect URI: `http://localhost:3100/api/auth/callback`
   - Graph scopes: `User.Read Mail.Read Files.Read.All Sites.Read.All offline_access openid profile email`
2. Copy `.env.local.example` to `.env.local`:
   ```
   AZURE_AD_TENANT_ID=...
   AZURE_AD_CLIENT_ID=...
   AZURE_AD_CLIENT_SECRET=...
   ```
3. Restart dev server. Team can now sign in with Microsoft.

### ClickUp (task sync, lead cards)

1. Get API token + engagement list ID
2. Go to **Connections** (Settings, admin-only)
3. Paste token + list ID, save
4. Optional: set lead card template ID + field map

### SharePoint Documents

1. In **Connections**, paste SharePoint site URL (e.g. `servicephysics.sharepoint.com/sites/Clients`)
2. Live documents appear on Documents page

### Website Lead Intake

Public endpoint: **POST `/api/leads`**. Point your Contact Us form here; new submissions create a prospect + follow-up task.

## Features

- **97 Real Clients**: 85 from ClickUp, 44 with enriched profiles (revenue, founders, competitors, units)
- **Pipeline**: Real funnel stages (intro → pitch → proposal → won/lost)
- **Re-engagement**: Past clients untouched 6+ months flagged
- **RBAC**: 4 roles with permission matrix (admin/member/contributor/observer)
- **Year Filter**: Scope views to All / 2025 / 2026 / 2027
- **Connections**: One screen to wire Microsoft 365, ClickUp, SharePoint, meeting notes
- **Command Palette**: Cmd+K to search companies, people, engagements
- **Activity Timeline**: Notes, stage changes, meetings, tasks per company

## Stack

- Next.js 16 (App Router, server components, server actions)
- SQLite (`better-sqlite3`, `data/hub.db`)
- Plain CSS (Service Physics brand: navy, dark teal, orange)
- Microsoft Graph, ClickUp, meeting-notes integrations

## Notes

- Without `AZURE_AD_*` env vars, the app runs open (no sign-in) — good for local testing
- Seed includes 12 sample + 85 real Service Physics clients from ClickUp
- SharePoint/OneDrive files are read-only
- AI assistant Patty (`/api/chat`, read-only SQL) awaits `ANTHROPIC_API_KEY` in .env.local

## Deployment

Push to Azure App Service / Vercel with env vars:
- `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`
- `ANTHROPIC_API_KEY` (optional, for AI)
- Use persistent storage for `data/hub.db`

---

Built Jun 2026. Real client data from [ClickUp Client Database](https://app.clickup.com/28qcm-10410).
