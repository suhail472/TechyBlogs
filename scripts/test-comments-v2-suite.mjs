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
import connectToDatabase from '../src/lib/db.js';
import Comment from '../src/lib/models/comment.model.js';
import Post from '../src/lib/models/post.model.js';
import commentService from '../src/lib/services/comment.service.js';

async function runCommentsV2TestSuite() {
  console.log('\n================================================================');
  console.log('TECHYBLOGS — COMMUNITY COMMENTS 2.0 VERIFICATION & RED-TEAM');
  console.log('================================================================\n');

  await connectToDatabase();

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

  // 1. Seed or find a published post
  const now = new Date();
  let post = await Post.findOne({ status: 'published', publishedAt: { $lte: now } });
  if (!post) {
    post = await Post.create({
      title: 'Community Comments 2.0 Test Article',
      slug: 'comments-v2-test-article',
      content: 'This is a test article for comments 2.0 evaluation.',
      author: 'Suheel Hilal',
      status: 'published',
      publishedAt: new Date(now.getTime() - 10000),
    });
  }

  const slug = post.slug;
  const userA = { _id: new mongoose.Types.ObjectId(), name: 'Abdul Rehman', role: 'contributor', avatar: '' };
  const userB = { _id: new mongoose.Types.ObjectId(), name: 'Farooq Ahmad', role: 'contributor', avatar: '' };
  const moderator = { _id: new mongoose.Types.ObjectId(), name: 'Editor Sarah', role: 'editor', avatar: '' };

  const createdIds = [];

  try {
    // ----------------------------------------------------------------
    // TEST 1: Authenticated Comment Creation & Identity Binding
    // ----------------------------------------------------------------
    console.log('1. Testing Authenticated Comment Creation & Identity...');
    const commentA = await commentService.createComment(
      {
        slug,
        text: 'This is an insightful architectural analysis. Thanks for publishing!',
      },
      userA,
      '192.168.20.1'
    );
    createdIds.push(commentA._id);

    assert(commentA.status === 'approved', 'Safe authenticated comment auto-approved immediately');
    assert(commentA.autoApproved === true, 'autoApproved flag set to true');

    const docA = await Comment.findById(commentA._id).lean();
    assert(String(docA.author) === String(userA._id), 'Comment author bound to authenticated user ID');
    assert(String(docA.user) === String(userA._id), 'Comment user bound to authenticated user ID');
    assert(docA.name === userA.name, 'Author display name matches authenticated user');

    // ----------------------------------------------------------------
    // TEST 2: Nested Reply Creation & Thread Hierarchy
    // ----------------------------------------------------------------
    console.log('\n2. Testing Nested Reply Creation & Thread Hierarchy...');
    const replyA1 = await commentService.createComment(
      {
        slug,
        text: 'I agree with your point about distributed edge caching.',
        parentId: commentA._id,
      },
      userB,
      '192.168.20.2'
    );
    createdIds.push(replyA1._id);

    assert(replyA1.status === 'approved', 'Nested reply auto-approved immediately');
    const docReply = await Comment.findById(replyA1._id).lean();
    assert(String(docReply.parent) === String(commentA._id), 'Reply correctly points to parent comment');

    // ----------------------------------------------------------------
    // TEST 3: Reactions (Like / Dislike / Toggle / Flip)
    // ----------------------------------------------------------------
    console.log('\n3. Testing Like & Dislike Reactions...');
    
    // User B likes Comment A
    const react1 = await commentService.reactToComment(commentA._id, 'like', userB);
    assert(react1.likesCount === 1, 'Like added: likesCount is 1');
    assert(react1.userReaction === 'like', 'userReaction returns "like"');

    // User B likes Comment A again (toggle off)
    const react2 = await commentService.reactToComment(commentA._id, 'like', userB);
    assert(react2.likesCount === 0, 'Like toggled off: likesCount is 0');
    assert(react2.userReaction === null, 'userReaction returns null');

    // User B dislikes Comment A
    const react3 = await commentService.reactToComment(commentA._id, 'dislike', userB);
    assert(react3.dislikesCount === 1, 'Dislike added: dislikesCount is 1');
    assert(react3.userReaction === 'dislike', 'userReaction returns "dislike"');

    // User B switches from dislike to like directly
    const react4 = await commentService.reactToComment(commentA._id, 'like', userB);
    assert(react4.likesCount === 1, 'Switched to like: likesCount is 1');
    assert(react4.dislikesCount === 0, 'Dislike cleared: dislikesCount is 0');
    assert(react4.userReaction === 'like', 'userReaction flipped to "like"');

    // Unauthenticated reaction rejected
    let unauthFailed = false;
    try {
      await commentService.reactToComment(commentA._id, 'like', null);
    } catch (e) {
      unauthFailed = true;
    }
    assert(unauthFailed, 'Unauthenticated reaction strictly rejected');

    // ----------------------------------------------------------------
    // TEST 4: Comment Ownership & Cascade Deletion Red-Team
    // ----------------------------------------------------------------
    console.log('\n4. Testing Comment Ownership & Thread Cascade Deletion...');
    
    // Red-Team Attack: User B attempts to delete User A's comment
    let attackBlocked = false;
    try {
      await commentService.deleteComment(commentA._id, userB);
    } catch (e) {
      attackBlocked = e.message.includes('Not authorized');
    }
    assert(attackBlocked, 'User B blocked with 403 when trying to delete User A\'s comment');

    // Owner (User A) deletes parent comment -> Cascade deletes parent AND all replies!
    const ownerDelete = await commentService.deleteComment(commentA._id, userA);
    assert(ownerDelete.success === true, 'Owner successfully deleted own parent comment');
    assert(ownerDelete.deletedCount === 2, `Cascade deletion removed parent and replies (count: ${ownerDelete.deletedCount})`);

    const deletedParentDoc = await Comment.findById(commentA._id).lean();
    assert(deletedParentDoc.status === 'deleted', 'Parent comment status marked as deleted');
    assert(deletedParentDoc.isDeleted === true, 'Parent comment isDeleted flag set to true');

    const deletedChildDoc = await Comment.findById(replyA1._id).lean();
    assert(deletedChildDoc.status === 'deleted', 'Child reply status cascade marked as deleted');
    assert(deletedChildDoc.isDeleted === true, 'Child reply isDeleted flag cascade set to true');

    // ----------------------------------------------------------------
    // TEST 5: Public Thread Retrieval & Privacy Verification
    // ----------------------------------------------------------------
    console.log('\n5. Testing Public Discussion Retrieval & Privacy Shield...');
    
    // Create another clean comment with reply
    const parent2 = await commentService.createComment(
      { slug, text: 'Second discussion thread topic.' },
      userA,
      '192.168.20.5'
    );
    const child2 = await commentService.createComment(
      { slug, text: 'Second discussion child reply.', parentId: parent2._id },
      userB,
      '192.168.20.6'
    );
    createdIds.push(parent2._id, child2._id);

    const publicFeed = await commentService.getCommentsBySlug(slug);
    assert(Array.isArray(publicFeed), 'getCommentsBySlug returns comment array');

    const feedParent = publicFeed.find((c) => String(c._id) === String(parent2._id));
    assert(feedParent !== undefined, 'Parent comment present in public feed');
    assert(feedParent.text === 'Second discussion thread topic.', 'Active comment text preserved');
    assert(feedParent.email === undefined, 'Author email strictly omitted from public feed');
    assert(feedParent.ipHash === undefined, 'IP hash strictly omitted from public feed');
    assert(feedParent.aiModeration === undefined, 'Internal AI moderation metadata omitted from public feed');
    assert(feedParent.moderatorNotes === undefined, 'Internal moderator notes omitted from public feed');

    console.log('\n================================================================');
    console.log(`COMMENTS 2.0 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
  } finally {
    // Cleanup test comments
    if (createdIds.length > 0) {
      await Comment.deleteMany({ _id: { $in: createdIds } });
    }
  }

  if (failed > 0) process.exit(1);
}

runCommentsV2TestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
