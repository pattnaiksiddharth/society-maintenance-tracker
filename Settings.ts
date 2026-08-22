import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISettings extends Document {
  societyName: string;
  overdueThresholdDays: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  autoAssignCategory: boolean;
  workingHours: string;
  updatedBy?: Types.ObjectId;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    societyName: {
      type: String,
      default: 'Silver Oaks Residency',
      trim: true,
    },
    overdueThresholdDays: {
      type: Number,
      default: 7,
      min: [1, 'Overdue threshold must be at least 1 day'],
      max: [365, 'Overdue threshold cannot exceed 365 days'],
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    smsNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
    autoAssignCategory: {
      type: Boolean,
      default: true,
    },
    workingHours: {
      type: String,
      default: '08:00 AM - 08:00 PM',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

/**
 * Get or create the singleton settings document.
 * The system always has exactly one Settings document.
 */
export async function getSettings(): Promise<ISettings> {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

export default Settings;
