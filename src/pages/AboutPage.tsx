import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { RuleDivider } from '../components/ui/RuleDivider';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { Button } from '../components/ui/Button';
import { Seo } from '../components/Seo';
import {
  //EASE_LUXURY,
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  fadeUp,
  fadeUpLarge,
  //fadeIn,
  lineRevealY,
  scaleRevealX,
  slideInLeft,
  slideInRight,
  scaleReveal,
  hoverLift,
  tapScale,
} from '../animations/variants';

// ---------------------------------------------------------------------------
// SEO constants
// ---------------------------------------------------------------------------

const PAGE_TITLE = 'About Us | Autor Builders';
const PAGE_DESCRIPTION =
  'Since 2009, Autor Builders has shaped skylines across six Indian cities — 1,200+ homes delivered through design integrity, master craftsmanship, and enduring value.';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STATS = [
  { value: 15, suffix: '+', label: 'Years of Excellence' },
  { value: 1200, suffix: '+', label: 'Homes Delivered' },
  { value: 30, suffix: '+', label: 'Active Projects' },
  { value: 6, suffix: '', label: 'Cities Served' },
];

const TIMELINE = [
  {
    year: '2009',
    title: 'The Founding Vision',
    description:
      'A small collective of architects and structural engineers established Autor Builders in Hyderabad with a single conviction — that luxury real estate should be defined by quality of life, not merely square footage.',
  },
  {
    year: '2012',
    title: 'First Skyline Milestone',
    description:
      'Completion of Autor Pinnacle, our inaugural high-rise, set new benchmarks for residential design in the city. 240 families moved in — and the waiting list began.',
  },
  {
    year: '2015',
    title: 'Expansion Across the Deccan',
    description:
      'With footprints established in Pune and Bengaluru, we crossed 500 homes delivered. Our design studio grew to 60 professionals — architects, landscape designers, and materials specialists.',
  },
  {
    year: '2018',
    title: 'Master-Planned Communities',
    description:
      'Launch of our first fully integrated township, Autor Enclave — 42 acres of residences, retail, and green corridors planned as a self-sustaining urban ecosystem.',
  },
  {
    year: '2021',
    title: 'Sustainability Charter',
    description:
      'Every project from this year forward is designed to IGBC Green Homes standards. We became the first developer in Telangana to receive the IGBC Platinum certification across three simultaneous projects.',
  },
  {
    year: '2024',
    title: 'A Landmark Decade Ahead',
    description:
      'With 1,200+ homes delivered and 30 active projects across six cities, Autor Builders enters its next chapter: designing for the next generation of residents, not just the next financial quarter.',
  },
];

const VALUES = [
  {
    index: '01',
    title: 'Design Integrity',
    description:
      'Every elevation begins at the drafting table — form follows a discipline of proportion, natural light, and material honesty. We never start with a template.',
  },
  {
    index: '02',
    title: 'Master Craftsmanship',
    description:
      'From foundation pour to finish carpentry, we partner with artisans and engineers who treat every site as a signature work — never a deadline to be rushed.',
  },
  {
    index: '03',
    title: 'Enduring Value',
    description:
      'We build for the decades ahead. Every structural choice, every material specification is made to ensure that our homes hold their worth and their beauty long after the ribbon is cut.',
  },
  {
    index: '04',
    title: 'Resident-Centred Planning',
    description:
      'Community spaces are designed by studying how people actually live — morning routines, evening walks, the distance between the kitchen and the school gate.',
  },
  {
    index: '05',
    title: 'Environmental Stewardship',
    description:
      'Rainwater harvesting, passive cooling, solar-ready rooftops, and native-species landscaping are standard specifications — not optional upgrades.',
  },
  {
    index: '06',
    title: 'Transparent Partnership',
    description:
      'We believe every buyer deserves to understand exactly what they are purchasing. Construction updates, RERA milestones, and occupancy timelines are published proactively.',
  },
];

const WHY_CHOOSE = [
  {
    icon: '⬡',
    title: 'RERA Compliant in All States',
    body: 'Every Autor Builders project is registered with the respective state RERA authority — giving buyers full legal transparency and recourse.',
  },
  {
    icon: '⬡',
    title: 'In-House Design Studio',
    body: 'We do not outsource our architecture. Our 60-person design team works exclusively on Autor Builders projects, ensuring design coherence from concept to handover.',
  },
  {
    icon: '⬡',
    title: 'On-Time Delivery Track Record',
    body: 'We have delivered 94% of projects within the promised timeline — a figure we publish publicly and stand behind unconditionally.',
  },
  {
    icon: '⬡',
    title: 'Post-Handover Care',
    body: 'Our dedicated homeowner services team manages every warranty, maintenance request, and community concern for five years after possession.',
  },
];

// ---------------------------------------------------------------------------
// Section: Hero
// ---------------------------------------------------------------------------

function AboutHero() {
  return (
    <section className="relative min-h-[70vh] w-full overflow-hidden bg-[#14130F] flex items-center">
      {/* Textured background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 59px,
            #C9A227 59px,
            #C9A227 60px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 59px,
            #C9A227 59px,
            #C9A227 60px
          )`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#14130F]/30 via-transparent to-[#14130F]" />

      <Container className="relative z-10 py-32 sm:py-40">
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Rule */}
          <motion.div
            variants={scaleRevealX}
            style={{ originX: 0.5 }}
            className="flex w-20 items-center mb-6"
          >
            <span className="h-2 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
            <span className="h-2 w-px bg-[#C9A227]/80" />
          </motion.div>

          <motion.span
            variants={fadeUp}
            className="text-[11px] uppercase tracking-[0.38em] text-[#F8F6F1]/50 mb-6"
          >
            Est. 2009 · Hyderabad, India
          </motion.span>

          <div className="overflow-hidden mb-6">
            <motion.h1
              variants={lineRevealY}
              className="font-serif text-[2.8rem] leading-[1.1] text-[#F8F6F1] sm:text-6xl md:text-7xl lg:text-[5rem]"
            >
              Building More Than{' '}
              <em className="not-italic text-[#C9A227]">Homes</em>
            </motion.h1>
          </div>

          <motion.p
            variants={fadeUp}
            className="max-w-2xl text-[15px] font-light leading-relaxed text-[#F8F6F1]/60 sm:text-base"
          >
            For fifteen years, we have shaped skylines and transformed the way
            families experience space — blending architectural ambition with
            uncompromising craftsmanship across six Indian cities.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10">
            <Button as="a" href="/contact" variant="gold" size="md" withArrow>
              Schedule a Consultation
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Stats
// ---------------------------------------------------------------------------

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section className="w-full bg-[#F8F6F1] border-y border-[#1B1B1B]/6">
      <Container>
        <motion.div
          ref={ref}
          variants={staggerContainerFast}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 divide-x divide-y divide-[#1B1B1B]/8 md:grid-cols-4 md:divide-y-0"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="flex flex-col items-center gap-2 px-6 py-12 sm:py-14 text-center"
            >
              <AnimatedCounter
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                duration={2000}
              />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Story
// ---------------------------------------------------------------------------

function StorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section className="w-full bg-[#F8F6F1] overflow-hidden">
      <Container className="py-24 sm:py-28 lg:py-36">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center lg:gap-24"
        >
          {/* Image block */}
          <motion.div
            variants={slideInLeft}
            className="relative mx-auto w-full max-w-md pb-8 lg:mx-0 lg:max-w-none"
          >
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -right-5 hidden h-full w-full rounded-2xl border border-[#C9A227]/25 sm:block"
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#1C1A15]">
              <img
                src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=85&fit=crop"
                alt="Autor Builders architectural drafting studio"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14130F]/50 via-transparent to-transparent" />
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-4 left-6 right-6 flex items-center justify-between gap-4 rounded-xl border border-[#1B1B1B]/8 bg-[#F8F6F1] px-5 py-4 shadow-[0_18px_40px_rgba(20,19,15,0.12)] sm:left-8 sm:right-auto sm:w-64">
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-lg text-[#1B1B1B]">Est. 2009</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-[#1B1B1B]/45">
                  Hyderabad, India
                </span>
              </div>
              <span aria-hidden="true" className="h-9 w-px shrink-0 bg-[#1B1B1B]/10" />
              <span className="font-serif text-2xl text-[#C9A227]">15+</span>
            </div>
          </motion.div>

          {/* Text block */}
          <motion.div variants={staggerContainer} className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Our Story"
              heading="Where Vision Meets Permanence"
              align="left"
              goldWords={['Permanence']}
            />

            <motion.div
              variants={fadeUpLarge}
              className="flex flex-col gap-5 text-[15px] font-light leading-relaxed text-[#1B1B1B]/65 sm:text-base"
            >
              <p className="text-[#1B1B1B]/65">
                Founded in 2009 by a collective of architects, engineers, and urban
                planners, Autor Builders began with a single conviction: that luxury real
                estate should be measured not in square footage, but in the quality of
                life it makes possible.
              </p>
              <p className="text-[#1B1B1B]/65">
                Our first project — a 72-unit residential tower in Hyderabad — sold out
                before the foundation slab was poured. Families did not buy floor plans.
                They bought a promise: that every detail, from the orientation of the
                living room to the width of the corridor, had been deliberated for their
                comfort.
              </p>
              <p className="text-[#1B1B1B]/65">
                Today, that promise governs 30 active projects across six cities. The
                scale has changed. The discipline has not.
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button as="a" href="/contact" variant="ghost" size="md" withArrow>
                Begin Your Journey
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Mission & Vision
// ---------------------------------------------------------------------------

function MissionVisionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section className="w-full bg-[#14130F] overflow-hidden">
      <Container className="py-24 sm:py-28 lg:py-32">
        {/* Heading */}
        <div className="mb-16 sm:mb-20 ">
          <SectionHeading
  eyebrow="Purpose"
  heading="Mission & Vision"
  goldWords={['Vision']}
  align="center"
  theme="dark"
/>
        </div>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10"
        >
          {/* Mission */}
          <motion.div
            variants={slideInLeft}
            className="relative overflow-hidden rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-8 sm:p-10"
          >
            {/* Background number */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -top-4 select-none font-serif text-[9rem] leading-none text-[#F8F6F1]/[0.025]"
            >
              M
            </span>

            <div className="relative flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <RuleDivider size="sm" variant="gold" align="left" animated={false} />
                <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#F8F6F1]/45">
                  Our Mission
                </span>
              </div>
              <h3 className="font-serif text-2xl leading-snug text-[#F8F6F1] sm:text-3xl">
                To create spaces that{' '}
                <span className="text-[#C9A227]">elevate life</span> — not just
                house it.
              </h3>
              <p className="text-[14.5px] font-light leading-relaxed text-[#F8F6F1]/55">
                Every home we design and build must earn its place in the lives of the
                people who inhabit it. We measure success not at handover, but ten years
                later — when the families who trusted us still find pride in their
                address.
              </p>
            </div>
          </motion.div>

          {/* Vision */}
          <motion.div
            variants={slideInRight}
            className="relative overflow-hidden rounded-2xl border border-[#C9A227]/20 bg-gradient-to-br from-[#C9A227]/10 via-[#1C1A15] to-[#14130F] p-8 sm:p-10"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -top-4 select-none font-serif text-[9rem] leading-none text-[#C9A227]/[0.06]"
            >
              V
            </span>

            <div className="relative flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <RuleDivider size="sm" variant="gold" align="left" animated={false} />
                <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#F8F6F1]/45">
                  Our Vision
                </span>
              </div>
              <h3 className="font-serif text-2xl leading-snug text-[#F8F6F1] sm:text-3xl">
                To become India's most{' '}
                <span className="text-[#C9A227]">trusted</span> name in
                residential architecture.
              </h3>
              <p className="text-[14.5px] font-light leading-relaxed text-[#F8F6F1]/55">
                Trust is earned on a foundation of consistent delivery, radical
                transparency, and the kind of quality that speaks for itself — long
                before any brochure does. We intend to hold that standard across every
                city, every decade, and every project we take on.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Timeline
// ---------------------------------------------------------------------------

function TimelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5% 0px' });

  return (
    <section className="w-full bg-[#F8F6F1] overflow-hidden">
      <Container className="py-24 sm:py-28 lg:py-36">
        <div className="mb-16 sm:mb-20">
          <SectionHeading
            eyebrow="Our Journey"
            heading="Fifteen Years of Milestones"
            goldWords={['Milestones']}
            align="center"
          />
        </div>

        <motion.div
          ref={ref}
          variants={staggerContainerFast}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="relative"
        >
          {/* Vertical spine — desktop */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[#1B1B1B]/8 lg:block"
          />

          <div className="flex flex-col gap-0">
            {TIMELINE.map((item, index) => {
              const isLeft = index % 2 === 0;
              return (
                <motion.div
                  key={item.year}
                  variants={fadeUp}
                  className={`relative flex flex-col gap-4 py-8 sm:py-10 lg:py-12 ${
                    isLeft
                      ? 'lg:flex-row lg:pr-[calc(50%+3rem)]'
                      : 'lg:flex-row-reverse lg:pl-[calc(50%+3rem)]'
                  }`}
                >
                  {/* Year pill */}
                  <div
                    className={`flex shrink-0 items-center gap-3 lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:gap-1`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227]/40 bg-[#F8F6F1] shadow-[0_0_0_6px_#F8F6F1] shrink-0">
                      <span className="h-2 w-2 rounded-full bg-[#C9A227]" />
                    </span>
                    <span className="font-serif text-sm text-[#C9A227] lg:hidden">
                      {item.year}
                    </span>
                  </div>

                  {/* Card */}
                  <div className="group rounded-2xl border border-[#1B1B1B]/8 bg-white p-6 shadow-[0_4px_24px_rgba(20,19,15,0.05)] transition-shadow duration-500 hover:shadow-[0_12px_40px_rgba(20,19,15,0.10)] sm:p-8">
                    <span className="hidden font-serif text-sm text-[#C9A227] lg:block mb-3">
                      {item.year}
                    </span>
                    <h3 className="font-serif text-xl text-[#1B1B1B] sm:text-2xl mb-3">
                      {item.title}
                    </h3>
                    <p className="text-[14px] font-light leading-relaxed text-[#1B1B1B]/60">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Core Values
// ---------------------------------------------------------------------------

function CoreValuesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section className="w-full bg-[#14130F] overflow-hidden">
      <Container className="py-24 sm:py-28 lg:py-32">
        <div className="mb-16 sm:mb-20">
<SectionHeading
  eyebrow="What We Stand For"
  heading="Core Values"
  goldWords={['Core']}
  align="center"
  theme="dark"
/>
        </div>

        <motion.div
          ref={ref}
          variants={staggerContainerFast}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {VALUES.map((value) => (
            <motion.div
              key={value.index}
              variants={scaleReveal}
              whileHover={hoverLift}
              whileTap={tapScale}
              className="group flex flex-col gap-5 rounded-2xl border border-[#F8F6F1]/6 bg-[#1C1A15] p-7 transition-colors duration-500 hover:border-[#C9A227]/25 sm:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-sm text-[#C9A227]/70">
                  {value.index}
                </span>
                <div className="h-px w-10 bg-[#C9A227]/30 transition-all duration-500 group-hover:w-16 group-hover:bg-[#C9A227]/60" />
              </div>
              <h3 className="font-serif text-xl text-[#F8F6F1] sm:text-2xl">
                {value.title}
              </h3>
              <p className="text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/50">
                {value.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Why Choose Autor Builders
// ---------------------------------------------------------------------------

function WhyChooseSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });

  return (
    <section className="w-full bg-[#F8F6F1] overflow-hidden">
      <Container className="py-24 sm:py-28 lg:py-36">
        <div className="mb-16 sm:mb-20">
          <SectionHeading
            eyebrow="The Difference"
            heading="Why Buyers Choose Autor Builders"
            goldWords={['Autor', 'Builders']}
            align="center"
          />
        </div>

        <motion.div
          ref={ref}
          variants={staggerContainerFast}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {WHY_CHOOSE.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="flex gap-6 rounded-2xl border border-[#1B1B1B]/8 bg-white p-7 shadow-[0_2px_16px_rgba(20,19,15,0.04)] sm:p-8"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/40 bg-[#C9A227]/8">
                <span className="text-[#C9A227] text-sm">✓</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-serif text-lg text-[#1B1B1B] sm:text-xl">
                  {item.title}
                </h3>
                <p className="text-[13.5px] font-light leading-relaxed text-[#1B1B1B]/60">
                  {item.body}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: CTA
// ---------------------------------------------------------------------------

function AboutCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });

  return (
    <section className="w-full bg-[#14130F] overflow-hidden">
      <Container className="py-24 sm:py-28 lg:py-32">
        <motion.div
          ref={ref}
          variants={staggerContainerSlow}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex flex-col items-center text-center gap-8"
        >
          <RuleDivider size="md" variant="gold" align="center" />

          <motion.span
            variants={fadeUp}
            className="text-[11px] uppercase tracking-[0.38em] text-[#F8F6F1]/45"
          >
            Begin Your Journey
          </motion.span>

          <div className="overflow-hidden">
            <motion.h2
              variants={lineRevealY}
              className="font-serif text-[2.2rem] leading-[1.1] text-[#F8F6F1] sm:text-5xl md:text-6xl"
            >
              Ready to Find Your{' '}
              <span className="text-[#C9A227]">Perfect Home?</span>
            </motion.h2>
          </div>

          <motion.p
            variants={fadeUp}
            className="max-w-xl text-[15px] font-light leading-relaxed text-[#F8F6F1]/55"
          >
            Speak with one of our property consultants — at no obligation. We will walk
            you through every active project, match your requirements to the right
            community, and answer every question before you take a single step forward.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5 mt-2"
          >
            <Button as="a" href="/contact" variant="gold" size="lg" withArrow>
              Schedule Consultation
            </Button>
            <Button as="a" href="/projects" variant="secondary" size="lg">
              Explore Projects
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AboutPage() {
  return (
    <main className="w-full">
      <Seo title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/about" />
      <AboutHero />
      <StatsSection />
      <StorySection />
      <MissionVisionSection />
      <TimelineSection />
      <CoreValuesSection />
      <WhyChooseSection />
      <AboutCTA />
    </main>
  );
}