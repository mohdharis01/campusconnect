const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, maxlength: 2000, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Polymorphic - can comment on notes or blogs
    targetType: { type: String, enum: ['Note', 'Blog', 'Discussion'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

    // Nested comments (one level deep)
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],

    // Stats
    likesCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Mentions
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isEdited: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });

module.exports = mongoose.model('Comment', commentSchema);
