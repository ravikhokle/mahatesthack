import { apiRequest } from '@/lib/api';

import type {
  BookmarkItem,
  DashboardAnalytics,
  DashboardHome,
  LeaderboardResponse,
  PracticeStartResponse,
  PracticeSubmitResponse,
  PracticeTopic,
} from './types';

type Token = string;

export function getDashboardHome(accessToken: Token) {
  return apiRequest<DashboardHome>('/student/home', { accessToken });
}

export function getAnalytics(accessToken: Token) {
  return apiRequest<DashboardAnalytics>('/student/analytics', { accessToken });
}

export function getLeaderboard(accessToken: Token, examId?: string) {
  const query = examId ? `?examId=${examId}` : '';
  return apiRequest<LeaderboardResponse>(`/student/leaderboards${query}`, { accessToken });
}

export function listBookmarks(accessToken: Token) {
  return apiRequest<{ items: BookmarkItem[] }>('/student/bookmarks', { accessToken });
}

export function addBookmark(accessToken: Token, questionId: string, note = '') {
  return apiRequest<{ item: BookmarkItem }>('/student/bookmarks', {
    method: 'POST',
    accessToken,
    body: { questionId, note },
  });
}

export function removeBookmark(accessToken: Token, id: string) {
  return apiRequest<void>(`/student/bookmarks/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function listPracticeTopics(accessToken: Token) {
  return apiRequest<{ items: PracticeTopic[] }>('/student/practice/topics', { accessToken });
}

export function startPractice(accessToken: Token, topicId: string, count = 10) {
  return apiRequest<PracticeStartResponse>('/student/practice/sessions', {
    method: 'POST',
    accessToken,
    body: { topicId, count },
  });
}

export function submitPractice(
  accessToken: Token,
  sessionId: string,
  answers: Array<{ questionId: string; selectedOptionIds: string[] }>,
) {
  return apiRequest<PracticeSubmitResponse>(`/student/practice/sessions/${sessionId}/submit`, {
    method: 'POST',
    accessToken,
    body: { answers },
  });
}
