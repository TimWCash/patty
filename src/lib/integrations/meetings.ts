/**
 * Meeting notes integrations: Zoom AI Companion, Granola, Otter.ai.
 *
 * How each source feeds the hub in a live build:
 *
 * ZOOM (best API support)
 *   - Server-to-Server OAuth app with scopes: meeting:read, meeting_summary:read
 *   - GET https://api.zoom.us/v2/meetings/{meetingId}/meeting_summary
 *     returns AI Companion summary + next steps
 *   - Webhook event "meeting.summary_completed" pushes new summaries in real time
 *
 * GRANOLA
 *   - No full public REST API yet; supported paths:
 *     a) Zapier integration: "New note" trigger -> POST to this app's /api/ingest/meeting
 *     b) Granola's MCP/connector exports notes + action items as JSON
 *
 * OTTER.AI
 *   - No general public API (enterprise-only programmatic access)
 *   - Practical paths: Zapier "New transcript" trigger, or auto-forward
 *     Otter summary emails to an inbound-parse address that posts to /api/ingest/meeting
 *
 * Matching logic (shared): attendee emails from the meeting are matched against
 * contacts.email to link the meeting to a contact + company automatically.
 * external_id stores the source's meeting/note id for dedupe on re-sync.
 */
import { getSetting } from "../queries";

export type MeetingSource = "zoom" | "granola" | "otter";

export function meetingsStatus(): Record<MeetingSource, { configured: boolean; mode: "stub" | "live" }> {
  return {
    zoom: { configured: Boolean(getSetting("zoom_account_id") && getSetting("zoom_client_id")), mode: "stub" },
    granola: { configured: Boolean(getSetting("granola_webhook_secret")), mode: "stub" },
    otter: { configured: Boolean(getSetting("otter_inbound_address")), mode: "stub" },
  };
}
