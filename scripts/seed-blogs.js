import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables manually from .env.local if present
let MONGODB_URI = 'mongodb://localhost:27017/techyblogs';
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.+)/);
    if (match && match[1]) {
      MONGODB_URI = match[1].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch (e) {
  // Ignore and use default
}

// Schemas
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

async function seed() {
  try {
    console.log('Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected successfully!');

    // 1. Seed Taxonomy Sections
    console.log('Seeding taxonomy...');
    const sectionsData = [
      { kind: 'section', name: 'Technology', slug: 'technology', description: 'Computing, software architecture, web engineering, and AI.', order: 1, visibleInNavigation: true },
      { kind: 'section', name: 'News', slug: 'news', description: 'Breaking national, global, and regional reporting.', order: 2, visibleInNavigation: true },
      { kind: 'section', name: 'Education', slug: 'education', description: 'Academic admissions, universities, exam guides, and scholarship notifications.', order: 3, visibleInNavigation: true },
      { kind: 'section', name: 'Business', slug: 'business', description: 'Markets, startups, economy, entrepreneurship, and career opportunities.', order: 4, visibleInNavigation: true },
      { kind: 'section', name: 'Travel & Culture', slug: 'travel', description: 'Destinations, heritage, regional tourism, and cultural guides.', order: 5, visibleInNavigation: true },
      { kind: 'section', name: 'Lifestyle', slug: 'lifestyle', description: 'Living, health, productivity, and modern lifestyle analysis.', order: 6, visibleInNavigation: true },
      { kind: 'section', name: 'Science', slug: 'science', description: 'Space exploration, quantum computing, and climate research.', order: 7, visibleInNavigation: true },
    ];

    const editionsData = [
      { kind: 'edition', name: 'Global Edition', slug: 'global', description: 'Worldwide technology and editorial coverage.', order: 1, visibleInNavigation: true },
      { kind: 'edition', name: 'Kashmir Edition', slug: 'kashmir', description: 'Local reporting, education, culture, tourism, and business in Jammu & Kashmir.', order: 2, visibleInNavigation: true },
      { kind: 'edition', name: 'India Edition', slug: 'india', description: 'National reporting, education policies, and tech startups across India.', order: 3, visibleInNavigation: true },
    ];

    const topicsData = [
      { kind: 'topic', name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'LLMs, AI agents, machine learning, and automation.' },
      { kind: 'topic', name: 'Kashmir Tourism', slug: 'kashmir-tourism', description: 'Travel guides and seasonal highlights for Kashmir valley.' },
      { kind: 'topic', name: 'University Admissions', slug: 'university-admissions', description: 'Higher education notices and admission entrance tests.' },
      { kind: 'topic', name: 'Next.js & React', slug: 'nextjs-react', description: 'Modern frontend engineering and full-stack development.' },
      { kind: 'topic', name: 'Startups & Business', slug: 'startups', description: 'Venture capital, SaaS, and business execution.' },
      { kind: 'topic', name: 'Backend Engineering', slug: 'backend-engineering', description: 'Rust, Go, microservices, and databases.' },
      { kind: 'topic', name: 'Cloud Infrastructure', slug: 'cloud-infrastructure', description: 'Edge computing, serverless, and cloud platforms.' },
    ];

    await Taxonomy.deleteMany({});
    const createdTaxonomies = await Taxonomy.insertMany([...sectionsData, ...editionsData, ...topicsData]);
    console.log(`Seeded ${createdTaxonomies.length} taxonomy entities.`);

    const techSec = createdTaxonomies.find(t => t.slug === 'technology');
    const newsSec = createdTaxonomies.find(t => t.slug === 'news');
    const eduSec = createdTaxonomies.find(t => t.slug === 'education');
    const bizSec = createdTaxonomies.find(t => t.slug === 'business');
    const travelSec = createdTaxonomies.find(t => t.slug === 'travel');
    const lifestyleSec = createdTaxonomies.find(t => t.slug === 'lifestyle');

    const kashmirEd = createdTaxonomies.find(t => t.slug === 'kashmir');
    const globalEd = createdTaxonomies.find(t => t.slug === 'global');
    const indiaEd = createdTaxonomies.find(t => t.slug === 'india');

    const aiTopic = createdTaxonomies.find(t => t.slug === 'artificial-intelligence');
    const tourismTopic = createdTaxonomies.find(t => t.slug === 'kashmir-tourism');
    const admTopic = createdTaxonomies.find(t => t.slug === 'university-admissions');
    const nextTopic = createdTaxonomies.find(t => t.slug === 'nextjs-react');
    const startupTopic = createdTaxonomies.find(t => t.slug === 'startups');
    const backendTopic = createdTaxonomies.find(t => t.slug === 'backend-engineering');
    const cloudTopic = createdTaxonomies.find(t => t.slug === 'cloud-infrastructure');

    // 2. Seed Authors
    console.log('Seeding authors...');
    const authorsData = [
      {
        name: 'Suheel Hilal',
        email: 'suheel@techyblogs.com',
        role: 'Editor-in-Chief & Principal Architect',
        username: 'suheel',
        slug: 'suheel-hilal',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Principal Software Architect and Lead Editor at TechyBlogs. Specializes in distributed systems, Next.js, and web standards.',
        expertise: ['Next.js 15', 'React Server Components', 'Distributed Systems', 'Cloud Architecture'],
        website: 'https://techyblogs.com/about',
      },
      {
        name: 'Zehra Mir',
        email: 'zehra@techyblogs.com',
        role: 'Senior Regional Correspondent',
        username: 'zehra',
        slug: 'zehra-mir',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Senior Regional Correspondent covering Jammu & Kashmir education, regional development, and cultural heritage.',
        expertise: ['Higher Education', 'Kashmir Affairs', 'Policy Analysis', 'Cultural Heritage'],
        website: 'https://techyblogs.com/about',
      },
      {
        name: 'Aarav Sharma',
        email: 'aarav@techyblogs.com',
        role: 'Hardware & Tech Reviewer',
        username: 'aarav',
        slug: 'aarav-sharma',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Hardware and Consumer Technology reviewer with a decade of benchmarking experience across laptops, phones, and silicon.',
        expertise: ['Apple Silicon', 'Hardware Benchmarks', 'Product Reviews', 'Developer Workflows'],
        website: 'https://techyblogs.com/about',
      },
      {
        name: 'Priya Narang',
        email: 'priya@techyblogs.com',
        role: 'Financial & Startup Analyst',
        username: 'priya',
        slug: 'priya-narang',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Financial markets and venture capital analyst tracking deeptech, AI infrastructure, and macroeconomic trends.',
        expertise: ['Venture Capital', 'DeepTech', 'Indian Economy', 'Micro-SaaS'],
        website: 'https://techyblogs.com/about',
      },
      {
        name: 'Dr. Tariq Lone',
        email: 'tariq@techyblogs.com',
        role: 'Academician & Alpine Guide',
        username: 'tariqlone',
        slug: 'dr-tariq-lone',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Education researcher, mountaineer, and certified ski guide documenting Himalayan biodiversity and entrance preparation.',
        expertise: ['GATE / Academic Strategy', 'Alpine Expeditions', 'Himalayan Ecology', 'Adventure Sports'],
        website: 'https://techyblogs.com/about',
      },
    ];

    await Admin.deleteMany({});
    const createdAuthors = await Admin.insertMany(authorsData);
    console.log(`Seeded ${createdAuthors.length} editorial team members.`);

    const authorSuheel = createdAuthors[0];
    const authorZehra = createdAuthors[1];
    const authorAarav = createdAuthors[2];
    const authorPriya = createdAuthors[3];
    const authorTariq = createdAuthors[4];

    // Import rich stories from defaultStories
    const { DEFAULT_STORIES } = await import('../src/data/defaultStories.js');

    const authorMap = {
      'Suheel Hilal': authorSuheel,
      'Zehra Mir': authorZehra,
      'Aarav Sharma': authorAarav,
      'Priya Narang': authorPriya,
      'Dr. Tariq Lone': authorTariq,
    };

    const sectionMap = {
      'Technology': techSec?._id,
      'News': newsSec?._id,
      'Education': eduSec?._id,
      'Business': bizSec?._id,
      'Travel & Culture': travelSec?._id,
      'Lifestyle': lifestyleSec?._id,
    };

    const editionMap = {
      'global': globalEd?._id,
      'kashmir': kashmirEd?._id,
      'india': indiaEd?._id,
    };

    const postsToInsert = DEFAULT_STORIES.map(s => {
      const auth = authorMap[s.author] || authorSuheel;
      const secId = sectionMap[s.primarySection?.name] || techSec?._id;
      const edIds = (s.editions || []).map(e => editionMap[e.slug]).filter(Boolean);

      return {
        title: s.title,
        subtitle: s.subtitle,
        slug: s.slug,
        excerpt: s.excerpt,
        content: s.content,
        image: s.image,
        contentType: s.contentType || 'article',
        primarySection: secId,
        sections: [secId],
        editions: edIds,
        topics: s.topics ? [aiTopic?._id] : [],
        primaryAuthor: auth._id,
        author: auth.name,
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
      };
    });

    await Post.deleteMany({});
    const createdPosts = await Post.insertMany(postsToInsert);
    console.log(`Seeded ${createdPosts.length} rich articles successfully!`);

    console.log('\n--- SEED SUMMARY ---');
    console.log(`Taxonomies: ${createdTaxonomies.length}`);
    console.log(`Authors: ${createdAuthors.length}`);
    console.log(`Articles: ${createdPosts.length}`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
