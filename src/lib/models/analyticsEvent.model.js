import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    eventType: {
      type: String,
      enum: ['pageview', 'read_complete', 'scroll_depth', 'bookmark', 'share'],
      required: true,
      index: true,
    },
    scrollPercent: {
      type: Number,
      default: 0,
    },
    readTimeSeconds: {
      type: Number,
      default: 0,
    },
    device: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      default: 'desktop',
      index: true,
    },
    source: {
      type: String,
      enum: ['search', 'direct', 'social', 'newsletter', 'referral'],
      default: 'direct',
      index: true,
    },
    utmSource: {
      type: String,
      default: '',
    },
    utmMedium: {
      type: String,
      default: '',
    },
    utmCampaign: {
      type: String,
      default: '',
    },
    sessionHash: {
      type: String,
      select: false,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
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

// Compound indexes for high-speed time-series analytics
analyticsEventSchema.index({ date: 1, eventType: 1 });
analyticsEventSchema.index({ postId: 1, eventType: 1, date: 1 });

const AnalyticsEvent =
  mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent;
