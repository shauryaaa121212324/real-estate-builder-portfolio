import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
//import { Button } from '../components/ui/Button';
import { ConsultationButton } from '../components/ConsultationModal';

const NAV_LINKS = [
  { label: 'Projects',     to: '/projects'     },
  { label: 'About',        to: '/about'        },
  { label: 'Gallery',      to: '/gallery'      },
  { label: 'Testimonials', to: '/testimonials' },
  { label: 'Contact',      to: '/contact'      },
];

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Routes that open on a full-bleed, true full-viewport dark hero (image/video
// directly behind the fixed header). Only these get the "fully transparent
// at the very top" treatment — everywhere else the navbar uses the refined
// dark-translucent treatment from first paint, since there's no guarantee
// of a dark surface sitting behind it.
const isImmersiveHeroRoute = (pathname: string) =>
  pathname === '/' || /^\/projects\/[^/]+\/?$/.test(pathname);

const Navbar = () => {
  const { pathname } = useLocation();
  // Lazy-init so a refresh (or back/forward nav) with the page already
  // scrolled doesn't flash the transparent style for a frame.
  const [isScrolled, setIsScrolled] =
    useState(() => typeof window !== 'undefined' && window.scrollY > 40);
  const [isMobileMenuOpen, setMobileMenu] = useState(false);

  const hasImmersiveHero = isImmersiveHeroRoute(pathname);
  // The "solid" (dark-translucent) treatment shows once scrolled on hero
  // routes, and shows unconditionally — from the very first render — on
  // every other route, so the navbar is always readable.
  const showSolidNav = hasImmersiveHero ? isScrolled : true;

  // Measure the header's real rendered height and publish it as a CSS
  // variable on the document root. This lets other fixed/sticky elements
  // (e.g. the Gallery page's sticky filter bar) position themselves
  // directly below the navbar without hardcoding a guessed pixel offset —
  // it stays correct even while the header animates between its
  // top/scrolled padding states.
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const publishHeight = () => {
      document.documentElement.style.setProperty('--navbar-height', `${node.offsetHeight}px`);
    };
    publishHeight();

    const observer = new ResizeObserver(publishHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Close mobile menu on every route change.
  useEffect(() => {
    setMobileMenu(false);
  }, [pathname]);

  // Sticky / glass transition on scroll.
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Auto-close on viewport resize to desktop.
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setMobileMenu(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Exact match for "/" so it doesn't mark everything as active.
  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <>
      {/* ── Fixed header bar ── z-50 */}
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          showSolidNav ? 'py-3' : 'py-6'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div
            className={`flex items-center justify-between rounded-full border px-5 py-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-7 ${
              showSolidNav
                ? 'border-[rgba(201,169,78,0.16)] bg-[rgba(16,15,12,0.78)] backdrop-blur-[14px]'
                : 'border-white/15 bg-white/6 backdrop-blur-md'
            }`}
          >
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-baseline gap-2">
              <span className="font-serif text-lg tracking-[0.1em] text-[#F8F6F1] sm:text-xl">
                Autor Builders
              </span>
            </Link>

            {/* Desktop links */}
            <nav className="hidden items-center gap-9 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="group relative text-[12.5px] uppercase tracking-[0.14em] text-[#F8F6F1]/80 transition-colors duration-500 hover:text-[#F8F6F1]"
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 h-px w-full bg-[#C9A227] transition-transform duration-300 ease-out ${
                      isActive(link.to) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              ))}
            </nav>

            {/* CTA + hamburger */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Desktop CTA — opens consultation modal */}
              <ConsultationButton
                variant="secondary"
                size="sm"
                className="hidden md:inline-flex"
              >
                Schedule Consultation
              </ConsultationButton>

              {/* Hamburger — z-[60] so it stays above the mobile overlay */}
              <button
                type="button"
                onClick={() => setMobileMenu((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                className="relative z-[60] flex h-9 w-9 flex-col items-center justify-center gap-[6px] lg:hidden"
              >
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_LUXURY }}
                  className="block h-px w-6 bg-[#F8F6F1] transition-colors duration-500"
                />
                <motion.span
                  animate={isMobileMenuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_LUXURY }}
                  className="block h-px w-6 bg-[#F8F6F1] transition-colors duration-500"
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu overlay ── z-[55] sits between header (50) and hamburger (60) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_LUXURY }}
            className="fixed inset-0 z-[55] bg-[#14130F]/97 backdrop-blur-2xl lg:hidden"
          >
            <nav className="flex h-full flex-col items-center justify-center gap-7 px-6">
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.07, duration: 0.5, ease: EASE_LUXURY }}
                >
                  <Link
                    to={link.to}
                    className={`font-serif text-3xl tracking-wide transition-colors duration-300 ${
                      isActive(link.to) ? 'text-[#C9A227]' : 'text-[#F8F6F1]'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.12 + NAV_LINKS.length * 0.07,
                  duration: 0.5,
                  ease: EASE_LUXURY,
                }}
              >
                {/* Mobile CTA — opens modal and closes mobile menu */}
                <ConsultationButton
                  variant="gold"
                  size="sm"
                  className="mt-5"
                >
                  Schedule Consultation
                </ConsultationButton>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;