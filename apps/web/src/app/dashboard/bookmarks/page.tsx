'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as studentApi from '@/features/student/api';
import type { BookmarkItem } from '@/features/student/types';
import { ApiError } from '@/lib/api';

export default function BookmarksPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) return;
    const result = await studentApi.listBookmarks(accessToken);
    setItems(result.items);
  };

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load bookmarks');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const remove = async (id: string) => {
    if (!accessToken) return;
    try {
      await studentApi.removeBookmark(accessToken, id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove bookmark');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Bookmarks</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Saved questions for later revision. Bookmark from practice results or question review.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="panel text-sm text-ink-soft">
            No bookmarks yet. Start a{' '}
            <Link href="/dashboard/practice" className="text-brand-700 hover:underline">
              practice session
            </Link>{' '}
            and save tough questions.
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="panel !p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-800">
                  {item.difficulty}
                </span>
                <span className="text-ink-soft">
                  Saved {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div
                className="prose prose-sm max-w-none text-ink"
                dangerouslySetInnerHTML={{ __html: item.stem }}
              />
              {item.note ? <p className="mt-2 text-sm text-ink-muted">Note: {item.note}</p> : null}
              <button
                type="button"
                className="mt-3 text-sm text-red-600 hover:underline"
                onClick={() => void remove(item.id)}
              >
                Remove
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
