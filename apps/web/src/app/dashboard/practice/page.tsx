'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as studentApi from '@/features/student/api';
import type {
  PracticeQuestion,
  PracticeStartResponse,
  PracticeSubmitResponse,
  PracticeTopic,
} from '@/features/student/types';
import { ApiError } from '@/lib/api';

export default function PracticePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [topics, setTopics] = useState<PracticeTopic[]>([]);
  const [session, setSession] = useState<PracticeStartResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<PracticeSubmitResponse | null>(null);
  const [count, setCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    void studentApi
      .listPracticeTopics(accessToken)
      .then((response) => setTopics(response.items))
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load topics');
      });
  }, [accessToken]);

  const start = async (topicId: string) => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const started = await studentApi.startPractice(accessToken, topicId, count);
      setSession(started);
      setAnswers({});
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start practice');
    } finally {
      setBusy(false);
    }
  };

  const toggleOption = (question: PracticeQuestion, optionId: string) => {
    setAnswers((current) => {
      const previous = current[question.id] ?? [];
      if (question.type === 'mcq_single') {
        return { ...current, [question.id]: [optionId] };
      }
      const next = previous.includes(optionId)
        ? previous.filter((id) => id !== optionId)
        : [...previous, optionId];
      return { ...current, [question.id]: next };
    });
  };

  const submit = async () => {
    if (!accessToken || !session) return;
    setBusy(true);
    setError(null);
    try {
      const payload = session.questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds: answers[question.id] ?? [],
      }));
      const submitted = await studentApi.submitPractice(accessToken, session.sessionId, payload);
      setResult(submitted);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  const bookmarkQuestion = async (questionId: string) => {
    if (!accessToken) return;
    try {
      await studentApi.addBookmark(accessToken, questionId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bookmark failed');
    }
  };

  if (session && !result) {
    return (
      <div className="space-y-6">
        <div className="panel flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Practice
            </p>
            <h1 className="mt-2 font-display text-3xl text-brand-950">{session.topicName}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {session.questions.length} questions · untimed topic drill
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setSession(null)}>
            Exit
          </button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="space-y-4">
          {session.questions.map((question, index) => (
            <article key={question.id} className="panel space-y-3 !p-4">
              <p className="text-xs text-ink-soft">Question {index + 1}</p>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: question.stem }}
              />
              <div className="space-y-2">
                {question.options.map((option) => {
                  const selected = (answers[question.id] ?? []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(question, option.id)}
                      className={`flex w-full rounded-lg border px-3 py-2 text-left text-sm ${
                        selected
                          ? 'border-brand-600 bg-brand-50'
                          : 'border-brand-100 hover:border-brand-300'
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <button type="button" className="btn-primary" disabled={busy} onClick={() => void submit()}>
          {busy ? 'Checking…' : 'Submit practice'}
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="panel">
          <h1 className="font-display text-3xl text-brand-950">Practice result</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Score {result.score}/{result.total} · Accuracy {result.accuracy}%
          </p>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => {
              setResult(null);
              setSession(null);
            }}
          >
            Back to topics
          </button>
        </div>

        {result.results.map((item, index) => (
          <article key={item.questionId} className="panel !p-4">
            <div className="mb-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-800">Q{index + 1}</span>
              <span
                className={`rounded px-2 py-0.5 ${
                  item.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                }`}
              >
                {item.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: item.stem }}
            />
            {item.explanation ? (
              <div
                className="prose prose-sm mt-3 max-w-none rounded-lg bg-surface-tint p-3"
                dangerouslySetInnerHTML={{ __html: item.explanation }}
              />
            ) : null}
            <button
              type="button"
              className="mt-3 text-sm font-medium text-brand-700 hover:underline"
              onClick={() => void bookmarkQuestion(item.questionId)}
            >
              Bookmark question
            </button>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Practice</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Untimed topic drills from published question bank items — instant feedback and
          explanations.
        </p>
        <label className="mt-4 block max-w-xs text-sm">
          <span className="mb-1 block text-ink-muted">Questions per session</span>
          <input
            type="number"
            min={1}
            max={50}
            className="input-field"
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {topics.length === 0 ? (
          <div className="panel text-sm text-ink-soft">
            No practice topics yet. Publish questions under topics first.
          </div>
        ) : (
          topics.map((topic) => (
            <article key={topic.id} className="panel space-y-3 !p-4">
              <h2 className="font-medium text-ink">{topic.name}</h2>
              <p className="text-sm text-ink-muted">{topic.description || 'Topic drill'}</p>
              <p className="text-xs text-ink-soft">{topic.questionCount} published questions</p>
              <button
                type="button"
                className="btn-primary !py-2"
                disabled={busy}
                onClick={() => void start(topic.id)}
              >
                Start practice
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
