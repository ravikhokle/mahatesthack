'use client';

import { useEffect, useState } from 'react';

import * as adminApi from '@/features/admin/api';
import type { PublicCurrentAffair } from '@/features/admin/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

export default function AdminCurrentAffairsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<PublicCurrentAffair[]>([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) return;
    const result = await adminApi.listCurrentAffairs(accessToken);
    setItems(result.items);
  };

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load current affairs');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const create = async () => {
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      await adminApi.createCurrentAffair(accessToken, {
        title,
        summary,
        content,
        category,
        eventDate,
        status,
      });
      setTitle('');
      setSummary('');
      setContent('');
      setCategory('General');
      setStatus('draft');
      setMessage('Current affair saved.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  };

  const setItemStatus = async (id: string, next: 'draft' | 'published') => {
    if (!accessToken) return;
    try {
      await adminApi.updateCurrentAffair(accessToken, id, { status: next });
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    try {
      await adminApi.deleteCurrentAffair(accessToken, id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Current Affairs</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Publish dated national and international updates for exam prep.
        </p>
      </div>

      <div className="panel space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">New entry</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input-field"
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="input-field"
            placeholder="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          <input
            className="input-field"
            type="date"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
          />
          <select
            className="input-field"
            value={status}
            onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <input
          className="input-field"
          placeholder="Summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
        <textarea
          className="input-field min-h-36"
          placeholder="Full content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => void create()}>
          Save entry
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="panel text-sm text-ink-soft">No current affairs yet.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="panel space-y-2 !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-sm text-ink-muted">{item.summary || 'No summary'}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {item.category} · {new Date(item.eventDate).toLocaleDateString()} ·{' '}
                    {item.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary !py-1.5"
                    onClick={() =>
                      void setItemStatus(
                        item.id,
                        item.status === 'published' ? 'draft' : 'published',
                      )
                    }
                  >
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
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
