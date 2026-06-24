import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Button } from '../components/ui/Button';
import { ProjectCard } from '../components/ProjectCard';
import { getFeaturedProjects } from '../services/projectService';
import type { ProjectCard as ProjectCardType } from '../types/project';
import { staggerContainer, fadeUp } from '../animations/variants';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HighlightsSection() {
  const [projects, setProjects] = useState<ProjectCardType[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeaturedProjects()
      .then((data) => {
        if (!cancelled) setProjects(data.slice(0, 3));
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="residences" className="relative w-full overflow-hidden bg-[#F8F6F1]">
      <Container className="py-24 sm:py-28 lg:py-32">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10% 0px' }}
          className="flex flex-col gap-12 lg:gap-16"
        >
          {/* Heading row */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
          >
            <SectionHeading
              eyebrow="Featured Developments"
              heading="Residences Worth Arriving Home To"
              body="A curated selection of our most ambitious work — each one a study in proportion, material, and place."
              align="left"
              goldWords={['Home']}
              className="max-w-2xl"
            />
            <Button
              as="link"
              to="/projects"
              variant="ghost"
              size="sm"
              withArrow
              className="shrink-0 border-[#1B1B1B]/15 text-[#1B1B1B] hover:border-[#1B1B1B] hover:bg-[#1B1B1B] hover:text-[#F8F6F1]"
            >
              View All Projects
            </Button>
          </motion.div>

          {/* Project grid */}
          {loading ? (
            /* Skeleton — 3 placeholder cards matching the grid */
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-[#E8E4DC] animate-pulse rounded-sm"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center justify-center py-24 border border-[#1B1B1B]/10"
            >
              <div className="w-8 h-px bg-[#C9A227]/50 mb-6" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1B1B1B]/30 font-sans">
                No featured projects yet
              </p>
              <p className="text-[10px] text-[#1B1B1B]/20 mt-2 tracking-wide">
                Mark a project as featured in the CMS to display it here.
              </p>
              <div className="w-8 h-px bg-[#C9A227]/50 mt-6" />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          )}
        </motion.div>
      </Container>
    </section>
  );
}

export default HighlightsSection;