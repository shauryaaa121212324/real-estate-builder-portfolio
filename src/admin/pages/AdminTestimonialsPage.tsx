// =============================================================================
// Autor Builders Admin — Testimonials Page
// src/admin/pages/AdminTestimonialsPage.tsx
// =============================================================================
// Full CRUD for the testimonials table: list/search/sort, add/edit modal,
// delete confirmation, inline featured toggle, single delivery image upload.
// Mirrors the patterns established in AdminMediaPage.tsx (modals, toast,
// list state) and AdminProjectsPage.tsx (featured toggle, single-image
// upload via the existing storage helpers).
// =============================================================================

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../../services/testimonialService';
import { uploadFile } from '../../lib/storage';
import type { Testimonial } from '../../types/testimonial';
import type { DbTestimonialInsert, DbTestimonialUpdate } from '../../types/database.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToastState {
  message: string;
  kind: 'success' | 'error';
}

type SortOption = 'sort_order' | 'newest' | 'rating';

interface TestimonialFormState {
  customer_name: string;
  project_name: string;
  locality: string;
  review: string;
  rating: number;
  delivery_date: string;        // '' or 'YYYY-MM-DD'
  delivery_image_url: string;   // '' or public URL
  featured: boolean;
  sort_order: string;           // controlled as string, parsed on submit
}

const EMPTY_FORM: TestimonialFormState = {
  customer_name: '',
  project_name: '',
  locality: '',
  review: '',
  rating: 5,
  delivery_date: '',
  delivery_image_url: '',
  featured: false,
  sort_order: '0',
};

function testimonialToForm(t: Testimonial): TestimonialFormState {
  return {
    customer_name: t.customerName,
    project_name: t.projectName ?? '',
    locality: t.locality ?? '',
    review: t.review,
    rating: t.rating,
    delivery_date: t.deliveryDate ?? '',
    delivery_image_url: t.deliveryImageUrl ?? '',
    featured: t.featured,
    sort_order: String(t.sortOrder),
  };
}

function validateForm(f: TestimonialFormState): string[] {
  const errs: string[] = [];
  if (!f.customer_name.trim()) errs.push('Customer name is required.');
  if (!f.review.trim()) errs.push('Review is required.');
  if (!Number.isInteger(f.rating) || f.rating < 1 || f.rating > 5) {
    errs.push('Rating must be between 1 and 5.');
  }
  return errs;
}

function formToPayload(f: TestimonialFormState): DbTestimonialInsert {
  return {
    customer_name: f.customer_name.trim(),
    project_name: f.project_name.trim() || null,
    locality: f.locality.trim() || null,
    review: f.review.trim(),
    rating: f.rating,
    delivery_date: f.delivery_date || null,
    delivery_image_url: f.delivery_image_url || null,
    featured: f.featured,
    sort_order: Number(f.sort_order) || 0,
  };
}

// ---------------------------------------------------------------------------
// Shared form primitives (matches AdminMediaPage / AdminProjectsPage styling)
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13.5px] text-white ' +
  'placeholder-white/25 outline-none transition-all duration-200 ' +
  'focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/15 hover:border-white/18';

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
      {children}
      {required && <span className="ml-0.5 text-[#C9A227]">*</span>}
    </label>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Star rating (compact — used in list rows/cards)
// ---------------------------------------------------------------------------

function StarRatingCompact({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill={i < rating ? '#C9A227' : 'none'}
          stroke={i < rating ? '#C9A227' : 'currentColor'}
          strokeWidth="1.5"
          className={i >= rating ? 'text-white/15' : ''}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rating selector (interactive — used in the form)
// ---------------------------------------------------------------------------

function RatingSelector({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          aria-pressed={n <= value}
          className="transition-transform duration-150 hover:scale-110 disabled:opacity-50"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={n <= value ? '#C9A227' : 'none'}
            stroke={n <= value ? '#C9A227' : 'currentColor'}
            strokeWidth="1.5"
            className={n > value ? 'text-white/20' : ''}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
      <span className="ml-1 text-[12px] text-white/40">{value} / 5</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery image upload — single image, upload/replace/remove.
// Uploads straight to the existing Supabase Storage bucket (via the existing
// uploadFile helper) under a dedicated "testimonials/" prefix. Mirrors the
// CoverImageUpload pattern used in AdminProjectsPage.
// ---------------------------------------------------------------------------

function buildTestimonialImagePath(file: File): string {
  const safeName = file.name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  return `testimonials/${unique}`;
}

function DeliveryImageUpload({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const path = buildTestimonialImagePath(file);
      const { publicUrl } = await uploadFile(path, file);
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {value && (
        <div className="relative">
          <img
            src={value}
            alt="Delivery preview"
            className="h-32 w-full rounded-xl border border-white/6 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove delivery image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm transition-all hover:border-red-500/30 hover:text-red-400"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-6 text-center transition-all hover:border-[#C9A227]/40 hover:bg-white/5 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-[#C9A227]" />
            <span className="text-[12.5px] text-white/50">Uploading…</span>
          </>
        ) : (
          <>
            <svg className="h-4.5 w-4.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="text-[12.5px] text-white/50">
              {value ? 'Replace delivery image' : 'Upload delivery image'}
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          handlePick(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function Toast({ message, kind, onDismiss }: { message: string; kind: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={[
        'fixed bottom-6 left-6 right-6 z-[300] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-sm sm:left-auto',
        kind === 'success'
          ? 'border-green-500/20 bg-[#0F1A10]/90 text-green-400'
          : 'border-red-500/20 bg-[#1A0F0F]/90 text-red-400',
      ].join(' ')}
    >
      {kind === 'success' ? (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className="text-[13px]">{message}</span>
      <button onClick={onDismiss} className="ml-auto shrink-0 opacity-50 transition-opacity hover:opacity-100">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation dialog
// ---------------------------------------------------------------------------

function DeleteDialog({
  testimonial,
  onConfirm,
  onCancel,
  loading,
}: {
  testimonial: Testimonial;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={() => !loading && onCancel()} />
      <div className="fixed inset-x-4 top-1/2 z-[210] mx-auto w-full max-w-sm -translate-y-1/2 rounded-2xl border border-white/8 bg-[#1A1714] p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-light text-white">Delete testimonial?</h3>
            <p className="mt-1 text-[12.5px] text-white/40">
              <span className="text-white/70">{testimonial.customerName}</span>'s testimonial will be
              permanently removed, along with its delivery image.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-[13px] text-white/60 transition-all hover:border-white/20 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-red-500 disabled:opacity-60"
          >
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit form modal
// ---------------------------------------------------------------------------

function TestimonialFormModal({
  mode,
  initialData,
  onSave,
  onClose,
}: {
  mode: 'create' | 'edit';
  initialData: TestimonialFormState;
  onSave: (payload: DbTestimonialInsert) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TestimonialFormState>(initialData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function set<K extends keyof TestimonialFormState>(key: K, value: TestimonialFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const handleSubmit = async () => {
    const errs = validateForm(form);
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setSaving(true);
    try {
      await onSave(formToPayload(form));
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save testimonial.']);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="fixed inset-x-0 bottom-0 z-[110] flex max-h-[92vh] flex-col rounded-t-2xl border-t border-white/8 bg-[#14130F] shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-md sm:rounded-t-none sm:border-l sm:border-t-0">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/6 px-6 py-5">
          <div>
            <div className="mb-1.5 flex w-8 items-center">
              <span className="h-1.5 w-px bg-[#C9A227]/80" />
              <span className="h-px flex-1 bg-[#C9A227]/80" />
              <span className="h-1.5 w-px bg-[#C9A227]/80" />
            </div>
            <h2 className="font-serif text-[17px] text-white">
              {mode === 'create' ? 'Add Testimonial' : 'Edit Testimonial'}
            </h2>
          </div>
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-white/25 hover:text-white disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-5">
            {errors.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[12.5px] text-red-400">
                <ul className="list-disc space-y-0.5 pl-4">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <Field label="Customer Name" required>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => set('customer_name', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Project Name">
                <input
                  type="text"
                  value={form.project_name}
                  onChange={(e) => set('project_name', e.target.value)}
                  disabled={saving}
                  className={inputClass}
                />
              </Field>
              <Field label="Locality">
                <input
                  type="text"
                  value={form.locality}
                  onChange={(e) => set('locality', e.target.value)}
                  disabled={saving}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Review" required>
              <textarea
                rows={4}
                value={form.review}
                onChange={(e) => set('review', e.target.value)}
                disabled={saving}
                className={`${inputClass} resize-none`}
              />
            </Field>

            <Field label="Rating" required>
              <RatingSelector value={form.rating} onChange={(n) => set('rating', n)} disabled={saving} />
            </Field>

            <Field label="Delivery Date">
              <input
                type="date"
                value={form.delivery_date}
                onChange={(e) => set('delivery_date', e.target.value)}
                disabled={saving}
                className={`${inputClass} [color-scheme:dark]`}
              />
            </Field>

            <Field label="Delivery Image">
              <DeliveryImageUpload
                value={form.delivery_image_url}
                onChange={(url) => set('delivery_image_url', url)}
                disabled={saving}
              />
            </Field>

            <Field label="Sort Order">
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => set('sort_order', e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </Field>

            <label className="group flex cursor-pointer items-center gap-3">
              <div
                onClick={() => !saving && set('featured', !form.featured)}
                className={[
                  'relative h-5 w-9 rounded-full border transition-all duration-200',
                  form.featured ? 'border-[#C9A227]/60 bg-[#C9A227]/80' : 'border-white/12 bg-white/8',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                    form.featured ? 'translate-x-4' : 'translate-x-0',
                  ].join(' ')}
                />
              </div>
              <span className="text-[13px] text-white/60 transition-colors group-hover:text-white/80">
                Featured testimonial
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-white/6 px-6 py-4">
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-[13px] text-white/60 transition-all hover:border-white/20 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-[13px] font-medium text-[#14130F] transition-all hover:bg-[#D4AE30] disabled:opacity-60"
          >
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#14130F]/20 border-t-[#14130F]" />}
            {saving ? 'Saving…' : mode === 'create' ? 'Add Testimonial' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Desktop row
// ---------------------------------------------------------------------------

function TestimonialRow({
  testimonial,
  onEdit,
  onDelete,
  onToggleFeatured,
  togglingFeatured,
}: {
  testimonial: Testimonial;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  togglingFeatured: boolean;
}) {
  const locationLine = [testimonial.projectName, testimonial.locality].filter(Boolean).join(' · ');

  return (
    <tr className="group border-b border-white/4 transition-colors hover:bg-white/2">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-white/4">
            {testimonial.deliveryImageUrl ? (
              <img
                src={testimonial.deliveryImageUrl}
                alt={testimonial.customerName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
          </div>
          <div>
            <p className="text-[13px] leading-snug text-white/85">{testimonial.customerName}</p>
            <p className="mt-0.5 text-[11px] text-white/30">{locationLine || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <StarRatingCompact rating={testimonial.rating} />
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[12px] text-white/40">{testimonial.deliveryDate || '—'}</span>
      </td>
      <td className="px-5 py-3.5">
        <span className="text-[12px] text-white/40">{testimonial.sortOrder}</span>
      </td>
      <td className="px-5 py-3.5">
        <button
          onClick={onToggleFeatured}
          disabled={togglingFeatured}
          title={testimonial.featured ? 'Remove from featured' : 'Mark as featured'}
          className="transition-opacity disabled:opacity-40"
        >
          {testimonial.featured ? (
            <svg className="h-4.5 w-4.5 fill-[#C9A227]" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          ) : (
            <svg className="h-4.5 w-4.5 fill-none stroke-white/20 hover:stroke-[#C9A227]/60" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          )}
        </button>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-white/40 transition-all hover:border-white/20 hover:text-white"
            title="Edit"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/50 transition-all hover:border-red-500/30 hover:text-red-400"
            title="Delete"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Mobile card
// ---------------------------------------------------------------------------

function TestimonialMobileCard({
  testimonial,
  onEdit,
  onDelete,
}: {
  testimonial: Testimonial;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const locationLine = [testimonial.projectName, testimonial.locality].filter(Boolean).join(' · ');

  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 p-4 transition-colors active:bg-white/4">
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/4">
          {testimonial.deliveryImageUrl ? (
            <img
              src={testimonial.deliveryImageUrl}
              alt={testimonial.customerName}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-snug text-white/90" title={testimonial.customerName}>
            {testimonial.customerName}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-white/30">{locationLine || '—'}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StarRatingCompact rating={testimonial.rating} />
            {testimonial.featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A227]/30 bg-[#C9A227]/12 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.1em] text-[#C9A227]">
                <svg className="h-2.5 w-2.5 fill-[#C9A227]" viewBox="0 0 24 24">
                  <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Featured
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 py-2 text-[12px] text-white/60 transition-colors active:bg-white/5"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/15 py-2 text-[12px] text-red-400/70 transition-colors active:bg-red-500/10"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type ModalState =
  | { type: 'none' }
  | { type: 'form'; mode: 'create' }
  | { type: 'form'; mode: 'edit'; testimonial: Testimonial }
  | { type: 'delete'; testimonial: Testimonial };

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'sort_order', label: 'Sort order' },
  { value: 'newest', label: 'Newest first' },
  { value: 'rating', label: 'Highest rated' },
];

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('sort_order');

  // ── Fetch ──────────────────────────────────────────────────────────────

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  // ── Search + sort (client-side) ───────────────────────────────────────

  const visibleTestimonials = useMemo(() => {
    let result = [...testimonials];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.customerName.toLowerCase().includes(q) ||
          (t.projectName ?? '').toLowerCase().includes(q) ||
          (t.locality ?? '').toLowerCase().includes(q) ||
          t.review.toLowerCase().includes(q),
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'sort_order') return a.sortOrder - b.sortOrder;
      if (sortBy === 'rating') return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [testimonials, search, sortBy]);

  // ── Create / Update ────────────────────────────────────────────────────

  async function handleSave(payload: DbTestimonialInsert) {
    if (modal.type !== 'form') return;

    if (modal.mode === 'create') {
      await createTestimonial(payload);
      setToast({ message: 'Testimonial added successfully.', kind: 'success' });
    } else {
      await updateTestimonial(modal.testimonial.id, payload as DbTestimonialUpdate);
      setToast({ message: 'Testimonial updated successfully.', kind: 'success' });
    }

    await loadTestimonials();
    setModal({ type: 'none' });
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (modal.type !== 'delete') return;
    setDeleteLoading(true);
    try {
      await deleteTestimonial(modal.testimonial.id);
      await loadTestimonials();
      setModal({ type: 'none' });
      setToast({ message: 'Testimonial deleted.', kind: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Delete failed.', kind: 'error' });
      setModal({ type: 'none' });
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Featured toggle (inline, list-level) ─────────────────────────────

  async function handleToggleFeatured(t: Testimonial) {
    setTogglingId(t.id);
    try {
      await updateTestimonial(t.id, { featured: !t.featured });
      setTestimonials((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, featured: !x.featured } : x)),
      );
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update featured status.',
        kind: 'error',
      });
    } finally {
      setTogglingId(null);
    }
  }

  const hasFilters = !!search;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex w-8 items-center">
            <span className="h-1.5 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
            <span className="h-1.5 w-px bg-[#C9A227]/80" />
          </div>
          <h1 className="font-serif text-2xl text-white">Testimonials</h1>
          <p className="mt-0.5 text-[12.5px] text-white/35">
            {loading ? 'Loading…' : `${visibleTestimonials.length} of ${testimonials.length} testimonials`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-56">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              type="search"
              placeholder="Name, project, review…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-[#1A1812] py-2.5 pl-9 pr-4 text-[13px] text-white placeholder-white/25 outline-none transition-all [color-scheme:dark] focus:border-[#C9A227]/40 focus:ring-1 focus:ring-[#C9A227]/15 [&::-webkit-search-cancel-button]:hidden"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none rounded-xl border border-white/8 bg-[#1A1812] py-2.5 pl-3.5 pr-8 text-[13px] text-white outline-none transition-all focus:border-[#C9A227]/40 focus:ring-1 focus:ring-[#C9A227]/15"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#1C1A14]">
                  {s.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">▾</span>
          </div>

          <button
            onClick={() => setModal({ type: 'form', mode: 'create' })}
            className="flex items-center gap-2 rounded-xl bg-[#C9A227]/80 px-4 py-2.5 text-[13px] font-medium text-[#14130F] transition-all hover:bg-[#C9A227]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Testimonial
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/6 bg-white/3 p-4">
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-white/6" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 animate-pulse rounded bg-white/6" style={{ width: `${50 + Math.random() * 30}%` }} />
                    <div className="h-3 animate-pulse rounded bg-white/6" style={{ width: `${30 + Math.random() * 20}%` }} />
                  </div>
                </div>
              </div>
            ))
          : visibleTestimonials.length === 0
            ? (
              <div className="rounded-2xl border border-white/6 bg-white/3 px-5 py-16 text-center">
                <p className="mb-3 text-[14px] text-white/30">
                  {testimonials.length === 0 ? 'No testimonials yet.' : 'No testimonials match your search.'}
                </p>
                {testimonials.length === 0 ? (
                  <button
                    onClick={() => setModal({ type: 'form', mode: 'create' })}
                    className="text-[12px] text-[#C9A227]/60 underline underline-offset-2 transition-colors hover:text-[#C9A227]"
                  >
                    Add your first testimonial
                  </button>
                ) : (
                  <button
                    onClick={() => setSearch('')}
                    className="text-[12px] text-[#C9A227]/60 underline underline-offset-2 transition-colors hover:text-[#C9A227]"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )
            : visibleTestimonials.map((t) => (
                <TestimonialMobileCard
                  key={t.id}
                  testimonial={t}
                  onEdit={() => setModal({ type: 'form', mode: 'edit', testimonial: t })}
                  onDelete={() => setModal({ type: 'delete', testimonial: t })}
                />
              ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/6 bg-white/3 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-white/6">
                {['Customer', 'Rating', 'Delivery Date', 'Sort Order', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-normal uppercase tracking-[0.18em] text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/4">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 animate-pulse rounded bg-white/6" style={{ width: `${50 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : visibleTestimonials.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-20 text-center">
                        <p className="mb-3 text-[14px] text-white/30">
                          {testimonials.length === 0 ? 'No testimonials yet.' : 'No testimonials match your search.'}
                        </p>
                        {testimonials.length === 0 ? (
                          <button
                            onClick={() => setModal({ type: 'form', mode: 'create' })}
                            className="text-[12px] text-[#C9A227]/60 underline underline-offset-2 transition-colors hover:text-[#C9A227]"
                          >
                            Add your first testimonial
                          </button>
                        ) : (
                          <button
                            onClick={() => setSearch('')}
                            className="text-[12px] text-[#C9A227]/60 underline underline-offset-2 transition-colors hover:text-[#C9A227]"
                          >
                            Clear search
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                  : visibleTestimonials.map((t) => (
                      <TestimonialRow
                        key={t.id}
                        testimonial={t}
                        onEdit={() => setModal({ type: 'form', mode: 'edit', testimonial: t })}
                        onDelete={() => setModal({ type: 'delete', testimonial: t })}
                        onToggleFeatured={() => handleToggleFeatured(t)}
                        togglingFeatured={togglingId === t.id}
                      />
                    ))}
            </tbody>
          </table>
        </div>
      </div>

      {hasFilters && !loading && visibleTestimonials.length > 0 && (
        <button
          onClick={() => setSearch('')}
          className="self-start text-[11px] text-white/30 underline underline-offset-2 transition-colors hover:text-white/60"
        >
          Clear search
        </button>
      )}

      {/* Form modal */}
      {modal.type === 'form' && (
        <TestimonialFormModal
          mode={modal.mode}
          initialData={modal.mode === 'edit' ? testimonialToForm(modal.testimonial) : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {/* Delete confirm */}
      {modal.type === 'delete' && (
        <DeleteDialog
          testimonial={modal.testimonial}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setModal({ type: 'none' })}
          loading={deleteLoading}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} kind={toast.kind} onDismiss={() => setToast(null)} />}
    </div>
  );
}
