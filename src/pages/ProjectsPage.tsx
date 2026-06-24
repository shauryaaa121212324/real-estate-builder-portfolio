import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects } from '../services/projectService';
import { ProjectsFilters, type ActiveFilters } from '../features/projects/components/ProjectsFilters';
import { ProjectCard } from '../components/ProjectCard';
import type { ProjectCard as ProjectCardType, ProjectStatus } from '../types/project';
import { useConsultation } from '../components/ConsultationModal';
import { Seo } from '../components/Seo';

// ---------------------------------------------------------------------------
// SEO constants
// ---------------------------------------------------------------------------

const PAGE_TITLE = 'Our Projects | Arun Builders';
const PAGE_DESCRIPTION =
  'Explore the full Arun Builders portfolio — luxury residences, private villas, and master-planned communities across Hyderabad, from ongoing developments to ready-to-move homes.';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.95, ease: EASE_LUXURY } },
};

const ruleExpand = {
  hidden: { scaleX: 0, opacity: 0, originX: 0 as const },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 1.2, ease: EASE_LUXURY } },
};

const cardItem = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.06, ease: EASE_LUXURY },
  }),
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as [number,number,number,number] },
  },
};

// ---------------------------------------------------------------------------
// Filter logic
// ---------------------------------------------------------------------------

function applyFilters(projects: ProjectCardType[], filters: ActiveFilters): ProjectCardType[] {
  return projects.filter((p) => {
    if (filters.status !== 'all' && p.status !== filters.status) return false;
    if (filters.category !== 'all' && p.category !== filters.category) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[420px] rounded-2xl bg-[#1C1A15]/80" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_LUXURY }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-14 bg-[#C9A227]/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]/40" />
        <span className="h-px w-14 bg-[#C9A227]/25" />
      </div>
      <p className="font-serif text-[1.6rem] text-[#F8F6F1]/45">Unable to load projects</p>
      <p className="mt-3 text-[13px] font-light tracking-wide text-[#F8F6F1]/25">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[#C9A227]/50 px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-[#C9A227]/80 transition-all hover:border-[#C9A227]/80 hover:text-[#C9A227]"
      >
        Try again
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_LUXURY }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="mb-8 flex items-center gap-3">
        <span className="h-px w-14 bg-[#C9A227]/25" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]/40" />
        <span className="h-px w-14 bg-[#C9A227]/25" />
      </div>
      <p className="font-serif text-[1.6rem] text-[#F8F6F1]/45">No projects found</p>
      <p className="mt-3 text-[13px] font-light tracking-wide text-[#F8F6F1]/25">
        Adjust your filters to explore the full portfolio.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-serif text-[2.1rem] leading-none text-[#F8F6F1]/85 sm:text-[2.6rem]">
        {value}
      </span>
      <span className="text-[9.5px] uppercase tracking-[0.28em] text-[#F8F6F1]/28">
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const { open: openConsultation } = useConsultation();
  const [searchParams] = useSearchParams();

  const VALID_STATUSES: ProjectStatus[] = ['upcoming', 'ongoing', 'ready_to_move', 'completed'];

  const statusFromUrl = (): ProjectStatus | 'all' => {
    const raw = searchParams.get('status');
    return raw && (VALID_STATUSES as string[]).includes(raw) ? (raw as ProjectStatus) : 'all';
  };

  const [allProjects, setAllProjects] = useState<ProjectCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    status: statusFromUrl(),
    category: 'all',
  });

  // Keep the filter in sync if the status query param changes after mount
  // (e.g. navigating here again from the footer while already on /projects).
  useEffect(() => {
    setActiveFilters((prev) => ({ ...prev, status: statusFromUrl() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setAllProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(
    () => applyFilters(allProjects, activeFilters),
    [allProjects, activeFilters]
  );

  // Stats (always from allProjects — not affected by filter)
  const deliveredCount = allProjects.filter(
    (p) => p.status === 'completed' || p.status === 'ready_to_move'
  ).length;
  const activeCount = allProjects.filter(
    (p) => p.status === 'ongoing' || p.status === 'upcoming'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      <Seo title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/projects" />

      {/* ══════════════════════════════════════════════════════════
          PAGE HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-20 pt-32 sm:pt-44 bg-[#14130F]">

        {/* Ambient glow — upper right */}
        <div
          className="pointer-events-none absolute -right-64 -top-24 h-[640px] w-[640px] rounded-full opacity-[0.045]"
          style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 68%)' }}
        />

        {/* Ambient glow — lower left */}
        <div
          className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full opacity-[0.022]"
          style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
        />

        {/* Fine grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.016]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #F8F6F1 1px, transparent 1px), linear-gradient(to bottom, #F8F6F1 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <motion.div variants={heroContainer} initial="hidden" animate="visible">

            {/* Eyebrow */}
            <motion.div variants={fadeUp} className="flex items-center gap-4">
              <span className="h-px w-8 bg-[#C9A227]/50" />
              <span className="text-[10px] uppercase tracking-[0.38em] text-[#C9A227]/70">
                Our Portfolio
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="mt-5 font-serif text-[2.8rem] leading-[1.08] text-[#F8F6F1] sm:text-[3.8rem] lg:text-[5rem]"
            >
              Every project,
              <br />
              {/* FIX: was text-[#F8F6F1]/48 (too faint) → now gold to match brand */}
              <em className="not-italic text-[#C9A227]/80">a singular vision.</em>
            </motion.h1>

            {/* Rule + body copy — side by side on md+ */}
            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-14"
            >
              <motion.div
                variants={ruleExpand}
                className="mt-[5px] h-px w-20 shrink-0 bg-[#C9A227]/45"
              />
              <p className="max-w-[42ch] text-[14px] font-light leading-[1.85] text-[#F8F6F1]/90">
                From intimate boutique residences to landmark towers, each Arun Builders
                project is shaped by the same conviction — that architecture should endure,
                and homes should inspire.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              className="mt-16 flex flex-wrap gap-x-10 gap-y-8 text-[#F8F6F1]/100"
            >
              <StatPill value={loading ? '—' : String(allProjects.length)} label="Projects" />
              <StatPill value={loading ? '—' : String(deliveredCount)} label="Delivered" />
              <StatPill value={loading ? '—' : String(activeCount)} label="Ongoing & Upcoming" />
              <StatPill value="20+" label="Years of Craft" />
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THIN ORNAMENTAL DIVIDER
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#14130F]">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
          <div className="flex items-center gap-5">
            <div className="h-px flex-1 bg-[#F8F6F1]/5" />
            <div className="flex gap-2">
              <span className="h-[3px] w-[3px] rotate-45 bg-[#C9A227]/35" />
              <span className="h-[3px] w-[3px] rotate-45 bg-[#C9A227]/20" />
              <span className="h-[3px] w-[3px] rotate-45 bg-[#C9A227]/10" />
            </div>
            <div className="h-px flex-1 bg-[#F8F6F1]/5" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FILTERS
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-[#14130F]">
        <div className="mx-auto max-w-7xl px-6 pb-4 pt-14 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-5%' }}
            transition={{ duration: 0.75, ease: EASE_LUXURY }}
          >
            <ProjectsFilters
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              totalCount={allProjects.length}
              filteredCount={filteredProjects.length}
            />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PROJECT GRID — uniform 2-column, all cards identical size
      ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:px-10 lg:px-16 bg-[#F8F6F1]">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProjects} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  variants={cardItem}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-5%' }}
                  exit="exit"
                  layout
                >
                  <ProjectCard
                    project={project}
                    index={idx}
                    featured={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          TRUST BAND
      ══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 1, ease: EASE_LUXURY }}
        className="border-y border-[#F8F6F1]/5 bg-[#14130F]"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-7 sm:px-10 lg:px-16">
          {[
            'RERA Registered',
            'ISO 9001 Certified',
            'On-Time Delivery Record',
            '500+ Families Housed',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-[#C9A227]/50" />
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#F8F6F1]/100">
                {item}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════════════════ */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 0.95, ease: EASE_LUXURY }}
          className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] px-8 py-14 sm:px-14 sm:py-16">

            {/* Corner glow */}
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.06]"
              style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
            />

            <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">

              {/* Copy block */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-[0.38em] text-[#C9A227]/60">
                  Private Advisory
                </span>
                <h2 className="font-serif text-[1.75rem] leading-[1.2] text-[#F8F6F1]/85 sm:text-[2.2rem]">
                  Can't find the right residence?
                  <br />
                  <span className="text-[#F8F6F1]/42">Speak with our advisory team.</span>
                </h2>
                <p className="max-w-[46ch] text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/32">
                  Our experts can help you find the right home — whether it's an ongoing
                  project, a completed address, or something we haven't yet announced.
                </p>
              </div>

              {/* CTA buttons */}
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center gap-2.5 rounded-full border border-[#C9A227]/100 bg-[#C9A227]/12 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] text-[#C9A227] transition-all duration-300 hover:border-[#C9A227]/80 hover:bg-[#C9A227]/20"
                  onClick={openConsultation}
                >
                  Schedule a Consultation
                </button>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2.5 rounded-full border border-[#F8F6F1]/10 px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] text-[#F8F6F1]/45 transition-all duration-300 hover:border-[#F8F6F1]/30 hover:text-[#F8F6F1]/75"
                >
                  Get in Touch
                </a>
              </div>

            </div>
          </div>
        </motion.div>
      </section>

    </div>
  );
}