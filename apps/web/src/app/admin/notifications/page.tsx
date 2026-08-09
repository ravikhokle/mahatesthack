'use client';

import { useEffect, useState } from 'react';

import * as adminApi from '@/features/admin/api';
import type { PublicNotification } from '@/features/admin/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

export default function AdminNotificationsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<PublicNotification[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all' | 'students' | 'staff'>('all');
  const [status, setStatus] = useState<'draft' | 'sent'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) return;
    const result = await adminApi.listNotifications(accessToken);
    setItems(result.items);
  };

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load notifications');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const create = async () => {
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      await adminApi.createNotification(accessToken, { title, body, audience, status });
      setTitle('');
      setBody('');
      setAudience('all');
      setStatus('draft');
      setMessage(status === 'sent' ? 'Notification sent.' : 'Draft saved.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  };

  const markSent = async (id: string) => {
    if (!accessToken) return;
    try {
      await adminApi.updateNotification(accessToken, id, { status: 'sent' });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    try {
      await adminApi.deleteNotification(accessToken, id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Notifications</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Draft platform announcements for all users, students, or staff.
        </p>
      </div>

      <div className="panel space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">Compose</h2>
        <input
          className="input-field"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="input-field min-h-28"
          placeholder="Message body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="input-field"
            value={audience}
            onChange={(event) =>
              setAudience(event.target.value as 'all' | 'students' | 'staff')
            }
          >
            <option value="all">All users</option>
            <option value="students">Students</option>
            <option value="staff">Staff</option>
          </select>
          <select
            className="input-field"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'draft' | 'sent')}
          >
            <option value="draft">Save as draft</option>
            <option value="sent">Send now</option>
          </select>
        </div>
        <button type="button" className="btn-primary" onClick={() => void create()}>
          {status === 'sent' ? 'Send notification' : 'Save draft'}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="panel text-sm text-ink-soft">No notifications yet.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="panel space-y-2 !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-sm text-ink-muted">{item.body}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Audience: {item.audience} · {item.status}
                    {item.sentAt ? ` · ${new Date(item.sentAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === 'draft' ? (
                    <button
                      type="button"
                      className="btn-secondary !py-1.5"
                      onClick={() => void markSent(item.id)}
                    >
                      Send
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn-secondary !py-1.5"
                    onClick={() => void remove(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
