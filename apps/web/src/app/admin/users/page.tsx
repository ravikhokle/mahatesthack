'use client';

import { useEffect, useState } from 'react';

import * as adminApi from '@/features/admin/api';
import type { AdminUser } from '@/features/admin/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

const ROLES: AdminUser['role'][] = ['student', 'content_manager', 'super_admin'];

export default function AdminUsersPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) return;
    const result = await adminApi.listUsers(accessToken, {
      q: q || undefined,
      role: role || undefined,
      limit: 50,
    });
    setItems(result.items);
    setTotal(result.total);
  };

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user?.role]);

  if (user?.role !== 'super_admin') {
    return (
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Users</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Only super admins can manage user roles.
        </p>
      </div>
    );
  }

  const onUpdateRole = async (id: string, nextRole: AdminUser['role']) => {
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      await adminApi.updateUserRole(accessToken, id, nextRole);
      setMessage('Role updated.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Users</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Search accounts and assign student, content manager, or super admin roles.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="input-field max-w-xs"
            placeholder="Search name or email"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
          <select
            className="input-field max-w-xs"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">All roles</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              void reload().catch((err: unknown) => {
                setError(err instanceof ApiError ? err.message : 'Failed to load users');
              });
            }}
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-soft">{total} users</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}

      <div className="space-y-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="panel flex flex-wrap items-center justify-between gap-3 !p-4"
          >
            <div>
              <p className="font-medium text-ink">{item.name}</p>
              <p className="text-sm text-ink-muted">{item.email}</p>
              <p className="text-xs text-ink-soft">
                {item.emailVerified ? 'Verified' : 'Unverified'} · Joined{' '}
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
            <select
              className="input-field max-w-[200px]"
              value={item.role}
              onChange={(event) =>
                void onUpdateRole(item.id, event.target.value as AdminUser['role'])
              }
            >
              {ROLES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </article>
        ))}
      </div>
    </div>
  );
}
