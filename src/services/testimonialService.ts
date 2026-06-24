// =============================================================================
// Autor Builders — Testimonial Service
// src/services/testimonialService.ts
// =============================================================================
// All DB ↔ app-layer mapping for testimonials lives here, plus orchestration
// of the single delivery image against Supabase Storage on replace/delete.
// Components/pages import from this file only — never query the
// testimonials table or supabase.storage directly.
// =============================================================================

import { supabase } from '../lib/supabase';
import { deleteFiles, extractStoragePathFromUrl } from '../lib/storage';
import type {
  DbTestimonial,
  DbTestimonialInsert,
  DbTestimonialUpdate,
} from '../types/database.types';
import type { Testimonial } from '../types/testimonial';

// ---------------------------------------------------------------------------
// Mapper: DB row → App type
// ---------------------------------------------------------------------------

function mapTestimonial(row: DbTestimonial): Testimonial {
  return {
    id: row.id,
    customerName: row.customer_name,
    projectName: row.project_name,
    locality: row.locality,
    review: row.review,
    rating: row.rating,
    deliveryDate: row.delivery_date,
    deliveryImageUrl: row.delivery_image_url,
    featured: row.featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Fetch all testimonials, ordered by sort_order (ascending), then newest
 * first within the same sort_order.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapTestimonial(row as DbTestimonial));
}

/**
 * Fetch only featured testimonials (same ordering as getTestimonials).
 */
export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('featured', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapTestimonial(row as DbTestimonial));
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

/**
 * Admin: create a new testimonial. The delivery image (if any) must already
 * be uploaded to Storage by the caller — pass its public URL in
 * `payload.delivery_image_url`.
 */
export async function createTestimonial(
  payload: DbTestimonialInsert,
): Promise<Testimonial> {
  const { data, error } = await supabase
    .from('testimonials')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return mapTestimonial(data as DbTestimonial);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

/**
 * Admin: update a testimonial.
 *
 * If `payload.delivery_image_url` is included and differs from the
 * testimonial's current image, the previous image is removed from Storage
 * after the row update succeeds — resolved via extractStoragePathFromUrl so
 * only the file this testimonial actually owned is ever deleted.
 */
export async function updateTestimonial(
  id: string,
  payload: DbTestimonialUpdate,
): Promise<Testimonial> {
  const replacingImage = Object.prototype.hasOwnProperty.call(
    payload,
    'delivery_image_url',
  );

  let previousImageUrl: string | null = null;

  if (replacingImage) {
    const { data: existing, error: fetchError } = await supabase
      .from('testimonials')
      .select('delivery_image_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    previousImageUrl = (existing as { delivery_image_url: string | null })
      .delivery_image_url;
  }

  const { data, error } = await supabase
    .from('testimonials')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (
    replacingImage &&
    previousImageUrl &&
    previousImageUrl !== payload.delivery_image_url
  ) {
    const path = extractStoragePathFromUrl(previousImageUrl);
    if (path) {
      // Best-effort: the row already reflects the new image, don't fail
      // the caller over storage cleanup (matches mediaService.deleteImage).
      await deleteFiles(path).catch(() => {});
    }
  }

  return mapTestimonial(data as DbTestimonial);
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Admin: delete a testimonial. Also removes its delivery image from Storage
 * (best-effort) — resolved via extractStoragePathFromUrl so only this
 * testimonial's own file is ever touched, never any other testimonial's or
 * project's media.
 */
export async function deleteTestimonial(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('testimonials')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const row = existing as DbTestimonial;

  const { error: deleteError } = await supabase
    .from('testimonials')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  if (row.delivery_image_url) {
    const path = extractStoragePathFromUrl(row.delivery_image_url);
    if (path) {
      // Best-effort: row is already gone, don't fail the caller over
      // storage cleanup (matches mediaService.deleteImage).
      await deleteFiles(path).catch(() => {});
    }
  }
}
