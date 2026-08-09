import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-brand-100/80 bg-brand-950 text-brand-100">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.2fr_1fr_1fr] sm:px-6">
        <div>
          <p className="font-display text-xl text-white">MahaTest</p>
          <p className="mt-2 max-w-sm text-sm text-brand-200">
            Premium mock tests for government exam aspirants — timed, offline-safe, and built to
            scale.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Explore</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-brand-200">
            <Link href="/exam-prep" className="hover:text-white">
              Exam prep
            </Link>
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <Link href="/current-affairs" className="hover:text-white">
              Current affairs
            </Link>
            <Link href="/faq" className="hover:text-white">
              FAQ
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-brand-200">
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} MahaTest</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
