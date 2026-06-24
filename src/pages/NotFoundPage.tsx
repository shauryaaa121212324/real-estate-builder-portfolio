import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#14130F] px-6 text-center">
      <span className="text-[10.5px] uppercase tracking-[0.34em] text-[#C9A227]/60">404</span>
      <h1 className="font-serif text-3xl text-[#F8F6F1]/85 sm:text-4xl">Page not found</h1>
      <p className="max-w-md text-[13.5px] font-light leading-relaxed text-[#F8F6F1]/40">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center gap-2.5 rounded-full border border-[#F8F6F1]/15 px-7 py-3 text-[11px] uppercase tracking-[0.22em] text-[#F8F6F1]/60 transition-all hover:border-[#F8F6F1]/35 hover:text-[#F8F6F1]/85"
      >
        <span aria-hidden="true">&larr;</span> Back to Home
      </Link>
    </div>
  );
}
