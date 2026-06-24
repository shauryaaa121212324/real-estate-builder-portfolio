// =============================================================================
// Autor Builders Admin — Leads CMS
// src/admin/pages/LeadsPage.tsx
// =============================================================================
// Full lead list: search, filters, status update, delete, detail drawer.
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { getLeads, updateLead } from '../../services/leadService';
import { supabase } from '../../lib/supabase';
import type { Lead, LeadStatus, LeadPriority, LeadSource } from '../../types/lead';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const STATUS_OPTIONS: LeadStatus[] = [
  'new', 'contacted', 'qualified', 'site_visit_scheduled',
  'negotiation', 'converted', 'lost', 'unqualified',
];

const PRIORITY_OPTIONS: LeadPriority[] = ['high', 'medium', 'low'];

const SOURCE_OPTIONS: LeadSource[] = [
  'website_inquiry', 'consultation_request', 'brochure_request',
  'site_visit_request', 'referral', 'walk_in', 'call',
];

const STATUS_COLORS: Record<string, string> = {
  new:                  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  contacted:            'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  qualified:            'bg-green-500/15 text-green-400 border-green-500/20',
  site_visit_scheduled: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  negotiation:          'bg-orange-500/15 text-orange-400 border-orange-500/20',
  converted:            'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  lost:                 'bg-red-500/15 text-red-400 border-red-500/20',
  unqualified:          'bg-white/8 text-white/35 border-white/10',
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-500/12 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20',
  low:    'bg-white/6 text-white/40 border-white/10',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.1em] ${colorClass}`}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

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
// Delete confirm modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  lead,
  onConfirm,
  onCancel,
  loading,
}: {
  lead: Lead;
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
        <h3 className="font-serif text-[16px] text-white mb-1">Delete Lead</h3>
        <p className="text-[13px] text-white/50 mb-6">
          Permanently delete the lead from{' '}
          <span className="text-white/80">{lead.firstName} {lead.lastName}</span>?
          This action cannot be undone.
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
// Status update dropdown (inline in table row)
// ---------------------------------------------------------------------------

function StatusDropdown({
  lead,
  onUpdate,
}: {
  lead: Lead;
  onUpdate: (newStatus: LeadStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function select(s: LeadStatus) {
    if (s === lead.status) { setOpen(false); return; }
    setUpdating(true);
    setOpen(false);
    try {
      await onUpdate(s);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        disabled={updating}
        className="flex items-center gap-1.5 transition-opacity disabled:opacity-40"
      >
        {updating
          ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-[#C9A227] animate-spin" />
          : (
            <Badge
              text={lead.status}
              colorClass={STATUS_COLORS[lead.status] ?? STATUS_COLORS.new}
            />
          )
        }
        <svg className="h-3 w-3 text-white/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-1.5 w-52 rounded-xl border border-white/8 bg-[#1C1A14] py-1.5 shadow-2xl">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); select(s); }}
                className={[
                  'flex w-full items-center gap-2.5 px-3.5 py-2 text-[12px] transition-colors',
                  s === lead.status
                    ? 'text-[#C9A227] bg-[#C9A227]/6'
                    : 'text-white/55 hover:text-white hover:bg-white/4',
                ].join(' ')}
              >
                <span className={`h-1.5 w-1.5 rounded-full border ${STATUS_COLORS[s] ?? ''}`} />
                {s.replace(/_/g, ' ')}
                {s === lead.status && (
                  <svg className="ml-auto h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lead detail drawer
// ---------------------------------------------------------------------------

function LeadDrawer({
  lead,
  onClose,
  onStatusChange,
  onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (newStatus: LeadStatus) => Promise<void>;
  onDelete: () => void;
}) {
  const [statusUpdating, setStatusUpdating] = useState(false);

  async function handleStatusChange(s: LeadStatus) {
    setStatusUpdating(true);
    try { await onStatusChange(s); }
    finally { setStatusUpdating(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-[#14130F] border-l border-white/8 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#14130F] border-b border-white/6 px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-lg text-white">{lead.firstName} {lead.lastName}</p>
            <p className="text-[12px] text-white/40 mt-0.5">{lead.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 transition-all"
              title="Delete lead"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-all"
              aria-label="Close"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-6 flex flex-col gap-6">
          {/* Status update */}
          <div className="rounded-xl border border-white/6 bg-white/2 p-4">
            <p className="mb-2.5 text-[10px] uppercase tracking-[0.2em] text-white/25">Update Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={statusUpdating}
                  className={[
                    'rounded-full border px-2.5 py-1 text-[10.5px] uppercase tracking-[0.08em] transition-all disabled:opacity-40',
                    s === lead.status
                      ? STATUS_COLORS[s]
                      : 'border-white/8 bg-white/3 text-white/35 hover:border-white/15 hover:text-white/60',
                  ].join(' ')}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge text={lead.status} colorClass={STATUS_COLORS[lead.status] ?? STATUS_COLORS.new} />
            <Badge text={lead.priority} colorClass={PRIORITY_COLORS[lead.priority] ?? PRIORITY_COLORS.medium} />
            <Badge text={lead.source} colorClass="bg-white/6 text-white/40 border-white/10" />
          </div>

          {/* Contact */}
          <DrawerSection title="Contact">
            <DrawerRow label="Phone" value={lead.phone} />
            <DrawerRow label="Email" value={lead.email} />
            <DrawerRow label="Received" value={formatDate(lead.createdAt)} />
            {lead.lastContactedAt && (
              <DrawerRow label="Last Contact" value={formatDate(lead.lastContactedAt)} />
            )}
          </DrawerSection>

          {/* Interest */}
          <DrawerSection title="Interest">
            <DrawerRow label="Budget" value={lead.budgetRange?.replace(/_/g, ' ') ?? '—'} />
            <DrawerRow label="Timeline" value={lead.purchaseTimeline?.replace(/_/g, ' ') ?? '—'} />
            <DrawerRow label="Unit Pref" value={lead.unitConfigPreference ?? '—'} />
          </DrawerSection>

          {/* Activity */}
          {lead.activity.length > 0 && (
            <DrawerSection title="Activity">
              <div className="flex flex-col gap-3">
                {[...lead.activity].reverse().map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A227]/60" />
                    <div>
                      <p className="text-[12.5px] text-white/60">{a.description}</p>
                      <p className="text-[10.5px] text-white/25">{formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* Notes */}
          {lead.notes.length > 0 && (
            <DrawerSection title="Notes">
              <div className="flex flex-col gap-3">
                {lead.notes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-white/6 bg-white/3 px-4 py-3">
                    <p className="text-[12.5px] text-white/60">{n.content}</p>
                    <p className="mt-1 text-[10.5px] text-white/25">{n.createdBy} · {formatDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}
        </div>
      </aside>
    </>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/25">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[12px] text-white/35 shrink-0">{label}</span>
      <span className="text-[12.5px] text-white/70 text-right">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority[]>([]);
  const [sourceFilter, setSourceFilter] = useState<LeadSource[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getLeads(
        {
          status: statusFilter.length ? statusFilter : undefined,
          priority: priorityFilter.length ? priorityFilter : undefined,
          source: sourceFilter.length ? sourceFilter : undefined,
          search: search || undefined,
        },
        page,
        PAGE_SIZE,
      );
      setLeads(result.data);
      setTotal(result.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, priorityFilter, sourceFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, sourceFilter]);

  // ── Status update ──────────────────────────────────────────────────────
  async function handleStatusChange(lead: Lead, newStatus: LeadStatus) {
    try {
      const updated = await updateLead(lead.id, { status: newStatus } as any);
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
      if (selectedLead?.id === lead.id) setSelectedLead(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: dbErr } = await supabase.from('leads').delete().eq('id', deleteTarget.id);
      if (dbErr) throw dbErr;
      setDeleteTarget(null);
      if (selectedLead?.id === deleteTarget.id) setSelectedLead(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // ── Filters ─────────────────────────────────────────────────────────────
  function toggleStatus(s: LeadStatus) {
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }
  function togglePriority(p: LeadPriority) {
    setPriorityFilter((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }
  function toggleSource(src: LeadSource) {
    setSourceFilter((prev) => prev.includes(src) ? prev.filter((x) => x !== src) : [...prev, src]);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = statusFilter.length || priorityFilter.length || sourceFilter.length || search;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex w-8 items-center mb-2">
            <span className="h-1.5 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
            <span className="h-1.5 w-px bg-[#C9A227]/80" />
          </div>
          <h1 className="font-serif text-2xl text-white">Leads</h1>
          <p className="mt-0.5 text-[12.5px] text-white/35">
            {loading ? 'Loading…' : `${total.toLocaleString()} total enquiries`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <input
            type="search"
            placeholder="Name, email, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
            onBlur={() => setSearch(searchInput)}
            className="w-full rounded-xl border border-white/8 bg-[#1A1812] py-2.5 pl-9 pr-4 text-[13px] text-white placeholder-white/25 outline-none focus:border-[#C9A227]/40 focus:ring-1 focus:ring-[#C9A227]/15 transition-all [color-scheme:dark] [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/2 p-4">
        <div>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em] text-white/25">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <FilterPill key={s} label={s} active={statusFilter.includes(s)} onClick={() => toggleStatus(s)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em] text-white/25">Priority</p>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITY_OPTIONS.map((p) => (
              <FilterPill key={p} label={p} active={priorityFilter.includes(p)} onClick={() => togglePriority(p)} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[9.5px] uppercase tracking-[0.2em] text-white/25">Source</p>
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_OPTIONS.map((s) => (
              <FilterPill key={s} label={s} active={sourceFilter.includes(s)} onClick={() => toggleSource(s)} />
            ))}
          </div>
        </div>
        {hasFilters ? (
          <button
            onClick={() => {
              setStatusFilter([]); setPriorityFilter([]); setSourceFilter([]);
              setSearch(''); setSearchInput('');
            }}
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

      {/* Table */}
      <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-white/6">
                {['Name', 'Contact', 'Source', 'Status', 'Priority', 'Date', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3.5 text-[10px] uppercase tracking-[0.18em] font-normal text-white/30">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 animate-pulse rounded bg-white/6" style={{ width: `${60 + Math.random() * 30}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
                : leads.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center text-[13px] text-white/25">
                        No leads match your filters.
                      </td>
                    </tr>
                  )
                  : leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer hover:bg-white/3 transition-colors duration-150 group"
                    >
                      <td className="px-5 py-3.5" onClick={() => setSelectedLead(lead)}>
                        <p className="text-[13px] text-white/80">{lead.firstName} {lead.lastName}</p>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => setSelectedLead(lead)}>
                        <p className="text-[12px] text-white/50">{lead.email}</p>
                        <p className="text-[11.5px] text-white/30">{lead.phone}</p>
                      </td>
                      <td className="px-5 py-3.5" onClick={() => setSelectedLead(lead)}>
                        <span className="text-[12px] text-white/40">{lead.source.replace(/_/g, ' ')}</span>
                      </td>
                      {/* Status — inline dropdown */}
                      <td className="px-5 py-3.5">
                        <StatusDropdown
                          lead={lead}
                          onUpdate={(s) => handleStatusChange(lead, s)}
                        />
                      </td>
                      <td className="px-5 py-3.5" onClick={() => setSelectedLead(lead)}>
                        <Badge text={lead.priority} colorClass={PRIORITY_COLORS[lead.priority] ?? PRIORITY_COLORS.medium} />
                      </td>
                      <td className="px-5 py-3.5" onClick={() => setSelectedLead(lead)}>
                        <span className="text-[12px] text-white/35">{formatDate(lead.createdAt)}</span>
                      </td>
                      {/* Delete action */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(lead); }}
                          className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/15 text-red-400/50 hover:text-red-400 hover:border-red-500/30 transition-all"
                          title="Delete lead"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/6 px-5 py-4">
            <span className="text-[12px] text-white/30">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/8 px-3.5 py-1.5 text-[12px] text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/8 px-3.5 py-1.5 text-[12px] text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead detail drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={(s) => handleStatusChange(selectedLead, s)}
          onDelete={() => { setDeleteTarget(selectedLead); setSelectedLead(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          lead={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}