// =============================================================================
// Autor Builders — Lead Service
// src/services/leadService.ts
// =============================================================================
// Handles all public-facing form submissions and admin CRM operations.
// =============================================================================

import { supabase } from '../lib/supabase';
import type {
  DbLead,
  DbLeadInsert,
  DbLeadUpdate,
  DbLeadNote,
  DbLeadActivity,
} from '../types/database.types';
import type {
  Lead,
  LeadFilters,
  InquiryFormPayload,
  BrochureRequestPayload,
  SiteVisitPayload,
  ConsultationPayload,
} from '../types/lead';

// ---------------------------------------------------------------------------
// Mapper: DB row → App type
// ---------------------------------------------------------------------------

function mapLead(row: DbLead): Lead {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    status: row.status,
    priority: row.priority,
    interestedProjectIds: row.interested_project_ids,
    budgetRange: row.budget_range,
    purchaseTimeline: row.purchase_timeline,
    unitConfigPreference: row.unit_config_preference,
    assignedTo: row.assigned_to,
    notes: row.notes.map((n) => ({
      id: n.id,
      content: n.content,
      createdBy: n.createdBy,
      createdAt: n.createdAt,
    })),
    activity: row.activity.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      performedBy: a.performedBy,
      createdAt: a.createdAt,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastContactedAt: row.last_contacted_at,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  // crypto.randomUUID() requires HTTPS; this works everywhere
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function nowIso(): string {
  return new Date().toISOString();
}

function activityEntry(
  type: DbLeadActivity['type'],
  description: string,
): DbLeadActivity {
  return {
    id: generateId(),
    type,
    description,
    performedBy: 'system',
    createdAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// Public form submission handlers
// ---------------------------------------------------------------------------

/**
 * General inquiry from the Contact page or project detail CTA.
 */
export async function submitInquiry(payload: InquiryFormPayload): Promise<void> {
  const insert: DbLeadInsert = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    source: 'website_inquiry',
    status: 'new',
    priority: 'medium',
    interested_project_ids: payload.projectId ? [payload.projectId] : [],
    budget_range: payload.budgetRange ?? null,
    purchase_timeline: payload.purchaseTimeline ?? null,
    unit_config_preference: null,
    message: payload.message,
    assigned_to: null,
    notes: [],
    activity: [activityEntry('status_change', 'Lead created via website inquiry form.')],
    last_contacted_at: null,
  };

  const { error } = await supabase.from('leads').insert(insert);
  if (error) throw error;
}

/**
 * Brochure download request from a project detail page.
 */
export async function submitBrochureRequest(payload: BrochureRequestPayload): Promise<void> {
  const insert: DbLeadInsert = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    source: 'brochure_request',
    status: 'new',
    priority: 'low',
    interested_project_ids: [payload.projectId],
    budget_range: null,
    purchase_timeline: null,
    unit_config_preference: null,
    message: null,
    assigned_to: null,
    notes: [],
    activity: [activityEntry('document_shared', 'Lead created via brochure download request.')],
    last_contacted_at: null,
  };

  const { error } = await supabase.from('leads').insert(insert);
  if (error) throw error;
}

/**
 * Site visit booking.
 */
export async function submitSiteVisit(payload: SiteVisitPayload): Promise<void> {
  const insert: DbLeadInsert = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    source: 'site_visit_request',
    status: 'site_visit_scheduled',
    priority: 'high',
    interested_project_ids: [payload.projectId],
    budget_range: null,
    purchase_timeline: null,
    unit_config_preference: null,
    message: `Preferred date: ${payload.preferredDate} at ${payload.preferredTime}`,
    assigned_to: null,
    notes: [],
    activity: [
      activityEntry(
        'site_visit',
        `Site visit requested for ${payload.preferredDate} at ${payload.preferredTime}.`,
      ),
    ],
    last_contacted_at: null,
  };

  const { error } = await supabase.from('leads').insert(insert);
  if (error) throw error;
}

/**
 * Schedule a consultation ("Schedule Consultation" CTA in Navbar).
 */
export async function submitConsultation(payload: ConsultationPayload): Promise<void> {
  const insert: DbLeadInsert = {
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    source: 'consultation_request',
    status: 'new',
    priority: payload.budgetRange === 'above_5Cr' || payload.budgetRange === '2Cr_5Cr'
      ? 'high'
      : 'medium',
    interested_project_ids: [],
    budget_range: payload.budgetRange,
    purchase_timeline: payload.purchaseTimeline,
    unit_config_preference: null,
    message: payload.message,
    assigned_to: null,
    notes: [],
    activity: [activityEntry('status_change', 'Lead created via consultation request form.')],
    last_contacted_at: null,
  };

  const { error } = await supabase.from('leads').insert(insert);
  if (error) throw error;
}
// ---------------------------------------------------------------------------
// Admin CRM queries  (require authenticated session)
// ---------------------------------------------------------------------------

/**
 * Fetch leads with optional filtering. Returns paginated results.
 */
export async function getLeads(
  filters?: LeadFilters,
  page = 1,
  pageSize = 25,
): Promise<{ data: Lead[]; count: number }> {
  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.priority?.length) {
    query = query.in('priority', filters.priority);
  }
  if (filters?.source?.length) {
    query = query.in('source', filters.source);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.projectId) {
    query = query.contains('interested_project_ids', [filters.projectId]);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }
  if (filters?.search) {
    // Uses the gin_trgm_ops index on the concatenated search column
    const term = `%${filters.search}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []).map(mapLead), count: count ?? 0 };
}

/**
 * Fetch a single lead by id.
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return mapLead(data);
}

/**
 * Update status, priority, assignment, etc.
 */
export async function updateLead(id: string, payload: DbLeadUpdate): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapLead(data);
}

/**
 * Append a note to a lead (merges into JSONB array).
 */
export async function addLeadNote(
  id: string,
  content: string,
  createdBy: string,
): Promise<Lead> {
  const lead = await getLeadById(id);
  if (!lead) throw new Error(`Lead ${id} not found`);

  const newNote: DbLeadNote = {
    id: generateId(),
    content,
    createdBy,
    createdAt: nowIso(),
  };

  const updatedNotes: DbLeadNote[] = [
    ...lead.notes.map((n) => ({
      id: n.id,
      content: n.content,
      createdBy: n.createdBy,
      createdAt: n.createdAt,
    })),
    newNote,
  ];

  return updateLead(id, { notes: updatedNotes });
}

/**
 * Append an activity entry to a lead's audit trail.
 */
export async function addLeadActivity(
  id: string,
  type: DbLeadActivity['type'],
  description: string,
  performedBy: string,
): Promise<Lead> {
  const lead = await getLeadById(id);
  if (!lead) throw new Error(`Lead ${id} not found`);

  const entry: DbLeadActivity = {
    id: generateId(),
    type,
    description,
    performedBy,
    createdAt: nowIso(),
  };

  const updatedActivity: DbLeadActivity[] = [
    ...lead.activity.map((a) => ({
      id: a.id,
      type: a.type as DbLeadActivity['type'],
      description: a.description,
      performedBy: a.performedBy,
      createdAt: a.createdAt,
    })),
    entry,
  ];

  return updateLead(id, {
    activity: updatedActivity,
    last_contacted_at: nowIso(),
  });
}

/**
 * Change lead status with automatic activity logging.
 */
export async function changeLeadStatus(
  id: string,
  newStatus: DbLead['status'],
  changedBy: string,
): Promise<Lead> {
  const lead = await getLeadById(id);
  if (!lead) throw new Error(`Lead ${id} not found`);

  const entry: DbLeadActivity = {
    id: generateId(),
    type: 'status_change',
    description: `Status changed from "${lead.status}" to "${newStatus}".`,
    performedBy: changedBy,
    createdAt: nowIso(),
  };

  const updatedActivity: DbLeadActivity[] = [
    ...lead.activity.map((a) => ({
      id: a.id,
      type: a.type as DbLeadActivity['type'],
      description: a.description,
      performedBy: a.performedBy,
      createdAt: a.createdAt,
    })),
    entry,
  ];

  return updateLead(id, {
    status: newStatus,
    activity: updatedActivity,
  });
}