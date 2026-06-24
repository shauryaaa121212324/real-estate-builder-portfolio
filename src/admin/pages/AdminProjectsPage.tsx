// =============================================================================
// Autor Builders Admin — Projects CMS
// src/admin/pages/AdminProjectsPage.tsx
// =============================================================================
// Full CRUD: list, search, create, edit, delete, featured toggle.
// =============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getAllAmenities,
  setProjectAmenities,
  getFloorPlansByProject,
  addFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,
} from '../../services/projectService';
import {
  uploadImage,
  deleteImage,
  updateMedia,
  getMediaByProject,
} from '../../services/mediaService';
import { buildStoragePath, uploadFile } from '../../lib/storage';
import type { ProjectCard, ProjectStatus, ProjectCategory, UnitConfig, ProjectMedia, Project, Amenity, FloorPlan } from '../../types/project';
import type { DbMediaTag } from '../../types/database.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModalMode = 'create' | 'edit' | null;

interface ProjectFormData {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
  configs: UnitConfig[];
  area_min_sqft: string;
  area_max_sqft: string;
  price_min_inr: string;
  price_max_inr: string;
  total_units: string;
  available_units: string;
  launch_year: string;
  completion_year: string;
  rera_number: string;
  cover_image: string;
  location_address: string;
  location_city: string;
  location_state: string;
  location_pincode: string;
  location_lat: string;
  location_lng: string;
  featured: boolean;
  sort_order: string;
  brochure_url: string; // stored URL; populated by BrochureUpload, not a text input
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: ProjectStatus[] = ['upcoming', 'ongoing', 'ready_to_move', 'completed'];
const CATEGORY_OPTIONS: ProjectCategory[] = [
  'residential', 'villa', 'commercial', 'plotted_development', 'mixed_use',
];
const CONFIG_OPTIONS: UnitConfig[] = [
  '1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'duplex', 'penthouse', 'studio', 'villa',
];
const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  residential: 'Residential', villa: 'Villa', commercial: 'Commercial',
  plotted_development: 'Plotted', mixed_use: 'Mixed Use',
};
const STATUS_COLORS: Record<ProjectStatus, string> = {
  upcoming: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  ongoing: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  ready_to_move: 'bg-green-500/15 text-green-400 border-green-500/20',
  completed: 'bg-white/8 text-white/40 border-white/12',
};
const STATUS_DOT: Record<ProjectStatus, string> = {
  upcoming: 'bg-blue-400', ongoing: 'bg-yellow-400',
  ready_to_move: 'bg-green-400', completed: 'bg-white/30',
};
const GALLERY_TAG_OPTIONS: { value: DbMediaTag; label: string }[] = [
  { value: 'exterior',     label: 'Exterior' },
  { value: 'interior',     label: 'Interior' },
  { value: 'amenity',      label: 'Amenities' },
  { value: 'aerial',       label: 'Aerial' },
  { value: 'construction', label: 'Construction' },
];

const EMPTY_FORM: ProjectFormData = {
  name: '', slug: '', tagline: '', description: '',
  status: 'upcoming', category: 'residential', configs: [],
  area_min_sqft: '', area_max_sqft: '',
  price_min_inr: '', price_max_inr: '',
  total_units: '', available_units: '',
  launch_year: new Date().getFullYear().toString(),
  completion_year: '', rera_number: '',
  cover_image: '',
  location_address: '', location_city: '', location_state: '',
  location_pincode: '', location_lat: '', location_lng: '',
  featured: false, sort_order: '0', brochure_url: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Numeric sanitizers
// ---------------------------------------------------------------------------
// `Number('') === 0` and `Number('') || 0 === 0` — both silently turn a blank
// or invalid form field into a "valid looking" 0. That 0 is what was being
// sent to Supabase for `total_units`, tripping the `projects_total_units_check`
// constraint. These helpers make "no valid number was entered" an explicit
// `null` instead of a fabricated 0, so callers (validateForm / formToDbPayload)
// have to decide what to do with it rather than defaulting silently.

/**
 * Parses a form string into a finite integer, or `null` if the input is
 * empty, non-numeric, or not finite (e.g. "", "abc", NaN, Infinity).
 * Does NOT clamp negative values — callers that must reject negatives
 * (total_units, available_units, areas, prices) should check the sign
 * themselves so the failure can be surfaced as a clear validation message.
 */
function parseIntStrict(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

/** Like parseIntStrict, but for fields where a non-numeric/blank input can
 * safely fall back to 0 (e.g. map coordinates) without risking a DB
 * constraint violation. */
function parseFloatOrZero(value: string): number {
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : 0;
}

/**
 * FALLBACK ONLY. `ProjectCard` (see types/project.ts) is a `Pick<Project, …>`
 * that deliberately omits `totalUnits`, `availableUnits`, `launchYear`,
 * `completionYear`, `reraNumber`, and `brochureUrl` — those fields simply
 * aren't on the object. This mapper therefore CANNOT know the project's real
 * total_units, so it blanks them. It must only be used when the full project
 * record could not be loaded (see `projectToForm` below, which is what the
 * edit modal actually uses on the happy path).
 */
function cardToForm(p: ProjectCard): ProjectFormData {
  return {
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    description: '',
    status: p.status,
    category: p.category,
    configs: [...p.configs],
    area_min_sqft: String(p.areaRangeSqFt[0]),
    area_max_sqft: String(p.areaRangeSqFt[1]),
    price_min_inr: String(p.priceRangeInr[0]),
    price_max_inr: String(p.priceRangeInr[1]),
    total_units: '',
    available_units: '',
    launch_year: new Date().getFullYear().toString(),
    completion_year: '',
    rera_number: '',
    cover_image: p.coverImage,
    location_address: p.location.address,
    location_city: p.location.city,
    location_state: p.location.state,
    location_pincode: p.location.pincode,
    location_lat: String(p.location.lat),
    location_lng: String(p.location.lng),
    featured: p.featured,
    sort_order: String(p.sortOrder),
    brochure_url: '',
  };
}

/**
 * Maps a FULL project record (from `getProjectById`) to form state. Unlike
 * `cardToForm`, every field here comes from real, currently-saved data —
 * including `total_units` / `available_units` — so opening "Edit Project"
 * and immediately clicking "Save Changes" without touching anything
 * round-trips the existing values instead of wiping them to 0.
 */
function projectToForm(p: Project): ProjectFormData {
  return {
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    description: p.description,
    status: p.status,
    category: p.category,
    configs: [...p.configs],
    area_min_sqft: String(p.areaRangeSqFt[0]),
    area_max_sqft: String(p.areaRangeSqFt[1]),
    price_min_inr: String(p.priceRangeInr[0]),
    price_max_inr: String(p.priceRangeInr[1]),
    total_units: String(p.totalUnits),
    available_units: String(p.availableUnits),
    launch_year: String(p.launchYear),
    completion_year: p.completionYear !== null ? String(p.completionYear) : '',
    rera_number: p.reraNumber ?? '',
    cover_image: p.coverImage,
    location_address: p.location.address,
    location_city: p.location.city,
    location_state: p.location.state,
    location_pincode: p.location.pincode,
    location_lat: String(p.location.lat),
    location_lng: String(p.location.lng),
    featured: p.featured,
    sort_order: String(p.sortOrder),
    brochure_url: p.brochureUrl ?? '',
  };
}

function formToDbPayload(f: ProjectFormData) {
  return {
    name: f.name.trim(),
    slug: f.slug.trim(),
    tagline: f.tagline.trim(),
    description: f.description.trim(),
    status: f.status,
    category: f.category,
    configs: f.configs,
    area_min_sqft: parseIntStrict(f.area_min_sqft) ?? null,
    area_max_sqft: parseIntStrict(f.area_max_sqft) ?? null,
    price_min_inr: parseIntStrict(f.price_min_inr) ?? 0,
    price_max_inr: parseIntStrict(f.price_max_inr) ?? 0,
    // total_units / available_units are required, NOT NULL columns and
    // total_units additionally carries `projects_total_units_check`.
    // validateForm() rejects the submission before it reaches here if either
    // is blank, non-numeric, or total_units <= 0 — the `?? 0` below is only
    // a type-safe fallback, not the validation gate.
    total_units: parseIntStrict(f.total_units) ?? 0,
    available_units: parseIntStrict(f.available_units) ?? 0,
    launch_year: parseIntStrict(f.launch_year) ?? new Date().getFullYear(),
    completion_year: f.completion_year.trim() === '' ? null : parseIntStrict(f.completion_year),
    rera_number: f.rera_number.trim() || null,
    cover_image: f.cover_image.trim(),
    location: {
      address: f.location_address.trim(),
      city: f.location_city.trim(),
      state: f.location_state.trim(),
      pincode: f.location_pincode.trim(),
      lat: parseFloatOrZero(f.location_lat),
      lng: parseFloatOrZero(f.location_lng),
      landmarks: [],
    },
    featured: f.featured,
    sort_order: parseIntStrict(f.sort_order) ?? 0,
    brochure_url: f.brochure_url.trim() || null,
  };
}

function validateForm(f: ProjectFormData): string[] {
  const errs: string[] = [];
  if (!f.name.trim()) errs.push('Project name is required.');
  if (!f.slug.trim()) errs.push('Slug is required.');
  if (!f.tagline.trim()) errs.push('Tagline is required.');
  if (!f.cover_image.trim()) errs.push('Cover image is required.');
  if (!f.location_city.trim()) errs.push('City is required.');
  if (!f.price_min_inr || !f.price_max_inr) errs.push('Price range is required.');

  // `total_units` is a required, NOT NULL column with a DB check constraint
  // (projects_total_units_check) that rejects non-positive values. Catch a
  // blank/invalid/zero/negative entry here with a clear message instead of
  // letting it fall through to `Number('') || 0` and fail at the database.
  const totalUnits = parseIntStrict(f.total_units);
  if (totalUnits === null || totalUnits <= 0) {
    errs.push('Total Units is required and must be a whole number greater than 0.');
  }

  // available_units is also a required NOT NULL column; 0 is a valid value
  // (e.g. sold out), but blank/non-numeric/negative input isn't.
  const availableUnits = parseIntStrict(f.available_units);
  if (availableUnits === null || availableUnits < 0) {
    errs.push('Available Units is required and must be a whole number of 0 or more.');
  } else if (totalUnits !== null && availableUnits > totalUnits) {
    errs.push('Available Units cannot be greater than Total Units.');
  }

  return errs;
}

// ---------------------------------------------------------------------------
// Gallery helpers
// ---------------------------------------------------------------------------

function makeLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A gallery image queued locally before the project exists (create mode). */
interface PendingGalleryItem {
  localId: string;
  file: File;
  previewUrl: string;
  tag: DbMediaTag;
  alt: string;
}

/** A gallery image already persisted as a project_media row (edit mode). */
type ExistingGalleryItem = ProjectMedia;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.1em] transition-all duration-150',
        active
          ? 'border-[#C9A227]/40 bg-[#C9A227]/12 text-[#C9A227]'
          : 'border-white/8 bg-white/3 text-white/40 hover:border-white/15 hover:text-white/60',
      ].join(' ')}
    >
      {label.replace(/_/g, ' ')}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Confirm Delete Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  project,
  onConfirm,
  onCancel,
  loading,
}: {
  project: ProjectCard;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#1A1812] p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="font-serif text-[16px] text-white mb-1">Delete Project</h3>
        <p className="text-[13px] text-white/50 mb-6">
          Are you sure you want to delete <span className="text-white/80">"{project.name}"</span>? This will permanently remove the project and all associated media, floor plans, and amenities.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500/80 hover:bg-red-500 py-2.5 text-[13px] text-white font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form field helpers
// ---------------------------------------------------------------------------

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.15em] text-white/35 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = "admin-field w-full rounded-xl border border-[#14130F]/15 bg-[#F8F6F1] px-3.5 py-2.5 text-[13px] text-[#14130F] placeholder-[rgba(20,19,15,0.45)] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/40 transition-all";
const selectCls = "admin-field w-full rounded-xl border border-white/8 bg-[#14130F] px-3.5 py-2.5 text-[13px] text-[#F8F6F1] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/40 transition-all";

// ---------------------------------------------------------------------------
// Cover Image Upload
// ---------------------------------------------------------------------------
// Uploads the picked file straight to existing Supabase Storage (via the
// existing storage.ts helpers) and writes the resulting public URL into
// form.cover_image — the exact string the rest of the system already expects.

function CoverImageUpload({
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
      const path = buildStoragePath(file);
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
            alt="Cover preview"
            className="h-32 w-full rounded-xl object-cover border border-white/6"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove cover image"
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm hover:text-red-400 hover:border-red-500/30 transition-all"
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
              {value ? 'Replace cover image' : 'Upload cover image from laptop'}
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => { handlePick(e.target.files); e.target.value = ''; }}
        className="hidden"
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brochure Upload
// ---------------------------------------------------------------------------
// Replaces the plain URL text input. Uploads a PDF to Supabase Storage via
// the existing uploadFile helper and stores the resulting public URL in
// form.brochure_url — exactly the same field the rest of the system reads.

function BrochureUpload({
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
      const ext = file.name.split('.').pop() ?? 'pdf';
      const path = `brochures/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { publicUrl } = await uploadFile(path, file);
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  const fileName = value ? value.split('/').pop()?.split('?')[0] ?? 'brochure.pdf' : '';

  return (
    <div className="flex flex-col gap-2.5">
      {value && (
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-[#C9A227]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-[12px] text-white/60 hover:text-[#C9A227] transition-colors"
            title={fileName}
          >
            {fileName}
          </a>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove brochure"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-5 text-center transition-all hover:border-[#C9A227]/40 hover:bg-white/5 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-[#C9A227]" />
            <span className="text-[12.5px] text-white/50">Uploading PDF…</span>
          </>
        ) : (
          <>
            <svg className="h-4.5 w-4.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="text-[12.5px] text-white/50">
              {value ? 'Replace brochure PDF' : 'Upload brochure PDF from laptop'}
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => { handlePick(e.target.files); e.target.value = ''; }}
        className="hidden"
      />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Amenities Manager
// ---------------------------------------------------------------------------
// Fetches all available amenities on mount, shows them as toggle pills,
// and pre-selects the ones already attached to the project (edit mode).

interface AmenitiesManagerProps {
  projectId: string | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function AmenitiesManager({ projectId: _projectId, selectedIds, onChange }: AmenitiesManagerProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getAllAmenities()
      .then((data) => { if (!cancelled) setAmenities(data); })
      .catch(() => { if (!cancelled) setError('Could not load amenities.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );
  }

  if (loading) return <p className="text-[11.5px] text-white/30">Loading amenities…</p>;
  if (error)   return <p className="text-[11px] text-red-400">{error}</p>;
  if (amenities.length === 0) return (
    <p className="text-[11.5px] text-white/25">
      No amenities found. Add amenity records to the <code className="text-white/40">amenities</code> table first.
    </p>
  );

  // Group by category for readability
  const grouped = amenities.reduce<Record<string, Amenity[]>>((acc, a) => {
    const cat = a.category ?? 'Other';
    (acc[cat] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.18em] text-white/25">{category}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((a) => {
              const active = selectedIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  className={[
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-all',
                    active
                      ? 'border-[#C9A227]/40 bg-[#C9A227]/12 text-[#C9A227]'
                      : 'border-white/8 bg-white/3 text-white/40 hover:border-white/15 hover:text-white/60',
                  ].join(' ')}
                >
                  {a.icon && <span className="text-[14px] leading-none">{a.icon}</span>}
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {selectedIds.length > 0 && (
        <p className="text-[10.5px] text-white/25">
          {selectedIds.length} amenit{selectedIds.length === 1 ? 'y' : 'ies'} selected
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery Manager (Add Project + Edit Project)
// ---------------------------------------------------------------------------
// create mode: files are queued locally (no project id yet) and flushed to
//   mediaService.uploadImage by the parent right after createProject resolves.
// edit mode: files are uploaded immediately via mediaService.uploadImage,
//   existing rows are loaded via getMediaByProject, delete uses deleteImage,
//   and reordering persists sort_order via updateMedia.

interface GalleryManagerProps {
  mode: 'create' | 'edit';
  projectId: string | null;
  pending: PendingGalleryItem[];
  setPending: React.Dispatch<React.SetStateAction<PendingGalleryItem[]>>;
  existing: ExistingGalleryItem[];
  setExisting: React.Dispatch<React.SetStateAction<ExistingGalleryItem[]>>;
  loadingExisting: boolean;
}

function GalleryManager({
  mode,
  projectId,
  pending,
  setPending,
  existing,
  setExisting,
  loadingExisting,
}: GalleryManagerProps) {
  const [defaultTag, setDefaultTag] = useState<DbMediaTag>('exterior');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');

    if (mode === 'create') {
      const items: PendingGalleryItem[] = Array.from(files).map((file) => ({
        localId: makeLocalId(),
        file,
        previewUrl: URL.createObjectURL(file),
        tag: defaultTag,
        alt: '',
      }));
      setPending((prev) => [...prev, ...items]);
      return;
    }

    // Edit mode: upload immediately to the existing project.
    if (!projectId) return;
    const fileArr = Array.from(files);
    let runningMaxSort = existing.length ? Math.max(...existing.map((m) => m.sortOrder)) : -1;
    (async () => {
      for (const file of fileArr) {
        setUploadingCount((n) => n + 1);
        try {
          runningMaxSort += 1;
          const created = await uploadImage(file, {
            projectId,
            alt: file.name.replace(/\.[a-z0-9]+$/i, ''),
            tag: defaultTag,
            type: 'image',
            sortOrder: runningMaxSort,
          });
          setExisting((prev) => [...prev, created]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
          setUploadingCount((n) => n - 1);
        }
      }
    })();
  }

  function removePending(localId: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  }

  function updatePendingTag(localId: string, tag: DbMediaTag) {
    setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, tag } : p)));
  }

  function updatePendingAlt(localId: string, alt: string) {
    setPending((prev) => prev.map((p) => (p.localId === localId ? { ...p, alt } : p)));
  }

  async function removeExisting(item: ExistingGalleryItem) {
    setBusyId(item.id);
    setError('');
    try {
      await deleteImage(item.id);
      setExisting((prev) => prev.filter((m) => m.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function moveExisting(item: ExistingGalleryItem, direction: 'up' | 'down') {
    const sorted = [...existing].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((m) => m.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    setBusyId(a.id);
    setError('');
    try {
      await Promise.all([
        updateMedia(a.id, { sort_order: b.sortOrder }),
        updateMedia(b.id, { sort_order: a.sortOrder }),
      ]);
      setExisting((prev) =>
        prev.map((m) => {
          if (m.id === a.id) return { ...m, sortOrder: b.sortOrder };
          if (m.id === b.id) return { ...m, sortOrder: a.sortOrder };
          return m;
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed.');
    } finally {
      setBusyId(null);
    }
  }

  const sortedExisting = [...existing].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-3.5 py-2.5 text-[11.5px] text-red-400">
          {error}
        </div>
      )}

      {/* Default tag for new uploads */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 shrink-0">New photo tag</span>
        <div className="flex flex-wrap gap-1.5">
          {GALLERY_TAG_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setDefaultTag(t.value)}
              className={[
                'rounded-lg border px-2.5 py-1 text-[11px] transition-all',
                defaultTag === t.value
                  ? 'border-[#C9A227]/40 bg-[#C9A227]/12 text-[#C9A227]'
                  : 'border-white/8 bg-white/3 text-white/40 hover:border-white/15 hover:text-white/60',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload trigger */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploadingCount > 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-6 text-center transition-all hover:border-[#C9A227]/40 hover:bg-white/5 disabled:opacity-50"
      >
        {uploadingCount > 0 ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-[#C9A227]" />
            <span className="text-[12.5px] text-white/50">
              Uploading {uploadingCount} image{uploadingCount === 1 ? '' : 's'}…
            </span>
          </>
        ) : (
          <>
            <svg className="h-4.5 w-4.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="text-[12.5px] text-white/50">Upload gallery images from laptop</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => { handleFilesPicked(e.target.files); e.target.value = ''; }}
        className="hidden"
      />

      {loadingExisting && (
        <p className="text-[11.5px] text-white/30">Loading existing gallery images…</p>
      )}

      {/* Existing (persisted) gallery images — edit mode */}
      {!loadingExisting && sortedExisting.length > 0 && (
        <div className="flex flex-col gap-2">
          {sortedExisting.map((item, i) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-2.5 sm:flex-row sm:items-center sm:gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={item.thumbnailUrl || item.url}
                  alt={item.alt}
                  className="h-14 w-20 shrink-0 rounded-lg object-cover border border-white/6"
                  onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-white/70" title={item.alt}>{item.alt || 'Untitled'}</p>
                  <span className="mt-1 inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-[9.5px] uppercase tracking-[0.08em] text-white/40">
                    {item.tag.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-1 sm:justify-start">
                <button
                  type="button"
                  onClick={() => moveExisting(item, 'up')}
                  disabled={busyId === item.id || i === 0}
                  title="Move up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-white/40 hover:text-white hover:border-white/20 transition-all disabled:opacity-25"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveExisting(item, 'down')}
                  disabled={busyId === item.id || i === sortedExisting.length - 1}
                  title="Move down"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-white/40 hover:text-white hover:border-white/20 transition-all disabled:opacity-25"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeExisting(item)}
                  disabled={busyId === item.id}
                  title="Delete"
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-40"
                >
                  {busyId === item.id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400" />
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending (queued, not yet uploaded) gallery images — create mode */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          {pending.map((item) => (
            <div
              key={item.localId}
              className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-2.5 sm:flex-row sm:items-center sm:gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={item.previewUrl}
                  alt={item.alt || item.file.name}
                  className="h-14 w-20 shrink-0 rounded-lg object-cover border border-white/6"
                />
                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                  <input
                    value={item.alt}
                    onChange={(e) => updatePendingAlt(item.localId, e.target.value)}
                    placeholder={item.file.name}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11.5px] text-white placeholder-white/25 outline-none focus:border-[#C9A227]/40"
                  />
                  <select
                    value={item.tag}
                    onChange={(e) => updatePendingTag(item.localId, e.target.value as DbMediaTag)}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 outline-none focus:border-[#C9A227]/40"
                  >
                    {GALLERY_TAG_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value} className="bg-[#1C1A14]">{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePending(item.localId)}
                title="Remove"
                className="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-lg border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 transition-all sm:self-center"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <p className="text-[10.5px] text-white/25">
            {pending.length} photo{pending.length === 1 ? '' : 's'} will upload once the project is created.
          </p>
        </div>
      )}

      {!loadingExisting && pending.length === 0 && sortedExisting.length === 0 && (
        <p className="text-[11.5px] text-white/25">No gallery images yet.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floor Plan (Configuration Variant) Manager
// ---------------------------------------------------------------------------
// Manages the `floor_plans` table rows that drive the public "Pricing &
// Availability" section's per-configuration cards (area range, price range,
// variant count). Edit-mode only: floor plans are children of a project row
// (FK `project_id`), so there is nothing to attach them to until the project
// has been created and has a real id — same constraint GalleryManager works
// around with a "pending" queue, but floor plans additionally require an
// uploaded image per row, so we keep this fix's scope to edit mode and
// surface a clear message in create mode instead of building a second
// pending-upload queue.

interface FloorPlanDraft {
  label: string;
  config: UnitConfig;
  area_sqft: string;
  price_min: string;
  price_max: string;
  image_url: string;
}

const EMPTY_FLOOR_PLAN_DRAFT: FloorPlanDraft = {
  label: '',
  config: '1BHK',
  area_sqft: '',
  price_min: '',
  price_max: '',
  image_url: '',
};

function FloorPlanManager({
  mode,
  projectId,
  configs,
  floorPlans,
  setFloorPlans,
  loadingExisting,
}: {
  mode: 'create' | 'edit';
  projectId: string | null;
  configs: UnitConfig[];
  floorPlans: FloorPlan[];
  setFloorPlans: React.Dispatch<React.SetStateAction<FloorPlan[]>>;
  loadingExisting: boolean;
}) {
  const [draft, setDraft] = useState<FloorPlanDraft>(() => ({
    ...EMPTY_FLOOR_PLAN_DRAFT,
    config: configs[0] ?? EMPTY_FLOOR_PLAN_DRAFT.config,
  }));
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Inline edit state for an existing (already-saved) floor plan row.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<FloorPlanDraft>(EMPTY_FLOOR_PLAN_DRAFT);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Keep the "add variant" config selection valid if the project's toggled
  // Unit Configurations change while this modal is open (e.g. user unchecks
  // a config after already picking it here) — otherwise the <select>'s
  // value can silently fall out of sync with what's actually rendered/saved.
  useEffect(() => {
    if (configs.length > 0 && !configs.includes(draft.config)) {
      setDraftField('config', configs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs]);

  function setDraftField<K extends keyof FloorPlanDraft>(key: K, value: FloorPlanDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function setEditDraftField<K extends keyof FloorPlanDraft>(key: K, value: FloorPlanDraft[K]) {
    setEditDraft((prev) => ({ ...prev, [key]: value }));
  }

  // The rendered <option> list must always include whatever value is
  // currently selected, or the <select>'s displayed text and its underlying
  // React state silently diverge (browser shows the first option in the
  // list; state keeps the orphaned value) — that mismatch is what causes a
  // variant to save under the wrong configuration. Covers both "project's
  // toggled configs don't include the default" and "an existing floor plan's
  // saved config was later untoggled at the project level".
  function configSelectOptions(current: UnitConfig): UnitConfig[] {
    const base = configs.length ? configs : CONFIG_OPTIONS;
    return base.includes(current) ? base : [current, ...base];
  }

  function startEdit(plan: FloorPlan) {
    setError('');
    setEditingId(plan.id);
    setEditDraft({
      label: plan.label,
      config: plan.config,
      area_sqft: String(plan.areaSqFt),
      price_min: String(plan.priceMin),
      price_max: String(plan.priceMax),
      image_url: plan.imageUrl,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(EMPTY_FLOOR_PLAN_DRAFT);
  }

  async function handleEditImagePicked(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    try {
      const path = buildStoragePath(file);
      const { publicUrl } = await uploadFile(path, file);
      setEditDraftField('image_url', publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    }
  }

  function validateDraft(d: FloorPlanDraft): string | null {
    if (!d.label.trim()) return 'Variant label is required.';
    const area = parseIntStrict(d.area_sqft);
    if (area === null || area <= 0) return 'Area (sq ft) must be a positive number.';
    const priceMin = parseIntStrict(d.price_min);
    const priceMax = parseIntStrict(d.price_max);
    if (priceMin === null || priceMin < 0) return 'Min price must be a valid number.';
    if (priceMax === null || priceMax < 0) return 'Max price must be a valid number.';
    if (priceMax < priceMin) return 'Max price cannot be lower than min price.';
    if (!d.image_url.trim()) return 'A floor plan image is required.';
    return null;
  }

  async function handleSaveEdit(planId: string) {
    const validationError = validateDraft(editDraft);
    if (validationError) { setError(validationError); return; }
    setError('');
    setBusyId(planId);
    try {
      const updated = await updateFloorPlan(planId, {
        label: editDraft.label.trim(),
        config: editDraft.config,
        area_sqft: parseIntStrict(editDraft.area_sqft) ?? 0,
        price_min: parseIntStrict(editDraft.price_min) ?? 0,
        price_max: parseIntStrict(editDraft.price_max) ?? 0,
        image_url: editDraft.image_url.trim(),
      });
      setFloorPlans((prev) => prev.map((p) => (p.id === planId ? updated : p)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update floor plan.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleImagePicked(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    try {
      const path = buildStoragePath(file);
      const { publicUrl } = await uploadFile(path, file);
      setDraftField('image_url', publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    }
  }

  async function handleAdd() {
    if (!projectId) return;
    const validationError = validateDraft(draft);
    if (validationError) { setError(validationError); return; }
    setError('');
    setAdding(true);
    try {
      const created = await addFloorPlan(projectId, {
        label: draft.label.trim(),
        config: draft.config,
        area_sqft: parseIntStrict(draft.area_sqft) ?? 0,
        price_min: parseIntStrict(draft.price_min) ?? 0,
        price_max: parseIntStrict(draft.price_max) ?? 0,
        image_url: draft.image_url.trim(),
        sort_order: floorPlans.length,
      });
      setFloorPlans((prev) => [...prev, created]);
      setDraft({ ...EMPTY_FLOOR_PLAN_DRAFT, config: draft.config });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add floor plan.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(plan: FloorPlan) {
    setBusyId(plan.id);
    setError('');
    try {
      await deleteFloorPlan(plan.id);
      setFloorPlans((prev) => prev.filter((p) => p.id !== plan.id));
      if (editingId === plan.id) cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete floor plan.');
    } finally {
      setBusyId(null);
    }
  }

  if (mode === 'create') {
    return (
      <p className="text-[11.5px] text-white/25">
        Save this project first, then reopen it in Edit mode to add configuration variants
        (per-config area, price range, and images).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-3.5 py-2.5 text-[11.5px] text-red-400">
          {error}
        </div>
      )}

      {loadingExisting && (
        <p className="text-[11.5px] text-white/30">Loading configuration variants…</p>
      )}

      {/* Existing floor plans */}
      {!loadingExisting && floorPlans.length > 0 && (
        <div className="flex flex-col gap-2">
          {floorPlans.map((plan) => {
            const isEditing = editingId === plan.id;

            if (isEditing) {
              return (
                <div
                  key={plan.id}
                  className="rounded-xl border border-[#C9A227]/30 bg-white/4 p-3 flex flex-col gap-2.5"
                >
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      className={inputCls}
                      value={editDraft.label}
                      onChange={(e) => setEditDraftField('label', e.target.value)}
                      placeholder="Variant label"
                    />
                    <select
                      className={selectCls}
                      value={editDraft.config}
                      onChange={(e) => setEditDraftField('config', e.target.value as UnitConfig)}
                    >
                      {configSelectOptions(editDraft.config).map((c) => (
                        <option key={c} value={c} className="bg-[#1C1A14]">{c}</option>
                      ))}
                    </select>
                    <input
                      className={inputCls}
                      type="number"
                      value={editDraft.area_sqft}
                      onChange={(e) => setEditDraftField('area_sqft', e.target.value)}
                      placeholder="Area (sq ft)"
                    />
                    <input
                      className={inputCls}
                      type="number"
                      value={editDraft.price_min}
                      onChange={(e) => setEditDraftField('price_min', e.target.value)}
                      placeholder="Min price (₹)"
                    />
                    <input
                      className={inputCls}
                      type="number"
                      value={editDraft.price_max}
                      onChange={(e) => setEditDraftField('price_max', e.target.value)}
                      placeholder="Max price (₹)"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => editInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2 text-[11.5px] text-white/50 transition-all hover:border-[#C9A227]/40 hover:bg-white/5"
                  >
                    Replace variant image
                  </button>
                  <input
                    ref={editInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { handleEditImagePicked(e.target.files); e.target.value = ''; }}
                    className="hidden"
                  />
                  {editDraft.image_url && (
                    <img
                      src={editDraft.image_url}
                      alt="Variant preview"
                      className="h-16 w-full rounded-lg object-cover border border-white/6"
                    />
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(plan.id)}
                      disabled={busyId === plan.id}
                      className="flex-1 rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/12 px-3 py-2 text-[11.5px] text-[#C9A227] transition-all hover:bg-[#C9A227]/20 disabled:opacity-50"
                    >
                      {busyId === plan.id ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={busyId === plan.id}
                      className="rounded-lg border border-white/10 px-3 py-2 text-[11.5px] text-white/50 transition-all hover:text-white hover:border-white/25"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={plan.id}
                className="flex flex-col gap-2 rounded-xl border border-white/8 bg-white/4 p-2.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={plan.imageUrl}
                    alt={plan.label}
                    className="h-14 w-20 shrink-0 rounded-lg object-cover border border-white/6"
                    onError={(e) => { e.currentTarget.style.opacity = '0'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-white/70" title={plan.label}>{plan.label}</p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      {plan.config} ·{' '}
                      {plan.areaSqFt.toLocaleString('en-IN')} sq.ft ·{' '}
                      {formatPrice(plan.priceMin)} – {formatPrice(plan.priceMax)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-1 sm:justify-start">
                  <button
                    type="button"
                    onClick={() => startEdit(plan)}
                    title="Edit variant"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-white/40 hover:text-white hover:border-white/20 transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(plan)}
                    disabled={busyId === plan.id}
                    title="Delete variant"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-40"
                  >
                    {busyId === plan.id ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400/20 border-t-red-400" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loadingExisting && floorPlans.length === 0 && (
        <p className="text-[11.5px] text-white/25">
          No configuration variants yet — the public page is showing the project-level price/area
          range as a fallback for every config badge. Add at least one variant per configuration
          below to make those cards accurate.
        </p>
      )}

      {/* Add new variant */}
      <div className="rounded-xl border border-dashed border-white/15 bg-white/3 p-3.5 flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">Add configuration variant</p>
        <div className="grid grid-cols-2 gap-2.5">
          <input
            className={inputCls}
            value={draft.label}
            onChange={(e) => setDraftField('label', e.target.value)}
            placeholder="e.g. 3 BHK – Type A"
          />
          <select
            className={selectCls}
            value={draft.config}
            onChange={(e) => setDraftField('config', e.target.value as UnitConfig)}
          >
            {configSelectOptions(draft.config).map((c) => (
              <option key={c} value={c} className="bg-[#1C1A14]">{c}</option>
            ))}
          </select>
          <input
            className={inputCls}
            type="number"
            value={draft.area_sqft}
            onChange={(e) => setDraftField('area_sqft', e.target.value)}
            placeholder="Area (sq ft)"
          />
          <input
            className={inputCls}
            type="number"
            value={draft.price_min}
            onChange={(e) => setDraftField('price_min', e.target.value)}
            placeholder="Min price (₹)"
          />
          <input
            className={inputCls}
            type="number"
            value={draft.price_max}
            onChange={(e) => setDraftField('price_max', e.target.value)}
            placeholder="Max price (₹)"
          />
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-[12px] text-white/50 transition-all hover:border-[#C9A227]/40 hover:bg-white/5"
        >
          {draft.image_url ? 'Replace variant image' : 'Upload variant image'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => { handleImagePicked(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
        {draft.image_url && (
          <img
            src={draft.image_url}
            alt="Variant preview"
            className="h-20 w-full rounded-lg object-cover border border-white/6"
          />
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={adding}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9A227]/40 bg-[#C9A227]/12 px-3 py-2.5 text-[12px] text-[#C9A227] transition-all hover:bg-[#C9A227]/20 disabled:opacity-50"
        >
          {adding ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#C9A227]/30 border-t-[#C9A227]" />
          ) : null}
          {adding ? 'Adding…' : 'Add variant'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Form Modal
// ---------------------------------------------------------------------------

function ProjectFormModal({
  mode,
  projectId,
  initialData,
  initialAmenityIds,
  onSave,
  onClose,
}: {
  mode: 'create' | 'edit';
  projectId: string | null;
  initialData: ProjectFormData;
  initialAmenityIds: string[];
  onSave: (data: ProjectFormData, pendingGallery: PendingGalleryItem[], amenityIds: string[], mode: 'create' | 'edit') => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProjectFormData>(initialData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [amenityIds, setAmenityIds] = useState<string[]>(initialAmenityIds);

  // ── Gallery state ──────────────────────────────────────────────────────
  const [pendingGallery, setPendingGallery] = useState<PendingGalleryItem[]>([]);
  const [existingGallery, setExistingGallery] = useState<ExistingGalleryItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(mode === 'edit');

  // ── Floor plan / configuration variant state ───────────────────────────
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loadingFloorPlans, setLoadingFloorPlans] = useState(mode === 'edit');

  useEffect(() => {
    if (mode !== 'edit' || !projectId) return;
    let cancelled = false;
    setLoadingFloorPlans(true);
    getFloorPlansByProject(projectId)
      .then((plans) => { if (!cancelled) setFloorPlans(plans); })
      .catch(() => { /* surfaced via empty state; non-fatal to the form */ })
      .finally(() => { if (!cancelled) setLoadingFloorPlans(false); });
    return () => { cancelled = true; };
  }, [mode, projectId]);

  useEffect(() => {
    if (mode !== 'edit' || !projectId) return;
    let cancelled = false;
    setLoadingGallery(true);
    getMediaByProject(projectId)
      .then((media) => { if (!cancelled) setExistingGallery(media); })
      .catch(() => { /* surfaced via empty state; non-fatal to the form */ })
      .finally(() => { if (!cancelled) setLoadingGallery(false); });
    return () => { cancelled = true; };
  }, [mode, projectId]);

  // Revoke any local preview object URLs when the modal unmounts.
  useEffect(() => {
    return () => {
      pendingGallery.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(key: keyof ProjectFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(v: string) {
    set('name', v);
    if (mode === 'create') set('slug', slugify(v));
  }

  function toggleConfig(c: UnitConfig) {
    setForm((prev) => ({
      ...prev,
      configs: prev.configs.includes(c)
        ? prev.configs.filter((x) => x !== c)
        : [...prev.configs, c],
    }));
  }

  async function handleSubmit() {
    const errs = validateForm(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSaving(true);
    try {
      await onSave(form, pendingGallery, amenityIds, mode);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Save failed. Please try again.']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-[#14130F] border-l border-white/8 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-[#14130F] border-b border-white/6 px-6 py-5 flex items-center justify-between gap-4 z-10">
          <div>
            <p className="font-serif text-[17px] text-white">
              {mode === 'create' ? 'Add Project' : 'Edit Project'}
            </p>
            <p className="text-[11.5px] text-white/35 mt-0.5">
              {mode === 'create' ? 'Create a new project listing' : `Editing: ${form.name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-6 py-6 pb-8 flex flex-col gap-5">
          {errors.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
              {errors.map((e) => (
                <p key={e} className="text-[12.5px] text-red-400">{e}</p>
              ))}
            </div>
          )}

          {/* Basic */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Basic Info</p>
            <div className="flex flex-col gap-3">
              <Field label="Project Name *">
                <input className={inputCls} value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Autor Pinnacle" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Slug *">
                  <input className={inputCls} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="autor-pinnacle" />
                </Field>
                <Field label="Sort Order">
                  <input className={inputCls} type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
                </Field>
              </div>
              <Field label="Tagline *">
                <input className={inputCls} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Short headline for the project" />
              </Field>
              <Field label="Description">
                <textarea className={inputCls + ' resize-none h-24'} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Full project description…" />
              </Field>
            </div>
          </div>

          {/* Status & Category */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Classification</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status">
                <select className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value as ProjectStatus)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value as ProjectCategory)}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Configs */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Unit Configurations</p>
            <div className="flex flex-wrap gap-2">
              {CONFIG_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleConfig(c)}
                  className={[
                    'rounded-lg border px-3 py-1.5 text-[12px] transition-all',
                    form.configs.includes(c)
                      ? 'border-[#C9A227]/40 bg-[#C9A227]/12 text-[#C9A227]'
                      : 'border-white/8 bg-white/3 text-white/40 hover:border-white/15 hover:text-white/60',
                  ].join(' ')}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Area */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Pricing & Area</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min Price (₹) *">
                <input className={inputCls} type="number" value={form.price_min_inr} onChange={(e) => set('price_min_inr', e.target.value)} placeholder="5000000" />
              </Field>
              <Field label="Max Price (₹) *">
                <input className={inputCls} type="number" value={form.price_max_inr} onChange={(e) => set('price_max_inr', e.target.value)} placeholder="15000000" />
              </Field>
              <Field label="Min Area (sq ft)">
                <input className={inputCls} type="number" value={form.area_min_sqft} onChange={(e) => set('area_min_sqft', e.target.value)} />
              </Field>
              <Field label="Max Area (sq ft)">
                <input className={inputCls} type="number" value={form.area_max_sqft} onChange={(e) => set('area_max_sqft', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Units */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Units</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Units *">
                <input className={inputCls} type="number" value={form.total_units} onChange={(e) => set('total_units', e.target.value)} />
              </Field>
              <Field label="Available Units">
                <input className={inputCls} type="number" value={form.available_units} onChange={(e) => set('available_units', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Configuration Variants (Floor Plans) */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">
              Configuration Variants
            </p>
            <p className="mb-3 text-[11px] text-white/30">
              Drives the per-config Area, Price and "N variants" cards on the public Pricing &amp;
              Availability section. Without at least one variant per configuration, the public
              page falls back to the project-wide Pricing &amp; Area range above.
            </p>
            <FloorPlanManager
              mode={mode}
              projectId={projectId}
              configs={form.configs}
              floorPlans={floorPlans}
              setFloorPlans={setFloorPlans}
              loadingExisting={loadingFloorPlans}
            />
          </div>

          {/* Timeline */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Timeline & Compliance</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Launch Year">
                <input className={inputCls} type="number" value={form.launch_year} onChange={(e) => set('launch_year', e.target.value)} />
              </Field>
              <Field label="Completion Year">
                <input className={inputCls} type="number" value={form.completion_year} onChange={(e) => set('completion_year', e.target.value)} placeholder="Optional" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="RERA Number">
                <input className={inputCls} value={form.rera_number} onChange={(e) => set('rera_number', e.target.value)} placeholder="Optional" />
              </Field>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Location</p>
            <div className="flex flex-col gap-3">
              <Field label="Address">
                <input className={inputCls} value={form.location_address} onChange={(e) => set('location_address', e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City *">
                  <input className={inputCls} value={form.location_city} onChange={(e) => set('location_city', e.target.value)} />
                </Field>
                <Field label="State">
                  <input className={inputCls} value={form.location_state} onChange={(e) => set('location_state', e.target.value)} />
                </Field>
                <Field label="Pincode">
                  <input className={inputCls} value={form.location_pincode} onChange={(e) => set('location_pincode', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <input className={inputCls} type="number" step="any" value={form.location_lat} onChange={(e) => set('location_lat', e.target.value)} />
                </Field>
                <Field label="Longitude">
                  <input className={inputCls} type="number" step="any" value={form.location_lng} onChange={(e) => set('location_lng', e.target.value)} />
                </Field>
              </div>
            </div>
          </div>

          {/* Media */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Media & Links</p>
            <div className="flex flex-col gap-3">
              <Field label="Cover Image *">
                <CoverImageUpload
                  value={form.cover_image}
                  onChange={(url) => set('cover_image', url)}
                  disabled={saving}
                />
              </Field>
              <Field label="Brochure PDF">
                <BrochureUpload
                  value={form.brochure_url}
                  onChange={(url) => set('brochure_url', url)}
                  disabled={saving}
                />
              </Field>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Amenities</p>
            <AmenitiesManager
              projectId={projectId}
              selectedIds={amenityIds}
              onChange={setAmenityIds}
            />
          </div>

          {/* Gallery */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Gallery Images</p>
            <GalleryManager
              mode={mode}
              projectId={projectId}
              pending={pendingGallery}
              setPending={setPendingGallery}
              existing={existingGallery}
              setExisting={setExistingGallery}
              loadingExisting={loadingGallery}
            />
          </div>

          {/* Flags */}
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">Visibility</p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => set('featured', !form.featured)}
                className={[
                  'relative h-5 w-9 rounded-full border transition-all duration-200',
                  form.featured
                    ? 'bg-[#C9A227]/80 border-[#C9A227]/60'
                    : 'bg-white/8 border-white/12',
                ].join(' ')}
              >
                <span className={[
                  'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                  form.featured ? 'translate-x-4' : 'translate-x-0',
                ].join(' ')} />
              </div>
              <span className="text-[13px] text-white/60 group-hover:text-white/80 transition-colors">
                Featured project
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#14130F] border-t border-white/6 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#C9A227]/80 hover:bg-[#C9A227] py-2.5 text-[13px] text-[#14130F] font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving && <span className="h-3.5 w-3.5 rounded-full border-2 border-[#14130F]/30 border-t-[#14130F] animate-spin" />}
            {mode === 'create' ? 'Create Project' : 'Save Changes'}
          </button>
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Row (table)
// ---------------------------------------------------------------------------

function ProjectRow({
  project,
  onEdit,
  onDelete,
  onToggleFeatured,
  togglingFeatured,
}: {
  project: ProjectCard;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFeatured: () => void;
  togglingFeatured: boolean;
}) {
  return (
    <tr className="border-b border-white/4 hover:bg-white/2 transition-colors group">
      {/* Cover + Name */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 rounded-lg overflow-hidden bg-white/4 shrink-0">
            <img
              src={project.coverImage}
              alt={project.name}
              className="h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div>
            <p className="text-[13px] text-white/85 leading-snug">{project.name}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{project.slug}</p>
          </div>
        </div>
      </td>
      {/* Status */}
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] ${STATUS_COLORS[project.status]}`}>
          <span className={`h-1 w-1 rounded-full ${STATUS_DOT[project.status]}`} />
          {project.status.replace(/_/g, ' ')}
        </span>
      </td>
      {/* Category */}
      <td className="px-5 py-3.5">
        <span className="text-[12px] text-white/45">{CATEGORY_LABELS[project.category]}</span>
      </td>
      {/* Price */}
      <td className="px-5 py-3.5">
        <span className="text-[12px] text-white/55">
          {formatPrice(project.priceRangeInr[0])} – {formatPrice(project.priceRangeInr[1])}
        </span>
      </td>
      {/* City */}
      <td className="px-5 py-3.5">
        <span className="text-[12px] text-white/40">{project.location.city}</span>
      </td>
      {/* Featured toggle */}
      <td className="px-5 py-3.5">
        <button
          onClick={onToggleFeatured}
          disabled={togglingFeatured}
          title={project.featured ? 'Remove from featured' : 'Mark as featured'}
          className="transition-opacity disabled:opacity-40"
        >
          {project.featured ? (
            <svg className="h-4.5 w-4.5 fill-[#C9A227]" viewBox="0 0 24 24">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          ) : (
            <svg className="h-4.5 w-4.5 stroke-white/20 fill-none hover:stroke-[#C9A227]/60" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          )}
        </button>
      </td>
      {/* Actions */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-white/40 hover:text-white hover:border-white/20 transition-all"
            title="Edit"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 transition-all"
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
// Mobile card (sub-768px Projects list)
// ---------------------------------------------------------------------------

function ProjectMobileCard({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 p-4 active:bg-white/4 transition-colors">
      <div className="flex gap-3">
        {/* Image */}
        <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white/4">
          <img
            src={project.coverImage}
            alt={project.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        {/* Name / slug / badges */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] text-white/90 leading-snug truncate" title={project.name}>
            {project.name}
          </p>
          <p className="text-[11px] text-white/30 mt-0.5 truncate">{project.slug}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9.5px] uppercase tracking-[0.1em] ${STATUS_COLORS[project.status]}`}>
              <span className={`h-1 w-1 rounded-full ${STATUS_DOT[project.status]}`} />
              {project.status.replace(/_/g, ' ')}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/8 bg-white/3 px-2 py-0.5 text-[9.5px] text-white/45">
              {CATEGORY_LABELS[project.category]}
            </span>
            {project.featured && (
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

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 border-t border-white/6 pt-3">
        <button
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 py-2 text-[12px] text-white/60 active:bg-white/5 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/15 py-2 text-[12px] text-red-400/70 active:bg-red-500/10 transition-colors"
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
// Main Page
// ---------------------------------------------------------------------------

const STATUS_FILTERS: ProjectStatus[] = ['upcoming', 'ongoing', 'ready_to_move', 'completed'];
const CATEGORY_FILTERS: ProjectCategory[] = [
  'residential', 'villa', 'commercial', 'plotted_development', 'mixed_use',
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [filtered, setFiltered] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingProject, setEditingProject] = useState<ProjectCard | null>(null);
  // Full-record form data for the project being edited. `editingProject` is
  // only a lightweight ProjectCard (no total_units/available_units/etc.), so
  // we fetch the full row via getProjectById and store the mapped form data
  // here. `editDataLoaded` flips once that fetch settles (success OR
  // failure) and is used purely to force the modal to remount with the
  // correct initial values once they arrive — see ProjectFormModal `key=`.
  const [editingFormData, setEditingFormData] = useState<ProjectFormData | null>(null);
  const [editingAmenityIds, setEditingAmenityIds] = useState<string[]>([]);
  const [editDataLoaded, setEditDataLoaded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCard | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filter ────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...projects];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q),
      );
    }
    if (statusFilter.length) result = result.filter((p) => statusFilter.includes(p.status));
    if (categoryFilter.length) result = result.filter((p) => categoryFilter.includes(p.category));
    if (featuredOnly) result = result.filter((p) => p.featured);
    setFiltered(result);
  }, [projects, search, statusFilter, categoryFilter, featuredOnly]);

  // ── CRUD handlers ─────────────────────────────────────────────────────
  async function handleSave(formData: ProjectFormData, pendingGallery: PendingGalleryItem[], amenityIds: string[], mode: 'create' | 'edit') {
    const payload = formToDbPayload(formData);
    let projectId: string;
    if (mode === 'create') {
      const created = await createProject(payload);
      projectId = created.id;
    } else if (editingProject) {
      await updateProject(editingProject.id, payload);
      projectId = editingProject.id;
    } else {
      throw new Error('No project selected for editing.');
    }

    // Persist amenity selections (replaces entire set atomically).
    await setProjectAmenities(projectId, amenityIds);

    // Flush any gallery images queued before the project existed.
    if (pendingGallery.length) {
      let nextSortOrder = 0;
      for (const item of pendingGallery) {
        try {
          await uploadImage(item.file, {
            projectId,
            alt: item.alt.trim() || item.file.name.replace(/\.[a-z0-9]+$/i, ''),
            tag: item.tag,
            type: 'image',
            sortOrder: nextSortOrder,
          });
          nextSortOrder += 1;
        } catch {
          // Best-effort: a single failed gallery upload shouldn't block the
          // project save that already succeeded. Surfaced implicitly since
          // the image simply won't appear in the gallery afterwards.
        }
        URL.revokeObjectURL(item.previewUrl);
      }
    }

    setModalMode(null);
    setEditingProject(null);
    setEditingFormData(null);
    setEditingAmenityIds([]);
    setEditDataLoaded(false);
    await load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleFeatured(project: ProjectCard) {
    setTogglingId(project.id);
    try {
      await updateProject(project.id, { featured: !project.featured } as any);
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, featured: !p.featured } : p)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update featured status.');
    } finally {
      setTogglingId(null);
    }
  }

  function openCreate() {
    setEditingProject(null);
    setEditingFormData(null);
    setEditingAmenityIds([]);
    setEditDataLoaded(false);
    setModalMode('create');
  }

  function openEdit(project: ProjectCard) {
    setEditingProject(project);
    setEditingFormData(cardToForm(project));
    setEditingAmenityIds([]);
    setEditDataLoaded(false);
    setModalMode('edit');

    getProjectById(project.id)
      .then((full) => {
        if (full) {
          setEditingFormData(projectToForm(full));
          setEditingAmenityIds(full.amenities.map((a) => a.id));
        } else {
          setError('Could not load full project details for editing. Total Units and a few other fields could not be restored — please re-enter them before saving.');
        }
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? `Could not load full project details for editing: ${err.message}. Total Units and a few other fields could not be restored — please re-enter them before saving.`
            : 'Could not load full project details for editing. Total Units and a few other fields could not be restored — please re-enter them before saving.',
        );
      })
      .finally(() => setEditDataLoaded(true));
  }

  function toggleStatus(s: ProjectStatus) {
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function toggleCategory(c: ProjectCategory) {
    setCategoryFilter((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  const hasFilters = statusFilter.length || categoryFilter.length || featuredOnly || search;
  const activeFilterCount = statusFilter.length + categoryFilter.length + (featuredOnly ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex w-8 items-center mb-2">
            <span className="h-1.5 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
            <span className="h-1.5 w-px bg-[#C9A227]/80" />
          </div>
          <h1 className="font-serif text-2xl text-white">Projects</h1>
          <p className="mt-0.5 text-[12.5px] text-white/35">
            {loading ? 'Loading…' : `${filtered.length} of ${projects.length} projects`}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative w-full sm:w-56">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              type="search"
              placeholder="Name, slug, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-[#1A1812] py-2.5 pl-9 pr-4 text-[13px] text-white placeholder-white/25 outline-none focus:border-[#C9A227]/40 focus:ring-1 focus:ring-[#C9A227]/15 transition-all [color-scheme:dark] [&::-webkit-search-cancel-button]:hidden"
            />
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFiltersOpen((v) => !v)}
            aria-expanded={mobileFiltersOpen}
            className="md:hidden flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-white/20 transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m9 12h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75M3.75 12H18m-9.75 0a1.5 1.5 0 003 0m-3 0a1.5 1.5 0 013 0m9.75 0h-3.75" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#C9A227]/80 px-1 text-[10px] font-medium text-[#14130F]">
                {activeFilterCount}
              </span>
            )}
            <svg className={`h-3.5 w-3.5 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Add */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#C9A227]/80 hover:bg-[#C9A227] px-4 py-2.5 text-[13px] text-[#14130F] font-medium transition-all"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Project
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`flex-col gap-3 rounded-2xl border border-white/6 bg-white/2 p-4 md:flex ${mobileFiltersOpen ? 'flex' : 'hidden'}`}>
        <div>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em] text-white/25">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <FilterPill key={s} label={s} active={statusFilter.includes(s)} onClick={() => toggleStatus(s)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em] text-white/25">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((c) => (
              <FilterPill key={c} label={CATEGORY_LABELS[c]} active={categoryFilter.includes(c)} onClick={() => toggleCategory(c)} />
            ))}
            <FilterPill label="Featured only" active={featuredOnly} onClick={() => setFeaturedOnly((v) => !v)} />
          </div>
        </div>
        {hasFilters ? (
          <button
            onClick={() => { setStatusFilter([]); setCategoryFilter([]); setFeaturedOnly(false); setSearch(''); }}
            className="self-start text-[11px] text-white/30 hover:text-white/60 underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        ) : null}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
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
          : filtered.length === 0
            ? (
              <div className="rounded-2xl border border-white/6 bg-white/3 px-5 py-16 text-center">
                <p className="text-[14px] text-white/30 mb-3">
                  {projects.length === 0 ? 'No projects yet.' : 'No projects match your filters.'}
                </p>
                {projects.length === 0 ? (
                  <button
                    onClick={openCreate}
                    className="text-[12px] text-[#C9A227]/60 hover:text-[#C9A227] underline underline-offset-2 transition-colors"
                  >
                    Add your first project
                  </button>
                ) : (
                  <button
                    onClick={() => { setStatusFilter([]); setCategoryFilter([]); setFeaturedOnly(false); setSearch(''); }}
                    className="text-[12px] text-[#C9A227]/60 hover:text-[#C9A227] underline underline-offset-2 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )
            : filtered.map((p) => (
              <ProjectMobileCard
                key={p.id}
                project={p}
                onEdit={() => openEdit(p)}
                onDelete={() => setDeleteTarget(p)}
              />
            ))
        }
      </div>

      {/* Table (desktop / tablet) */}
      <div className="hidden md:block rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-white/6">
                {['Project', 'Status', 'Category', 'Price Range', 'City', 'Featured', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] uppercase tracking-[0.18em] font-normal text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/4">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-white/6" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-20 text-center">
                        <p className="text-[14px] text-white/30 mb-3">
                          {projects.length === 0 ? 'No projects yet.' : 'No projects match your filters.'}
                        </p>
                        {projects.length === 0 ? (
                          <button
                            onClick={openCreate}
                            className="text-[12px] text-[#C9A227]/60 hover:text-[#C9A227] underline underline-offset-2 transition-colors"
                          >
                            Add your first project
                          </button>
                        ) : (
                          <button
                            onClick={() => { setStatusFilter([]); setCategoryFilter([]); setFeaturedOnly(false); setSearch(''); }}
                            className="text-[12px] text-[#C9A227]/60 hover:text-[#C9A227] underline underline-offset-2 transition-colors"
                          >
                            Clear filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                  : filtered.map((p) => (
                    <ProjectRow
                      key={p.id}
                      project={p}
                      onEdit={() => openEdit(p)}
                      onDelete={() => setDeleteTarget(p)}
                      onToggleFeatured={() => handleToggleFeatured(p)}
                      togglingFeatured={togglingId === p.id}
                    />
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <ProjectFormModal
          key={modalMode === 'edit' && editingProject ? `${editingProject.id}:${editDataLoaded}` : 'create'}
          mode={modalMode}
          projectId={editingProject ? editingProject.id : null}
          initialData={modalMode === 'edit' ? (editingFormData ?? EMPTY_FORM) : EMPTY_FORM}
          initialAmenityIds={modalMode === 'edit' ? (editingAmenityIds ?? []) : []}
          onSave={handleSave}
          onClose={() => {
            setModalMode(null);
            setEditingProject(null);
            setEditingFormData(null);
            setEditingAmenityIds([]);
            setEditDataLoaded(false);
          }}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}