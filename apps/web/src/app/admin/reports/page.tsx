'use client';

import { useEffect, useState } from 'react';

import * as adminApi from '@/features/admin/api';
import type { AdminReports } from '@/features/admin/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max === 0 ? 0 : Math.max(4, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-brand-50">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [data, setData] = useState<AdminReports | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void adminApi
      .getAdminReports(accessToken)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load reports');
      });
  }, [accessToken]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-ink-soft">Loading reports…</p>;
  }

  const maxAttempts = Math.max(1, ...data.attemptsByDay.map((item) => item.count));

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Reports</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Platform activity, content mix, and exam performance snapshots.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="panel !p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Average score</p>
          <p className="mt-2 font-display text-3xl text-brand-950">
            {data.averageScore === null ? '—' : `${data.averageScore}%`}
          </p>
        </div>
        <div className="panel !p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Users by role</p>
          <div className="mt-3 space-y-1 text-sm text-ink-muted">
            {data.usersByRole.map((item) => (
              <p key={item.role}>
                {item.role}: {item.count}
              </p>
            ))}
          </div>
        </div>
        <div className="panel !p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Questions by status</p>
          <div className="mt-3 space-y-1 text-sm text-ink-muted">
            {data.questionsByStatus.map((item) => (
              <p key={item.status}>
                {item.status}: {item.count}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="panel space-y-3">
        <h2 className="font-display text-2xl text-brand-950">Attempts · last 14 days</h2>
        <div className="space-y-3">
          {data.attemptsByDay.map((item) => (
            <BarRow key={item.date} label={item.date} value={item.count} max={maxAttempts} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-3">
          <h2 className="font-display text-2xl text-brand-950">Exams by type</h2>
          {data.examsByType.length === 0 ? (
            <p className="text-sm text-ink-soft">No exams yet.</p>
          ) : (
            data.examsByType.map((item) => (
              <div
                key={item.type}
                className="flex justify-between rounded-lg border border-brand-100 px-3 py-2 text-sm"
              >
                <span>{item.type}</span>
                <span className="text-ink-muted">{item.count}</span>
              </div>
            ))
          )}
        </div>

        <div className="panel space-y-3">
          <h2 className="font-display text-2xl text-brand-950">Top exams</h2>
          {data.topExams.length === 0 ? (
            <p className="text-sm text-ink-soft">No evaluated attempts yet.</p>
          ) : (
            data.topExams.map((item) => (
              <div
                key={item.examId}
                className="rounded-lg border border-brand-100 px-3 py-3 text-sm"
              >
                <p className="font-medium text-ink">{item.title}</p>
                <p className="text-xs text-ink-soft">
                  {item.attempts} attempts · avg{' '}
                  {item.averageScore === null ? '—' : `${item.averageScore}%`}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
