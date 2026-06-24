// =============================================================================
// Autor Builders Admin — Login Page
// src/admin/pages/LoginPage.tsx
// =============================================================================
// Email + password sign-in via Supabase Auth.
// Redirects to /admin (or the original destination) on success.
// =============================================================================

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white ' +
  'placeholder-white/25 outline-none transition-all duration-300 ' +
  'focus:border-[#C9A227]/60 focus:ring-2 focus:ring-[#C9A227]/10 ' +
  'hover:border-white/20';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as { from?: string })?.from ?? '/admin';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14130F] px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex w-14 items-center mb-4">
            <span className="h-2 w-px bg-[#C9A227]/80" />
            <span className="h-px flex-1 bg-[#C9A227]/80" />
            <span className="h-2 w-px bg-[#C9A227]/80" />
          </div>
          <h1 className="font-serif text-2xl text-white">
            Autor <span className="text-[#C9A227]">Builders</span>
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/35">
            Admin Console
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-7 backdrop-blur-sm shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <h2 className="mb-5 text-[15px] font-light text-white/80">Sign in to continue</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="admin@autorbuilders.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.18em] text-white/40">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-[12px] text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 text-[13px] font-medium tracking-wide text-[#14130F] transition-all duration-300 hover:bg-[#D4AE30] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#14130F]/20 border-t-[#14130F]" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/20">
          Access restricted to authorised personnel only.
        </p>
      </div>
    </div>
  );
}