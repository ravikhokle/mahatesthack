import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms governing use of the MahaTest platform and content.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Legal</p>
      <h1 className="mt-3 font-display text-4xl text-brand-950 sm:text-5xl">
        Terms & Conditions
      </h1>
      <p className="mt-4 text-sm text-ink-soft">Last updated: 21 July 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-muted sm:text-base">
        <section>
          <h2 className="font-display text-2xl text-brand-950">Acceptance</h2>
          <p className="mt-3">
            By creating an account or using MahaTest, you agree to these terms and our{' '}
            <Link href="/privacy" className="text-brand-700 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Accounts</h2>
          <p className="mt-3">
            Provide accurate registration details and keep credentials private. You are responsible
            for activity under your account. We may suspend accounts that abuse the platform or
            violate exam integrity.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Content and exams</h2>
          <p className="mt-3">
            Questions, blogs, current affairs, and mock papers are for personal educational use.
            Redistribution, scraping, or commercial reuse without permission is prohibited. Scores
            are practice indicators, not official exam results.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Availability</h2>
          <p className="mt-3">
            We aim for reliable uptime but do not guarantee uninterrupted service. Maintenance mode
            or outages may temporarily limit access.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Liability</h2>
          <p className="mt-3">
            MahaTest is provided as-is for exam practice. We are not liable for exam outcomes,
            third-party failures, or indirect damages arising from platform use.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Contact</h2>
          <p className="mt-3">
            Questions about these terms:{' '}
            <Link href="/contact" className="text-brand-700 hover:underline">
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
