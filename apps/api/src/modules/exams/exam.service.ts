import { AppError } from '../../lib/errors.js';
import { slugify } from '../../lib/slug.js';
import { QuestionModel } from '../question-bank/question.model.js';
import { ExamModel } from './exam.model.js';
import { toPublicExam, toPublicTestSeries } from './mappers.js';
import type {
  ExamCreateInput,
  ExamUpdateInput,
  TestSeriesCreateInput,
  TestSeriesUpdateInput,
} from './schemas.js';
import { TestSeriesModel } from './test-series.model.js';
import type { PublicExam, PublicTestSeries } from './types.js';

export class ExamService {
  private async resolveMarks(questionIds: string[]): Promise<number> {
    const questions = await QuestionModel.find({
      _id: { $in: questionIds },
      status: 'published',
    }).select('marks');

    if (questions.length !== questionIds.length) {
      throw new AppError(
        'All selected questions must exist and be published',
        400,
        'INVALID_QUESTIONS',
      );
    }

    return questions.reduce((sum, question) => sum + question.marks, 0);
  }

  async list(filters: {
    type?: string;
    status?: string;
    testSeriesId?: string;
    publishedOnly?: boolean;
    userId?: string;
  }): Promise<PublicExam[]> {
    const query: Record<string, unknown> = {};
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.testSeriesId) query.testSeriesId = filters.testSeriesId;
    if (filters.publishedOnly) query.status = 'published';
    if (filters.userId) {
      query.$or = [{ generatedFor: null }, { generatedFor: filters.userId }];
    }

    const docs = await ExamModel.find(query).sort({ createdAt: -1 });
    return docs.map(toPublicExam);
  }

  async getById(id: string, publishedOnly = false): Promise<PublicExam> {
    const doc = await ExamModel.findById(id);
    if (!doc || (publishedOnly && doc.status !== 'published')) {
      throw new AppError('Exam not found', 404, 'NOT_FOUND');
    }
    return toPublicExam(doc);
  }

  async create(input: ExamCreateInput, userId: string): Promise<PublicExam> {
    const totalMarks = await this.resolveMarks(input.questionIds);

    try {
      const doc = await ExamModel.create({
        title: input.title,
        slug: input.slug ?? slugify(input.title),
        description: input.description ?? '',
        type: input.type,
        testSeriesId: input.testSeriesId ?? null,
        durationMinutes: input.durationMinutes,
        totalMarks,
        questionIds: input.questionIds,
        negativeMarking: input.negativeMarking,
        status: input.status,
        year: input.year ?? null,
        quizDate: input.quizDate ?? null,
        createdBy: userId,
      });
      return toPublicExam(doc);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppError('Exam slug already exists', 409, 'DUPLICATE');
      }
      throw error;
    }
  }

  async update(id: string, input: ExamUpdateInput): Promise<PublicExam> {
    const doc = await ExamModel.findById(id);
    if (!doc) {
      throw new AppError('Exam not found', 404, 'NOT_FOUND');
    }

    if (input.title !== undefined) doc.title = input.title;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.description !== undefined) doc.description = input.description;
    if (input.type !== undefined) doc.type = input.type;
    if (input.testSeriesId !== undefined) doc.testSeriesId = input.testSeriesId as never;
    if (input.durationMinutes !== undefined) doc.durationMinutes = input.durationMinutes;
    if (input.negativeMarking !== undefined) doc.negativeMarking = input.negativeMarking;
    if (input.status !== undefined) doc.status = input.status;
    if (input.year !== undefined) doc.year = input.year;
    if (input.quizDate !== undefined) doc.quizDate = input.quizDate;

    if (input.questionIds !== undefined) {
      doc.totalMarks = await this.resolveMarks(input.questionIds);
      doc.questionIds = input.questionIds as never;
    }

    try {
      await doc.save();
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppError('Exam slug already exists', 409, 'DUPLICATE');
      }
      throw error;
    }

    return toPublicExam(doc);
  }

  async remove(id: string): Promise<void> {
    const deleted = await ExamModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Exam not found', 404, 'NOT_FOUND');
    }
  }

  async listSeries(): Promise<PublicTestSeries[]> {
    const docs = await TestSeriesModel.find().sort({ createdAt: -1 });
    return docs.map(toPublicTestSeries);
  }

  async createSeries(input: TestSeriesCreateInput, userId: string): Promise<PublicTestSeries> {
    try {
      const doc = await TestSeriesModel.create({
        title: input.title,
        slug: input.slug ?? slugify(input.title),
        description: input.description ?? '',
        isActive: input.isActive ?? true,
        examIds: input.examIds ?? [],
        createdBy: userId,
      });
      return toPublicTestSeries(doc);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppError('Test series slug already exists', 409, 'DUPLICATE');
      }
      throw error;
    }
  }

  async updateSeries(id: string, input: TestSeriesUpdateInput): Promise<PublicTestSeries> {
    const doc = await TestSeriesModel.findById(id);
    if (!doc) {
      throw new AppError('Test series not found', 404, 'NOT_FOUND');
    }

    if (input.title !== undefined) doc.title = input.title;
    if (input.slug !== undefined) doc.slug = input.slug;
    if (input.description !== undefined) doc.description = input.description;
    if (input.isActive !== undefined) doc.isActive = input.isActive;
    if (input.examIds !== undefined) doc.examIds = input.examIds as never;

    await doc.save();
    return toPublicTestSeries(doc);
  }

  async removeSeries(id: string): Promise<void> {
    const deleted = await TestSeriesModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError('Test series not found', 404, 'NOT_FOUND');
    }
  }
}
