'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as examsApi from '@/features/exams/api';
import type { ExamResult } from '@/features/exams/types';
import { ApiError } from '@/lib/api';

export default function ExamResultPage() {
  const params = useParams<{ attemptId: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    let tries = 0;

    const load = async () => {
      try {
        const response = await examsApi.getResult(accessToken, params.attemptId);
        if (!cancelled) {
          setResult(response.result);
          setError(null);
        }
      } catch (err) {
        if (err instanceof ApiError && err.code === 'RESULT_PENDING' && tries < 10) {
          tries += 1;
          window.setTimeout(() => {
            void load();
          }, 1000);
          return;
        }
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load result');
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, params.attemptId]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/exams" className="btn-secondary mt-4 inline-flex">
          Back to exams
        </Link>
      </main>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ink-soft">
        Evaluating your attempt…
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div className="panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Result</p>
        <h1 className="mt-2 font-display text-3xl text-brand-950">{result.examTitle}</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Score" value={`${result.score}/${result.maxScore}`} />
          <Stat label="Correct" value={String(result.correctCount)} />
          <Stat label="Wrong" value={String(result.wrongCount)} />
          <Stat label="Accuracy" value={`${result.accuracy}%`} />
        </div>
        <Link href="/exams" className="btn-primary mt-6 inline-flex">
          Back to exams
        </Link>
      </div>

      <div className="space-y-4">
        {result.questionResults.map((item, index) => (
          <article key={item.questionId} className="panel !p-4">
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-800">Q{index + 1}</span>
              <span
                className={`rounded px-2 py-0.5 ${
                  item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                }`}
              >
                {item.isCorrect ? 'Correct' : 'Incorrect'} · {item.marksAwarded} marks
              </span>
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: item.stem }}
            />
            {item.explanation ? (
              <div className="mt-3 rounded-lg bg-surface-tint p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Explanation
                </p>
                <div
                  className="prose prose-sm mt-1 max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.explanation }}
                />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-tint p-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-xl font-semibold text-brand-900">{value}</p>
    </div>
  );
}
