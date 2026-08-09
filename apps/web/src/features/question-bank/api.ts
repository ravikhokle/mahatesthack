import { apiRequest } from '@/lib/api';

import type {
  Category,
  Chapter,
  Question,
  QuestionListResponse,
  Subject,
  Topic,
} from './types';

type Token = string;

function auth(accessToken: Token) {
  return { accessToken };
}

export function listCategories(accessToken: Token) {
  return apiRequest<{ items: Category[] }>('/question-bank/categories', auth(accessToken));
}

export function createCategory(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: Category }>('/question-bank/categories', {
    method: 'POST',
    body,
    ...auth(accessToken),
  });
}

export function updateCategory(accessToken: Token, id: string, body: Record<string, unknown>) {
  return apiRequest<{ item: Category }>(`/question-bank/categories/${id}`, {
    method: 'PATCH',
    body,
    ...auth(accessToken),
  });
}

export function deleteCategory(accessToken: Token, id: string) {
  return apiRequest<void>(`/question-bank/categories/${id}`, {
    method: 'DELETE',
    ...auth(accessToken),
  });
}

export function listSubjects(accessToken: Token, categoryId?: string) {
  const query = categoryId ? `?categoryId=${categoryId}` : '';
  return apiRequest<{ items: Subject[] }>(`/question-bank/subjects${query}`, auth(accessToken));
}

export function createSubject(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: Subject }>('/question-bank/subjects', {
    method: 'POST',
    body,
    ...auth(accessToken),
  });
}

export function updateSubject(accessToken: Token, id: string, body: Record<string, unknown>) {
  return apiRequest<{ item: Subject }>(`/question-bank/subjects/${id}`, {
    method: 'PATCH',
    body,
    ...auth(accessToken),
  });
}

export function deleteSubject(accessToken: Token, id: string) {
  return apiRequest<void>(`/question-bank/subjects/${id}`, {
    method: 'DELETE',
    ...auth(accessToken),
  });
}

export function listChapters(accessToken: Token, subjectId?: string) {
  const query = subjectId ? `?subjectId=${subjectId}` : '';
  return apiRequest<{ items: Chapter[] }>(`/question-bank/chapters${query}`, auth(accessToken));
}

export function createChapter(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: Chapter }>('/question-bank/chapters', {
    method: 'POST',
    body,
    ...auth(accessToken),
  });
}

export function updateChapter(accessToken: Token, id: string, body: Record<string, unknown>) {
  return apiRequest<{ item: Chapter }>(`/question-bank/chapters/${id}`, {
    method: 'PATCH',
    body,
    ...auth(accessToken),
  });
}

export function deleteChapter(accessToken: Token, id: string) {
  return apiRequest<void>(`/question-bank/chapters/${id}`, {
    method: 'DELETE',
    ...auth(accessToken),
  });
}

export function listTopics(accessToken: Token, chapterId?: string) {
  const query = chapterId ? `?chapterId=${chapterId}` : '';
  return apiRequest<{ items: Topic[] }>(`/question-bank/topics${query}`, auth(accessToken));
}

export function createTopic(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: Topic }>('/question-bank/topics', {
    method: 'POST',
    body,
    ...auth(accessToken),
  });
}

export function updateTopic(accessToken: Token, id: string, body: Record<string, unknown>) {
  return apiRequest<{ item: Topic }>(`/question-bank/topics/${id}`, {
    method: 'PATCH',
    body,
    ...auth(accessToken),
  });
}

export function deleteTopic(accessToken: Token, id: string) {
  return apiRequest<void>(`/question-bank/topics/${id}`, {
    method: 'DELETE',
    ...auth(accessToken),
  });
}

export function listQuestions(accessToken: Token, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return apiRequest<QuestionListResponse>(
    `/question-bank/questions${query ? `?${query}` : ''}`,
    auth(accessToken),
  );
}

export function getQuestion(accessToken: Token, id: string) {
  return apiRequest<{ item: Question }>(`/question-bank/questions/${id}`, auth(accessToken));
}

export function createQuestion(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: Question }>('/question-bank/questions', {
    method: 'POST',
    body,
    ...auth(accessToken),
  });
}

export function updateQuestion(accessToken: Token, id: string, body: Record<string, unknown>) {
  return apiRequest<{ item: Question }>(`/question-bank/questions/${id}`, {
    method: 'PATCH',
    body,
    ...auth(accessToken),
  });
}

export function deleteQuestion(accessToken: Token, id: string) {
  return apiRequest<void>(`/question-bank/questions/${id}`, {
    method: 'DELETE',
    ...auth(accessToken),
  });
}

export function bulkImportQuestions(accessToken: Token, questions: unknown[]) {
  return apiRequest<{ created: number; items: Question[] }>('/question-bank/questions/bulk-import', {
    method: 'POST',
    body: { questions },
    ...auth(accessToken),
  });
}

export async function uploadImage(accessToken: Token, file: File) {
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? '/backend'}/question-bank/uploads`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: form,
    },
  );

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorBody = data as { error?: { message?: string } } | null;
    throw new Error(errorBody?.error?.message ?? 'Upload failed');
  }

  return data as { url: string; filename: string };
}

export function mediaUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  const base = process.env.NEXT_PUBLIC_API_URL ?? '/backend';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
