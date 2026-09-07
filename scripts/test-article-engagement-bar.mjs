import fs from 'fs';
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf-8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

import connectToDatabase from '../src/lib/db.js';
import Post from '../src/lib/models/post.model.js';

async function runArticleEngagementBarTest() {
  console.log('\n================================================================');
  console.log('TECHYBLOGS — ARTICLE ENGAGEMENT BAR & LIKES VERIFICATION');
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

  // 1. Get existing post or create one
  const post = await Post.findOne({ status: 'published' });
  assert(post !== null, 'Published post found in database');
  const slug = post.slug;
  const initialLikes = post.likes || 0;

  // 2. Test Like Action via API
  console.log('\n1. Testing Article Like API Endpoint...');
  const likeRes = await fetch(`http://localhost:3000/api/posts/slug/${encodeURIComponent(slug)}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'like' }),
  });
  const likeData = await likeRes.json();
  assert(likeRes.status === 200, 'Like API returned HTTP 200');
  assert(likeData.success === true, 'Like API response success is true');
  assert(likeData.likes === initialLikes + 1, `Like count incremented from ${initialLikes} to ${likeData.likes}`);

  // 3. Test Unlike Action via API
  console.log('\n2. Testing Article Unlike API Endpoint (Toggle Off)...');
  const unlikeRes = await fetch(`http://localhost:3000/api/posts/slug/${encodeURIComponent(slug)}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unlike' }),
  });
  const unlikeData = await unlikeRes.json();
  assert(unlikeRes.status === 200, 'Unlike API returned HTTP 200');
  assert(unlikeData.success === true, 'Unlike API response success is true');
  assert(unlikeData.likes === initialLikes, `Like count decremented back to ${initialLikes}`);

  // 4. Test Resilient Slug Variant Matching (stripped dash vs leading dash)
  console.log('\n3. Testing Slug Normalization & Leading-Dash Resilience...');
  const cleanSlug = slug.replace(/^-+/, '');
  const variantRes = await fetch(`http://localhost:3000/api/posts/slug/${encodeURIComponent(cleanSlug)}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'like' }),
  });
  const variantData = await variantRes.json();
  assert(variantRes.status === 200, 'Clean slug variant resolved post with HTTP 200');
  assert(variantData.success === true, 'Like recorded successfully via normalized slug variant');

  // Reset like count back
  await fetch(`http://localhost:3000/api/posts/slug/${encodeURIComponent(cleanSlug)}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'unlike' }),
  });

  // 5. Inspect PostClient.jsx for Floating Bar & Handlers
  console.log('\n4. Inspecting PostClient.jsx Engagement Bar Implementation...');
  const postClientSrc = fs.readFileSync('src/components/pages/PostClient.jsx', 'utf-8');
  assert(postClientSrc.includes('handleLikeClick'), 'PostClient implements handleLikeClick handler');
  assert(postClientSrc.includes('setLiked(nextLiked)'), 'PostClient provides instant optimistic feedback on like click');
  assert(postClientSrc.includes('action: nextLiked ? \'like\' : \'unlike\''), 'PostClient sends action payload for toggle support');
  assert(postClientSrc.includes('localStorage.setItem(`techy-liked-${blog.slug}`, \'true\')'), 'PostClient persists liked state to localStorage');
  assert(postClientSrc.includes('localStorage.removeItem(`techy-liked-${blog.slug}`)'), 'PostClient clears liked state on unlike');

  console.log('\n================================================================');
  console.log(`ENGAGEMENT BAR TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runArticleEngagementBarTest().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
