import { apiRequest } from '@/lib/api';

export type PublicSiteSettings = {
  siteName: string;
  supportEmail: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
};

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
