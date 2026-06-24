// =============================================================================
// Autor Builders Admin — Media Page
// src/admin/pages/AdminMediaPage.tsx
// =============================================================================
// Media library grid (6B) + upload (6C) + management actions (6D).
// Fetches every project's media via mediaService and displays it as a single
// responsive grid with client-side search/filter/sort, plus edit & delete.
// =============================================================================

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  getMediaByProject,
  uploadImage,
  deleteImage,
  updateMedia,
} from '../../services/mediaService';
import { getProjects } from '../../services/projectService';
import type { ProjectMedia, ProjectCard } from '../../types/project';
import type { DbMediaTag, DbMediaType, DbProjectMediaUpdate } from '../../types/database.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaGridItem extends ProjectMedia {
  projectId: string;
  projectName: string;
}

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
}

interface ToastState {
  message: string;
  kind: 'success' | 'error';
}

type SortOption = 'newest' | 'oldest' | 'sort_order';

// ---------------------------------------------------------------------------
// Category (tag) options
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: { value: DbMediaTag; label: string }[] = [
  { value: 'exterior',     label: 'Exterior' },
  { value: 'interior',     label: 'Interior' },
  { value: 'amenity',      label: 'Amenities' },
  { value: 'aerial',       label: 'Aerial' },
  { value: 'construction', label: 'Construction' },
];

const TYPE_OPTIONS: { value: DbMediaType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'oldest',     label: 'Oldest first' },
  { value: 'sort_order', label: 'Sort order (ascending)' },
];

const TAG_COLORS: Record<string, string> = {
  exterior:     'bg-blue-500/15 text-blue-400 border-blue-500/20',
  interior:     'bg-purple-500/15 text-purple-400 border-purple-500/20',
  amenity:      'bg-green-500/15 text-green-400 border-green-500/20',
  aerial:       'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  construction: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

function tagClass(tag: string): string {
  return TAG_COLORS[tag] ?? 'bg-white/8 text-white/40 border-white/12';
}

function tagLabel(tag: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === tag)?.label ?? tag.replace(/_/g, ' ');
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Shared form primitives (matches AdminProjectsPage styling)
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13.5px] text-white ' +
  'placeholder-white/25 outline-none transition-all duration-200 ' +
  'focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/15 hover:border-white/18';

const selectClass =
  'w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13.5px] text-white ' +
  'outline-none transition-all duration-200 focus:border-[#C9A227]/50 focus:ring-1 focus:ring-[#C9A227]/15 cursor-pointer';

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
      {children}
      {required && <span className="ml-0.5 text-[#C9A227]">*</span>}
    </label>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label required={required}>{label}</Label>
      {children}
      {error && <span className="text-[11px] text-red-400/80">{error}</span>}
    </div>
  );
}

function ChevronDown() {
  return (
    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">▾</span>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.1em] transition-all duration-150',
        active
          ? 'border-[#C9A227]/40 bg-[#C9A227]/12 text-[#C9A227]'
          : 'border-white/85 bg-transparent text-white/70 hover:border-white/45 hover:text-white',
      ].join(' ')}
    >
      {label}
    </button>
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
    <div className={[
      'fixed bottom-6 right-6 left-6 sm:left-auto z-[300] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-sm',
      kind === 'success'
        ? 'border-green-500/20 bg-[#0F1A10]/90 text-green-400'
        : 'border-red-500/20 bg-[#1A0F0F]/90 text-red-400',
    ].join(' ')}>
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
      <button onClick={onDismiss} className="ml-auto opacity-50 hover:opacity-100 transition-opacity shrink-0">
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
  item,
  onConfirm,
  onCancel,
  loading,
}: {
  item: MediaGridItem;
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
            <h3 className="text-[15px] font-light text-white">Delete media?</h3>
            <p className="mt-1 text-[12.5px] text-white/40">
              <span className="text-white/70">{item.alt || 'This image'}</span> will be permanently removed from {item.projectName} and from storage.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-red-500 transition-all disabled:opacity-60"
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
// Edit metadata modal
// ---------------------------------------------------------------------------

function EditModal({
  item,
  onSave,
  onClose,
}: {
  item: MediaGridItem;
  onSave: (payload: DbProjectMediaUpdate) => Promise<void>;
  onClose: () => void;
}) {
  const [alt, setAlt] = useState(item.alt);
  const [tag, setTag] = useState<DbMediaTag>(item.tag as DbMediaTag);
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!alt.trim()) { setError('Alt text is required.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSave({
        alt: alt.trim(),
        tag,
        sort_order: Number(sortOrder) || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="fixed inset-x-0 bottom-0 z-[110] flex max-h-[92vh] flex-col rounded-t-2xl border-t border-white/8 bg-[#14130F] shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-md sm:rounded-t-none sm:border-l sm:border-t-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-5 shrink-0">
          <div>
            <div className="flex w-8 items-center mb-1.5">
              <span className="h-1.5 w-px bg-[#C9A227]/80" />
              <span className="h-px flex-1 bg-[#C9A227]/80" />
              <span className="h-1.5 w-px bg-[#C9A227]/80" />
            </div>
            <h2 className="font-serif text-[17px] text-white">Edit Media</h2>
          </div>
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-5">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[12.5px] text-red-400">
                {error}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-white/6 bg-white/4 aspect-[4/3]">
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.alt}
                className="h-full w-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
              />
            </div>

            <p className="text-[11px] text-white/30">{item.projectName}</p>

            <Field label="Alt Text" required>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </Field>

            <Field label="Category" required>
              <div className="relative">
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as DbMediaTag)}
                  disabled={saving}
                  className={selectClass}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value} className="bg-[#1C1A14]/50">{c.label}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </Field>

            <Field label="Sort Order">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/6 px-6 py-4 shrink-0">
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-[13px] font-medium text-[#14130F] hover:bg-[#D4AE30] transition-all disabled:opacity-60"
          >
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#14130F]/20 border-t-[#14130F]" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Media grid card
// ---------------------------------------------------------------------------

function MediaGridCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MediaGridItem;
  onEdit: (item: MediaGridItem) => void;
  onDelete: (item: MediaGridItem) => void;
}) {
  return (
    <div className="group rounded-2xl border border-white/6 bg-white/3 overflow-hidden hover:border-white/12 transition-all duration-200">
      <div className="relative aspect-[4/3] overflow-hidden bg-white/4">
        <img
          src={item.thumbnailUrl || item.url}
          alt={item.alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
        />
        <div className="absolute top-2.5 right-2.5">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] uppercase tracking-[0.08em] backdrop-blur-sm ${tagClass(item.tag)}`}>
            {tagLabel(item.tag)}
          </span>
        </div>
        {item.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        )}

        {/* Action overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-2.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={() => onEdit(item)}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white/70 backdrop-blur-sm hover:text-white hover:border-white/30 transition-all"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item)}
            title="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white/70 backdrop-blur-sm hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
      <div className="px-3.5 py-3">
        <p className="truncate text-[12.5px] text-white/75" title={item.alt}>
          {item.alt || 'Untitled'}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-white/30" title={item.projectName}>
          {item.projectName}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function MediaGridSkeleton() {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-white/6" />
      <div className="px-3.5 py-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/8" />
        <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-white/6" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload status row (inside upload modal)
// ---------------------------------------------------------------------------

function UploadStatusRow({ item }: { item: UploadQueueItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] text-white/75">{item.file.name}</p>
        {item.status === 'error' && (
          <p className="truncate text-[11px] text-red-400/80">{item.error}</p>
        )}
      </div>
      <div className="shrink-0">
        {item.status === 'pending' && (
          <span className="text-[10.5px] uppercase tracking-[0.1em] text-white/25">Waiting</span>
        )}
        {item.status === 'uploading' && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/15 border-t-[#C9A227] block" />
        )}
        {item.status === 'done' && (
          <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {item.status === 'error' && (
          <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload modal
// ---------------------------------------------------------------------------

interface UploadModalProps {
  projects: ProjectCard[];
  onClose: () => void;
  onComplete: (result: { succeeded: number; failed: number }) => void;
}

function UploadModal({ projects, onClose, onComplete }: UploadModalProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [tag, setTag]             = useState<DbMediaTag>('exterior');
  const [alt, setAlt]             = useState('');
  const [queue, setQueue]         = useState<UploadQueueItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFiles = queue.map((q) => q.file);

  const handleFilesPicked = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items: UploadQueueItem[] = Array.from(files).map((file) => ({
      id: makeId(),
      file,
      status: 'pending',
    }));
    setQueue((prev) => [...prev, ...items]);
    setFormError('');
  };

  const removeQueued = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpload = async () => {
    if (!projectId) { setFormError('Select a project.'); return; }
    if (selectedFiles.length === 0) { setFormError('Choose at least one image.'); return; }
    if (!alt.trim()) { setFormError('Alt text is required.'); return; }
    setFormError('');
    setSubmitting(true);

    let succeeded = 0;
    let failed = 0;

    for (const item of queue) {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q)));
      try {
        await uploadImage(item.file, {
          projectId,
          alt: alt.trim(),
          tag,
          type: 'image',
          sortOrder: 0,
        });
        succeeded += 1;
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'done' } : q)));
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : 'Upload failed.';
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: message } : q)));
      }
    }

    setSubmitting(false);
    onComplete({ succeeded, failed });
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => !submitting && onClose()} />
      <div className="fixed inset-x-0 bottom-0 z-[110] flex max-h-[92vh] flex-col rounded-t-2xl border-t border-white/8 bg-[#14130F] shadow-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-lg sm:rounded-t-none sm:border-l sm:border-t-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-5 shrink-0">
          <div>
            <div className="flex w-8 items-center mb-1.5">
              <span className="h-1.5 w-px bg-[#C9A227]/80" />
              <span className="h-px flex-1 bg-[#C9A227]/80" />
              <span className="h-1.5 w-px bg-[#C9A227]/80" />
            </div>
            <h2 className="font-serif text-[17px] text-white">Upload Media</h2>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all disabled:opacity-30"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-5">
            {formError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[12.5px] text-red-400">
                {formError}
              </div>
            )}

            <Field label="Project" required>
              <div className="relative">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={submitting}
                  className={selectClass}
                >
                  {projects.length === 0 && <option value="">No projects available</option>}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1C1A14]/50">{p.name}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </Field>

            <Field label="Category" required>
              <div className="relative">
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as DbMediaTag)}
                  disabled={submitting}
                  className={selectClass}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value} className="bg-[#1C1A14]/50">{c.label}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
            </Field>

            <Field label="Alt Text" required>
              <input
                type="text"
                placeholder="Describe the image for accessibility & SEO"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
              {queue.length > 1 && (
                <p className="text-[11px] text-white/25">Applied to all {queue.length} images in this batch.</p>
              )}
            </Field>

            <Field label="Images" required>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/3 px-4 py-8 text-center transition-all hover:border-[#C9A227]/40 hover:bg-white/5 disabled:opacity-50"
              >
                <svg className="h-6 w-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span className="text-[12.5px] text-white/50">
                  Tap to choose image{queue.length === 0 ? '(s)' : 's'}
                </span>
                <span className="text-[10.5px] text-white/25">Single or multiple files supported</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => { handleFilesPicked(e.target.files); e.target.value = ''; }}
                className="hidden"
              />
            </Field>

            {queue.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
                    {queue.length} file{queue.length === 1 ? '' : 's'} selected
                  </p>
                  {!submitting && (
                    <button
                      onClick={() => setQueue([])}
                      className="text-[11px] text-white/30 hover:text-white/60 underline underline-offset-2 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {queue.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <UploadStatusRow item={item} />
                      </div>
                      {!submitting && item.status === 'pending' && (
                        <button
                          onClick={() => removeQueued(item.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 text-white/30 hover:text-white hover:border-white/20 transition-all"
                          title="Remove"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {submitting && (
                  <p className="text-[11px] text-white/30">
                    Uploading {queue.filter((q) => q.status === 'done' || q.status === 'error').length} of {queue.length}…
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-white/6 px-6 py-4 shrink-0">
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-[13px] text-white/60 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={submitting || projects.length === 0}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-[13px] font-medium text-[#14130F] hover:bg-[#D4AE30] transition-all disabled:opacity-60"
          >
            {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#14130F]/20 border-t-[#14130F]" />}
            {submitting ? 'Uploading…' : `Upload ${queue.length > 1 ? `${queue.length} Images` : 'Image'}`}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type ModalState =
  | { type: 'none' }
  | { type: 'upload' }
  | { type: 'edit'; item: MediaGridItem }
  | { type: 'delete'; item: MediaGridItem };

export default function AdminMediaPage() {
  const [media,    setMedia]    = useState<MediaGridItem[]>([]);
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [modal,    setModal]    = useState<ModalState>({ type: 'none' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Search / filter / sort state
  const [search,         setSearch]         = useState('');
  const [projectFilter,  setProjectFilter]  = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<DbMediaTag[]>([]);
  const [typeFilter,     setTypeFilter]     = useState<DbMediaType[]>([]);
  const [sortBy,         setSortBy]         = useState<SortOption>('newest');

  // ── Fetch ──────────────────────────────────────────────────────────────

  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const projectList: ProjectCard[] = await getProjects();
      setProjects(projectList);

      const results = await Promise.allSettled(
        projectList.map(async (project) => {
          const items = await getMediaByProject(project.id);
          return items.map<MediaGridItem>((item) => ({
            ...item,
            projectId: project.id,
            projectName: project.name,
          }));
        }),
      );

      const all: MediaGridItem[] = [];
      let failedCount = 0;
      for (const result of results) {
        if (result.status === 'fulfilled') {
          all.push(...result.value);
        } else {
          failedCount += 1;
        }
      }

      setMedia(all);

      if (failedCount > 0 && all.length === 0) {
        setError('Failed to load media.');
      } else if (failedCount > 0) {
        setError(`Some media could not be loaded (${failedCount} project${failedCount === 1 ? '' : 's'} affected).`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  // Distinct media types actually present in the data (drives the type filter)
  const availableTypes = useMemo(() => {
    const set = new Set<DbMediaType>();
    media.forEach((m) => set.add(m.type));
    return TYPE_OPTIONS.filter((t) => set.has(t.value));
  }, [media]);

  // ── Filter + search + sort (client-side) ──────────────────────────────

  const visibleMedia = useMemo(() => {
    let result = [...media];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) => m.alt.toLowerCase().includes(q) || m.projectName.toLowerCase().includes(q),
      );
    }
    if (projectFilter.length) {
      result = result.filter((m) => projectFilter.includes(m.projectId));
    }
    if (categoryFilter.length) {
      result = result.filter((m) => categoryFilter.includes(m.tag as DbMediaTag));
    }
    if (typeFilter.length) {
      result = result.filter((m) => typeFilter.includes(m.type as DbMediaType));
    }

    result.sort((a, b) => {
      if (sortBy === 'sort_order') return a.sortOrder - b.sortOrder;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [media, search, projectFilter, categoryFilter, typeFilter, sortBy]);

  const hasFilters = !!(search || projectFilter.length || categoryFilter.length || typeFilter.length);

  function toggleProjectFilter(id: string) {
    setProjectFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleCategoryFilter(c: DbMediaTag) {
    setCategoryFilter((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }
  function toggleTypeFilter(t: DbMediaType) {
    setTypeFilter((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  function clearFilters() {
    setSearch('');
    setProjectFilter([]);
    setCategoryFilter([]);
    setTypeFilter([]);
  }

  // ── Upload ─────────────────────────────────────────────────────────────

  const handleUploadComplete = async ({ succeeded, failed }: { succeeded: number; failed: number }) => {
    if (succeeded > 0) {
      await loadMedia();
    }

    if (succeeded > 0 && failed === 0) {
      setToast({
        message: `${succeeded} image${succeeded === 1 ? '' : 's'} uploaded successfully.`,
        kind: 'success',
      });
      setModal({ type: 'none' });
    } else if (succeeded > 0 && failed > 0) {
      setToast({
        message: `${succeeded} uploaded, ${failed} failed. Check the file list and retry.`,
        kind: 'error',
      });
    } else {
      setToast({ message: 'Upload failed. Please try again.', kind: 'error' });
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────

  const handleEditSave = async (payload: DbProjectMediaUpdate) => {
    if (modal.type !== 'edit') return;
    await updateMedia(modal.item.id, payload);
    await loadMedia();
    setModal({ type: 'none' });
    setToast({ message: 'Media updated successfully.', kind: 'success' });
  };

  // ── Delete ─────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (modal.type !== 'delete') return;
    setDeleteLoading(true);
    try {
      await deleteImage(modal.item.id);
      await loadMedia();
      setModal({ type: 'none' });
      setToast({ message: 'Media deleted.', kind: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Delete failed.', kind: 'error' });
      setModal({ type: 'none' });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

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
          <h1 className="font-serif text-2xl text-white">Media</h1>
          <p className="mt-0.5 text-[12.5px] text-white/35">
            {loading ? 'Loading…' : `${visibleMedia.length} of ${media.length} items`}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'upload' })}
          disabled={loading || projects.length === 0}
          className="flex items-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-[13px] font-medium text-[#14130F] hover:bg-[#D4AE30] transition-colors disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload Media
        </button>
      </div>

      {/* Search + Filters + Sort */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/2 p-4">
        {/* Search */}
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/25" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <input
            type="search"
            placeholder="Search by alt text or project…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/8 bg-white/4 py-2.5 pl-9 pr-4 text-[13px] text-black placeholder-white/25 outline-none focus:border-[#C9A227]/40 focus:ring-1 focus:ring-[#C9A227]/15 transition-all"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-3 flex-wrap text-white">
          <p className="text-[9.5px] uppercase tracking-[0.2em]  shrink-0">Sort</p>
          <div className="relative w-full max-w-[220px] text-white">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none rounded-lg border border-white/8 bg-white/4 py-1.5 pl-3 pr-7 text-[12px] text-black/90 outline-none focus:border-[#C9A227]/40 cursor-pointer"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value} className="bg-[#ffffff]">{s.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">▾</span>
          </div>
        </div>

        {/* Project filter */}
        <div>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em] ">Project</p>
          <div className="flex flex-wrap gap-1.5">
            {projects.map((p) => (
              <FilterPill key={p.id} label={p.name} active={projectFilter.includes(p.id)} onClick={() => toggleProjectFilter(p.id)} />
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em]">Category</p>
          <div className="flex flex-wrap gap-1.5 text-white">
            {CATEGORY_OPTIONS.map((c) => (
              <FilterPill key={c.value} label={c.label} active={categoryFilter.includes(c.value)} onClick={() => toggleCategoryFilter(c.value)} />
            ))}
          </div>
        </div>

        {/* Type filter — only shown if more than one media type exists */}
        {availableTypes.length > 1 && (
          <div>
            <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em] text-white/25">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {availableTypes.map((t) => (
                <FilterPill key={t.value} label={t.label} active={typeFilter.includes(t.value)} onClick={() => toggleTypeFilter(t.value)} />
              ))}
            </div>
          </div>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="self-start text-[11px] text-white/30 hover:text-white/60 underline underline-offset-2 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Grid / states */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <MediaGridSkeleton key={i} />
          ))}
        </div>
      ) : visibleMedia.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/4">
            <svg className="h-5 w-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18-3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="text-[14px] text-white/30">{hasFilters ? 'No media matches your filters' : 'No media uploaded yet'}</p>
          {hasFilters ? (
            <button
              onClick={clearFilters}
              className="text-[12px] text-[#C9A227]/60 hover:text-[#C9A227] underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          ) : (
            <p className="text-[12px] text-white/20">Upload images using the button above.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleMedia.map((item) => (
            <MediaGridCard
              key={item.id}
              item={item}
              onEdit={(m) => setModal({ type: 'edit', item: m })}
              onDelete={(m) => setModal({ type: 'delete', item: m })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal.type === 'upload' && (
        <UploadModal
          projects={projects}
          onClose={() => setModal({ type: 'none' })}
          onComplete={handleUploadComplete}
        />
      )}

      {modal.type === 'edit' && (
        <EditModal
          item={modal.item}
          onSave={handleEditSave}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {modal.type === 'delete' && (
        <DeleteDialog
          item={modal.item}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setModal({ type: 'none' })}
          loading={deleteLoading}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}