import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      maxlength: 150,
    },
    subject: {
      type: String,
      required: [true, 'Email subject line is required'],
      trim: true,
      maxlength: 200,
    },
    previewText: {
      type: String,
      trim: true,
      maxlength: 250,
      default: '',
    },
    template: {
      type: String,
      enum: ['morning_brief', 'weekly_digest', 'breaking_alert', 'technology_brief', 'kashmir_edition', 'custom'],
      default: 'morning_brief',
    },
    edition: {
      type: String,
      enum: ['global', 'india', 'kashmir'],
      default: 'global',
      index: true,
    },
    fromName: {
      type: String,
      default: 'TechyBlogs Editorial',
      maxlength: 100,
    },
    fromEmail: {
      type: String,
      default: 'editorial@techyblogs.com',
      maxlength: 100,
    },
    replyTo: {
      type: String,
      default: 'newsroom@techyblogs.com',
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed'],
      default: 'draft',
      index: true,
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    sentAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    targetAudience: {
      segment: { type: String, default: 'all_active' },
      edition: { type: String, default: 'all' },
      topics: { type: [String], default: [] },
      regions: { type: [String], default: [] },
      minEngagementScore: { type: Number, default: 0 },
      createdAfter: Date,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    suppressedCount: {
      type: Number,
      default: 0,
    },
    content: {
      intro: { type: String, default: '' },
      closing: { type: String, default: '' },
      featuredStories: [
        {
          post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
          headline: { type: String, required: true },
          excerpt: String,
          desk: String,
          image: String,
          url: String,
        },
      ],
      htmlBody: { type: String, default: '' },
    },
    analytics: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      unsubscribed: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
      complained: { type: Number, default: 0 },
    },
    auditLog: [
      {
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        performedBy: { type: String, default: 'editor' },
        details: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ status: 1, scheduledAt: 1 });
campaignSchema.index({ createdAt: -1 });

const NewsletterCampaign =
  mongoose.models.NewsletterCampaign || mongoose.model('NewsletterCampaign', campaignSchema);

export default NewsletterCampaign;
