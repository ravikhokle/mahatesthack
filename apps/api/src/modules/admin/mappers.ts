import type { BlogDocument } from './blog.model.js';
import type { CurrentAffairDocument } from './current-affair.model.js';
import type { NotificationDocument } from './notification.model.js';
import type { PlatformSettingsDocument } from './settings.model.js';
import type {
  PublicBlog,
  PublicCurrentAffair,
  PublicNotification,
  PublicPlatformSettings,
} from './types.js';

export function toPublicBlog(doc: BlogDocument): PublicBlog {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    content: doc.content,
    coverImageUrl: doc.coverImageUrl,
    status: doc.status,
    authorId: doc.authorId.toString(),
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicCurrentAffair(doc: CurrentAffairDocument): PublicCurrentAffair {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    summary: doc.summary,
    content: doc.content,
    category: doc.category,
    eventDate: doc.eventDate.toISOString(),
    status: doc.status,
    authorId: doc.authorId.toString(),
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicNotification(doc: NotificationDocument): PublicNotification {
  return {
    id: doc._id.toString(),
    title: doc.title,
    body: doc.body,
    audience: doc.audience,
    status: doc.status,
    createdBy: doc.createdBy.toString(),
    sentAt: doc.sentAt ? doc.sentAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicSettings(doc: PlatformSettingsDocument): PublicPlatformSettings {
  return {
    siteName: doc.siteName,
    supportEmail: doc.supportEmail,
    maintenanceMode: doc.maintenanceMode,
    allowRegistration: doc.allowRegistration,
    defaultExamDurationMinutes: doc.defaultExamDurationMinutes,
    updatedAt: doc.updatedAt.toISOString(),
  };
}
