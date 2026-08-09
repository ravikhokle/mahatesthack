import type { UserRole } from '../users/user.types.js';
import type { BLOG_STATUSES } from './blog.model.js';
import type { CURRENT_AFFAIR_STATUSES } from './current-affair.model.js';
import type { NOTIFICATION_AUDIENCES, NOTIFICATION_STATUSES } from './notification.model.js';

export type PublicBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: (typeof BLOG_STATUSES)[number];
  authorId: string;
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
  status: (typeof CURRENT_AFFAIR_STATUSES)[number];
  authorId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicNotification = {
  id: string;
  title: string;
  body: string;
  audience: (typeof NOTIFICATION_AUDIENCES)[number];
  status: (typeof NOTIFICATION_STATUSES)[number];
  createdBy: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicPlatformSettings = {
  siteName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultExamDurationMinutes: number;
  updatedAt: string;
};

export type AdminDashboardStats = {
  users: {
    total: number;
    students: number;
    contentManagers: number;
    superAdmins: number;
    verified: number;
  };
  content: {
    categories: number;
    subjects: number;
    chapters: number;
    topics: number;
    questions: number;
    publishedQuestions: number;
    exams: number;
    publishedExams: number;
    testSeries: number;
    blogs: number;
    publishedBlogs: number;
    currentAffairs: number;
  };
  activity: {
    attemptsTotal: number;
    attemptsInProgress: number;
    attemptsSubmitted: number;
    attemptsEvaluated: number;
    notificationsSent: number;
  };
  recent: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      createdAt: string;
    }>;
    exams: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      createdAt: string;
    }>;
  };
};

export type AdminReports = {
  attemptsByDay: Array<{ date: string; count: number }>;
  usersByRole: Array<{ role: UserRole; count: number }>;
  examsByType: Array<{ type: string; count: number }>;
  questionsByStatus: Array<{ status: string; count: number }>;
  averageScore: number | null;
  topExams: Array<{
    examId: string;
    title: string;
    attempts: number;
    averageScore: number | null;
  }>;
};
