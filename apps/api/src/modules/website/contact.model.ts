import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ['new', 'read', 'archived'],
      required: true,
      default: 'new',
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

contactMessageSchema.index({ createdAt: -1 });

export type ContactMessage = InferSchemaType<typeof contactMessageSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type ContactMessageDocument = HydratedDocument<ContactMessage>;
export const ContactMessageModel: Model<ContactMessage> = model<ContactMessage>(
  'ContactMessage',
  contactMessageSchema,
);
