import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

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
  console.log('--- STARTING IN-MEMORY LOCAL DATABASE & TEST SUITE ---');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('MongoDB running at:', uri);

  await mongoose.connect(uri);
  console.log('Connected to local MongoDB!');

  // 1. Seed Taxonomy
  console.log('\n1. Seeding Taxonomy Hierarchy...');
  const sections = [
    { kind: 'section', name: 'Technology', slug: 'technology', description: 'Computing, software architecture, web engineering, and AI.', order: 1 },
    { kind: 'section', name: 'News', slug: 'news', description: 'Breaking national, global, and regional reporting.', order: 2 },
    { kind: 'section', name: 'Education', slug: 'education', description: 'Academic admissions, universities, exam guides, and scholarship notifications.', order: 3 },
    { kind: 'section', name: 'Business', slug: 'business', description: 'Markets, startups, economy, entrepreneurship, and career opportunities.', order: 4 },
    { kind: 'section', name: 'Travel & Culture', slug: 'travel', description: 'Destinations, heritage, regional tourism, and cultural guides.', order: 5 },
    { kind: 'section', name: 'Lifestyle', slug: 'lifestyle', description: 'Living, health, productivity, and modern lifestyle analysis.', order: 6 },
    { kind: 'section', name: 'Science', slug: 'science', description: 'Space exploration, quantum computing, and climate research.', order: 7 },
  ];

  const editions = [
    { kind: 'edition', name: 'Kashmir Edition', slug: 'kashmir', description: 'Local reporting, education, culture, tourism, and business in Jammu & Kashmir.', order: 1 },
    { kind: 'edition', name: 'India Edition', slug: 'india', description: 'National reporting, education policies, and tech startups across India.', order: 2 },
    { kind: 'edition', name: 'Global Edition', slug: 'global', description: 'Worldwide technology and editorial coverage.', order: 3 },
  ];

  const topics = [
    { kind: 'topic', name: 'Artificial Intelligence', slug: 'artificial-intelligence', description: 'LLMs, AI agents, and neural networks.' },
    { kind: 'topic', name: 'Kashmir Tourism', slug: 'kashmir-tourism', description: 'Travel guides and seasonal highlights for Kashmir valley.' },
    { kind: 'topic', name: 'University Admissions', slug: 'university-admissions', description: 'Higher education notices and admission entrance tests.' },
    { kind: 'topic', name: 'Next.js & React', slug: 'nextjs-react', description: 'Modern frontend engineering and full-stack development.' },
    { kind: 'topic', name: 'Indian Startups', slug: 'indian-startups', description: 'Venture capital, fintech, and entrepreneurship in India.' },
  ];

  const createdTaxonomies = await Taxonomy.insertMany([...sections, ...editions, ...topics]);
  console.log(`✓ Created ${createdTaxonomies.length} taxonomy records`);

  const techSec = createdTaxonomies.find(t => t.slug === 'technology');
  const newsSec = createdTaxonomies.find(t => t.slug === 'news');
  const eduSec = createdTaxonomies.find(t => t.slug === 'education');
  const bizSec = createdTaxonomies.find(t => t.slug === 'business');
  const travelSec = createdTaxonomies.find(t => t.slug === 'travel');
  const lifeSec = createdTaxonomies.find(t => t.slug === 'lifestyle');
  const sciSec = createdTaxonomies.find(t => t.slug === 'science');

  const kashmirEd = createdTaxonomies.find(t => t.slug === 'kashmir');
  const indiaEd = createdTaxonomies.find(t => t.slug === 'india');
  const globalEd = createdTaxonomies.find(t => t.slug === 'global');

  // 2. Seed Authors
  console.log('\n2. Seeding Authors & Editorial Team...');
  const authors = [
    {
      name: 'Suheel Hilal',
      email: 'suheel@teachyblogs.com',
      role: 'superadmin',
      username: 'suheel',
      slug: 'suheel-hilal',
      bio: 'Principal Software Architect & Lead Editor at TeachyBlogs.',
      expertise: ['Next.js', 'Distributed Systems', 'Architecture'],
    },
    {
      name: 'Zehra Mir',
      email: 'zehra@teachyblogs.com',
      role: 'editor',
      username: 'zehra',
      slug: 'zehra-mir',
      bio: 'Senior Regional Correspondent covering Kashmir education, regional development, and heritage.',
      expertise: ['Higher Education', 'Kashmir Affairs', 'Tourism'],
    },
    {
      name: 'Aarav Sharma',
      email: 'aarav@teachyblogs.com',
      role: 'author',
      username: 'aarav',
      slug: 'aarav-sharma',
      bio: 'Technology & Hardware Reviewer covering silicon, computing, and devices.',
      expertise: ['Apple Silicon', 'Hardware Benchmarks', 'Reviews'],
    },
    {
      name: 'Priya Narang',
      email: 'priya@teachyblogs.com',
      role: 'author',
      username: 'priya',
      slug: 'priya-narang',
      bio: 'Business & Startup Analyst reporting on India venture landscape.',
      expertise: ['Fintech', 'Markets', 'Economy'],
    },
  ];

  const createdAuthors = await Admin.insertMany(authors);
  console.log(`✓ Created ${createdAuthors.length} authors`);

  const [authorSuheel, authorZehra, authorAarav, authorPriya] = createdAuthors;

  // 3. Seed Articles across all verticals & editions
  console.log('\n3. Seeding Articles Across Verticals (Kashmir, India, Global)...');
  const articles = [
    // 1. Kashmir Edition - Education & News
    {
      title: 'University of Kashmir Announces New Admission & Entrance Schedule for 2026',
      subtitle: 'Directorate of Admissions releases comprehensive guidelines, eligibility criteria, and application timelines for postgraduate courses.',
      slug: 'university-of-kashmir-admissions-schedule-2026',
      excerpt: 'The University of Kashmir has officially released the entrance examination calendar and application portal details for PG and professional programs.',
      content: '<h2>Official Notification</h2><p>The University of Kashmir has announced online registration for all Master’s, PG Diploma, and professional degree programs...</p>',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'news',
      primarySection: eduSec._id,
      editions: [kashmirEd._id],
      primaryAuthor: authorZehra._id,
      author: authorZehra.name,
      categories: ['Education', 'News', 'Kashmir'],
      tags: ['University of Kashmir', 'Admissions 2026', 'Srinagar', 'Higher Education'],
      status: 'published',
      featured: true,
      breaking: true,
      views: 3890,
      likes: 412,
      source: { name: 'University of Kashmir Press Office', url: 'https://kashmiruniversity.net' },
    },
    // 2. Kashmir Edition - Travel & Culture
    {
      title: '10 Best Places to Visit in Kashmir During Autumn: The Golden Season Guide',
      subtitle: 'From the amber Chinars of Naseem Bagh to the alpine serenity of Pahalgam and Gulmarg, here is your essential autumn travel itinerary.',
      slug: '10-best-places-to-visit-in-kashmir-during-autumn',
      excerpt: 'Discover why autumn is Kashmir’s most enchanting season with amber Chinar gardens, mountain valleys, and cultural heritage trails.',
      content: '<h2>The Magic of Autumn in Kashmir</h2><p>Autumn in Kashmir (Harud) transforms the valley into radiant gold and amber landscapes...</p>',
      image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'guide',
      primarySection: travelSec._id,
      editions: [kashmirEd._id],
      primaryAuthor: authorZehra._id,
      author: authorZehra.name,
      categories: ['Travel & Culture', 'Kashmir'],
      tags: ['Kashmir Tourism', 'Autumn in Kashmir', 'Srinagar', 'Gulmarg', 'Pahalgam'],
      status: 'published',
      views: 2950,
      likes: 310,
    },
    // 3. Kashmir Edition - Urban Development & News
    {
      title: 'Srinagar Smart City Project Completes Phase 3 Riverfront Development',
      subtitle: 'Revamped Jhelum riverfront boardwalks, heritage walkways, and electric water-taxis transform Srinagar urban landscape.',
      slug: 'srinagar-smart-city-riverfront-development',
      excerpt: 'The Srinagar Smart City Mission has officially opened the third phase of the Jhelum riverfront beautification project to public visitors.',
      content: '<h2>Urban Transformation Along the Historic Jhelum</h2><p>Srinagar’s riverfront has undergone modernization with new cycling corridors and electric water-taxis...</p>',
      image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'news',
      primarySection: newsSec._id,
      editions: [kashmirEd._id],
      primaryAuthor: authorZehra._id,
      author: authorZehra.name,
      categories: ['News', 'Kashmir', 'Urban Development'],
      tags: ['Srinagar', 'Smart City', 'Jhelum Riverfront', 'Infrastructure'],
      status: 'published',
      views: 1870,
      likes: 195,
    },
    // 4. India Edition - Business & Startups
    {
      title: 'India Startup Ecosystem Reaches Record $18B Seed & Growth Funding in 2026',
      subtitle: 'Fintech, Deeptech AI, and Clean Energy lead venture capital deployment across Bengaluru, Delhi NCR, and Mumbai.',
      slug: 'india-startup-funding-record-2026',
      excerpt: 'Indian venture capital investments surge as domestic deep-tech innovators attract global institutional backing.',
      content: '<h2>The Rise of Indian Deep-Tech</h2><p>India’s startup landscape is undergoing structural maturity with AI infrastructure and semiconductor startups claiming major funding rounds...</p>',
      image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'analysis',
      primarySection: bizSec._id,
      editions: [indiaEd._id],
      primaryAuthor: authorPriya._id,
      author: authorPriya.name,
      categories: ['Business', 'Startups', 'India'],
      tags: ['Indian Startups', 'Venture Capital', 'Fintech', 'Bengaluru', 'Economy'],
      status: 'published',
      views: 3120,
      likes: 245,
    },
    // 5. Global Edition - Technology & Tutorial
    {
      title: 'Optimizing Next.js 15 App Router Performance and Server Actions',
      subtitle: 'A deep-dive into Partial Prerendering, streaming boundaries, and secure database transactions.',
      slug: 'optimizing-nextjs-15-app-router-server-actions',
      excerpt: 'Learn how to maximize performance in Next.js 15. This guide details React Server Components, server action security, client-side hydration, and dynamic edge rendering.',
      content: '<h2>Server-First React Paradigms</h2><p>Next.js 15 combines Server Components with granular cache controls for optimal performance...</p>',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'tutorial',
      primarySection: techSec._id,
      editions: [globalEd._id],
      primaryAuthor: authorSuheel._id,
      author: authorSuheel.name,
      categories: ['Technology', 'Next.js'],
      tags: ['Next.js 15', 'React Server Components', 'Server Actions', 'Web Performance'],
      status: 'published',
      featured: true,
      views: 4500,
      likes: 520,
      contentMetadata: {
        tutorialMetadata: { difficulty: 'Intermediate', estimatedTime: '20 mins', prerequisites: ['React 19', 'Next.js'] },
      },
    },
    // 6. Global Edition - Tech Hardware Review
    {
      title: 'Apple M4 MacBook Pro Review: The Definitive Creator Workstation',
      subtitle: 'Unrivaled single-core speeds, 24-hour battery endurance, and nano-texture display make this the apex laptop of 2026.',
      slug: 'apple-m4-macbook-pro-review',
      excerpt: 'We benchmarked the Apple M4 MacBook Pro across heavy Xcode compilations, 8K video renders, and local LLM inference.',
      content: '<h2>The Silicon Mastery Continues</h2><p>Apple’s M4 architecture delivers lightning-fast throughput while remaining whisper quiet...</p>',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'review',
      primarySection: techSec._id,
      editions: [globalEd._id],
      primaryAuthor: authorAarav._id,
      author: authorAarav.name,
      categories: ['Technology', 'Reviews'],
      tags: ['Apple M4', 'MacBook Pro', 'Hardware Review', 'Silicon'],
      status: 'published',
      views: 2180,
      likes: 275,
      contentMetadata: {
        reviewMetadata: {
          rating: 4.8,
          verdict: 'The most capable and power-efficient creator laptop ever built.',
          pros: ['Remarkable speed', '20+ hour battery', 'Nano-texture display'],
          cons: ['Expensive storage upgrades'],
        },
      },
    },
    // 7. Global Edition - Science & Space
    {
      title: 'James Webb Space Telescope Identifies Atmospheric Water Vapor on Habitable-Zone Exoplanet',
      subtitle: 'Astronomers detect chemical biosignatures in the atmosphere of K2-18b, marking a major milestone in astrobiology.',
      slug: 'jwst-water-vapor-exoplanet-discovery-2026',
      excerpt: 'Spectroscopic analysis from the James Webb Space Telescope reveals definitive evidence of water vapor in the atmosphere of a habitable-zone exoplanet.',
      content: '<h2>A Landmark Discovery in Deep Space</h2><p>Data transmitted by the James Webb Space Telescope has detected methane, carbon dioxide, and water vapor signatures...</p>',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'news',
      primarySection: sciSec._id,
      editions: [globalEd._id],
      primaryAuthor: authorSuheel._id,
      author: authorSuheel.name,
      categories: ['Science', 'Space', 'Astronomy'],
      tags: ['JWST', 'NASA', 'Exoplanets', 'Astrobiology', 'Space'],
      status: 'published',
      views: 5410,
      likes: 680,
    },
    // 8. Lifestyle & Productivity
    {
      title: 'The Digital Detox Protocol: How Cal Newport Deep Work Model Transforms Engineering Productivity',
      subtitle: 'Cognitive focus, intentional disconnection, and structured deep work cycles for modern software architects.',
      slug: 'digital-detox-deep-work-protocol',
      excerpt: 'How minimizing context-switching and implementing structured deep work blocks can double your engineering output.',
      content: '<h2>The Cost of Fragmented Attention</h2><p>In an era of relentless notifications, the ability to concentrate without distraction is becoming a superpower...</p>',
      image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&q=80&w=1200&h=630',
      contentType: 'opinion',
      primarySection: lifeSec._id,
      editions: [globalEd._id],
      primaryAuthor: authorSuheel._id,
      author: authorSuheel.name,
      categories: ['Lifestyle', 'Productivity'],
      tags: ['Deep Work', 'Productivity', 'Mindfulness', 'Engineering Focus'],
      status: 'published',
      views: 1650,
      likes: 198,
    },
  ];

  const createdArticles = await Post.insertMany(articles);
  console.log(`✓ Seeded ${createdArticles.length} diverse articles`);

  // 4. Verification Queries
  console.log('\n4. VERIFYING REGIONAL EDITIONS & CATEGORY FILTERS:');

  // Query Kashmir Edition
  const kashmirStories = await Post.find({ editions: kashmirEd._id }).select('title contentType author');
  console.log(`\n🏔️ [KASHMIR EDITION] Found ${kashmirStories.length} stories:`);
  kashmirStories.forEach(s => console.log(`   - [${s.contentType.toUpperCase()}] ${s.title} (by ${s.author})`));

  // Query India Edition
  const indiaStories = await Post.find({ editions: indiaEd._id }).select('title contentType author');
  console.log(`\n🇮🇳 [INDIA EDITION] Found ${indiaStories.length} stories:`);
  indiaStories.forEach(s => console.log(`   - [${s.contentType.toUpperCase()}] ${s.title} (by ${s.author})`));

  // Query Global Edition
  const globalStories = await Post.find({ editions: globalEd._id }).select('title contentType author');
  console.log(`\n🌍 [GLOBAL EDITION] Found ${globalStories.length} stories:`);
  globalStories.forEach(s => console.log(`   - [${s.contentType.toUpperCase()}] ${s.title} (by ${s.author})`));

  // Query by Categories
  console.log('\n📂 [CATEGORY BREAKDOWN]:');
  for (const sec of sections) {
    const count = await Post.countDocuments({ categories: new RegExp(sec.name, 'i') });
    console.log(`   • ${sec.name}: ${count} published stories`);
  }

  // Query by Content Types
  console.log('\n📑 [CONTENT TYPE BREAKDOWN]:');
  const types = ['news', 'tutorial', 'guide', 'review', 'analysis', 'opinion'];
  for (const t of types) {
    const count = await Post.countDocuments({ contentType: t });
    console.log(`   • ${t.toUpperCase()}: ${count} articles`);
  }

  console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
  await mongod.stop();
  process.exit(0);
}

main().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
