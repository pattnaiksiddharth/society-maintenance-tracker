import mongoose, { Schema, Document, Model } from 'mongoose';

export type EmailType =
  | 'COMPLAINT_CREATED'
  | 'STATUS_UPDATED'
  | 'PRIORITY_CHANGED'
  | 'NOTICE_BROADCAST'
  | 'OVERDUE_ALERT';

export interface IEmailLog extends Document {
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  type: EmailType;
  referenceId?: string;
  sentAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    to: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['COMPLAINT_CREATED', 'STATUS_UPDATED', 'PRIORITY_CHANGED', 'NOTICE_BROADCAST', 'OVERDUE_ALERT'],
      required: true,
    },
    referenceId: {
      type: String,
      default: undefined,
    },
    sentAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    // No auto timestamps — sentAt is the canonical time field
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

EmailLogSchema.index({ sentAt: -1 });
EmailLogSchema.index({ type: 1 });

const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);

export default EmailLog;
