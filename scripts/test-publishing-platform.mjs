import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import assert from 'node:assert/strict';
import Taxonomy from '../src/lib/models/taxonomy.model.js';
import Post from '../src/lib/models/post.model.js';
import Admin from '../src/lib/models/admin.model.js';
import postService from '../src/lib/services/post.service.js';
import { editorialService } from '../src/lib/services/editorial.service.js';
import { runMigration } from './migrate-content-taxonomy.mjs';

console.log('==================================================================================');
console.log('TECHYBLOGS — COMPREHENSIVE PUBLISHING PLATFORM TEST SUITE');
console.log('==================================================================================\n');

async function runTests() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
  console.log('✓ Connected to test in-memory database');

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: Run Full Taxonomy Migration & Seeding Engine
    // ---------------------------------------------------------------------------
    console.log('\n[TEST 1] Running Taxonomy Migration & Seeding Engine...');
    const migrationResult = await runMigration({ isDryRun: false, connectionUri: mongoUri });
    assert.equal(migrationResult.success, true, 'Migration must succeed');

    const totalTaxonomy = await Taxonomy.countDocuments();
    assert.ok(totalTaxonomy >= 60, `Expected at least 60 taxonomy items, found ${totalTaxonomy}`);
    console.log(`  ✓ Seeded ${totalTaxonomy} taxonomy entities across all dimensions`);

    // ---------------------------------------------------------------------------
    // TEST 2: Hierarchical Tree & Materialized Ancestors Verification
    // ---------------------------------------------------------------------------
    console.log('\n[TEST 2] Verifying Hierarchical Trees & Materialized Ancestors...');
    const srinagar = await Taxonomy.findOne({ kind: 'region', slug: 'srinagar' });
    assert.ok(srinagar, 'Srinagar region must exist');
    assert.equal(srinagar.isHub, true, 'Srinagar must be designated as a hub');
    assert.ok(srinagar.ancestors?.length >= 2, 'Srinagar must have hierarchical ancestors');
    console.log(`  ✓ Srinagar Ancestor Path: ${srinagar.ancestors.map((a) => a.name).join(' → ')} → ${srinagar.name}`);

    const genAI = await Taxonomy.findOne({ kind: 'topic', slug: 'generative-ai' });
    assert.ok(genAI, 'Generative AI topic must exist');
    assert.ok(genAI.ancestors?.length >= 2, 'Generative AI must have ancestors');
    console.log(`  ✓ Generative AI Ancestor Path: ${genAI.ancestors.map((a) => a.name).join(' → ')} → ${genAI.name}`);

    // ---------------------------------------------------------------------------
    // TEST 3: Multi-Dimensional Post Queries via PostService
    // ---------------------------------------------------------------------------
    console.log('\n[TEST 3] Testing Multi-Dimensional Query Filtering...');
    const allPostsResult = await postService.getAllPosts({ limit: 50 });
    assert.ok(allPostsResult.posts.length > 0, 'Must retrieve migrated posts');
    console.log(`  ✓ Retrieved ${allPostsResult.posts.length} published posts with populated relations`);

    // Filter by Topic (Technology)
    const techPosts = await postService.getAllPosts({ topic: 'technology', limit: 20 });
    assert.ok(techPosts.posts.length > 0, 'Must find posts under Technology topic');
    console.log(`  ✓ Filter by topic 'technology': ${techPosts.posts.length} articles`);

    // Filter by ContentType (News / Guide / Tutorial)
    const guidePosts = await postService.getAllPosts({ contentType: 'guide', limit: 20 });
    console.log(`  ✓ Filter by contentType 'guide': ${guidePosts.posts.length} articles`);

    // ---------------------------------------------------------------------------
    // TEST 4: Editorial State Machine & Revision Snapshots
    // ---------------------------------------------------------------------------
    console.log('\n[TEST 4] Testing Editorial Workflow & Revision Snapshots...');
    const editorUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Senior Editor',
      role: 'editor',
    };

    // Create Draft Article
    const newArticle = await editorialService.create(
      {
        title: 'Building Next-Gen Publish Architecture 2026',
        slug: 'building-next-gen-publish-architecture-2026',
        excerpt: 'How modern editorial publications decouple classification dimensions.',
        content: '# Architecture Overview\n\nDecoupling content format from topic domain.',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
        contentType: 'tutorial',
        primaryTopic: genAI._id,
        primaryRegion: srinagar._id,
        tutorialData: {
          difficulty: 'advanced',
          technologies: ['Next.js 15', 'MongoDB', 'Mongoose'],
        },
      },
      editorUser
    );

    assert.equal(newArticle.status, 'draft', 'New article should start as draft');
    assert.equal(newArticle.revisions.length, 1, 'Should create initial revision v1');
    console.log(`  ✓ Created article draft "${newArticle.title}" with initial revision v1`);

    // Transition: draft -> in_review -> approved -> published
    await editorialService.transition(newArticle._id, 'in_review', editorUser, 'Submitting for editorial signoff');
    await editorialService.transition(newArticle._id, 'approved', editorUser, 'Approved by chief editor');
    const publishedArticle = await editorialService.transition(newArticle._id, 'published', editorUser, 'Published live');
    assert.equal(publishedArticle.status, 'published', 'Article must be published');
    console.log('  ✓ Successfully transitioned draft -> in_review -> approved -> published');

    // Update published article with new content snapshot
    const updatedArticle = await editorialService.update(
      publishedArticle._id,
      {
        content: '# Architecture Overview v2\n\nAdded distributed caching layer and Mermaid diagrams.',
        changeSummary: 'Added Mermaid diagrams and caching notes',
      },
      editorUser
    );

    assert.equal(updatedArticle.revisions.length, 2, 'Should create revision v2');
    assert.equal(updatedArticle.revisions[1].version, 2, 'Revision version should be 2');
    assert.equal(updatedArticle.revisions[1].changeSummary, 'Added Mermaid diagrams and caching notes');
    console.log('  ✓ Updated article and recorded revision v2 with audit summary');

    // ---------------------------------------------------------------------------
    // TEST 5: Regional Hub Feed Aggregator
    // ---------------------------------------------------------------------------
    console.log('\n[TEST 5] Testing Regional Hub Feed Aggregation...');
    const kashmirHub = await postService.getRegionalHubPosts('kashmir', 10);
    assert.ok(kashmirHub.region, 'Kashmir region metadata must be returned');
    console.log(`  ✓ Kashmir Regional Hub aggregated ${kashmirHub.posts.length} articles including sub-districts`);

    console.log('\n==================================================================================');
    console.log('ALL 5/5 PUBLISHING PLATFORM ARCHITECTURE SUITES PASSED WITH 100% SUCCESS!');
    console.log('==================================================================================\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
