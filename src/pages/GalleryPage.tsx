import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ProjectGallery } from '../features/projects/components/ProjectGallery';
import { getGalleryMedia } from '../services/projectService';
import type { GalleryMedia } from '../services/projectService';
import type { ProjectMedia } from '../types/project';
import { Seo } from '../components/Seo';

// ---------------------------------------------------------------------------
// SEO constants
// ---------------------------------------------------------------------------

const PAGE_TITLE = 'The Gallery | Autor Builders';
const PAGE_DESCRIPTION =
  'A curated visual archive of Autor Builders residences — exteriors, interiors, amenities, and aerial views across every project, from foundation to skyline.';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_SOFT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const heroContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.0, ease: EASE_LUXURY } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.85, ease: EASE_SOFT } },
};

const ruleExpand: Variants = {
  hidden: { scaleX: 0, opacity: 0, originX: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 1.3, ease: EASE_LUXURY } },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, delay: i * 0.07, ease: EASE_LUXURY },
  }),
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

const overlayReveal: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_LUXURY } },
};

const lightboxBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: EASE_SOFT } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: EASE_SOFT } },
};

const lightboxContent: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: EASE_LUXURY } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.3, ease: EASE_SOFT } },
};

// ---------------------------------------------------------------------------
// Tag constants — mirrors ProjectGallery's TAG_LABELS
// ---------------------------------------------------------------------------

type MediaTag = ProjectMedia['tag'];
type FilterTag = MediaTag | 'all';

const CATEGORY_META: Record<FilterTag, { label: string; count?: number }> = {
  all:          { label: 'All Works' },
  exterior:     { label: 'Exterior' },
  interior:     { label: 'Interior' },
  amenity:      { label: 'Amenities' },
  aerial:       { label: 'Aerial' },
  construction: { label: 'Construction' },
};

const ORDERED_TAGS: FilterTag[] = ['all', 'exterior', 'interior', 'amenity', 'aerial', 'construction'];

// ---------------------------------------------------------------------------
// RichMedia — same shape as GalleryMedia from projectService
// ---------------------------------------------------------------------------

type RichMedia = GalleryMedia;

// ---------------------------------------------------------------------------
// Sub-component: Category filter pill
// ---------------------------------------------------------------------------

interface FilterPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, count, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`relative group text-[10px] sm:text-[11px] uppercase tracking-[0.16em] px-4 py-2 border transition-all duration-350 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9A227] whitespace-nowrap ${
        active
          ? 'bg-[#C9A227] text-[#0D0C09] border-[#C9A227]'
          : 'text-[#F8F6F1]/50 border-[#F8F6F1]/12 hover:border-[#C9A227]/45 hover:text-[#F8F6F1]/80 bg-transparent'
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-2 text-[9px] tabular-nums tracking-wide ${
            active ? 'text-[#0D0C09]/60' : 'text-[#F8F6F1]/25 group-hover:text-[#F8F6F1]/40'
          }`}
        >
          {count.toString().padStart(2, '0')}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Mosaic image tile
// ---------------------------------------------------------------------------

interface MosaicTileProps {
  media: RichMedia;
  index: number;
  span?: 'normal' | 'wide' | 'tall';
  onSelect: (media: RichMedia) => void;
}

function MosaicTile({ media, index, span = 'normal', onSelect }: MosaicTileProps) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const spanClass =
    span === 'wide'
      ? 'col-span-1 sm:col-span-2 row-span-1'
      : span === 'tall'
      ? 'col-span-1 row-span-1 sm:row-span-2'
      : 'col-span-1 row-span-1';

  return (
    <motion.div
      custom={index}
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={`${spanClass} relative h-full overflow-hidden group cursor-pointer`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(media)}
    >
      <div className="relative w-full h-full bg-[#1A1815] overflow-hidden">
        {/* Shimmer */}
        {!loaded && (
          <div className="absolute inset-0 bg-[#1F1D18] animate-pulse" />
        )}

        {/* Image */}
        <motion.img
          src={media.thumbnailUrl || media.url}
          alt={media.alt}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.85, ease: EASE_LUXURY }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0C09]/80 via-[#0D0C09]/15 to-transparent" />

        {/* Video badge */}
        {media.type === 'video' && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 rounded-full bg-[#C9A227]/90 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#0D0C09] ml-0.5" fill="currentColor" viewBox="0 0 8 10" aria-hidden="true">
              <path d="M0 0l8 5-8 5V0z" />
            </svg>
          </div>
        )}

        {/* Category tag */}
        <motion.div
          variants={overlayReveal}
          initial="hidden"
          animate={hovered ? 'visible' : 'hidden'}
          className="absolute top-3 left-3 sm:top-4 sm:left-4"
        >
          <span className="inline-block text-[9px] uppercase tracking-[0.14em] bg-[#0D0C09]/75 backdrop-blur-sm text-[#C9A227] px-2 py-0.5 border border-[#C9A227]/30">
            {CATEGORY_META[media.tag]?.label ?? media.tag}
          </span>
        </motion.div>

        {/* Hover info */}
        <motion.div
          variants={overlayReveal}
          initial="hidden"
          animate={hovered ? 'visible' : 'hidden'}
          className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8"
        >
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#C9A227]/80 mb-1 truncate">
            {media.projectName}
          </p>
          <p className="text-xs text-[#F8F6F1]/65 leading-snug line-clamp-2">
            {media.alt}
          </p>
        </motion.div>

        {/* Expand icon */}
        <motion.div
          variants={overlayReveal}
          initial="hidden"
          animate={hovered ? 'visible' : 'hidden'}
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
        >
          {media.type === 'image' && (
            <div className="w-7 h-7 rounded-full bg-[#0D0C09]/60 backdrop-blur-sm border border-[#F8F6F1]/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-[#F8F6F1]/80" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Empty state
// ---------------------------------------------------------------------------

function EmptyState({ category }: { category: FilterTag }) {
  const label = CATEGORY_META[category]?.label ?? category;
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="col-span-full flex flex-col items-center justify-center py-28 border border-[#F8F6F1]/6"
    >
      <div className="w-10 h-px bg-[#C9A227]/35 mb-7" />
      <svg
        className="w-9 h-9 text-[#F8F6F1]/12 mb-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.8}
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <rect x="6" y="10" width="36" height="28" rx="1" />
        <circle cx="18" cy="21" r="4" />
        <path d="M6 32l10-9 8 8 6-6 12 9" />
      </svg>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#F8F6F1]/25 font-sans">
        No {label} images yet
      </p>
      <p className="text-[10px] text-[#F8F6F1]/15 mt-2 tracking-wide">
        Photography is being curated for this collection.
      </p>
      <div className="w-10 h-px bg-[#C9A227]/35 mt-7" />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Loading skeleton for mosaic grid
// ---------------------------------------------------------------------------

function MosaicSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[4/3] bg-[#1F1D18] animate-pulse"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Project gallery accordion section
// ---------------------------------------------------------------------------

interface ProjectSectionProps {
  projectSlug: string;
  projectName: string;
  mediaCount: number;
  allMedia: RichMedia[];   // ← receives the full fetched list, no mock fallback
  activeTag: FilterTag;
  index: number;
}

function ProjectSection({ projectSlug, projectName, mediaCount, allMedia, activeTag, index }: ProjectSectionProps) {
  const [expanded, setExpanded] = useState(false);

  const media = useMemo<ProjectMedia[]>(() => {
    const scoped = allMedia.filter((m) => m.projectSlug === projectSlug);
    if (activeTag === 'all') return scoped;
    return scoped.filter((m) => m.tag === activeTag);
  }, [allMedia, projectSlug, activeTag]);

  if (media.length === 0) return null;

  return (
    <motion.div
      custom={index}
      variants={cardReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="border-t border-[#F8F6F1]/8 first:border-t-0"
    >
      {/* Accordion header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between py-6 sm:py-7 text-left group focus-visible:outline-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#C9A227]/60 tabular-nums w-6 text-right">
            {(index + 1).toString().padStart(2, '0')}
          </span>
          <div className="h-px w-6 bg-[#C9A227]/30 group-hover:bg-[#C9A227]/60 transition-colors duration-300" />
          <span className="font-serif text-lg sm:text-xl text-[#F8F6F1] group-hover:text-[#C9A227] transition-colors duration-300 leading-tight">
            {projectName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-[#F8F6F1]/30 tracking-widest tabular-nums">
            {mediaCount.toString().padStart(2, '0')} images
          </span>
          <motion.div
            animate={{ rotate: expanded ? 45 : 0 }}
            transition={{ duration: 0.3, ease: EASE_LUXURY }}
            className="w-6 h-6 flex items-center justify-center border border-[#F8F6F1]/15 group-hover:border-[#C9A227]/50 transition-colors duration-300"
          >
            <svg className="w-3 h-3 text-[#F8F6F1]/50 group-hover:text-[#C9A227] transition-colors duration-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* Expanded gallery */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { height: { duration: 0.55, ease: EASE_LUXURY }, opacity: { duration: 0.4, delay: 0.1 } } }}
            exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.4, ease: EASE_SOFT }, opacity: { duration: 0.2 } } }}
            className="overflow-hidden"
          >
            <div className="pb-10">
              <ProjectGallery media={media} projectName={projectName} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Lightbox — enlarged view for a clicked mosaic tile
// ---------------------------------------------------------------------------

interface GalleryLightboxProps {
  media: RichMedia;
  hasMultiple: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function GalleryLightbox({ media, hasMultiple, onClose, onPrev, onNext }: GalleryLightboxProps) {
  // Keyboard controls — Escape closes, arrows navigate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) onPrev();
      if (e.key === 'ArrowRight' && hasMultiple) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext, hasMultiple]);

  // Lock background scroll while open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const categoryLabel = CATEGORY_META[media.tag]?.label ?? media.tag;

  return (
    <motion.div
      variants={lightboxBackdrop}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[9999] bg-[#0D0C09]/95 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={media.alt || `${media.projectName} gallery image`}
    >
      {/* Content */}
      <motion.div
        variants={lightboxContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl mx-4 sm:mx-6 lg:mx-8 flex flex-col items-center"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 sm:-top-12 text-[#F8F6F1]/60 hover:text-[#F8F6F1] transition-colors duration-200 focus-visible:outline-none"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Media */}
        <div className="relative w-full flex items-center justify-center">
          {media.type === 'video' ? (
            <video
              key={media.id}
              src={media.url}
              poster={media.thumbnailUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[78vh] max-w-full object-contain"
            />
          ) : (
            <img
              key={media.id}
              src={media.url}
              alt={media.alt}
              className="max-h-[78vh] max-w-full object-contain"
            />
          )}

          {/* Category tag */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 pointer-events-none">
            <span className="inline-block text-[10px] uppercase tracking-[0.14em] bg-[#1C1A15]/80 backdrop-blur-sm text-[#C9A227] px-2 py-0.5 border border-[#C9A227]/25">
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* Caption — project name + alt text, shown subtly */}
        {(media.projectName || media.alt) && (
          <div className="flex items-center justify-between gap-4 mt-3 sm:mt-4 px-1 w-full">
            <div className="flex flex-col gap-0.5 min-w-0">
              {media.projectName && (
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#C9A227]/80 truncate">
                  {media.projectName}
                </span>
              )}
              {media.alt && (
                <p className="text-xs sm:text-sm text-[#F8F6F1]/55 tracking-wide truncate">
                  {media.alt}
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Prev / Next arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1C1A15]/70 border border-[#F8F6F1]/15 hover:border-[#C9A227]/60 flex items-center justify-center text-[#F8F6F1]/70 hover:text-[#C9A227] transition-all duration-200 focus-visible:outline-none"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1C1A15]/70 border border-[#F8F6F1]/15 hover:border-[#C9A227]/60 flex items-center justify-center text-[#F8F6F1]/70 hover:text-[#C9A227] transition-all duration-200 focus-visible:outline-none"
            aria-label="Next image"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type ViewMode = 'mosaic' | 'project';

export default function GalleryPage() {
  const [allMedia, setAllMedia]   = useState<RichMedia[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTag, setActiveTag] = useState<FilterTag>('all');
  const [viewMode, setViewMode]   = useState<ViewMode>('mosaic');
  const [selectedMedia, setSelectedMedia] = useState<RichMedia | null>(null);
  const filterBarRef              = useRef<HTMLDivElement>(null);
  const filterSentinelRef         = useRef<HTMLDivElement>(null);

  // ── Gallery-only navbar/filter-bar scroll choreography ──
  // Default site nav is `fixed` (always on screen, see Navbar.tsx). On this
  // page only, once the user scrolls past the filter bar's natural resting
  // position, we hide the fixed navbar (via an inline style applied directly
  // to its <header> element, not by editing Navbar.tsx) and let the filter
  // bar become the lone sticky element pinned at the very top. Scrolling
  // back up before that point restores the navbar. Everything is undone on
  // unmount, so no other page is ever affected.
  useEffect(() => {
    const headerEl = document.querySelector('header') as HTMLElement | null;
    const sentinelEl = filterSentinelRef.current;
    if (!headerEl || !sentinelEl) return;

    let hidden = false;

    const setHidden = (next: boolean) => {
      if (next === hidden) return;
      hidden = next;
      headerEl.style.transform = next ? 'translateY(-100%)' : '';
      headerEl.style.pointerEvents = next ? 'none' : '';
    };

    const evaluate = () => {
      // Sentinel sits in normal flow directly above the filter bar, so its
      // document offset is stable regardless of the filter bar's own sticky
      // engagement state.
      const triggerTop = sentinelEl.getBoundingClientRect().top + window.scrollY;
      setHidden(window.scrollY >= triggerTop);
    };

    evaluate();
    window.addEventListener('scroll', evaluate, { passive: true });
    window.addEventListener('resize', evaluate);

    const raf1 = requestAnimationFrame(() => {
      evaluate();
      requestAnimationFrame(evaluate);
    });

    return () => {
      window.removeEventListener('scroll', evaluate);
      window.removeEventListener('resize', evaluate);
      cancelAnimationFrame(raf1);
      // Restore the navbar unconditionally when leaving the Gallery page.
      headerEl.style.transform = '';
      headerEl.style.pointerEvents = '';
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getGalleryMedia()
      .then((data) => { if (!cancelled) setAllMedia(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Derive tag counts from live data
  const tagCounts = useMemo(() => {
    const counts: Partial<Record<FilterTag, number>> = { all: allMedia.length };
    for (const m of allMedia) {
      counts[m.tag] = (counts[m.tag] ?? 0) + 1;
    }
    return counts;
  }, [allMedia]);

  // Filtered flat media for mosaic view
  const filteredMedia = useMemo<RichMedia[]>(() => {
    if (activeTag === 'all') return allMedia;
    return allMedia.filter((m) => m.tag === activeTag);
  }, [allMedia, activeTag]);

  // Projects that have media in current filter
  const activeProjects = useMemo(() => {
    const slugsSeen = new Set<string>();
    const result: Array<{ slug: string; name: string; count: number }> = [];
    for (const m of filteredMedia) {
      if (!slugsSeen.has(m.projectSlug)) {
        slugsSeen.add(m.projectSlug);
        const count = filteredMedia.filter((x) => x.projectSlug === m.projectSlug).length;
        result.push({ slug: m.projectSlug, name: m.projectName, count });
      }
    }
    return result;
  }, [filteredMedia]);

  // Unique project count across ALL media (for hero stats)
  const totalProjects = useMemo(() => {
    return new Set(allMedia.map((m) => m.projectSlug)).size;
  }, [allMedia]);

  const handleTagChange = useCallback((tag: FilterTag) => {
    setActiveTag(tag);
  }, []);

  const handleSelect = useCallback((media: RichMedia) => {
    setSelectedMedia(media);
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedMedia(null);
  }, []);

  const selectedIndex = selectedMedia
    ? filteredMedia.findIndex((m) => m.id === selectedMedia.id)
    : -1;

  const goToPrevMedia = useCallback(() => {
    if (selectedIndex === -1 || filteredMedia.length === 0) return;
    const nextIndex = (selectedIndex - 1 + filteredMedia.length) % filteredMedia.length;
    setSelectedMedia(filteredMedia[nextIndex]);
  }, [selectedIndex, filteredMedia]);

  const goToNextMedia = useCallback(() => {
    if (selectedIndex === -1 || filteredMedia.length === 0) return;
    const nextIndex = (selectedIndex + 1) % filteredMedia.length;
    setSelectedMedia(filteredMedia[nextIndex]);
  }, [selectedIndex, filteredMedia]);

  return (
    <div className="min-h-screen bg-[#0D0C09]">
      <Seo title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/gallery" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-18 sm:pt-36 sm:pb-22 lg:pt-44 lg:pb-28 bg-[#0D0C09]">

        {/* Background texture — subtle diagonal rule */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(135deg, #C9A227 0px, #C9A227 1px, transparent 1px, transparent 64px)',
          }}
        />

        {/* Gold accent bar top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Eyebrow */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-[#C9A227]" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#C9A227] font-sans">
                Autor Builders · Visual Archive
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[#F8F6F1] leading-[0.92] tracking-[-0.02em] mb-6"
            >
              The{' '}
              <em className="not-italic text-[#C9A227]">Gallery</em>
            </motion.h1>

            {/* Divider */}
            <motion.div variants={ruleExpand} className="h-px bg-[#C9A227]/25 mb-6 origin-left" />

            {/* Descriptor */}
            <motion.p
              variants={fadeUp}
              className="max-w-xl text-sm sm:text-base text-[#F8F6F1]/45 leading-relaxed tracking-wide font-sans"
            >
              A curated visual record of craftsmanship, space, and light — across every
              Autor Builders residence, from foundation to skyline.
            </motion.p>

            {/* Stats row */}
            <motion.div variants={fadeIn} className="flex items-center gap-8 mt-8">
              {[
                { value: totalProjects,                            label: 'Projects' },
                { value: allMedia.length,                          label: 'Images' },
                { value: Object.keys(CATEGORY_META).length - 1,   label: 'Categories' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="font-serif text-2xl sm:text-3xl text-[#C9A227] leading-none tabular-nums">
                    {value.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#F8F6F1]/30 mt-1.5">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sentinel — sits directly above the filter bar in normal flow (never
          sticky), used purely to detect the scroll position at which the
          filter bar reaches the top of the viewport. */}
      <div ref={filterSentinelRef} />

      {/* ── Sticky filter bar ── alone at the top of the viewport once the
          navbar (Gallery page only) has scrolled out of the way. z-40 keeps
          it below the navbar/mobile-menu while either is visible, and above
          gallery content. */}
      <div
        ref={filterBarRef}
        className="sticky top-0 z-40 bg-[#0D0C09]/90 backdrop-blur-md border-b border-[#F8F6F1]/6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">

            {/* Category filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
              {ORDERED_TAGS.map((tag) => {
                const count = tagCounts[tag] ?? 0;
                if (tag !== 'all' && count === 0) return null;
                return (
                  <FilterPill
                    key={tag}
                    label={CATEGORY_META[tag].label}
                    count={count}
                    active={activeTag === tag}
                    onClick={() => handleTagChange(tag)}
                  />
                );
              })}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 border border-[#F8F6F1]/10 p-0.5 flex-shrink-0">
              <button
                onClick={() => setViewMode('mosaic')}
                aria-label="Mosaic view"
                className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 focus-visible:outline-none ${
                  viewMode === 'mosaic' ? 'bg-[#C9A227] text-[#0D0C09]' : 'text-[#F8F6F1]/40 hover:text-[#F8F6F1]/70'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="1" y="1" width="6" height="6" rx="0.5" />
                  <rect x="9" y="1" width="6" height="6" rx="0.5" />
                  <rect x="1" y="9" width="6" height="6" rx="0.5" />
                  <rect x="9" y="9" width="6" height="6" rx="0.5" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('project')}
                aria-label="Project view"
                className={`w-7 h-7 flex items-center justify-center transition-colors duration-200 focus-visible:outline-none ${
                  viewMode === 'project' ? 'bg-[#C9A227] text-[#0D0C09]' : 'text-[#F8F6F1]/40 hover:text-[#F8F6F1]/70'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 16 16" aria-hidden="true">
                  <path strokeLinecap="round" d="M2 4h12M2 8h12M2 12h12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">

        {loading ? (
          <MosaicSkeleton />
        ) : (
          <AnimatePresence mode="wait">

            {/* ── MOSAIC VIEW ── */}
            {viewMode === 'mosaic' && (
              <motion.div
                key="mosaic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.4 } }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
              >
                {filteredMedia.length === 0 ? (
                  <div className="grid grid-cols-1">
                    <EmptyState category={activeTag} />
                  </div>
                ) : (
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 sm:[grid-auto-flow:dense] auto-rows-[280px] sm:auto-rows-[265px] lg:auto-rows-[298px]"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredMedia.map((media, index) => (
                        <MosaicTile
                          key={`${media.id}-${activeTag}`}
                          media={media}
                          index={index}
                          span="normal"
                          onSelect={handleSelect}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Mosaic count footer */}
                {filteredMedia.length > 0 && (
                  <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="mt-12 sm:mt-16 flex items-center gap-4"
                  >
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C9A227]/20 to-transparent" />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#F8F6F1]/20 tabular-nums">
                      {filteredMedia.length.toString().padStart(2, '0')} images · {activeProjects.length} {activeProjects.length === 1 ? 'project' : 'projects'}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C9A227]/20 to-transparent" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── PROJECT VIEW ── */}
            {viewMode === 'project' && (
              <motion.div
                key="project"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.4 } }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
              >
                {/* Section label */}
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-3 mb-8 sm:mb-10"
                >
                  <div className="h-px w-8 bg-[#C9A227]/50" />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#F8F6F1]/30">
                    {activeProjects.length} {activeProjects.length === 1 ? 'project' : 'projects'} · {CATEGORY_META[activeTag].label}
                  </span>
                </motion.div>

                {activeProjects.length === 0 ? (
                  <div className="grid grid-cols-1">
                    <EmptyState category={activeTag} />
                  </div>
                ) : (
                  <div className="divide-y divide-[#F8F6F1]/6">
                    {activeProjects.map(({ slug, name, count }, index) => (
                      <ProjectSection
                        key={slug}
                        projectSlug={slug}
                        projectName={name}
                        mediaCount={count}
                        allMedia={allMedia}
                        activeTag={activeTag}
                        index={index}
                      />
                    ))}
                  </div>
                )}

                {/* Bottom accent */}
                <div className="mt-14 h-px bg-gradient-to-r from-transparent via-[#C9A227]/18 to-transparent" />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* ── Footer note ── */}
      <footer className="border-t border-[#F8F6F1]/6 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#F8F6F1]/18">
            © {new Date().getFullYear()} Autor Builders · All images are proprietary.
          </span>
          <div className="flex items-center gap-2">
            <div className="h-px w-5 bg-[#C9A227]/30" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#C9A227]/40">
              Excellence in Living
            </span>
            <div className="h-px w-5 bg-[#C9A227]/30" />
          </div>
        </div>
      </footer>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {selectedMedia && (
          <GalleryLightbox
            media={selectedMedia}
            hasMultiple={filteredMedia.length > 1}
            onClose={closeLightbox}
            onPrev={goToPrevMedia}
            onNext={goToNextMedia}
          />
        )}
      </AnimatePresence>

    </div>
  );
}