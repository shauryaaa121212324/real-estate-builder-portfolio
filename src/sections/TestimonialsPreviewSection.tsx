import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { TestimonialCard } from '../components/TestimonialCard';
import type { Testimonial } from '../components/TestimonialCard';
import { staggerContainer, fadeUp } from '../animations/variants';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quote:
      'Three site visits in, we noticed the grout lines matched the floor plan drawings to the millimetre. That obsession shows up everywhere.',
    authorName: 'Rohan Mehta',
    authorTitle: 'Homeowner, 4BHK Pinnacle',
    projectReference: 'Aurelia Skyline',
    rating: 5,
  },
  {
    id: 't2',
    quote:
      'We were nervous about buying a villa still under construction. The monthly photo updates and the patience the team showed with our questions changed that completely.',
    authorName: 'Ananya & Karthik Rao',
    authorTitle: 'Homeowners, Villa 14',
    projectReference: 'Aurelia Grove Villas',
    rating: 5,
  },
  {
    id: 't3',
    quote:
      'I have bought four properties in this city. Aurelia is the only developer that called me back after the cheque cleared.',
    authorName: 'Farah Sheikh',
    authorTitle: 'Investor & Homeowner',
    projectReference: 'Aurelia Terraces',
    rating: 5,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TestimonialsPreviewSection() {
  const navigate = useNavigate();

  return (
    <section id="testimonials" className="relative w-full overflow-hidden bg-[#F8F6F1]">
      <Container className="py-24 sm:py-28 lg:py-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          className="flex flex-col gap-12 lg:gap-16"
        >
          <SectionHeading
            eyebrow="Resident Voices"
            heading="Trusted By Those Who Live It"
            body="Every review below comes from a family who chose to make an Aurelia address their own."
            align="center"
            goldWords={['Trusted']}
          />

          <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                surface="dark"
                index={index}
                className="shadow-[0_20px_50px_rgba(20,19,15,0.12)]"
              />
            ))}
          </div>

          <motion.div variants={fadeUp} className="flex justify-center">
            <Button as="button" onClick={() => navigate('/testimonials')} variant="ghost" size="md" withArrow>
              Read More Stories
            </Button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

export default TestimonialsPreviewSection;