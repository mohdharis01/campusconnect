const mongoose = require('mongoose');

// ─── Badge ─────────────────────────────────────────────────────
const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: String, // emoji or image URL
  color: { type: String, default: '#6366f1' },
  category: {
    type: String,
    enum: ['contribution', 'streak', 'learning', 'social', 'achievement', 'special'],
  },
  xpRequired: { type: Number, default: 0 },
  condition: String, // description of how to earn
  isActive: { type: Boolean, default: true },
});

// ─── Message ───────────────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, maxlength: 2000 },
    fileUrl: String,
    fileType: { type: String, enum: ['image', 'file'] },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// Conversation index for fetching chat between two users
messageSchema.index({
  $and: [{ sender: 1 }, { receiver: 1 }],
});

// ─── Discussion ────────────────────────────────────────────────
const discussionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 300 },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['dsa', 'web-dev', 'cloud', 'ai-ml', 'projects', 'placement', 'college', 'general'],
      default: 'general',
    },
    tags: [String],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    upvoteCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    bestAnswer: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    isSolved: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
discussionSchema.index({ title: 'text', content: 'text', tags: 'text' });
discussionSchema.index({ category: 1, createdAt: -1 });

// ─── AI Chat ───────────────────────────────────────────────────
const aiChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    title: { type: String, default: 'New Chat' },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
aiChatSchema.index({ user: 1, createdAt: -1 });

// ─── Report ────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['Note', 'Blog', 'Comment', 'User', 'Discussion'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'copyright', 'misinformation', 'harassment', 'other'],
      required: true,
    },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    action: String,
  },
  { timestamps: true }
);

module.exports = {
  Badge: mongoose.model('Badge', badgeSchema),
  Message: mongoose.model('Message', messageSchema),
  Discussion: mongoose.model('Discussion', discussionSchema),
  AIChat: mongoose.model('AIChat', aiChatSchema),
  Report: mongoose.model('Report', reportSchema),
};
