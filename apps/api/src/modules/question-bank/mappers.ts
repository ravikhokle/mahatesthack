import type { CategoryDocument } from './category.model.js';
import type { ChapterDocument } from './chapter.model.js';
import type { QuestionDocument } from './question.model.js';
import type { SubjectDocument } from './subject.model.js';
import type { TopicDocument } from './topic.model.js';
import type {
  PublicCategory,
  PublicChapter,
  PublicQuestion,
  PublicSubject,
  PublicTopic,
} from './types.js';

export function toPublicCategory(doc: CategoryDocument): PublicCategory {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    isActive: doc.isActive,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicSubject(doc: SubjectDocument): PublicSubject {
  return {
    id: doc._id.toString(),
    categoryId: doc.categoryId.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    isActive: doc.isActive,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicChapter(doc: ChapterDocument): PublicChapter {
  return {
    id: doc._id.toString(),
    subjectId: doc.subjectId.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    isActive: doc.isActive,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicTopic(doc: TopicDocument): PublicTopic {
  return {
    id: doc._id.toString(),
    chapterId: doc.chapterId.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    isActive: doc.isActive,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicQuestion(doc: QuestionDocument): PublicQuestion {
  return {
    id: doc._id.toString(),
    categoryId: doc.categoryId.toString(),
    subjectId: doc.subjectId.toString(),
    chapterId: doc.chapterId.toString(),
    topicId: doc.topicId.toString(),
    type: doc.type,
    stem: doc.stem,
    options: doc.options.map((option) => ({
      id: option.id,
      text: option.text,
      ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
    })),
    correctOptionIds: [...doc.correctOptionIds],
    explanation: doc.explanation,
    difficulty: doc.difficulty,
    marks: doc.marks,
    negativeMarks: doc.negativeMarks,
    tags: [...doc.tags],
    imageUrls: [...doc.imageUrls],
    status: doc.status,
    createdBy: doc.createdBy.toString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
