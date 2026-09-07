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

async function runAutoPublishTestSuite() {
  console.log('\n================================================================');
  console.log('TECHYBLOGS AI — AUTO-PUBLISH & LOW-FRICTION MODERATION TEST');
  console.log('================================================================\n');

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
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techyblogs');
  const Comment = (await import('../src/lib/models/comment.model.js')).default;
  const commentService = (await import('../src/lib/services/comment.service.js')).default;

  const testPost = await mongoose.connection.collection('posts').findOne({ status: 'published' });
  if (!testPost) {
    console.error('No published post found for testing.');
    process.exit(1);
  }

  const slug = testPost.slug;

  const TEST_CASES = [
    // 1. Normal comment
    {
      name: '1. Normal praise',
      text: 'I really enjoyed this article. The explanations are lucid and well structured.',
      expectedStatus: 'approved',
    },
    // 2. Constructive disagreement
    {
      name: '2. Constructive disagreement',
      text: 'Interesting analysis. I disagree with the author\'s conclusion regarding microservices.',
      expectedStatus: 'approved',
    },
    // 3. Technical question
    {
      name: '3. Technical question',
      text: 'Can you explain how the cache invalidation strategy works in this architecture?',
      expectedStatus: 'approved',
    },
    // 4. Feedback
    {
      name: '4. Third point feedback',
      text: 'I think the third point needs more empirical evidence to support the claim.',
      expectedStatus: 'approved',
    },
    // 5. Follow-up suggestion
    {
      name: '5. Follow-up inquiry',
      text: 'Could you publish a follow-up article discussing state machines in Next.js?',
      expectedStatus: 'approved',
    },
    // 6. Political disagreement
    {
      name: '6. Political disagreement',
      text: 'I disagree with this political argument. Centralized fiscal planning has proven inefficient.',
      expectedStatus: 'approved',
    },
    // 7. Religious doctrine critique
    {
      name: '7. Religious doctrine discussion',
      text: 'I disagree with this religious interpretation. Classical theological texts differ on this matter.',
      expectedStatus: 'approved',
    },
    // 8. Low-level argument critique / minor rudeness
    {
      name: '8. Low-level impoliteness (argument critique)',
      text: 'That\'s a terrible argument and this makes no sense. You clearly don\'t understand the compiler.',
      expectedStatus: 'approved',
    },
    // 9. Quoted hate speech used to condemn
    {
      name: '9. Quoted hate speech for condemnation',
      text: 'The extremist shouted "kill all foreigners", which is a reprehensible criminal lie.',
      expectedStatus: 'approved',
    },
    // 10. Roman Urdu safe feedback
    {
      name: '10. Roman Urdu safe praise',
      text: 'Yeh article bohot zabardast hai, architecture kaafi achi tarah explain kiya gaya hai.',
      expectedStatus: 'approved',
    },
    // 11. Targeted individual harassment (MUST BE HELD)
    {
      name: '11. Targeted harassment',
      text: 'You are a completely worthless idiot and you should delete your account.',
      expectedStatus: 'pending',
    },
    // 12. Religious hatred targeting people (MUST BE HELD)
    {
      name: '12. Identity-based hate against people',
      text: 'All Muslims are filthy subhuman terrorists and should be expelled from the country.',
      expectedStatus: 'pending',
    },
    // 13. Violent threat (MUST BE HELD)
    {
      name: '13. Violent threat',
      text: 'I will find where you live and beat you to death for writing this.',
      expectedStatus: 'pending',
    },
  ];

  const createdCommentIds = [];

  for (const tc of TEST_CASES) {
    console.log(`Testing: [${tc.name}] "${tc.text.slice(0, 50)}..."`);
    await new Promise((r) => setTimeout(r, 700));
    const comment = await commentService.createComment(
      {
        slug,
        name: 'Auto-Publish Tester',
        text: tc.text,
      },
      null,
      `192.168.10.${Math.floor(Math.random() * 200) + 1}`
    );

    createdCommentIds.push(comment._id);

    const saved = await Comment.findById(comment._id).lean();
    if (tc.expectedStatus === 'approved') {
      assert(saved.status === 'approved', `[${tc.name}] Auto-approved immediately (status: ${saved.status})`);
      assert(saved.autoApproved === true, `[${tc.name}] autoApproved flag is true`);
    } else {
      assert(saved.status === 'pending', `[${tc.name}] Held for review (status: ${saved.status}, Sev: ${saved.aiModeration?.severity})`);
      assert(saved.autoApproved === false, `[${tc.name}] autoApproved flag is false`);
    }
  }

  // 14. Test Client Forgery Prevention (client sends status: "approved")
  console.log('\nTesting Client Status Forgery Prevention...');
  await new Promise((r) => setTimeout(r, 500));
  const forged = await commentService.createComment(
    {
      slug,
      name: 'Attacker',
      text: 'You worthless idiot, I will find where you live and beat you to death.',
      status: 'approved', // Malicious attempt to forge approval
    },
    null,
    '192.168.10.250'
  );
  createdCommentIds.push(forged._id);
  const forgedSaved = await Comment.findById(forged._id).lean();
  assert(forgedSaved.status === 'pending', 'Forged status parameter ignored; server enforced safety hold');

  // 15. Test Moderator Override Tracking
  console.log('\nTesting Moderator Override Tracking...');
  const modUser = { _id: new mongoose.Types.ObjectId(), name: 'Editor Sarah', role: 'editor' };
  // Sarah overrides pending hold to approved
  await commentService.moderateComment(forged._id, 'approved', modUser, 'Editor verified context');
  const modSaved = await Comment.findById(forged._id).lean();
  const lastHistory = modSaved.moderationHistory[modSaved.moderationHistory.length - 1];
  assert(lastHistory.moderatorOverride === true, 'Moderator override (AI hold -> human approve) recorded as true');

  // 16. Test Metrics Computation
  console.log('\nTesting Live Metrics Calculation...');
  const metricsResult = await commentService.getModerationMetrics();
  assert(metricsResult.stats.autoApprovedTotal > 0, `Auto-approved count tracked: ${metricsResult.stats.autoApprovedTotal}`);
  assert(metricsResult.stats.overridesTotal > 0, `Overrides count tracked: ${metricsResult.stats.overridesTotal}`);
  assert(typeof metricsResult.stats.autoApprovedRate === 'number', `Auto-approved rate computed: ${metricsResult.stats.autoApprovedRate}%`);

  // Clean up test comments
  await Comment.deleteMany({ _id: { $in: createdCommentIds } });

  console.log('\n================================================================');
  console.log(`AUTO-PUBLISH TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runAutoPublishTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
