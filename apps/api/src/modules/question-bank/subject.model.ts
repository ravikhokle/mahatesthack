import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const subjectSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true, required: true },
    sortOrder: { type: Number, default: 0, required: true },
  },
  { timestamps: true, versionKey: false },
);

subjectSchema.index({ categoryId: 1, slug: 1 }, { unique: true });

export type Subject = InferSchemaType<typeof subjectSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type SubjectDocument = HydratedDocument<Subject>;
export const SubjectModel: Model<Subject> = model<Subject>('Subject', subjectSchema);
