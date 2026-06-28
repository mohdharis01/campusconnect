const Note = require('../models/Note');
const { Like, Bookmark } = require('../models/Social');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { AppError, asyncHandler, sendResponse, paginatedResponse } = require('../utils/helpers');
const { createNotification, NOTIFICATION_TEMPLATES } = require('../utils/notifications');

// ─── Upload Note ───────────────────────────────────────────────
exports.uploadNote = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new AppError('Please upload a file', 400));

  const { title, description, subject, semester, branch, tags } = req.body;
  const fileExt = req.file.originalname?.split('.').pop()?.toLowerCase();

  const note = await Note.create({
    title,
    description,
    subject,
    semester: semester ? parseInt(semester) : undefined,
    branch,
    tags: tags ? JSON.parse(tags) : [],
    author: req.user._id,
    fileUrl: req.file.path || req.file.secure_url || req.file.originalname,
    filePublicId: req.file.filename,
    fileType: fileExt || 'pdf',
    fileSize: req.file.size,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { notesCount: 1 } });
  await req.user.addXP(50); // Award XP for uploading

  const populated = await note.populate('author', 'name username avatar');
  sendResponse(res, 201, 'Note uploaded successfully', populated);
});

// ─── Get All Notes ─────────────────────────────────────────────
exports.getNotes = asyncHandler(async (req, res) => {
  const { search, subject, semester, branch, fileType, verified, sort = 'newest', page = 1, limit = 12 } = req.query;

  const query = { isActive: true };
  if (search) query.$text = { $search: search };
  if (subject) query.subject = { $regex: subject, $options: 'i' };
  if (semester) query.semester = parseInt(semester);
  if (branch) query.branch = { $regex: branch, $options: 'i' };
  if (fileType) query.fileType = fileType;
  if (verified) query.verificationStatus = verified;

  const sortOptions = {
    newest: { createdAt: -1 },
    popular: { likesCount: -1 },
    downloads: { downloadsCount: -1 },
    rating: { rating: -1 },
  };

  const notes = await Note.find(query)
    .populate('author', 'name username avatar level')
    .sort(sortOptions[sort] || { createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Note.countDocuments(query);

  // Attach user interaction data
  if (req.user) {
    const noteIds = notes.map((n) => n._id);
    const [likes, bookmarks] = await Promise.all([
      Like.find({ user: req.user._id, targetType: 'Note', targetId: { $in: noteIds } }),
      Bookmark.find({ user: req.user._id, targetType: 'Note', targetId: { $in: noteIds } }),
    ]);
    const likedSet = new Set(likes.map((l) => l.targetId.toString()));
    const bookmarkedSet = new Set(bookmarks.map((b) => b.targetId.toString()));
    const notesWithInteraction = notes.map((n) => ({
      ...n.toObject(),
      isLiked: likedSet.has(n._id.toString()),
      isBookmarked: bookmarkedSet.has(n._id.toString()),
    }));
    return paginatedResponse(res, 'Notes fetched', notesWithInteraction, page, limit, total);
  }

  paginatedResponse(res, 'Notes fetched', notes, page, limit, total);
});

// ─── Get Single Note ───────────────────────────────────────────
exports.getNoteById = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id).populate('author', 'name username avatar level college');
  if (!note || !note.isActive) return next(new AppError('Note not found', 404));

  // Increment views
  await Note.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

  let isLiked = false, isBookmarked = false;
  if (req.user) {
    const [like, bookmark] = await Promise.all([
      Like.findOne({ user: req.user._id, targetType: 'Note', targetId: note._id }),
      Bookmark.findOne({ user: req.user._id, targetType: 'Note', targetId: note._id }),
    ]);
    isLiked = !!like;
    isBookmarked = !!bookmark;
  }

  sendResponse(res, 200, 'Note fetched', { ...note.toObject(), isLiked, isBookmarked });
});

// ─── Download Note ─────────────────────────────────────────────
exports.downloadNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id);
  if (!note || !note.isActive) return next(new AppError('Note not found', 404));

  await Note.findByIdAndUpdate(req.params.id, { $inc: { downloadsCount: 1 } });
  await req.user.addXP(2); // Small XP for downloading

  sendResponse(res, 200, 'Download initiated', { fileUrl: note.fileUrl, fileName: note.title });
});

// ─── Toggle Like ───────────────────────────────────────────────
exports.toggleLike = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new AppError('Note not found', 404);

  const existing = await Like.findOne({ user: req.user._id, targetType: 'Note', targetId: note._id });

  if (existing) {
    await existing.deleteOne();
    await Note.findByIdAndUpdate(note._id, { $inc: { likesCount: -1 } });
    return sendResponse(res, 200, 'Like removed', { isLiked: false, likesCount: note.likesCount - 1 });
  }

  await Like.create({ user: req.user._id, targetType: 'Note', targetId: note._id });
  await Note.findByIdAndUpdate(note._id, { $inc: { likesCount: 1 } });

  // Notify author
  if (note.author.toString() !== req.user._id.toString()) {
    const tmpl = NOTIFICATION_TEMPLATES.like_note(req.user.name, note.title);
    await createNotification({ recipient: note.author, sender: req.user._id, type: 'like_note', ...tmpl, link: `/notes/${note._id}`, refModel: 'Note', refId: note._id });
  }
  await req.user.addXP(1);

  sendResponse(res, 200, 'Note liked', { isLiked: true, likesCount: note.likesCount + 1 });
});

// ─── Toggle Bookmark ───────────────────────────────────────────
exports.toggleBookmark = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new AppError('Note not found', 404);

  const existing = await Bookmark.findOne({ user: req.user._id, targetType: 'Note', targetId: note._id });

  if (existing) {
    await existing.deleteOne();
    await Note.findByIdAndUpdate(note._id, { $inc: { bookmarksCount: -1 } });
    return sendResponse(res, 200, 'Bookmark removed', { isBookmarked: false });
  }

  await Bookmark.create({ user: req.user._id, targetType: 'Note', targetId: note._id });
  await Note.findByIdAndUpdate(note._id, { $inc: { bookmarksCount: 1 } });
  sendResponse(res, 200, 'Note bookmarked', { isBookmarked: true });
});

// ─── Delete Note ───────────────────────────────────────────────
exports.deleteNote = asyncHandler(async (req, res, next) => {
  const note = await Note.findById(req.params.id);
  if (!note) return next(new AppError('Note not found', 404));

  const isOwner = note.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return next(new AppError('Unauthorized', 403));

  await note.updateOne({ isActive: false });
  await User.findByIdAndUpdate(note.author, { $inc: { notesCount: -1 } });
  sendResponse(res, 200, 'Note deleted');
});

// ─── Verify Note (Teacher/Admin) ───────────────────────────────
exports.verifyNote = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  if (!['teacher_verified', 'admin_verified', 'community'].includes(status)) {
    return next(new AppError('Invalid verification status', 400));
  }

  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: status, verifiedBy: req.user._id, verifiedAt: new Date() },
    { new: true }
  );
  if (!note) return next(new AppError('Note not found', 404));

  // Notify author
  const tmpl = NOTIFICATION_TEMPLATES.note_verified(note.title);
  await createNotification({ recipient: note.author, sender: req.user._id, type: 'note_verified', ...tmpl, link: `/notes/${note._id}`, refModel: 'Note', refId: note._id });

  sendResponse(res, 200, 'Note verification updated', note);
});

// ─── Get Comments ──────────────────────────────────────────────
exports.getNoteComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const comments = await Comment.find({ targetType: 'Note', targetId: req.params.id, parentComment: null, isActive: true })
    .populate('author', 'name username avatar')
    .populate({ path: 'replies', populate: { path: 'author', select: 'name username avatar' } })
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Comment.countDocuments({ targetType: 'Note', targetId: req.params.id, parentComment: null, isActive: true });
  paginatedResponse(res, 'Comments fetched', comments, page, limit, total);
});

// ─── Add Comment ───────────────────────────────────────────────
exports.addComment = asyncHandler(async (req, res) => {
  const { content, parentComment } = req.body;
  const note = await Note.findById(req.params.id);
  if (!note) throw new AppError('Note not found', 404);

  const comment = await Comment.create({
    content,
    author: req.user._id,
    targetType: 'Note',
    targetId: note._id,
    parentComment: parentComment || null,
  });

  if (parentComment) {
    await Comment.findByIdAndUpdate(parentComment, { $push: { replies: comment._id } });
  } else {
    await Note.findByIdAndUpdate(note._id, { $inc: { commentsCount: 1 } });
  }

  // Notify note author
  if (note.author.toString() !== req.user._id.toString()) {
    const tmpl = NOTIFICATION_TEMPLATES.comment_note(req.user.name, note.title);
    await createNotification({ recipient: note.author, sender: req.user._id, type: 'comment_note', ...tmpl, link: `/notes/${note._id}`, refModel: 'Note', refId: note._id });
  }

  await req.user.addXP(5);
  const populated = await comment.populate('author', 'name username avatar');
  sendResponse(res, 201, 'Comment added', populated);
});
