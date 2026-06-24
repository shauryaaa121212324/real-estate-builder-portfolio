// =============================================================================
// Autor Builders — Media Service
// src/services/mediaService.ts
// =============================================================================
// All DB ↔ app-layer mapping for project_media lives here, plus orchestration
// of Supabase Storage uploads/deletes. Components/pages import from this file
// only — never touch supabase.storage or the project_media table directly.
// =============================================================================

import { supabase } from '../lib/supabase';
import {
  buildStoragePath,
  uploadFile,
  deleteFiles,
  extractStoragePathFromUrl,
} from '../lib/storage';
import type {
  DbProjectMedia,
  DbProjectMediaInsert,
  DbProjectMediaUpdate,
  DbMediaType,
  DbMediaTag,
} from '../types/database.types';
import type { ProjectMedia } from '../types/project';

// ---------------------------------------------------------------------------
// Mapper: DB row → App type
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface UploadImageOptions {
  /** Project this media belongs to */
  projectId: string;
  /** Accessibility / SEO alt text */
  alt: string;
  /** Media classification tag */
  tag: DbMediaTag;
  /** Media type — defaults to 'image' */
  type?: DbMediaType;
  /** Display order within the project's gallery — defaults to 0 */
  sortOrder?: number;
  /**
   * Optional separate thumbnail file. If omitted, the uploaded image's
   * own public URL is reused as the thumbnail URL.
   */
  thumbnailFile?: File;
}

/**
 * Upload an image file to Supabase Storage and create its corresponding
 * project_media row. Returns the newly created media item.
 *
 * If the DB insert fails after a successful storage upload, the uploaded
 * file(s) are cleaned up to avoid orphaned storage objects.
 */
export async function uploadImage(
  file: File,
  options: UploadImageOptions,
): Promise<ProjectMedia> {
  const { projectId, alt, tag, type = 'image', sortOrder = 0, thumbnailFile } = options;

  const path = buildStoragePath(file, projectId);
  const uploaded = await uploadFile(path, file);

  let thumbnailUrl = uploaded.publicUrl;
  let thumbnailPath: string | null = null;

  try {
    if (thumbnailFile) {
      thumbnailPath = buildStoragePath(thumbnailFile, projectId);
      const uploadedThumb = await uploadFile(thumbnailPath, thumbnailFile);
      thumbnailUrl = uploadedThumb.publicUrl;
    }

    const insertPayload: DbProjectMediaInsert = {
      project_id: projectId,
      url: uploaded.publicUrl,
      thumbnail_url: thumbnailUrl,
      alt,
      type,
      tag,
      sort_order: sortOrder,
    };

    const { data, error } = await supabase
      .from('project_media')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    return mapMedia(data as DbProjectMedia);
  } catch (err) {
    // Roll back orphaned storage objects on DB failure
    const cleanupPaths = thumbnailPath ? [path, thumbnailPath] : [path];
    await deleteFiles(cleanupPaths).catch(() => {
      /* best-effort cleanup; surface the original error instead */
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete a media item: removes the project_media row and attempts to remove
 * the underlying storage object(s) (main image + thumbnail, if distinct and
 * derivable from their public URLs).
 */
export async function deleteImage(mediaId: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('project_media')
    .select('*')
    .eq('id', mediaId)
    .single();

  if (fetchError) throw fetchError;

  const row = existing as DbProjectMedia;

  const { error: deleteError } = await supabase
    .from('project_media')
    .delete()
    .eq('id', mediaId);

  if (deleteError) throw deleteError;

  const paths = new Set<string>();
  const urlPath = extractStoragePathFromUrl(row.url);
  if (urlPath) paths.add(urlPath);
  if (row.thumbnail_url && row.thumbnail_url !== row.url) {
    const thumbPath = extractStoragePathFromUrl(row.thumbnail_url);
    if (thumbPath) paths.add(thumbPath);
  }

  if (paths.size) {
    // Best-effort: row is already gone, don't fail the caller over storage cleanup
    await deleteFiles(Array.from(paths)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetch a single media item by id.
 */
export async function getMedia(mediaId: string): Promise<ProjectMedia | null> {
  const { data, error } = await supabase
    .from('project_media')
    .select('*')
    .eq('id', mediaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }

  return mapMedia(data as DbProjectMedia);
}

/**
 * Fetch all media items belonging to a project, sorted by sort_order.
 */
export async function getMediaByProject(projectId: string): Promise<ProjectMedia[]> {
  const { data, error } = await supabase
    .from('project_media')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => mapMedia(row as DbProjectMedia));
}

// ---------------------------------------------------------------------------
// Update (sort order / metadata) — convenience helper, no UI dependency
// ---------------------------------------------------------------------------

/**
 * Update metadata (alt, tag, sort order, etc.) for an existing media item.
 * Does not touch storage — use uploadImage/deleteImage to replace files.
 */
export async function updateMedia(
  mediaId: string,
  payload: DbProjectMediaUpdate,
): Promise<ProjectMedia> {
  const { data, error } = await supabase
    .from('project_media')
    .update(payload)
    .eq('id', mediaId)
    .select()
    .single();

  if (error) throw error;
  return mapMedia(data as DbProjectMedia);
}