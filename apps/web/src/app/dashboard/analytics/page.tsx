'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as studentApi from '@/features/student/api';
import type { DashboardAnalytics } from '@/features/student/types';
import { ApiError } from '@/lib/api';

export default function AnalyticsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void studentApi
      .getAnalytics(accessToken)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load analytics');
      });
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-ink-soft">Crunching your analytics…</p>;

  const maxTrend = Math.max(...data.trend.map((item) => item.scorePercent), 1);

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Analytics</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Performance across evaluated mocks — accuracy, volume, and recent score trend.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Evaluated" value={String(data.totals.evaluated)} />
        <Metric label="Correct" value={String(data.totals.correct)} />
        <Metric label="Wrong" value={String(data.totals.wrong)} />
        <Metric label="Skipped" value={String(data.totals.unattempted)} />
        <Metric label="Avg accuracy" value={`${data.totals.avgAccuracy}%`} />
      </div>

      <div className="panel space-y-4">
        <h2 className="text-lg font-semibold text-brand-900">By exam type</h2>
        {Object.keys(data.byType).length === 0 ? (
          <p className="text-sm text-ink-soft">Complete a few tests to unlock type breakdown.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(data.byType).map(([type, stats]) => (
              <div key={type} className="rounded-xl border border-brand-100 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-brand-600">{type}</p>
                <p className="mt-1 text-sm text-ink">
                  {stats.count} attempts · {stats.avgAccuracy}% avg accuracy
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel space-y-4">
        <h2 className="text-lg font-semibold text-brand-900">Recent score trend</h2>
        {data.trend.length === 0 ? (
          <p className="text-sm text-ink-soft">No trend data yet.</p>
        ) : (
          <div className="space-y-3">
            {data.trend.map((item) => (
              <div key={item.attemptId}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate text-ink">{item.examTitle}</span>
                  <span className="text-ink-soft">{item.scorePercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-50">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${(item.scorePercent / maxTrend) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel !p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-900">{value}</p>
    </div>
  );
}
