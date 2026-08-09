export const QUESTION_TYPES = ['mcq_single', 'mcq_multiple'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const QUESTION_STATUSES = ['draft', 'published', 'archived'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicSubject = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicChapter = {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicTopic = {
  id: string;
  chapterId: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PublicQuestionOption = {
  id: string;
  text: string;
  imageUrl?: string;
};

export type PublicQuestion = {
  id: string;
  categoryId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  type: QuestionType;
  stem: string;
  options: PublicQuestionOption[];
  correctOptionIds: string[];
  explanation: string;
  difficulty: QuestionDifficulty;
  marks: number;
  negativeMarks: number;
  tags: string[];
  imageUrls: string[];
  status: QuestionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
