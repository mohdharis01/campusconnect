const Notification = require('../models/Notification');

const createNotification = async ({ recipient, sender, type, title, message, link, refModel, refId }) => {
  try {
    // Don't notify yourself
    if (recipient.toString() === sender?.toString()) return null;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      refModel,
      refId,
    });

    return notification;
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return null;
  }
};

const NOTIFICATION_TEMPLATES = {
  follow: (senderName) => ({
    title: 'New Follower',
    message: `${senderName} started following you`,
  }),
  like_note: (senderName, noteTitle) => ({
    title: 'Note Liked',
    message: `${senderName} liked your note "${noteTitle}"`,
  }),
  like_blog: (senderName, blogTitle) => ({
    title: 'Blog Liked',
    message: `${senderName} liked your blog "${blogTitle}"`,
  }),
  comment_note: (senderName, noteTitle) => ({
    title: 'New Comment',
    message: `${senderName} commented on your note "${noteTitle}"`,
  }),
  comment_blog: (senderName, blogTitle) => ({
    title: 'New Comment',
    message: `${senderName} commented on your blog "${blogTitle}"`,
  }),
  friend_request: (senderName) => ({
    title: 'Friend Request',
    message: `${senderName} sent you a friend request`,
  }),
  friend_accepted: (senderName) => ({
    title: 'Friend Request Accepted',
    message: `${senderName} accepted your friend request`,
  }),
  note_verified: (noteTitle) => ({
    title: 'Note Verified ✅',
    message: `Your note "${noteTitle}" has been verified by a teacher`,
  }),
  achievement: (badgeName) => ({
    title: 'New Achievement! 🏆',
    message: `You earned the "${badgeName}" badge!`,
  }),
  level_up: (level) => ({
    title: 'Level Up! 🎉',
    message: `Congratulations! You reached Level ${level}!`,
  }),
};

module.exports = { createNotification, NOTIFICATION_TEMPLATES };
