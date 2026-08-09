'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import * as websiteApi from '@/features/website/api';
import type { PublicCurrentAffair } from '@/features/website/api';
import { ApiError } from '@/lib/api';

export default function CurrentAffairDetailPage() {
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<PublicCurrentAffair | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.slug) return;
    void websiteApi
      .getPublishedCurrentAffair(params.slug)
      .then((response) => setItem(response.item))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Entry not found');
      });
  }, [params.slug]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/current-affairs"
          className="mt-4 inline-block text-sm text-brand-700 hover:underline"
        >
          ← Back to current affairs
        </Link>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm text-ink-soft">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/current-affairs" className="text-sm text-brand-700 hover:underline">
        ← Current affairs
      </Link>
      <p className="mt-6 text-xs uppercase tracking-wide text-brand-600">{item.category}</p>
      <h1 className="mt-2 font-display text-4xl text-brand-950 sm:text-5xl">{item.title}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        {new Date(item.eventDate).toLocaleDateString()}
      </p>
      {item.summary ? <p className="mt-6 text-lg text-ink-muted">{item.summary}</p> : null}
      <article
        className="prose prose-neutral mt-10 max-w-none prose-headings:font-display prose-a:text-brand-700"
        dangerouslySetInnerHTML={{ __html: item.content }}
      />
    </main>
  );
}
