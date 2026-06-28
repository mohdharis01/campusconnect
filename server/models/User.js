const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },

    // Profile
    avatar: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    college: { type: String, default: '' },
    degree: { type: String, default: '' },
    semester: { type: Number, min: 1, max: 12 },
    branch: { type: String, default: '' },
    skills: [{ type: String }],
    interests: [{ type: String }],

    // Social Links
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    website: { type: String, default: '' },
    twitter: { type: String, default: '' },

    // OAuth
    googleId: { type: String },
    githubId: { type: String },

    // Gamification
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],

    // Stats
    notesCount: { type: Number, default: 0 },
    blogsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },

    // Auth
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshTokens: [{ type: String }],

    // Settings
    isProfilePublic: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'amoled', 'github', 'hacker'], default: 'dark' },
    accentColor: { type: String, default: '#6366f1' },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
    },

    // Status
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    bannedReason: String,
    isTeacherVerified: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate level from XP
userSchema.methods.calculateLevel = function () {
  const xpThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  let level = 1;
  for (let i = 0; i < xpThresholds.length; i++) {
    if (this.xp >= xpThresholds[i]) level = i + 1;
  }
  return Math.min(level, 11);
};

// Add XP and update level/streak
userSchema.methods.addXP = async function (amount) {
  this.xp += amount;
  this.level = this.calculateLevel();

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) this.streak += 1;
    else if (diffDays > 1) this.streak = 1;
  } else {
    this.streak = 1;
  }
  this.lastActiveDate = new Date();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
