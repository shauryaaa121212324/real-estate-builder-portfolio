// ---------------------------------------------------------------------------
// Project domain types
// ---------------------------------------------------------------------------

export type ProjectStatus =
  | 'upcoming'
  | 'ongoing'
  | 'ready_to_move'
  | 'completed';

export type ProjectCategory =
  | 'residential'
  | 'villa'
  | 'commercial'
  | 'plotted_development'
  | 'mixed_use';

export type UnitConfig =
  | '1BHK'
  | '2BHK'
  | '3BHK'
  | '4BHK'
  | '5BHK'
  | 'duplex'
  | 'penthouse'
  | 'studio'
  | 'villa';

// ---------------------------------------------------------------------------
// Sub-shapes
// ---------------------------------------------------------------------------

export interface FloorPlan {
  id: string;
  label: string;          // e.g. "3 BHK – Type A"
  config: UnitConfig;
  areaSqFt: number;
  imageUrl: string;
  priceMin: number;       // INR
  priceMax: number;       // INR
}

export interface Amenity {
  id: string;
  label: string;
  icon: string;           // lucide icon name or custom SVG key
  category: 'wellness' | 'recreation' | 'convenience' | 'security' | 'green';
}

export interface ProjectMedia {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  type: 'image' | 'video';
  tag: 'exterior' | 'interior' | 'amenity' | 'aerial' | 'construction';
  sortOrder: number;
  /** Optional — populated by mediaService for admin sorting/filtering. */
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationDetails {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  landmarks: Array<{ label: string; distanceKm: number }>;
}

export interface ConstructionUpdate {
  id: string;
  date: string;           // ISO date string
  title: string;
  description: string;
  imageUrl?: string;
  percentComplete: number;
}

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
  configs: UnitConfig[];
  areaRangeSqFt: [number | null, number | null];
  priceRangeInr: [number, number];
  totalUnits: number;
  availableUnits: number;
  launchYear: number;
  completionYear: number | null;
  reraNumber: string | null;
  location: LocationDetails;
  coverImage: string;
  galleryMedia: ProjectMedia[];
  floorPlans: FloorPlan[];
  amenities: Amenity[];
  constructionUpdates: ConstructionUpdate[];
  featured: boolean;
  sortOrder: number;
  brochureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Lightweight card variant (list views / grids)
// ---------------------------------------------------------------------------

export type ProjectCard = Pick<
  Project,
  | 'id'
  | 'slug'
  | 'name'
  | 'tagline'
  | 'status'
  | 'category'
  | 'configs'
  | 'areaRangeSqFt'
  | 'priceRangeInr'
  | 'location'
  | 'coverImage'
  | 'featured'
  | 'sortOrder'
>;

// ---------------------------------------------------------------------------
// Filter / query helpers
// ---------------------------------------------------------------------------

export interface ProjectFilters {
  status?: ProjectStatus[];
  category?: ProjectCategory[];
  configs?: UnitConfig[];
  city?: string;
  priceMin?: number;
  priceMax?: number;
  featured?: boolean;
}