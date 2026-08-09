import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

import { EXAM_STATUSES, EXAM_TYPES } from './types.js';

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    type: { type: String, enum: EXAM_TYPES, required: true, index: true },
    testSeriesId: { type: Schema.Types.ObjectId, ref: 'TestSeries', default: null, index: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 600 },
    totalMarks: { type: Number, required: true, min: 0 },
    questionIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      required: true,
      validate: [(v: unknown[]) => v.length >= 1, 'At least one question'],
    },
    negativeMarking: { type: Boolean, default: true, required: true },
    status: { type: String, enum: EXAM_STATUSES, required: true, default: 'draft', index: true },
    year: { type: Number, default: null },
    quizDate: { type: String, default: null, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

examSchema.index({ type: 1, status: 1, createdAt: -1 });

export type Exam = InferSchemaType<typeof examSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type ExamDocument = HydratedDocument<Exam>;
export const ExamModel: Model<Exam> = model<Exam>('Exam', examSchema);
