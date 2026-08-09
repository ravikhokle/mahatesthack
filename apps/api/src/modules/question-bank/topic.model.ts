import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const topicSchema = new Schema(
  {
    chapterId: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true, required: true },
    sortOrder: { type: Number, default: 0, required: true },
  },
  { timestamps: true, versionKey: false },
);

topicSchema.index({ chapterId: 1, slug: 1 }, { unique: true });

export type Topic = InferSchemaType<typeof topicSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type TopicDocument = HydratedDocument<Topic>;
export const TopicModel: Model<Topic> = model<Topic>('Topic', topicSchema);
