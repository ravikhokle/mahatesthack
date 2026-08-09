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
      role: 'student' | 'content_manager' | 'super_admin';
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
  usersByRole: Array<{
    role: 'student' | 'content_manager' | 'super_admin';
    count: number;
  }>;
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

export type PublicBlog = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: 'draft' | 'published';
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
  status: 'draft' | 'published';
  authorId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicNotification = {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'students' | 'staff';
  status: 'draft' | 'sent';
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

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'content_manager' | 'super_admin';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};
