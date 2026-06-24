import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { FloorPlan } from '../../../types/project';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPriceInr(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(0)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatArea(sqft: number): string {
  return `${sqft.toLocaleString('en-IN')} sq.ft`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FloorPlansSectionProps {
  floorPlans: FloorPlan[];
  projectName: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FloorPlansSection({
  floorPlans,
  projectName,
  className = '',
}: FloorPlansSectionProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    floorPlans.length > 0 ? floorPlans[0].id : null
  );

  const selectedPlan = floorPlans.find((p) => p.id === selectedPlanId);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (floorPlans.length === 0) {
    return null;
  }

  return (
    <section
      id="floor-plans"
      className={[
        'relative border-t border-[#F8F6F1]/6 py-20 sm:py-28',
        className,
      ].join(' ')}
    >
      {/* Ambient gold wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-10 h-[420px] w-[420px] rounded-full opacity-[0.035]"
        style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* ── Heading ── */}
        <div className="flex flex-col gap-4">
          <div className="flex w-16 items-center">
            <span className="h-2 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
            <span className="h-2 w-px bg-[#C9A227]/80" />
          </div>
          <span className="text-[10.5px] uppercase tracking-[0.34em] text-[#C9A227]/75">
            Configurations
          </span>
          <h2 className="font-serif text-[2rem] leading-[1.15] text-[#F8F6F1] sm:text-[2.6rem]">
            Floor Plans & <span className="italic text-[#F8F6F1]/55">Layouts</span>
          </h2>
          <p className="max-w-xl text-[14px] font-light leading-relaxed text-[#F8F6F1]/40">
            Explore the thoughtfully designed configurations available at {projectName}. Each
            layout maximizes space and natural light for an elevated living experience.
          </p>
        </div>

        {/* ── Content Grid ── */}
        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">
          {/* ── List of plans (left/top) ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-8%' }}
            className="flex flex-col gap-3 lg:col-span-1"
          >
            {floorPlans.map((plan) => (
              <motion.button
                key={plan.id}
                variants={cardVariants}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setImageLoaded(false);
                }}
                className={[
                  'group relative flex flex-col gap-3 rounded-2xl border px-6 py-5 text-left',
                  'transition-all duration-500',
                  selectedPlanId === plan.id
                    ? 'border-[#C9A227]/50 bg-[#1F1D17] shadow-[0_8px_32px_rgba(201,162,39,0.15)]'
                    : 'border-[#F8F6F1]/6 bg-[#1C1A15] hover:border-[#F8F6F1]/12',
                ].join(' ')}
              >
                {/* Config & label */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={[
                        'text-[10px] uppercase tracking-[0.2em] transition-colors duration-300',
                        selectedPlanId === plan.id
                          ? 'text-[#C9A227]'
                          : 'text-[#F8F6F1]/40 group-hover:text-[#F8F6F1]/60',
                      ].join(' ')}
                    >
                      {plan.config}
                    </span>
                    <span
                      className={[
                        'font-serif text-sm leading-snug transition-colors duration-300',
                        selectedPlanId === plan.id ? 'text-[#F8F6F1]' : 'text-[#F8F6F1]/70',
                      ].join(' ')}
                    >
                      {plan.label}
                    </span>
                  </div>
                  <div
                    className={[
                      'h-2 w-2 rounded-full transition-all duration-300',
                      selectedPlanId === plan.id ? 'bg-[#C9A227]' : 'bg-[#F8F6F1]/20',
                    ].join(' ')}
                  />
                </div>

                {/* Area & price (compact) */}
                <div className="flex flex-col gap-2 text-[11px]">
                  <span className="text-[#F8F6F1]/40">{formatArea(plan.areaSqFt)}</span>
                  <span className="font-light text-[#F8F6F1]/60">
                    {formatPriceInr(plan.priceMin)} – {formatPriceInr(plan.priceMax)}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* ── Selected plan detail (right/bottom) ── */}
          {selectedPlan && (
            <motion.div
              key={selectedPlan.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: EASE_LUXURY }}
              className="flex flex-col gap-6 lg:col-span-2"
            >
              {/* Image */}
              <div className="relative overflow-hidden rounded-2xl bg-[#1C1A15]">
                {!imageLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-[#F8F6F1]/5" />
                )}
                <img
                  src={selectedPlan.imageUrl}
                  alt={`${selectedPlan.label} floor plan`}
                  onLoad={() => setImageLoaded(true)}
                  className={[
                    'h-auto w-full transition-all duration-500',
                    imageLoaded ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-6 rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-7 sm:p-8">
                <DetailSpec label="Configuration" value={selectedPlan.config} />
                <DetailSpec label="Area" value={formatArea(selectedPlan.areaSqFt)} />
                <DetailSpec
                  label="Price From"
                  value={formatPriceInr(selectedPlan.priceMin)}
                />
                <DetailSpec label="Price To" value={formatPriceInr(selectedPlan.priceMax)} />
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Info note ── */}
        <div className="mt-12 flex gap-3 rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15]/40 p-5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/30 text-[11px] text-[#C9A227]">
            •
          </span>
          <p className="text-[12.5px] font-light leading-relaxed text-[#F8F6F1]/50">
            Prices and availability are subject to change. For the most current details and
            customization options, please contact our sales team or request a brochure.
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// DetailSpec sub-component
// ---------------------------------------------------------------------------

function DetailSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#F8F6F1]/30">
        {label}
      </span>
      <span className="font-serif text-base text-[#F8F6F1]/85">{value}</span>
    </div>
  );
}

export default FloorPlansSection;