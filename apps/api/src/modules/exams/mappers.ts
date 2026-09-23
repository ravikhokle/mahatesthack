import type { AttemptDocument } from './attempt.model.js';
import type { ExamDocument } from './exam.model.js';
import type { TestSeriesDocument } from './test-series.model.js';
import type { PublicAttempt, PublicExam, PublicTestSeries } from './types.js';

export function toPublicExam(doc: ExamDocument): PublicExam {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    type: doc.type,
    testSeriesId: doc.testSeriesId ? doc.testSeriesId.toString() : null,
    durationMinutes: doc.durationMinutes,
    totalMarks: doc.totalMarks,
    questionCount: doc.questionIds.length,
    negativeMarking: doc.negativeMarking,
    status: doc.status,
    year: doc.year ?? null,
    quizDate: doc.quizDate ?? null,
    isPersonalized: Boolean(doc.generatedFor),
    personalizedByAi: doc.personalizedByAi ?? false,
    aiStudyTip: doc.aiStudyTip ?? '',
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicTestSeries(doc: TestSeriesDocument): PublicTestSeries {
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    isActive: doc.isActive,
    examIds: doc.examIds.map((id) => id.toString()),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPublicAttempt(doc: AttemptDocument, examTitle: string): PublicAttempt {
  return {
    id: doc._id.toString(),
    examId: doc.examId.toString(),
    examTitle,
    userId: doc.userId.toString(),
    status: doc.status,
    startedAt: doc.startedAt.toISOString(),
    endsAt: doc.endsAt.toISOString(),
    submittedAt: doc.submittedAt ? doc.submittedAt.toISOString() : null,
    score: doc.score ?? null,
    maxScore: doc.maxScore ?? null,
    correctCount: doc.correctCount ?? null,
    wrongCount: doc.wrongCount ?? null,
    unattemptedCount: doc.unattemptedCount ?? null,
    accuracy: doc.accuracy ?? null,
  };
}
