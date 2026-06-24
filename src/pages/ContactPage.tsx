import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Container } from '../components/ui/Container';
import { SectionHeading } from '../components/ui/SectionHeading';
import { RuleDivider } from '../components/ui/RuleDivider';
import { Button } from '../components/ui/Button';
import { Seo } from '../components/Seo';
import {
  EASE_LUXURY,
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  fadeUp,
  //fadeUpLarge,
  lineRevealY,
  scaleRevealX,
  scaleReveal,
  slideInLeft,
  slideInRight,
} from '../animations/variants';
import type { BudgetRange, PurchaseTimeline } from '../types/lead';
import { submitInquiry } from '../services/leadService';

// ---------------------------------------------------------------------------
// SEO constants
// ---------------------------------------------------------------------------

const PAGE_TITLE = 'Contact Us | Autor Builders';
const PAGE_DESCRIPTION =
  'Get in touch with Autor Builders — schedule a private consultation, visit our Hyderabad head office, or reach our advisory team for your next residence.';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CONTACT_DETAILS = [
  {
    label: 'Head Office',
    lines: ['8-2-293/82/A, Road No. 36', 'Jubilee Hills, Hyderabad', 'Telangana — 500 033'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Phone',
    lines: ['+91 40 4444 5555', '+91 98480 12345'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    lines: ['hello@autorbuilders.in', 'sales@autorbuilders.in'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Business Hours',
    lines: ['Mon – Sat: 9:00 am – 7:00 pm', 'Sunday: 10:00 am – 5:00 pm'],
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const OFFICES = [
  {
    city: 'Hyderabad',
    role: 'Head Office',
    address: '8-2-293/82/A, Road No. 36, Jubilee Hills',
    phone: '+91 40 4444 5555',
  },
  {
    city: 'Bengaluru',
    role: 'Regional Office',
    address: '100 Feet Road, Indiranagar, Bengaluru — 560 038',
    phone: '+91 80 6789 0123',
  },
  {
    city: 'Pune',
    role: 'Regional Office',
    address: 'Baner Road, Baner, Pune — 411 045',
    phone: '+91 20 4567 8901',
  },
];

const BUDGET_OPTIONS: { value: BudgetRange; label: string }[] = [
  { value: 'under_50L',  label: 'Under ₹50 Lakhs' },
  { value: '50L_1Cr',   label: '₹50L – ₹1 Crore' },
  { value: '1Cr_2Cr',   label: '₹1 – ₹2 Crore' },
  { value: '2Cr_5Cr',   label: '₹2 – ₹5 Crore' },
  { value: 'above_5Cr', label: 'Above ₹5 Crore' },
];

const TIMELINE_OPTIONS: { value: PurchaseTimeline; label: string }[] = [
  { value: 'immediate',    label: 'Within 3 months' },
  { value: 'short_term',  label: '3 – 6 months' },
  { value: 'medium_term', label: '6 – 12 months' },
  { value: 'long_term',   label: '12+ months' },
  { value: 'just_exploring', label: 'Just exploring' },
];

// Optional ?subject= query param (e.g. from footer links) — used only to
// gently prefill the message field. Unknown/missing values are a no-op.
const SUBJECT_PREFILLS: Record<string, string> = {
  'home-loan-assistance': "I'd like help understanding home loan assistance options.",
  'nri-desk': "I'm an NRI buyer and would like to get in touch with the NRI desk.",
};

// ---------------------------------------------------------------------------
// Form state
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

const INITIAL_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  budget: '',
  timeline: '',
  message: '',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InputField({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-[0.18em] text-[#1B1B1B]/60">
        {label}
        {required && <span className="ml-1 text-[#C9A227]">*</span>}
      </label>
      {children}
      {error && (
        <span className="text-[11px] text-red-500/80">{error}</span>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#1B1B1B]/12 bg-white px-4 py-3 text-[14px] text-[#1B1B1B] ' +
  'placeholder-[#1B1B1B]/30 outline-none transition-all duration-300 ' +
  'focus:border-[#C9A227]/60 focus:ring-2 focus:ring-[#C9A227]/15 ' +
  'hover:border-[#1B1B1B]/25';

const selectClass =
  'w-full appearance-none rounded-xl border border-[#1B1B1B]/12 bg-white px-4 py-3 text-[14px] text-[#1B1B1B] ' +
  'outline-none transition-all duration-300 ' +
  'focus:border-[#C9A227]/60 focus:ring-2 focus:ring-[#C9A227]/15 ' +
  'hover:border-[#1B1B1B]/25 cursor-pointer';

// ---------------------------------------------------------------------------
// Section: Hero
// ---------------------------------------------------------------------------

function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-[#14130F] pt-32 pb-16 sm:pt-40 sm:pb-20">
      {/* Grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg, transparent, transparent 59px, #C9A227 59px, #C9A227 60px
          ), repeating-linear-gradient(
            90deg, transparent, transparent 59px, #C9A227 59px, #C9A227 60px
          )`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#14130F]/50 via-transparent to-[#14130F]" />

      <Container className="relative z-10">
        <motion.div
          variants={staggerContainerSlow}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
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
            Get In Touch
          </motion.span>

          <div className="overflow-hidden pb-3 mb-4">
            <motion.h1
              variants={lineRevealY}
              className="font-serif text-[2.8rem] leading-[1.1] text-[#F8F6F1] sm:text-6xl md:text-7xl"
            >
              Let's Build Something{' '}
              <em className="not-italic text-[#C9A227]">Together</em>
            </motion.h1>
          </div>

          <motion.p
            variants={fadeUp}
            className="max-w-xl text-[15px] font-light leading-relaxed text-[#F8F6F1]/55"
          >
            Whether you're exploring your first home or adding to your investment
            portfolio, our consultants are ready to guide you — with no obligation and
            complete transparency.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Contact Info + Form
// ---------------------------------------------------------------------------

function ContactFormSection() {
  const [searchParams] = useSearchParams();
  const subject = searchParams.get('subject');
  const prefillMessage = subject ? SUBJECT_PREFILLS[subject] : undefined;

  const [form, setForm] = useState<FormState>(
    prefillMessage ? { ...INITIAL_FORM, message: prefillMessage } : INITIAL_FORM
  );
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-8% 0px' });

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('submitting');

    try {
      await submitInquiry({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        message: form.message,
        budgetRange: form.budget || null,
        purchaseTimeline: form.timeline || null,
      });
      setStatus('success');
      setForm(INITIAL_FORM);
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="consultation" className="w-full bg-[#F8F6F1] overflow-hidden">
      <Container className="py-20 sm:py-24 lg:py-32">
        <motion.div
          ref={sectionRef}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20 xl:gap-28"
        >
          {/* ── Left: Contact details ── */}
          <motion.div variants={slideInLeft} className="flex flex-col gap-10">
            <SectionHeading
              eyebrow="Contact Information"
              heading="Reach Our Team"
              goldWords={['Team']}
              align="left"
            />

            <div className="flex flex-col gap-7">
              {CONTACT_DETAILS.map((item) => (
                <div key={item.label} className="flex gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/30 text-[#C9A227]">
                    {item.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10.5px] uppercase tracking-[0.2em] text-[#1B1B1B]/45">
                      {item.label}
                    </span>
                    {item.lines.map((line) => (
                      <span key={line} className="text-[14.5px] font-light text-[#1B1B1B]/80">
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <RuleDivider size="full" variant="muted" align="left" />

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919848012345?text=Hello%2C%20I%20would%20like%20to%20know%20more%20about%20Autor%20Builders%20projects."
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/6 px-6 py-5 transition-all duration-500 hover:border-[#25D366]/40 hover:bg-[#25D366]/12"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_16px_rgba(37,211,102,0.30)]">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-[#1B1B1B]/80">
                  Chat on WhatsApp
                </span>
                <span className="text-[12px] font-light text-[#1B1B1B]/50">
                  Typically replies within an hour
                </span>
              </div>
              <svg
                className="ml-auto h-4 w-4 text-[#1B1B1B]/30 transition-transform duration-300 group-hover:translate-x-1"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </motion.div>

          {/* ── Right: Form ── */}
          <motion.div variants={slideInRight}>
            <div className="rounded-2xl border border-[#1B1B1B]/8 bg-white p-7 shadow-[0_4px_40px_rgba(20,19,15,0.06)] sm:p-10">
              <div className="mb-7 flex flex-col gap-2">
                <h2 className="font-serif text-2xl text-[#1B1B1B] sm:text-3xl">
                  Schedule a <span className="text-[#C9A227]">Consultation</span>
                </h2>
                <p className="text-[13.5px] font-light text-[#1B1B1B]/55">
                  Fill in the form and a senior consultant will reach out within one
                  business day.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE_LUXURY }}
                    className="flex flex-col items-center gap-5 py-12 text-center"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30">
                      <svg className="h-7 w-7 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-serif text-xl text-[#1B1B1B]">
                        We've received your request
                      </h3>
                      <p className="text-[13.5px] font-light text-[#1B1B1B]/55">
                        A senior consultant will be in touch within one business day.
                        Thank you for considering Autor Builders.
                      </p>
                    </div>
                    <Button
                      onClick={() => setStatus('idle')}
                      variant="ghost"
                      size="sm"
                    >
                      Submit another enquiry
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5"
                    noValidate
                  >
                    {/* Name row */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <InputField label="First Name" required error={errors.firstName}>
                        <input
                          type="text"
                          placeholder="Arjun"
                          value={form.firstName}
                          onChange={(e) => update('firstName', e.target.value)}
                          className={`${inputClass} ${errors.firstName ? 'border-red-400/60 focus:border-red-400/60 focus:ring-red-400/10' : ''}`}
                        />
                      </InputField>
                      <InputField label="Last Name" required error={errors.lastName}>
                        <input
                          type="text"
                          placeholder="Sharma"
                          value={form.lastName}
                          onChange={(e) => update('lastName', e.target.value)}
                          className={`${inputClass} ${errors.lastName ? 'border-red-400/60 focus:border-red-400/60 focus:ring-red-400/10' : ''}`}
                        />
                      </InputField>
                    </div>

                    {/* Contact row */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <InputField label="Email Address" required error={errors.email}>
                        <input
                          type="email"
                          placeholder="arjun@example.com"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          className={`${inputClass} ${errors.email ? 'border-red-400/60' : ''}`}
                        />
                      </InputField>
                      <InputField label="Phone Number" required error={errors.phone}>
                        <input
                          type="tel"
                          placeholder="+91 98XXX XXXXX"
                          value={form.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          className={`${inputClass} ${errors.phone ? 'border-red-400/60' : ''}`}
                        />
                      </InputField>
                    </div>

                    {/* Budget + Timeline */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <InputField label="Budget Range">
                        <div className="relative">
                          <select
                            value={form.budget}
                            onChange={(e) => update('budget', e.target.value)}
                            className={selectClass}
                          >
                            <option value="">Select budget</option>
                            {BUDGET_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1B1B1B]/30 text-xs">
                            ▾
                          </span>
                        </div>
                      </InputField>
                      <InputField label="Purchase Timeline">
                        <div className="relative">
                          <select
                            value={form.timeline}
                            onChange={(e) => update('timeline', e.target.value)}
                            className={selectClass}
                          >
                            <option value="">Select timeline</option>
                            {TIMELINE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#1B1B1B]/30 text-xs">
                            ▾
                          </span>
                        </div>
                      </InputField>
                    </div>

                    {/* Message */}
                    <InputField label="Message">
                      <textarea
                        rows={4}
                        placeholder="Tell us about the kind of home you're looking for, preferred location, or any questions you have..."
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                        className={`${inputClass} resize-none`}
                      />
                    </InputField>

                    {status === 'error' && (
                      <p className="text-[12px] text-red-500/80">
                        Something went wrong. Please try again or reach us directly by
                        phone.
                      </p>
                    )}

                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      isLoading={status === 'submitting'}
                      disabled={status === 'submitting'}
                      withArrow={status !== 'submitting'}
                      className="mt-1 w-full"
                    >
                      {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
                    </Button>

                    <p className="text-center text-[11px] font-light text-[#1B1B1B]/35">
                      Your information is never shared with third parties.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section: Map Placeholder
// ---------------------------------------------------------------------------

function MapSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-5% 0px' });

  return (
    <section className="w-full bg-[#F8F6F1]">
      <Container className="pb-20 sm:pb-24 lg:pb-32">
        <motion.div
          ref={ref}
          variants={staggerContainerFast}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex flex-col gap-8"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <RuleDivider size="sm" align="left" variant="gold" animated={false} />
            <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#1B1B1B]/45">
              Our Offices
            </span>
          </motion.div>

          {/* Map placeholder */}
          <motion.div
            variants={scaleReveal}
            className="relative h-72 sm:h-96 w-full overflow-hidden rounded-2xl border border-[#1B1B1B]/8 bg-[#E8E4DB]"
          >
            {/* actual Google Maps embed or Mapbox component */}
              <motion.div
                variants={scaleReveal}
                className="relative h-72 sm:h-96 w-full overflow-hidden rounded-2xl border border-[#1B1B1B]/8"
              >
                <iframe
                  title="Autor Builders - Jubilee Hills"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.7!2d78.4067!3d17.4317!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb977b00000001%3A0x1234!2sJubilee+Hills%2C+Hyderabad!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(20%) contrast(95%)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </motion.div>

            {/* Subtle grid overlay to suggest map texture */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg, transparent, transparent 39px, #1B1B1B 39px, #1B1B1B 40px
                ), repeating-linear-gradient(
                  90deg, transparent, transparent 39px, #1B1B1B 39px, #1B1B1B 40px
                )`,
              }}
            />
          </motion.div>

          {/* Office cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {OFFICES.map((office) => (
              <motion.div
                key={office.city}
                variants={fadeUp}
                className="flex flex-col gap-2.5 rounded-xl border border-[#1B1B1B]/8 bg-white p-5 shadow-[0_2px_12px_rgba(20,19,15,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-serif text-lg text-[#1B1B1B]">
                    {office.city}
                  </span>
                  <span className="rounded-full border border-[#C9A227]/30 bg-[#C9A227]/8 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#C9A227]">
                    {office.role}
                  </span>
                </div>
                <p className="text-[13px] font-light leading-relaxed text-[#1B1B1B]/55">
                  {office.address}
                </p>
                <a
                  href={`tel:${office.phone.replace(/\s/g, '')}`}
                  className="text-[12.5px] text-[#1B1B1B]/70 transition-colors hover:text-[#C9A227]"
                >
                  {office.phone}
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactPage() {
  return (
    <main className="w-full">
      <Seo title={PAGE_TITLE} description={PAGE_DESCRIPTION} path="/contact" />
      <ContactHero />
      <ContactFormSection />
      <MapSection />
    </main>
  );
}