import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    subtitle: { type: String, trim: true, maxlength: 300, default: '' },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    image: {
      type: String,
      required: [true, 'Featured image is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    categories: {
      type: [String],
      required: [true, 'At least one category is required'],
    },
    // Legacy categories remain intact while editorial taxonomy grows independently.
    primarySection: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    editions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    series: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' },
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    contentType: { type: String, trim: true, lowercase: true, default: 'article', index: true },
    contentMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      default: 'Suheel Hilal',
    },
    primaryAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    authors: { type: [mongoose.Schema.Types.Mixed], default: [] },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'scheduled', 'published', 'updated', 'rejected', 'archived'],
      default: 'draft',
    },
    scheduledAt: Date,
    publishedTimezone: { type: String, default: 'UTC' },
    submittedAt: Date,
    approvedAt: Date,
    archivedAt: Date,
    editorialNotes: { type: String, maxlength: 2000, default: '' },
    editorialHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    featured: { type: Boolean, default: false, index: true },
    breaking: { type: Boolean, default: false, index: true },
    trendingScore: { type: Number, default: 0, index: true },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    faqs: {
      type: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
      }],
      default: [],
    },
    metaDescription: {
      type: String,
      default: '',
    },
    keywords: {
      type: String,
      default: '',
    },
    seo: {
      title: { type: String, maxlength: 70, default: '' },
      description: { type: String, maxlength: 180, default: '' },
      canonicalUrl: { type: String, default: '' },
      socialTitle: { type: String, default: '' },
      socialDescription: { type: String, default: '' },
      socialImage: { type: String, default: '' },
      indexable: { type: Boolean, default: true },
    },
    source: { type: mongoose.Schema.Types.Mixed, default: {} },
    correction: { type: mongoose.Schema.Types.Mixed, default: {} },
    editorNote: { type: String, maxlength: 1000, default: '' },
    revisions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ categories: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ status: 1, scheduledAt: 1 });
postSchema.index({ contentType: 1, status: 1, publishedAt: -1 });
postSchema.index({ featured: 1, breaking: 1, publishedAt: -1 });
postSchema.index({ title: 'text', excerpt: 'text', tags: 'text' }, { name: 'content_search' });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;