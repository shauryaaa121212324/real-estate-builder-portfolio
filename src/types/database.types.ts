// =============================================================================
// Autor Builders — Supabase Database Types
// Auto-maintained: keep in sync with 001_schema.sql
// =============================================================================
// These are the RAW row shapes that come back from Supabase queries.
// The src/types/project.ts interfaces are the APP-LAYER shapes (camelCase).
// The service layer maps between the two.
// =============================================================================

// ---------------------------------------------------------------------------
// Enum mirrors
// ---------------------------------------------------------------------------

export type DbProjectStatus =
  | 'upcoming'
  | 'ongoing'
  | 'ready_to_move'
  | 'completed';

export type DbProjectCategory =
  | 'residential'
  | 'villa'
  | 'commercial'
  | 'plotted_development'
  | 'mixed_use';

export type DbUnitConfig =
  | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK'
  | 'duplex' | 'penthouse' | 'studio' | 'villa';

export type DbAmenityCategory =
  | 'wellness' | 'recreation' | 'convenience' | 'security' | 'green';

export type DbMediaType = 'image' | 'video';

export type DbMediaTag =
  | 'exterior' | 'interior' | 'amenity' | 'aerial' | 'construction';

export type DbLeadSource =
  | 'website_inquiry'
  | 'brochure_request'
  | 'site_visit_request'
  | 'consultation_request'
  | 'referral'
  | 'walk_in'
  | 'call';

export type DbLeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'site_visit_scheduled'
  | 'negotiation' | 'converted' | 'lost' | 'unqualified';

export type DbLeadPriority = 'low' | 'medium' | 'high';

export type DbBudgetRange =
  | 'under_50L' | '50L_1Cr' | '1Cr_2Cr' | '2Cr_5Cr' | 'above_5Cr';

export type DbPurchaseTimeline =
  | 'immediate' | 'short_term' | 'medium_term' | 'long_term' | 'just_exploring';

// ---------------------------------------------------------------------------
// JSONB sub-shapes (stored inside columns)
// ---------------------------------------------------------------------------

export interface DbLandmark {
  label: string;
  distanceKm: number;
}

export interface DbLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  landmarks: DbLandmark[];
}

export interface DbLeadNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface DbLeadActivity {
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
// Row types (snake_case — exactly what Supabase returns)
// ---------------------------------------------------------------------------

export interface DbAmenity {
  id: string;                  // 'am-01'
  label: string;
  icon: string;
  category: DbAmenityCategory;
  created_at: string;
}

export interface DbProject {
  id: string;                  // uuid
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: DbProjectStatus;
  category: DbProjectCategory;
  configs: DbUnitConfig[];
  area_min_sqft: number|null;
  area_max_sqft: number|null;
  price_min_inr: number;
  price_max_inr: number;
  total_units: number;
  available_units: number;
  launch_year: number;
  completion_year: number | null;
  rera_number: string | null;
  location: DbLocation;        // JSONB
  cover_image: string;
  brochure_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbProjectMedia {
  id: string;
  project_id: string;
  url: string;
  thumbnail_url: string;
  alt: string;
  type: DbMediaType;
  tag: DbMediaTag;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbFloorPlan {
  id: string;
  project_id: string;
  label: string;
  config: DbUnitConfig;
  area_sqft: number;
  image_url: string;
  price_min: number;
  price_max: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbProjectAmenity {
  project_id: string;
  amenity_id: string;
}

export interface DbConstructionUpdate {
  id: string;
  project_id: string;
  update_date: string;         // 'YYYY-MM-DD'
  title: string;
  description: string;
  image_url: string | null;
  percent_complete: number;
  created_at: string;
  updated_at: string;
}

export interface DbTestimonial {
  id: string;                  // uuid
  customer_name: string;
  project_name: string | null;
  locality: string | null;
  review: string;
  rating: number;              // 1–5
  delivery_date: string | null;        // 'YYYY-MM-DD'
  delivery_image_url: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  source: DbLeadSource;
  status: DbLeadStatus;
  priority: DbLeadPriority;
  interested_project_ids: string[];
  budget_range: DbBudgetRange | null;
  purchase_timeline: DbPurchaseTimeline | null;
  unit_config_preference: string | null;
  message: string | null;
  assigned_to: string | null;
  notes: DbLeadNote[];         // JSONB
  activity: DbLeadActivity[];  // JSONB
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
}

// ---------------------------------------------------------------------------
// Insert payloads (omit auto-generated fields)
// ---------------------------------------------------------------------------

export type DbProjectInsert = Omit<DbProject, 'id' | 'created_at' | 'updated_at'>;
export type DbProjectMediaInsert = Omit<DbProjectMedia, 'id' | 'created_at' | 'updated_at'>;
export type DbFloorPlanInsert = Omit<DbFloorPlan, 'id' | 'created_at' | 'updated_at'>;
export type DbConstructionUpdateInsert = Omit<DbConstructionUpdate, 'id' | 'created_at' | 'updated_at'>;
export type DbLeadInsert = Omit<DbLead, 'id' | 'created_at' | 'updated_at'>;
export type DbTestimonialInsert = Omit<DbTestimonial, 'id' | 'created_at' | 'updated_at'>;

// ---------------------------------------------------------------------------
// Update payloads (all fields optional except id)
// ---------------------------------------------------------------------------

export type DbProjectUpdate = Partial<DbProjectInsert>;
export type DbProjectMediaUpdate = Partial<DbProjectMediaInsert>;
export type DbFloorPlanUpdate = Partial<DbFloorPlanInsert>;
export type DbConstructionUpdateUpdate = Partial<DbConstructionUpdateInsert>;
export type DbLeadUpdate = Partial<DbLeadInsert>;
export type DbTestimonialUpdate = Partial<DbTestimonialInsert>;

// ---------------------------------------------------------------------------
// Joined / enriched shapes (returned by service queries)
// ---------------------------------------------------------------------------

/** Full project row with all relations eagerly loaded */
export interface DbProjectFull extends DbProject {
  project_media: DbProjectMedia[];
  floor_plans: DbFloorPlan[];
  amenities: DbAmenity[];
  construction_updates: DbConstructionUpdate[];
}

// ---------------------------------------------------------------------------
// Supabase Database type definition (for createClient generic)
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      amenities: {
        Row: DbAmenity;
        Insert: Omit<DbAmenity, 'created_at'>;
        Update: Partial<Omit<DbAmenity, 'id'>>;
      };
      projects: {
        Row: DbProject;
        Insert: DbProjectInsert;
        Update: DbProjectUpdate;
      };
      project_media: {
        Row: DbProjectMedia;
        Insert: DbProjectMediaInsert;
        Update: DbProjectMediaUpdate;
      };
      floor_plans: {
        Row: DbFloorPlan;
        Insert: DbFloorPlanInsert;
        Update: DbFloorPlanUpdate;
      };
      project_amenities: {
        Row: DbProjectAmenity;
        Insert: DbProjectAmenity;
        Update: never;
      };
      construction_updates: {
        Row: DbConstructionUpdate;
        Insert: DbConstructionUpdateInsert;
        Update: DbConstructionUpdateUpdate;
      };
      leads: {
        Row: DbLead;
        Insert: DbLeadInsert;
        Update: DbLeadUpdate;
      };
      testimonials: {
        Row: DbTestimonial;
        Insert: DbTestimonialInsert;
        Update: DbTestimonialUpdate;
      };
    };
    Enums: {
      project_status: DbProjectStatus;
      project_category: DbProjectCategory;
      unit_config: DbUnitConfig;
      amenity_category: DbAmenityCategory;
      media_type: DbMediaType;
      media_tag: DbMediaTag;
      lead_source: DbLeadSource;
      lead_status: DbLeadStatus;
      lead_priority: DbLeadPriority;
      budget_range: DbBudgetRange;
      purchase_timeline: DbPurchaseTimeline;
    };
  };
};