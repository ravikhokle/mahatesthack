import { Schema, model, type HydratedDocument, type InferSchemaType, type Model, type Types } from 'mongoose';

const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'platform', index: true },
    siteName: { type: String, required: true, trim: true, maxlength: 120, default: 'MahaTest' },
    supportEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: 'support@mahatest.local',
    },
    maintenanceMode: { type: Boolean, required: true, default: false },
    allowRegistration: { type: Boolean, required: true, default: true },
    defaultExamDurationMinutes: { type: Number, required: true, default: 60, min: 1, max: 600 },
  },
  { timestamps: true, versionKey: false },
);

export type PlatformSettings = InferSchemaType<typeof settingsSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;
export const SettingsModel: Model<PlatformSettings> = model<PlatformSettings>(
  'PlatformSettings',
  settingsSchema,
);
