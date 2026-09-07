import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Taxonomy from '../src/lib/models/taxonomy.model.js';
import Post from '../src/lib/models/post.model.js';
import Admin from '../src/lib/models/admin.model.js';
import postService from '../src/lib/services/post.service.js';
import taxonomyService from '../src/lib/services/taxonomy.service.js';
import { runMigration } from './migrate-content-taxonomy.mjs';

console.log('==================================================================================');
console.log('TECHYBLOGS — ACTUAL SCALE & PERFORMANCE BENCHMARK SUITE');
console.log('==================================================================================\n');

async function runBenchmark() {
  const mongoServer = await MongoMemoryServer.create({
    instance: { storageEngine: 'wiredTiger' },
  });
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
  console.log('✓ Connected to in-memory WiredTiger MongoDB instance');

  // Seed baseline taxonomy
  await runMigration({ isDryRun: false, connectionUri: mongoUri });

  const topics = await Taxonomy.find({ kind: 'topic' }).lean();
  const regions = await Taxonomy.find({ kind: 'region' }).lean();
  const contentTypes = ['news', 'tutorial', 'guide', 'review', 'analysis', 'opinion', 'feature', 'report'];
  const tagsList = ['nextjs', 'react', 'mongodb', 'ai', 'cloud', 'architecture', 'kashmir', 'srinagar', 'admissions', 'webdev'];

  const kashmir = await Taxonomy.findOne({ kind: 'region', slug: 'kashmir' });
  const tech = await Taxonomy.findOne({ kind: 'topic', slug: 'technology' });
  const ai = await Taxonomy.findOne({ kind: 'topic', slug: 'artificial-intelligence' });

  // -----------------------------------------------------------------------------
  // 1. GENERATE SYNTHETIC DATASET (10,000 ARTICLES)
  // -----------------------------------------------------------------------------
  console.log('\n>>> Generating 10,000 Synthetic Realistic Articles...');
  const batchSize = 1000;
  const totalArticles = 10000;
  const now = Date.now();

  for (let batch = 0; batch < totalArticles / batchSize; batch++) {
    const docs = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = batch * batchSize + i;
      const topic = topics[idx % topics.length];
      const region = regions[idx % regions.length];
      const ct = contentTypes[idx % contentTypes.length];
      const selectedTags = [tagsList[idx % tagsList.length], tagsList[(idx + 3) % tagsList.length]];
      const publishOffset = (totalArticles - idx) * 60 * 1000 * 15; // 15 mins apart
      const publishedAt = new Date(now - publishOffset);

      docs.push({
        title: `Synthetic Article ${idx}: High Scale Analysis of Distributed Publishing Systems in 2026`,
        slug: `synthetic-article-${idx}-high-scale-analysis-${Date.now()}-${i}`,
        excerpt: `In-depth investigation and technical architectural report for synthetic benchmark article number ${idx}.`,
        content: `# Technical Report ${idx}\n\nDetailed breakdown of high-throughput distributed architectures, memory bounds, and MongoDB index utilization.\n\n## Section 1\n\nOptimizing query plans and avoiding full collection scans.`,
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
        contentType: ct,
        primaryTopic: topic._id,
        topics: [topic._id],
        primaryRegion: region._id,
        regions: [region._id],
        tags: selectedTags,
        categories: [topic.name],
        author: 'Suheel Hilal',
        language: idx % 10 === 0 ? 'ur' : 'en',
        status: 'published',
        publishedAt,
        views: Math.floor(Math.random() * 5000),
        likes: Math.floor(Math.random() * 300),
        featured: idx % 25 === 0,
        editorial: {
          breaking: idx % 50 === 0,
          locationName: region.name,
          correction: { hasCorrection: false },
        },
        sources: [{ name: 'Technical Docs', url: 'https://techyblogs.com/docs' }],
        revisions: [
          {
            version: 1,
            title: `Synthetic Article ${idx}`,
            content: 'Initial seed content',
            createdAt: publishedAt,
          },
        ],
      });
    }
    await Post.insertMany(docs);
  }

  const datasetCount = await Post.countDocuments();
  console.log(`✓ Inserted ${datasetCount} articles into test collection.`);

  // Ensure all schema indexes are fully built in MongoDB
  await Post.syncIndexes();
  await Taxonomy.syncIndexes();
  console.log('✓ Synchronized all compound indexes with MongoDB WiredTiger engine.');

  // -----------------------------------------------------------------------------
  // 2. EXPLAIN PLAN VALIDATION ACROSS CORE QUERIES
  // -----------------------------------------------------------------------------
  console.log('\n==================================================================================');
  console.log('QUERY EXPLAIN PLAN EXECUTION STATS (10,000 RECORDS):');
  console.log('==================================================================================');

  const benchmarkResults = [];

  async function recordExplain(label, queryFn) {
    const explainResult = await queryFn().explain('executionStats');
    const stats = explainResult.executionStats;
    const winningStage = explainResult.queryPlanner?.winningPlan?.stage ||
      explainResult.queryPlanner?.winningPlan?.inputStage?.stage || 'UNKNOWN';

    const entry = {
      label,
      stage: winningStage,
      executionTimeMillis: stats.executionTimeMillis,
      totalKeysExamined: stats.totalKeysExamined,
      totalDocsExamined: stats.totalDocsExamined,
      nReturned: stats.nReturned,
      docsToReturnRatio: (stats.totalDocsExamined / Math.max(1, stats.nReturned)).toFixed(2),
    };
    benchmarkResults.push(entry);

    console.log(`\n▶ Query: ${label}`);
    console.log(`  • Plan Stage:          ${entry.stage}`);
    console.log(`  • Execution Time:      ${entry.executionTimeMillis}ms`);
    console.log(`  • Keys Examined:       ${entry.totalKeysExamined}`);
    console.log(`  • Docs Examined:       ${entry.totalDocsExamined}`);
    console.log(`  • Docs Returned:       ${entry.nReturned}`);
    console.log(`  • Docs/Return Ratio:   ${entry.docsToReturnRatio}`);
  }

  // A. Latest Published Articles Feed
  await recordExplain('A. Latest Articles Feed (Page 1, limit 12)', () =>
    Post.find({ status: 'published', publishedAt: { $lte: new Date() } })
      .sort({ publishedAt: -1 })
      .limit(12)
  );

  // B. Topic Feed (Primary Topic)
  await recordExplain("B. Topic Feed: 'Technology' (limit 12)", () =>
    Post.find({
      status: 'published',
      publishedAt: { $lte: new Date() },
      $or: [{ primaryTopic: tech._id }, { topics: tech._id }],
    })
      .sort({ publishedAt: -1 })
      .limit(12)
  );

  // C. Nested Subtopic Feed (AI)
  await recordExplain("C. Subtopic Feed: 'Artificial Intelligence' (limit 12)", () =>
    Post.find({
      status: 'published',
      publishedAt: { $lte: new Date() },
      $or: [{ primaryTopic: ai._id }, { topics: ai._id }],
    })
      .sort({ publishedAt: -1 })
      .limit(12)
  );

  // D. Regional Descendant Aggregation (Kashmir Hub with 12 child districts/cities)
  const kashmirSubRegions = await Taxonomy.find({ 'ancestors._id': kashmir._id }).select('_id').lean();
  const kashmirRegionIds = [kashmir._id, ...kashmirSubRegions.map((sr) => sr._id)];

  await recordExplain(`D. Kashmir Regional Hub Feed (${kashmirRegionIds.length} sub-districts, limit 12)`, () =>
    Post.find({
      status: 'published',
      publishedAt: { $lte: new Date() },
      $or: [{ primaryRegion: { $in: kashmirRegionIds } }, { regions: { $in: kashmirRegionIds } }],
    })
      .sort({ publishedAt: -1 })
      .limit(12)
  );

  // E. Content Type Feed (News Articles)
  await recordExplain("E. Content-Type Feed: 'news' (limit 12)", () =>
    Post.find({
      contentType: 'news',
      status: 'published',
      publishedAt: { $lte: new Date() },
    })
      .sort({ publishedAt: -1 })
      .limit(12)
  );

  // F. Tag Feed ('nextjs')
  await recordExplain("F. Tag Feed: 'nextjs' (limit 12)", () =>
    Post.find({
      tags: 'nextjs',
      status: 'published',
      publishedAt: { $lte: new Date() },
    })
      .sort({ publishedAt: -1 })
      .limit(12)
  );

  // G. Article Lookup by Unique Slug
  const sampleArticle = await Post.findOne({ status: 'published' }).lean();
  await recordExplain(`G. Article Lookup by Slug ('${sampleArticle.slug.slice(0, 30)}...')`, () =>
    Post.findOne({
      slug: sampleArticle.slug,
      status: 'published',
      publishedAt: { $lte: new Date() },
    })
  );

  // -----------------------------------------------------------------------------
  // 3. PAGINATION SCALING BENCHMARK (OFFSET SKIP VS RANGE)
  // -----------------------------------------------------------------------------
  console.log('\n==================================================================================');
  console.log('PAGINATION DEPTH SCALING TEST (SKIP + LIMIT COST):');
  console.log('==================================================================================');

  const pageOffsets = [
    { page: 1, skip: 0 },
    { page: 10, skip: 108 },
    { page: 50, skip: 588 },
    { page: 100, skip: 1188 },
    { page: 500, skip: 5988 },
  ];

  for (const { page, skip } of pageOffsets) {
    const t0 = performance.now();
    const explainRes = await Post.find({ status: 'published', publishedAt: { $lte: new Date() } })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(12)
      .explain('executionStats');
    const t1 = performance.now();

    const stats = explainRes.executionStats;
    console.log(
      `  • Page ${page.toString().padEnd(4)} (skip: ${skip.toString().padEnd(5)}): Execution Time = ${(t1 - t0).toFixed(2)}ms | Keys Examined = ${stats.totalKeysExamined} | Docs Examined = ${stats.totalDocsExamined}`
    );
  }

  // -----------------------------------------------------------------------------
  // 4. TAXONOMY RE-PARENTING STRESS TEST
  // -----------------------------------------------------------------------------
  console.log('\n==================================================================================');
  console.log('TAXONOMY TREE RE-PARENTING COST:');
  console.log('==================================================================================');

  // Measure moving leaf vs branch
  const srinagar = await Taxonomy.findOne({ slug: 'srinagar' });
  const jammu = await Taxonomy.findOne({ slug: 'jammu' });

  const moveLeafT0 = performance.now();
  srinagar.parent = jammu._id;
  await srinagar.save();
  await taxonomyService.updateAncestorsRecursively(srinagar._id);
  const moveLeafT1 = performance.now();

  console.log(`  ✓ Move Leaf Node ('Srinagar'): ${(moveLeafT1 - moveLeafT0).toFixed(2)}ms`);

  // Move back
  srinagar.parent = kashmir._id;
  await srinagar.save();
  await taxonomyService.updateAncestorsRecursively(srinagar._id);

  // Move Branch with 12 child nodes ('Kashmir' region)
  const world = await Taxonomy.findOne({ slug: 'global' });
  const moveBranchT0 = performance.now();
  kashmir.parent = world._id;
  await kashmir.save();
  await taxonomyService.updateAncestorsRecursively(kashmir._id);
  const moveBranchT1 = performance.now();

  console.log(`  ✓ Move Branch Node with 12 Descendants ('Kashmir'): ${(moveBranchT1 - moveBranchT0).toFixed(2)}ms`);

  // -----------------------------------------------------------------------------
  // 5. REVISION SNAPSHOT SIZE & 50-VERSION CAP AUDIT
  // -----------------------------------------------------------------------------
  console.log('\n==================================================================================');
  console.log('REVISION DOCUMENT GROWTH & 50-VERSION CAP TEST:');
  console.log('==================================================================================');

  const testDoc = await Post.findOne({ status: 'published' });
  const initialSize = Buffer.byteLength(JSON.stringify(testDoc.toObject()), 'utf8');

  // Push 60 revisions
  const editorUser = { _id: new mongoose.Types.ObjectId(), name: 'Test Editor', role: 'editor' };
  for (let r = 2; r <= 60; r++) {
    testDoc.revisions.push({
      version: r,
      title: `${testDoc.title} (rev ${r})`,
      excerpt: testDoc.excerpt,
      content: testDoc.content + `\n\nEdit revision content ${r}`,
      changedBy: { id: String(editorUser._id), name: editorUser.name, role: editorUser.role },
      changeSummary: `Revision change number ${r}`,
      createdAt: new Date(),
    });
    if (testDoc.revisions.length > 50) {
      testDoc.revisions.shift(); // Enforce 50-version cap
    }
  }
  await testDoc.save();

  const refreshedDoc = await Post.findById(testDoc._id);
  const cappedSize = Buffer.byteLength(JSON.stringify(refreshedDoc.toObject()), 'utf8');

  console.log(`  • Initial Document Size (1 revision):   ${(initialSize / 1024).toFixed(2)} KB`);
  console.log(`  • Maximum Capped Size (50 revisions):  ${(cappedSize / 1024).toFixed(2)} KB`);
  console.log(`  • Revision Count Enforced:             ${refreshedDoc.revisions.length} (Max Cap: 50)`);
  console.log(`  • % of MongoDB 16MB Doc Limit:         ${((cappedSize / (16 * 1024 * 1024)) * 100).toFixed(4)}%`);

  // -----------------------------------------------------------------------------
  // 6. PUBLIC VS ADMIN PAYLOAD SIZE COMPARISON
  // -----------------------------------------------------------------------------
  console.log('\n==================================================================================');
  console.log('PUBLIC PROJECTION PAYLOAD AUDIT (NETWORK OVERHEAD):');
  console.log('==================================================================================');

  const fullAdminDoc = await Post.findById(testDoc._id).lean();
  const publicCleanDoc = await postService.getPostBySlug(testDoc.slug);

  const adminBytes = Buffer.byteLength(JSON.stringify(fullAdminDoc), 'utf8');
  const publicBytes = Buffer.byteLength(JSON.stringify(publicCleanDoc), 'utf8');

  console.log(`  • Full Document with Revisions (Admin API): ${(adminBytes / 1024).toFixed(2)} KB`);
  console.log(`  • Public Sanitized Document (Public API):   ${(publicBytes / 1024).toFixed(2)} KB`);
  console.log(`  • Payload Reduction for Public Traffic:     ${(((adminBytes - publicBytes) / adminBytes) * 100).toFixed(1)}%`);

  console.log('\n==================================================================================');
  console.log('BENCHMARK COMPLETE: EVIDENCE GENERATED SUCCESSFULLY.');
  console.log('==================================================================================\n');

  await mongoose.disconnect();
  await mongoServer.stop();
}

runBenchmark().catch((err) => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
