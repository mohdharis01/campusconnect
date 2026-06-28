const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, min: 1, max: 12 },
    branch: { type: String, trim: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // File
    fileUrl: { type: String, required: true },
    filePublicId: { type: String },
    fileType: { type: String, enum: ['pdf', 'docx', 'ppt', 'pptx', 'zip'], required: true },
    fileSize: { type: Number }, // in bytes
    previewImage: { type: String },

    // Stats
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },

    // Verification
    verificationStatus: {
      type: String,
      enum: ['community', 'teacher_verified', 'admin_verified'],
      default: 'community',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,

    // Moderation
    isActive: { type: Boolean, default: true },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

noteSchema.index({ title: 'text', description: 'text', subject: 'text', tags: 'text' });
noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ subject: 1, semester: 1, branch: 1 });
noteSchema.index({ verificationStatus: 1, likesCount: -1 });

module.exports = mongoose.model('Note', noteSchema);
