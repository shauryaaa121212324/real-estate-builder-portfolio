import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { getTestimonials } from '../services/testimonialService';
import type { Testimonial } from '../types/testimonial';
import { Seo } from '../components/Seo';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const heroContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.95, ease: EASE_LUXURY } },
};

const ruleExpand: Variants = {
  hidden: { scaleX: 0, opacity: 0, originX: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 1.2, ease: EASE_LUXURY } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: EASE_LUXURY, delay: Math.min(i, 6) * 0.06 },
  }),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDeliveryDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Star rating
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill={i < rating ? '#C9A227' : 'none'}
          stroke={i < rating ? '#C9A227' : 'currentColor'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={i >= rating ? 'text-[#F8F6F1]/20' : ''}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery image — graceful placeholder when no image is set
// ---------------------------------------------------------------------------

function DeliveryImage({ url, alt }: { url: string | null; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1C1A15] to-[#14130F]">
        <svg width="34" height="26" viewBox="0 0 36 28" fill="none" aria-hidden="true" className="text-[#C9A227]/18">
          <path
            d="M0 28V17.5C0 12.833 1.167 9.083 3.5 6.25C5.833 3.333 9.333 1.333 14 0.25L15.5 3C12.167 3.833 9.75 5.333 8.25 7.5C6.75 9.583 6 12.167 6 15.25H12V28H0ZM20 28V17.5C20 12.833 21.167 9.083 23.5 6.25C25.833 3.333 29.333 1.333 34 0.25L35.5 3C32.167 3.833 29.75 5.333 28.25 7.5C26.75 9.583 26 12.167 26 15.25H32V28H20Z"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#F8F6F1]/5" />}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Testimonial card
// ---------------------------------------------------------------------------

function TestimonialDeliveryCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const deliveredLabel = formatDeliveryDate(testimonial.deliveryDate);
  const locationLine = [testimonial.projectName, testimonial.locality].filter(Boolean).join(' · ');

  return (
    <motion.article
      variants={cardVariants}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-6% 0px' }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] transition-all duration-500 hover:border-[#C9A227]/20 hover:shadow-[0_24px_60px_rgba(20,19,15,0.45)]"
    >
      {/* Delivery image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <DeliveryImage
          url={testimonial.deliveryImageUrl}
          alt={`${testimonial.customerName} delivery${testimonial.projectName ? ` — ${testimonial.projectName}` : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1A15] via-[#1C1A15]/5 to-transparent" />

        {deliveredLabel && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center rounded-full border border-[#F8F6F1]/15 bg-[#14130F]/60 px-3 py-1 text-[9.5px] uppercase tracking-[0.18em] text-[#F8F6F1]/70 backdrop-blur-sm">
              Delivered {deliveredLabel}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
        <StarRating rating={testimonial.rating} />

        <blockquote className="text-[14px] font-light leading-relaxed text-[#F8F6F1]/65">
          "{testimonial.review}"
        </blockquote>

        <div className="mt-auto h-px w-full bg-[#F8F6F1]/8" />

        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] font-medium text-[#F8F6F1]">{testimonial.customerName}</span>
          {locationLine && (
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-[#C9A227]/70">{locationLine}</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[#1B1B1B]/6 bg-[#1C1A15]/90">
          <div className="aspect-[4/3] animate-pulse bg-[#F8F6F1]/5" />
          <div className="flex flex-col gap-3 p-6 sm:p-7">
            <div className="h-3 w-20 animate-pulse rounded bg-[#F8F6F1]/8" />
            <div className="h-3 w-full animate-pulse rounded bg-[#F8F6F1]/8" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#F8F6F1]/8" />
            <div className="mt-3 h-px w-full bg-[#F8F6F1]/8" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#F8F6F1]/8" />
          </div>
        </div>
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
        <span className="h-px w-14 bg-[#C9A227]/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]/50" />
        <span className="h-px w-14 bg-[#C9A227]/30" />
      </div>
      <p className="font-serif text-[1.6rem] text-[#1B1B1B]/55">Unable to load testimonials</p>
      <p className="mt-3 text-[13px] font-light tracking-wide text-[#1B1B1B]/35">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[#C9A227]/50 px-6 py-3 text-[11px] uppercase tracking-[0.22em] text-[#C9A227] transition-all hover:border-[#C9A227]/80 hover:bg-[#C9A227]/10"
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
        <span className="h-px w-14 bg-[#C9A227]/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]/50" />
        <span className="h-px w-14 bg-[#C9A227]/30" />
      </div>
      <p className="font-serif text-[1.6rem] text-[#1B1B1B]/55">No stories published yet</p>
      <p className="mt-3 max-w-[40ch] text-[13px] font-light tracking-wide text-[#1B1B1B]/35">
        Resident stories from completed deliveries will appear here as they're shared.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestimonials();
      setTestimonials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const PAGE_TITLE = 'Resident Stories | Autor Builders';
  const PAGE_DESCRIPTION =
    'Real stories from families who received their keys — testimonials from completed Autor Builders deliveries across Hyderabad.';

  return (
    <div id="testimonials-full" className="min-h-screen bg-[#F8F6F1]">
      <Seo title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/testimonials" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#14130F] pb-20 pt-32 sm:pt-44">
        <div
          className="pointer-events-none absolute -right-64 -top-24 h-[640px] w-[640px] rounded-full opacity-[0.045]"
          style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <Container size="xl" className="relative">
          <motion.div variants={heroContainer} initial="hidden" animate="visible">
            <motion.span
              variants={fadeUp}
              className="text-[11px] uppercase tracking-[0.38em] text-[#F8F6F1]/50"
            >
              Resident Voices
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-4 font-serif text-[2.4rem] leading-[1.1] text-[#F8F6F1] sm:text-[3.2rem] lg:text-[3.75rem] lg:leading-[1.08]"
            >
              Every story,
              <br />
              <em className="not-italic text-[#C9A227]/80">a promise kept.</em>
            </motion.h1>

            <motion.div
              variants={fadeUp}
              className="mt-9 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-14"
            >
              <motion.div variants={ruleExpand} className="mt-[5px] h-px w-20 shrink-0 bg-[#C9A227]/45" />
              <p className="max-w-[42ch] text-[14px] font-light leading-[1.85] text-[#F8F6F1]/65">
                Beyond brochures and blueprints, this is what an Autor Builders address feels like
                once the keys are handed over — told by the families who live there.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-12 flex items-center gap-3">
              <span className="font-serif text-[2.1rem] leading-none text-[#F8F6F1]/85 sm:text-[2.6rem]">
                {loading ? '—' : String(testimonials.length)}
              </span>
              <span className="text-[9.5px] uppercase tracking-[0.28em] text-[#F8F6F1]/80">
                {testimonials.length === 1 ? 'Story Shared' : 'Stories Shared'}
              </span>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* ── Stories grid ── */}
      <section>
        <Container size="xl" className="py-16 sm:py-20">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchTestimonials} />
          ) : testimonials.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialDeliveryCard key={testimonial.id} testimonial={testimonial} index={index} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}