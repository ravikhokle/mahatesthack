import { AppError } from '../../lib/errors.js';
import { ChapterModel } from './chapter.model.js';
import { toPublicQuestion } from './mappers.js';
import { QuestionModel } from './question.model.js';
import type {
  BulkImportInput,
  QuestionCreateInput,
  QuestionListQuery,
  QuestionUpdateInput,
} from './schemas.js';
import { SubjectModel } from './subject.model.js';
import { TopicModel } from './topic.model.js';
import type { PublicQuestion } from './types.js';

export class QuestionService {
  private async resolveTopicHierarchy(topicId: string) {
    const topic = await TopicModel.findById(topicId);
    if (!topic) {
      throw new AppError('Topic not found', 404, 'NOT_FOUND');
    }

    const chapter = await ChapterModel.findById(topic.chapterId);
    if (!chapter) {
      throw new AppError('Chapter not found for topic', 404, 'NOT_FOUND');
    }

    const subject = await SubjectModel.findById(chapter.subjectId);
    if (!subject) {
      throw new AppError('Subject not found for topic', 404, 'NOT_FOUND');
    }

    return { topic, chapter, subject };
  }

  private normalizeOptions(input: NonNullable<QuestionCreateInput['options']>) {
    return input.map((option) => ({
      id: option.id,
      text: option.text,
      ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
    }));
  }

  async list(query: QuestionListQuery): Promise<{
    items: PublicQuestion[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const filter: Record<string, unknown> = {};

    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.subjectId) filter.subjectId = query.subjectId;
    if (query.chapterId) filter.chapterId = query.chapterId;
    if (query.topicId) filter.topicId = query.topicId;
    if (query.status) filter.status = query.status;
    if (query.difficulty) filter.difficulty = query.difficulty;
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    const skip = (query.page - 1) * query.limit;
    const [docs, total] = await Promise.all([
      QuestionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      QuestionModel.countDocuments(filter),
    ]);

    return {
      items: docs.map(toPublicQuestion),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async getById(id: string): Promise<PublicQuestion> {
    const doc = await QuestionModel.findById(id);
    if (!doc) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }
    return toPublicQuestion(doc);
  }

  async create(input: QuestionCreateInput, userId: string): Promise<PublicQuestion> {
    const { topic, chapter, subject } = await this.resolveTopicHierarchy(input.topicId);

    const doc = await QuestionModel.create({
      categoryId: subject.categoryId,
      subjectId: subject._id,
      chapterId: chapter._id,
      topicId: topic._id,
      type: input.type,
      stem: input.stem,
      options: this.normalizeOptions(input.options),
      correctOptionIds: input.correctOptionIds,
      explanation: input.explanation ?? '',
      difficulty: input.difficulty,
      marks: input.marks,
      negativeMarks: input.negativeMarks,
      tags: input.tags ?? [],
      imageUrls: input.imageUrls ?? [],
      status: input.status,
      createdBy: userId,
    });

    return toPublicQuestion(doc);
  }

  async update(id: string, input: QuestionUpdateInput): Promise<PublicQuestion> {
    const doc = await QuestionModel.findById(id);
    if (!doc) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }

    if (input.topicId !== undefined) {
      const { topic, chapter, subject } = await this.resolveTopicHierarchy(input.topicId);
      doc.topicId = topic._id;
      doc.chapterId = chapter._id;
      doc.subjectId = subject._id;
      doc.categoryId = subject.categoryId;
    }

    if (input.type !== undefined) doc.type = input.type;
    if (input.stem !== undefined) doc.stem = input.stem;
    if (input.options !== undefined) {
      doc.set('options', this.normalizeOptions(input.options));
    }
    if (input.correctOptionIds !== undefined) doc.correctOptionIds = input.correctOptionIds;
    if (input.explanation !== undefined) doc.explanation = input.explanation;
    if (input.difficulty !== undefined) doc.difficulty = input.difficulty;
    if (input.marks !== undefined) doc.marks = input.marks;
    if (input.negativeMarks !== undefined) doc.negativeMarks = input.negativeMarks;
    if (input.tags !== undefined) doc.tags = input.tags;
    if (input.imageUrls !== undefined) doc.imageUrls = input.imageUrls;
    if (input.status !== undefined) doc.status = input.status;

    const optionIds = new Set(doc.options.map((option) => option.id));
    for (const correctId of doc.correctOptionIds) {
      if (!optionIds.has(correctId)) {
        throw new AppError('Correct option must exist in options', 400, 'VALIDATION_ERROR');
      }
    }
    if (doc.type === 'mcq_single' && doc.correctOptionIds.length !== 1) {
      throw new AppError('Single choice requires exactly one correct option', 400, 'VALIDATION_ERROR');
    }

    await doc.save();
    return toPublicQuestion(doc);
  }

  async remove(id: string): Promise<void> {
    const deleted = await QuestionModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }
  }

  async bulkImport(
    input: BulkImportInput,
    userId: string,
  ): Promise<{ created: number; items: PublicQuestion[] }> {
    const items: PublicQuestion[] = [];

    for (const question of input.questions) {
      const created = await this.create(question, userId);
      items.push(created);
    }

    return { created: items.length, items };
  }
}
