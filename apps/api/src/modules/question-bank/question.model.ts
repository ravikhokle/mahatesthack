import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

import { QUESTION_DIFFICULTIES, QUESTION_STATUSES, QUESTION_TYPES } from './types.js';

const optionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: undefined },
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    type: { type: String, enum: QUESTION_TYPES, required: true, default: 'mcq_single' },
    stem: { type: String, required: true, maxlength: 20000 },
    options: { type: [optionSchema], required: true, validate: [(v: unknown[]) => v.length >= 2, 'At least 2 options'] },
    correctOptionIds: { type: [String], required: true },
    explanation: { type: String, default: '', maxlength: 20000 },
    difficulty: { type: String, enum: QUESTION_DIFFICULTIES, required: true, default: 'medium' },
    marks: { type: Number, required: true, default: 1, min: 0 },
    negativeMarks: { type: Number, required: true, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    imageUrls: { type: [String], default: [] },
    status: { type: String, enum: QUESTION_STATUSES, required: true, default: 'draft', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

questionSchema.index({ topicId: 1, status: 1, createdAt: -1 });
questionSchema.index({ stem: 'text', tags: 'text' });

export type Question = InferSchemaType<typeof questionSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type QuestionDocument = HydratedDocument<Question>;
export const QuestionModel: Model<Question> = model<Question>('Question', questionSchema);
