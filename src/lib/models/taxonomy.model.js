import mongoose from 'mongoose';

// One hierarchical domain keeps sections, editions, locations and topics distinct
// without proliferating fragile, one-off models.
const taxonomySchema = new mongoose.Schema({
  kind: {
    type: String,
    required: true,
    enum: ['section', 'edition', 'location', 'topic', 'tag', 'hub', 'series', 'collection'],
    index: true,
  },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, default: '', maxlength: 500 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy', default: null },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 },
  visibleInNavigation: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    indexable: { type: Boolean, default: true },
  },
  // Hubs and collections can keep their intentional, editor-owned feed rules here.
  rules: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

taxonomySchema.index({ kind: 1, slug: 1 }, { unique: true });
taxonomySchema.index({ parent: 1, order: 1 });

const Taxonomy = mongoose.models.Taxonomy || mongoose.model('Taxonomy', taxonomySchema);
export default Taxonomy;
