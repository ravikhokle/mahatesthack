export type ExamType = 'mock' | 'test_series' | 'previous_year' | 'daily_quiz';
export type ExamStatus = 'draft' | 'published' | 'archived';
export type AttemptStatus = 'in_progress' | 'submitted' | 'evaluating' | 'evaluated';

export type ExamAnswerState = {
  selectedOptionIds: string[];
  markedForReview: boolean;
  visited: boolean;
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
  isPersonalized?: boolean;
  personalizedByAi?: boolean;
  aiStudyTip?: string;
};

export type PublicAttempt = {
  id: string;
  examId: string;
  examTitle: string;
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

export type ExamResult = PublicAttempt & {
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

export type PublicTestSeries = {
  id: string;
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
  examIds: string[];
};
