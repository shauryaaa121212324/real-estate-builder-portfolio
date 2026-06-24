// =============================================================================
// supabase/functions/notify-new-lead/index.ts
// =============================================================================
// Triggered by a Supabase Database Webhook on INSERT into public.leads.
// Sends an email notification via Resend to the sales team.
// =============================================================================

import { Resend } from 'resend';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_TO = Deno.env.get('LEAD_NOTIFY_EMAIL') ?? 'sales@autorbuilders.in';
const NOTIFY_FROM = Deno.env.get('LEAD_NOTIFY_FROM') ?? 'leads@autorbuilders.in';

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY secret');
}

const resend = new Resend(RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Types — shape of the row as sent by the Database Webhook payload
// ---------------------------------------------------------------------------

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  priority: string;
  interested_project_ids: string[] | null;
  budget_range: string | null;
  purchase_timeline: string | null;
  unit_config_preference: string | null;
  message: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: LeadRow;
  old_record: LeadRow | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildSubject(lead: LeadRow): string {
  const name = `${lead.first_name} ${lead.last_name}`.trim();
  const sourceLabel = formatLabel(lead.source);
  const priorityTag = lead.priority === 'high' ? '[HIGH PRIORITY] ' : '';
  return `${priorityTag}New Lead: ${name} — ${sourceLabel}`;
}

function buildHtml(lead: LeadRow): string {
  const name = `${escapeHtml(lead.first_name)} ${escapeHtml(lead.last_name)}`;
  const projectIds = lead.interested_project_ids?.length
    ? lead.interested_project_ids.join(', ')
    : '—';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1B1B1B;">
      <h2 style="margin-bottom: 4px;">New Lead Received</h2>
      <p style="color:#666; margin-top:0;">Source: ${escapeHtml(formatLabel(lead.source))} · Priority: ${escapeHtml(formatLabel(lead.priority))}</p>
      <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding:6px 0; color:#888; width:160px;">Name</td><td style="padding:6px 0;">${name}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td></tr>
        <tr><td style="padding:6px 0; color:#888;">Phone</td><td style="padding:6px 0;"><a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a></td></tr>
        <tr><td style="padding:6px 0; color:#888;">Status</td><td style="padding:6px 0;">${escapeHtml(formatLabel(lead.status))}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Budget Range</td><td style="padding:6px 0;">${escapeHtml(formatLabel(lead.budget_range))}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Purchase Timeline</td><td style="padding:6px 0;">${escapeHtml(formatLabel(lead.purchase_timeline))}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Unit Config Pref</td><td style="padding:6px 0;">${escapeHtml(lead.unit_config_preference)}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Interested Project(s)</td><td style="padding:6px 0;">${escapeHtml(projectIds)}</td></tr>
        <tr><td style="padding:6px 0; color:#888; vertical-align:top;">Message</td><td style="padding:6px 0; white-space:pre-wrap;">${escapeHtml(lead.message)}</td></tr>
        <tr><td style="padding:6px 0; color:#888;">Created At</td><td style="padding:6px 0;">${escapeHtml(lead.created_at)}</td></tr>
      </table>
      <p style="margin-top:24px; font-size:12px; color:#aaa;">Lead ID: ${escapeHtml(lead.id)}</p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('Invalid JSON payload', err);
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'leads') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const lead = payload.record;

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      subject: buildSubject(lead),
      html: buildHtml(lead),
    });

    if (error) {
      console.error('Resend error', error);
      return new Response(JSON.stringify({ error }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), { status: 200 });
  } catch (err) {
    console.error('Unhandled error sending email', err);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
  }
});