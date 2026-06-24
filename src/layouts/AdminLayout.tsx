// =============================================================================
// Autor Builders Admin — AdminLayout
// src/layouts/AdminLayout.tsx
// =============================================================================
// Sidebar + topbar shell for all authenticated admin pages.
// Sidebar collapses to a bottom nav on mobile.
// =============================================================================

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../admin/hooks/useAuth';

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function DashboardIcon({ className = 'h-4.5 w-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function LeadsIcon({ className = 'h-4.5 w-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ProjectsIcon({ className = 'h-4.5 w-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function MediaIcon({ className = 'h-4.5 w-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18a1.5 1.5 0 001.5-1.5V4.5A1.5 1.5 0 0021 3H3a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 003 21zM9.75 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function TestimonialsIcon({ className = 'h-4.5 w-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3.75h6m-9 6.75a18 18 0 00-7.5 0M2.25 12c0-1.61.704-3.054 1.823-4.043M21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 1.658.413 3.22 1.143 4.59L2.25 21.75l5.16-1.143A9.708 9.708 0 0012 21.75c5.385 0 9.75-4.365 9.75-9.75z" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/admin',         Icon: DashboardIcon },
  { label: 'Leads',     to: '/admin/leads',   Icon: LeadsIcon },
  { label: 'Projects',  to: '/admin/projects', Icon: ProjectsIcon },
  { label: 'Media',     to: '/admin/media',   Icon: MediaIcon },
  { label: 'Testimonials', to: '/admin/testimonials', Icon: TestimonialsIcon },
];

// ---------------------------------------------------------------------------
// Nav link styles
// ---------------------------------------------------------------------------

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-light transition-all duration-200',
    isActive
      ? 'bg-[#C9A227]/12 text-[#C9A227] border border-[#C9A227]/20'
      : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent',
  ].join(' ');

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#14130F] border-r border-white/6 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/6">
        <div className="flex w-10 items-center mb-3">
          <span className="h-2 w-px bg-[#C9A227]/80" />
          <span className="h-px flex-1 bg-[#C9A227]/80" />
          <span className="h-2 w-px bg-[#C9A227]/80" />
        </div>
        <p className="font-serif text-[15px] text-white leading-tight">Autor Builders</p>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/35 mt-0.5">Admin Console</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={navLinkClass}
          >
            <span className="shrink-0"><item.Icon /></span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-5 border-t border-white/6">
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-light text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile bottom nav
// ---------------------------------------------------------------------------

function MobileNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#14130F] border-t border-white/8 flex">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/admin'}
          className={({ isActive }) =>
            [
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] uppercase tracking-[0.1em] transition-colors duration-200',
              isActive ? 'text-[#C9A227]' : 'text-white/35 hover:text-white/60',
            ].join(' ')
          }
        >
          <item.Icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Top bar (mobile header)
// ---------------------------------------------------------------------------

function TopBar({ onSignOut }: { onSignOut: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-[#14130F] border-b border-white/6 px-4 py-3.5">
      <div>
        <p className="font-serif text-[14px] text-white">Autor Builders</p>
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/35">Admin</p>
      </div>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white/80 transition-colors"
          aria-label="Admin menu"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-10 w-40 rounded-xl bg-[#1C1A14] border border-white/8 shadow-xl overflow-hidden z-50">
            <button
              onClick={() => { setMenuOpen(false); onSignOut(); }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-[12.5px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#0F0E0A]">
      <Sidebar onSignOut={handleSignOut} />

      <div className="flex flex-1 flex-col min-w-0">
        <TopBar onSignOut={handleSignOut} />

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}