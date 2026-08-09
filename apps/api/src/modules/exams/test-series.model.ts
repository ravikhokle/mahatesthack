import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const testSeriesSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true, required: true },
    examIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Exam' }], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

export type TestSeries = InferSchemaType<typeof testSeriesSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type TestSeriesDocument = HydratedDocument<TestSeries>;
export const TestSeriesModel: Model<TestSeries> = model<TestSeries>('TestSeries', testSeriesSchema);
