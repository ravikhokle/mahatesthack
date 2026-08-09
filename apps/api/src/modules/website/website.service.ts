import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import { sendEmail } from '../../lib/email.js';
import { BlogModel } from '../admin/blog.model.js';
import { CurrentAffairModel } from '../admin/current-affair.model.js';
import { toPublicBlog, toPublicCurrentAffair, toPublicSettings } from '../admin/mappers.js';
import { SettingsModel } from '../admin/settings.model.js';
import type { PublicBlog, PublicCurrentAffair, PublicPlatformSettings } from '../admin/types.js';
import { ContactMessageModel } from './contact.model.js';
import type { ContactCreateInput } from './schemas.js';

export class WebsiteService {
  async listPublishedBlogs(): Promise<PublicBlog[]> {
    const docs = await BlogModel.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 });
    return docs.map(toPublicBlog);
  }

  async getPublishedBlogBySlug(slug: string): Promise<PublicBlog> {
    const doc = await BlogModel.findOne({ slug, status: 'published' });
    if (!doc) {
      throw new AppError('Blog post not found', 404, 'NOT_FOUND');
    }
    return toPublicBlog(doc);
  }

  async listPublishedCurrentAffairs(): Promise<PublicCurrentAffair[]> {
    const docs = await CurrentAffairModel.find({ status: 'published' }).sort({
      eventDate: -1,
    });
    return docs.map(toPublicCurrentAffair);
  }

  async getPublishedCurrentAffairBySlug(slug: string): Promise<PublicCurrentAffair> {
    const doc = await CurrentAffairModel.findOne({ slug, status: 'published' });
    if (!doc) {
      throw new AppError('Current affair not found', 404, 'NOT_FOUND');
    }
    return toPublicCurrentAffair(doc);
  }

  async getPublicSettings(): Promise<Pick<PublicPlatformSettings, 'siteName' | 'supportEmail' | 'allowRegistration' | 'maintenanceMode'>> {
    let doc = await SettingsModel.findOne({ key: 'platform' });
    if (!doc) {
      doc = await SettingsModel.create({ key: 'platform' });
    }
    const settings = toPublicSettings(doc);
    return {
      siteName: settings.siteName,
      supportEmail: settings.supportEmail,
      allowRegistration: settings.allowRegistration,
      maintenanceMode: settings.maintenanceMode,
    };
  }

  async submitContact(input: ContactCreateInput): Promise<{ message: string }> {
    await ContactMessageModel.create(input);

    const settings = await this.getPublicSettings();
    await sendEmail({
      to: settings.supportEmail,
      subject: `[${env.APP_NAME} Contact] ${input.subject}`,
      html: `
        <p><strong>From:</strong> ${input.name} &lt;${input.email}&gt;</p>
        <p><strong>Subject:</strong> ${input.subject}</p>
        <p>${input.message.replace(/\n/g, '<br/>')}</p>
      `,
    });

    return { message: 'Thanks — we received your message and will reply soon.' };
  }
}
