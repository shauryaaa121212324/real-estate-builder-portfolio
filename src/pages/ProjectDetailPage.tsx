import { useMemo, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { getProjectBySlug, getProjectById, getProjects } from '../services/projectService';
import { ProjectHero } from '../features/projects/components/ProjectHero';
import { ProjectGallery } from '../features/projects/components/ProjectGallery';
import { AmenitiesSection } from '../features/projects/components/AmenitiesSection';
import { FloorPlansSection } from '../features/projects/components/FloorPlansSection';
import { LocationSection } from '../features/projects/components/LocationSection';
import { RelatedProjects } from '../features/projects/components/RelatedProjects';
import { Button } from '../components/ui/Button';
import { useConsultation } from '../components/ConsultationModal';
import type { FloorPlan, Project, ProjectCard, UnitConfig } from '../types/project';

// ---------------------------------------------------------------------------
// SEO constants
// ---------------------------------------------------------------------------

const SITE_URL = 'https://www.autorbuilders.com';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_LUXURY } },
};

const stickyBarVariants: Variants = {
  hidden: { y: '110%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { duration: 0.55, ease: EASE_LUXURY } },
  exit: { y: '110%', opacity: 0, transition: { duration: 0.4, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatPriceInr(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(0)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatArea(sqft: number | null | undefined): string {
  if (sqft == null) return '—';
  return `${sqft.toLocaleString('en-IN')} sq.ft`;
}

function formatUpdateDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

const CONFIG_LABEL: Record<UnitConfig, string> = {
  '1BHK': '1 BHK',
  '2BHK': '2 BHK',
  '3BHK': '3 BHK',
  '4BHK': '4 BHK',
  '5BHK': '5 BHK',
  duplex: 'Duplex',
  penthouse: 'Penthouse',
  studio: 'Studio',
  villa: 'Villa',
};

// ---------------------------------------------------------------------------
// Configuration / pricing summary derivation
// ---------------------------------------------------------------------------

interface ConfigSummary {
  config: UnitConfig;
  variantCount: number;
  areaMin: number;
  areaMax: number;
  priceMin: number;
  priceMax: number;
}

function buildConfigSummaries(project: Project): ConfigSummary[] {
  if (project.floorPlans.length > 0) {
    const grouped = new Map<UnitConfig, FloorPlan[]>();
    project.floorPlans.forEach((plan) => {
      const bucket = grouped.get(plan.config) ?? [];
      bucket.push(plan);
      grouped.set(plan.config, bucket);
    });

    return Array.from(grouped.entries()).map(([config, plans]) => ({
      config,
      variantCount: plans.length,
      areaMin: Math.min(...plans.map((p) => p.areaSqFt)),
      areaMax: Math.max(...plans.map((p) => p.areaSqFt)),
      priceMin: Math.min(...plans.map((p) => p.priceMin)),
      priceMax: Math.max(...plans.map((p) => p.priceMax)),
    }));
  }

  // Fallback to project-level ranges when detailed floor plans aren't published yet.
  return project.configs.map((config) => ({
  config,
  variantCount: 1,
  areaMin: project.areaRangeSqFt[0] ?? 0,
  areaMax: project.areaRangeSqFt[1] ?? 0,
  priceMin: project.priceRangeInr[0],
  priceMax: project.priceRangeInr[1],
}));
}

// ---------------------------------------------------------------------------
// SEO helpers
// ---------------------------------------------------------------------------

function buildSeoDescription(project: Project): string {
  const source = project.tagline?.trim() || project.description?.trim() || '';
  if (source.length <= 160) return source;
  return `${source.slice(0, 157).trimEnd()}...`;
}

/**
 * JSON-LD Product schema representing the residence/project listing.
 * NOTE: brand.logo and seller.telephone are PLACEHOLDER values — replace
 * with real business details before production deploy.
 */
function buildResidenceSchema(project: Project) {
  const canonicalUrl = `${SITE_URL}/projects/${project.slug}`;
  // Falls back to the existing hero-fallback asset when a project has no cover image.
  const image = project.coverImage || `${SITE_URL}/images/hero-fallback.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}/#product`,
    name: project.name,
    description: project.description || project.tagline || '',
    image: [image],
    url: canonicalUrl,
    category: project.category, // e.g. "residential" | "villa"
    brand: {
      '@type': 'Organization',
      name: 'Autor Builders',
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.png`, // PLACEHOLDER — replace with actual logo asset URL
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: project.priceRangeInr[0],
      highPrice: project.priceRangeInr[1],
      availability:
        project.availableUnits > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/SoldOut',
      url: canonicalUrl,
      seller: {
        '@type': 'RealEstateAgent',
        name: 'Autor Builders',
        url: SITE_URL,
        telephone: '+91-00000-00000', // PLACEHOLDER
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Total Units',
        value: project.totalUnits,
      },
      {
        '@type': 'PropertyValue',
        name: 'Available Units',
        value: project.availableUnits,
      },
      {
        '@type': 'PropertyValue',
        name: 'Launch Year',
        value: project.launchYear,
      },
      {
        '@type': 'PropertyValue',
        name: 'Completion Year',
        value: project.completionYear ?? 'Delivered',
      },
      ...(project.reraNumber
        ? [
            {
              '@type': 'PropertyValue',
              name: 'RERA Number',
              value: project.reraNumber,
            },
          ]
        : []),
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: project.location.address,
      addressLocality: project.location.city,
      addressRegion: project.location.state,
      postalCode: project.location.pincode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: project.location.lat,
      longitude: project.location.lng,
    },
  };
}

function ProjectSeo({ project }: { project: Project }) {
  const title = `${project.name} | Autor Builders`;
  const description = buildSeoDescription(project);
  const canonicalUrl = `${SITE_URL}/projects/${project.slug}`;
  const ogImage = project.coverImage || `${SITE_URL}/images/hero-fallback.jpg`;
  const residenceSchema = buildResidenceSchema(project);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Autor Builders" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD: Residence / Product */}
      <script type="application/ld+json">
        {JSON.stringify(residenceSchema)}
      </script>
    </Helmet>
  );
}

// ---------------------------------------------------------------------------
// Section heading
// ---------------------------------------------------------------------------

function SectionHeading({
  eyebrow,
  heading,
  description,
}: {
  eyebrow: string;
  heading: React.ReactNode;
  description?: string;
}) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-4">
      <div className="flex w-16 items-center">
        <span className="h-2 w-px bg-[#C9A227]/80" />
        <span className="h-px flex-1 bg-[#C9A227]/80" />
        <span className="h-2 w-px bg-[#C9A227]/80" />
      </div>
      <span className="text-[10.5px] uppercase tracking-[0.34em] text-[#C9A227]/75">
        {eyebrow}
      </span>
      <h2 className="font-serif text-[2rem] leading-[1.15] text-[#F8F6F1] sm:text-[2.6rem]">
        {heading}
      </h2>
      {description && (
        <p className="max-w-2xl text-[14px] font-light leading-relaxed text-[#F8F6F1]/40">
          {description}
        </p>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Overview section — description + key facts
// ---------------------------------------------------------------------------

function OverviewSection({ project }: { project: Project }) {
  return (
    <section className="relative border-t border-[#F8F6F1]/6 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-8%' }}
          className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16"
        >
          {/* Narrative */}
          <div className="flex flex-col gap-6">
            <SectionHeading eyebrow="Overview" heading={`About ${project.name}`} />
            <motion.p
              variants={fadeUp}
              className="max-w-2xl text-[14.5px] font-light leading-relaxed text-[#F8F6F1]/45"
            >
              {project.description}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
              {project.configs.map((config) => (
                <span
                  key={config}
                  className="rounded-full border border-[#F8F6F1]/10 bg-[#1C1A15] px-4 py-1.5 text-[10.5px] uppercase tracking-[0.18em] text-[#F8F6F1]/55"
                >
                  {CONFIG_LABEL[config]}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Key facts */}
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-2 gap-6 self-start rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-7 sm:p-8"
          >
            <Fact label="Total Units" value={`${project.totalUnits}`} />
            <Fact label="Available" value={`${project.availableUnits}`} />
            <Fact label="Launch Year" value={`${project.launchYear}`} />
            <Fact
              label="Completion"
              value={project.completionYear ? `${project.completionYear}` : 'Delivered'}
            />
            {project.reraNumber && (
              <div className="col-span-2 border-t border-[#F8F6F1]/6 pt-4">
                <Fact label="RERA No." value={project.reraNumber} />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#F8F6F1]/30">{label}</span>
      <span className="font-serif text-lg text-[#F8F6F1]/85">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Availability, pricing & configuration highlights
// ---------------------------------------------------------------------------

function PricingAvailabilitySection({ project }: { project: Project }) {
  const summaries = useMemo(() => buildConfigSummaries(project), [project]);

  const soldUnits = Math.max(project.totalUnits - project.availableUnits, 0);
  const percentSold =
    project.totalUnits > 0 ? Math.round((soldUnits / project.totalUnits) * 100) : 0;
  const percentAvailable = 100 - percentSold;

  const overallPriceLabel = `${formatPriceInr(project.priceRangeInr[0])} – ${formatPriceInr(
    project.priceRangeInr[1]
  )}`;

  return (
    <section className="relative border-t border-[#F8F6F1]/6 py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-16 h-[420px] w-[420px] rounded-full opacity-[0.035]"
        style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-8%' }}
        >
          <SectionHeading
            eyebrow="Investment"
            heading={
              <>
                Pricing &amp; <span className="italic text-[#F8F6F1]/55">Availability</span>
              </>
            }
            description={`A transparent look at where ${project.name} stands today — current pricing across configurations and live unit availability.`}
          />

          {/* ── Overall price + availability strip ── */}
          <motion.div
            variants={fadeUp}
            className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]"
          >
            {/* Price banner */}
            <div className="flex flex-col justify-between gap-6 rounded-2xl border border-[#C9A227]/25 bg-gradient-to-br from-[#1F1D17] to-[#1C1A15] p-7 sm:p-8">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A227]/75">
                  Starting Price Range
                </span>
                <span className="font-serif text-[1.9rem] leading-tight text-[#F8F6F1] sm:text-[2.2rem]">
                  {overallPriceLabel}
                </span>
                <span className="text-[12px] font-light text-[#F8F6F1]/40">
                  All-inclusive of base price, across {project.configs.length}{' '}
                  configuration{project.configs.length > 1 ? 's' : ''}
                </span>
              </div>
              <Button as="a" href="#enquire" variant="gold" size="sm" withArrow>
                Get Exact Quote
              </Button>
            </div>

            {/* Availability card */}
            <div className="flex flex-col gap-6 rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-7 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#F8F6F1]/30">
                    Unit Availability
                  </span>
                  <span className="font-serif text-2xl text-[#F8F6F1]/90">
                    {project.availableUnits} of {project.totalUnits} units left
                  </span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#C9A227]/80">
                  {percentAvailable}% Available
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#F8F6F1]/8">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentSold}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, ease: EASE_LUXURY }}
                  className="absolute inset-y-0 left-0 rounded-full bg-[#C9A227]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-[#F8F6F1]/6 pt-5">
                <Fact label="Total Units" value={`${project.totalUnits}`} />
                <Fact label="Booked" value={`${soldUnits}`} />
                <Fact label="Available" value={`${project.availableUnits}`} />
              </div>
            </div>
          </motion.div>

          {/* ── Configuration highlight cards ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-8%' }}
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {summaries.map((summary) => (
              <motion.div
                key={summary.config}
                variants={fadeUp}
                className="group flex flex-col gap-4 rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-6 transition-colors duration-500 hover:border-[#C9A227]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-lg text-[#F8F6F1]/90">
                    {CONFIG_LABEL[summary.config]}
                  </span>
                  <span className="rounded-full border border-[#F8F6F1]/10 px-2.5 py-1 text-[9.5px] uppercase tracking-[0.16em] text-[#F8F6F1]/35">
                    {summary.variantCount} variant{summary.variantCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-2 border-t border-[#F8F6F1]/6 pt-4 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#F8F6F1]/30">Area</span>
                    <span className="font-light text-[#F8F6F1]/65">
                      {summary.areaMin === summary.areaMax
                        ? formatArea(summary.areaMin)
                        : `${formatArea(summary.areaMin)} – ${formatArea(summary.areaMax)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#F8F6F1]/30">Price</span>
                    <span className="font-light text-[#C9A227]/90">
                      {formatPriceInr(summary.priceMin)} – {formatPriceInr(summary.priceMax)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Construction progress
// ---------------------------------------------------------------------------

function ConstructionProgressSection({ project }: { project: Project }) {
  const sortedUpdates = useMemo(
    () =>
      [...project.constructionUpdates].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [project.constructionUpdates]
  );

  if (sortedUpdates.length === 0) return null;

  const latest = sortedUpdates[0];

  return (
    <section className="relative border-t border-[#F8F6F1]/6 py-20 sm:py-28">
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-8%' }}
        >
          <SectionHeading
            eyebrow="Live Status"
            heading={
              <>
                Construction <span className="italic text-[#F8F6F1]/55">Progress</span>
              </>
            }
            description={`Track the journey of ${project.name} from groundbreaking to handover, updated with each major milestone.`}
          />

          {/* Headline progress */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col gap-4 rounded-2xl border border-[#C9A227]/20 bg-[#1C1A15] p-7 sm:p-8"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#F8F6F1]/35">
                As of {formatUpdateDate(latest.date)}
              </span>
              <span className="font-serif text-3xl text-[#C9A227]">
                {latest.percentComplete}% Complete
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#F8F6F1]/8">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${latest.percentComplete}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE_LUXURY }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#C9A227] to-[#e8c455]"
              />
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-8%' }}
            className="mt-10 flex flex-col gap-6"
          >
            {sortedUpdates.map((update, idx) => (
              <motion.div
                key={update.id}
                variants={fadeUp}
                className="relative flex flex-col gap-4 border-l border-[#F8F6F1]/10 pl-6 sm:flex-row sm:items-start sm:gap-8"
              >
                <span
                  aria-hidden="true"
                  className={[
                    'absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full',
                    idx === 0 ? 'bg-[#C9A227]' : 'bg-[#F8F6F1]/25',
                  ].join(' ')}
                />
                <div className="flex shrink-0 flex-col gap-1 sm:w-44">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A227]/70">
                    {formatUpdateDate(update.date)}
                  </span>
                  <span className="text-[12px] font-light text-[#F8F6F1]/35">
                    {update.percentComplete}% complete
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 pb-4">
                  <h3 className="font-serif text-base text-[#F8F6F1]/90">{update.title}</h3>
                  <p className="max-w-2xl text-[13px] font-light leading-relaxed text-[#F8F6F1]/45">
                    {update.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Enquiry section (id="enquire" — target of CTA links throughout the page)
// ---------------------------------------------------------------------------

function EnquirySection({ project }: { project: Project }) {
  const { open: openConsultation } = useConsultation();

  return (
    <section id="enquire">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 0.95, ease: EASE_LUXURY }}
          className="relative overflow-hidden rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] px-8 py-14 sm:px-14 sm:py-16"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
          />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] uppercase tracking-[0.38em] text-[#C9A227]/60">
                Private Advisory
              </span>
              <h2 className="font-serif text-[1.75rem] leading-[1.2] text-[#F8F6F1]/85 sm:text-[2.2rem]">
                Interested in {project.name}?
                <br />
                <span className="text-[#F8F6F1]/42">Let's plan your next visit.</span>
              </h2>
              <p className="max-w-[46ch] text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/32">
                Speak with our advisory team for a personalised walkthrough, current pricing,
                and a tailored payment plan for your preferred configuration.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Button as="button" type="button" onClick={openConsultation} variant="gold" size="lg" withArrow>
                Schedule a Site Visit
              </Button>
              <Button as="a" href="/contact" variant="secondary" size="lg">
                Get in Touch
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sticky enquiry CTA bar
// ---------------------------------------------------------------------------

function StickyEnquiryBar({ project }: { project: Project }) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const threshold = typeof window !== 'undefined' ? window.innerHeight * 0.75 : 600;
    setVisible(latest > threshold);
  });

  const priceLabel = `${formatPriceInr(project.priceRangeInr[0])} – ${formatPriceInr(
    project.priceRangeInr[1]
  )}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={stickyBarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[#F8F6F1]/10 bg-[#0F0E0B]/95 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-10 lg:px-16">
            <div className="flex min-w-0 items-center gap-4">
              <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/35 text-[#C9A227] sm:flex">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[12.5px] font-light text-[#F8F6F1]/85 sm:text-[13.5px]">
                  {project.name}
                </span>
                <span className="truncate text-[11px] font-light text-[#C9A227]/85">
                  {priceLabel}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button as="a" href="/contact" variant="secondary" size="sm" className="hidden sm:inline-flex">
                Get in Touch
              </Button>
              <Button as="a" href="#enquire" variant="gold" size="sm" withArrow>
                Enquire Now
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#14130F] animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[60vh] bg-[#1C1A15]" />
      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16 flex flex-col gap-8">
        <div className="h-8 w-48 rounded bg-[#1C1A15]" />
        <div className="h-4 w-full max-w-2xl rounded bg-[#1C1A15]" />
        <div className="h-4 w-3/4 max-w-2xl rounded bg-[#1C1A15]" />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[#1C1A15]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

function ErrorState({ message }: { slug?: string; message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#14130F] px-6 text-center">
      <span className="text-[10.5px] uppercase tracking-[0.34em] text-[#C9A227]/60">Error</span>
      <h1 className="font-serif text-3xl text-[#F8F6F1]/85 sm:text-4xl">Failed to load project</h1>
      <p className="max-w-md text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/40">
        {message}
      </p>
      <Link
        to="/projects"
        className="mt-2 inline-flex items-center gap-2.5 rounded-full border border-[#F8F6F1]/15 px-7 py-3 text-[11px] uppercase tracking-[0.22em] text-[#F8F6F1]/60 transition-all hover:border-[#F8F6F1]/35 hover:text-[#F8F6F1]/85"
      >
        <span aria-hidden="true">&larr;</span> Back to Projects
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------

function ProjectNotFound({ slug }: { slug?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#14130F] px-6 text-center">
      <span className="text-[10.5px] uppercase tracking-[0.34em] text-[#C9A227]/60">404</span>
      <h1 className="font-serif text-3xl text-[#F8F6F1]/85 sm:text-4xl">Project not found</h1>
      <p className="max-w-md text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/40">
        {slug
          ? `We couldn't find a project matching "${slug}".`
          : 'No project was specified.'}{' '}
        It may have been renamed, delisted, or the link may be incorrect.
      </p>
      <Link
        to="/projects"
        className="mt-2 inline-flex items-center gap-2.5 rounded-full border border-[#F8F6F1]/15 px-7 py-3 text-[11px] uppercase tracking-[0.22em] text-[#F8F6F1]/60 transition-all hover:border-[#F8F6F1]/35 hover:text-[#F8F6F1]/85"
      >
        <span aria-hidden="true">&larr;</span> Back to Projects
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        // Fetch project and sibling cards in parallel
        const [fetchedProject, fetchedAll] = await Promise.all([
          getProjectBySlug(slug).then((p) => p ?? getProjectById(slug)),
          getProjects(),
        ]);

        if (!fetchedProject) {
          setNotFound(true);
        } else {
          setProject(fetchedProject);
          setAllProjects(fetchedAll);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState slug={slug} message={error} />;
  if (notFound || !project) return <ProjectNotFound slug={slug} />;

  const showConstructionProgress = project.constructionUpdates.length > 0;

  return (
    <div className="min-h-screen bg-[#14130F] pb-20 sm:pb-0">
      <ProjectSeo project={project} />

      <ProjectHero project={project} />

      {/* ══════════════════════════════════════════════
          OVERVIEW
      ══════════════════════════════════════════════ */}
      <OverviewSection project={project} />

      {/* ══════════════════════════════════════════════
          AVAILABILITY · PRICING · CONFIGURATIONS
      ══════════════════════════════════════════════ */}
      <PricingAvailabilitySection project={project} />

      {/* ══════════════════════════════════════════════
          CONSTRUCTION PROGRESS (conditional)
      ══════════════════════════════════════════════ */}
      {showConstructionProgress && <ConstructionProgressSection project={project} />}

      {/* ══════════════════════════════════════════════
          GALLERY
      ══════════════════════════════════════════════ */}
      <ProjectGallery media={project.galleryMedia} projectName={project.name} />

      {/* ══════════════════════════════════════════════
          AMENITIES
      ══════════════════════════════════════════════ */}
      <AmenitiesSection amenities={project.amenities} />

      {/* ══════════════════════════════════════════════
          FLOOR PLANS
      ══════════════════════════════════════════════ */}
      <FloorPlansSection floorPlans={project.floorPlans} projectName={project.name} />

      {/* ══════════════════════════════════════════════
          LOCATION
      ══════════════════════════════════════════════ */}
      <LocationSection location={project.location} projectName={project.name} />

      {/* ══════════════════════════════════════════════
          ENQUIRY CTA
      ══════════════════════════════════════════════ */}
      <EnquirySection project={project} />

      {/* ══════════════════════════════════════════════
          RELATED PROJECTS
      ══════════════════════════════════════════════ */}
      <RelatedProjects currentProject={project} allProjects={allProjects as unknown as Project[]} />

      {/* ══════════════════════════════════════════════
          STICKY ENQUIRY BAR
      ══════════════════════════════════════════════ */}
      <StickyEnquiryBar project={project} />
    </div>
  );
}