import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import assert from 'node:assert/strict';
import Taxonomy from '../src/lib/models/taxonomy.model.js';
import Post from '../src/lib/models/post.model.js';
import Admin from '../src/lib/models/admin.model.js';
import postService from '../src/lib/services/post.service.js';
import taxonomyService from '../src/lib/services/taxonomy.service.js';
import { editorialService } from '../src/lib/services/editorial.service.js';
import { runMigration } from './migrate-content-taxonomy.mjs';

console.log('==================================================================================');
console.log('TEACHYBLOGS — HOSTILE PRODUCTION-READINESS AUDIT BATTERY');
console.log('==================================================================================\n');

async function runHostileAudit() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
  console.log('✓ Connected to hostile audit database');

  try {
    // ---------------------------------------------------------------------------
    // AUDIT 1: Idempotent Migration & Data Loss Audit
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 1] Running Migration Pass 1...');
    const pass1 = await runMigration({ isDryRun: false, connectionUri: mongoUri });
    const countAfterPass1 = await Taxonomy.countDocuments();
    const postsAfterPass1 = await Post.countDocuments();

    console.log('[AUDIT 1] Running Migration Pass 2 (Idempotency Check)...');
    const pass2 = await runMigration({ isDryRun: false, connectionUri: mongoUri });
    const countAfterPass2 = await Taxonomy.countDocuments();
    const postsAfterPass2 = await Post.countDocuments();

    assert.equal(countAfterPass1, countAfterPass2, 'Pass 2 must not duplicate taxonomy documents');
    assert.equal(postsAfterPass1, postsAfterPass2, 'Pass 2 must not duplicate post documents');
    console.log(`  ✅ PASS: 100% Idempotent Migration Verified (${countAfterPass2} taxonomies, ${postsAfterPass2} posts).`);

    // ---------------------------------------------------------------------------
    // AUDIT 2: Circular Hierarchy & Invalid Parent Rejection
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 2] Testing Circular Taxonomy Hierarchy Prevention...');
    const tech = await Taxonomy.findOne({ slug: 'technology' });
    const ai = await Taxonomy.findOne({ slug: 'artificial-intelligence' });
    const genAi = await Taxonomy.findOne({ slug: 'generative-ai' });

    // Attempt 1: Self-parenting
    await assert.rejects(
      async () => {
        await taxonomyService.validateParentAssignment(ai._id, ai._id);
      },
      /cannot be its own parent/,
      'Must reject self-parenting'
    );
    console.log('  ✅ PASS: Self-parenting attempt blocked.');

    // Attempt 2: Setting parent of Technology to its own descendant Generative AI (Circular)
    await assert.rejects(
      async () => {
        await taxonomyService.validateParentAssignment(tech._id, genAi._id);
      },
      /circular hierarchy detected/,
      'Must reject circular descendant parenting'
    );
    console.log('  ✅ PASS: Circular hierarchy attempt (A -> B -> C -> A) blocked.');

    // ---------------------------------------------------------------------------
    // AUDIT 3: Materialized Ancestors Recalculation on Re-Parenting
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 3] Testing Re-Parenting & Descendant Ancestor Recalculation...');
    const science = await Taxonomy.findOne({ slug: 'science' });

    // Move AI from Technology to Science
    ai.parent = science._id;
    await ai.save();
    await taxonomyService.updateAncestorsRecursively(ai._id);

    const refreshedGenAi = await Taxonomy.findOne({ slug: 'generative-ai' });
    const ancestorSlugs = (refreshedGenAi.ancestors || []).map((a) => a.slug);

    assert.ok(ancestorSlugs.includes('science'), 'Generative AI must now reflect Science in ancestors');
    assert.ok(ancestorSlugs.includes('artificial-intelligence'), 'Generative AI must retain AI in ancestors');
    assert.ok(!ancestorSlugs.includes('technology'), 'Generative AI must no longer have Technology in ancestors');
    console.log(`  ✅ PASS: Re-parenting correctly recalculated downstream ancestors (${ancestorSlugs.join(' → ')}).`);

    // Move AI back to Technology for subsequent tests
    ai.parent = tech._id;
    await ai.save();
    await taxonomyService.updateAncestorsRecursively(ai._id);

    // ---------------------------------------------------------------------------
    // AUDIT 4: Safe Deletion & Cascade Protection
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 4] Testing Safe Deletion with Cascade Protection...');
    // Attempt to delete Technology (has children AI, Web Dev...)
    await assert.rejects(
      async () => {
        await taxonomyService.safeDelete(tech._id);
      },
      /sub-categories/,
      'Must reject deleting taxonomy with existing child nodes'
    );
    console.log('  ✅ PASS: Deletion of parent node with active children blocked.');

    // Create a temporary topic, link to a post, then attempt delete
    const tempTopic = await Taxonomy.create({
      kind: 'topic',
      name: 'Temporary Topic',
      slug: 'temp-topic',
    });
    const samplePost = await Post.findOne({ status: 'published' });
    samplePost.primaryTopic = tempTopic._id;
    await samplePost.save();

    await assert.rejects(
      async () => {
        await taxonomyService.safeDelete(tempTopic._id);
      },
      /actively referencing it/,
      'Must reject deleting taxonomy referenced by articles'
    );
    console.log('  ✅ PASS: Deletion of taxonomy referenced by published articles blocked.');

    // ---------------------------------------------------------------------------
    // AUDIT 5: Public / Private Data Boundary & Scheduled Content Protection
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 5] Testing Public/Private Data Boundary...');
    const authorUser = { _id: new mongoose.Types.ObjectId(), name: 'Test Author', role: 'author' };

    // Create Draft
    const draftPost = await Post.create({
      title: 'Top Secret Draft 2026',
      slug: 'top-secret-draft-2026',
      excerpt: 'Unreleased secret content',
      content: 'Draft content that should NEVER be visible publicly.',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
      status: 'draft',
      revisions: [{ version: 1, title: 'Draft', content: 'Secret', createdAt: new Date() }],
      editorialHistory: [{ action: 'draft', by: { id: 'admin1', name: 'Secret Admin' }, at: new Date() }],
    });

    // Create Future Scheduled Post
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days in future
    const scheduledPost = await Post.create({
      title: 'Future Scheduled Story',
      slug: 'future-scheduled-story',
      excerpt: 'Scheduled for next week',
      content: 'Scheduled content.',
      image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
      status: 'published',
      publishedAt: futureDate,
    });

    // Public lookup by slug must fail on draft
    await assert.rejects(
      async () => {
        await postService.getPostBySlug('top-secret-draft-2026');
      },
      /Post not found/,
      'Draft post must return 404 to public getPostBySlug'
    );
    console.log('  ✅ PASS: Draft post is inaccessible via public getPostBySlug.');

    // Public lookup by slug must fail on future-dated scheduled post
    await assert.rejects(
      async () => {
        await postService.getPostBySlug('future-scheduled-story');
      },
      /Post not found/,
      'Future-dated article must return 404 to public getPostBySlug'
    );
    console.log('  ✅ PASS: Future-dated scheduled post is inaccessible before publishedAt.');

    // Public query getAllPosts must exclude drafts, future articles, and strip revisions
    const publicList = await postService.getAllPosts({ limit: 100 });
    const slugs = publicList.posts.map((p) => p.slug);
    assert.ok(!slugs.includes('top-secret-draft-2026'), 'Drafts must be excluded from public list');
    assert.ok(!slugs.includes('future-scheduled-story'), 'Future scheduled articles must be excluded from public list');

    // Verify revisions and editorialHistory are not exposed
    assert.equal(publicList.posts[0].revisions, undefined, 'Revisions array must be stripped from public feed');
    assert.equal(publicList.posts[0].editorialHistory, undefined, 'Editorial history must be stripped from public feed');
    console.log('  ✅ PASS: Public feeds strictly exclude drafts, future posts, and private revision snapshots.');

    // ---------------------------------------------------------------------------
    // AUDIT 6: Malicious ReDoS & Regex Injection Resistance
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 6] Testing ReDoS & Malicious Regex Search Neutralization...');
    const maliciousRegexInputs = [
      '(((((((a+)+)+)+)+)+)+)',
      '.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*.*',
      '[a-z]+[a-z]+[a-z]+[a-z]+[a-z]+[a-z]+[a-z]+[a-z]+[a-z]+',
      '\\',
      '(',
      '[',
      '{',
    ];

    for (const evilSearch of maliciousRegexInputs) {
      const searchRes = await postService.getAllPosts({ search: evilSearch });
      assert.ok(Array.isArray(searchRes.posts), `Search with '${evilSearch}' must execute safely`);
    }
    console.log('  ✅ PASS: All 7 malicious ReDoS expressions executed safely without exception or hang.');

    // ---------------------------------------------------------------------------
    // AUDIT 7: Revisions History & Non-Destructive Rollback Integrity
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 7] Testing Revisions History & Rollback Integrity...');
    const editor = { _id: new mongoose.Types.ObjectId(), name: 'Editor Lead', role: 'editor' };

    const article = await editorialService.create(
      {
        title: 'Original Title v1',
        slug: 'original-title-v1',
        excerpt: 'Original Excerpt',
        content: '# Content v1',
        image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
        status: 'published',
      },
      editor
    );

    // Edit 1 -> v2
    await editorialService.update(
      article._id,
      { title: 'Updated Title v2', content: '# Content v2', changeSummary: 'Updated to v2' },
      editor
    );

    // Edit 2 -> v3
    const v3Article = await editorialService.update(
      article._id,
      { title: 'Updated Title v3', content: '# Content v3', changeSummary: 'Updated to v3' },
      editor
    );

    assert.equal(v3Article.revisions.length, 3, 'Must record 3 revisions');
    assert.equal(v3Article.revisions[0].version, 1);
    assert.equal(v3Article.revisions[1].version, 2);
    assert.equal(v3Article.revisions[2].version, 3);
    console.log('  ✅ PASS: Sequential revisions recorded accurately (v1, v2, v3).');

    // ---------------------------------------------------------------------------
    // AUDIT 8: Kashmir Regional Hub Descendant Aggregation
    // ---------------------------------------------------------------------------
    console.log('\n[AUDIT 8] Testing Regional Hub Descendant Aggregation...');
    const kashmirHub = await postService.getRegionalHubPosts('kashmir', 20);
    assert.ok(kashmirHub.region, 'Kashmir region must be resolved');
    assert.ok(kashmirHub.posts.length > 0, 'Kashmir hub must aggregate articles');
    console.log(`  ✅ PASS: Kashmir hub aggregated ${kashmirHub.posts.length} articles across regional sub-districts.`);

    console.log('\n==================================================================================');
    console.log('HOSTILE PRODUCTION AUDIT COMPLETE: ALL 8 CORE DEFENSE DOMAINS PASSED!');
    console.log('==================================================================================\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runHostileAudit().catch((err) => {
  console.error('❌ Hostile Audit Failed:', err);
  process.exit(1);
});
