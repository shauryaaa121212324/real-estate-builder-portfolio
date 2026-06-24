import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ConsultationProvider } from '../components/ConsultationModal';

export default function PublicLayout() {
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname, search, hash } = useLocation();

  // Smooth scroll engine — one instance for the whole public site.
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let frameId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top on every route change (including query-param-only changes,
  // e.g. /projects -> /projects?status=ongoing, which don't alter pathname).
  // If the URL carries a hash, scroll to that section instead — the target
  // page may have just mounted, so retry briefly until the element exists.
  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let attempts = 0;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else if (attempts < 20) {
          attempts += 1;
          requestAnimationFrame(tryScroll);
        }
      };
      tryScroll();
      return;
    }

    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, search, hash]);

  return (
    <ConsultationProvider>
      <div className="relative min-h-screen w-full bg-[#F8F6F1] font-sans text-[#1B1B1B] antialiased">
        <Navbar />
        <main>
          <Outlet />
        </main>
        <Footer />
      </div>
    </ConsultationProvider>
  );
}