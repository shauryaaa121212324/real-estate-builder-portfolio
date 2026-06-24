import { motion } from 'framer-motion';
import type { ProjectCategory, ProjectStatus } from '../../../types/project';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActiveFilters {
  status: ProjectStatus | 'all';
  category: ProjectCategory | 'all';
}

interface ProjectsFiltersProps {
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
  totalCount: number;
  filteredCount: number;
}

// ---------------------------------------------------------------------------
// Filter data
// ---------------------------------------------------------------------------

const STATUS_OPTIONS: Array<{ value: ProjectStatus | 'all'; label: string }> = [
  { value: 'all',          label: 'All' },
  { value: 'upcoming',     label: 'Upcoming' },
  { value: 'ongoing',      label: 'Under Construction' },
  { value: 'ready_to_move',label: 'Ready to Move' },
  { value: 'completed',    label: 'Completed' },
];

const CATEGORY_OPTIONS: Array<{ value: ProjectCategory | 'all'; label: string }> = [
  { value: 'all',               label: 'All Types' },
  { value: 'residential',       label: 'Residential' },
  { value: 'villa',             label: 'Villas' },
  { value: 'commercial',        label: 'Commercial' },
  { value: 'plotted_development',label: 'Plotted' },
];

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectsFilters({
  activeFilters,
  onFilterChange,
  totalCount,
  filteredCount,
}: ProjectsFiltersProps) {

  const handleStatus = (value: ProjectStatus | 'all') => {
    onFilterChange({ ...activeFilters, status: value });
  };

  const handleCategory = (value: ProjectCategory | 'all') => {
    onFilterChange({ ...activeFilters, category: value });
  };

  const isFiltered = activeFilters.status !== 'all' || activeFilters.category !== 'all';

  return (
    <div className="w-full">

      {/* ── Top bar ── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

        {/* Count indicator */}
        <motion.p
          key={filteredCount}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_LUXURY }}
          className="text-[11px] uppercase tracking-[0.26em] text-[#F8F6F1]/35"
        >
          Showing{' '}
          <span className="text-[#F8F6F1]/70">{filteredCount}</span>
          {' '}of{' '}
          <span className="text-[#F8F6F1]/70">{totalCount}</span>
          {' '}projects
        </motion.p>

        {/* Clear filters */}
        {isFiltered && (
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.35, ease: EASE_LUXURY }}
            onClick={() => onFilterChange({ status: 'all', category: 'all' })}
            className="group flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-[#C9A227]/60 transition-colors hover:text-[#C9A227]"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className="opacity-60 group-hover:opacity-100"
            >
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Clear filters
          </motion.button>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="my-6 h-px w-full bg-[#F8F6F1]/6" />

      {/* ── Filter rows ── */}
      <div className="flex flex-col gap-5">

        {/* Status row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className="mr-3 w-14 shrink-0 text-[10px] uppercase tracking-[0.2em] text-[#F8F6F1]/25">
            Status
          </span>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <FilterPill
              key={value}
              label={label}
              active={activeFilters.status === value}
              onClick={() => handleStatus(value as ProjectStatus | 'all')}
            />
          ))}
        </div>

        {/* Category row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className="mr-3 w-14 shrink-0 text-[10px] uppercase tracking-[0.2em] text-[#F8F6F1]/25">
            Type
          </span>
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <FilterPill
              key={value}
              label={label}
              active={activeFilters.category === value}
              onClick={() => handleCategory(value as ProjectCategory | 'all')}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterPill
// ---------------------------------------------------------------------------

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={[
        'relative rounded-full border px-4 py-1.5',
        'text-[10.5px] uppercase tracking-[0.18em]',
        'transition-all duration-300',
        active
          ? 'border-[#C9A227]/60 bg-[#C9A227]/12 text-[#C9A227]'
          : 'border-[#F8F6F1]/10 bg-transparent text-[#F8F6F1]/40 hover:border-[#F8F6F1]/25 hover:text-[#F8F6F1]/65',
      ].join(' ')}
    >
      {active && (
        <motion.span
          layoutId="pill-active-bg"
          className="absolute inset-0 rounded-full bg-[#C9A227]/8"
          transition={{ duration: 0.3, ease: EASE_LUXURY }}
        />
      )}
      <span className="relative">{label}</span>
    </motion.button>
  );
}

export default ProjectsFilters;