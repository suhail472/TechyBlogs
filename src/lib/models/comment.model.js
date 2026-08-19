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
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
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
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
    ],
    dislikesCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'spam', 'deleted'],
      default: 'pending',
      index: true,
    },
    autoApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedAt: {
      type: Date,
      default: null,
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
    aiModeration: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'skipped'],
        default: 'pending',
        index: true,
      },
      classification: {
        type: String,
        enum: ['safe', 'review', 'abusive', 'severe', 'unclassified'],
        default: 'unclassified',
        index: true,
      },
      severity: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
      },
      categories: {
        type: [String],
        default: [],
      },
      targetType: {
        type: String,
        enum: ['none', 'individual', 'protected_group', 'institution', 'idea_doctrine'],
        default: 'none',
      },
      targetCategory: {
        type: String,
        default: null,
      },
      isThreat: {
        type: Boolean,
        default: false,
      },
      isDehumanizing: {
        type: Boolean,
        default: false,
      },
      isQuotedContent: {
        type: Boolean,
        default: false,
      },
      isCondemnation: {
        type: Boolean,
        default: false,
      },
      recommendedAction: {
        type: String,
        enum: ['allow', 'review', 'hold'],
        default: 'allow',
      },
      reason: {
        type: String,
        maxlength: 1000,
        default: '',
      },
      evidence: {
        type: [String],
        default: [],
      },
      model: {
        type: String,
        default: '',
      },
      modelVersion: {
        type: String,
        default: '1.0',
      },
      analyzedAt: Date,
      contentHash: String,
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
        aiRecommendation: String,
        aiConfidence: Number,
        moderatorOverride: {
          type: Boolean,
          default: false,
        },
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
commentSchema.index({ 'aiModeration.classification': 1, 'aiModeration.severity': -1, createdAt: -1 });

// Delete mongoose cached model to ensure clean re-registration
if (mongoose.models && mongoose.models.Comment) {
  delete mongoose.models.Comment;
}

const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
