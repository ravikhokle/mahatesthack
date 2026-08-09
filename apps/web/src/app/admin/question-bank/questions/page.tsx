'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import * as qb from '@/features/question-bank/api';
import type { Question } from '@/features/question-bank/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

export default function QuestionsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void (async () => {
      try {
        const result = await qb.listQuestions(accessToken, {
          page,
          limit: 20,
          search: search || undefined,
          status: status || undefined,
        });
        setItems(result.items);
        setTotal(result.total);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load questions');
      }
    })();
  }, [accessToken, page, search, status]);

  const onDelete = async (id: string) => {
    if (!accessToken) {
      return;
    }
    try {
      await qb.deleteQuestion(accessToken, id);
      setItems((current) => current.filter((item) => item.id !== id));
      setTotal((value) => Math.max(0, value - 1));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-brand-950">Questions</h1>
          <p className="mt-2 text-sm text-ink-muted">{total} total questions</p>
        </div>
        <Link href="/admin/question-bank/questions/new" className="btn-primary">
          New question
        </Link>
      </div>

      <div className="panel grid gap-3 sm:grid-cols-[1fr_180px]">
        <input
          className="input-field"
          placeholder="Search stem or tags…"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />
        <select
          className="input-field"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="panel text-sm text-ink-soft">No questions yet.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="panel !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-800">
                      {item.difficulty}
                    </span>
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-800">
                      {item.status}
                    </span>
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-800">
                      {item.marks} mark{item.marks === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm mt-2 max-w-none text-ink"
                    dangerouslySetInnerHTML={{ __html: item.stem }}
                  />
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/question-bank/questions/${item.id}`}
                    className="btn-secondary !px-3 !py-1.5"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => void onDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="btn-secondary"
          disabled={page <= 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          Previous
        </button>
        <p className="text-sm text-ink-soft">Page {page}</p>
        <button
          type="button"
          className="btn-secondary"
          disabled={items.length < 20}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
