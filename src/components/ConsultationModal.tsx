/**
 * ConsultationModal
 *
 * A reusable modal/drawer for the "Schedule Consultation" CTA.
 * It wraps the consultation form and can be triggered from any page.
 *
 * USAGE
 * -----
 * 1. Wrap your app (or PublicLayout) with <ConsultationProvider>:
 *
 *      import { ConsultationProvider } from './components/ConsultationModal';
 *      // in PublicLayout.tsx:
 *      <ConsultationProvider>
 *        <Outlet />
 *      </ConsultationProvider>
 *
 * 2. In any component, call the hook:
 *
 *      import { useConsultation } from './components/ConsultationModal';
 *      const { open } = useConsultation();
 *      <Button onClick={open}>Schedule Consultation</Button>
 *
 * 3. OR use the drop-in <ConsultationButton> wrapper that handles everything:
 *
 *      import { ConsultationButton } from './components/ConsultationModal';
 *      <ConsultationButton variant="gold" size="lg">Schedule Consultation</ConsultationButton>
 *
 * The modal is also reachable by navigating to /contact#consultation.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, type ButtonProps } from './ui/Button';
import type { BudgetRange, PurchaseTimeline } from '../types/lead';
import { submitConsultation } from '../services/leadService';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ConsultationContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ConsultationContext = createContext<ConsultationContextValue | null>(null);

export function useConsultation(): ConsultationContextValue {
  const ctx = useContext(ConsultationContext);
  if (!ctx) {
    throw new Error('useConsultation must be used inside <ConsultationProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Easing / variants
// ---------------------------------------------------------------------------

const EASE_LUXURY: [number, number, number, number] = [0.16, 1, 0.3, 1];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: EASE_LUXURY },
  },
  exit: {
    opacity: 0, y: 24, scale: 0.97,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  budget: BudgetRange | '';
  timeline: PurchaseTimeline | '';
  message: string;
}

const INITIAL: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  budget: '', timeline: '', message: '',
};

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'under_50L',  label: 'Under ₹50 Lakhs' },
  { value: '50L_1Cr',   label: '₹50L – ₹1 Crore' },
  { value: '1Cr_2Cr',   label: '₹1 – ₹2 Crore' },
  { value: '2Cr_5Cr',   label: '₹2 – ₹5 Crore' },
  { value: 'above_5Cr', label: 'Above ₹5 Crore' },
];

const TIMELINE_OPTIONS: { value: PurchaseTimeline; label: string }[] = [
  { value: 'immediate',      label: 'Within 3 months' },
  { value: 'short_term',    label: '3 – 6 months' },
  { value: 'medium_term',   label: '6 – 12 months' },
  { value: 'long_term',     label: '12+ months' },
  { value: 'just_exploring', label: 'Just exploring' },
];

// ---------------------------------------------------------------------------
// Shared field styles
// ---------------------------------------------------------------------------

const inputBase =
  'w-full rounded-xl border border-[#1B1B1B]/12 bg-[#F8F6F1] px-4 py-3 text-[13.5px] ' +
  'text-[#1B1B1B] placeholder-[#1B1B1B]/30 outline-none transition-all duration-300 ' +
  'focus:border-[#C9A227]/60 focus:ring-2 focus:ring-[#C9A227]/15 hover:border-[#1B1B1B]/25';

const selectBase =
  'w-full appearance-none rounded-xl border border-[#1B1B1B]/12 bg-[#F8F6F1] ' +
  'px-4 py-3 text-[13.5px] text-[#1B1B1B] outline-none transition-all duration-300 ' +
  'focus:border-[#C9A227]/60 focus:ring-2 focus:ring-[#C9A227]/15 hover:border-[#1B1B1B]/25 cursor-pointer';

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#1B1B1B]/55">
        {label}
        {required && <span className="ml-0.5 text-[#C9A227]">*</span>}
      </label>
      {children}
      {error && <span className="text-[11px] text-red-500/80">{error}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal inner form
// ---------------------------------------------------------------------------

function ConsultationForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const set = (k: keyof FormState, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.email.trim())     e.email     = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim())     e.phone     = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('submitting');
    try {
      await submitConsultation({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        budgetRange: form.budget || null,
        purchaseTimeline: form.timeline || null,
        message: form.message,
      });
      setStatus('success');
      setForm(INITIAL);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_LUXURY }}
        className="flex flex-col items-center gap-5 py-8 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A227]/30 bg-[#C9A227]/8">
          <svg className="h-7 w-7 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="font-serif text-xl text-[#1B1B1B]">Request received</h3>
          <p className="text-[13px] font-light text-[#1B1B1B]/55">
            A senior consultant will contact you within one business day.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button onClick={() => { setStatus('idle'); setForm(INITIAL); }} variant="ghost" size="sm">
            New Request
          </Button>
          <Button onClick={onClose} variant="gold" size="sm">
            Close
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" required error={errors.firstName}>
          <input
            type="text" placeholder="Arjun" value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className={`${inputBase} ${errors.firstName ? 'border-red-400/60' : ''}`}
          />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <input
            type="text" placeholder="Sharma" value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            className={`${inputBase} ${errors.lastName ? 'border-red-400/60' : ''}`}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" required error={errors.email}>
          <input
            type="email" placeholder="you@example.com" value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={`${inputBase} ${errors.email ? 'border-red-400/60' : ''}`}
          />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <input
            type="tel" placeholder="+91 98XXX XXXXX" value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={`${inputBase} ${errors.phone ? 'border-red-400/60' : ''}`}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Budget Range">
          <div className="relative">
            <select value={form.budget} onChange={(e) => set('budget', e.target.value)} className={selectBase}>
              <option value="">Select…</option>
              {BUDGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1B1B1B]/30 text-xs">▾</span>
          </div>
        </Field>
        <Field label="Timeline">
          <div className="relative">
            <select value={form.timeline} onChange={(e) => set('timeline', e.target.value)} className={selectBase}>
              <option value="">Select…</option>
              {TIMELINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1B1B1B]/30 text-xs">▾</span>
          </div>
        </Field>
      </div>

      <Field label="Message">
        <textarea
          rows={3}
          placeholder="Tell us what you're looking for — location, configuration, timeline, or any questions…"
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          className={`${inputBase} resize-none`}
        />
      </Field>

      {status === 'error' && (
        <p className="text-[11.5px] text-red-500/80">
          Something went wrong. Please try again or call us directly.
        </p>
      )}

      <Button
        type="submit"
        variant="gold"
        size="md"
        isLoading={status === 'submitting'}
        disabled={status === 'submitting'}
        withArrow={status !== 'submitting'}
        className="mt-1 w-full"
      >
        {status === 'submitting' ? 'Submitting…' : 'Request Consultation'}
      </Button>

      <p className="text-center text-[11px] text-[#1B1B1B]/35">
        Your information is never shared with third parties.
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function ConsultationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-[#14130F]/70 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultation-modal-title"
            onKeyDown={handleKeyDown}
className="
fixed
inset-x-4
bottom-0
z-[500]
mx-auto
w-full
max-w-2xl
overflow-hidden
rounded-t-3xl
bg-white
shadow-[0_-20px_80px_rgba(20,19,15,0.24)]

sm:inset-auto
sm:left-1/2
sm:top-4
sm:w-[90vw]
sm:max-w-2xl
sm:-translate-x-1/2
sm:rounded-3xl

h-[calc(100vh-2rem)]
max-h-[900px]
flex
flex-col
"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#1B1B1B]/6 px-7 py-6 sticky top-0 bg-white z-10">
              <div className="flex flex-col gap-0.5">
                {/* Decorative rule */}
                <div className="mb-3 flex w-14 items-center">
                  <span className="h-2 w-px bg-[#C9A227]/80" />
                  <span className="h-px flex-1 bg-[#C9A227]/80" />
                  <span className="h-2 w-px bg-[#C9A227]/80" />
                </div>
                <h2
                  id="consultation-modal-title"
                  className="font-serif text-2xl text-[#1B1B1B]"
                >
                  Schedule a{' '}
                  <span className="text-[#C9A227]">Consultation</span>
                </h2>
                <p className="text-[12.5px] font-light text-[#1B1B1B]/50">
                  One of our senior consultants will be in touch within one business
                  day.
                </p>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close consultation modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1B1B1B]/12 text-[#1B1B1B]/50 transition-all duration-300 hover:border-[#1B1B1B]/30 hover:bg-[#1B1B1B]/4 hover:text-[#1B1B1B]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form body */}
<div
  ref={contentRef}
  className="flex-1 overflow-y-auto px-7 py-7"
>              <ConsultationForm onClose={onClose} />
            </div>

            {/* Footer */}
            <div className="border-t border-[#1B1B1B]/6 px-7 py-4">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="text-[11px] uppercase tracking-[0.15em] text-[#1B1B1B]/35">
                  Or reach us directly
                </span>
                <a
                  href="tel:+914044445555"
                  className="text-[12px] font-light text-[#1B1B1B]/60 transition-colors hover:text-[#C9A227]"
                >
                  +91 40 4444 5555
                </a>
                <a
                  href="https://wa.me/919848012345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] font-light text-[#25D366] transition-opacity hover:opacity-70"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ConsultationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);

  const open  = useCallback(() => setOpen(true),  []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <ConsultationContext.Provider value={{ isOpen, open, close }}>
      {children}
      <ConsultationModal isOpen={isOpen} onClose={close} />
    </ConsultationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Drop-in ConsultationButton
// ---------------------------------------------------------------------------

/**
 * A Button that opens the ConsultationModal on click.
 * Must be rendered inside <ConsultationProvider>.
 *
 * All ButtonProps are forwarded — just swap any existing
 * <Button href="/contact"> with <ConsultationButton>.
 */

// Narrow to only the <button> branch of the ButtonProps discriminated union
// so TypeScript knows `as`, `href`, and `onClick` are unambiguous.
type ButtonButtonProps = Extract<ButtonProps, { as?: 'button' }>;
type ConsultationButtonProps = Omit<ButtonButtonProps, 'as' | 'onClick' | 'href'>;

export function ConsultationButton(props: ConsultationButtonProps) {
  const { open } = useConsultation();
  return <Button as="button" {...props} onClick={open} />;
}

export default ConsultationModal;