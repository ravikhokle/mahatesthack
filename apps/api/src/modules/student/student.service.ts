import type { Redis } from 'ioredis';
import { Types } from 'mongoose';

import { AppError } from '../../lib/errors.js';
import { AttemptModel } from '../exams/attempt.model.js';
import { ExamModel } from '../exams/exam.model.js';
import { QuestionModel } from '../question-bank/question.model.js';
import { TopicModel } from '../question-bank/topic.model.js';
import { UserModel } from '../users/user.model.js';
import { BookmarkModel } from './bookmark.model.js';
import { PracticeSessionModel } from './practice.model.js';
import type { BookmarkCreateInput, PracticeStartInput, PracticeSubmitInput } from './schemas.js';

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((item) => set.has(item));
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i];
    copy[i] = copy[j] as T;
    copy[j] = current as T;
  }
  return copy;
}

export class StudentService {
  constructor(private readonly redis: Redis) {}

  async getHome(userId: string) {
    const [inProgress, evaluated, publishedExams, bookmarks] = await Promise.all([
      AttemptModel.find({ userId, status: 'in_progress' }).sort({ updatedAt: -1 }).limit(5),
      AttemptModel.find({ userId, status: 'evaluated' }).sort({ submittedAt: -1 }).limit(5),
      ExamModel.find({
        status: 'published',
        $or: [{ generatedFor: null }, { generatedFor: new Types.ObjectId(userId) }],
      })
        .sort({ createdAt: -1 })
        .limit(6),
      BookmarkModel.countDocuments({ userId }),
    ]);

    const examIds = [
      ...new Set([
        ...inProgress.map((item) => item.examId.toString()),
        ...evaluated.map((item) => item.examId.toString()),
        ...publishedExams.map((item) => item._id.toString()),
      ]),
    ];
    const exams = await ExamModel.find({ _id: { $in: examIds } });
    const examMap = new Map(exams.map((exam) => [exam._id.toString(), exam]));

    const totals = await AttemptModel.aggregate<{
      _id: null;
      attempted: number;
      avgScorePct: number;
      avgAccuracy: number;
    }>([
      { $match: { userId: new Types.ObjectId(userId), status: 'evaluated' } },
      {
        $group: {
          _id: null,
          attempted: { $sum: 1 },
          avgScorePct: {
            $avg: {
              $cond: [
                { $gt: ['$maxScore', 0] },
                { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] },
                0,
              ],
            },
          },
          avgAccuracy: { $avg: '$accuracy' },
        },
      },
    ]);

    const summary = totals[0] ?? { attempted: 0, avgScorePct: 0, avgAccuracy: 0 };

    return {
      summary: {
        testsAttempted: summary.attempted,
        averageScorePercent: Number((summary.avgScorePct ?? 0).toFixed(1)),
        averageAccuracy: Number((summary.avgAccuracy ?? 0).toFixed(1)),
        bookmarks,
        continueCount: inProgress.length,
      },
      continueExams: inProgress.map((attempt) => ({
        attemptId: attempt._id.toString(),
        examId: attempt.examId.toString(),
        examTitle: examMap.get(attempt.examId.toString())?.title ?? 'Exam',
        endsAt: attempt.endsAt.toISOString(),
        startedAt: attempt.startedAt.toISOString(),
      })),
      recentResults: evaluated.map((attempt) => ({
        attemptId: attempt._id.toString(),
        examId: attempt.examId.toString(),
        examTitle: examMap.get(attempt.examId.toString())?.title ?? 'Exam',
        score: attempt.score,
        maxScore: attempt.maxScore,
        accuracy: attempt.accuracy,
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
      })),
      recommendedExams: publishedExams.map((exam) => ({
        id: exam._id.toString(),
        title: exam.title,
        type: exam.type,
        durationMinutes: exam.durationMinutes,
        questionCount: exam.questionIds.length,
        totalMarks: exam.totalMarks,
        isPersonalized: Boolean(exam.generatedFor),
        personalizedByAi: exam.personalizedByAi ?? false,
        aiStudyTip: exam.aiStudyTip ?? '',
      })),
    };
  }

  async getAnalytics(userId: string) {
    const attempts = await AttemptModel.find({ userId, status: 'evaluated' })
      .sort({ submittedAt: 1 })
      .limit(100);

    const examIds = [...new Set(attempts.map((item) => item.examId.toString()))];
    const exams = await ExamModel.find({ _id: { $in: examIds } });
    const examMap = new Map(exams.map((exam) => [exam._id.toString(), exam]));

    const byType: Record<string, { count: number; avgAccuracy: number }> = {};
    for (const exam of exams) {
      byType[exam.type] ??= { count: 0, avgAccuracy: 0 };
    }

    const typeBuckets = new Map<string, number[]>();
    for (const attempt of attempts) {
      const type = examMap.get(attempt.examId.toString())?.type ?? 'mock';
      const list = typeBuckets.get(type) ?? [];
      list.push(attempt.accuracy ?? 0);
      typeBuckets.set(type, list);
    }

    for (const [type, values] of typeBuckets.entries()) {
      byType[type] = {
        count: values.length,
        avgAccuracy: Number(
          (values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)).toFixed(1),
        ),
      };
    }

    const trend = attempts.slice(-12).map((attempt) => ({
      attemptId: attempt._id.toString(),
      examTitle: examMap.get(attempt.examId.toString())?.title ?? 'Exam',
      scorePercent:
        attempt.maxScore && attempt.maxScore > 0
          ? Number((((attempt.score ?? 0) / attempt.maxScore) * 100).toFixed(1))
          : 0,
      accuracy: attempt.accuracy ?? 0,
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
    }));

    const totals = {
      evaluated: attempts.length,
      correct: attempts.reduce((sum, item) => sum + (item.correctCount ?? 0), 0),
      wrong: attempts.reduce((sum, item) => sum + (item.wrongCount ?? 0), 0),
      unattempted: attempts.reduce((sum, item) => sum + (item.unattemptedCount ?? 0), 0),
      avgAccuracy:
        attempts.length === 0
          ? 0
          : Number(
              (
                attempts.reduce((sum, item) => sum + (item.accuracy ?? 0), 0) / attempts.length
              ).toFixed(1),
            ),
    };

    return { totals, byType, trend };
  }

  async getLeaderboard(examId: string | undefined, limit: number) {
    const cacheKey = examId ? `leaderboard:exam:${examId}` : 'leaderboard:global';
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as {
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
    }

    const match: Record<string, unknown> = { status: 'evaluated' };
    if (examId) {
      match.examId = new Types.ObjectId(examId);
    }

    const rows = await AttemptModel.aggregate<{
      _id: { userId: Types.ObjectId; examId: Types.ObjectId };
      score: number;
      maxScore: number;
      accuracy: number;
      submittedAt: Date | null;
    }>([
      { $match: match },
      { $sort: { score: -1, accuracy: -1, submittedAt: 1 } },
      {
        $group: {
          _id: { userId: '$userId', examId: '$examId' },
          score: { $first: '$score' },
          maxScore: { $first: '$maxScore' },
          accuracy: { $first: '$accuracy' },
          submittedAt: { $first: '$submittedAt' },
        },
      },
      { $sort: { score: -1, accuracy: -1, submittedAt: 1 } },
      { $limit: limit },
    ]);

    const userIds = [...new Set(rows.map((row) => row._id.userId.toString()))];
    const examIds = [...new Set(rows.map((row) => row._id.examId.toString()))];
    const [users, exams] = await Promise.all([
      UserModel.find({ _id: { $in: userIds } }).select('name'),
      ExamModel.find({ _id: { $in: examIds } }).select('title'),
    ]);
    const userMap = new Map(users.map((user) => [user._id.toString(), user.name]));
    const examMap = new Map(exams.map((exam) => [exam._id.toString(), exam.title]));

    const items = rows.map((row, index) => ({
      rank: index + 1,
      userId: row._id.userId.toString(),
      name: userMap.get(row._id.userId.toString()) ?? 'Student',
      score: row.score ?? 0,
      maxScore: row.maxScore ?? 0,
      accuracy: row.accuracy ?? 0,
      examTitle: examMap.get(row._id.examId.toString()) ?? 'Exam',
      submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    }));

    const payload = {
      scope: examId ? 'exam' : 'global',
      examId: examId ?? null,
      items,
    };

    await this.redis.set(cacheKey, JSON.stringify(payload), 'EX', 60);
    return payload;
  }

  async listBookmarks(userId: string) {
    const bookmarks = await BookmarkModel.find({ userId }).sort({ createdAt: -1 }).limit(100);
    const questionIds = bookmarks.map((item) => item.questionId);
    const questions = await QuestionModel.find({ _id: { $in: questionIds }, status: 'published' });
    const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));

    return bookmarks
      .map((bookmark) => {
        const question = questionMap.get(bookmark.questionId.toString());
        if (!question) return null;
        return {
          id: bookmark._id.toString(),
          questionId: question._id.toString(),
          note: bookmark.note,
          stem: question.stem,
          difficulty: question.difficulty,
          topicId: question.topicId.toString(),
          createdAt: bookmark.createdAt.toISOString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  async addBookmark(userId: string, input: BookmarkCreateInput) {
    const question = await QuestionModel.findOne({ _id: input.questionId, status: 'published' });
    if (!question) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }

    try {
      const bookmark = await BookmarkModel.create({
        userId,
        questionId: input.questionId,
        note: input.note ?? '',
      });
      return {
        id: bookmark._id.toString(),
        questionId: question._id.toString(),
        note: bookmark.note,
        stem: question.stem,
        difficulty: question.difficulty,
        topicId: question.topicId.toString(),
        createdAt: bookmark.createdAt.toISOString(),
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000
      ) {
        throw new AppError('Question already bookmarked', 409, 'DUPLICATE');
      }
      throw error;
    }
  }

  async removeBookmark(userId: string, bookmarkId: string) {
    const deleted = await BookmarkModel.findOneAndDelete({ _id: bookmarkId, userId });
    if (!deleted) {
      throw new AppError('Bookmark not found', 404, 'NOT_FOUND');
    }
  }

  async listPracticeTopics() {
    const grouped = await QuestionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { status: 'published' } },
      { $group: { _id: '$topicId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ]);

    const topicIds = grouped.map((row) => row._id);
    const topics = await TopicModel.find({ _id: { $in: topicIds }, isActive: true });
    const topicMap = new Map(topics.map((topic) => [topic._id.toString(), topic]));

    return grouped
      .map((row) => {
        const topic = topicMap.get(row._id.toString());
        if (!topic) return null;
        return {
          id: topic._id.toString(),
          name: topic.name,
          description: topic.description,
          questionCount: row.count,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  async startPractice(userId: string, input: PracticeStartInput) {
    const topic = await TopicModel.findById(input.topicId);
    if (!topic || !topic.isActive) {
      throw new AppError('Topic not found', 404, 'NOT_FOUND');
    }

    const questions = await QuestionModel.find({
      topicId: input.topicId,
      status: 'published',
    }).select('_id stem options type marks difficulty imageUrls');

    if (questions.length === 0) {
      throw new AppError('No published questions in this topic', 400, 'NO_QUESTIONS');
    }

    const selected = shuffle(questions).slice(0, Math.min(input.count, questions.length));
    const session = await PracticeSessionModel.create({
      userId,
      topicId: input.topicId,
      questionIds: selected.map((question) => question._id),
      status: 'in_progress',
    });

    return {
      sessionId: session._id.toString(),
      topicId: topic._id.toString(),
      topicName: topic.name,
      questions: selected.map((question) => ({
        id: question._id.toString(),
        type: question.type,
        stem: question.stem,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
          ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
        })),
        marks: question.marks,
        difficulty: question.difficulty,
        imageUrls: [...question.imageUrls],
      })),
    };
  }

  async submitPractice(userId: string, sessionId: string, input: PracticeSubmitInput) {
    const session = await PracticeSessionModel.findById(sessionId);
    if (!session || session.userId.toString() !== userId) {
      throw new AppError('Practice session not found', 404, 'NOT_FOUND');
    }
    if (session.status === 'completed') {
      throw new AppError('Practice session already completed', 409, 'ALREADY_COMPLETED');
    }

    const questions = await QuestionModel.find({ _id: { $in: session.questionIds } });
    const questionMap = new Map(questions.map((question) => [question._id.toString(), question]));
    const answerMap = new Map(input.answers.map((answer) => [answer.questionId, answer]));

    let score = 0;
    const results = session.questionIds.map((questionObjectId) => {
      const questionId = questionObjectId.toString();
      const question = questionMap.get(questionId);
      const selected = answerMap.get(questionId)?.selectedOptionIds ?? [];
      const correct = question?.correctOptionIds ?? [];
      const isCorrect = question ? sameSet(selected, correct) : false;
      if (isCorrect) score += 1;

      return {
        questionId: questionObjectId,
        selectedOptionIds: selected,
        correctOptionIds: correct,
        isCorrect,
        stem: question?.stem ?? '',
        explanation: question?.explanation ?? '',
        options:
          question?.options.map((option) => ({
            id: option.id,
            text: option.text,
            ...(option.imageUrl ? { imageUrl: option.imageUrl } : {}),
          })) ?? [],
      };
    });

    session.status = 'completed';
    session.answers = results.map((item) => ({
      questionId: item.questionId,
      selectedOptionIds: item.selectedOptionIds,
      correctOptionIds: item.correctOptionIds,
      isCorrect: item.isCorrect,
    })) as never;
    session.score = score;
    session.total = session.questionIds.length;
    session.completedAt = new Date();
    await session.save();

    return {
      sessionId: session._id.toString(),
      score,
      total: session.questionIds.length,
      accuracy: Number(((score / Math.max(session.questionIds.length, 1)) * 100).toFixed(1)),
      results,
    };
  }
}
