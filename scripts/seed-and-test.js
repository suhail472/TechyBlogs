import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const taxonomySchema = new mongoose.Schema({
  kind: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  visibleInNavigation: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  seo: { title: String, description: String, indexable: Boolean },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: 'author' },
  username: String,
  slug: String,
  avatar: String,
  bio: String,
  expertise: [String],
  website: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  contentType: { type: String, default: 'article' },
  primarySection: { type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
  editions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Taxonomy' }],
  primaryAuthor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  author: { type: String, default: 'Suheel Hilal' },
  categories: [String],
  tags: [String],
  status: { type: String, default: 'published' },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  breaking: { type: Boolean, default: false },
  trendingScore: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now },
  faqs: [{ question: String, answer: String }],
  contentMetadata: mongoose.Schema.Types.Mixed,
  source: mongoose.Schema.Types.Mixed,
  editorNote: String,
  seo: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const Taxonomy = mongoose.models.Taxonomy || mongoose.model('Taxonomy', taxonomySchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

async function main() {
  console.log('--- STARTING IN-MEMORY LOCAL DATABASE & TEST SEED SUITE ---');
  const mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'techyblogs',
    },
    spawn: {
      timeout: 60000,
    },
  });
  const uri = mongod.getUri();
  console.log('MongoDB Memory Server running at:', uri);

  await mongoose.connect(uri);
  console.log('Connected to local in-memory MongoDB!');

  const { DEFAULT_AUTHORS, DEFAULT_STORIES } = await import('../src/data/defaultStories.js');

  console.log('Seeding Taxonomies...');
  const sectionsData = [
    { kind: 'section', name: 'Technology', slug: 'technology', description: 'Computing, software architecture, web engineering, and AI.', order: 1 },
    { kind: 'section', name: 'News', slug: 'news', description: 'Breaking national, global, and regional reporting.', order: 2 },
    { kind: 'section', name: 'Education', slug: 'education', description: 'Academic admissions, universities, exam guides, and scholarship notifications.', order: 3 },
    { kind: 'section', name: 'Business', slug: 'business', description: 'Markets, startups, economy, entrepreneurship, and career opportunities.', order: 4 },
    { kind: 'section', name: 'Travel & Culture', slug: 'travel', description: 'Destinations, heritage, regional tourism, and cultural guides.', order: 5 },
    { kind: 'section', name: 'Lifestyle', slug: 'lifestyle', description: 'Living, health, productivity, and modern lifestyle analysis.', order: 6 },
    { kind: 'section', name: 'Science', slug: 'science', description: 'Space exploration, quantum computing, and climate research.', order: 7 },
  ];

  const editionsData = [
    { kind: 'edition', name: 'Global Edition', slug: 'global', description: 'Worldwide technology and editorial coverage.', order: 1 },
    { kind: 'edition', name: 'Kashmir Edition', slug: 'kashmir', description: 'Local reporting, education, culture, tourism, and business in Jammu & Kashmir.', order: 2 },
    { kind: 'edition', name: 'India Edition', slug: 'india', description: 'National reporting, education policies, and tech startups across India.', order: 3 },
  ];

  const topicsData = [
    { kind: 'topic', name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'LLMs, AI agents, machine learning, and automation.' },
    { kind: 'topic', name: 'Kashmir Tourism', slug: 'kashmir-tourism', description: 'Travel guides and seasonal highlights for Kashmir valley.' },
    { kind: 'topic', name: 'University Admissions', slug: 'university-admissions', description: 'Higher education notices and admission entrance tests.' },
    { kind: 'topic', name: 'Next.js & React', slug: 'nextjs-react', description: 'Modern frontend engineering and full-stack development.' },
  ];

  const createdTaxonomies = await Taxonomy.insertMany([...sectionsData, ...editionsData, ...topicsData]);
  console.log(`Seeded ${createdTaxonomies.length} taxonomy entries.`);

  console.log('Seeding Authors...');
  const createdAuthors = await Admin.insertMany(DEFAULT_AUTHORS.map(a => ({
    name: a.name,
    email: a.email,
    role: a.role,
    username: a.username,
    slug: a.slug,
    avatar: a.avatar,
    bio: a.bio,
    expertise: a.expertise,
    website: a.website,
    isActive: true,
  })));
  console.log(`Seeded ${createdAuthors.length} editorial team members.`);

  console.log('Seeding 18 Articles...');
  const techSec = createdTaxonomies.find(t => t.slug === 'technology');
  const author1 = createdAuthors[0];

  const createdPosts = await Post.insertMany(DEFAULT_STORIES.map(s => ({
    title: s.title,
    subtitle: s.subtitle,
    slug: s.slug,
    excerpt: s.excerpt,
    content: s.content,
    image: s.image,
    contentType: s.contentType || 'article',
    primarySection: techSec._id,
    sections: [techSec._id],
    editions: [],
    primaryAuthor: author1._id,
    author: s.author || author1.name,
    categories: s.categories,
    tags: s.tags,
    status: 'published',
    featured: s.featured || false,
    breaking: s.breaking || false,
    views: s.views || 1000,
    likes: s.likes || 100,
    trendingScore: s.trendingScore || 50,
    publishedAt: new Date(s.publishedAt || Date.now()),
    faqs: s.faqs || [],
  })));
  console.log(`Seeded ${createdPosts.length} articles.`);

  console.log('\n--- VERIFICATION TEST ---');
  const count = await Post.countDocuments({ status: 'published' });
  console.log(`Total Published Articles in DB: ${count}`);

  await mongod.stop();
  console.log('Memory database stopped successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
