import { useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { RuleDivider } from '../components/ui/RuleDivider';
import {
  staggerContainer,
  staggerContainerFast,
  fadeUp,
  fadeUpLarge,
  slideInLeft,
} from '../animations/variants';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Pillar {
  index: string;
  title: string;
  description: string;
}

const PILLARS: Pillar[] = [
  {
    index: '01',
    title: 'Design Integrity',
    description:
      'Every elevation begins on the drafting table, not the brochure — form follows a discipline of proportion, light, and material honesty.',
  },
  {
    index: '02',
    title: 'Master Craftsmanship',
    description:
      'From foundation to finish, we partner with artisans and engineers who treat every site as a signature work, never a deadline.',
  },
  {
    index: '03',
    title: 'Enduring Value',
    description:
      'We design for the decades ahead, not the brochure shoot — spaces engineered to hold their worth long after the ribbon is cut.',
  },
];

// ---------------------------------------------------------------------------
// Portrait / cover image block
// ---------------------------------------------------------------------------

function AboutPortrait() {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <motion.div
      variants={slideInLeft}
      className="relative mx-auto w-full max-w-md pb-8 sm:pb-10 lg:mx-0 lg:max-w-none"
    >
      {/* Offset architectural frame */}
      <div
        aria-hidden="true"
        className="absolute -bottom-4 -right-4 hidden h-full w-full rounded-2xl border border-[#C9A227]/30 sm:block"
      />

      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#1C1A15]">
        {!imageFailed ? (
          <img
            src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=85&fit=crop"
            alt="Autor Builders design studio and headquarters"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1C1A15] via-[#14130F] to-[#0F0E0B]">
            <span className="font-serif text-sm uppercase tracking-[0.3em] text-[#F8F6F1]/25">
              Autor Builders
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14130F]/60 via-transparent to-transparent" />
      </div>

      {/* Floating credential card */}
      <div className="absolute -bottom-2 left-6 right-6 flex items-center justify-between gap-4 rounded-xl border border-[#1B1B1B]/8 bg-[#F8F6F1] px-5 py-4 shadow-[0_18px_40px_rgba(20,19,15,0.14)] sm:left-8 sm:right-auto sm:w-64">
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-lg text-[#1B1B1B]">Est. 2009</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#1B1B1B]/45">
            Hyderabad, India
          </span>
        </div>
        <span aria-hidden="true" className="h-9 w-px shrink-0 bg-[#1B1B1B]/10" />
        <span className="font-serif text-lg text-[#C9A227]">15+</span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AboutSection() {
  return (
    <section id="about" className="relative w-full overflow-hidden bg-[#F8F6F1]">
      <Container className="py-24 sm:py-28 lg:py-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center lg:gap-20"
        >
          {/* ── Left: portrait / credential card ── */}
          <AboutPortrait />

          {/* ── Right: narrative ── */}
          <motion.div variants={staggerContainer} className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="About Autor Builders"
              heading="Where Vision Meets Permanence"
              body="For more than fifteen years, we have shaped skylines and redefined what it means to call a space home — blending architectural ambition with uncompromising craftsmanship."
              align="left"
              goldWords={['Permanence']}
            />

            <motion.div
              variants={fadeUpLarge}
              className="flex flex-col gap-5 text-[15px] font-light leading-relaxed text-[#1B1B1B]/65 sm:text-base"
            >
              <p>
                Founded in 2009 by a small collective of architects and engineers, Autor
                Builders began with a single conviction — that luxury real estate should be
                measured not in square footage, but in the quality of life it makes possible.
              </p>
              <p>
                Today, our portfolio spans skyline residences, private villas, and
                master-planned communities across six cities, each shaped by the same
                founding discipline: rigorous design, patient craftsmanship, and an
                unwavering eye for detail.
              </p>
            </motion.div>

            {/* Foundations label */}
            <motion.div variants={fadeUp} className="flex items-center gap-4">
              <RuleDivider size="sm" align="left" variant="gold" animated={false} />
              <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#1B1B1B]/45">
                Our Foundations
              </span>
            </motion.div>

            {/* Pillars */}
            <motion.div
              variants={staggerContainerFast}
              className="flex flex-col divide-y divide-[#1B1B1B]/8"
            >
              {PILLARS.map((pillar) => (
                <motion.div
                  key={pillar.index}
                  variants={fadeUp}
                  className="flex gap-5 py-5 first:pt-0 sm:gap-7"
                >
                  <span className="pt-0.5 font-serif text-sm text-[#C9A227]/80">
                    {pillar.index}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-serif text-lg text-[#1B1B1B] sm:text-xl">
                      {pillar.title}
                    </h3>
                    <p className="text-[13.5px] font-light leading-relaxed text-[#1B1B1B]/55">
                      {pillar.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button as="a" href="#philosophy" variant="ghost" size="md" withArrow>
                Discover Our Philosophy
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

export default AboutSection;