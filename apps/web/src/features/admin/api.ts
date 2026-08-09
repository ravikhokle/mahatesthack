import { apiRequest } from '@/lib/api';

import type {
  AdminDashboardStats,
  AdminReports,
  AdminUser,
  PublicBlog,
  PublicCurrentAffair,
  PublicNotification,
  PublicPlatformSettings,
} from './types';

type Token = string;

export function getAdminDashboard(accessToken: Token) {
  return apiRequest<AdminDashboardStats>('/admin/dashboard', { accessToken });
}

export function getAdminReports(accessToken: Token) {
  return apiRequest<AdminReports>('/admin/reports', { accessToken });
}

export function listUsers(
  accessToken: Token,
  params?: { q?: string; role?: string; page?: number; limit?: number },
) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.role) search.set('role', params.role);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<{ items: AdminUser[]; total: number; page: number; limit: number }>(
    `/admin/users${query ? `?${query}` : ''}`,
    { accessToken },
  );
}

export function updateUserRole(
  accessToken: Token,
  id: string,
  role: AdminUser['role'],
) {
  return apiRequest<{ item: AdminUser }>(`/admin/users/${id}`, {
    method: 'PATCH',
    accessToken,
    body: { role },
  });
}

export function listBlogs(accessToken: Token) {
  return apiRequest<{ items: PublicBlog[] }>('/admin/blogs', { accessToken });
}

export function createBlog(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: PublicBlog }>('/admin/blogs', {
    method: 'POST',
    accessToken,
    body,
  });
}

export function updateBlog(accessToken: Token, id: string, body: Record<string, unknown>) {
  return apiRequest<{ item: PublicBlog }>(`/admin/blogs/${id}`, {
    method: 'PATCH',
    accessToken,
    body,
  });
}

export function deleteBlog(accessToken: Token, id: string) {
  return apiRequest<void>(`/admin/blogs/${id}`, { method: 'DELETE', accessToken });
}

export function listCurrentAffairs(accessToken: Token) {
  return apiRequest<{ items: PublicCurrentAffair[] }>('/admin/current-affairs', {
    accessToken,
  });
}

export function createCurrentAffair(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: PublicCurrentAffair }>('/admin/current-affairs', {
    method: 'POST',
    accessToken,
    body,
  });
}

export function updateCurrentAffair(
  accessToken: Token,
  id: string,
  body: Record<string, unknown>,
) {
  return apiRequest<{ item: PublicCurrentAffair }>(`/admin/current-affairs/${id}`, {
    method: 'PATCH',
    accessToken,
    body,
  });
}

export function deleteCurrentAffair(accessToken: Token, id: string) {
  return apiRequest<void>(`/admin/current-affairs/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function listNotifications(accessToken: Token) {
  return apiRequest<{ items: PublicNotification[] }>('/admin/notifications', {
    accessToken,
  });
}

export function createNotification(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<{ item: PublicNotification }>('/admin/notifications', {
    method: 'POST',
    accessToken,
    body,
  });
}

export function updateNotification(
  accessToken: Token,
  id: string,
  body: Record<string, unknown>,
) {
  return apiRequest<{ item: PublicNotification }>(`/admin/notifications/${id}`, {
    method: 'PATCH',
    accessToken,
    body,
  });
}

export function deleteNotification(accessToken: Token, id: string) {
  return apiRequest<void>(`/admin/notifications/${id}`, {
    method: 'DELETE',
    accessToken,
  });
}

export function getSettings(accessToken: Token) {
  return apiRequest<PublicPlatformSettings>('/admin/settings', { accessToken });
}

export function updateSettings(accessToken: Token, body: Record<string, unknown>) {
  return apiRequest<PublicPlatformSettings>('/admin/settings', {
    method: 'PATCH',
    accessToken,
    body,
  });
}
