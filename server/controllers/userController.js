const User = require('../models/User');
const { Follow, Bookmark } = require('../models/Social');
const Note = require('../models/Note');
const Blog = require('../models/Blog');
const { AppError, asyncHandler, sendResponse, paginatedResponse } = require('../utils/helpers');
const { createNotification, NOTIFICATION_TEMPLATES } = require('../utils/notifications');

// ─── Get User Profile ──────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res, next) => {
  const { username } = req.params;
  const user = await User.findOne({ username: username.toLowerCase() })
    .select('-password -refreshTokens -resetPasswordToken -emailVerificationToken')
    .populate('badges', 'name icon color description');

  if (!user || user.isBanned) return next(new AppError('User not found', 404));
  if (!user.isProfilePublic && req.user?._id.toString() !== user._id.toString()) {
    return next(new AppError('This profile is private', 403));
  }

  // Check if current user follows this user
  let isFollowing = false;
  if (req.user) {
    const follow = await Follow.findOne({ follower: req.user._id, following: user._id });
    isFollowing = !!follow;
  }

  sendResponse(res, 200, 'Profile fetched', { ...user.toObject(), isFollowing });
});

// ─── Update Profile ────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'bio', 'college', 'degree', 'semester', 'branch', 'skills', 'interests', 'github', 'linkedin', 'website', 'twitter', 'isProfilePublic', 'theme', 'accentColor', 'notificationPreferences'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password -refreshTokens');
  sendResponse(res, 200, 'Profile updated', user);
});

// ─── Update Avatar ─────────────────────────────────────────────
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('No file uploaded', 400));

  const avatarUrl = req.file.path || req.file.secure_url || `placeholder-${req.user._id}`;
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true }).select('-password');
  sendResponse(res, 200, 'Avatar updated', { avatar: user.avatar });
});

// ─── Follow / Unfollow ─────────────────────────────────────────
exports.toggleFollow = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  if (userId === req.user._id.toString()) return next(new AppError('Cannot follow yourself', 400));

  const targetUser = await User.findById(userId);
  if (!targetUser) return next(new AppError('User not found', 404));

  const existing = await Follow.findOne({ follower: req.user._id, following: userId });

  if (existing) {
    await existing.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(userId, { $inc: { followersCount: -1 } });
    return sendResponse(res, 200, 'Unfollowed successfully', { isFollowing: false });
  }

  await Follow.create({ follower: req.user._id, following: userId });
  await User.findByIdAndUpdate(req.user._id, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });

  // Notify
  const tmpl = NOTIFICATION_TEMPLATES.follow(req.user.name);
  await createNotification({ recipient: userId, sender: req.user._id, type: 'follow', ...tmpl, link: `/profile/${req.user.username}` });

  // Award XP for following
  await req.user.addXP(5);

  sendResponse(res, 200, 'Followed successfully', { isFollowing: true });
});

// ─── Get Followers / Following ─────────────────────────────────
exports.getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const follows = await Follow.find({ following: userId })
    .populate('follower', 'name username avatar level xp')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Follow.countDocuments({ following: userId });
  paginatedResponse(res, 'Followers fetched', follows.map((f) => f.follower), page, limit, total);
});

exports.getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const follows = await Follow.find({ follower: userId })
    .populate('following', 'name username avatar level xp')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Follow.countDocuments({ follower: userId });
  paginatedResponse(res, 'Following fetched', follows.map((f) => f.following), page, limit, total);
});

// ─── Get User Stats ────────────────────────────────────────────
exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.user._id;
  const [notesCount, blogsCount, followersCount, followingCount] = await Promise.all([
    Note.countDocuments({ author: userId, isActive: true }),
    Blog.countDocuments({ author: userId, status: 'published' }),
    Follow.countDocuments({ following: userId }),
    Follow.countDocuments({ follower: userId }),
  ]);

  const user = await User.findById(userId).select('xp level streak coins badges');
  sendResponse(res, 200, 'Stats fetched', { ...user.toObject(), notesCount, blogsCount, followersCount, followingCount });
});

// ─── Get Bookmarks ─────────────────────────────────────────────
exports.getBookmarks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { type } = req.query; // 'Note' or 'Blog'

  const query = { user: req.user._id };
  if (type) query.targetType = type;

  const bookmarks = await Bookmark.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Populate based on type
  const populated = await Promise.all(
    bookmarks.map(async (bm) => {
      const Model = bm.targetType === 'Note' ? Note : Blog;
      const item = await Model.findById(bm.targetId).populate('author', 'name username avatar');
      return { ...bm.toObject(), item };
    })
  );

  const total = await Bookmark.countDocuments(query);
  paginatedResponse(res, 'Bookmarks fetched', populated, page, limit, total);
});

// ─── Search Users ──────────────────────────────────────────────
exports.searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  if (!q) return sendResponse(res, 200, 'Users fetched', []);

  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { username: { $regex: q, $options: 'i' } },
      { college: { $regex: q, $options: 'i' } },
    ],
    isActive: true,
    isBanned: false,
  })
    .select('name username avatar level xp college branch')
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  sendResponse(res, 200, 'Users found', users);
});

// ─── Leaderboard ───────────────────────────────────────────────
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { type = 'xp', college, semester, page = 1, limit = 20 } = req.query;

  const query = { isActive: true, isBanned: false };
  if (college) query.college = { $regex: college, $options: 'i' };
  if (semester) query.semester = parseInt(semester);

  const sortField = {
    xp: { xp: -1 },
    notes: { notesCount: -1 },
    blogs: { blogsCount: -1 },
    streak: { streak: -1 },
  }[type] || { xp: -1 };

  const users = await User.find(query)
    .select('name username avatar level xp streak notesCount blogsCount college branch semester')
    .sort(sortField)
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);
  paginatedResponse(res, 'Leaderboard fetched', users, page, limit, total);
});
