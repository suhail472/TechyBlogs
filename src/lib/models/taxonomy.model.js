import mongoose from 'mongoose';

/**
 * Unified Hierarchical Taxonomy Schema
 * Classifies topics, regions, content types, entities, series, coverage, tags, and hubs.
 */
const taxonomySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      required: true,
      enum: [
        'topic',
        'region',
        'content_type',
        'tag',
        'entity',
        'series',
        'coverage',
        'section',
        'edition',
        'location',
        'hub',
        'collection',
      ],
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    // Hierarchical parent reference
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taxonomy',
      default: null,
      index: true,
    },
    // Materialized ancestor path for O(1) breadcrumbs and subtree lookups
    ancestors: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        kind: { type: String, required: true },
      },
    ],
    // Sub-type classification (e.g. region types, entity types)
    type: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'general',
    },
    // Regional hub flag for dedicated editorial landing portals (e.g. /kashmir)
    isHub: {
      type: Boolean,
      default: false,
      index: true,
    },
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    // Content-Type capabilities descriptor
    capabilities: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Entity / Tag aliases
    aliases: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    visibleInNavigation: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    seo: {
      title: { type: String, default: '', maxlength: 120 },
      description: { type: String, default: '', maxlength: 250 },
      indexable: { type: Boolean, default: true },
    },
    // Custom curated editorial rules for hubs/collections
    rules: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for taxonomy queries
taxonomySchema.index({ kind: 1, slug: 1 }, { unique: true });
taxonomySchema.index({ kind: 1, active: 1, order: 1 });
taxonomySchema.index({ parent: 1, order: 1 });
taxonomySchema.index({ 'ancestors._id': 1 });
taxonomySchema.index({ kind: 1, isHub: 1, active: 1 });

const Taxonomy = mongoose.models.Taxonomy || mongoose.model('Taxonomy', taxonomySchema);
export default Taxonomy;
