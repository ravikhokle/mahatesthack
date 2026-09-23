'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as studentApi from '@/features/student/api';
import type { DashboardHome } from '@/features/student/types';
import { ApiError } from '@/lib/api';

export default function DashboardHomePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardHome | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void studentApi
      .getDashboardHome(accessToken)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
      });
  }, [accessToken]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-ink-soft">Loading your home…</p>;
  }

  const firstName = user?.name?.split(' ')[0] ?? 'Student';

  return (
    <div className="space-y-6">
      <div className="panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Welcome back
        </p>
        <h1 className="mt-2 font-display text-3xl text-brand-950">Hi, {firstName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Continue where you left off, track progress, and review your mock results — all in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tests attempted" value={String(data.summary.testsAttempted)} />
        <StatCard label="Avg score" value={`${data.summary.averageScorePercent}%`} />
        <StatCard label="Avg accuracy" value={`${data.summary.averageAccuracy}%`} />
      </div>

      {data.continueExams.length > 0 ? (
        <div className="panel space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-brand-950">Continue exam</h2>
            <Link href="/dashboard/tests" className="text-sm text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {data.continueExams.map((item) => (
              <div
                key={item.attemptId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-surface-tint/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{item.examTitle}</p>
                  <p className="text-xs text-ink-soft">
                    Ends {new Date(item.endsAt).toLocaleString()}
                  </p>
                </div>
                <Link href={`/exams/attempts/${item.attemptId}`} className="btn-primary !py-2">
                  Resume
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-brand-950">Recent results</h2>
            <Link href="/dashboard/results" className="text-sm text-brand-700 hover:underline">
              All results
            </Link>
          </div>
          {data.recentResults.length === 0 ? (
            <p className="text-sm text-ink-soft">No evaluated tests yet. Take a mock to begin.</p>
          ) : (
            data.recentResults.map((item) => (
              <Link
                key={item.attemptId}
                href={`/exams/attempts/${item.attemptId}/result`}
                className="block rounded-lg border border-brand-100 px-3 py-3 transition hover:border-brand-300"
              >
                <p className="font-medium text-ink">{item.examTitle}</p>
                <p className="text-xs text-ink-soft">
                  {item.score}/{item.maxScore} · {item.accuracy}% accuracy
                </p>
              </Link>
            ))
          )}
        </div>

        <div className="panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-brand-950">Recommended</h2>
            <Link href="/exams" className="text-sm text-brand-700 hover:underline">
              Browse
            </Link>
          </div>
          {data.recommendedExams.length === 0 ? (
            <p className="text-sm text-ink-soft">No published exams available yet.</p>
          ) : (
            data.recommendedExams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-lg border border-brand-100 px-3 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-brand-600">{exam.type}</p>
                <p className="mt-1 font-medium text-ink">{exam.title}</p>
                {exam.isPersonalized ? (
                  <>
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      {exam.personalizedByAi ? 'AI plan built from your weak topics' : 'Built from your weak topics'}
                    </p>
                    {exam.aiStudyTip ? (
                      <p className="mt-1 text-xs text-ink-soft">{exam.aiStudyTip}</p>
                    ) : null}
                  </>
                ) : null}
                <p className="text-xs text-ink-soft">
                  {exam.questionCount} Q · {exam.durationMinutes} min · {exam.totalMarks} marks
                </p>
                <Link href="/exams" className="mt-2 inline-block text-sm text-brand-700 hover:underline">
                  Start from exams →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel !p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-3xl text-brand-900">{value}</p>
    </div>
  );
}
