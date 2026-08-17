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

    // -------------------------------------------------------------
    // Multi-Dimensional Taxonomy Classification
    // -------------------------------------------------------------
    contentType: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'article',
      index: true,
    },
    primaryTopic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      index: true,
    },
    topics: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
      },
    ],
    primaryRegion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      index: true,
    },
    regions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    entities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Taxonomy',
      },
    ],
    language: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'en',
      index: true,
    },
    translationGroupId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },

    // -------------------------------------------------------------
    // Editorial Series & Ongoing Coverage Dossiers
    // -------------------------------------------------------------
    series: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      index: true,
    },
    seriesOrder: {
      type: Number,
      default: 1,
    },
    coverage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      index: true,
    },
    sources: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, default: 'official' },
        accessedAt: { type: Date, default: Date.now },
      },
    ],

    // -------------------------------------------------------------
    // Editorial Contextual Metadata (News / Tutorial / Review)
    // -------------------------------------------------------------
    editorial: {
      breaking: { type: Boolean, default: false, index: true },
      locationName: { type: String, default: '' },
      correction: {
        hasCorrection: { type: Boolean, default: false },
        note: { type: String, default: '' },
        correctedAt: { type: Date },
      },
    },
    reviewData: {
      rating: { type: Number, min: 0, max: 5, default: null },
      pros: { type: [String], default: [] },
      cons: { type: [String], default: [] },
      entityName: { type: String, default: '' },
    },
    tutorialData: {
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all-levels'], default: 'intermediate' },
      prerequisites: { type: [String], default: [] },
      technologies: { type: [String], default: [] },
    },

    // -------------------------------------------------------------
    // Legacy Taxonomy References (Preserved for 100% Parity)
    // -------------------------------------------------------------
    categories: {
      type: [String],
      required: [true, 'At least one category is required'],
      default: ['General'],
    },
    primarySection: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' },
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    editions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
    contentMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // -------------------------------------------------------------
    // Authorship & Workflow
    // -------------------------------------------------------------
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
      index: true,
    },
    scheduledAt: { type: Date, index: true },
    deadline: { type: Date, index: true },
    embargoAt: { type: Date, index: true },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    assignedEditor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    publishedTimezone: { type: String, default: 'UTC' },
    submittedAt: Date,
    approvedAt: Date,
    archivedAt: Date,
    editorialNotes: { type: String, maxlength: 2000, default: '' },
    editorialHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // -------------------------------------------------------------
    // Engagement & Ranking Metrics
    // -------------------------------------------------------------
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
      index: true,
    },

    // -------------------------------------------------------------
    // Interactive Content & SEO
    // -------------------------------------------------------------
    faqs: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true },
          order: { type: Number, default: 0 },
        },
      ],
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
      title: { type: String, maxlength: 100, default: '' },
      description: { type: String, maxlength: 300, default: '' },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String, default: '' },
      socialTitle: { type: String, default: '' },
      socialDescription: { type: String, default: '' },
      socialImage: { type: String, default: '' },
      twitterTitle: { type: String, default: '' },
      twitterDescription: { type: String, default: '' },
      twitterImage: { type: String, default: '' },
      robots: {
        index: { type: Boolean, default: true },
        follow: { type: Boolean, default: true },
      },
      indexable: { type: Boolean, default: true },
    },

    // -------------------------------------------------------------
    // Version History / Revisions
    // -------------------------------------------------------------
    revisions: {
      type: [
        {
          version: { type: Number, required: true },
          title: { type: String, required: true },
          excerpt: { type: String, default: '' },
          content: { type: String, required: true },
          changedBy: { type: mongoose.Schema.Types.Mixed },
          changeSummary: { type: String, default: '' },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// High-Performance Query Indexes
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ contentType: 1, status: 1, publishedAt: -1 });
postSchema.index({ primaryTopic: 1, status: 1, publishedAt: -1 });
postSchema.index({ primaryRegion: 1, status: 1, publishedAt: -1 });
postSchema.index({ topics: 1, status: 1, publishedAt: -1 });
postSchema.index({ regions: 1, status: 1, publishedAt: -1 });
postSchema.index({ series: 1, seriesOrder: 1 });
postSchema.index({ coverage: 1, status: 1, publishedAt: -1 });
postSchema.index({ language: 1, status: 1, publishedAt: -1 });
postSchema.index({ featured: 1, status: 1, publishedAt: -1 });
postSchema.index({ 'editorial.breaking': 1, status: 1, publishedAt: -1 });
postSchema.index({ categories: 1, status: 1, publishedAt: -1 });
postSchema.index({ tags: 1, status: 1, publishedAt: -1 });
postSchema.index(
  { title: 'text', excerpt: 'text', tags: 'text' },
  { name: 'content_search', language_override: 'text_language', default_language: 'none' }
);

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);
export default Post;