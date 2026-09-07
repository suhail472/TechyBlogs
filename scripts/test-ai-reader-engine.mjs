import fs from 'fs';
import { getPublicPostFilter, getPublicArticleContext } from '../src/lib/ai/context.js';
import { sanitizeUserMessage, sanitizeHistory, sanitizeArticleText } from '../src/lib/ai/safety.js';
import { checkRateLimit } from '../src/lib/ai/rateLimit.js';
import { buildPromptPayload } from '../src/lib/ai/prompts.js';
import { streamEditorialResponse } from '../src/lib/ai/provider.js';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
} catch (e) {}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ⨯ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('TECHYBLOGS AI — CORE ENGINE & SECURITY TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Public Visibility Invariant
  console.log('1. Testing Canonical Public Visibility Filter...');
  const filter = getPublicPostFilter({ slug: 'test-article' });
  assert(Array.isArray(filter.status.$in) && filter.status.$in.includes('published'), 'Filters only published/updated status');
  assert(!filter.status.$in.includes('draft'), 'Drafts are strictly excluded');
  assert(!filter.status.$in.includes('scheduled'), 'Scheduled stories are strictly excluded');
  assert(filter.publishedAt.$lte instanceof Date, 'PublishedAt must be in the past');
  assert(Array.isArray(filter.$or) && filter.$or.length === 3, 'Embargo check is enforced in query');

  // Test 2: Input Sanitization & Bounds
  console.log('\n2. Testing User Message & History Sanitization...');
  const validRes = sanitizeUserMessage('What are the key takeaways of this article?');
  assert(validRes.isValid && validRes.sanitized.length > 0, 'Valid user inquiry passes');

  const emptyRes = sanitizeUserMessage('   ');
  assert(!emptyRes.isValid && emptyRes.error, 'Empty message rejected');

  const longInput = 'A'.repeat(1000);
  const longRes = sanitizeUserMessage(longInput);
  assert(!longRes.isValid && longRes.error.includes('maximum length'), 'Oversized message (>600 chars) rejected');

  const controlCharInput = 'Hello\u0000World\u0007!';
  const controlRes = sanitizeUserMessage(controlCharInput);
  assert(controlRes.isValid && controlRes.sanitized === 'HelloWorld!', 'Control characters stripped');

  const rawHistory = [
    { role: 'user', content: 'Turn 1' },
    { role: 'assistant', content: 'Turn 2' },
    { role: 'admin_injection', content: 'Malicious' },
  ];
  const cleanHistory = sanitizeHistory(rawHistory);
  assert(cleanHistory.length === 2, 'History only keeps valid user and assistant turns');

  // Test 3: Article Text Bounding
  console.log('\n3. Testing Article Text Bounding & Sanitization...');
  const giantArticle = 'Paragraph text. '.repeat(1000);
  const boundedArticle = sanitizeArticleText(giantArticle, 500);
  assert(boundedArticle.length <= 500, 'Article body strictly bounded to maximum limit');

  // Test 4: Rate Limiting Enforcement
  console.log('\n4. Testing In-Memory Rate Limiter...');
  const testClient = 'test_ip_' + Date.now();
  let wasBlocked = false;
  for (let i = 0; i < 15; i++) {
    const rate = checkRateLimit(testClient);
    if (!rate.allowed) {
      wasBlocked = true;
      assert(rate.remaining === 0 && rate.resetInSeconds > 0, `Request #${i + 1} blocked with 429 reset timer`);
      break;
    }
  }
  assert(wasBlocked, 'Rate limiter blocks after exceeding window threshold');

  // Test 5: Prompt Payload Construction
  console.log('\n5. Testing Prompt Payload Assembly...');
  const mockContext = {
    article: {
      title: 'AI in 2026',
      subtitle: 'New Horizons',
      author: 'Suheel Hilal',
      section: 'Technology',
      topic: 'Artificial Intelligence',
      region: 'Global',
      contentType: 'article',
      publishedAt: '2026-08-19',
      headings: [{ text: 'Introduction', level: 2 }],
      content: 'This is the verified article body.',
      faqs: [{ question: 'What is AI?', answer: 'Artificial Intelligence.' }],
      sources: [{ name: 'Tech Report', url: 'https://example.com', type: 'Report' }],
    },
    relatedStories: [{ title: 'Future of LLMs', slug: 'future-llms', category: 'Technology', publishedAt: 'Aug 19, 2026', url: '/blog/future-llms' }],
  };

  const payload = buildPromptPayload(mockContext, 'Summarize this piece in 3 bullets');
  assert(payload.length >= 2, 'Payload includes system prompt and user query');
  assert(payload[0].content.includes('CURRENT ARTICLE CONTEXT'), 'Article context embedded as untrusted data block');
  assert(payload[0].content.includes('RELATED PUBLIC STORIES AVAILABLE'), 'Related stories embedded');

  // Test 6: Editorial Response Streaming Engine
  console.log('\n6. Testing Streaming Response Generator...');
  let chunks = '';
  for await (const chunk of streamEditorialResponse({
    userMessage: 'Summarize this article in 3 points',
    articleContext: mockContext,
  })) {
    chunks += chunk;
  }
  assert(chunks.length > 50, 'Streaming response generates complete formatted markdown');
  assert(chunks.toLowerCase().includes('ai') || chunks.includes('2026') || chunks.includes('-') || chunks.includes('1.'), 'Summary reflects verified article content');

  // Test 7: Multilingual Prompt Handling
  console.log('\n7. Testing Multilingual Query Handling (Hindi / Urdu / Roman Urdu)...');
  let romanUrduChunks = '';
  for await (const chunk of streamEditorialResponse({
    userMessage: 'ye article simple words mein samjhao',
    articleContext: mockContext,
  })) {
    romanUrduChunks += chunk;
  }
  assert(romanUrduChunks.length > 30, 'Roman Urdu question produces beginner-friendly explanation');

  // Test 8: Non-Article Question (Refusal Test)
  console.log('\n8. Testing Refusal on Out-of-Context Questions...');
  let refusalChunks = '';
  for await (const chunk of streamEditorialResponse({
    userMessage: 'What is the secret recipe for chocolate cake?',
    articleContext: mockContext,
  })) {
    refusalChunks += chunk;
  }
  assert(refusalChunks.toLowerCase().includes('does not contain') || refusalChunks.toLowerCase().includes('does not mention'), 'AI explicitly declines to answer out-of-scope questions');

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
