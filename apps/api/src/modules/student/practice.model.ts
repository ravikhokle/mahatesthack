import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const practiceAnswerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOptionIds: { type: [String], default: [] },
    correctOptionIds: { type: [String], default: [] },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const practiceSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    questionIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      required: true,
      default: 'in_progress',
      index: true,
    },
    answers: { type: [practiceAnswerSchema], default: [] },
    score: { type: Number, default: null },
    total: { type: Number, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

practiceSessionSchema.index({ userId: 1, createdAt: -1 });

export type PracticeSession = InferSchemaType<typeof practiceSessionSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type PracticeSessionDocument = HydratedDocument<PracticeSession>;
export const PracticeSessionModel: Model<PracticeSession> = model<PracticeSession>(
  'PracticeSession',
  practiceSessionSchema,
);
