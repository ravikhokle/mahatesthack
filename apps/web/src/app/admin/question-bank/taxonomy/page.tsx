'use client';

import { useCallback, useEffect, useState } from 'react';

import * as qb from '@/features/question-bank/api';
import type { Category, Chapter, Subject, Topic } from '@/features/question-bank/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

type Level = 'category' | 'subject' | 'chapter' | 'topic';

export default function TaxonomyPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState<Level>('category');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    const [cats, subs, chaps, tops] = await Promise.all([
      qb.listCategories(accessToken),
      qb.listSubjects(accessToken, categoryId || undefined),
      qb.listChapters(accessToken, subjectId || undefined),
      qb.listTopics(accessToken, chapterId || undefined),
    ]);
    setCategories(cats.items);
    setSubjects(subs.items);
    setChapters(chaps.items);
    setTopics(tops.items);
  }, [accessToken, categoryId, subjectId, chapterId]);

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load taxonomy');
    });
  }, [reload]);

  const onCreate = async () => {
    if (!accessToken || !name.trim()) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      if (creating === 'category') {
        await qb.createCategory(accessToken, { name, description });
      } else if (creating === 'subject') {
        if (!categoryId) throw new Error('Select a category first');
        await qb.createSubject(accessToken, { categoryId, name, description });
      } else if (creating === 'chapter') {
        if (!subjectId) throw new Error('Select a subject first');
        await qb.createChapter(accessToken, { subjectId, name, description });
      } else {
        if (!chapterId) throw new Error('Select a chapter first');
        await qb.createTopic(accessToken, { chapterId, name, description });
      }
      setName('');
      setDescription('');
      setMessage('Created successfully');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  const onDelete = async (level: Level, id: string) => {
    if (!accessToken) {
      return;
    }
    setError(null);
    try {
      if (level === 'category') await qb.deleteCategory(accessToken, id);
      if (level === 'subject') await qb.deleteSubject(accessToken, id);
      if (level === 'chapter') await qb.deleteChapter(accessToken, id);
      if (level === 'topic') await qb.deleteTopic(accessToken, id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Taxonomy</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Category → Subject → Chapter → Topic. Build this tree before adding questions.
        </p>
      </div>

      <div className="panel space-y-4">
        <h2 className="text-lg font-semibold text-brand-900">Add item</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Type</span>
            <select
              className="input-field"
              value={creating}
              onChange={(event) => setCreating(event.target.value as Level)}
            >
              <option value="category">Category</option>
              <option value="subject">Subject</option>
              <option value="chapter">Chapter</option>
              <option value="topic">Topic</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink-muted">Name</span>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-ink-muted">Description</span>
          <textarea
            className="input-field min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button type="button" className="btn-primary" onClick={() => void onCreate()}>
          Create
        </button>
        {message ? <p className="text-sm text-brand-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TaxonomyList
          title="Categories"
          items={categories}
          selectedId={categoryId}
          onSelect={(id) => {
            setCategoryId(id);
            setSubjectId('');
            setChapterId('');
          }}
          onDelete={(id) => void onDelete('category', id)}
        />
        <TaxonomyList
          title="Subjects"
          items={subjects}
          selectedId={subjectId}
          onSelect={(id) => {
            setSubjectId(id);
            setChapterId('');
          }}
          onDelete={(id) => void onDelete('subject', id)}
        />
        <TaxonomyList
          title="Chapters"
          items={chapters}
          selectedId={chapterId}
          onSelect={setChapterId}
          onDelete={(id) => void onDelete('chapter', id)}
        />
        <TaxonomyList
          title="Topics"
          items={topics}
          selectedId=""
          onSelect={() => undefined}
          onDelete={(id) => void onDelete('topic', id)}
        />
      </div>
    </div>
  );
}

function TaxonomyList({
  title,
  items,
  selectedId,
  onSelect,
  onDelete,
}: {
  title: string;
  items: Array<{ id: string; name: string; description: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="panel !p-4">
      <h3 className="font-semibold text-brand-900">{title}</h3>
      <ul className="mt-3 max-h-72 space-y-2 overflow-auto">
        {items.length === 0 ? (
          <li className="text-sm text-ink-soft">No items yet</li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className={`flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                selectedId === item.id ? 'border-brand-500 bg-brand-50' : 'border-brand-100'
              }`}
            >
              <button type="button" className="text-left" onClick={() => onSelect(item.id)}>
                <span className="font-medium text-ink">{item.name}</span>
                {item.description ? (
                  <span className="mt-0.5 block text-xs text-ink-soft">{item.description}</span>
                ) : null}
              </button>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
