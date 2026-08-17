import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Taxonomy from '../src/lib/models/taxonomy.model.js';
import Post from '../src/lib/models/post.model.js';
import Admin from '../src/lib/models/admin.model.js';
import { DEFAULT_STORIES } from '../src/data/defaultStories.js';

console.log('==================================================================================');
console.log('TEACHYBLOGS — TAXONOMY MIGRATION & MULTI-DIMENSIONAL SEEDING ENGINE');
console.log('==================================================================================\n');

export async function runMigration({ isDryRun = false, connectionUri = null } = {}) {
  let memoryServer = null;

  if (!connectionUri) {
    if (process.env.MONGODB_URI) {
      connectionUri = process.env.MONGODB_URI;
    } else {
      console.log('  [Notice] No external MongoDB URI provided. Starting ephemeral in-memory MongoDB instance...');
      memoryServer = await MongoMemoryServer.create();
      connectionUri = memoryServer.getUri();
    }
  }

  console.log(`  Connecting to database: ${connectionUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  await mongoose.connect(connectionUri);

  const report = {
    isDryRun,
    contentTypesCreated: 0,
    topicsCreated: 0,
    regionsCreated: 0,
    entitiesCreated: 0,
    postsMigrated: 0,
    errors: [],
  };

  try {
    // -----------------------------------------------------------------------------
    // 1. SEED CONTENT TYPES (WHAT FORMAT IS THE STORY?)
    // -----------------------------------------------------------------------------
    console.log('\n>>> 1. Seeding Standardized Content Types...');
    const contentTypes = [
      {
        name: 'News',
        slug: 'news',
        description: 'Time-sensitive reporting of real-time events and official developments.',
        order: 1,
        capabilities: { sources: true, breaking: true, location: true, correction: true },
      },
      {
        name: 'Analysis',
        slug: 'analysis',
        description: 'In-depth contextual examination and analytical breakdown of complex topics.',
        order: 2,
        capabilities: { sources: true, methodology: true },
      },
      {
        name: 'Opinion',
        slug: 'opinion',
        description: 'Perspectives, editorial viewpoints, and authored commentary.',
        order: 3,
        capabilities: { authorBio: true },
      },
      {
        name: 'Explainer',
        slug: 'explainer',
        description: 'Clear, comprehensive guides breaking down complex subjects for broad audiences.',
        order: 4,
        capabilities: { faqs: true },
      },
      {
        name: 'Guide',
        slug: 'guide',
        description: 'Actionable step-by-step handbooks, documentation, and best practices.',
        order: 5,
        capabilities: { difficulty: true, checklist: true },
      },
      {
        name: 'Tutorial',
        slug: 'tutorial',
        description: 'Hands-on technical implementation walkthroughs with code and demonstrations.',
        order: 6,
        capabilities: { difficulty: true, prerequisites: true, technologies: true, codePlayground: true },
      },
      {
        name: 'Review',
        slug: 'review',
        description: 'Critical evaluations, product reviews, hardware, software, and book appraisals.',
        order: 7,
        capabilities: { rating: true, prosCons: true, entity: true },
      },
      {
        name: 'Feature',
        slug: 'feature',
        description: 'Narrative journalism, long-form stories, investigative profiles, and essays.',
        order: 8,
        capabilities: { longform: true, interactiveMedia: true },
      },
      {
        name: 'Interview',
        slug: 'interview',
        description: 'Conversations, Q&As, and dialogues with researchers, leaders, and creators.',
        order: 9,
        capabilities: { interviewee: true, audio: true },
      },
      {
        name: 'Report',
        slug: 'report',
        description: 'Data-driven whitepapers, research findings, and statistical overviews.',
        order: 10,
        capabilities: { datasets: true, charts: true, sources: true },
      },
      {
        name: 'List',
        slug: 'list',
        description: 'Curated listicles, rankings, toolkits, and structured roundups.',
        order: 11,
        capabilities: { itemsCount: true },
      },
      {
        name: 'Announcement',
        slug: 'announcement',
        description: 'Official bulletins, platform releases, and editorial notices.',
        order: 12,
        capabilities: { official: true },
      },
    ];

    const contentTypeMap = new Map();

    for (const ct of contentTypes) {
      let existing = await Taxonomy.findOne({ kind: 'content_type', slug: ct.slug });
      if (!existing && !isDryRun) {
        existing = await Taxonomy.create({
          kind: 'content_type',
          name: ct.name,
          slug: ct.slug,
          description: ct.description,
          order: ct.order,
          capabilities: ct.capabilities,
          active: true,
          visibleInNavigation: true,
        });
        report.contentTypesCreated++;
      }
      if (existing) contentTypeMap.set(ct.slug, existing);
    }
    console.log(`  Seeded/Verified ${contentTypes.length} Content Types.`);

    // -----------------------------------------------------------------------------
    // 2. SEED HIERARCHICAL TOPICS (WHAT SUBJECT IS THE STORY ABOUT?)
    // -----------------------------------------------------------------------------
    console.log('\n>>> 2. Seeding Hierarchical Thematic Topics...');

    const topicTree = [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Software engineering, artificial intelligence, cloud architecture, and computing.',
        order: 1,
        children: [
          {
            name: 'Artificial Intelligence',
            slug: 'artificial-intelligence',
            description: 'Machine learning, large language models, neural systems, and automation.',
            children: [
              { name: 'Generative AI', slug: 'generative-ai', description: 'LLMs, multimodal diffusion, and synthetic media.' },
              { name: 'Machine Learning', slug: 'machine-learning', description: 'Supervised learning, deep learning, and statistical modeling.' },
            ],
          },
          {
            name: 'Web Development',
            slug: 'web-development',
            description: 'Modern full-stack web engineering, frontend frameworks, and server architectures.',
            children: [
              { name: 'React Ecosystem', slug: 'react-ecosystem', description: 'React 19, Next.js App Router, Server Components, and state management.' },
              { name: 'Backend Architecture', slug: 'backend-architecture', description: 'Distributed databases, microservices, APIs, and cloud infrastructure.' },
            ],
          },
          {
            name: 'Cybersecurity',
            slug: 'cybersecurity',
            description: 'Application security, cryptography, vulnerability research, and threat mitigation.',
          },
        ],
      },
      {
        name: 'Education',
        slug: 'education',
        description: 'Academic developments, higher education, research breakthroughs, and pedagogy.',
        order: 2,
        children: [
          {
            name: 'Higher Education',
            slug: 'higher-education',
            description: 'Universities, colleges, postgraduate programs, and academic research.',
            children: [
              { name: 'Universities', slug: 'universities', description: 'University governance, faculties, research labs, and academic departments.' },
              { name: 'Admissions & Exams', slug: 'admissions', description: 'Entrance schedules, admission criteria, scholarships, and fellowships.' },
            ],
          },
          {
            name: 'EdTech & Learning',
            slug: 'edtech',
            description: 'Digital classrooms, online curriculums, and interactive learning technologies.',
          },
        ],
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Global trade, economic analysis, entrepreneurship, and venture capital.',
        order: 3,
        children: [
          { name: 'Startups & Innovation', slug: 'startups', description: 'Founder journeys, early-stage scaling, and tech ventures.' },
          { name: 'Finance & Markets', slug: 'finance', description: 'Monetary policy, fiscal markets, investment analysis, and fintech.' },
        ],
      },
      {
        name: 'Science',
        slug: 'science',
        description: 'Fundamental physics, astronomy, climate research, and biological sciences.',
        order: 4,
        children: [
          { name: 'Space & Astronomy', slug: 'space', description: 'Astrophysics, orbital missions, and cosmological discoveries.' },
          { name: 'Climate & Environment', slug: 'climate', description: 'Ecology, renewable energy, climate modeling, and conservation.' },
        ],
      },
      {
        name: 'Culture',
        slug: 'culture',
        description: 'Heritage, literature, architecture, music, and societal analysis.',
        order: 5,
        children: [
          { name: 'Art & Literature', slug: 'art-literature', description: 'Contemporary & classical prose, poetry, and artistic movements.' },
          { name: 'History & Heritage', slug: 'history', description: 'Archaeological discoveries, historical preservation, and traditions.' },
        ],
      },
      {
        name: 'Travel',
        slug: 'travel',
        description: 'Expeditions, regional destination guides, eco-tourism, and hospitality.',
        order: 6,
        children: [
          { name: 'Destinations', slug: 'destinations', description: 'Scenic valleys, mountain trails, cultural centers, and hidden gems.' },
          { name: 'Hospitality & Resorts', slug: 'hospitality', description: 'Accommodations, local cuisines, and travel infrastructure.' },
        ],
      },
      {
        name: 'Sports',
        slug: 'sports',
        description: 'Athletics, competitive championships, winter sports, and fitness.',
        order: 7,
      },
      {
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Productivity, wellness, modern living, and digital culture.',
        order: 8,
      },
    ];

    const topicMap = new Map();

    async function seedTopicNode(node, parentDoc = null, ancestors = []) {
      let doc = await Taxonomy.findOne({ kind: 'topic', slug: node.slug });
      if (!doc && !isDryRun) {
        doc = await Taxonomy.create({
          kind: 'topic',
          name: node.name,
          slug: node.slug,
          description: node.description || '',
          parent: parentDoc?._id || null,
          ancestors,
          order: node.order || 0,
          active: true,
          visibleInNavigation: ancestors.length === 0,
          seo: { title: `${node.name} Articles & Analysis — TeachyBlogs`, description: node.description, indexable: true },
        });
        report.topicsCreated++;
      }

      if (doc) {
        topicMap.set(node.slug, doc);
        const currentAncestors = [...ancestors, { _id: doc._id, name: doc.name, slug: doc.slug, kind: 'topic' }];
        if (node.children) {
          for (let idx = 0; idx < node.children.length; idx++) {
            await seedTopicNode({ ...node.children[idx], order: idx + 1 }, doc, currentAncestors);
          }
        }
      }
    }

    for (const rootTopic of topicTree) {
      await seedTopicNode(rootTopic);
    }
    console.log(`  Seeded/Verified ${topicMap.size} Hierarchical Topics.`);

    // -----------------------------------------------------------------------------
    // 3. SEED HIERARCHICAL GEOGRAPHY & REGIONAL HUBS
    // -----------------------------------------------------------------------------
    console.log('\n>>> 3. Seeding Hierarchical Geography & Regional Hubs...');

    const regionTree = [
      {
        name: 'Global',
        slug: 'global',
        type: 'continent',
        description: 'Worldwide international developments and global perspectives.',
        isHub: true,
        order: 1,
      },
      {
        name: 'India',
        slug: 'india',
        type: 'country',
        countryCode: 'IN',
        description: 'National coverage across India, policy, technology, and culture.',
        isHub: true,
        order: 2,
        children: [
          {
            name: 'Jammu & Kashmir',
            slug: 'jammu-kashmir',
            type: 'state',
            countryCode: 'IN',
            description: 'Comprehensive coverage of the Union Territory of Jammu & Kashmir.',
            isHub: true,
            order: 1,
            children: [
              {
                name: 'Kashmir',
                slug: 'kashmir',
                type: 'region',
                countryCode: 'IN',
                description: 'Regional journalism, education, culture, tourism, and current affairs in Kashmir.',
                isHub: true,
                order: 1,
                children: [
                  { name: 'Srinagar', slug: 'srinagar', type: 'city', isHub: true, coordinates: { lat: 34.0837, lng: 74.7973 } },
                  { name: 'Baramulla', slug: 'baramulla', type: 'district', coordinates: { lat: 34.1980, lng: 74.3636 } },
                  { name: 'Anantnag', slug: 'anantnag', type: 'district', coordinates: { lat: 33.7311, lng: 75.1487 } },
                  { name: 'Gulmarg', slug: 'gulmarg', type: 'city', coordinates: { lat: 34.0484, lng: 74.3805 } },
                  { name: 'Pahalgam', slug: 'pahalgam', type: 'city', coordinates: { lat: 34.0150, lng: 75.3216 } },
                  { name: 'Ganderbal', slug: 'ganderbal', type: 'district', coordinates: { lat: 34.2165, lng: 74.7744 } },
                  { name: 'Budgam', slug: 'budgam', type: 'district', coordinates: { lat: 34.0150, lng: 74.7170 } },
                  { name: 'Pulwama', slug: 'pulwama', type: 'district', coordinates: { lat: 33.8715, lng: 74.8967 } },
                  { name: 'Kupwara', slug: 'kupwara', type: 'district', coordinates: { lat: 34.5262, lng: 74.2546 } },
                  { name: 'Bandipora', slug: 'bandipora', type: 'district', coordinates: { lat: 34.4225, lng: 74.6473 } },
                  { name: 'Shopian', slug: 'shopian', type: 'district', coordinates: { lat: 33.7198, lng: 74.8322 } },
                  { name: 'Kulgam', slug: 'kulgam', type: 'district', coordinates: { lat: 33.6444, lng: 75.0194 } },
                ],
              },
              {
                name: 'Jammu',
                slug: 'jammu',
                type: 'region',
                countryCode: 'IN',
                description: 'Coverage across Jammu region, trade, universities, and culture.',
                isHub: true,
                order: 2,
                children: [
                  { name: 'Jammu City', slug: 'jammu-city', type: 'city' },
                ],
              },
              {
                name: 'Ladakh',
                slug: 'ladakh',
                type: 'region',
                countryCode: 'IN',
                description: 'High-altitude ecology, tourism, and culture across Ladakh.',
                isHub: true,
                order: 3,
                children: [
                  { name: 'Leh', slug: 'leh', type: 'city' },
                  { name: 'Kargil', slug: 'kargil', type: 'city' },
                ],
              },
            ],
          },
          { name: 'Delhi NCR', slug: 'delhi', type: 'state', countryCode: 'IN', isHub: true },
          { name: 'Punjab', slug: 'punjab', type: 'state', countryCode: 'IN' },
          { name: 'Maharashtra', slug: 'maharashtra', type: 'state', countryCode: 'IN' },
          { name: 'Karnataka', slug: 'karnataka', type: 'state', countryCode: 'IN' },
        ],
      },
    ];

    const regionMap = new Map();

    async function seedRegionNode(node, parentDoc = null, ancestors = []) {
      let doc = await Taxonomy.findOne({ kind: 'region', slug: node.slug });
      if (!doc && !isDryRun) {
        doc = await Taxonomy.create({
          kind: 'region',
          name: node.name,
          slug: node.slug,
          type: node.type || 'region',
          countryCode: node.countryCode || '',
          coordinates: node.coordinates || null,
          description: node.description || '',
          parent: parentDoc?._id || null,
          ancestors,
          isHub: !!node.isHub,
          order: node.order || 0,
          active: true,
          visibleInNavigation: !!node.isHub,
          seo: { title: `${node.name} News, Analysis & Stories — TeachyBlogs`, description: node.description, indexable: true },
        });
        report.regionsCreated++;
      }

      if (doc) {
        regionMap.set(node.slug, doc);
        const currentAncestors = [...ancestors, { _id: doc._id, name: doc.name, slug: doc.slug, kind: 'region' }];
        if (node.children) {
          for (let idx = 0; idx < node.children.length; idx++) {
            await seedRegionNode({ ...node.children[idx], order: idx + 1 }, doc, currentAncestors);
          }
        }
      }
    }

    for (const rootRegion of regionTree) {
      await seedRegionNode(rootRegion);
    }
    console.log(`  Seeded/Verified ${regionMap.size} Hierarchical Regions & Hubs.`);

    // -----------------------------------------------------------------------------
    // 4. SEED STANDARD ENTITIES
    // -----------------------------------------------------------------------------
    console.log('\n>>> 4. Seeding Recognized Entities...');
    const entities = [
      { name: 'University of Kashmir', slug: 'university-of-kashmir', type: 'university', description: 'Premier public university located in Srinagar, Jammu & Kashmir.' },
      { name: 'National Institute of Technology Srinagar', slug: 'nit-srinagar', type: 'university', description: 'Institute of National Importance in Hazratbal, Srinagar.' },
      { name: 'OpenAI', slug: 'openai', type: 'company', description: 'AI research and deployment company behind GPT-4 and ChatGPT.' },
      { name: 'React', slug: 'react', type: 'technology', description: 'The library for web and native user interfaces.' },
      { name: 'Next.js', slug: 'nextjs', type: 'technology', description: 'The React Framework for high-performance production web apps.' },
    ];

    const entityMap = new Map();
    for (const ent of entities) {
      let doc = await Taxonomy.findOne({ kind: 'entity', slug: ent.slug });
      if (!doc && !isDryRun) {
        doc = await Taxonomy.create({
          kind: 'entity',
          name: ent.name,
          slug: ent.slug,
          type: ent.type,
          description: ent.description,
          active: true,
          seo: { title: `${ent.name} Articles & Dossiers — TeachyBlogs`, description: ent.description, indexable: true },
        });
        report.entitiesCreated++;
      }
      if (doc) entityMap.set(ent.slug, doc);
    }
    console.log(`  Seeded/Verified ${entityMap.size} Entities.`);

    // -----------------------------------------------------------------------------
    // 5. SEED EDITORIAL ADMIN AUTHORS
    // -----------------------------------------------------------------------------
    let adminAuthor = await Admin.findOne({ email: 'suhail@teachyblogs.com' });
    if (!adminAuthor && !isDryRun) {
      adminAuthor = await Admin.create({
        name: 'Suheel Hilal',
        email: 'suhail@teachyblogs.com',
        password: '$2a$10$hashedPlaceholderPasswordForLocalSeed1234567890',
        role: 'superadmin',
        username: 'suheelhilal',
        slug: 'suheel-hilal',
        bio: 'Editor-in-Chief and Principal Software Architect at TeachyBlogs.',
        expertise: ['Full-Stack Systems', 'Next.js', 'AI & Cloud Infrastructure', 'Editorial Journalism'],
      });
    }

    // -----------------------------------------------------------------------------
    // 6. IDEMPOTENT POST MIGRATION (MAPPING EXISTING POSTS)
    // -----------------------------------------------------------------------------
    console.log('\n>>> 5. Migrating & Upgrading Existing Post Documents...');

    // If database is empty, seed from DEFAULT_STORIES
    const existingPostCount = await Post.countDocuments();
    if (existingPostCount === 0 && !isDryRun) {
      console.log(`  Seeding initial ${DEFAULT_STORIES.length} baseline articles from default dataset...`);
      for (const story of DEFAULT_STORIES) {
        const { _id, primaryAuthor, primarySection, editions, sections, topics, locations, collections, ...cleanStory } = story;
        await Post.create({
          ...cleanStory,
          categories: cleanStory.categories || ['Technology'],
          status: cleanStory.status || 'published',
          publishedAt: cleanStory.publishedAt || new Date(),
        });
      }
    }

    const posts = await Post.find({});
    console.log(`  Found ${posts.length} articles to inspect and classify.`);

    for (const post of posts) {
      let updated = false;

      // Deduce Content Type
      if (!post.contentType || post.contentType === 'article') {
        const titleLower = post.title.toLowerCase();
        let ctSlug = 'article';
        if (titleLower.includes('how to') || titleLower.includes('guide') || titleLower.includes('handbook')) {
          ctSlug = 'guide';
        } else if (titleLower.includes('tutorial') || titleLower.includes('mastering') || titleLower.includes('building')) {
          ctSlug = 'tutorial';
        } else if (titleLower.includes('review') || titleLower.includes('comparison')) {
          ctSlug = 'review';
        } else if (titleLower.includes('announces') || titleLower.includes('news') || titleLower.includes('schedule')) {
          ctSlug = 'news';
        } else if (titleLower.includes('opinion') || titleLower.includes('future of')) {
          ctSlug = 'opinion';
        } else {
          ctSlug = 'feature';
        }
        post.contentType = ctSlug;
        updated = true;
      }

      // Deduce Primary Topic
      if (!post.primaryTopic) {
        const cat = (post.categories && post.categories[0]) ? post.categories[0].toLowerCase() : '';
        let matchedTopic = topicMap.get(cat) || topicMap.get('technology');

        // Contextual topic matching
        const contentStr = (post.title + ' ' + post.excerpt + ' ' + (post.tags || []).join(' ')).toLowerCase();
        if (contentStr.includes('artificial intelligence') || contentStr.includes('ai') || contentStr.includes('llm')) {
          matchedTopic = topicMap.get('artificial-intelligence') || topicMap.get('technology');
        } else if (contentStr.includes('react') || contentStr.includes('next.js') || contentStr.includes('web development')) {
          matchedTopic = topicMap.get('react-ecosystem') || topicMap.get('web-development') || topicMap.get('technology');
        } else if (contentStr.includes('admission') || contentStr.includes('university') || contentStr.includes('education')) {
          matchedTopic = topicMap.get('higher-education') || topicMap.get('education');
        } else if (contentStr.includes('travel') || contentStr.includes('kashmir') || contentStr.includes('tourism')) {
          matchedTopic = topicMap.get('travel');
        }

        if (matchedTopic) {
          post.primaryTopic = matchedTopic._id;
          post.topics = [matchedTopic._id];
          updated = true;
        }
      }

      // Deduce Primary Region
      if (!post.primaryRegion) {
        const contentStr = (post.title + ' ' + post.excerpt + ' ' + (post.tags || []).join(' ')).toLowerCase();
        let matchedRegion = regionMap.get('global');

        if (contentStr.includes('srinagar')) {
          matchedRegion = regionMap.get('srinagar');
        } else if (contentStr.includes('kashmir') || contentStr.includes('gulmarg') || contentStr.includes('pahalgam')) {
          matchedRegion = regionMap.get('kashmir');
        } else if (contentStr.includes('india') || contentStr.includes('delhi')) {
          matchedRegion = regionMap.get('india');
        }

        if (matchedRegion) {
          post.primaryRegion = matchedRegion._id;
          post.regions = [matchedRegion._id];
          updated = true;
        }
      }

      // Ensure Language is set
      if (!post.language) {
        // Detect Urdu / Arabic script in title or excerpt
        const isUrdu = /[\u0600-\u06FF]/.test(post.title + ' ' + post.excerpt);
        post.language = isUrdu ? 'ur' : 'en';
        updated = true;
      }

      // Initialize Revisions array if missing
      if (!post.revisions || post.revisions.length === 0) {
        post.revisions = [
          {
            version: 1,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            changedBy: { name: post.author || 'Editorial Team', role: 'author' },
            changeSummary: 'Initial publication snapshot',
            createdAt: post.publishedAt || post.createdAt || new Date(),
          },
        ];
        updated = true;
      }

      // Link Primary Author
      if (!post.primaryAuthor && adminAuthor) {
        post.primaryAuthor = adminAuthor._id;
        updated = true;
      }

      if (updated && !isDryRun) {
        await post.save();
        report.postsMigrated++;
      }
    }

    console.log(`  Successfully Migrated & Verified ${posts.length} Post Documents.`);

    // -----------------------------------------------------------------------------
    // FINAL VALIDATION CHECKS
    // -----------------------------------------------------------------------------
    const finalPostCount = await Post.countDocuments();
    const finalPublishedCount = await Post.countDocuments({ status: 'published' });
    const finalTaxonomyCount = await Taxonomy.countDocuments();

    console.log('\n==================================================================================');
    console.log('MIGRATION SUMMARY REPORT:');
    console.log(`  • Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'APPLIED (Live)'}`);
    console.log(`  • Total Taxonomy Entities: ${finalTaxonomyCount}`);
    console.log(`    - Content Types: ${await Taxonomy.countDocuments({ kind: 'content_type' })}`);
    console.log(`    - Topics: ${await Taxonomy.countDocuments({ kind: 'topic' })}`);
    console.log(`    - Regions: ${await Taxonomy.countDocuments({ kind: 'region' })}`);
    console.log(`    - Entities: ${await Taxonomy.countDocuments({ kind: 'entity' })}`);
    console.log(`  • Total Articles: ${finalPostCount}`);
    console.log(`  • Published Articles: ${finalPublishedCount}`);
    console.log('==================================================================================\n');

    return { success: true, report };
  } catch (err) {
    console.error('  ❌ Migration Encountered Error:', err);
    throw err;
  } finally {
    if (memoryServer) {
      await mongoose.disconnect();
      await memoryServer.stop();
      console.log('  Ephemeral in-memory database stopped.');
    }
  }
}

// If executed directly from command line
if (process.argv[1]?.endsWith('migrate-content-taxonomy.mjs')) {
  const isDryRun = process.argv.includes('--dry-run');
  runMigration({ isDryRun })
    .then(() => {
      console.log('Migration finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
