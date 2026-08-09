export const EXAM_TYPES = ['mock', 'test_series', 'previous_year', 'daily_quiz'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const EXAM_STATUSES = ['draft', 'published', 'archived'] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const ATTEMPT_STATUSES = [
  'in_progress',
  'submitted',
  'evaluating',
  'evaluated',
] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export type ExamAnswerState = {
  selectedOptionIds: string[];
  markedForReview: boolean;
  visited: boolean;
  updatedAt: string;
};

export type LiveExamState = {
  attemptId: string;
  examId: string;
  userId: string;
  answers: Record<string, ExamAnswerState>;
  currentQuestionId: string | null;
  remainingSeconds: number;
  updatedAt: string;
};

export type StudentExamQuestion = {
  id: string;
  type: 'mcq_single' | 'mcq_multiple';
  stem: string;
  options: Array<{ id: string; text: string; imageUrl?: string }>;
  marks: number;
  negativeMarks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrls: string[];
};

export type ExamPackage = {
  attemptId: string;
  exam: {
    id: string;
    title: string;
    description: string;
    type: ExamType;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking: boolean;
  };
  questions: StudentExamQuestion[];
  startedAt: string;
  endsAt: string;
  serverNow: string;
  answers: Record<string, ExamAnswerState>;
};

export type PublicExam = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: ExamType;
  testSeriesId: string | null;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  negativeMarking: boolean;
  status: ExamStatus;
  year: number | null;
  quizDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicTestSeries = {
  id: string;
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
  examIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type PublicAttempt = {
  id: string;
  examId: string;
  examTitle: string;
  userId: string;
  status: AttemptStatus;
  startedAt: string;
  endsAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  correctCount: number | null;
  wrongCount: number | null;
  unattemptedCount: number | null;
  accuracy: number | null;
};

export type ExamResultDetail = PublicAttempt & {
  questionResults: Array<{
    questionId: string;
    selectedOptionIds: string[];
    correctOptionIds: string[];
    isCorrect: boolean;
    marksAwarded: number;
    explanation: string;
    stem: string;
    options: Array<{ id: string; text: string; imageUrl?: string }>;
  }>;
};
