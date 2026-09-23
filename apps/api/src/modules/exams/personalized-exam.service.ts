import { Types } from 'mongoose';

import { createPersonalizedTestPlan } from '../../lib/gemini.js';
import { QuestionModel } from '../question-bank/question.model.js';
import { TopicModel } from '../question-bank/topic.model.js';
import { AttemptModel } from './attempt.model.js';
import { ExamModel } from './exam.model.js';

type TopicPerformance = {
  attempted: number;
  correct: number;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex] as T, copy[index] as T];
  }
  return copy;
}

export class PersonalizedExamService {
  async archiveIfMastered(attemptId: string): Promise<void> {
    const attempt = await AttemptModel.findById(attemptId).select(
      'examId userId status accuracy',
    );
    if (!attempt || attempt.status !== 'evaluated' || (attempt.accuracy ?? 0) < 70) {
      return;
    }

    const exam = await ExamModel.findOne({
      _id: attempt.examId,
      generatedFor: attempt.userId,
      status: 'published',
    });
    if (!exam) return;

    exam.status = 'archived';
    await exam.save();
  }

  async createFromAttempt(attemptId: string): Promise<void> {
    const attempt = await AttemptModel.findById(attemptId).select(
      'userId questionResults status',
    );
    if (!attempt || attempt.status !== 'evaluated' || attempt.questionResults.length === 0) {
      return;
    }

    const existing = await ExamModel.exists({ personalizationSourceAttemptId: attempt._id });
    if (existing) {
      return;
    }

    const questionIds = attempt.questionResults.map((result) => result.questionId);
    const questions = await QuestionModel.find({ _id: { $in: questionIds } }).select('topicId');
    const topicByQuestion = new Map(
      questions.map((question) => [question._id.toString(), question.topicId.toString()]),
    );
    const performance = new Map<string, TopicPerformance>();

    for (const result of attempt.questionResults) {
      if (result.selectedOptionIds.length === 0) continue;
      const topicId = topicByQuestion.get(result.questionId.toString());
      if (!topicId) continue;
      const current = performance.get(topicId) ?? { attempted: 0, correct: 0 };
      current.attempted += 1;
      if (result.isCorrect) current.correct += 1;
      performance.set(topicId, current);
    }

    const weakTopicIds = [...performance.entries()]
      .filter(([, value]) => value.attempted >= 2 && value.correct / value.attempted < 0.7)
      .sort(([, left], [, right]) => left.correct / left.attempted - right.correct / right.attempted)
      .slice(0, 3)
      .map(([topicId]) => new Types.ObjectId(topicId));

    if (weakTopicIds.length === 0) return;

    const topicDocs = await TopicModel.find({ _id: { $in: weakTopicIds } }).select('name');
    const topicNameMap = new Map(topicDocs.map((topic) => [topic._id.toString(), topic.name]));
    const aiPlan = await createPersonalizedTestPlan(
      weakTopicIds.map((topicId) => {
        const value = performance.get(topicId.toString()) as TopicPerformance;
        return {
          topicId: topicId.toString(),
          name: topicNameMap.get(topicId.toString()) ?? 'SSC topic',
          attempted: value.attempted,
          correct: value.correct,
          accuracy: Number(((value.correct / value.attempted) * 100).toFixed(1)),
        };
      }),
    );
    const validAiTopics = aiPlan?.topics.filter((topic) =>
      weakTopicIds.some((weakTopicId) => weakTopicId.toString() === topic.topicId),
    );
    const usableAiPlan =
      aiPlan && validAiTopics && validAiTopics.length > 0
        ? { ...aiPlan, topics: validAiTopics }
        : null;
    const planTopics = usableAiPlan?.topics ?? weakTopicIds.map((topicId) => ({
      topicId: topicId.toString(),
      questionCount: Math.ceil(20 / weakTopicIds.length),
      difficulty: 'medium' as const,
      reason: 'Practice your lowest-accuracy topics.',
    }));
    const targetQuestionCount = Math.min(
      20,
      Math.max(5, planTopics.reduce((sum, topic) => sum + topic.questionCount, 0)),
    );

    let candidateQuestions = await QuestionModel.find({
      topicId: { $in: weakTopicIds },
      status: 'published',
      _id: { $nin: questionIds },
    }).select('_id marks topicId difficulty');

    if (candidateQuestions.length < 5) {
      candidateQuestions = await QuestionModel.find({
        topicId: { $in: weakTopicIds },
        status: 'published',
      }).select('_id marks topicId difficulty');
    }

    const questionPool = shuffle(candidateQuestions);
    const selectedQuestions = [] as typeof candidateQuestions;
    for (const topicPlan of planTopics) {
      for (let index = 0; index < topicPlan.questionCount; index += 1) {
        const preferredIndex = questionPool.findIndex(
          (question) =>
            question.topicId.toString() === topicPlan.topicId &&
            question.difficulty === topicPlan.difficulty,
        );
        const fallbackIndex = questionPool.findIndex(
          (question) => question.topicId.toString() === topicPlan.topicId,
        );
        const questionIndex = preferredIndex >= 0 ? preferredIndex : fallbackIndex;
        if (questionIndex < 0) continue;
        selectedQuestions.push(questionPool.splice(questionIndex, 1)[0] as (typeof candidateQuestions)[number]);
        if (selectedQuestions.length === targetQuestionCount) break;
      }
      if (selectedQuestions.length === targetQuestionCount) break;
    }
    while (selectedQuestions.length < targetQuestionCount && questionPool.length > 0) {
      selectedQuestions.push(questionPool.shift() as (typeof candidateQuestions)[number]);
    }

    if (selectedQuestions.length < 5) return;

    const names = topicDocs.map((topic) => topic.name).join(', ');
    const slug = `personalized-${attempt.userId.toString()}-${attempt._id.toString()}`;
    const fallbackTitle = `Your ${names} Improvement Test`;
    const fallbackDescription = `Personalized SSC test based on your weak topics: ${names}.`;

    await ExamModel.create({
      title: usableAiPlan?.title ?? fallbackTitle,
      slug,
      description: usableAiPlan?.description ?? fallbackDescription,
      type: 'mock',
      testSeriesId: null,
      durationMinutes: Math.max(10, selectedQuestions.length),
      totalMarks: selectedQuestions.reduce((sum, question) => sum + question.marks, 0),
      questionIds: selectedQuestions.map((question) => question._id),
      negativeMarking: true,
      status: 'published',
      year: null,
      quizDate: null,
      createdBy: attempt.userId,
      generatedFor: attempt.userId,
      personalizationSourceAttemptId: attempt._id,
      personalizedByAi: Boolean(usableAiPlan),
      aiStudyTip: usableAiPlan?.studyTip ?? 'Review the explanations after completing this focused test.',
    });
  }
}