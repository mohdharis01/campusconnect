const Blog = require('../models/Blog');
const { Like, Bookmark } = require('../models/Social');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { AppError, asyncHandler, sendResponse, paginatedResponse } = require('../utils/helpers');
const { createNotification, NOTIFICATION_TEMPLATES } = require('../utils/notifications');

// ─── Create Blog ───────────────────────────────────────────────
exports.createBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, category, tags, status } = req.body;
  const coverImage = req.file?.path || req.file?.secure_url || req.body.coverImage;

  const blog = await Blog.create({
    title,
    content,
    excerpt: excerpt || content.substring(0, 200),
    category,
    tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
    status: status || 'draft',
    coverImage,
    author: req.user._id,
  });

  if (status === 'published') {
    await User.findByIdAndUpdate(req.user._id, { $inc: { blogsCount: 1 } });
    await req.user.addXP(80);
  }

  const populated = await blog.populate('author', 'name username avatar');
  sendResponse(res, 201, blog.status === 'published' ? 'Blog published!' : 'Draft saved', populated);
});

// ─── Get All Blogs ─────────────────────────────────────────────
exports.getBlogs = asyncHandler(async (req, res) => {
  const { search, category, tag, sort = 'newest', page = 1, limit = 10, author } = req.query;

  const query = { status: 'published', isActive: true };
  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (tag) query.tags = tag;
  if (author) query.author = author;

  const sortOptions = {
    newest: { publishedAt: -1 },
    popular: { likesCount: -1 },
    views: { viewsCount: -1 },
    trending: { createdAt: -1, likesCount: -1 },
  };

  const blogs = await Blog.find(query)
    .populate('author', 'name username avatar level college')
    .sort(sortOptions[sort] || { publishedAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Blog.countDocuments(query);

  if (req.user) {
    const blogIds = blogs.map((b) => b._id);
    const [likes, bookmarks] = await Promise.all([
      Like.find({ user: req.user._id, targetType: 'Blog', targetId: { $in: blogIds } }),
      Bookmark.find({ user: req.user._id, targetType: 'Blog', targetId: { $in: blogIds } }),
    ]);
    const likedSet = new Set(likes.map((l) => l.targetId.toString()));
    const bookmarkedSet = new Set(bookmarks.map((b) => b.targetId.toString()));
    const blogsWithInteraction = blogs.map((b) => ({
      ...b.toObject(),
      isLiked: likedSet.has(b._id.toString()),
      isBookmarked: bookmarkedSet.has(b._id.toString()),
    }));
    return paginatedResponse(res, 'Blogs fetched', blogsWithInteraction, page, limit, total);
  }

  paginatedResponse(res, 'Blogs fetched', blogs, page, limit, total);
});

// ─── Get Blog by Slug ──────────────────────────────────────────
exports.getBlogBySlug = asyncHandler(async (req, res, next) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isActive: true }).populate('author', 'name username avatar level bio college');
  if (!blog) return next(new AppError('Blog not found', 404));

  await Blog.findByIdAndUpdate(blog._id, { $inc: { viewsCount: 1 } });

  let isLiked = false, isBookmarked = false;
  if (req.user) {
    const [like, bookmark] = await Promise.all([
      Like.findOne({ user: req.user._id, targetType: 'Blog', targetId: blog._id }),
      Bookmark.findOne({ user: req.user._id, targetType: 'Blog', targetId: blog._id }),
    ]);
    isLiked = !!like;
    isBookmarked = !!bookmark;
  }

  sendResponse(res, 200, 'Blog fetched', { ...blog.toObject(), isLiked, isBookmarked });
});

// ─── Update Blog ───────────────────────────────────────────────
exports.updateBlog = asyncHandler(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return next(new AppError('Blog not found', 404));
  if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Unauthorized', 403));
  }

  const wasPublished = blog.status === 'published';
  const { title, content, excerpt, category, tags, status } = req.body;
  if (title) blog.title = title;
  if (content) blog.content = content;
  if (excerpt) blog.excerpt = excerpt;
  if (category) blog.category = category;
  if (tags) blog.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
  if (status) blog.status = status;
  if (req.file) blog.coverImage = req.file.path || req.file.secure_url;

  await blog.save();

  if (!wasPublished && blog.status === 'published') {
    await User.findByIdAndUpdate(req.user._id, { $inc: { blogsCount: 1 } });
    await req.user.addXP(80);
  }

  sendResponse(res, 200, 'Blog updated', await blog.populate('author', 'name username avatar'));
});

// ─── Delete Blog ───────────────────────────────────────────────
exports.deleteBlog = asyncHandler(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return next(new AppError('Blog not found', 404));
  const isOwner = blog.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') return next(new AppError('Unauthorized', 403));

  await blog.updateOne({ isActive: false });
  if (blog.status === 'published') {
    await User.findByIdAndUpdate(blog.author, { $inc: { blogsCount: -1 } });
  }
  sendResponse(res, 200, 'Blog deleted');
});

// ─── Toggle Like ───────────────────────────────────────────────
exports.toggleLike = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new AppError('Blog not found', 404);

  const existing = await Like.findOne({ user: req.user._id, targetType: 'Blog', targetId: blog._id });

  if (existing) {
    await existing.deleteOne();
    await Blog.findByIdAndUpdate(blog._id, { $inc: { likesCount: -1 } });
    return sendResponse(res, 200, 'Like removed', { isLiked: false });
  }

  await Like.create({ user: req.user._id, targetType: 'Blog', targetId: blog._id });
  await Blog.findByIdAndUpdate(blog._id, { $inc: { likesCount: 1 } });

  if (blog.author.toString() !== req.user._id.toString()) {
    const tmpl = NOTIFICATION_TEMPLATES.like_blog(req.user.name, blog.title);
    await createNotification({ recipient: blog.author, sender: req.user._id, type: 'like_blog', ...tmpl, link: `/blogs/${blog.slug}`, refModel: 'Blog', refId: blog._id });
  }
  await req.user.addXP(1);
  sendResponse(res, 200, 'Blog liked', { isLiked: true });
});

// ─── Toggle Bookmark ───────────────────────────────────────────
exports.toggleBookmark = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new AppError('Blog not found', 404);

  const existing = await Bookmark.findOne({ user: req.user._id, targetType: 'Blog', targetId: blog._id });
  if (existing) {
    await existing.deleteOne();
    await Blog.findByIdAndUpdate(blog._id, { $inc: { bookmarksCount: -1 } });
    return sendResponse(res, 200, 'Bookmark removed', { isBookmarked: false });
  }
  await Bookmark.create({ user: req.user._id, targetType: 'Blog', targetId: blog._id });
  await Blog.findByIdAndUpdate(blog._id, { $inc: { bookmarksCount: 1 } });
  sendResponse(res, 200, 'Blog bookmarked', { isBookmarked: true });
});

// ─── Comments ──────────────────────────────────────────────────
exports.getBlogComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const comments = await Comment.find({ targetType: 'Blog', targetId: req.params.id, parentComment: null, isActive: true })
    .populate('author', 'name username avatar')
    .populate({ path: 'replies', populate: { path: 'author', select: 'name username avatar' } })
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const total = await Comment.countDocuments({ targetType: 'Blog', targetId: req.params.id, parentComment: null, isActive: true });
  paginatedResponse(res, 'Comments fetched', comments, page, limit, total);
});

exports.addComment = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new AppError('Blog not found', 404);

  const comment = await Comment.create({
    content: req.body.content,
    author: req.user._id,
    targetType: 'Blog',
    targetId: blog._id,
    parentComment: req.body.parentComment || null,
  });

  if (!req.body.parentComment) {
    await Blog.findByIdAndUpdate(blog._id, { $inc: { commentsCount: 1 } });
  } else {
    await Comment.findByIdAndUpdate(req.body.parentComment, { $push: { replies: comment._id } });
  }

  if (blog.author.toString() !== req.user._id.toString()) {
    const tmpl = NOTIFICATION_TEMPLATES.comment_blog(req.user.name, blog.title);
    await createNotification({ recipient: blog.author, sender: req.user._id, type: 'comment_blog', ...tmpl, link: `/blogs/${blog.slug}` });
  }

  await req.user.addXP(5);
  sendResponse(res, 201, 'Comment added', await comment.populate('author', 'name username avatar'));
});

// ─── Get My Drafts ─────────────────────────────────────────────
exports.getMyDrafts = asyncHandler(async (req, res) => {
  const drafts = await Blog.find({ author: req.user._id, status: 'draft', isActive: true }).sort({ updatedAt: -1 });
  sendResponse(res, 200, 'Drafts fetched', drafts);
});
