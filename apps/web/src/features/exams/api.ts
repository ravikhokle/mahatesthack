import { apiRequest } from '@/lib/api';

import type {
  ExamPackage,
  ExamResult,
  PublicAttempt,
  PublicExam,
  PublicTestSeries,
} from './types';

type Token = string;

export function listExams(accessToken: Token, params?: { type?: string; status?: string }) {
  const search = new URLSearchParams();
  if (params?.type) search.set('type', params.type);
  if (params?.status) search.set('status', params.status);
  const query = search.toString();
  return apiRequest<{ items: PublicExam[] }>(`/exams${query ? `?${query}` : ''}`, {
    accessToken,
  });
}

export function createExam(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: PublicExam }>('/exams', {
    method: 'POST',
    accessToken,
    body,
  });
}

export function updateExam(accessToken: Token, id: string, body: Record<string, unknown>) {
  return apiRequest<{ item: PublicExam }>(`/exams/${id}`, {
    method: 'PATCH',
    accessToken,
    body,
  });
}

export function deleteExam(accessToken: Token, id: string) {
  return apiRequest<void>(`/exams/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function listTestSeries(accessToken: Token) {
  return apiRequest<{ items: PublicTestSeries[] }>('/test-series', { accessToken });
}

export function createTestSeries(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: PublicTestSeries }>('/test-series', {
    method: 'POST',
    accessToken,
    body,
  });
}

export function startAttempt(accessToken: Token, examId: string) {
  return apiRequest<{ attempt: PublicAttempt; package: ExamPackage }>(
    `/exams/${examId}/attempts`,
    {
      method: 'POST',
      accessToken,
    },
  );
}

export function getPackage(accessToken: Token, attemptId: string) {
  return apiRequest<{ package: ExamPackage }>(`/attempts/${attemptId}/package`, {
    accessToken,
  });
}

export function syncAttempt(
  accessToken: Token,
  attemptId: string,
  body: {
    answers: Record<string, unknown>;
    currentQuestionId?: string | null;
    remainingSeconds?: number;
  },
) {
  return apiRequest<{ remainingSeconds: number; status: string }>(
    `/attempts/${attemptId}/sync`,
    {
      method: 'POST',
      accessToken,
      body,
    },
  );
}

export function submitAttempt(accessToken: Token, attemptId: string) {
  return apiRequest<{ attempt: PublicAttempt }>(`/attempts/${attemptId}/submit`, {
    method: 'POST',
    accessToken,
  });
}

export function listMyAttempts(accessToken: Token) {
  return apiRequest<{ items: PublicAttempt[] }>('/attempts/mine', { accessToken });
}

export function getResult(accessToken: Token, attemptId: string) {
  return apiRequest<{ result: ExamResult }>(`/attempts/${attemptId}/result`, {
    accessToken,
  });
}

export function getWsUrl(accessToken: string): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured) {
    return `${configured}/exams/ws?token=${encodeURIComponent(accessToken)}`;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Direct to API in local dev (Next rewrite does not proxy WS reliably).
    return `${protocol}//127.0.0.1:4000/exams/ws?token=${encodeURIComponent(accessToken)}`;
  }

  return `ws://127.0.0.1:4000/exams/ws?token=${encodeURIComponent(accessToken)}`;
}
