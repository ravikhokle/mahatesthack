import type { Metadata } from 'next';
import Link from 'next/link';

import { FAQ_ITEMS } from '@/features/website/content';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about MahaTest mock tests and accounts.',
};

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">FAQ</p>
      <h1 className="mt-3 font-display text-4xl text-brand-950 sm:text-5xl">
        Common questions
      </h1>
      <p className="mt-4 text-base text-ink-muted">
        Quick answers about accounts, mocks, and support. Still stuck?{' '}
        <Link href="/contact" className="font-medium text-brand-700 hover:underline">
          Contact us
        </Link>
        .
      </p>

      <dl className="mt-12 divide-y divide-brand-100 border-y border-brand-100">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question} className="py-6">
            <dt className="font-display text-xl text-brand-950">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-base">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
