const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    slug: { type: String, unique: true, lowercase: true },
    content: { type: String, required: true }, // Rich text / Markdown
    excerpt: { type: String, maxlength: 500 },
    coverImage: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Categorization
    tags: [{ type: String, lowercase: true, trim: true }],
    category: {
      type: String,
      enum: ['dsa', 'web-dev', 'cloud', 'ai-ml', 'projects', 'placement', 'college', 'other'],
      default: 'other',
    },

    // Status
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: Date,

    // Stats
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    readTime: { type: Number, default: 1 }, // minutes

    // Verification
    verificationStatus: {
      type: String,
      enum: ['community', 'teacher_verified', 'admin_verified'],
      default: 'community',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Moderation
    isActive: { type: Boolean, default: true },
    reportCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate slug from title
blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100) +
      '-' +
      Date.now();
  }
  // Auto-calculate read time (avg 200 words/min)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }
  // Auto-set publishedAt
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

blogSchema.index({ title: 'text', content: 'text', tags: 'text' });
blogSchema.index({ author: 1, status: 1, createdAt: -1 });
blogSchema.index({ category: 1, status: 1, likesCount: -1 });
blogSchema.index({ slug: 1 });

module.exports = mongoose.model('Blog', blogSchema);
