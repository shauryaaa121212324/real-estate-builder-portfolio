// ---------------------------------------------------------------------------
// Media library domain types
// ---------------------------------------------------------------------------

export type MediaType = 'image' | 'video' | 'document' | 'brochure';

export type MediaTag =
  | 'exterior'
  | 'interior'
  | 'amenity'
  | 'aerial'
  | 'construction'
  | 'floor_plan'
  | 'location'
  | 'team'
  | 'event'
  | 'press'
  | 'brochure'
  | 'other';

export type MediaStatus = 'uploading' | 'processing' | 'ready' | 'error';

// ---------------------------------------------------------------------------
// Sub-shapes
// ---------------------------------------------------------------------------

export interface MediaDimensions {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

export interface MediaAsset {
  id: string;
  // File info
  filename: string;           // original filename on upload
  storageKey: string;         // path in storage bucket
  url: string;                // public CDN / signed URL
  thumbnailUrl: string | null;
  type: MediaType;
  mimeType: string;           // e.g. "image/jpeg", "video/mp4"
  sizeBytes: number;
  dimensions: MediaDimensions | null;  // null for non-image/video
  // Classification
  tags: MediaTag[];
  alt: string;                // accessibility / SEO alt text
  caption: string;
  // Relations
  projectId: string | null;   // null = library-level asset
  // Admin
  uploadedBy: string;         // admin user id
  status: MediaStatus;
  sortOrder: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Upload flow
// ---------------------------------------------------------------------------

export interface MediaUploadPayload {
  file: File;
  projectId?: string;
  tags?: MediaTag[];
  alt?: string;
  caption?: string;
}

export interface MediaUploadProgress {
  assetId: string;
  filename: string;
  percent: number;             // 0–100
  status: MediaStatus;
  error?: string;
}

// ---------------------------------------------------------------------------
// Filter / query helpers
// ---------------------------------------------------------------------------

export interface MediaFilters {
  type?: MediaType[];
  tags?: MediaTag[];
  projectId?: string | null;   // null = unattached assets only
  search?: string;             // filename / alt / caption
  dateFrom?: string;
  dateTo?: string;
}