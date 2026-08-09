import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

export const CURRENT_AFFAIR_STATUSES = ['draft', 'published'] as const;

const currentAffairSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    summary: { type: String, default: '', trim: true, maxlength: 500 },
    content: { type: String, required: true, maxlength: 100000 },
    category: { type: String, default: 'General', trim: true, maxlength: 80 },
    eventDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: CURRENT_AFFAIR_STATUSES,
      required: true,
      default: 'draft',
      index: true,
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

currentAffairSchema.index({ status: 1, eventDate: -1 });

export type CurrentAffair = InferSchemaType<typeof currentAffairSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type CurrentAffairDocument = HydratedDocument<CurrentAffair>;
export const CurrentAffairModel: Model<CurrentAffair> = model<CurrentAffair>(
  'CurrentAffair',
  currentAffairSchema,
);
