const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'follow',
        'like_note',
        'like_blog',
        'like_comment',
        'comment_note',
        'comment_blog',
        'friend_request',
        'friend_accepted',
        'achievement',
        'note_verified',
        'blog_verified',
        'message',
        'mention',
        'level_up',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // Frontend route to navigate to

    // Reference to the related entity
    refModel: { type: String, enum: ['Note', 'Blog', 'Comment', 'User', 'Badge'] },
    refId: { type: mongoose.Schema.Types.ObjectId },

    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
