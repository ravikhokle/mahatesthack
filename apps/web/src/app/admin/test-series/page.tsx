'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as examsApi from '@/features/exams/api';
import type { PublicExam, PublicTestSeries } from '@/features/exams/types';
import { ApiError } from '@/lib/api';

export default function AdminTestSeriesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [series, setSeries] = useState<PublicTestSeries[]>([]);
  const [exams, setExams] = useState<PublicExam[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) return;
    const [seriesResult, examResult] = await Promise.all([
      examsApi.listTestSeries(accessToken),
      examsApi.listExams(accessToken),
    ]);
    setSeries(seriesResult.items);
    setExams(examResult.items);
  };

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load test series');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const toggleExam = (id: string) => {
    setSelectedExamIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const create = async () => {
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      await examsApi.createTestSeries(accessToken, {
        title,
        description,
        examIds: selectedExamIds,
      });
      setTitle('');
      setDescription('');
      setSelectedExamIds([]);
      setMessage('Test series created.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Test Series</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Group exams into packages students can follow as a series.
        </p>
        <Link href="/admin/exams" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          Manage individual exams →
        </Link>
      </div>

      <div className="panel space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">Create series</h2>
        <input
          className="input-field"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="input-field min-h-24"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-brand-100 p-3">
          {exams.length === 0 ? (
            <p className="text-sm text-ink-soft">Create exams first, then attach them here.</p>
          ) : (
            exams.map((exam) => (
              <label key={exam.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedExamIds.includes(exam.id)}
                  onChange={() => toggleExam(exam.id)}
                />
                <span>
                  {exam.title}
                  <span className="ml-2 text-xs text-ink-soft">
                    {exam.type} · {exam.status}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
        <button type="button" className="btn-primary" onClick={() => void create()}>
          Create test series
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}

      <div className="space-y-2">
        {series.length === 0 ? (
          <div className="panel text-sm text-ink-soft">No test series yet.</div>
        ) : (
          series.map((item) => (
            <article key={item.id} className="panel !p-4">
              <p className="font-medium text-ink">{item.title}</p>
              <p className="text-sm text-ink-muted">{item.description || 'No description'}</p>
              <p className="mt-1 text-xs text-ink-soft">
                {item.examIds.length} exams · {item.isActive ? 'Active' : 'Inactive'}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
