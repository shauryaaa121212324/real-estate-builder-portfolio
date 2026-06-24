import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { ProjectMedia } from '../../../types/project';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_SOFT: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const sectionVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE_SOFT } },
};

const scaleRevealDown: Variants = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1.1, ease: EASE_LUXURY } },
};

const featuredTransition = {
  initial: { opacity: 0, scale: 1.03 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.75, ease: EASE_LUXURY } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: EASE_SOFT } },
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
// Tag label map
// ---------------------------------------------------------------------------

const TAG_LABELS: Record<ProjectMedia['tag'], string> = {
  exterior: 'Exterior',
  interior: 'Interior',
  amenity: 'Amenities',
  aerial: 'Aerial',
  construction: 'Construction',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProjectGalleryProps {
  media: ProjectMedia[];
  projectName: string;
}

// ---------------------------------------------------------------------------
// Sub-component: Loading shimmer
// ---------------------------------------------------------------------------

function GalleryShimmer() {
  return (
    <div className="w-full aspect-[16/9] bg-[#1C1A15] animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F8F6F1]/[0.04] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Video player thumbnail
// ---------------------------------------------------------------------------

interface VideoThumbProps {
  media: ProjectMedia;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

function VideoThumb({ media, isActive, onClick, index }: VideoThumbProps) {
  return (
    <motion.button
      key={media.id}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.06, duration: 0.5, ease: EASE_LUXURY } }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 md:w-28 md:h-[4.5rem] overflow-hidden focus-visible:outline-none group ${
        isActive
          ? 'ring-2 ring-[#C9A227] ring-offset-1 ring-offset-[#1C1A15]'
          : 'ring-1 ring-[#F8F6F1]/10 hover:ring-[#C9A227]/50'
      }`}
      aria-label={`View ${media.alt}`}
      aria-current={isActive ? 'true' : undefined}
    >
      {/* Thumbnail background */}
      <div className="absolute inset-0 bg-[#1C1A15]" />
      {media.thumbnailUrl && (
        <img
          src={media.thumbnailUrl}
          alt={media.alt}
          className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-400"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      {/* Play icon overlay for video */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-[#C9A227]/80 flex items-center justify-center">
          <svg className="w-3 h-3 text-[#1C1A15] ml-0.5" fill="currentColor" viewBox="0 0 8 10" aria-hidden="true">
            <path d="M0 0l8 5-8 5V0z" />
          </svg>
        </div>
      </div>
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="thumb-active-video"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A227]"
          transition={{ duration: 0.3, ease: EASE_LUXURY }}
        />
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Image thumbnail
// ---------------------------------------------------------------------------

interface ImageThumbProps {
  media: ProjectMedia;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

function ImageThumb({ media, isActive, onClick, index }: ImageThumbProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.06, duration: 0.5, ease: EASE_LUXURY } }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 md:w-28 md:h-[4.5rem] overflow-hidden focus-visible:outline-none group ${
        isActive
          ? 'ring-2 ring-[#C9A227] ring-offset-1 ring-offset-[#1C1A15]'
          : 'ring-1 ring-[#F8F6F1]/10 hover:ring-[#C9A227]/50'
      }`}
      aria-label={`View ${media.alt}`}
      aria-current={isActive ? 'true' : undefined}
    >
      {/* Loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 bg-[#2A2820] animate-pulse" />
      )}
      <img
        src={media.thumbnailUrl || media.url}
        alt={media.alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
        }}
        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${isActive ? 'brightness-110' : 'brightness-75 group-hover:brightness-100'}`}
      />
      {/* Active bottom bar */}
      {isActive && (
        <motion.div
          layoutId="thumb-active-image"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A227]"
          transition={{ duration: 0.3, ease: EASE_LUXURY }}
        />
      )}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Featured image display
// ---------------------------------------------------------------------------

interface FeaturedImageProps {
  media: ProjectMedia;
  onExpand: () => void;
}

function FeaturedImage({ media, onExpand }: FeaturedImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full group cursor-zoom-in" onClick={onExpand}>
      {/* Loading state */}
      {!loaded && <GalleryShimmer />}

      <AnimatePresence mode="wait">
        <motion.div
          key={media.id}
          {...featuredTransition}
          className="absolute inset-0"
        >
          <img
            src={media.url}
            alt={media.alt}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              setLoaded(true);
              (e.currentTarget as HTMLImageElement).style.opacity = '0.4';
            }}
            className={`w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0C09]/60 via-transparent to-transparent pointer-events-none" />

      {/* Tag badge */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-5 pointer-events-none">
        <span className="inline-block text-[10px] uppercase tracking-[0.14em] bg-[#1C1A15]/70 backdrop-blur-sm text-[#C9A227] px-2.5 py-1 border border-[#C9A227]/30">
          {TAG_LABELS[media.tag]}
        </span>
      </div>

      {/* Expand icon */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-[#1C1A15]/60 backdrop-blur-sm border border-[#F8F6F1]/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-[#F8F6F1]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>

      {/* Caption */}
      {media.alt && (
        <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 pointer-events-none">
          <p className="text-[11px] sm:text-xs text-[#F8F6F1]/70 tracking-wide line-clamp-1">
            {media.alt}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Featured video display
// ---------------------------------------------------------------------------

interface FeaturedVideoProps {
  media: ProjectMedia;
}

function FeaturedVideo({ media }: FeaturedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <div className="relative w-full h-full group">
      {isLoading && <GalleryShimmer />}

      <AnimatePresence mode="wait">
        <motion.div
          key={media.id}
          {...featuredTransition}
          className="absolute inset-0"
        >
          <video
            ref={videoRef}
            src={media.url}
            poster={media.thumbnailUrl}
            onCanPlay={() => setIsLoading(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-cover"
            playsInline
            preload="metadata"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0C09]/70 via-transparent to-transparent pointer-events-none" />

      {/* Tag badge */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-5 pointer-events-none">
        <span className="inline-block text-[10px] uppercase tracking-[0.14em] bg-[#1C1A15]/70 backdrop-blur-sm text-[#C9A227] px-2.5 py-1 border border-[#C9A227]/30">
          Video · {TAG_LABELS[media.tag]}
        </span>
      </div>

      {/* Play / pause button */}
      <button
        onClick={togglePlay}
        className="absolute inset-0 flex items-center justify-center focus-visible:outline-none"
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
      >
        <motion.div
          initial={false}
          animate={{ opacity: isPlaying ? 0 : 1, scale: isPlaying ? 0.8 : 1 }}
          transition={{ duration: 0.3, ease: EASE_SOFT }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1C1A15]/60 backdrop-blur-sm border border-[#C9A227]/50 flex items-center justify-center group-hover:border-[#C9A227] transition-colors duration-300"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A227] ml-0.5" fill="currentColor" viewBox="0 0 12 14" aria-hidden="true">
            <path d="M0 0l12 7L0 14V0z" />
          </svg>
        </motion.div>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Lightbox
// ---------------------------------------------------------------------------

interface LightboxProps {
  media: ProjectMedia[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function Lightbox({ media, activeIndex, onClose, onNavigate }: LightboxProps) {
  const current = media[activeIndex];

  const handlePrev = useCallback(() => {
    onNavigate((activeIndex - 1 + media.length) % media.length);
  }, [activeIndex, media.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate((activeIndex + 1) % media.length);
  }, [activeIndex, media.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, handlePrev, handleNext]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!current) return null;

  return (
    <motion.div
      variants={lightboxBackdrop}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[9999] bg-[#0D0C09]/95 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      {/* Content */}
      <motion.div
        variants={lightboxContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl mx-4 sm:mx-6 lg:mx-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 sm:-top-12 text-[#F8F6F1]/60 hover:text-[#F8F6F1] transition-colors duration-200 focus-visible:outline-none"
          aria-label="Close lightbox"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Main media */}
        <div className="w-full aspect-[16/9] sm:aspect-[16/9] bg-[#1C1A15] overflow-hidden relative">
          <AnimatePresence mode="wait">
            {current.type === 'image' ? (
              <motion.img
                key={current.id}
                src={current.url}
                alt={current.alt}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.45, ease: EASE_LUXURY } }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                className="w-full h-full object-contain"
              />
            ) : (
              <motion.video
                key={current.id}
                src={current.url}
                poster={current.thumbnailUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.45, ease: EASE_LUXURY } }}
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
              />
            )}
          </AnimatePresence>

          {/* Tag */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 pointer-events-none">
            <span className="inline-block text-[10px] uppercase tracking-[0.14em] bg-[#1C1A15]/80 backdrop-blur-sm text-[#C9A227] px-2 py-0.5 border border-[#C9A227]/25">
              {TAG_LABELS[current.tag]}
            </span>
          </div>
        </div>

        {/* Caption & counter */}
        <div className="flex items-center justify-between mt-3 sm:mt-4 px-1">
          <p className="text-xs sm:text-sm text-[#F8F6F1]/55 tracking-wide max-w-xl">
            {current.alt}
          </p>
          <span className="text-xs text-[#F8F6F1]/35 tracking-widest flex-shrink-0 ml-4">
            {activeIndex + 1} / {media.length}
          </span>
        </div>
      </motion.div>

      {/* Prev / Next arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1C1A15]/70 border border-[#F8F6F1]/15 hover:border-[#C9A227]/60 flex items-center justify-center text-[#F8F6F1]/70 hover:text-[#C9A227] transition-all duration-200 focus-visible:outline-none"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
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
// Main component: ProjectGallery
// ---------------------------------------------------------------------------

export function ProjectGallery({ media, projectName }: ProjectGalleryProps) {
  const sortedMedia = [...media].sort((a, b) => a.sortOrder - b.sortOrder);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTag, setActiveTag] = useState<ProjectMedia['tag'] | 'all'>('all');

  const thumbsRef = useRef<HTMLDivElement>(null);

  // Derive unique tags present in media
  const availableTags = Array.from(new Set(sortedMedia.map((m) => m.tag)));

  // Filtered media based on tag
  const filteredMedia = activeTag === 'all'
    ? sortedMedia
    : sortedMedia.filter((m) => m.tag === activeTag);

  const currentMedia = filteredMedia[activeIndex] ?? filteredMedia[0];

  // When tag changes, reset active index
  const handleTagChange = useCallback((tag: ProjectMedia['tag'] | 'all') => {
    setActiveTag(tag);
    setActiveIndex(0);
  }, []);

  // Navigate with keyboard on thumbnail strip
  const handleThumbKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveIndex(index);
    }
  }, []);

  // Scroll active thumb into view
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const activeThumb = container.children[activeIndex] as HTMLElement | undefined;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeIndex]);

  // Lightbox open handler
  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  // Empty state
  if (sortedMedia.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-[#F8F6F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center py-20 border border-[#1B1B1B]/10"
          >
            {/* Ornamental mark */}
            <div className="w-12 h-px bg-[#C9A227]/40 mb-6" />
            <svg
              className="w-10 h-10 text-[#1B1B1B]/20 mb-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <rect x="6" y="10" width="36" height="28" rx="1" />
              <circle cx="18" cy="21" r="4" />
              <path d="M6 32l10-9 8 8 6-6 12 9" />
            </svg>
            <p className="text-sm uppercase tracking-[0.16em] text-[#1B1B1B]/35 font-sans">
              Gallery images coming soon
            </p>
            <p className="text-xs text-[#1B1B1B]/25 mt-2 tracking-wide">
              Photography for {projectName} is being curated.
            </p>
            <div className="w-12 h-px bg-[#C9A227]/40 mt-6" />
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <>
      <motion.section
        id="gallery"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="py-16 sm:py-20 lg:py-24 bg-[#1C1A15]"
        aria-label={`${projectName} gallery`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Section heading ── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              {/* Eyebrow */}
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-[#C9A227]" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#C9A227] font-sans">
                  Gallery
                </span>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="font-serif text-2xl sm:text-3xl text-[#F8F6F1] leading-snug"
              >
                Visual{' '}
                <em className="italic text-[#C9A227] not-italic font-normal">Journey</em>
              </motion.h2>
            </div>

            {/* Media counter */}
            <motion.p variants={fadeIn} className="text-xs text-[#F8F6F1]/30 tracking-widest font-sans tabular-nums">
              {filteredMedia.length.toString().padStart(2, '0')} IMAGES
            </motion.p>
          </div>

          {/* ── Tag filters ── */}
          {availableTags.length > 1 && (
            <motion.div variants={fadeIn} className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 flex-wrap">
              {/* All */}
              <button
                onClick={() => handleTagChange('all')}
                className={`text-[10px] sm:text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 border transition-all duration-300 focus-visible:outline-none ${
                  activeTag === 'all'
                    ? 'bg-[#C9A227] text-[#1C1A15] border-[#C9A227]'
                    : 'text-[#F8F6F1]/50 border-[#F8F6F1]/15 hover:border-[#C9A227]/50 hover:text-[#F8F6F1]/80'
                }`}
              >
                All
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  className={`text-[10px] sm:text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 border transition-all duration-300 focus-visible:outline-none ${
                    activeTag === tag
                      ? 'bg-[#C9A227] text-[#1C1A15] border-[#C9A227]'
                      : 'text-[#F8F6F1]/50 border-[#F8F6F1]/15 hover:border-[#C9A227]/50 hover:text-[#F8F6F1]/80'
                  }`}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Featured display ── */}
          <motion.div variants={scaleRevealDown} className="relative w-full">
            <div className="w-full aspect-[4/3] sm:aspect-[16/9] bg-[#1C1A15] overflow-hidden relative">
              {currentMedia ? (
                currentMedia.type === 'video' ? (
                  <FeaturedVideo media={currentMedia} />
                ) : (
                  <FeaturedImage
                    media={currentMedia}
                    onExpand={() => openLightbox(activeIndex)}
                  />
                )
              ) : null}

              {/* Arrow nav overlay — desktop */}
              {filteredMedia.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveIndex((i) => (i - 1 + filteredMedia.length) % filteredMedia.length)}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1C1A15]/60 backdrop-blur-sm border border-[#F8F6F1]/15 hover:border-[#C9A227]/60 flex items-center justify-center text-[#F8F6F1]/70 hover:text-[#C9A227] transition-all duration-200 focus-visible:outline-none z-10 hidden sm:flex"
                    aria-label="Previous"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveIndex((i) => (i + 1) % filteredMedia.length)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1C1A15]/60 backdrop-blur-sm border border-[#F8F6F1]/15 hover:border-[#C9A227]/60 flex items-center justify-center text-[#F8F6F1]/70 hover:text-[#C9A227] transition-all duration-200 focus-visible:outline-none z-10 hidden sm:flex"
                    aria-label="Next"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Accent rule beneath featured */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#C9A227]/30 to-transparent" />
          </motion.div>

          {/* ── Thumbnail strip ── */}
          {filteredMedia.length > 1 && (
            <motion.div variants={fadeIn} className="mt-3 sm:mt-4">
              <div
                ref={thumbsRef}
                className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none"
                role="listbox"
                aria-label="Select gallery image"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {filteredMedia.map((item, index) => (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    onKeyDown={(e) => handleThumbKeyDown(e, index)}
                  >
                    {item.type === 'video' ? (
                      <VideoThumb
                        media={item}
                        isActive={index === activeIndex}
                        onClick={() => setActiveIndex(index)}
                        index={index}
                      />
                    ) : (
                      <ImageThumb
                        media={item}
                        isActive={index === activeIndex}
                        onClick={() => setActiveIndex(index)}
                        index={index}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Progress dots — mobile only */}
              <div className="flex items-center justify-center gap-1.5 mt-3 sm:hidden">
                {filteredMedia.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className="focus-visible:outline-none"
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <motion.div
                      animate={{
                        width: index === activeIndex ? 16 : 4,
                        backgroundColor: index === activeIndex ? '#C9A227' : 'rgba(248,246,241,0.2)',
                      }}
                      transition={{ duration: 0.3, ease: EASE_SOFT }}
                      className="h-[3px] rounded-full"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Bottom rule ── */}
          <motion.div
            variants={fadeIn}
            className="mt-10 sm:mt-12 h-px bg-gradient-to-r from-transparent via-[#C9A227]/20 to-transparent"
          />
        </div>
      </motion.section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && currentMedia?.type === 'image' && (
          <Lightbox
            media={filteredMedia.filter((m) => m.type === 'image')}
            activeIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default ProjectGallery;