import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'About MahaTest — premium mock tests for government exam aspirants.',
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">About</p>
      <h1 className="mt-3 font-display text-4xl text-brand-950 sm:text-5xl">
        Built for aspirants who take mocks seriously.
      </h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-ink-muted">
        <p>
          MahaTest is a government-exam mock platform focused on exam realism: timed papers,
          question palettes, mark-for-review, local autosave, and reliable evaluation — even when
          traffic spikes.
        </p>
        <p>
          Content managers curate taxonomy and questions; students practice, attempt full mocks, and
          track analytics from a single dashboard. The public site shares blogs, current affairs,
          and exam-track pages to help you choose a path.
        </p>
        <p>
          We keep the product modular — Next.js for the website and dashboards, Fastify for APIs,
          MongoDB for permanent data, Redis for live exam state, and optional NATS for async scoring.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/register" className="btn-primary">
          Create account
        </Link>
        <Link href="/contact" className="btn-secondary">
          Contact us
        </Link>
      </div>
    </main>
  );
}
