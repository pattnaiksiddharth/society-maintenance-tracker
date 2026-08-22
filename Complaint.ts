import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ComplaintCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'Elevator'
  | 'Water'
  | 'Carpentry'
  | 'HVAC'
  | 'Common Area'
  | 'Security'
  | 'Pest Control'
  | 'Other';

export interface IComplaint extends Document {
  code: string;
  residentId: Types.ObjectId;
  // Denormalized for API compatibility (frontend contract)
  residentName: string;
  residentUnit: string;
  residentContact: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  photoUrl?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: string;
  resolvedAt?: Date;
  /** Preserves original c-XXXX id for migration tracking */
  legacyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    code: {
      type: String,
      required: [true, 'Complaint code is required'],
      unique: true,
      index: true,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident reference is required'],
      index: true,
    },
    // Denormalized fields (preserved for existing API contract)
    residentName: {
      type: String,
      required: true,
      trim: true,
    },
    residentUnit: {
      type: String,
      required: true,
      trim: true,
    },
    residentContact: {
      type: String,
      default: '+91 98000 00000',
      trim: true,
    },
    category: {
      type: String,
      enum: ['Plumbing', 'Electrical', 'Elevator', 'Water', 'Carpentry', 'HVAC', 'Common Area', 'Security', 'Pest Control', 'Other'],
      required: [true, 'Category is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
      default: 'OPEN',
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
      required: true,
      index: true,
    },
    assignedTo: {
      type: String,
      default: undefined,
    },
    resolvedAt: {
      type: Date,
      default: undefined,
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
        ret.residentId = ret.residentId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for admin filters
ComplaintSchema.index({ status: 1, createdAt: -1 });
ComplaintSchema.index({ category: 1, status: 1 });
ComplaintSchema.index({ priority: 1, status: 1 });
ComplaintSchema.index({ residentId: 1, createdAt: -1 });

const Complaint: Model<IComplaint> =
  mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);

export default Complaint;
