import { AppError } from '../../lib/errors.js';
import { slugify } from '../../lib/slug.js';
import { CategoryModel } from './category.model.js';
import { ChapterModel } from './chapter.model.js';
import {
  toPublicCategory,
  toPublicChapter,
  toPublicSubject,
  toPublicTopic,
} from './mappers.js';
import { SubjectModel } from './subject.model.js';
import { TopicModel } from './topic.model.js';
import type {
  ChapterCreateInput,
  ChapterUpdateInput,
  SubjectCreateInput,
  SubjectUpdateInput,
  TaxonomyCreateInput,
  TaxonomyUpdateInput,
  TopicCreateInput,
  TopicUpdateInput,
} from './schemas.js';
import type { PublicCategory, PublicChapter, PublicSubject, PublicTopic } from './types.js';

function mongoDuplicateMessage(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  ) {
    return 'An item with this slug already exists in this scope';
  }
  return null;
}

export class TaxonomyService {
  async listCategories(): Promise<PublicCategory[]> {
    const docs = await CategoryModel.find().sort({ sortOrder: 1, name: 1 });
    return docs.map(toPublicCategory);
  }

  async createCategory(input: TaxonomyCreateInput): Promise<PublicCategory> {
    try {
      const doc = await CategoryModel.create({
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        description: input.description ?? '',
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      });
      return toPublicCategory(doc);
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }
  }

  async updateCategory(id: string, input: TaxonomyUpdateInput): Promise<PublicCategory> {
    const doc = await CategoryModel.findById(id);
    if (!doc) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    if (input.name !== undefined) doc.name = input.name;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.description !== undefined) doc.description = input.description;
    if (input.isActive !== undefined) doc.isActive = input.isActive;
    if (input.sortOrder !== undefined) doc.sortOrder = input.sortOrder;

    try {
      await doc.save();
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }

    return toPublicCategory(doc);
  }

  async deleteCategory(id: string): Promise<void> {
    const subjectCount = await SubjectModel.countDocuments({ categoryId: id });
    if (subjectCount > 0) {
      throw new AppError('Delete subjects under this category first', 409, 'HAS_CHILDREN');
    }

    const deleted = await CategoryModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
  }

  async listSubjects(categoryId?: string): Promise<PublicSubject[]> {
    const filter = categoryId ? { categoryId } : {};
    const docs = await SubjectModel.find(filter).sort({ sortOrder: 1, name: 1 });
    return docs.map(toPublicSubject);
  }

  async createSubject(input: SubjectCreateInput): Promise<PublicSubject> {
    const category = await CategoryModel.findById(input.categoryId);
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }

    try {
      const doc = await SubjectModel.create({
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        description: input.description ?? '',
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      });
      return toPublicSubject(doc);
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }
  }

  async updateSubject(id: string, input: SubjectUpdateInput): Promise<PublicSubject> {
    const doc = await SubjectModel.findById(id);
    if (!doc) {
      throw new AppError('Subject not found', 404, 'NOT_FOUND');
    }

    if (input.categoryId !== undefined) {
      const category = await CategoryModel.findById(input.categoryId);
      if (!category) {
        throw new AppError('Category not found', 404, 'NOT_FOUND');
      }
      doc.categoryId = category._id;
    }
    if (input.name !== undefined) doc.name = input.name;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.description !== undefined) doc.description = input.description;
    if (input.isActive !== undefined) doc.isActive = input.isActive;
    if (input.sortOrder !== undefined) doc.sortOrder = input.sortOrder;

    try {
      await doc.save();
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }

    return toPublicSubject(doc);
  }

  async deleteSubject(id: string): Promise<void> {
    const chapterCount = await ChapterModel.countDocuments({ subjectId: id });
    if (chapterCount > 0) {
      throw new AppError('Delete chapters under this subject first', 409, 'HAS_CHILDREN');
    }

    const deleted = await SubjectModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Subject not found', 404, 'NOT_FOUND');
    }
  }

  async listChapters(subjectId?: string): Promise<PublicChapter[]> {
    const filter = subjectId ? { subjectId } : {};
    const docs = await ChapterModel.find(filter).sort({ sortOrder: 1, name: 1 });
    return docs.map(toPublicChapter);
  }

  async createChapter(input: ChapterCreateInput): Promise<PublicChapter> {
    const subject = await SubjectModel.findById(input.subjectId);
    if (!subject) {
      throw new AppError('Subject not found', 404, 'NOT_FOUND');
    }

    try {
      const doc = await ChapterModel.create({
        subjectId: input.subjectId,
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        description: input.description ?? '',
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      });
      return toPublicChapter(doc);
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }
  }

  async updateChapter(id: string, input: ChapterUpdateInput): Promise<PublicChapter> {
    const doc = await ChapterModel.findById(id);
    if (!doc) {
      throw new AppError('Chapter not found', 404, 'NOT_FOUND');
    }

    if (input.subjectId !== undefined) {
      const subject = await SubjectModel.findById(input.subjectId);
      if (!subject) {
        throw new AppError('Subject not found', 404, 'NOT_FOUND');
      }
      doc.subjectId = subject._id;
    }
    if (input.name !== undefined) doc.name = input.name;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.description !== undefined) doc.description = input.description;
    if (input.isActive !== undefined) doc.isActive = input.isActive;
    if (input.sortOrder !== undefined) doc.sortOrder = input.sortOrder;

    try {
      await doc.save();
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }

    return toPublicChapter(doc);
  }

  async deleteChapter(id: string): Promise<void> {
    const topicCount = await TopicModel.countDocuments({ chapterId: id });
    if (topicCount > 0) {
      throw new AppError('Delete topics under this chapter first', 409, 'HAS_CHILDREN');
    }

    const deleted = await ChapterModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Chapter not found', 404, 'NOT_FOUND');
    }
  }

  async listTopics(chapterId?: string): Promise<PublicTopic[]> {
    const filter = chapterId ? { chapterId } : {};
    const docs = await TopicModel.find(filter).sort({ sortOrder: 1, name: 1 });
    return docs.map(toPublicTopic);
  }

  async createTopic(input: TopicCreateInput): Promise<PublicTopic> {
    const chapter = await ChapterModel.findById(input.chapterId);
    if (!chapter) {
      throw new AppError('Chapter not found', 404, 'NOT_FOUND');
    }

    try {
      const doc = await TopicModel.create({
        chapterId: input.chapterId,
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        description: input.description ?? '',
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      });
      return toPublicTopic(doc);
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }
  }

  async updateTopic(id: string, input: TopicUpdateInput): Promise<PublicTopic> {
    const doc = await TopicModel.findById(id);
    if (!doc) {
      throw new AppError('Topic not found', 404, 'NOT_FOUND');
    }

    if (input.chapterId !== undefined) {
      const chapter = await ChapterModel.findById(input.chapterId);
      if (!chapter) {
        throw new AppError('Chapter not found', 404, 'NOT_FOUND');
      }
      doc.chapterId = chapter._id;
    }
    if (input.name !== undefined) doc.name = input.name;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.description !== undefined) doc.description = input.description;
    if (input.isActive !== undefined) doc.isActive = input.isActive;
    if (input.sortOrder !== undefined) doc.sortOrder = input.sortOrder;

    try {
      await doc.save();
    } catch (error) {
      const message = mongoDuplicateMessage(error);
      if (message) {
        throw new AppError(message, 409, 'DUPLICATE');
      }
      throw error;
    }

    return toPublicTopic(doc);
  }

  async deleteTopic(id: string): Promise<void> {
    const { QuestionModel } = await import('./question.model.js');
    const questionCount = await QuestionModel.countDocuments({ topicId: id });
    if (questionCount > 0) {
      throw new AppError('Delete questions under this topic first', 409, 'HAS_CHILDREN');
    }

    const deleted = await TopicModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Topic not found', 404, 'NOT_FOUND');
    }
  }
}
