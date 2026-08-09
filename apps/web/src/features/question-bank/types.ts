export type QuestionType = 'mcq_single' | 'mcq_multiple';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'draft' | 'published' | 'archived';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Subject = {
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

export type Chapter = {
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

export type Topic = {
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

export type QuestionOption = {
  id: string;
  text: string;
  imageUrl?: string;
};

export type Question = {
  id: string;
  categoryId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
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

export type QuestionListResponse = {
  items: Question[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
