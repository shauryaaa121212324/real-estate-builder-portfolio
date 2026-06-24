import { motion } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { RuleDivider } from '../components/ui/RuleDivider';
import { fadeUp, scaleRevealDown } from '../animations/variants';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface StatItem {
  value: number;
  suffix?: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: 15, suffix: '+', label: 'Years of Excellence' },
  { value: 30, suffix: '+', label: 'Active Developments' },
  { value: 1200, suffix: '+', label: 'Homes Delivered' },
  { value: 6, suffix: '+', label: 'Cities Present' },
  { value: 98, suffix: '%', label: 'Client Satisfaction' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SignatureNumbersSection() {
  return (
    <section id="numbers" className="relative w-full overflow-hidden bg-[#F8F6F1]">
      <Container className="py-24 sm:py-28 lg:py-32">
        <SectionHeading
          eyebrow="Signature Numbers"
          heading="The Scale Of Our Ambition"
          body="Every figure below represents a family housed, a skyline reshaped, and a promise of permanence kept."
          align="center"
          goldWords={['Scale']}
        />

        {/* Stats panel */}
        <motion.div
          variants={scaleRevealDown}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          className="relative mt-16 overflow-hidden rounded-2xl border border-[#1B1B1B]/8 bg-white/40 px-6 py-12 shadow-[0_20px_60px_rgba(20,19,15,0.06)] sm:px-10 lg:mt-20 lg:px-14"
        >
          <RuleDivider align="center" size="md" variant="gold" className="mb-10" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-[#1B1B1B]/10">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-center px-2 lg:px-4"
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} label={stat.label} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footnote */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto mt-10 max-w-2xl text-center text-[12.5px] font-light leading-relaxed text-[#1B1B1B]/40"
        >
          Figures reflect cumulative project delivery across Hyderabad, Bengaluru, and
          Chennai as of 2026.
        </motion.p>
      </Container>
    </section>
  );
}

export default SignatureNumbersSection;