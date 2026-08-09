'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as examsApi from '@/features/exams/api';
import type { PublicAttempt } from '@/features/exams/types';
import { ApiError } from '@/lib/api';

export default function ResultsHubPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<PublicAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void examsApi
      .listMyAttempts(accessToken)
      .then((result) => setItems(result.items.filter((item) => item.status === 'evaluated')))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load results');
      });
  }, [accessToken]);

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Results</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Review evaluated attempts with score, accuracy, and detailed solutions.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="panel text-sm text-ink-soft">
            No results yet.{' '}
            <Link href="/dashboard/tests" className="text-brand-700 hover:underline">
              Take a test
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="panel !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium text-ink">{item.examTitle}</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Score {item.score}/{item.maxScore} · Accuracy {item.accuracy}% · Correct{' '}
                    {item.correctCount} · Wrong {item.wrongCount}
                  </p>
                  {item.submittedAt ? (
                    <p className="mt-1 text-xs text-ink-soft">
                      Submitted {new Date(item.submittedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <Link href={`/exams/attempts/${item.id}/result`} className="btn-primary !py-2">
                  Open analysis
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
