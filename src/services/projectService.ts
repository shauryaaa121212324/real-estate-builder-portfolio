// =============================================================================
// Autor Builders — Project Service
// src/services/projectService.ts
// =============================================================================
// All DB ↔ app-layer mapping lives here.
// Components import from this file only — never query Supabase directly.
// =============================================================================

import { supabase } from '../lib/supabase';
import { deleteFiles, extractStoragePathFromUrl } from '../lib/storage';
import type {
  DbProject,
  DbProjectFull,
  DbProjectMedia,
  DbFloorPlan,
  DbAmenity,
  DbConstructionUpdate,
  DbProjectInsert,
  DbProjectUpdate,
} from '../types/database.types';
import type {
  Project,
  ProjectCard,
  ProjectFilters,
  ProjectMedia,
  FloorPlan,
  Amenity,
  ConstructionUpdate,
  LocationDetails,
} from '../types/project';

// ---------------------------------------------------------------------------
// Mappers: DB row → App type
// ---------------------------------------------------------------------------

function mapMedia(row: DbProjectMedia): ProjectMedia {
  return {
    id: row.id,
    url: row.url,
    thumbnailUrl: row.thumbnail_url,
    alt: row.alt,
    type: row.type,
    tag: row.tag,
    sortOrder: row.sort_order,
  };
}

function mapFloorPlan(row: DbFloorPlan): FloorPlan {
  return {
    id: row.id,
    label: row.label,
    config: row.config,
    areaSqFt: row.area_sqft,
    imageUrl: row.image_url,
    priceMin: row.price_min,
    priceMax: row.price_max,
  };
}

function mapAmenity(row: DbAmenity): Amenity {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    category: row.category,
  };
}

function mapConstructionUpdate(row: DbConstructionUpdate): ConstructionUpdate {
  return {
    id: row.id,
    date: row.update_date,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    percentComplete: row.percent_complete,
  };
}

function mapProject(row: DbProjectFull): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    status: row.status,
    category: row.category,
    configs: row.configs,
    areaRangeSqFt: [row.area_min_sqft, row.area_max_sqft],
    priceRangeInr: [row.price_min_inr, row.price_max_inr],
    totalUnits: row.total_units,
    availableUnits: row.available_units,
    launchYear: row.launch_year,
    completionYear: row.completion_year,
    reraNumber: row.rera_number,
    location: row.location as LocationDetails,
    coverImage: row.cover_image,
    galleryMedia: (row.project_media ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapMedia),
    floorPlans: (row.floor_plans ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapFloorPlan),
    amenities: (row.amenities ?? []).map(mapAmenity),
    constructionUpdates: (row.construction_updates ?? [])
      .sort((a, b) => new Date(b.update_date).getTime() - new Date(a.update_date).getTime())
      .map(mapConstructionUpdate),
    featured: row.featured,
    sortOrder: row.sort_order,
    brochureUrl: row.brochure_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectCard(row: DbProject): ProjectCard {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    status: row.status,
    category: row.category,
    configs: row.configs,
    areaRangeSqFt: [row.area_min_sqft, row.area_max_sqft],
    priceRangeInr: [row.price_min_inr, row.price_max_inr],
    location: row.location as LocationDetails,
    coverImage: row.cover_image,
    featured: row.featured,
    sortOrder: row.sort_order,
  };
}

// ---------------------------------------------------------------------------
// SELECT — full project with all relations
// ---------------------------------------------------------------------------

const FULL_PROJECT_SELECT = `
  *,
  project_media ( * ),
  floor_plans ( * ),
  construction_updates ( * ),
  amenities:project_amenities ( amenities ( * ) )
` as const;

/** Normalise the nested amenities join shape Supabase returns */
function normaliseAmenities(
  raw: Omit<DbProjectFull, 'amenities'> & { amenities: Array<{ amenities: DbAmenity }> }
): DbProjectFull {
  return {
    ...raw,
    amenities: raw.amenities.map((a) => a.amenities),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all projects as lightweight ProjectCard objects (sorted by sort_order).
 * Applies optional filters.
 */
export async function getProjects(filters?: ProjectFilters): Promise<ProjectCard[]> {
  let query = supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true });

  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.category?.length) {
    query = query.in('category', filters.category);
  }
  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }
  if (filters?.priceMin !== undefined) {
    query = query.gte('price_min_inr', filters.priceMin);
  }
  if (filters?.priceMax !== undefined) {
    query = query.lte('price_max_inr', filters.priceMax);
  }
  if (filters?.city) {
    // city lives inside the location JSONB column
    query = query.eq('location->>city', filters.city);
  }
  if (filters?.configs?.length) {
    // overlaps: project must include at least one of the requested configs
    query = query.overlaps('configs', filters.configs);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapProjectCard);
}

/**
 * Fetch a single full Project by slug (with all relations).
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(FULL_PROJECT_SELECT)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }

  return mapProject(normaliseAmenities(data as any));
}

/**
 * Fetch a single full Project by id.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(FULL_PROJECT_SELECT)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return mapProject(normaliseAmenities(data as any));
}

/**
 * Fetch only featured projects (lightweight cards).
 */
export async function getFeaturedProjects(): Promise<ProjectCard[]> {
  return getProjects({ featured: true });
}

/**
 * Admin: create a new project.
 * Does NOT handle media / floor plans / amenities — use the dedicated helpers below.
 */
export async function createProject(payload: DbProjectInsert): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select(FULL_PROJECT_SELECT)
    .single();

  if (error) throw error;
  return mapProject(normaliseAmenities(data as any));
}

/**
 * Admin: update a project.
 */
export async function updateProject(id: string, payload: DbProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select(FULL_PROJECT_SELECT)
    .single();

  if (error) throw error;
  return mapProject(normaliseAmenities(data as any));
}

/**
 * Resolve every Storage object path attached to a project (cover image,
 * brochure PDF, gallery media + thumbnails, floor plan images, construction
 * update images) so they can be removed when the project is deleted.
 * Silently skips any URL that isn't a resolvable Storage path (e.g. blank
 * or external URLs) — extractStoragePathFromUrl returns null for those.
 */
function collectProjectStoragePaths(project: {
  cover_image?: string | null;
  brochure_url?: string | null;
  project_media?: DbProjectMedia[];
  floor_plans?: DbFloorPlan[];
  construction_updates?: DbConstructionUpdate[];
}): string[] {
  const paths = new Set<string>();
  const add = (url?: string | null) => {
    if (!url) return;
    const path = extractStoragePathFromUrl(url);
    if (path) paths.add(path);
  };

  add(project.cover_image);
  add(project.brochure_url);
  (project.project_media ?? []).forEach((m) => { add(m.url); add(m.thumbnail_url); });
  (project.floor_plans ?? []).forEach((fp) => add(fp.image_url));
  (project.construction_updates ?? []).forEach((cu) => add(cu.image_url));

  return Array.from(paths);
}

/**
 * Admin: delete a project (cascades to all sub-tables via FK).
 * Also removes every associated Storage object (cover image, brochure PDF,
 * gallery media + thumbnails, floor plan images, construction update images)
 * to avoid leaving orphaned files in the bucket. Storage cleanup is
 * best-effort: if it fails, the project row is already gone, so the caller
 * isn't blocked on it (matches the pattern used in mediaService.deleteImage).
 */
export async function deleteProject(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select(FULL_PROJECT_SELECT)
    .eq('id', id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;

  if (existing) {
    const paths = collectProjectStoragePaths(existing as unknown as DbProjectFull);
    if (paths.length) {
      await deleteFiles(paths).catch(() => {
        /* best-effort cleanup; the project row is already deleted */
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Media helpers
// ---------------------------------------------------------------------------

export async function addProjectMedia(
  projectId: string,
  items: Omit<DbProjectMedia, 'id' | 'project_id' | 'created_at' | 'updated_at'>[],
): Promise<ProjectMedia[]> {
  const inserts = items.map((item) => ({ ...item, project_id: projectId }));
  const { data, error } = await supabase
    .from('project_media')
    .insert(inserts)
    .select();

  if (error) throw error;
  return (data ?? []).map(mapMedia);
}

export async function deleteProjectMedia(mediaId: string): Promise<void> {
  const { error } = await supabase.from('project_media').delete().eq('id', mediaId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Floor plan helpers
// ---------------------------------------------------------------------------

/**
 * Fetch all floor plan rows for a single project (lean query — does not
 * pull the rest of the project record). Used by the Admin CMS so the
 * "Configuration Variants" editor doesn't need a full FULL_PROJECT_SELECT
 * round-trip just to list a project's floor plans.
 */
export async function getFloorPlansByProject(projectId: string): Promise<FloorPlan[]> {
  const { data, error } = await supabase
    .from('floor_plans')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapFloorPlan(row as DbFloorPlan));
}

export async function addFloorPlan(
  projectId: string,
  plan: Omit<DbFloorPlan, 'id' | 'project_id' | 'created_at' | 'updated_at'>,
): Promise<FloorPlan> {
  const { data, error } = await supabase
    .from('floor_plans')
    .insert({ ...plan, project_id: projectId })
    .select()
    .single();

  if (error) throw error;
  return mapFloorPlan(data);
}

/**
 * Admin: update an existing floor plan row (e.g. fix a price/area typo,
 * relabel a variant). Previously missing — only insert/delete existed,
 * meaning the only way to "edit" a floor plan was delete + recreate.
 */
export async function updateFloorPlan(
  planId: string,
  payload: Partial<Omit<DbFloorPlan, 'id' | 'project_id' | 'created_at' | 'updated_at'>>,
): Promise<FloorPlan> {
  const { data, error } = await supabase
    .from('floor_plans')
    .update(payload)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return mapFloorPlan(data);
}

export async function deleteFloorPlan(planId: string): Promise<void> {
  const { error } = await supabase.from('floor_plans').delete().eq('id', planId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Amenity helpers
// ---------------------------------------------------------------------------

export async function getAllAmenities(): Promise<Amenity[]> {
  const { data, error } = await supabase.from('amenities').select('*');
  if (error) throw error;
  return (data ?? []).map(mapAmenity);
}

export async function setProjectAmenities(
  projectId: string,
  amenityIds: string[],
): Promise<void> {
  // Delete existing, then insert fresh (simpler than diffing)
  const { error: delError } = await supabase
    .from('project_amenities')
    .delete()
    .eq('project_id', projectId);
  if (delError) throw delError;

  if (!amenityIds.length) return;

  const inserts = amenityIds.map((amenity_id) => ({ project_id: projectId, amenity_id }));
  const { error } = await supabase.from('project_amenities').insert(inserts);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Construction update helpers
// ---------------------------------------------------------------------------

export async function addConstructionUpdate(
  projectId: string,
  update: Omit<DbConstructionUpdate, 'id' | 'project_id' | 'created_at' | 'updated_at'>,
): Promise<ConstructionUpdate> {
  const { data, error } = await supabase
    .from('construction_updates')
    .insert({ ...update, project_id: projectId })
    .select()
    .single();

  if (error) throw error;
  return mapConstructionUpdate(data);
}

export async function deleteConstructionUpdate(updateId: string): Promise<void> {
  const { error } = await supabase
    .from('construction_updates')
    .delete()
    .eq('id', updateId);
  if (error) throw error;
}
// ---------------------------------------------------------------------------
// Gallery helpers
// ---------------------------------------------------------------------------

/** Rich media row: project_media joined with parent project's id/slug/name */
export interface GalleryMedia extends ProjectMedia {
  projectId: string;
  projectName: string;
  projectSlug: string;
}

/**
 * Fetch all published project_media rows, joined with their parent project
 * (slug + name), sorted by sort_order ascending.
 * Used exclusively by GalleryPage.
 */
export async function getGalleryMedia(): Promise<GalleryMedia[]> {
  const { data, error } = await supabase
    .from('project_media')
    .select('*, projects(id, slug, name)')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const project = row.projects as { id: string; slug: string; name: string } | null;
    return {
      ...mapMedia(row as DbProjectMedia),
      projectId:   project?.id   ?? row.project_id,
      projectName: project?.name ?? 'Unknown Project',
      projectSlug: project?.slug ?? '',
    };
  });
}