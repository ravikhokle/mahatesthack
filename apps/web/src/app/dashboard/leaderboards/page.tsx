'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import * as examsApi from '@/features/exams/api';
import type { PublicExam } from '@/features/exams/types';
import * as studentApi from '@/features/student/api';
import type { LeaderboardResponse } from '@/features/student/types';
import { ApiError } from '@/lib/api';

export default function LeaderboardsPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const [exams, setExams] = useState<PublicExam[]>([]);
  const [examId, setExamId] = useState('');
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void examsApi.listExams(accessToken).then((result) => setExams(result.items));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    void studentApi
      .getLeaderboard(accessToken, examId || undefined)
      .then(setBoard)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load leaderboard');
      });
  }, [accessToken, examId]);

  return (
    <div className="space-y-6">
      <div className="panel">
        <h1 className="font-display text-3xl text-brand-950">Leaderboards</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Top scores from evaluated attempts. Cached briefly in Redis for speed.
        </p>
        <label className="mt-4 block max-w-md text-sm">
          <span className="mb-1 block text-ink-muted">Scope</span>
          <select
            className="input-field"
            value={examId}
            onChange={(event) => setExamId(event.target.value)}
          >
            <option value="">Global (best per exam)</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="panel overflow-x-auto">
        {!board ? (
          <p className="text-sm text-ink-soft">Loading ranks…</p>
        ) : board.items.length === 0 ? (
          <p className="text-sm text-ink-soft">No ranked attempts yet.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-brand-100 text-ink-soft">
              <tr>
                <th className="py-2 pr-3 font-medium">Rank</th>
                <th className="py-2 pr-3 font-medium">Student</th>
                <th className="py-2 pr-3 font-medium">Exam</th>
                <th className="py-2 pr-3 font-medium">Score</th>
                <th className="py-2 font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {board.items.map((item) => {
                const isMe = item.userId === user?.id;
                return (
                  <tr
                    key={`${item.userId}-${item.examTitle}-${item.rank}`}
                    className={`border-b border-brand-50 ${isMe ? 'bg-brand-50/80' : ''}`}
                  >
                    <td className="py-3 pr-3 font-semibold text-brand-800">#{item.rank}</td>
                    <td className="py-3 pr-3 text-ink">
                      {item.name}
                      {isMe ? ' (you)' : ''}
                    </td>
                    <td className="py-3 pr-3 text-ink-muted">{item.examTitle}</td>
                    <td className="py-3 pr-3 text-ink">
                      {item.score}/{item.maxScore}
                    </td>
                    <td className="py-3 text-ink">{item.accuracy}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
