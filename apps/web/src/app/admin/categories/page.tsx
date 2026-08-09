'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as qbApi from '@/features/question-bank/api';
import type { Category } from '@/features/question-bank/types';
import { ApiError } from '@/lib/api';

export default function AdminCategoriesPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) return;
    const result = await qbApi.listCategories(accessToken);
    setItems(result.items);
  };

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load categories');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const create = async () => {
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      await qbApi.createCategory(accessToken, { name, description });
      setName('');
      setDescription('');
      setMessage('Category created.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Categories</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Top-level exam categories. Manage subjects, chapters, and topics in Taxonomy.
        </p>
        <Link
          href="/admin/question-bank/taxonomy"
          className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Open full taxonomy →
        </Link>
      </div>

      <div className="panel space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">Add category</h2>
        <input
          className="input-field"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <textarea
          className="input-field min-h-24"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button type="button" className="btn-primary" onClick={() => void create()}>
          Create category
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand-700">{message}</p> : null}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="panel text-sm text-ink-soft">No categories yet.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="panel !p-4">
              <p className="font-medium text-ink">{item.name}</p>
              <p className="text-sm text-ink-muted">{item.description || 'No description'}</p>
              <p className="mt-1 text-xs text-ink-soft">
                /{item.slug} · {item.isActive ? 'Active' : 'Inactive'}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
