// =============================================================================
// Autor Builders — Supabase Storage Helper
// src/lib/storage.ts
// =============================================================================
// Low-level wrapper around Supabase Storage. Knows nothing about the
// project_media table — mediaService.ts composes this with DB writes.
// =============================================================================

import { supabase } from './supabase';

/**
 * Storage bucket used for all project media (images/videos).
 * Override via VITE_SUPABASE_MEDIA_BUCKET if the project uses a different
 * bucket name. Defaults to "project-media".
 */
export const MEDIA_BUCKET: string =
  (import.meta.env.VITE_SUPABASE_MEDIA_BUCKET as string | undefined) ??
  'project-media';

export interface UploadFileResult {
  /** Path of the file inside the bucket (storage key) */
  path: string;
  /** Public URL for the uploaded file */
  publicUrl: string;
}

/**
 * Build a collision-safe storage path for a file, optionally namespaced
 * under a project id (e.g. "projects/<projectId>/<timestamp>-<filename>").
 */
export function buildStoragePath(file: File, projectId?: string): string {
  const safeName = file.name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  return projectId ? `projects/${projectId}/${unique}` : `library/${unique}`;
}

/**
 * Upload a raw file to the storage bucket at the given path.
 * Returns the storage path and resolved public URL.
 */
export async function uploadFile(
  path: string,
  file: File,
  options?: { upsert?: boolean; cacheControl?: string },
): Promise<UploadFileResult> {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: options?.cacheControl ?? '3600',
    upsert: options?.upsert ?? false,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  return { path, publicUrl: publicUrlData.publicUrl };
}

/**
 * Delete one or more files from the storage bucket by their storage path(s).
 */
export async function deleteFiles(paths: string | string[]): Promise<void> {
  const list = Array.isArray(paths) ? paths : [paths];
  if (!list.length) return;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove(list);
  if (error) throw error;
}

/**
 * Resolve the public URL for a given storage path without re-uploading.
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Derive the storage path from a public URL produced by getPublicUrl/uploadFile.
 * Useful when only the DB row (with its `url`) is available and the original
 * storage path wasn't persisted separately.
 */
export function extractStoragePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}