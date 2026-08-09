'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import * as qb from '@/features/question-bank/api';
import { useAuthStore } from '@/features/auth/store';

export default function QuestionBankOverviewPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [stats, setStats] = useState({
    categories: 0,
    subjects: 0,
    chapters: 0,
    topics: 0,
    questions: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void (async () => {
      try {
        const [categories, subjects, chapters, topics, questions] = await Promise.all([
          qb.listCategories(accessToken),
          qb.listSubjects(accessToken),
          qb.listChapters(accessToken),
          qb.listTopics(accessToken),
          qb.listQuestions(accessToken, { limit: 1, page: 1 }),
        ]);
        setStats({
          categories: categories.items.length,
          subjects: subjects.items.length,
          chapters: chapters.items.length,
          topics: topics.items.length,
          questions: questions.total,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview');
      }
    })();
  }, [accessToken]);

  const cards = [
    { label: 'Categories', value: stats.categories, href: '/admin/question-bank/taxonomy' },
    { label: 'Subjects', value: stats.subjects, href: '/admin/question-bank/taxonomy' },
    { label: 'Chapters', value: stats.chapters, href: '/admin/question-bank/taxonomy' },
    { label: 'Topics', value: stats.topics, href: '/admin/question-bank/taxonomy' },
    { label: 'Questions', value: stats.questions, href: '/admin/question-bank/questions' },
  ];

  return (
    <div className="space-y-6">
      <div className="panel">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Question Bank
        </p>
        <h1 className="mt-2 font-display text-3xl text-brand-950">Content overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          Manage exam taxonomy and build high-quality MCQs with explanations, images, and bulk
          import.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/question-bank/questions/new" className="btn-primary">
            Create question
          </Link>
          <Link href="/admin/question-bank/import" className="btn-secondary">
            Bulk import
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="panel transition hover:border-brand-300 hover:shadow-soft"
          >
            <p className="text-sm text-ink-soft">{card.label}</p>
            <p className="mt-2 font-display text-3xl text-brand-900">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
