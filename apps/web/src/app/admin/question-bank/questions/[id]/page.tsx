'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import * as qb from '@/features/question-bank/api';
import { QuestionEditor } from '@/features/question-bank/components/question-editor';
import type { Question } from '@/features/question-bank/types';
import { useAuthStore } from '@/features/auth/store';
import { ApiError } from '@/lib/api';

export default function EditQuestionPage() {
  const params = useParams<{ id: string }>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !params.id) {
      return;
    }
    void qb
      .getQuestion(accessToken, params.id)
      .then((result) => setQuestion(result.item))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load question');
      });
  }, [accessToken, params.id]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!question) {
    return <p className="text-sm text-ink-soft">Loading question…</p>;
  }

  return <QuestionEditor mode="edit" initial={question} />;
}
