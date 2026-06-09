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
    author: {
      type: String,
      required: [true, 'Author name is required'],
      default: 'Suheel Hilal',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
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
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ categories: 1 });
postSchema.index({ tags: 1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;