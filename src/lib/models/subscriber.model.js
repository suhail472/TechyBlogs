import mongoose from 'mongoose';
import crypto from 'crypto';
import './post.model.js';

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/, 'Please fill a valid email address'],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'unsubscribed', 'suppressed', 'bounced', 'complained'],
      default: 'active',
      index: true,
    },
    verified: {
      type: Boolean,
      default: true,
      index: true,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationExpires: {
      type: Date,
      select: false,
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    preferences: {
      edition: {
        type: String,
        enum: ['global', 'india', 'kashmir'],
        default: 'global',
        index: true,
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'breaking'],
        default: 'daily',
      },
      topics: {
        type: [String],
        default: [],
        index: true,
      },
      regions: {
        type: [String],
        default: [],
        index: true,
      },
    },
    source: {
      type: String,
      enum: ['homepage', 'article', 'footer', 'kashmir_hub', 'newsletter_modal', 'import', 'api'],
      default: 'homepage',
      index: true,
    },
    sourceArticle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    engagementScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      index: true,
    },
    lastEngagedAt: {
      type: Date,
      default: Date.now,
    },
    campaignStats: {
      sentCount: { type: Number, default: 0 },
      openCount: { type: Number, default: 0 },
      clickCount: { type: Number, default: 0 },
      lastSentAt: Date,
    },
    suppressionReason: {
      type: String,
      default: '',
    },
    suppressedAt: Date,
    unsubscribedAt: Date,
    auditLog: [
      {
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        actor: { type: String, default: 'system' },
        note: String,
      },
    ],
    ipHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unsubscribe token automatically before saving if not present
subscriberSchema.pre('save', function () {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(24).toString('hex');
  }
});

// Indexes for high-speed audience queries
subscriberSchema.index({ status: 1, 'preferences.edition': 1 });
subscriberSchema.index({ status: 1, engagementScore: -1 });
subscriberSchema.index({ createdAt: 1 });

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

export default Subscriber;
