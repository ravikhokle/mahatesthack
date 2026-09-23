'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import * as adminApi from '@/features/admin/api';
import type { AdminDashboardStats } from '@/features/admin/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-3xl text-brand-950">{value}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="panel block !p-4 transition hover:border-brand-300">
        {body}
      </Link>
    );
  }
  return <div className="panel !p-4">{body}</div>;
}

export default function AdminDashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void adminApi
      .getAdminDashboard(accessToken)
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
      });
  }, [accessToken]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-ink-soft">Loading admin dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Admin dashboard
        </p>
        <h1 className="mt-2 font-display text-3xl text-brand-950">
          Platform overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Signed in as {user?.name} ({user?.role.replace('_', ' ')}). Monitor content, users, and
          exam activity from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={String(data.users.total)}
          href={user?.role === 'super_admin' ? '/admin/users' : undefined}
        />
        <StatCard
          label="Published questions"
          value={String(data.content.publishedQuestions)}
          href="/admin/question-bank/questions"
        />
        <StatCard
          label="Published exams"
          value={String(data.content.publishedExams)}
          href="/admin/exams"
        />
        <StatCard
          label="Evaluated attempts"
          value={String(data.activity.attemptsEvaluated)}
          href="/admin/reports"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel space-y-2 !p-4">
          <h2 className="font-medium text-brand-900">Content</h2>
          <p className="text-sm text-ink-muted">
            Categories {data.content.categories} · Topics {data.content.topics}
          </p>
          <p className="text-sm text-ink-muted">
            Questions {data.content.questions} · Series {data.content.testSeries}
          </p>
        </div>
        <div className="panel space-y-2 !p-4">
          <h2 className="font-medium text-brand-900">Users</h2>
          <p className="text-sm text-ink-muted">Students {data.users.students}</p>
          <p className="text-sm text-ink-muted">
            Content managers {data.users.contentManagers}
          </p>
          <p className="text-sm text-ink-muted">
            Super admins {data.users.superAdmins} · Verified {data.users.verified}
          </p>
        </div>
        <div className="panel space-y-2 !p-4">
          <h2 className="font-medium text-brand-900">Activity</h2>
          <p className="text-sm text-ink-muted">
            Attempts {data.activity.attemptsTotal}
          </p>
          <p className="text-sm text-ink-muted">
            In progress {data.activity.attemptsInProgress} · Submitted{' '}
            {data.activity.attemptsSubmitted}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-brand-950">Recent users</h2>
            {user?.role === 'super_admin' ? (
              <Link href="/admin/users" className="text-sm text-brand-700 hover:underline">
                Manage
              </Link>
            ) : null}
          </div>
          {data.recent.users.length === 0 ? (
            <p className="text-sm text-ink-soft">No users yet.</p>
          ) : (
            data.recent.users.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-brand-100 px-3 py-3 text-sm"
              >
                <p className="font-medium text-ink">{item.name}</p>
                <p className="text-xs text-ink-soft">
                  {item.email} · {item.role}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="panel space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-brand-950">Recent exams</h2>
            <Link href="/admin/exams" className="text-sm text-brand-700 hover:underline">
              Manage
            </Link>
          </div>
          {data.recent.exams.length === 0 ? (
            <p className="text-sm text-ink-soft">No exams yet.</p>
          ) : (
            data.recent.exams.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-brand-100 px-3 py-3 text-sm"
              >
                <p className="font-medium text-ink">{item.title}</p>
                <p className="text-xs text-ink-soft">
                  {item.type} · {item.status}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <h2 className="font-display text-2xl text-brand-950">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/question-bank/questions/new" className="btn-primary">
            New question
          </Link>
          <Link href="/admin/exams" className="btn-secondary">
            Create exam
          </Link>
        </div>
      </div>
    </div>
  );
}
