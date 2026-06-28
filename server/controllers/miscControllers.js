const Notification = require('../models/Notification');
const { Roadmap, Progress } = require('../models/Roadmap');
const { AIChat, Discussion } = require('../models/Misc');
const { v4: uuidv4 } = require('uuid');
const { AppError, asyncHandler, sendResponse, paginatedResponse } = require('../utils/helpers');

// ════════════════════════════════════════════════════
// NOTIFICATION CONTROLLER
// ════════════════════════════════════════════════════

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const notifications = await Notification.find(query)
    .populate('sender', 'name username avatar')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

  paginatedResponse(res, 'Notifications fetched', { notifications, unreadCount }, page, limit, total);
});

exports.markNotificationsRead = asyncHandler(async (req, res) => {
  const { ids } = req.body; // Array of notification IDs, or empty to mark all
  const query = { recipient: req.user._id };
  if (ids?.length) query._id = { $in: ids };

  await Notification.updateMany(query, { isRead: true, readAt: new Date() });
  sendResponse(res, 200, 'Notifications marked as read');
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  sendResponse(res, 200, 'Notification deleted');
});

// ════════════════════════════════════════════════════
// ROADMAP CONTROLLER
// ════════════════════════════════════════════════════

exports.getRoadmaps = asyncHandler(async (req, res) => {
  const { category, difficulty, page = 1, limit = 12 } = req.query;
  const query = { isActive: true };
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;

  const roadmaps = await Roadmap.find(query)
    .populate('author', 'name username avatar')
    .sort({ isOfficial: -1, enrolledCount: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Roadmap.countDocuments(query);

  // Attach user progress
  if (req.user) {
    const roadmapIds = roadmaps.map((r) => r._id);
    const progresses = await Progress.find({ user: req.user._id, roadmap: { $in: roadmapIds } });
    const progressMap = {};
    progresses.forEach((p) => { progressMap[p.roadmap.toString()] = p; });
    const roadmapsWithProgress = roadmaps.map((r) => ({
      ...r.toObject(),
      userProgress: progressMap[r._id.toString()] || null,
    }));
    return paginatedResponse(res, 'Roadmaps fetched', roadmapsWithProgress, page, limit, total);
  }

  paginatedResponse(res, 'Roadmaps fetched', roadmaps, page, limit, total);
});

exports.getRoadmapBySlug = asyncHandler(async (req, res, next) => {
  const roadmap = await Roadmap.findOne({ slug: req.params.slug, isActive: true }).populate('author', 'name username avatar');
  if (!roadmap) return next(new AppError('Roadmap not found', 404));

  let userProgress = null;
  if (req.user) {
    userProgress = await Progress.findOne({ user: req.user._id, roadmap: roadmap._id });
  }
  sendResponse(res, 200, 'Roadmap fetched', { ...roadmap.toObject(), userProgress });
});

exports.enrollRoadmap = asyncHandler(async (req, res, next) => {
  const roadmap = await Roadmap.findById(req.params.id);
  if (!roadmap) return next(new AppError('Roadmap not found', 404));

  const existing = await Progress.findOne({ user: req.user._id, roadmap: roadmap._id });
  if (existing) return sendResponse(res, 200, 'Already enrolled', existing);

  const progress = await Progress.create({ user: req.user._id, roadmap: roadmap._id });
  await Roadmap.findByIdAndUpdate(roadmap._id, { $inc: { enrolledCount: 1 } });
  await req.user.addXP(20);
  sendResponse(res, 201, 'Enrolled in roadmap', progress);
});

exports.updateProgress = asyncHandler(async (req, res, next) => {
  const { topicId, levelId, studyHours } = req.body;
  const progress = await Progress.findOne({ user: req.user._id, roadmap: req.params.id });
  if (!progress) return next(new AppError('Not enrolled in this roadmap', 404));

  if (topicId && !progress.completedTopics.includes(topicId)) {
    progress.completedTopics.push(topicId);
    await req.user.addXP(30);
  }
  if (levelId && !progress.completedLevels.includes(levelId)) {
    progress.completedLevels.push(levelId);
    await req.user.addXP(100);
  }
  if (studyHours) progress.studyHours += parseFloat(studyHours);

  // Calculate progress percent
  const roadmap = await Roadmap.findById(req.params.id);
  const totalTopics = roadmap.levels.reduce((acc, l) => acc + l.topics.length, 0);
  progress.progressPercent = totalTopics > 0 ? Math.round((progress.completedTopics.length / totalTopics) * 100) : 0;
  progress.lastActivityAt = new Date();
  if (progress.progressPercent === 100) progress.completedAt = new Date();

  await progress.save();
  sendResponse(res, 200, 'Progress updated', progress);
});

exports.createRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.create({ ...req.body, author: req.user._id });
  sendResponse(res, 201, 'Roadmap created', roadmap);
});

// ════════════════════════════════════════════════════
// AI ASSISTANT CONTROLLER
// ════════════════════════════════════════════════════

exports.getAIChatSessions = asyncHandler(async (req, res) => {
  const sessions = await AIChat.find({ user: req.user._id, isActive: true })
    .select('sessionId title updatedAt')
    .sort({ updatedAt: -1 })
    .limit(20);
  sendResponse(res, 200, 'Sessions fetched', sessions);
});

exports.getChatSession = asyncHandler(async (req, res, next) => {
  const session = await AIChat.findOne({ sessionId: req.params.sessionId, user: req.user._id });
  if (!session) return next(new AppError('Session not found', 404));
  sendResponse(res, 200, 'Session fetched', session);
});

exports.sendAIMessage = asyncHandler(async (req, res, next) => {
  const { message, sessionId } = req.body;
  if (!message?.trim()) return next(new AppError('Message cannot be empty', 400));

  // Find or create session
  let session = await AIChat.findOne({ sessionId, user: req.user._id });
  if (!session) {
    session = await AIChat.create({
      user: req.user._id,
      sessionId: sessionId || uuidv4(),
      title: message.substring(0, 50),
      messages: [],
    });
  }

  // Add user message
  session.messages.push({ role: 'user', content: message });

  let aiResponse = '';
console.log('Groq key:', process.env.GROQ_API_KEY ? 'Found' : 'NOT FOUND');

if (process.env.GROQ_API_KEY) {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const chatMessages = session.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are CampusConnect AI, a helpful assistant for college students. You help with:
- DSA and programming concepts
- Study plans and roadmaps  
- Resume review
- Interview preparation
- Project suggestions
- Code debugging
Be concise, friendly, and student-focused. Use examples when helpful.`,
          },
          ...chatMessages,
        ],
        max_tokens: 1000,
      });
      aiResponse = completion.choices[0].message.content;
    } catch (err) {
    console.error('Groq error:', err.message, err.status, JSON.stringify(err));
      aiResponse = 'AI service is temporarily unavailable. Please try again later.';
    }
  } else {
    const fallbacks = [
      "Great question! To get full AI responses, configure your GROQ_API_KEY.",
      "I'd love to help! Once the Groq API is configured, I'll be able to give you detailed answers.",
      "Set up the Groq integration to unlock full AI assistance.",
    ];
    aiResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  session.messages.push({ role: 'assistant', content: aiResponse });
  await session.save();

  sendResponse(res, 200, 'AI response generated', {
    sessionId: session.sessionId,
    message: aiResponse,
    session,
  });
});

exports.deleteAISession = asyncHandler(async (req, res) => {
  await AIChat.findOneAndUpdate({ sessionId: req.params.sessionId, user: req.user._id }, { isActive: false });
  sendResponse(res, 200, 'Session deleted');
});

// ════════════════════════════════════════════════════
// DISCUSSION CONTROLLER
// ════════════════════════════════════════════════════

exports.getDiscussions = asyncHandler(async (req, res) => {
  const { category, search, sort = 'newest', page = 1, limit = 15 } = req.query;
  const query = { isActive: true };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const sortOptions = {
    newest: { createdAt: -1 },
    popular: { upvoteCount: -1 },
    unanswered: { commentsCount: 1, createdAt: -1 },
  };

  const discussions = await Discussion.find(query)
    .populate('author', 'name username avatar level')
    .sort(sortOptions[sort] || { createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Discussion.countDocuments(query);
  paginatedResponse(res, 'Discussions fetched', discussions, page, limit, total);
});

exports.createDiscussion = asyncHandler(async (req, res) => {
  const discussion = await Discussion.create({ ...req.body, author: req.user._id });
  await req.user.addXP(20);
  sendResponse(res, 201, 'Discussion created', await discussion.populate('author', 'name username avatar'));
});

exports.voteDiscussion = asyncHandler(async (req, res) => {
  const { vote } = req.body; // 'up' or 'down'
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw new AppError('Discussion not found', 404);

  const userId = req.user._id;
  const hasUpvoted = discussion.upvotes.includes(userId);
  const hasDownvoted = discussion.downvotes.includes(userId);

  if (vote === 'up') {
    if (hasUpvoted) {
      discussion.upvotes.pull(userId);
    } else {
      discussion.upvotes.push(userId);
      if (hasDownvoted) discussion.downvotes.pull(userId);
    }
  } else {
    if (hasDownvoted) {
      discussion.downvotes.pull(userId);
    } else {
      discussion.downvotes.push(userId);
      if (hasUpvoted) discussion.upvotes.pull(userId);
    }
  }

  discussion.upvoteCount = discussion.upvotes.length - discussion.downvotes.length;
  await discussion.save();
  sendResponse(res, 200, 'Vote recorded', { upvoteCount: discussion.upvoteCount });
});

// ════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ════════════════════════════════════════════════════
const User = require('../models/User');
const Note = require('../models/Note');
const Blog = require('../models/Blog');

exports.getAdminStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalNotes, totalBlogs, totalDiscussions, recentUsers] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Note.countDocuments({ isActive: true }),
    Blog.countDocuments({ status: 'published', isActive: true }),
    Discussion.countDocuments({ isActive: true }),
    User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('name username email role createdAt avatar'),
  ]);

  sendResponse(res, 200, 'Admin stats fetched', {
    totalUsers,
    totalNotes,
    totalBlogs,
    totalDiscussions,
    recentUsers,
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const users = await User.find(query)
    .select('-password -refreshTokens')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);
  paginatedResponse(res, 'Users fetched', users, page, limit, total);
});

exports.banUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true, bannedReason: reason }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  sendResponse(res, 200, 'User banned', user);
});

exports.unbanUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false, bannedReason: undefined }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  sendResponse(res, 200, 'User unbanned', user);
});

exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'teacher', 'admin'].includes(role)) throw new AppError('Invalid role', 400);
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  sendResponse(res, 200, 'Role updated', user);
});
