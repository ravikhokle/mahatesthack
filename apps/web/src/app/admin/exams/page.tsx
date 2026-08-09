'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as qbApi from '@/features/question-bank/api';
import type { Question } from '@/features/question-bank/types';
import * as examsApi from '@/features/exams/api';
import type { PublicExam, PublicTestSeries } from '@/features/exams/types';
import { ApiError } from '@/lib/api';

export default function AdminExamsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [exams, setExams] = useState<PublicExam[]>([]);
  const [series, setSeries] = useState<PublicTestSeries[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('mock');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    if (!accessToken) return;
    const [examResult, seriesResult, questionResult] = await Promise.all([
      examsApi.listExams(accessToken),
      examsApi.listTestSeries(accessToken),
      qbApi.listQuestions(accessToken, { status: 'published', limit: 100 }),
    ]);
    setExams(examResult.items);
    setSeries(seriesResult.items);
    setQuestions(questionResult.items);
  };

  useEffect(() => {
    void reload().catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Failed to load');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const createExam = async () => {
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      await examsApi.createExam(accessToken, {
        title,
        description,
        type,
        durationMinutes,
        questionIds: selectedQuestionIds,
        negativeMarking: true,
        status: 'published',
        ...(type === 'previous_year' ? { year: new Date().getFullYear() } : {}),
        ...(type === 'daily_quiz'
          ? { quizDate: new Date().toISOString().slice(0, 10) }
          : {}),
      });
      setTitle('');
      setDescription('');
      setSelectedQuestionIds([]);
      setMessage('Exam created and published.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    }
  };

  const createSeries = async () => {
    if (!accessToken) return;
    setError(null);
    try {
      await examsApi.createTestSeries(accessToken, {
        title: seriesTitle,
        description: '',
        examIds: exams.filter((exam) => exam.type === 'test_series').map((exam) => exam.id),
      });
      setSeriesTitle('');
      setMessage('Test series created.');
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Series create failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Exams</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Create mock tests, previous year papers, daily quizzes, and test series from published
          questions.
        </p>
      </div>

      <div className="panel space-y-4">
        <h2 className="text-lg font-semibold text-brand-900">Create exam</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input-field"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="mock">Mock test</option>
            <option value="test_series">Test series item</option>
            <option value="previous_year">Previous year</option>
            <option value="daily_quiz">Daily quiz</option>
          </select>
          <input
            type="number"
            className="input-field"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          />
        </div>
        <textarea
          className="input-field min-h-[80px]"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <p className="mb-2 text-sm text-ink-muted">
            Select published questions ({selectedQuestionIds.length} selected)
          </p>
          <div className="max-h-64 space-y-2 overflow-auto rounded-md border border-brand-100 p-3">
            {questions.length === 0 ? (
              <p className="text-sm text-ink-soft">No published questions available.</p>
            ) : (
              questions.map((question) => (
                <label key={question.id} className="flex cursor-pointer gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedQuestionIds.includes(question.id)}
                    onChange={() => toggleQuestion(question.id)}
                  />
                  <span className="line-clamp-2" dangerouslySetInnerHTML={{ __html: question.stem }} />
                </label>
              ))
            )}
          </div>
        </div>

        <button type="button" className="btn-primary" onClick={() => void createExam()}>
          Publish exam
        </button>
        {message ? <p className="text-sm text-brand-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="panel space-y-3">
        <h2 className="text-lg font-semibold text-brand-900">Test series</h2>
        <div className="flex flex-wrap gap-3">
          <input
            className="input-field max-w-sm"
            placeholder="Series title"
            value={seriesTitle}
            onChange={(e) => setSeriesTitle(e.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={() => void createSeries()}>
            Create series
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {series.map((item) => (
            <li key={item.id} className="rounded-md border border-brand-100 px-3 py-2">
              {item.title} · {item.examIds.length} exams
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2 className="text-lg font-semibold text-brand-900">All exams</h2>
        <ul className="mt-3 space-y-2">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand-100 px-3 py-2 text-sm"
            >
              <span>
                {exam.title} · {exam.type} · {exam.status}
              </span>
              <button
                type="button"
                className="text-red-600 hover:underline"
                onClick={() => {
                  if (!accessToken) return;
                  void examsApi.deleteExam(accessToken, exam.id).then(() => reload());
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
