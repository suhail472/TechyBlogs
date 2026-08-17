import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      maxlength: 150,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: 3000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    isEditorial: {
      type: Boolean,
      default: false,
    },
    editorialBadge: {
      type: String,
      default: '',
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'spam', 'deleted'],
      default: 'pending',
      index: true,
    },
    reports: [
      {
        reason: { type: String, required: true },
        reporterHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false },
      },
    ],
    reportCount: {
      type: Number,
      default: 0,
      index: true,
    },
    spamScore: {
      type: Number,
      default: 0,
    },
    spamReasons: {
      type: [String],
      default: [],
    },
    moderationHistory: [
      {
        action: { type: String, required: true },
        moderator: {
          id: String,
          name: String,
          role: String,
        },
        timestamp: { type: Date, default: Date.now },
        previousStatus: String,
        newStatus: String,
        note: String,
      },
    ],
    moderatorNotes: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    ipHash: {
      type: String,
      select: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed queue sorting and filtering
commentSchema.index({ status: 1, reportCount: -1, createdAt: -1 });
commentSchema.index({ slug: 1, status: 1, isPinned: -1, timestamp: 1 });

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
