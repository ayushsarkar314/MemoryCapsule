const mongoose = require('mongoose');

const capsuleSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Untitled Capsule',
    },
    // Content type: text | image | voice | video
    contentType: {
      type: String,
      enum: ['text', 'image', 'voice', 'video'],
      required: true,
    },
    // For text capsules
    textContent: {
      type: String,
      default: '',
    },
    // For media capsules (Cloudinary URL + public_id)
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaPublicId: {
      type: String,
      default: '',
    },
    // Lifecycle status
    status: {
      type: String,
      enum: ['LOCKED', 'UNLOCKED', 'EXPIRED', 'DESTROYED'],
      default: 'LOCKED',
    },
    // Lifecycle RULES (exactly one should be set)
    rules: {
      unlockAt: { type: Date, default: null },       // Unlock at a future date
      destroyAfterView: { type: Boolean, default: false }, // Destroy after single view
      expireAt: { type: Date, default: null },        // Auto-expire at a date
      eventName: { type: String, default: null },     // Event-based trigger (e.g. "GRADUATION")
    },
    // For shared capsules: recipient user
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Tracking: has recipient seen it?
    seenByRecipient: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      default: null,
    },
    // Pending destruction (for destroy-after-view capsules)
    destroyAt: {
      type: Date,
      default: null,
    },
    // Is this a personal capsule or shared capsule?
    capsuleType: {
      type: String,
      enum: ['personal', 'shared'],
      default: 'personal',
    },
  },
  { timestamps: true }
);

// Index for efficient lifecycle queries
capsuleSchema.index({ status: 1, 'rules.unlockAt': 1 });
capsuleSchema.index({ status: 1, 'rules.expireAt': 1 });
capsuleSchema.index({ status: 1, destroyAt: 1 });

module.exports = mongoose.model('Capsule', capsuleSchema);
