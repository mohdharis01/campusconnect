const mongoose = require('mongoose');

// ─── Topic Schema ──────────────────────────────────────────────
const topicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  resources: [
    {
      title: String,
      url: String,
      type: { type: String, enum: ['video', 'article', 'practice', 'docs'] },
    },
  ],
  order: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  estimatedHours: { type: Number, default: 2 },
});

// ─── Level Schema ──────────────────────────────────────────────
const levelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  topics: [topicSchema],
  order: { type: Number, default: 0 },
  xpReward: { type: Number, default: 100 },
});

// ─── Roadmap Schema ────────────────────────────────────────────
const roadmapSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 1000 },
    slug: { type: String, unique: true, lowercase: true },
    category: {
      type: String,
      enum: ['dsa', 'web-dev', 'frontend', 'backend', 'cloud', 'ai-ml', 'placement', 'other'],
      required: true,
    },
    coverImage: String,
    levels: [levelSchema],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    enrolledCount: { type: Number, default: 0 },
    isOfficial: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tags: [String],
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedWeeks: { type: Number, default: 4 },
  },
  { timestamps: true }
);

roadmapSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  }
  next();
});

// ─── Progress Schema ───────────────────────────────────────────
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    completedTopics: [{ type: mongoose.Schema.Types.ObjectId }],
    completedLevels: [{ type: mongoose.Schema.Types.ObjectId }],
    currentLevel: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    totalXPEarned: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    lastActivityAt: { type: Date, default: Date.now },
    studyHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, roadmap: 1 }, { unique: true });

module.exports = {
  Roadmap: mongoose.model('Roadmap', roadmapSchema),
  Progress: mongoose.model('Progress', progressSchema),
};
