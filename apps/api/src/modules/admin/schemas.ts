import { z } from 'zod';

import { USER_ROLES } from '../users/user.types.js';
import { BLOG_STATUSES } from './blog.model.js';
import { CURRENT_AFFAIR_STATUSES } from './current-affair.model.js';
import { NOTIFICATION_AUDIENCES, NOTIFICATION_STATUSES } from './notification.model.js';

const optionalSlug = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug')
  .optional();

export const usersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(USER_ROLES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userUpdateSchema = z.object({
  role: z.enum(USER_ROLES),
});

export const blogCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: optionalSlug,
  excerpt: z.string().trim().max(500).default(''),
  content: z.string().trim().min(1).max(100000),
  coverImageUrl: z.string().trim().max(1000).default(''),
  status: z.enum(BLOG_STATUSES).default('draft'),
});

export const blogUpdateSchema = blogCreateSchema.partial();

export const currentAffairCreateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: optionalSlug,
  summary: z.string().trim().max(500).default(''),
  content: z.string().trim().min(1).max(100000),
  category: z.string().trim().min(1).max(80).default('General'),
  eventDate: z.union([z.string().date(), z.string().datetime({ offset: true })]),
  status: z.enum(CURRENT_AFFAIR_STATUSES).default('draft'),
});

export const currentAffairUpdateSchema = currentAffairCreateSchema.partial();

export const notificationCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(1).max(2000),
  audience: z.enum(NOTIFICATION_AUDIENCES).default('all'),
  status: z.enum(NOTIFICATION_STATUSES).default('draft'),
});

export const notificationUpdateSchema = notificationCreateSchema.partial();

export const settingsUpdateSchema = z.object({
  siteName: z.string().trim().min(2).max(120).optional(),
  supportEmail: z.string().trim().email().max(160).optional(),
  maintenanceMode: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
  defaultExamDurationMinutes: z.number().int().min(1).max(600).optional(),
});

export type BlogCreateInput = z.infer<typeof blogCreateSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;
export type CurrentAffairCreateInput = z.infer<typeof currentAffairCreateSchema>;
export type CurrentAffairUpdateInput = z.infer<typeof currentAffairUpdateSchema>;
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
