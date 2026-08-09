import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

import { ATTEMPT_STATUSES } from './types.js';

const answerSchema = new Schema(
  {
    selectedOptionIds: { type: [String], default: [] },
    markedForReview: { type: Boolean, default: false },
    visited: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const questionResultSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOptionIds: { type: [String], default: [] },
    correctOptionIds: { type: [String], default: [] },
    isCorrect: { type: Boolean, required: true },
    marksAwarded: { type: Number, required: true },
  },
  { _id: false },
);

const attemptSchema = new Schema(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ATTEMPT_STATUSES, required: true, default: 'in_progress', index: true },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
    answers: { type: Map, of: answerSchema, default: {} },
    score: { type: Number, default: null },
    maxScore: { type: Number, default: null },
    correctCount: { type: Number, default: null },
    wrongCount: { type: Number, default: null },
    unattemptedCount: { type: Number, default: null },
    accuracy: { type: Number, default: null },
    questionResults: { type: [questionResultSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

attemptSchema.index({ userId: 1, examId: 1, status: 1 });
attemptSchema.index({ userId: 1, createdAt: -1 });

export type Attempt = InferSchemaType<typeof attemptSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type AttemptDocument = HydratedDocument<Attempt>;
export const AttemptModel: Model<Attempt> = model<Attempt>('ExamAttempt', attemptSchema);
