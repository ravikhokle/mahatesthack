import type { Redis } from 'ioredis';
import { Types } from 'mongoose';

import { AppError } from '../../lib/errors.js';
import { slugify } from '../../lib/slug.js';
import { AttemptModel } from '../exams/attempt.model.js';
import { ExamModel } from '../exams/exam.model.js';
import { TestSeriesModel } from '../exams/test-series.model.js';
import { CategoryModel } from '../question-bank/category.model.js';
import { ChapterModel } from '../question-bank/chapter.model.js';
import { QuestionModel } from '../question-bank/question.model.js';
import { SubjectModel } from '../question-bank/subject.model.js';
import { TopicModel } from '../question-bank/topic.model.js';
import { toPublicUser } from '../users/user.mapper.js';
import { UserModel } from '../users/user.model.js';
import type { PublicUser, UserRole } from '../users/user.types.js';
import { BlogModel } from './blog.model.js';
import { CurrentAffairModel } from './current-affair.model.js';
import {
  toPublicBlog,
  toPublicCurrentAffair,
  toPublicNotification,
  toPublicSettings,
} from './mappers.js';
import { NotificationModel } from './notification.model.js';
import type {
  BlogCreateInput,
  BlogUpdateInput,
  CurrentAffairCreateInput,
  CurrentAffairUpdateInput,
  NotificationCreateInput,
  NotificationUpdateInput,
  SettingsUpdateInput,
  UsersQuery,
  UserUpdateInput,
} from './schemas.js';
import { SettingsModel } from './settings.model.js';
import type {
  AdminDashboardStats,
  AdminReports,
  PublicBlog,
  PublicCurrentAffair,
  PublicNotification,
  PublicPlatformSettings,
} from './types.js';

const DASHBOARD_CACHE_KEY = 'admin:dashboard:v1';
const DASHBOARD_CACHE_TTL = 60;

function mongoDuplicateMessage(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  ) {
    return 'An item with this slug already exists';
  }
  return null;
}

function parseEventDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('Invalid event date', 400, 'VALIDATION_ERROR');
  }
  return date;
}

export class AdminService {
  constructor(private readonly redis: Redis) {}

  async getDashboard(): Promise<AdminDashboardStats> {
    const cached = await this.redis.get(DASHBOARD_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as AdminDashboardStats;
    }

    const [
      usersTotal,
      students,
      contentManagers,
      superAdmins,
      verified,
      categories,
      subjects,
      chapters,
      topics,
      questions,
      publishedQuestions,
      exams,
      publishedExams,
      testSeries,
      blogs,
      publishedBlogs,
      currentAffairs,
      attemptsTotal,
      attemptsInProgress,
      attemptsSubmitted,
      attemptsEvaluated,
      notificationsSent,
      recentUsers,
      recentExams,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ role: 'student' }),
      UserModel.countDocuments({ role: 'content_manager' }),
      UserModel.countDocuments({ role: 'super_admin' }),
      UserModel.countDocuments({ emailVerified: true }),
      CategoryModel.countDocuments(),
      SubjectModel.countDocuments(),
      ChapterModel.countDocuments(),
      TopicModel.countDocuments(),
      QuestionModel.countDocuments(),
      QuestionModel.countDocuments({ status: 'published' }),
      ExamModel.countDocuments(),
      ExamModel.countDocuments({ status: 'published' }),
      TestSeriesModel.countDocuments(),
      BlogModel.countDocuments(),
      BlogModel.countDocuments({ status: 'published' }),
      CurrentAffairModel.countDocuments(),
      AttemptModel.countDocuments(),
      AttemptModel.countDocuments({ status: 'in_progress' }),
      AttemptModel.countDocuments({ status: 'submitted' }),
      AttemptModel.countDocuments({ status: 'evaluated' }),
      NotificationModel.countDocuments({ status: 'sent' }),
      UserModel.find().sort({ createdAt: -1 }).limit(5),
      ExamModel.find().sort({ createdAt: -1 }).limit(5),
    ]);

    const stats: AdminDashboardStats = {
      users: {
        total: usersTotal,
        students,
        contentManagers,
        superAdmins,
        verified,
      },
      content: {
        categories,
        subjects,
        chapters,
        topics,
        questions,
        publishedQuestions,
        exams,
        publishedExams,
        testSeries,
        blogs,
        publishedBlogs,
        currentAffairs,
      },
      activity: {
        attemptsTotal,
        attemptsInProgress,
        attemptsSubmitted,
        attemptsEvaluated,
        notificationsSent,
      },
      recent: {
        users: recentUsers.map((user) => ({
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        })),
        exams: recentExams.map((exam) => ({
          id: exam._id.toString(),
          title: exam.title,
          type: exam.type,
          status: exam.status,
          createdAt: exam.createdAt.toISOString(),
        })),
      },
    };

    await this.redis.set(DASHBOARD_CACHE_KEY, JSON.stringify(stats), 'EX', DASHBOARD_CACHE_TTL);
    return stats;
  }

  private async invalidateDashboardCache(): Promise<void> {
    await this.redis.del(DASHBOARD_CACHE_KEY);
  }

  async listUsers(query: UsersQuery): Promise<{ items: PublicUser[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {};
    if (query.role) {
      filter.role = query.role;
    }
    if (query.q) {
      const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [docs, total] = await Promise.all([
      UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      UserModel.countDocuments(filter),
    ]);

    return {
      items: docs.map(toPublicUser),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async updateUser(
    actorId: string,
    userId: string,
    input: UserUpdateInput,
  ): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (user._id.toString() === actorId && input.role !== 'super_admin') {
      throw new AppError('You cannot remove your own super admin role', 400, 'BAD_REQUEST');
    }

    if (user.role === 'super_admin' && input.role !== 'super_admin') {
      const superAdminCount = await UserModel.countDocuments({ role: 'super_admin' });
      if (superAdminCount <= 1) {
        throw new AppError('Cannot demote the last super admin', 400, 'BAD_REQUEST');
      }
    }

    user.role = input.role;
    await user.save();
    await this.invalidateDashboardCache();
    return toPublicUser(user);
  }

  async listBlogs(): Promise<PublicBlog[]> {
    const docs = await BlogModel.find().sort({ createdAt: -1 });
    return docs.map(toPublicBlog);
  }

  async createBlog(authorId: string, input: BlogCreateInput): Promise<PublicBlog> {
    try {
      const doc = await BlogModel.create({
        title: input.title,
        slug: input.slug ?? slugify(input.title),
        excerpt: input.excerpt,
        content: input.content,
        coverImageUrl: input.coverImageUrl,
        status: input.status,
        authorId,
        publishedAt: input.status === 'published' ? new Date() : null,
      });
      await this.invalidateDashboardCache();
      return toPublicBlog(doc);
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) throw new AppError(message, 409, 'CONFLICT');
      throw error;
    }
  }

  async updateBlog(id: string, input: BlogUpdateInput): Promise<PublicBlog> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Blog not found', 404, 'NOT_FOUND');
    }
    const doc = await BlogModel.findById(id);
    if (!doc) {
      throw new AppError('Blog not found', 404, 'NOT_FOUND');
    }

    if (input.title !== undefined) doc.title = input.title;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.excerpt !== undefined) doc.excerpt = input.excerpt;
    if (input.content !== undefined) doc.content = input.content;
    if (input.coverImageUrl !== undefined) doc.coverImageUrl = input.coverImageUrl;
    if (input.status !== undefined) {
      doc.status = input.status;
      if (input.status === 'published' && !doc.publishedAt) {
        doc.publishedAt = new Date();
      }
      if (input.status === 'draft') {
        doc.publishedAt = null;
      }
    }

    try {
      await doc.save();
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) throw new AppError(message, 409, 'CONFLICT');
      throw error;
    }

    await this.invalidateDashboardCache();
    return toPublicBlog(doc);
  }

  async deleteBlog(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Blog not found', 404, 'NOT_FOUND');
    }
    const result = await BlogModel.findByIdAndDelete(id);
    if (!result) {
      throw new AppError('Blog not found', 404, 'NOT_FOUND');
    }
    await this.invalidateDashboardCache();
  }

  async listCurrentAffairs(): Promise<PublicCurrentAffair[]> {
    const docs = await CurrentAffairModel.find().sort({ eventDate: -1 });
    return docs.map(toPublicCurrentAffair);
  }

  async createCurrentAffair(
    authorId: string,
    input: CurrentAffairCreateInput,
  ): Promise<PublicCurrentAffair> {
    try {
      const doc = await CurrentAffairModel.create({
        title: input.title,
        slug: input.slug ?? slugify(input.title),
        summary: input.summary,
        content: input.content,
        category: input.category,
        eventDate: parseEventDate(input.eventDate),
        status: input.status,
        authorId,
        publishedAt: input.status === 'published' ? new Date() : null,
      });
      await this.invalidateDashboardCache();
      return toPublicCurrentAffair(doc);
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) throw new AppError(message, 409, 'CONFLICT');
      throw error;
    }
  }

  async updateCurrentAffair(
    id: string,
    input: CurrentAffairUpdateInput,
  ): Promise<PublicCurrentAffair> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Current affair not found', 404, 'NOT_FOUND');
    }
    const doc = await CurrentAffairModel.findById(id);
    if (!doc) {
      throw new AppError('Current affair not found', 404, 'NOT_FOUND');
    }

    if (input.title !== undefined) doc.title = input.title;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.summary !== undefined) doc.summary = input.summary;
    if (input.content !== undefined) doc.content = input.content;
    if (input.category !== undefined) doc.category = input.category;
    if (input.eventDate !== undefined) doc.eventDate = parseEventDate(input.eventDate);
    if (input.status !== undefined) {
      doc.status = input.status;
      if (input.status === 'published' && !doc.publishedAt) {
        doc.publishedAt = new Date();
      }
      if (input.status === 'draft') {
        doc.publishedAt = null;
      }
    }

    try {
      await doc.save();
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) throw new AppError(message, 409, 'CONFLICT');
      throw error;
    }

    await this.invalidateDashboardCache();
    return toPublicCurrentAffair(doc);
  }

  async deleteCurrentAffair(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Current affair not found', 404, 'NOT_FOUND');
    }
    const result = await CurrentAffairModel.findByIdAndDelete(id);
    if (!result) {
      throw new AppError('Current affair not found', 404, 'NOT_FOUND');
    }
    await this.invalidateDashboardCache();
  }

  async listNotifications(): Promise<PublicNotification[]> {
    const docs = await NotificationModel.find().sort({ createdAt: -1 });
    return docs.map(toPublicNotification);
  }

  async createNotification(
    createdBy: string,
    input: NotificationCreateInput,
  ): Promise<PublicNotification> {
    const doc = await NotificationModel.create({
      title: input.title,
      body: input.body,
      audience: input.audience,
      status: input.status,
      createdBy,
      sentAt: input.status === 'sent' ? new Date() : null,
    });
    await this.invalidateDashboardCache();
    return toPublicNotification(doc);
  }

  async updateNotification(
    id: string,
    input: NotificationUpdateInput,
  ): Promise<PublicNotification> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    const doc = await NotificationModel.findById(id);
    if (!doc) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    if (input.title !== undefined) doc.title = input.title;
    if (input.body !== undefined) doc.body = input.body;
    if (input.audience !== undefined) doc.audience = input.audience;
    if (input.status !== undefined) {
      doc.status = input.status;
      if (input.status === 'sent' && !doc.sentAt) {
        doc.sentAt = new Date();
      }
      if (input.status === 'draft') {
        doc.sentAt = null;
      }
    }

    await doc.save();
    await this.invalidateDashboardCache();
    return toPublicNotification(doc);
  }

  async deleteNotification(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    const result = await NotificationModel.findByIdAndDelete(id);
    if (!result) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    await this.invalidateDashboardCache();
  }

  async getReports(): Promise<AdminReports> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 13);
    since.setUTCHours(0, 0, 0, 0);

    const [
      attemptsByDayRaw,
      usersByRoleRaw,
      examsByTypeRaw,
      questionsByStatusRaw,
      scoreAgg,
      topExamsRaw,
    ] = await Promise.all([
      AttemptModel.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      UserModel.aggregate<{ _id: UserRole; count: number }>([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      ExamModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      QuestionModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AttemptModel.aggregate<{ avg: number | null }>([
        { $match: { status: 'evaluated', score: { $ne: null }, maxScore: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            avg: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
          },
        },
      ]),
      AttemptModel.aggregate<{
        _id: Types.ObjectId;
        attempts: number;
        averageScore: number | null;
        title: string;
      }>([
        { $match: { status: 'evaluated' } },
        {
          $group: {
            _id: '$examId',
            attempts: { $sum: 1 },
            averageScore: {
              $avg: {
                $cond: [
                  { $gt: ['$maxScore', 0] },
                  { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] },
                  null,
                ],
              },
            },
          },
        },
        { $sort: { attempts: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'exams',
            localField: '_id',
            foreignField: '_id',
            as: 'exam',
          },
        },
        {
          $project: {
            attempts: 1,
            averageScore: 1,
            title: { $ifNull: [{ $arrayElemAt: ['$exam.title', 0] }, 'Unknown exam'] },
          },
        },
      ]),
    ]);

    const dayMap = new Map(attemptsByDayRaw.map((row) => [row._id, row.count]));
    const attemptsByDay: AdminReports['attemptsByDay'] = [];
    for (let i = 0; i < 14; i += 1) {
      const day = new Date(since);
      day.setUTCDate(since.getUTCDate() + i);
      const key = day.toISOString().slice(0, 10);
      attemptsByDay.push({ date: key, count: dayMap.get(key) ?? 0 });
    }

    return {
      attemptsByDay,
      usersByRole: usersByRoleRaw.map((row) => ({ role: row._id, count: row.count })),
      examsByType: examsByTypeRaw.map((row) => ({ type: row._id, count: row.count })),
      questionsByStatus: questionsByStatusRaw.map((row) => ({
        status: row._id,
        count: row.count,
      })),
      averageScore:
        scoreAgg[0]?.avg !== undefined && scoreAgg[0]?.avg !== null
          ? Math.round(scoreAgg[0].avg * 10) / 10
          : null,
      topExams: topExamsRaw.map((row) => ({
        examId: row._id.toString(),
        title: row.title,
        attempts: row.attempts,
        averageScore:
          row.averageScore !== null && row.averageScore !== undefined
            ? Math.round(row.averageScore * 10) / 10
            : null,
      })),
    };
  }

  async getSettings(): Promise<PublicPlatformSettings> {
    let doc = await SettingsModel.findOne({ key: 'platform' });
    if (!doc) {
      doc = await SettingsModel.create({ key: 'platform' });
    }
    return toPublicSettings(doc);
  }

  async updateSettings(input: SettingsUpdateInput): Promise<PublicPlatformSettings> {
    let doc = await SettingsModel.findOne({ key: 'platform' });
    if (!doc) {
      doc = await SettingsModel.create({ key: 'platform' });
    }

    if (input.siteName !== undefined) doc.siteName = input.siteName;
    if (input.supportEmail !== undefined) doc.supportEmail = input.supportEmail;
    if (input.maintenanceMode !== undefined) doc.maintenanceMode = input.maintenanceMode;
    if (input.allowRegistration !== undefined) doc.allowRegistration = input.allowRegistration;
    if (input.defaultExamDurationMinutes !== undefined) {
      doc.defaultExamDurationMinutes = input.defaultExamDurationMinutes;
    }

    await doc.save();
    return toPublicSettings(doc);
  }
}
