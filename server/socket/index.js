const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const { Message } = require('../models/Misc');
const Notification = require('../models/Notification');

// Track online users: userId -> socketId
const onlineUsers = new Map();

const initSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('name username avatar role');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    console.log(`🔌 ${socket.user.username} connected (${socket.id})`);

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId, username: socket.user.username });

    // Join personal room for targeted events
    socket.join(`user:${userId}`);

    // ─── Messaging ──────────────────────────────────────────
    socket.on('message:send', async ({ receiverId, content, fileUrl, fileType }) => {
      try {
        if (!content?.trim() && !fileUrl) return;

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content: content?.trim(),
          fileUrl,
          fileType,
        });

        const populated = await message.populate('sender', 'name username avatar');

        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', populated);
        }

        // Echo back to sender
        socket.emit('message:sent', populated);

        // Create notification if receiver is not in the chat
        await Notification.create({
          recipient: receiverId,
          sender: userId,
          type: 'message',
          title: 'New Message',
          message: `${socket.user.name} sent you a message`,
          link: `/messages/${userId}`,
        });

        // Send notification to receiver
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('notification:new', {
            type: 'message',
            sender: { name: socket.user.name, avatar: socket.user.avatar },
          });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── Typing Indicator ───────────────────────────────────
    socket.on('typing:start', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:start', { senderId: userId, username: socket.user.username });
      }
    });

    socket.on('typing:stop', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:stop', { senderId: userId });
      }
    });

    // ─── Read Receipts ──────────────────────────────────────
    socket.on('message:read', async ({ senderId, messageIds }) => {
      await Message.updateMany(
        { _id: { $in: messageIds }, receiver: userId },
        { isRead: true, readAt: new Date() }
      );
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('message:read', { messageIds, readBy: userId });
      }
    });

    // ─── Real-time Notifications ─────────────────────────────
    socket.on('notification:read', async ({ notificationId }) => {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true, readAt: new Date() });
    });

    // ─── Online Status ───────────────────────────────────────
    socket.on('get:online-users', () => {
      const onlineList = Array.from(onlineUsers.keys());
      socket.emit('online:users', onlineList);
    });

    // ─── Disconnect ──────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec();
      console.log(`❌ ${socket.user.username} disconnected`);
    });
  });

  return { onlineUsers };
};

// Helper to emit notification to specific user
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, emitToUser };
