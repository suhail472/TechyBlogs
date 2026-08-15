import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables manually from .env.local if present
let MONGODB_URI = 'mongodb://localhost:27017/teachyblogs';
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
    await mongoose.connect(MONGODB_URI);
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
    ];

    await Taxonomy.deleteMany({});
    const createdTaxonomies = await Taxonomy.insertMany([...sectionsData, ...editionsData, ...topicsData]);
    console.log(`Seeded ${createdTaxonomies.length} taxonomy entities.`);

    const techSec = createdTaxonomies.find(t => t.slug === 'technology');
    const newsSec = createdTaxonomies.find(t => t.slug === 'news');
    const eduSec = createdTaxonomies.find(t => t.slug === 'education');
    const travelSec = createdTaxonomies.find(t => t.slug === 'travel');

    const kashmirEd = createdTaxonomies.find(t => t.slug === 'kashmir');
    const globalEd = createdTaxonomies.find(t => t.slug === 'global');

    const aiTopic = createdTaxonomies.find(t => t.slug === 'artificial-intelligence');
    const tourismTopic = createdTaxonomies.find(t => t.slug === 'kashmir-tourism');
    const admTopic = createdTaxonomies.find(t => t.slug === 'university-admissions');

    // 2. Seed Authors
    console.log('Seeding authors...');
    const authorsData = [
      {
        name: 'Suheel Hilal',
        email: 'suheel@teachyblogs.com',
        role: 'superadmin',
        username: 'suheel',
        slug: 'suheel-hilal',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Principal Software Architect and Lead Editor at TeachyBlogs. Specializes in distributed systems, Next.js, and web standards.',
        expertise: ['Next.js', 'Software Architecture', 'Full-Stack Systems', 'Cloud'],
      },
      {
        name: 'Zehra Mir',
        email: 'zehra@teachyblogs.com',
        role: 'editor',
        username: 'zehra',
        slug: 'zehra-mir',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Senior Regional Correspondent covering Jammu & Kashmir education, regional development, and cultural heritage.',
        expertise: ['Higher Education', 'Kashmir Affairs', 'Policy Analysis', 'Tourism'],
      },
      {
        name: 'Aarav Sharma',
        email: 'aarav@teachyblogs.com',
        role: 'author',
        username: 'aarav',
        slug: 'aarav-sharma',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Hardware and Consumer Technology reviewer with a decade of benchmarking experience across laptops, phones, and silicon.',
        expertise: ['Hardware Benchmarks', 'Apple Silicon', 'Consumer Tech', 'Product Design'],
      },
    ];

    await Admin.deleteMany({});
    const createdAuthors = await Admin.insertMany(authorsData);
    console.log(`Seeded ${createdAuthors.length} editorial team members.`);

    const authorSuheel = createdAuthors[0];
    const authorZehra = createdAuthors[1];
    const authorAarav = createdAuthors[2];

    // 3. Seed Multi-Domain Articles
    console.log('Seeding articles...');
    const postsData = [
      {
        title: 'Optimizing Next.js 15 App Router Performance and Server Actions',
        subtitle: 'A deep-dive into Partial Prerendering, streaming boundaries, and secure database transactions.',
        slug: 'optimizing-nextjs-15-app-router-server-actions',
        excerpt: 'Learn how to maximize performance in Next.js 15. This guide details React Server Components, server action security, client-side hydration, and dynamic edge rendering.',
        content: `
<h2>The Evolution of Full-Stack React</h2>
<p>Next.js 15 marks a pivotal milestone in the evolution of full-stack JavaScript architectures. By combining Server Components, Streaming SSR, and granular Cache Controls, engineering teams can achieve instant First Contentful Paint while keeping client bundle weights to a minimum.</p>

<h3>Core Principles of Server-First Data Fetching</h3>
<p>Instead of fetching data inside <code>useEffect</code> hooks on the browser, Server Components query MongoDB directly behind firewall protections:</p>
<pre><code>import Post from '@/lib/models/post.model';

export default async function FeedPage() {
  const posts = await Post.find({ status: 'published' }).lean();
  return &lt;PostList items={posts} /&gt;;
}</code></pre>

<h3>Understanding Partial Prerendering (PPR)</h3>
<p>Partial Prerendering dynamically marries static HTML shells with async dynamic micro-streams. The static masthead, sidebar, and layout render instantly from Edge CDNs, while personalized user feeds stream into view smoothly without layout shifts.</p>
        `,
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200&h=630',
        contentType: 'tutorial',
        primarySection: techSec._id,
        editions: [globalEd._id],
        topics: [aiTopic._id],
        primaryAuthor: authorSuheel._id,
        author: authorSuheel.name,
        categories: ['Technology', 'Next.js'],
        tags: ['Next.js 15', 'React Server Components', 'Server Actions', 'Web Performance', 'SEO'],
        status: 'published',
        featured: true,
        views: 1420,
        likes: 184,
        contentMetadata: {
          tutorialMetadata: {
            difficulty: 'Intermediate',
            prerequisites: ['React 19', 'Next.js App Router', 'JavaScript ES6'],
            estimatedTime: '20 mins',
          },
        },
        faqs: [
          {
            question: 'What is the main benefit of Server Actions?',
            answer: 'Server Actions allow developers to mutate backend data directly from components without manually configuring boilerplate API routes.',
          },
          {
            question: 'Is it safe to query databases inside Server Components?',
            answer: 'Yes, because Server Components execute strictly on the server and are never included in the browser bundle.',
          },
        ],
      },
      {
        title: 'University of Kashmir Announces New Admission & Entrance Schedule for 2026',
        subtitle: 'Directorate of Admissions releases comprehensive guidelines, eligibility criteria, and application timelines for postgraduate courses.',
        slug: 'university-of-kashmir-admissions-schedule-2026',
        excerpt: 'The University of Kashmir has officially released the entrance examination calendar and application portal details for PG and professional programs.',
        content: `
<h2>Official Notification from Directorate of Admissions</h2>
<p>The University of Kashmir, Hazratbal, Srinagar has announced the commencement of the online registration process for all Master's, PG Diploma, and professional degree programs for the upcoming academic session.</p>

<h3>Key Dates and Timelines</h3>
<ul>
  <li><strong>Application Portal Opens:</strong> August 20, 2026</li>
  <li><strong>Last Date for Online Submission:</strong> September 10, 2026</li>
  <li><strong>Entrance Examination Window:</strong> September 25 – October 5, 2026</li>
</ul>

<h3>Eligibility Criteria and Instructions</h3>
<p>Candidates holding a Bachelor's degree with at least 50% marks in the relevant subject disciplines (45% for reserved categories) are eligible to apply through the official university portal.</p>
        `,
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200&h=630',
        contentType: 'news',
        primarySection: eduSec._id,
        editions: [kashmirEd._id],
        topics: [admTopic._id],
        primaryAuthor: authorZehra._id,
        author: authorZehra.name,
        categories: ['Education', 'News', 'Kashmir'],
        tags: ['University of Kashmir', 'Admissions 2026', 'Higher Education', 'Srinagar'],
        status: 'published',
        featured: true,
        breaking: true,
        views: 3890,
        likes: 412,
        source: {
          name: 'University of Kashmir Directorate of Admissions Notice #KU-2026/ADM',
          url: 'https://kashmiruniversity.net',
        },
        editorNote: 'This report has been verified against the official university press release.',
      },
      {
        title: '10 Best Places to Visit in Kashmir During Autumn: The Golden Season Guide',
        subtitle: 'From the amber Chinars of Naseem Bagh to the alpine serenity of Pahalgam and Gulmarg, here is your essential autumn travel itinerary.',
        slug: '10-best-places-to-visit-in-kashmir-during-autumn',
        excerpt: 'Discover why autumn is Kashmir’s most enchanting season. Explore amber Chinar gardens, crisp mountain valleys, and cultural heritage trails.',
        content: `
<h2>The Magic of Autumn in Kashmir (Harud)</h2>
<p>Autumn in Kashmir, locally celebrated as <em>Harud</em>, transforms the valley into a radiant tapestry of gold, amber, and deep russet. The majestic Chinar trees (Platanus orientalis) shed their fiery leaves, creating picturesque carpets across historic Mughal gardens.</p>

<h3>1. Naseem Bagh, Srinagar</h3>
<p>Known as the Garden of Morning Breezes, Naseem Bagh is the oldest Mughal garden planted on the banks of Dal Lake. In late October and November, thousands of Chinar trees illuminate the landscape in warm gold hues.</p>

<h3>2. Betaab Valley, Pahalgam</h3>
<p>Surrounded by snow-dusted pine forests and the crystalline Lidder River, Pahalgam in autumn offers unparalleled trekking, serene riverside strolls, and world-class trout fishing.</p>

<h3>3. Gulmarg Meadow of Flowers</h3>
<p>Before the winter snow blankets the Apharwat peak, Gulmarg during early autumn offers pristine cable car rides, horseback riding trails, and panoramic vistas of Nanga Parbat.</p>
        `,
        image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&q=80&w=1200&h=630',
        contentType: 'guide',
        primarySection: travelSec._id,
        editions: [kashmirEd._id],
        topics: [tourismTopic._id],
        primaryAuthor: authorZehra._id,
        author: authorZehra.name,
        categories: ['Travel & Culture', 'Kashmir'],
        tags: ['Kashmir Tourism', 'Autumn in Kashmir', 'Srinagar', 'Gulmarg', 'Pahalgam'],
        status: 'published',
        views: 2950,
        likes: 310,
        contentMetadata: {
          tutorialMetadata: {
            difficulty: 'Travel Guide',
            prerequisites: ['Valid ID', 'Warm Clothing', 'Pre-booked Transport'],
            estimatedTime: '5-Day Itinerary',
          },
        },
      },
      {
        title: 'Apple M4 MacBook Pro Review: The Definitive Creator Workstation',
        subtitle: 'Unrivaled single-core speeds, 24-hour battery endurance, and nano-texture display make this the apex laptop of 2026.',
        slug: 'apple-m4-macbook-pro-review',
        excerpt: 'We benchmarked the Apple M4 MacBook Pro across heavy Xcode compilations, 8K video renders, and local LLM inference. Here is our verdict.',
        content: `
<h2>The Silicon Mastery Continues</h2>
<p>Apple’s transition to the M4 architecture represents another generational leap in energy efficiency and sheer compute throughput. Built on TSMC’s enhanced 3-nanometer node, the M4 processor delivers lightning-fast single-threaded response times while maintaining room-temperature silent operation.</p>

<h3>Performance Benchmarks</h3>
<p>Compiling the entire Next.js codebase took a staggering 38% less time compared to the previous M2 Pro generation. In multi-stream 8K ProRes export tests in DaVinci Resolve, hardware media engines chewed through footage without a single dropped frame.</p>

<h3>Display & Battery Life</h3>
<p>The optional nano-texture glass significantly cuts harsh ambient glare without sacrificing color contrast or peak 1,600 nits HDR brightness. Battery endurance easily topped 21 hours of mixed development and browsing tasks.</p>
        `,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1200&h=630',
        contentType: 'review',
        primarySection: techSec._id,
        editions: [globalEd._id],
        topics: [aiTopic._id],
        primaryAuthor: authorAarav._id,
        author: authorAarav.name,
        categories: ['Technology', 'Reviews'],
        tags: ['Apple M4', 'MacBook Pro', 'Hardware Review', 'Silicon', 'Tech Review'],
        status: 'published',
        views: 2180,
        likes: 275,
        contentMetadata: {
          reviewMetadata: {
            rating: 4.8,
            verdict: 'The Apple M4 MacBook Pro is the most capable, power-efficient pro creator laptop ever engineered.',
            pros: [
              'Industry-leading single-core and multi-core performance',
              'Astonishing 20+ hour real-world battery life',
              'Superb nano-texture Liquid Retina XDR display',
              'Whisper-quiet acoustics under intense loads',
            ],
            cons: [
              'Expensive memory and storage upgrade tiers',
              'Form factor remains largely unchanged from prior generation',
            ],
          },
        },
      },
      {
        title: 'Srinagar Smart City Project Completes Phase 3 Riverfront Development',
        subtitle: 'Revamped Jhelum riverfront boardwalks, heritage walkways, and electric water-taxis transform Srinagar urban landscape.',
        slug: 'srinagar-smart-city-riverfront-development',
        excerpt: 'The Srinagar Smart City Mission has officially opened the third phase of the Jhelum riverfront beautification project to public visitors.',
        content: `
<h2>Urban Transformation Along the Historic Jhelum</h2>
<p>Srinagar’s historic riverfront has undergone a breathtaking modernization under the Smart City Mission. Stretching across Rajbagh to Zero Bridge, the newly unveiled pedestrian corridors integrate eco-friendly solar illumination, cycling paths, and designated cultural performance pavilions.</p>

<h3>Public Amenities and Water Transportation</h3>
<p>The project also inaugurates electric water-taxis connecting Old City Ghats with modern commercial hubs, easing vehicular congestion on major city corridors while honoring Kashmir’s timeless river heritage.</p>
        `,
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
        source: {
          name: 'Srinagar Smart City Development Authority',
          url: 'https://srinagarsmartcity.in',
        },
      },
    ];

    await Post.deleteMany({});
    const createdPosts = await Post.insertMany(postsData);
    console.log(`Seeded ${createdPosts.length} rich articles successfully!`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
