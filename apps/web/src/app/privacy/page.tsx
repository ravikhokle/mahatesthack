import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How MahaTest collects, uses, and protects personal information.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Legal</p>
      <h1 className="mt-3 font-display text-4xl text-brand-950 sm:text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-ink-soft">Last updated: 21 July 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-muted sm:text-base">
        <section>
          <h2 className="font-display text-2xl text-brand-950">What we collect</h2>
          <p className="mt-3">
            Account details (name, email, password hash), exam attempt data, and messages you send
            through Contact. Optional: device and browser data
            needed for session security.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">How we use it</h2>
          <p className="mt-3">
            To authenticate you, deliver mocks and results, improve content, send transactional
            emails (verification, password reset), and respond to support requests. We do not sell
            personal data.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Storage and security</h2>
          <p className="mt-3">
            Permanent data lives in MongoDB. Live exam state and sessions use Redis temporarily.
            Access tokens are short-lived JWTs; refresh tokens use httpOnly cookies. Staff access is
            role-gated.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Your choices</h2>
          <p className="mt-3">
            You may update profile details, request account help via{' '}
            <Link href="/contact" className="text-brand-700 hover:underline">
              Contact
            </Link>
            , and sign out to end the current session. For deletion requests, email support through
            the contact form.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-brand-950">Changes</h2>
          <p className="mt-3">
            We may update this policy as MahaTest evolves. Continued use after changes means you
            accept the revised policy.
          </p>
        </section>
      </div>
    </main>
  );
}
