import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const bookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    note: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);

bookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export type Bookmark = InferSchemaType<typeof bookmarkSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type BookmarkDocument = HydratedDocument<Bookmark>;
export const BookmarkModel: Model<Bookmark> = model<Bookmark>('Bookmark', bookmarkSchema);
