// =============================================================================
// Autor Builders Admin — RequireAuth
// src/admin/components/RequireAuth.tsx
// =============================================================================
// Wraps any route that needs an authenticated session.
// Redirects unauthenticated visitors to /admin/login.
// Shows a full-screen spinner while the session is being resolved.
// =============================================================================

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// ---------------------------------------------------------------------------
// Loading spinner — minimal, no external deps
// ---------------------------------------------------------------------------

function AuthLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#14130F]">
      <div className="flex flex-col items-center gap-4">
        {/* Gold rule divider mark */}
        <div className="flex w-10 items-center">
          <span className="h-2 w-px bg-[#C9A227]/80" />
          <span className="h-px flex-1 bg-[#C9A227]/80" />
          <span className="h-2 w-px bg-[#C9A227]/80" />
        </div>
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-[#C9A227]/20 border-t-[#C9A227]"
          aria-label="Loading"
        />
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A227]/60">
          Verifying session
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

interface RequireAuthProps {
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}