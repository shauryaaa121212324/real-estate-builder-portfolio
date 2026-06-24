import { useRef, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ConsultationButton } from '../components/ConsultationModal';

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.16,
      delayChildren: 0.25,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

const lineRevealVariants: Variants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 1.1, ease: EASE_LUXURY } },
};

const ruleVariants: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

const HeroSection = () => {
  const [videoFailed, setVideoFailed] = useState(false);

  // Reserved refs — wire these into GSAP / ScrollTrigger later (e.g. a slow
  // parallax drift on the media layer, pinning the section while it scrubs,
  // or a SplitText-driven headline) without needing to restructure this file.
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-[#14130F]"
    >
      {/* Background media — swap /videos/hero-video.mp4 and
          /images/hero-fallback.jpg later; markup never needs to change. */}
      <div ref={mediaRef} aria-hidden="true" className="absolute inset-0 z-0 h-full w-full">
        {!videoFailed ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/hero-fallback.jpg"
            onError={() => setVideoFailed(true)}
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
          </video>
        ) : (
          <img src="/images/hero-fallback.jpg" alt="" className="h-full w-full object-cover" />
        )}
      </div>

      {/* Cinematic overlay — keeps copy legible without flattening the footage */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#14130F]/65 via-[#14130F]/20 to-[#14130F]/70" />
      <div className="absolute inset-0 z-[1] bg-[#14130F]/10" />

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center sm:px-10"
      >
        <motion.span
          variants={fadeUpVariants}
          className="text-[11px] uppercase tracking-[0.38em] text-[#F8F6F1]/65 sm:text-xs"
        >
          Luxury Real Estate Development
        </motion.span>

        {/* Signature mark — a drafting line, like a measurement rule pulled
            from an architect's blueprint. */}
        <motion.div variants={ruleVariants} className="mt-5 flex w-20 items-center origin-center">
          <span className="h-2 w-px bg-[#C9A227]/80" />
          <span className="h-px flex-1 bg-[#C9A227]/80" />
          <span className="h-2 w-px bg-[#C9A227]/80" />
        </motion.div>

        <h1
          ref={headlineRef}
          className="mt-7 max-w-5xl font-serif text-[2.6rem] leading-[1.12] text-[#F8F6F1] sm:text-6xl md:text-7xl lg:text-[5.25rem] lg:leading-[1.08]"
        >
          <span className="block overflow-hidden">
            <motion.span variants={lineRevealVariants} className="block">
              Building Tomorrow's
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span variants={lineRevealVariants} className="block">
              <span className="text-[#C9A227]">Landmarks</span> Today
            </motion.span>
          </span>
        </h1>

        <motion.p
          variants={fadeUpVariants}
          className="mt-8 max-w-xl text-[15px] font-light leading-relaxed text-[#F8F6F1]/75 sm:text-base"
        >
          Crafting architectural legacies since 2009 — where uncompromising design,
          enduring craftsmanship, and visionary scale converge.
        </motion.p>

        <motion.div
          variants={fadeUpVariants}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:gap-x-10"
        >
          <Stat value="15+" label="Years Experience" />
          <Divider />
          <Stat value="30+" label="Active Projects" />
          <Divider />
          <Stat value="1200+" label="Homes Delivered" />
        </motion.div>

        <motion.div
          variants={fadeUpVariants}
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
        >
          <Button
            as="link"
            to="/projects"
            variant="primary"
            size="md"
            withArrow
            className="w-full sm:w-auto"
          >
            Explore Projects
          </Button>
          <ConsultationButton
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
          >
            Schedule Consultation
          </ConsultationButton>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#F8F6F1]/55">Scroll</span>
        <div className="relative h-11 w-px overflow-hidden bg-[#F8F6F1]/20">
          <motion.span
            className="absolute left-0 top-0 h-1/3 w-px bg-[#C9A227]"
            animate={{ y: ['-100%', '300%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="flex items-baseline gap-2">
    <span className="font-serif text-xl text-[#C9A227] sm:text-2xl">{value}</span>
    <span className="text-[10.5px] uppercase tracking-[0.12em] text-[#F8F6F1]/70 sm:text-xs">
      {label}
    </span>
  </div>
);

const Divider = () => (
  <span aria-hidden="true" className="hidden h-4 w-px bg-[#F8F6F1]/20 sm:block" />
);

export default HeroSection;