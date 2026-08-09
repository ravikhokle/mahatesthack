'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import * as websiteApi from '@/features/website/api';
import type { PublicBlog } from '@/features/website/api';
import { ApiError } from '@/lib/api';

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<PublicBlog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.slug) return;
    void websiteApi
      .getPublishedBlog(params.slug)
      .then((response) => setItem(response.item))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Post not found');
      });
  }, [params.slug]);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/blog" className="mt-4 inline-block text-sm text-brand-700 hover:underline">
          ← Back to blog
        </Link>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm text-ink-soft">Loading post…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/blog" className="text-sm text-brand-700 hover:underline">
        ← Blog
      </Link>
      <h1 className="mt-6 font-display text-4xl text-brand-950 sm:text-5xl">{item.title}</h1>
      <p className="mt-3 text-sm text-ink-soft">
        {item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString()
          : new Date(item.createdAt).toLocaleDateString()}
      </p>
      {item.excerpt ? <p className="mt-6 text-lg text-ink-muted">{item.excerpt}</p> : null}
      <article
        className="prose prose-neutral mt-10 max-w-none prose-headings:font-display prose-a:text-brand-700"
        dangerouslySetInnerHTML={{ __html: item.content }}
      />
    </main>
  );
}
