'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/features/auth/store';
import * as examsApi from '@/features/exams/api';
import type { PublicAttempt, PublicExam } from '@/features/exams/types';
import { ApiError } from '@/lib/api';

export default function ExamsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [exams, setExams] = useState<PublicExam[]>([]);
  const [attempts, setAttempts] = useState<PublicAttempt[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace('/login');
    }
  }, [hydrated, router, user]);

  useEffect(() => {
    if (!accessToken) return;
    void (async () => {
      try {
        const [examResult, attemptResult] = await Promise.all([
          examsApi.listExams(accessToken, { type: filter || undefined }),
          examsApi.listMyAttempts(accessToken),
        ]);
        setExams(examResult.items);
        setAttempts(attemptResult.items);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load exams');
      }
    })();
  }, [accessToken, filter]);

  const startExam = async (examId: string) => {
    if (!accessToken) return;
    setStartingId(examId);
    setError(null);
    try {
      const result = await examsApi.startAttempt(accessToken, examId);
      router.push(`/exams/attempts/${result.attempt.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start exam');
      setStartingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div className="panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Mock Test Engine
        </p>
        <h1 className="mt-2 font-display text-3xl text-brand-950">Exams</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Offline-safe attempts with timer, palette, autosave, and Redis-backed sync.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'mock', label: 'Mock' },
            { value: 'test_series', label: 'Test series' },
            { value: 'previous_year', label: 'Previous year' },
            { value: 'daily_quiz', label: 'Daily quiz' },
          ].map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                filter === item.value
                  ? 'bg-brand-700 text-white'
                  : 'bg-brand-50 text-brand-800 hover:bg-brand-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {exams.length === 0 ? (
          <div className="panel text-sm text-ink-soft">No published exams yet.</div>
        ) : (
          exams.map((exam) => (
            <article key={exam.id} className="panel space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-brand-600">{exam.type}</p>
                  <h2 className="mt-1 font-display text-xl text-brand-950">{exam.title}</h2>
                </div>
                <span className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-800">
                  {exam.durationMinutes} min
                </span>
              </div>
              <p className="text-sm text-ink-muted">{exam.description || 'No description'}</p>
              <p className="text-sm text-ink-soft">
                {exam.questionCount} questions · {exam.totalMarks} marks
              </p>
              <button
                type="button"
                className="btn-primary"
                disabled={startingId === exam.id}
                onClick={() => void startExam(exam.id)}
              >
                {startingId === exam.id ? 'Starting…' : 'Start exam'}
              </button>
            </article>
          ))
        )}
      </div>

      <div className="panel">
        <h2 className="font-display text-2xl text-brand-950">My attempts</h2>
        <div className="mt-4 space-y-3">
          {attempts.length === 0 ? (
            <p className="text-sm text-ink-soft">No attempts yet.</p>
          ) : (
            attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-100 px-3 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{attempt.examTitle}</p>
                  <p className="text-xs text-ink-soft">
                    {attempt.status}
                    {attempt.score !== null ? ` · Score ${attempt.score}/${attempt.maxScore}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {attempt.status === 'in_progress' ? (
                    <Link href={`/exams/attempts/${attempt.id}`} className="btn-secondary !py-1.5">
                      Continue
                    </Link>
                  ) : (
                    <Link
                      href={`/exams/attempts/${attempt.id}/result`}
                      className="btn-secondary !py-1.5"
                    >
                      Result
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
