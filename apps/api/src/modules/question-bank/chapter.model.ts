import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const chapterSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true, required: true },
    sortOrder: { type: Number, default: 0, required: true },
  },
  { timestamps: true, versionKey: false },
);

chapterSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

export type Chapter = InferSchemaType<typeof chapterSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type ChapterDocument = HydratedDocument<Chapter>;
export const ChapterModel: Model<Chapter> = model<Chapter>('Chapter', chapterSchema);
