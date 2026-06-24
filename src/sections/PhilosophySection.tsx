import { motion } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { RuleDivider } from '../components/ui/RuleDivider';
import { ConsultationButton } from '../components/ConsultationModal';
import {
  staggerContainerFast,
  fadeUp,
  fadeIn,
  hoverLift,
  tapScale,
} from '../animations/variants';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Principle {
  index: string;
  title: string;
  description: string;
}

const PRINCIPLES: Principle[] = [
  {
    index: '01',
    title: 'Context First',
    description:
      'Every plan begins with the site itself — its light, its grain, its history — never a template stretched to fit.',
  },
  {
    index: '02',
    title: 'Material Honesty',
    description:
      'Stone reads as stone, wood as wood. We finish materials to reveal their nature, never to disguise it.',
  },
  {
    index: '03',
    title: 'Human Scale',
    description:
      'Ceiling heights, door widths, and sightlines are calibrated to the body first, the skyline second.',
  },
  {
    index: '04',
    title: 'Light & Air',
    description:
      'Cross-ventilation and daylight are load-bearing requirements in our plans, never afterthoughts.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhilosophySection() {
  return (
    <section id="philosophy" className="relative w-full overflow-hidden bg-[#F8F6F1]">
      <Container className="py-24 sm:py-28 lg:py-32">
        <SectionHeading
          eyebrow="Our Philosophy"
          heading="Design Is A Discipline, Not A Decoration"
          body="Four convictions guide every drawing that leaves our studio, long before the first brick is laid."
          align="center"
          goldWords={['Discipline']}
        />

        {/* Manifesto line */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto mt-14 flex max-w-3xl flex-col items-center gap-6 text-center"
        >
          <RuleDivider size="sm" variant="gold" />
          <p className="font-serif text-xl italic leading-relaxed text-[#1B1B1B]/70 sm:text-2xl">
            "A home should outlast the listing photos that sold it."
          </p>
        </motion.div>

        {/* Principles grid */}
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#1B1B1B]/8 bg-[#1B1B1B]/8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4"
        >
          {PRINCIPLES.map((principle) => (
            <motion.div
              key={principle.index}
              variants={fadeUp}
              whileHover={hoverLift}
              whileTap={tapScale}
              className="flex flex-col gap-4 bg-[#F8F6F1] p-7 sm:p-8"
            >
              <span className="font-serif text-sm text-[#C9A227]">{principle.index}</span>
              <h3 className="font-serif text-xl text-[#1B1B1B]">{principle.title}</h3>
              <p className="text-[13.5px] font-light leading-relaxed text-[#1B1B1B]/55">
                {principle.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 flex justify-center lg:mt-16"
        >
          <ConsultationButton variant="gold" size="md" withArrow>
            Schedule A Site Visit
          </ConsultationButton>
        </motion.div>
      </Container>
    </section>
  );
}

export default PhilosophySection;