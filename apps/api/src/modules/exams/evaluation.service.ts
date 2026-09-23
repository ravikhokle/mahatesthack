import { QuestionModel } from '../question-bank/question.model.js';
import { AttemptModel, type AttemptDocument } from './attempt.model.js';
import { ExamModel } from './exam.model.js';
import { PersonalizedExamService } from './personalized-exam.service.js';
import type { ExamAnswerState } from './types.js';

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const set = new Set(a);
  return b.every((item) => set.has(item));
}

export class EvaluationService {
  private readonly personalizedExams = new PersonalizedExamService();

  async evaluateAttempt(attemptId: string): Promise<AttemptDocument> {
    const attempt = await AttemptModel.findById(attemptId);
    if (!attempt) {
      throw new Error(`Attempt ${attemptId} not found`);
    }

    const exam = await ExamModel.findById(attempt.examId);
    if (!exam) {
      throw new Error(`Exam ${attempt.examId.toString()} not found`);
    }

    const questions = await QuestionModel.find({
      _id: { $in: exam.questionIds },
      status: 'published',
    });

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    const questionResults = exam.questionIds.map((questionObjectId) => {
      const questionId = questionObjectId.toString();
      const question = questionMap.get(questionId);
      const answer = attempt.answers.get(questionId) as ExamAnswerState | undefined;
      const selected = answer?.selectedOptionIds ?? [];
      const correct = question?.correctOptionIds ?? [];
      const marks = question?.marks ?? 0;
      const negative = exam.negativeMarking ? (question?.negativeMarks ?? 0) : 0;

      maxScore += marks;

      if (!question || selected.length === 0) {
        unattemptedCount += 1;
        return {
          questionId: questionObjectId,
          selectedOptionIds: selected,
          correctOptionIds: correct,
          isCorrect: false,
          marksAwarded: 0,
        };
      }

      const isCorrect = sameSet(selected, correct);
      const marksAwarded = isCorrect ? marks : selected.length > 0 ? -negative : 0;
      score += marksAwarded;

      if (isCorrect) {
        correctCount += 1;
      } else {
        wrongCount += 1;
      }

      return {
        questionId: questionObjectId,
        selectedOptionIds: selected,
        correctOptionIds: correct,
        isCorrect,
        marksAwarded,
      };
    });

    const attempted = correctCount + wrongCount;
    attempt.status = 'evaluated';
    attempt.score = Number(score.toFixed(2));
    attempt.maxScore = Number(maxScore.toFixed(2));
    attempt.correctCount = correctCount;
    attempt.wrongCount = wrongCount;
    attempt.unattemptedCount = unattemptedCount;
    attempt.accuracy = attempted === 0 ? 0 : Number(((correctCount / attempted) * 100).toFixed(2));
    attempt.questionResults = questionResults as never;
    if (!attempt.submittedAt) {
      attempt.submittedAt = new Date();
    }

    await attempt.save();
    await this.personalizedExams.archiveIfMastered(attempt._id.toString());
    await this.personalizedExams.createFromAttempt(attempt._id.toString());
    return attempt;
  }
}
