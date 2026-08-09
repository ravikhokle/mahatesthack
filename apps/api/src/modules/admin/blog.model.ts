import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

export const BLOG_STATUSES = ['draft', 'published'] as const;

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, default: '', trim: true, maxlength: 500 },
    content: { type: String, required: true, maxlength: 100000 },
    coverImageUrl: { type: String, default: '', trim: true, maxlength: 1000 },
    status: { type: String, enum: BLOG_STATUSES, required: true, default: 'draft', index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

blogSchema.index({ status: 1, publishedAt: -1 });

export type Blog = InferSchemaType<typeof blogSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type BlogDocument = HydratedDocument<Blog>;
export const BlogModel: Model<Blog> = model<Blog>('Blog', blogSchema);
