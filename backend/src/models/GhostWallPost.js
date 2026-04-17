const mongoose = require('mongoose');

const ghostWallPostSchema = new mongoose.Schema(
  {
    // No user reference — posts are fully anonymous
    contentType: {
      type: String,
      enum: ['text', 'image'],
      required: true,
    },
    textContent: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaPublicId: {
      type: String,
      default: '',
    },
    // The time this post will auto-destruct
    expiresAt: {
      type: Date,
      required: true,
    },
    // Soft-delete flag (lifecycle engine marks this)
    isExpired: {
      type: Boolean,
      default: false,
    },
    // Reaction counts (emoji reactions)
    reactions: {
      heart: { type: Number, default: 0 },
      ghost: { type: Number, default: 0 },
      fire: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index for efficient expiry queries
ghostWallPostSchema.index({ expiresAt: 1, isExpired: 1 });

module.exports = mongoose.model('GhostWallPost', ghostWallPostSchema);
