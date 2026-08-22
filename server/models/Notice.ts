import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NoticeCategory = 'IMPORTANT' | 'MAINTENANCE' | 'EVENT' | 'LIFESTYLE' | 'GENERAL';

export interface INotice extends Document {
  title: string;
  content: string;
  category: NoticeCategory;
  important: boolean;
  authorId: Types.ObjectId;
  // Denormalized for API compatibility
  authorName: string;
  authorRole: string;
  /** Preserves original n-N id for migration tracking */
  legacyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['IMPORTANT', 'MAINTENANCE', 'EVENT', 'LIFESTYLE', 'GENERAL'],
      default: 'GENERAL',
    },
    important: {
      type: Boolean,
      default: false,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required'],
    },
    // Denormalized for existing API contract
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorRole: {
      type: String,
      default: 'admin',
    },
    legacyId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        ret.id = ret._id.toString();
        ret.authorId = ret.authorId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index: important first, then newest
NoticeSchema.index({ important: -1, createdAt: -1 });

const Notice: Model<INotice> =
  mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);

export default Notice;
