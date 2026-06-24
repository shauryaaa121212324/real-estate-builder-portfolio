// ---------------------------------------------------------------------------
// Lead / CRM domain types
// ---------------------------------------------------------------------------

export type LeadSource =
  | 'website_inquiry'
  | 'brochure_request'
  | 'site_visit_request'
  | 'consultation_request'
  | 'referral'
  | 'walk_in'
  | 'call';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'site_visit_scheduled'
  | 'negotiation'
  | 'converted'
  | 'lost'
  | 'unqualified';

export type LeadPriority = 'low' | 'medium' | 'high';

export type BudgetRange =
  | 'under_50L'
  | '50L_1Cr'
  | '1Cr_2Cr'
  | '2Cr_5Cr'
  | 'above_5Cr';

export type PurchaseTimeline =
  | 'immediate'         // within 3 months
  | 'short_term'        // 3 – 6 months
  | 'medium_term'       // 6 – 12 months
  | 'long_term'         // 12+ months
  | 'just_exploring';

// ---------------------------------------------------------------------------
// Sub-shapes
// ---------------------------------------------------------------------------

export interface LeadNote {
  id: string;
  content: string;
  createdBy: string;    // admin user display name
  createdAt: string;    // ISO datetime
}

export interface LeadActivity {
  id: string;
  type:
    | 'status_change'
    | 'note_added'
    | 'email_sent'
    | 'call_logged'
    | 'site_visit'
    | 'document_shared';
  description: string;
  performedBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

export interface Lead {
  id: string;
  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Interest
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  interestedProjectIds: string[];     // references Project.id
  budgetRange: BudgetRange | null;
  purchaseTimeline: PurchaseTimeline | null;
  unitConfigPreference: string | null; // free-text or UnitConfig value
  // Admin
  assignedTo: string | null;           // admin user id
  notes: LeadNote[];
  activity: LeadActivity[];
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
}

// ---------------------------------------------------------------------------
// Form payloads (what the public-facing forms submit)
// ---------------------------------------------------------------------------

export interface InquiryFormPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  projectId?: string;
  budgetRange?: BudgetRange | null;
  purchaseTimeline?: PurchaseTimeline | null;
}

export interface BrochureRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  projectId: string;
}

export interface SiteVisitPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  projectId: string;
  preferredDate: string;   // ISO date
  preferredTime: string;   // e.g. "10:00"
}

export interface ConsultationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  budgetRange: BudgetRange | null;
  purchaseTimeline: PurchaseTimeline | null;
  message: string;
}

// ---------------------------------------------------------------------------
// Filter / query helpers
// ---------------------------------------------------------------------------

export interface LeadFilters {
  status?: LeadStatus[];
  priority?: LeadPriority[];
  source?: LeadSource[];
  assignedTo?: string;
  projectId?: string;
  search?: string;       // full-text across name / email / phone
  dateFrom?: string;
  dateTo?: string;
}