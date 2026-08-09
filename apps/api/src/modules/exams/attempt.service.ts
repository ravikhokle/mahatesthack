import type { FastifyInstance } from 'fastify';

import { AppError } from '../../lib/errors.js';
import { QuestionModel } from '../question-bank/question.model.js';
import { AttemptModel } from './attempt.model.js';
import { ExamModel } from './exam.model.js';
import { LiveExamStateService } from './live-state.service.js';
import { toPublicAttempt } from './mappers.js';
import type { SyncAnswersInput } from './schemas.js';
import type {
  ExamAnswerState,
  ExamPackage,
  ExamResultDetail,
  LiveExamState,
  PublicAttempt,
  StudentExamQuestion,
} from './types.js';

function answersFromMap(
  map: Map<string, { selectedOptionIds: string[]; markedForReview: boolean; visited: boolean; updatedAt: Date }>,
): Record<string, ExamAnswerState> {
  const result: Record<string, ExamAnswerState> = {};
  for (const [key, value] of map.entries()) {
    result[key] = {
      selectedOptionIds: value.selectedOptionIds ?? [],
      markedForReview: value.markedForReview ?? false,
      visited: value.visited ?? false,
      updatedAt: value.updatedAt.toISOString(),
    };
  }
  return result;
}

export class AttemptService {
  private readonly liveState: LiveExamStateService;

  constructor(private readonly app: FastifyInstance) {
    this.liveState = new LiveExamStateService(app.redis);
  }

  private remainingSeconds(endsAt: Date): number {
    return Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
  }

  private ttlSeconds(endsAt: Date): number {
    return this.remainingSeconds(endsAt) + 60 * 60;
  }

  async startAttempt(examId: string, userId: string): Promise<{ attempt: PublicAttempt; package: ExamPackage }> {
    const exam = await ExamModel.findById(examId);
    if (!exam || exam.status !== 'published') {
      throw new AppError('Exam not found or not published', 404, 'NOT_FOUND');
    }

    const existing = await AttemptModel.findOne({
      examId,
      userId,
      status: 'in_progress',
    });

    if (existing) {
      return {
        attempt: toPublicAttempt(existing, exam.title),
        package: await this.buildPackage(existing._id.toString(), userId),
      };
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

    const attempt = await AttemptModel.create({
      examId,
      userId,
      status: 'in_progress',
      startedAt,
      endsAt,
      answers: {},
    });

    const live: LiveExamState = {
      attemptId: attempt._id.toString(),
      examId: exam._id.toString(),
      userId,
      answers: {},
      currentQuestionId: exam.questionIds[0]?.toString() ?? null,
      remainingSeconds: this.remainingSeconds(endsAt),
      updatedAt: new Date().toISOString(),
    };

    await this.liveState.save(live, this.ttlSeconds(endsAt));

    return {
      attempt: toPublicAttempt(attempt, exam.title),
      package: await this.buildPackage(attempt._id.toString(), userId),
    };
  }

  async buildPackage(attemptId: string, userId: string): Promise<ExamPackage> {
    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt || attempt.userId.toString() !== userId) {
      throw new AppError('Attempt not found', 404, 'NOT_FOUND');
    }

    const exam = await ExamModel.findById(attempt.examId);
    if (!exam) {
      throw new AppError('Exam not found', 404, 'NOT_FOUND');
    }

    const questions = await QuestionModel.find({
      _id: { $in: exam.questionIds },
      status: 'published',
    });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const studentQuestions: StudentExamQuestion[] = exam.questionIds
      .map((id) => questionMap.get(id.toString()))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map((q) => ({
        id: q._id.toString(),
        type: q.type,
        stem: q.stem,
        options: q.options.map((option) => ({
          id: option.id,
          text: option.text,
          ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
        })),
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        difficulty: q.difficulty,
        imageUrls: [...q.imageUrls],
      }));

    const live = await this.liveState.get(attemptId);
    const answers = live?.answers ?? answersFromMap(attempt.answers as never);

    return {
      attemptId: attempt._id.toString(),
      exam: {
        id: exam._id.toString(),
        title: exam.title,
        description: exam.description,
        type: exam.type,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        negativeMarking: exam.negativeMarking,
      },
      questions: studentQuestions,
      startedAt: attempt.startedAt.toISOString(),
      endsAt: attempt.endsAt.toISOString(),
      serverNow: new Date().toISOString(),
      answers,
    };
  }

  async sync(
    attemptId: string,
    userId: string,
    input: SyncAnswersInput,
  ): Promise<{ remainingSeconds: number; status: string }> {
    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt || attempt.userId.toString() !== userId) {
      throw new AppError('Attempt not found', 404, 'NOT_FOUND');
    }

    if (attempt.status !== 'in_progress') {
      throw new AppError('Attempt is no longer in progress', 409, 'NOT_IN_PROGRESS');
    }

    if (Date.now() >= attempt.endsAt.getTime()) {
      await this.submit(attemptId, userId);
      return { remainingSeconds: 0, status: 'submitted' };
    }

    const nowIso = new Date().toISOString();
    const normalized: Record<string, ExamAnswerState> = {};
    for (const [questionId, answer] of Object.entries(input.answers)) {
      normalized[questionId] = {
        selectedOptionIds: answer.selectedOptionIds,
        markedForReview: answer.markedForReview,
        visited: answer.visited,
        updatedAt: answer.updatedAt ?? nowIso,
      };
      attempt.answers.set(questionId, {
        selectedOptionIds: answer.selectedOptionIds,
        markedForReview: answer.markedForReview,
        visited: answer.visited,
        updatedAt: new Date(answer.updatedAt ?? nowIso),
      });
    }

    await attempt.save();

    const remaining = this.remainingSeconds(attempt.endsAt);
    await this.liveState.mergeAnswers(
      attemptId,
      {
        answers: normalized,
        currentQuestionId: input.currentQuestionId,
        remainingSeconds: input.remainingSeconds ?? remaining,
      },
      this.ttlSeconds(attempt.endsAt),
    );

    return { remainingSeconds: remaining, status: attempt.status };
  }

  async submit(attemptId: string, userId: string): Promise<PublicAttempt> {
    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt || attempt.userId.toString() !== userId) {
      throw new AppError('Attempt not found', 404, 'NOT_FOUND');
    }

    if (attempt.status === 'evaluated') {
      const exam = await ExamModel.findById(attempt.examId);
      return toPublicAttempt(attempt, exam?.title ?? 'Exam');
    }

    if (attempt.status === 'submitted' || attempt.status === 'evaluating') {
      const exam = await ExamModel.findById(attempt.examId);
      return toPublicAttempt(attempt, exam?.title ?? 'Exam');
    }

    const live = await this.liveState.get(attemptId);
    if (live) {
      for (const [questionId, answer] of Object.entries(live.answers)) {
        attempt.answers.set(questionId, {
          selectedOptionIds: answer.selectedOptionIds,
          markedForReview: answer.markedForReview,
          visited: answer.visited,
          updatedAt: new Date(answer.updatedAt),
        });
      }
    }

    attempt.status = 'evaluating';
    attempt.submittedAt = new Date();
    await attempt.save();

    await this.app.publishExamSubmit({ attemptId: attempt._id.toString() });

    const refreshed = await AttemptModel.findById(attemptId);
    const exam = await ExamModel.findById(attempt.examId);
    return toPublicAttempt(refreshed ?? attempt, exam?.title ?? 'Exam');
  }

  async listMine(userId: string): Promise<PublicAttempt[]> {
    const attempts = await AttemptModel.find({ userId }).sort({ createdAt: -1 }).limit(100);
    const examIds = [...new Set(attempts.map((item) => item.examId.toString()))];
    const exams = await ExamModel.find({ _id: { $in: examIds } });
    const titles = new Map(exams.map((exam) => [exam._id.toString(), exam.title]));

    return attempts.map((attempt) =>
      toPublicAttempt(attempt, titles.get(attempt.examId.toString()) ?? 'Exam'),
    );
  }

  async getResult(attemptId: string, userId: string): Promise<ExamResultDetail> {
    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt || attempt.userId.toString() !== userId) {
      throw new AppError('Attempt not found', 404, 'NOT_FOUND');
    }

    if (attempt.status !== 'evaluated') {
      throw new AppError('Result is not ready yet', 409, 'RESULT_PENDING');
    }

    const exam = await ExamModel.findById(attempt.examId);
    if (!exam) {
      throw new AppError('Exam not found', 404, 'NOT_FOUND');
    }

    const questions = await QuestionModel.find({ _id: { $in: exam.questionIds } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    return {
      ...toPublicAttempt(attempt, exam.title),
      questionResults: attempt.questionResults.map((result) => {
        const question = questionMap.get(result.questionId.toString());
        return {
          questionId: result.questionId.toString(),
          selectedOptionIds: [...result.selectedOptionIds],
          correctOptionIds: [...result.correctOptionIds],
          isCorrect: result.isCorrect,
          marksAwarded: result.marksAwarded,
          explanation: question?.explanation ?? '',
          stem: question?.stem ?? '',
          options:
            question?.options.map((option) => ({
              id: option.id,
              text: option.text,
              ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
            })) ?? [],
        };
      }),
    };
  }
}
