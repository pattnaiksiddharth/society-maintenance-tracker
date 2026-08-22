import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ActorRole = 'resident' | 'admin';

export interface IComplaintHistory extends Document {
  complaintId: Types.ObjectId;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  actorId: Types.ObjectId;
  actorName: string;
  actorRole: ActorRole;
  note?: string;
  /** Preserves original h-N id for migration tracking */
  legacyId?: string;
  createdAt: Date;
}

const ComplaintHistorySchema = new Schema<IComplaintHistory>(
  {
    complaintId: {
      type: Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint reference is required'],
      index: true,
    },
    previousStatus: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
      required: true,
    },
    newStatus: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    actorRole: {
      type: String,
      enum: ['resident', 'admin'],
      required: true,
    },
    note: {
      type: String,
      default: undefined,
    },
    legacyId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    // Only createdAt — history is immutable, no updatedAt needed
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform(_doc, ret: any) {
        ret.id = ret._id.toString();
        ret.complaintId = ret.complaintId?.toString();
        ret.actorId = ret.actorId?.toString();
        // Keep timestamp field consistent with existing frontend contract
        ret.timestamp = ret.createdAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for efficient per-complaint history queries (sorted by time)
ComplaintHistorySchema.index({ complaintId: 1, createdAt: -1 });

const ComplaintHistory: Model<IComplaintHistory> =
  mongoose.models.ComplaintHistory ||
  mongoose.model<IComplaintHistory>('ComplaintHistory', ComplaintHistorySchema);

export default ComplaintHistory;
