export type DashboardHome = {
  summary: {
    testsAttempted: number;
    averageScorePercent: number;
    averageAccuracy: number;
    bookmarks: number;
    continueCount: number;
  };
  continueExams: Array<{
    attemptId: string;
    examId: string;
    examTitle: string;
    endsAt: string;
    startedAt: string;
  }>;
  recentResults: Array<{
    attemptId: string;
    examId: string;
    examTitle: string;
    score: number | null;
    maxScore: number | null;
    accuracy: number | null;
    submittedAt: string | null;
  }>;
  recommendedExams: Array<{
    id: string;
    title: string;
    type: string;
    durationMinutes: number;
    questionCount: number;
    totalMarks: number;
  }>;
};

export type DashboardAnalytics = {
  totals: {
    evaluated: number;
    correct: number;
    wrong: number;
    unattempted: number;
    avgAccuracy: number;
  };
  byType: Record<string, { count: number; avgAccuracy: number }>;
  trend: Array<{
    attemptId: string;
    examTitle: string;
    scorePercent: number;
    accuracy: number;
    submittedAt: string | null;
  }>;
};

export type LeaderboardResponse = {
  scope: string;
  examId: string | null;
  items: Array<{
    rank: number;
    userId: string;
    name: string;
    score: number;
    maxScore: number;
    accuracy: number;
    examTitle: string;
    submittedAt: string | null;
  }>;
};

export type BookmarkItem = {
  id: string;
  questionId: string;
  note: string;
  stem: string;
  difficulty: string;
  topicId: string;
  createdAt: string;
};

export type PracticeTopic = {
  id: string;
  name: string;
  description: string;
  questionCount: number;
};

export type PracticeQuestion = {
  id: string;
  type: 'mcq_single' | 'mcq_multiple';
  stem: string;
  options: Array<{ id: string; text: string; imageUrl?: string }>;
  marks: number;
  difficulty: string;
  imageUrls: string[];
};

export type PracticeStartResponse = {
  sessionId: string;
  topicId: string;
  topicName: string;
  questions: PracticeQuestion[];
};

export type PracticeSubmitResponse = {
  sessionId: string;
  score: number;
  total: number;
  accuracy: number;
  results: Array<{
    questionId: string;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    isCorrect: boolean;
    stem: string;
    explanation: string;
    options: Array<{ id: string; text: string; imageUrl?: string }>;
  }>;
};
