import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from './ui/Container';
import { useConsultation } from './ConsultationModal';

// ---------------------------------------------------------------------------
// Variants (inlined — swap to import from animations/variants once in place)
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_LUXURY } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type FooterLink =
  | { label: string; kind: 'route'; to: string }
  | { label: string; kind: 'hash'; to: string }
  | { label: string; kind: 'consultation' };

const NAV_COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Projects',
    links: [
      { label: 'All Projects',  kind: 'route', to: '/projects' },
      { label: 'Ongoing',       kind: 'route', to: '/projects?status=ongoing' },
      { label: 'Ready to Move', kind: 'route', to: '/projects?status=ready_to_move' },
      { label: 'Upcoming',      kind: 'route', to: '/projects?status=upcoming' },
      { label: 'Completed',     kind: 'route', to: '/projects?status=completed' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'Our Philosophy', kind: 'hash',  to: '/#philosophy' },
      { label: 'About Us',       kind: 'route', to: '/about' },
      { label: 'Contact',        kind: 'route', to: '/contact' },
    ],
  },
  {
    heading: 'Buyers',
    links: [
      { label: 'Schedule a Visit',  kind: 'consultation' },
      { label: 'Download Brochure', kind: 'route', to: '/projects' },
      { label: 'Home Loan Assist',  kind: 'route', to: '/contact?subject=home-loan-assistance' },
      { label: 'NRI Desk',          kind: 'route', to: '/contact?subject=nri-desk' },
      { label: 'FAQs',              kind: 'route', to: '/contact' },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'LinkedIn',  href: 'https://linkedin.com',  icon: LinkedInIcon  },
  { label: 'YouTube',   href: 'https://youtube.com',   icon: YouTubeIcon   },
  { label: 'Facebook',  href: 'https://facebook.com',  icon: FacebookIcon  },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy',   href: '#privacy'  },
  { label: 'Terms of Use',     href: '#terms'    },
  { label: 'Cookie Policy',    href: '#cookies'  },
  { label: 'RERA Disclosures', href: '#rera'     },
];

// ---------------------------------------------------------------------------
// Inline SVG icons (lucide-style, 20×20 stroke)
// ---------------------------------------------------------------------------

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Architectural rule — matches hero / RuleDivider pattern
// ---------------------------------------------------------------------------

function Rule({ className = '' }: { className?: string }) {
  return (
    <div className={['flex items-center', className].join(' ')}>
      <span className="h-2 w-px shrink-0 bg-[#C9A227]/50" />
      <span className="h-px flex-1 bg-[#C9A227]/50" />
      <span className="h-2 w-px shrink-0 bg-[#C9A227]/50" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { open: openConsultation } = useConsultation();

  // Navigates to the target path + hash. PublicLayout watches the route's
  // hash and scrolls to that section (with a retry, since the target page
  // may have just mounted). The one edge case it can't catch is clicking a
  // link to a hash you're already sitting on — the hash value doesn't
  // change, so nothing re-triggers — so that case is scrolled directly here.
  const handleHashLink = (hashTo: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const [path, hash] = hashTo.split('#');
    const targetPath = path || '/';
    const alreadyThere =
      window.location.pathname === targetPath && window.location.hash === `#${hash}`;
    if (alreadyThere) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(hashTo);
    }
  };

  return (
    <footer className="relative w-full bg-[#14130F] text-[#F8F6F1]">

      {/* Top accent line */}
      <Rule className="w-full opacity-60" />

      {/* Main content */}
      <Container as="div" className="py-16 sm:py-20 lg:py-24">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-8% 0px' }}
          className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16"
        >

          {/* ── Left: Brand block ── */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-baseline gap-2 w-fit">
              <span className="font-serif text-2xl tracking-[0.04em] text-[#F8F6F1]">
                Autor
              </span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#C9A227]">
                Builders
              </span>
            </Link>

            {/* Tagline */}
            <p className="max-w-xs text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/55">
              Crafting architectural legacies since 2009 — where uncompromising
              design, enduring craftsmanship, and visionary scale converge.
            </p>

            {/* Social */}
            <div className="flex items-center gap-3 pt-1">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F8F6F1]/12 text-[#F8F6F1]/50 transition-all duration-300 hover:border-[#C9A227]/60 hover:text-[#C9A227]"
                >
                  <Icon />
                </a>
              ))}
            </div>

            {/* Contact snippet */}
            <div className="flex flex-col gap-1.5 pt-1">
              <a
                href="tel:+914012345678"
                className="text-[12px] tracking-wide text-[#F8F6F1]/45 transition-colors duration-300 hover:text-[#C9A227]"
              >
                +91 40 1234 5678
              </a>
              <a
                href="mailto:hello@autorbuilders.com"
                className="text-[12px] tracking-wide text-[#F8F6F1]/45 transition-colors duration-300 hover:text-[#C9A227]"
              >
                hello@autorbuilders.com
              </a>
            </div>
          </motion.div>

          {/* ── Right: Nav columns ── */}
          <motion.div
            variants={stagger}
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {NAV_COLUMNS.map((col) => (
              <motion.div key={col.heading} variants={fadeUp} className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A227]">
                  {col.heading}
                </span>
                <ul className="flex flex-col gap-3">
                  {col.links.map((link) => {
                    const linkClassName =
                      'text-[13px] font-light text-[#F8F6F1]/50 transition-colors duration-300 hover:text-[#F8F6F1]';

                    if (link.kind === 'route') {
                      return (
                        <li key={link.label}>
                          <Link to={link.to} className={linkClassName}>
                            {link.label}
                          </Link>
                        </li>
                      );
                    }

                    if (link.kind === 'hash') {
                      return (
                        <li key={link.label}>
                          <a
                            href={link.to}
                            onClick={handleHashLink(link.to)}
                            className={linkClassName}
                          >
                            {link.label}
                          </a>
                        </li>
                      );
                    }

                    // kind === 'consultation' — opens the existing booking modal
                    return (
                      <li key={link.label}>
                        <button
                          type="button"
                          onClick={openConsultation}
                          className={`text-left ${linkClassName}`}
                        >
                          {link.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>

        {/* RERA notice */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 rounded-xl border border-[#F8F6F1]/6 bg-[#F8F6F1]/[0.03] px-6 py-4"
        >
          <p className="text-[11px] leading-relaxed text-[#F8F6F1]/30">
            <span className="mr-2 text-[#C9A227]/70">RERA</span>
            All projects are registered under the Real Estate (Regulation and Development) Act, 2016.
            The information provided on this website is for general information purposes only and does
            not constitute an offer or solicitation to buy/sell any real estate product. Prices,
            specifications, and availability are subject to change without notice. Please verify all
            details with the sales team before making any investment decisions.
          </p>
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-14 rounded-xl border border-[#F8F6F1]/6 bg-[#F8F6F1]/[0.03] px-6 py-4"
        >
          <p className="text-[11px] leading-relaxed text-[#ffffff]/30">
            <span className="mr-2 text-[#C9A227]/70">*README</span>
            Concept portfolio project. Not affiliated with any real estate company.
          </p>
        </motion.div>
      </Container>
      

      {/* Bottom bar */}
      <div className="border-t border-[#F8F6F1]/6">
        <Container as="div" className="py-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-[11px] text-[#F8F6F1]/30">
              © {currentYear} Autor Builders Pvt. Ltd. All rights reserved.
            </p>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map((link, i) => (
                <li key={link.label} className="flex items-center gap-5">
                  <a
                    href={link.href}
                    className="text-[11px] text-[#F8F6F1]/30 transition-colors duration-300 hover:text-[#F8F6F1]/60"
                  >
                    {link.label}
                  </a>
                  {i < LEGAL_LINKS.length - 1 && (
                    <span aria-hidden="true" className="h-3 w-px bg-[#F8F6F1]/12" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>

    </footer>
  );
}

export default Footer;