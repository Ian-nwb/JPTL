import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    type: {
      type: String,
      enum: ['maintenance', 'announcement', 'payment', 'lease', 'system'],
      default: 'system',
    },
    read: { type: Boolean, default: false },
    // Optional reference to the entity that triggered the notification
    refModel: { type: String, enum: ['Ticket', 'Announcement', 'Payment', 'Lease', null], default: null },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

// Compound index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
