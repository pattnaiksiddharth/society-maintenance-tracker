import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'resident' | 'admin';
  unitNumber: string;
  contactNumber: string;
  avatarUrl?: string;
  passwordHash: string;
  /** Preserves the original JSON id (e.g. "u-admin-1") for migration tracking */
  legacyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    role: {
      type: String,
      enum: ['resident', 'admin'],
      default: 'resident',
      required: true,
    },
    unitNumber: {
      type: String,
      required: [true, 'Unit number is required'],
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '+91 90000 00000',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: undefined,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ role: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
