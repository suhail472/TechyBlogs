import mongoose from 'mongoose';
import fs from 'fs';

// Load .env.local
if (fs.existsSync('.env.local')) {
  const envConfig = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const BASE_URL = 'http://localhost:3000';

async function runModerationTestSuite() {
  console.log('\n======================================================');
  console.log('TEACHYBLOGS AI — COMMUNITY SAFETY & MODERATION TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teachyblogs');
  const Comment = (await import('../src/lib/models/comment.model.js')).default;
  const { analyzeCommentContent } = await import('../src/lib/ai/moderation.service.js');
  const { validateModerationOutput } = await import('../src/lib/ai/moderation.schema.js');
  const commentService = (await import('../src/lib/services/comment.service.js')).default;

  // 1. Schema Normalization & Validation Tests
  console.log('1. Testing Output Schema Validation & Normalization...');
  {
    const rawSafe = {
      classification: 'safe',
      severity: 0,
      confidence: 0.96,
      categories: ['discussion'],
      targetType: 'none',
      recommendedAction: 'allow',
      reason: 'Standard civil discussion.',
    };
    const validSafe = validateModerationOutput(rawSafe);
    assert(validSafe.classification === 'safe', 'Valid safe classification preserved');
    assert(validSafe.severity === 0, 'Severity 0 normalized');
    assert(validSafe.confidence === 0.96, 'Confidence 0.96 normalized');
    assert(validSafe.recommendedAction === 'allow', 'Allow action retained for safe classification');

    // Quotation Override Protection
    const rawQuotation = {
      classification: 'abusive',
      severity: 3,
      confidence: 0.91,
      isQuotedContent: true,
      isCondemnation: true,
      reason: 'Quotes a slur to condemn it.',
    };
    const protectedQuote = validateModerationOutput(rawQuotation);
    assert(protectedQuote.classification === 'safe', 'Quotation with condemnation automatically overridden to safe');
    assert(protectedQuote.severity === 0, 'Quotation severity reset to 0');
    assert(protectedQuote.recommendedAction === 'allow', 'Quotation recommendedAction set to allow');

    // Sensitive Category Confidence Boundary
    const rawLowConfIdentity = {
      classification: 'abusive',
      severity: 2,
      confidence: 0.72,
      targetType: 'protected_group',
      categories: ['identity_mention'],
      recommendedAction: 'hold',
    };
    const routedToReview = validateModerationOutput(rawLowConfIdentity);
    assert(routedToReview.classification === 'review', 'Low-confidence (<0.85) protected group classification routed to review');
    assert(routedToReview.recommendedAction === 'review', 'Action safely clamped to human review');
  }

  // 2. Direct Content Intelligence Analysis Tests
  console.log('\n2. Testing AI Content Safety Intelligence...');
  {
    // A. Safe ideological disagreement
    console.log('  Testing safe ideological disagreement...');
    const resA = await analyzeCommentContent({
      text: 'I strongly disagree with this architectural pattern. Microservices add unnecessary operational complexity for small teams.',
    });
    assert(resA.classification === 'safe', 'Constructive technical disagreement classified as SAFE');
    assert(resA.severity === 0, 'Technical critique severity is 0');
    assert(resA.recommendedAction === 'allow', 'Technical critique recommendedAction is allow');

    // B. Direct personal harassment
    console.log('  Testing targeted personal insult...');
    const resB = await analyzeCommentContent({
      text: 'You are a completely worthless idiot and you should delete your account.',
    });
    assert(['review', 'abusive'].includes(resB.classification), 'Personal attack detected as review/abusive');
    assert(resB.severity >= 1, 'Harassment severity >= 1');
    assert(resB.targetType === 'individual', 'Target correctly identified as individual');

    // C. Violent threat
    console.log('  Testing physical violent threat...');
    const resC = await analyzeCommentContent({
      text: 'I will find where you live and beat you to death for writing this article.',
    });
    assert(['abusive', 'severe'].includes(resC.classification), 'Violent threat classified as abusive/severe');
    assert(resC.severity >= 3, 'Violent threat severity >= 3');
    assert(resC.isThreat === true, 'isThreat flag set to true');
    assert(resC.recommendedAction === 'hold' || resC.recommendedAction === 'review', 'Violent threat recommendedAction is hold/review');

    // D. Caching verification
    console.log('  Testing AI response caching...');
    const resCached = await analyzeCommentContent({
      text: 'I strongly disagree with this architectural pattern. Microservices add unnecessary operational complexity for small teams.',
    });
    assert(resCached.cached === true, 'Identical comment text is served from fast cache without repeat LLM call');
  }

  // 3. Comment Creation & Storage Lifecycle
  console.log('\n3. Testing End-to-End Comment Lifecycle & Moderation...');
  {
    const testPost = await mongoose.connection.collection('posts').findOne({ status: 'published' });
    if (!testPost) {
      console.warn('  ⚠️ No published post found for integration test.');
    } else {
      const created = await commentService.createComment(
        {
          slug: testPost.slug,
          name: 'AI Moderation Tester',
          text: 'This is an excellent explanation of Next.js architecture and server components.',
        },
        null,
        '192.168.1.105'
      );

      assert(Boolean(created._id), 'Comment successfully created');

      const savedComment = await Comment.findById(created._id).lean();
      assert(Boolean(savedComment.aiModeration), 'aiModeration object attached to comment in database');
      assert(savedComment.aiModeration.classification === 'safe', 'Comment accurately evaluated as safe');
      assert(savedComment.aiModeration.severity === 0, 'Stored severity is 0');

      // 4. Public API Privacy Projection
      console.log('\n4. Testing Public API Privacy Projection...');
      const publicComments = await commentService.getCommentsBySlug(testPost.slug);
      for (const pc of publicComments) {
        assert(pc.aiModeration === undefined, 'aiModeration is NOT exposed in public API projection');
        assert(pc.moderatorNotes === undefined, 'moderatorNotes is NOT exposed in public API projection');
        assert(pc.ipHash === undefined, 'ipHash is NOT exposed in public API projection');
        assert(pc.reports === undefined, 'reports is NOT exposed in public API projection');
      }

      // 5. Human Moderator Override & Audit History
      console.log('\n5. Testing Human Moderator Override Audit Tracking...');
      const modUser = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Senior Moderator',
        role: 'editor',
      };

      // Moderator approves comment
      const modResult = await commentService.moderateComment(created._id, 'approved', modUser, 'Editorial verification complete');
      assert(modResult.success === true, 'Comment moderation succeeded');

      const auditedComment = await Comment.findById(created._id).lean();
      const lastHistory = auditedComment.moderationHistory[auditedComment.moderationHistory.length - 1];
      assert(lastHistory.action === 'approved', 'Moderation history records action');
      assert(lastHistory.moderator.name === 'Senior Moderator', 'Moderator name recorded');
      assert(lastHistory.aiRecommendation === 'allow', 'AI recommendation recorded in history');
      assert(lastHistory.moderatorOverride === false, 'Matching decision recorded as moderatorOverride: false');

      // Clean up test comment
      await Comment.deleteOne({ _id: created._id });
    }
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runModerationTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
