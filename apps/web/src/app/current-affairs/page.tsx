'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import * as websiteApi from '@/features/website/api';
import type { PublicCurrentAffair } from '@/features/website/api';
import { ApiError } from '@/lib/api';

export default function CurrentAffairsIndexPage() {
  const [items, setItems] = useState<PublicCurrentAffair[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void websiteApi
      .listPublishedCurrentAffairs()
      .then((response) => setItems(response.items))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load current affairs');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Current affairs
        </p>
        <h1 className="mt-3 font-display text-4xl text-brand-950 sm:text-5xl">
          Dated updates for exam revision
        </h1>
        <p className="mt-4 text-base text-ink-muted">
          National and international notes curated for Prelims-style preparation.
        </p>
      </div>

      {loading ? <p className="mt-10 text-sm text-ink-soft">Loading…</p> : null}
      {error ? <p className="mt-10 text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <ul className="mt-12 divide-y divide-brand-100 border-y border-brand-100">
          {items.length === 0 ? (
            <li className="py-8 text-sm text-ink-soft">
              No published entries yet. Publish from Admin → Current Affairs.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/current-affairs/${item.slug}`}
                  className="block py-7 transition hover:bg-brand-50/40"
                >
                  <p className="text-xs uppercase tracking-wide text-brand-600">{item.category}</p>
                  <h2 className="mt-1 font-display text-2xl text-brand-950">{item.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                    {item.summary || 'Read the full update'}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">
                    {new Date(item.eventDate).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </main>
  );
}
