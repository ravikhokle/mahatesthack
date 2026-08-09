'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/store';
import * as examsApi from '@/features/exams/api';
import type { PublicAttempt, PublicExam } from '@/features/exams/types';
import { ApiError } from '@/lib/api';

export default function MyTestsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [exams, setExams] = useState<PublicExam[]>([]);
  const [attempts, setAttempts] = useState<PublicAttempt[]>([]);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'evaluated'>('all');
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const [examResult, attemptResult] = await Promise.all([
          examsApi.listExams(accessToken),
          examsApi.listMyAttempts(accessToken),
        ]);
        setExams(examResult.items);
        setAttempts(attemptResult.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load tests');
      }
    })();
  }, [accessToken]);

  const filteredAttempts = useMemo(() => {
    if (filter === 'all') return attempts;
    if (filter === 'in_progress') {
      return attempts.filter((item) => item.status === 'in_progress');
    }
    return attempts.filter((item) => item.status === 'evaluated');
  }, [attempts, filter]);

  const startExam = async (examId: string) => {
    if (!accessToken) return;
    setStartingId(examId);
    try {
      const result = await examsApi.startAttempt(accessToken, examId);
      router.push(`/exams/attempts/${result.attempt.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start exam');
      setStartingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">My Tests</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Continue in-progress exams or start a new mock from the catalog.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-900">Your attempts</h2>
          <div className="flex gap-2">
            {(
              [
                ['all', 'All'],
                ['in_progress', 'Continue'],
                ['evaluated', 'Completed'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  filter === value
                    ? 'bg-brand-700 text-white'
                    : 'bg-brand-50 text-brand-800 hover:bg-brand-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredAttempts.length === 0 ? (
          <p className="text-sm text-ink-soft">No attempts in this view yet.</p>
        ) : (
          <ul className="space-y-2">
            {filteredAttempts.map((attempt) => (
              <li
                key={attempt.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{attempt.examTitle}</p>
                  <p className="text-xs text-ink-soft">
                    {attempt.status}
                    {attempt.score !== null ? ` · ${attempt.score}/${attempt.maxScore}` : ''}
                  </p>
                </div>
                {attempt.status === 'in_progress' ? (
                  <Link href={`/exams/attempts/${attempt.id}`} className="btn-primary !py-2">
                    Continue exam
                  </Link>
                ) : (
                  <Link
                    href={`/exams/attempts/${attempt.id}/result`}
                    className="btn-secondary !py-2"
                  >
                    View result
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">Available exams</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {exams.map((exam) => (
            <article key={exam.id} className="rounded-xl border border-brand-100 p-4">
              <p className="text-xs uppercase tracking-wide text-brand-600">{exam.type}</p>
              <h3 className="mt-1 font-medium text-ink">{exam.title}</h3>
              <p className="mt-1 text-xs text-ink-soft">
                {exam.questionCount} Q · {exam.durationMinutes} min
              </p>
              <button
                type="button"
                className="btn-secondary mt-3 !py-2"
                disabled={startingId === exam.id}
                onClick={() => void startExam(exam.id)}
              >
                {startingId === exam.id ? 'Starting…' : 'Start'}
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
