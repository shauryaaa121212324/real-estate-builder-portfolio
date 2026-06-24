// =============================================================================
// Autor Builders Admin — Dashboard Page
// src/admin/pages/DashboardPage.tsx
// =============================================================================
// Overview stats: total/featured projects, total leads, recent lead list.
// Data fetched in parallel via existing service layer.
// =============================================================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, getFeaturedProjects } from '../../services/projectService';
import { getLeads } from '../../services/leadService';
import type { Lead } from '../../types/lead';
import type { ProjectCard } from '../../types/project';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  loading: boolean;
}

function StatCard({ label, value, sub, icon, loading }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/35 mb-2">{label}</p>
          {loading ? (
            <div className="h-8 w-16 animate-pulse rounded-lg bg-white/8" />
          ) : (
            <p className="font-serif text-3xl text-white">{value}</p>
          )}
          {sub && !loading && (
            <p className="mt-1 text-[11.5px] text-white/35">{sub}</p>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C9A227]/20 bg-[#C9A227]/8 text-[#C9A227]">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status / priority badges
// ---------------------------------------------------------------------------

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

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${colorClass}`}>
      {text.replace(/_/g, ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Recent leads table
// ---------------------------------------------------------------------------

function LeadsTable({ leads, loading }: { leads: Lead[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-white/4" />
        ))}
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <p className="text-[13px] text-white/30">No leads yet</p>
        <p className="text-[11px] text-white/20">Submissions from your website will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-white/6">
            {['Name', 'Source', 'Status', 'Priority', 'Received'].map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-[10px] uppercase tracking-[0.18em] font-normal text-white/30"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/4">
          {leads.map((lead) => (
            <tr key={lead.id} className="group hover:bg-white/3 transition-colors duration-150">
              <td className="px-5 py-3.5">
                <p className="text-[13px] text-white/80">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="text-[11px] text-white/30">{lead.email}</p>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[12px] text-white/40">
                  {lead.source.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <Badge
                  text={lead.status}
                  colorClass={STATUS_COLORS[lead.status] ?? STATUS_COLORS.new}
                />
              </td>
              <td className="px-5 py-3.5">
                <Badge
                  text={lead.priority}
                  colorClass={PRIORITY_COLORS[lead.priority] ?? PRIORITY_COLORS.medium}
                />
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[12px] text-white/35">
                  {relativeTime(lead.createdAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project quick-list
// ---------------------------------------------------------------------------

function ProjectRow({ project }: { project: ProjectCard }) {
  const STATUS_DOT: Record<string, string> = {
    upcoming:       'bg-blue-400',
    ongoing:        'bg-yellow-400',
    ready_to_move:  'bg-green-400',
    completed:      'bg-white/30',
  };

  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 border-b border-white/4 last:border-0 hover:bg-white/3 transition-colors">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[project.status] ?? 'bg-white/20'}`} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13px] text-white/80">{project.name}</p>
        <p className="text-[11px] text-white/30">{project.location.city}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[11.5px] text-white/40">
          {project.status.replace(/_/g, ' ')}
        </p>
        {project.featured && (
          <p className="text-[10px] text-[#C9A227]/70">Featured</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface DashboardData {
  projects:    ProjectCard[];
  featured:    ProjectCard[];
  totalLeads:  number;
  recentLeads: Lead[];
}

export default function DashboardPage() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [projects, featured, leadsResult] = await Promise.all([
          getProjects(),
          getFeaturedProjects(),
          getLeads(undefined, 1, 10),
        ]);

        if (!cancelled) {
          setData({
            projects,
            featured,
            totalLeads:  leadsResult.count,
            recentLeads: leadsResult.data,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const stats = [
    {
      label:   'Total Projects',
      value:   loading ? '—' : (data?.projects.length ?? 0),
      sub:     loading ? undefined : `${data?.featured.length ?? 0} featured`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
    },
    {
      label:   'Featured Projects',
      value:   loading ? '—' : (data?.featured.length ?? 0),
      sub:     'Shown on homepage',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
    },
    {
      label:   'Total Leads',
      value:   loading ? '—' : (data?.totalLeads ?? 0),
      sub:     'All time enquiries',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      label:   'New Leads',
      value:   loading ? '—' : (data?.recentLeads.filter((l) => l.status === 'new').length ?? 0),
      sub:     'Awaiting contact',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <div className="flex w-8 items-center mb-2">
          <span className="h-1.5 w-px bg-[#C9A227]/80" />
          <span className="h-px flex-1 bg-[#C9A227]/80" />
          <span className="h-1.5 w-px bg-[#C9A227]/80" />
        </div>
        <h1 className="font-serif text-2xl text-white">Dashboard</h1>
        <p className="mt-0.5 text-[12.5px] text-white/35">Overview of your projects and leads.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Bottom section: recent leads + projects */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">

        {/* Recent leads */}
        <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <div>
              <h2 className="text-[13.5px] font-light text-white/80">Recent Leads</h2>
              <p className="text-[11px] text-white/30">Most recent enquiries</p>
            </div>
            <Link
              to="/admin/leads"
              className="text-[11px] uppercase tracking-[0.14em] text-[#C9A227]/70 hover:text-[#C9A227] transition-colors"
            >
              View all →
            </Link>
          </div>
          <LeadsTable leads={data?.recentLeads ?? []} loading={loading} />
        </div>

        {/* Projects quick-list */}
        <div className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <div>
              <h2 className="text-[13.5px] font-light text-white/80">Projects</h2>
              <p className="text-[11px] text-white/30">All listings</p>
            </div>
            <Link
              to="/admin/projects"
              className="text-[11px] uppercase tracking-[0.14em] text-[#C9A227]/70 hover:text-[#C9A227] transition-colors"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-white/4" />
              ))}
            </div>
          ) : (data?.projects ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-[13px] text-white/30">No projects found</p>
            </div>
          ) : (
            <div>
              {(data?.projects ?? []).slice(0, 8).map((p) => (
                <ProjectRow key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}