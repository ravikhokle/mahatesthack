import { apiRequest } from '@/lib/api';

export type PublicBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicCurrentAffair = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  eventDate: string;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicSiteSettings = {
  siteName: string;
  supportEmail: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
};

export function listPublishedBlogs() {
  return apiRequest<{ items: PublicBlog[] }>('/public/blogs');
}

export function getPublishedBlog(slug: string) {
  return apiRequest<{ item: PublicBlog }>(`/public/blogs/${slug}`);
}

export function listPublishedCurrentAffairs() {
  return apiRequest<{ items: PublicCurrentAffair[] }>('/public/current-affairs');
}

export function getPublishedCurrentAffair(slug: string) {
  return apiRequest<{ item: PublicCurrentAffair }>(`/public/current-affairs/${slug}`);
}

export function getPublicSettings() {
  return apiRequest<PublicSiteSettings>('/public/settings');
}

export function submitContact(body: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return apiRequest<{ message: string }>('/public/contact', {
    method: 'POST',
    body,
  });
}
