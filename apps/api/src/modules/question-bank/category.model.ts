import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true, required: true },
    sortOrder: { type: Number, default: 0, required: true },
  },
  { timestamps: true, versionKey: false },
);

export type Category = InferSchemaType<typeof categorySchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type CategoryDocument = HydratedDocument<Category>;
export const CategoryModel: Model<Category> = model<Category>('Category', categorySchema);
