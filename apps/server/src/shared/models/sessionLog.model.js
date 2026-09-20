import mongoose from 'mongoose';

const { Schema } = mongoose;

const sessionLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['tenant', 'landlord', 'superadmin'],
      required: true,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    loginAt: {
      type: Date,
      default: Date.now,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

sessionLogSchema.index({ userId: 1, isActive: 1 });

const SessionLog = mongoose.model('SessionLog', sessionLogSchema);

export { SessionLog };
export default SessionLog;
