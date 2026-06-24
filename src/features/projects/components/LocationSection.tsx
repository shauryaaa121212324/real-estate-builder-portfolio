import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { LocationDetails } from '../../../types/project';

// ---------------------------------------------------------------------------
// Animation constants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_LUXURY } },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LocationSectionProps {
  location: LocationDetails;
  projectName: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LocationSection({
  location,
  projectName,
  className = '',
}: LocationSectionProps) {
  const {
    address,
    city,
    state,
    pincode,
    lat,
    lng,
    landmarks,
  } = location;

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const mapsEmbedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3804.4${Math.random().toString().slice(2, 8)}!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0:0x0!2z${lat},${lng}!5e0!3m2!1sen!2sin!4v1234567890`;

  return (
    <section
      id="location"
      className={[
        'relative border-t border-[#F8F6F1]/6 py-20 sm:py-28',
        className,
      ].join(' ')}
    >
      {/* Ambient gold wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-20 h-[420px] w-[420px] rounded-full opacity-[0.035]"
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
            Address &amp; Connectivity
          </span>
          <h2 className="font-serif text-[2rem] leading-[1.15] text-[#F8F6F1] sm:text-[2.6rem]">
            Location & <span className="italic text-[#F8F6F1]/55">Neighbourhood</span>
          </h2>
          <p className="max-w-xl text-[14px] font-light leading-relaxed text-[#F8F6F1]/40">
            Strategically positioned to balance urban convenience with serene surroundings,
            {' '}{projectName} offers unparalleled connectivity to the city's most sought-after
            destinations.
          </p>
        </div>

        {/* ── Main content grid ── */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ── Left: Address & Landmarks ── */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-8%' }}
            className="flex flex-col gap-6"
          >
            {/* Address card */}
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-7 sm:p-8"
            >
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/30 text-[#C9A227]">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z" />
                      <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#F8F6F1]/30">
                      Address
                    </span>
                    <h3 className="font-serif text-base text-[#F8F6F1]/85">{address}</h3>
                  </div>
                </div>

                <div className="border-t border-[#F8F6F1]/6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <LocationMeta label="City" value={city} />
                    <LocationMeta label="State" value={state} />
                    <LocationMeta label="Pincode" value={pincode} />
                    <LocationMeta
                      label="Coordinates"
                      value={`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`}
                    />
                  </div>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'group inline-flex items-center gap-2.5 text-[12px] uppercase tracking-[0.15em]',
                    'text-[#C9A227] transition-colors duration-300 hover:text-[#F8F6F1]',
                  ].join(' ')}
                >
                  View on Google Maps
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </motion.div>

            {/* Landmarks */}
            {landmarks.length > 0 && (
              <motion.div variants={itemVariants} className="flex flex-col gap-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#C9A227]/75">
                  Key Landmarks
                </span>
                <div className="flex flex-col gap-2">
                  {landmarks.map((landmark, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-[#F8F6F1]/6 bg-[#1C1A15]/50 px-4 py-3 transition-colors duration-300 hover:border-[#F8F6F1]/10 hover:bg-[#1C1A15]"
                    >
                      <span className="text-[13px] text-[#F8F6F1]/70">{landmark.label}</span>
                      <span className="text-[11px] text-[#F8F6F1]/40">
                        {landmark.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Right: Map ── */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE_LUXURY }}
            viewport={{ once: true, margin: '-8%' }}
            className="relative overflow-hidden rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15]"
          >
            {/* Embedded map */}
            <div className="aspect-square w-full sm:aspect-[4/3] lg:aspect-square">
              <iframe
                title={`Map of ${projectName}`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapsEmbedUrl}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
              />
            </div>

            {/* Overlay info card (bottom-right) */}
            <div className="pointer-events-none absolute bottom-4 right-4 rounded-xl border border-[#F8F6F1]/20 bg-[#14130F]/85 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-[11px] font-light text-[#F8F6F1]/75">
                {city}, {state} {pincode}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Benefits/Highlights ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-8%' }}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <HighlightCard
            icon="zap"
            title="Seamless Connectivity"
            description="Direct access to major highways and rapid transit infrastructure."
          />
          <HighlightCard
            icon="briefcase"
            title="Business Hub"
            description="Close proximity to IT parks, commercial centres, and corporate offices."
          />
          <HighlightCard
            icon="shopping-cart"
            title="Shopping & Leisure"
            description="World-class malls, restaurants, and entertainment venues nearby."
          />
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// LocationMeta sub-component
// ---------------------------------------------------------------------------

function LocationMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] uppercase tracking-[0.16em] text-[#F8F6F1]/25">
        {label}
      </span>
      <span className="text-[12px] font-light text-[#F8F6F1]/60">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HighlightCard sub-component
// ---------------------------------------------------------------------------

interface HighlightCardProps {
  icon: 'zap' | 'briefcase' | 'shopping-cart';
  title: string;
  description: string;
}

function HighlightCard({ icon, title, description }: HighlightCardProps) {
  const iconMap: Record<string, React.ReactNode> = {
    zap: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
      </svg>
    ),
    briefcase: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    'shopping-cart': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.65, ease: EASE_LUXURY },
        },
      }}
      className="group flex flex-col gap-3 rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-6 transition-all duration-500 hover:border-[#C9A227]/30"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227]/30 text-[#C9A227] transition-all duration-500 group-hover:border-[#C9A227]/60 group-hover:bg-[#C9A227]/10">
        {iconMap[icon]}
      </div>
      <h3 className="font-serif text-sm text-[#F8F6F1]/85">{title}</h3>
      <p className="text-[12px] font-light leading-relaxed text-[#F8F6F1]/50">{description}</p>
    </motion.div>
  );
}

export default LocationSection;