const mongoose = require('mongoose');

// ─── Follow System ───────────────────────────────────────────────
const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1 });

// ─── Like System (polymorphic) ───────────────────────────────────
const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Note', 'Blog', 'Comment', 'Discussion'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);
likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });

// ─── Bookmark System ─────────────────────────────────────────────
const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Note', 'Blog'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);
bookmarkSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

// ─── Friend Request ──────────────────────────────────────────────
const friendRequestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = {
  Follow: mongoose.model('Follow', followSchema),
  Like: mongoose.model('Like', likeSchema),
  Bookmark: mongoose.model('Bookmark', bookmarkSchema),
  FriendRequest: mongoose.model('FriendRequest', friendRequestSchema),
};
