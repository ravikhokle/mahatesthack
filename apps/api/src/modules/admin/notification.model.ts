import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

export const NOTIFICATION_AUDIENCES = ['all', 'students', 'staff'] as const;
export const NOTIFICATION_STATUSES = ['draft', 'sent'] as const;

const notificationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    audience: {
      type: String,
      enum: NOTIFICATION_AUDIENCES,
      required: true,
      default: 'all',
      index: true,
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUSES,
      required: true,
      default: 'draft',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ status: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof notificationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationModel: Model<Notification> = model<Notification>(
  'Notification',
  notificationSchema,
);
