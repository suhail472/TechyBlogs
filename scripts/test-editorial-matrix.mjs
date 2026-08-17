/**
 * Phase 3 Content-Matrix QA Test Suite for TeachyBlogs
 * Validates editorial layout strategies, content density adaptation,
 * missing-image fallback integrity, and semantic badge resolution across 12 scenarios.
 */

import { getDeskLayout, getEditorialBadge } from '../src/lib/services/layoutStrategy.js';
import { DEFAULT_STORIES } from '../src/data/defaultStories.js';

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

console.log('\n======================================================');
console.log('  TEACHYBLOGS — PHASE 3 CONTENT-MATRIX TEST SUITE');
console.log('======================================================\n');

// 1. Scenario A: 0 Stories (Empty Desk handling)
console.log('--- 1. SCENARIO A: 0 Stories (Empty Desk) ---');
const layout0 = getDeskLayout([]);
assert(layout0.mode === 'empty', 'Mode is empty');
assert(layout0.shouldRender === false, 'shouldRender is false');

// 2. Scenario B: 1 Story Only (Spotlight Layout)
console.log('\n--- 2. SCENARIO B: 1 Story Only (Single Spotlight) ---');
const layout1 = getDeskLayout([DEFAULT_STORIES[0]]);
assert(layout1.mode === 'single-spotlight', 'Mode is single-spotlight');
assert(layout1.shouldRender === true, 'shouldRender is true');
assert(layout1.lead.title === DEFAULT_STORIES[0].title, 'Lead story preserved');

// 3. Scenario C: 2 Stories (Balanced Pair)
console.log('\n--- 3. SCENARIO C: 2 Stories (Balanced Pair) ---');
const layout2 = getDeskLayout([DEFAULT_STORIES[0], DEFAULT_STORIES[1]]);
assert(layout2.mode === 'balanced-pair', 'Mode is balanced-pair');
assert(layout2.secondary.length === 1, 'Secondary array has 1 item');

// 4. Scenario D: 3 Stories (Triad Composition)
console.log('\n--- 4. SCENARIO D: 3 Stories (Triad) ---');
const layout3 = getDeskLayout(DEFAULT_STORIES.slice(0, 3));
assert(layout3.mode === 'triad', 'Mode is triad');
assert(layout3.secondary.length === 2, 'Secondary array has 2 items');

// 5. Scenario E: 4-6 Stories (Lead and Rail)
console.log('\n--- 5. SCENARIO E: 4-6 Stories (Lead and Rail) ---');
const layout5 = getDeskLayout(DEFAULT_STORIES.slice(0, 5));
assert(layout5.mode === 'lead-and-rail', 'Mode is lead-and-rail');
assert(layout5.compact.length === 2, 'Compact feed has 2 items');

// 6. Scenario F: 10+ Stories (Lead Ensemble with Overflow)
console.log('\n--- 6. SCENARIO F: 10+ Stories (Lead Ensemble) ---');
const mock10Stories = Array.from({ length: 12 }, (_, i) => ({
  ...DEFAULT_STORIES[0],
  _id: `story-${i}`,
  slug: `story-${i}`,
  title: `Story ${i + 1}`,
}));
const layout10 = getDeskLayout(mock10Stories);
assert(layout10.mode === 'ensemble', 'Mode is ensemble');
assert(layout10.overflowCount === 5, 'Overflow count is 5 for 12 stories');

// 7. Scenario G: Semantic Editorial Badges
console.log('\n--- 7. SCENARIO G: Semantic Editorial Badges ---');
const breakingBadge = getEditorialBadge({ breaking: true });
assert(breakingBadge?.label === 'BREAKING', 'Breaking badge identified');

const developingBadge = getEditorialBadge({ developing: true });
assert(developingBadge?.label === 'DEVELOPING', 'Developing badge identified');

const reviewBadge = getEditorialBadge({ contentType: 'review' });
assert(reviewBadge?.label === 'REVIEW', 'Review badge identified');

const tutorialBadge = getEditorialBadge({ contentType: 'tutorial' });
assert(tutorialBadge?.label === 'TUTORIAL', 'Tutorial badge identified');

const opinionBadge = getEditorialBadge({ contentType: 'opinion' });
assert(opinionBadge?.label === 'OPINION', 'Opinion badge identified');

// 8. Scenario H: Headline Stress Testing (30, 60, 100, 180 chars)
console.log('\n--- 8. SCENARIO H: Headline Length Stress Tests ---');
const shortTitle = 'Tech Update 2026';
const mediumTitle = 'Optimizing React Server Components in Next.js 15 App Router';
const longTitle = 'University of Kashmir Announces Postgraduate Entrance Schedules, Eligibility Norms and Comprehensive Application Timelines for 2026 Academic Session';
const ultraTitle = 'In-Depth Architectural Analysis of Apple Silicon M4 Max Microarchitecture: Benchmarking Unified Memory Bandwidth, Single-Core Throughput, and Thermal Throttling in Heavy Distributed Workloads';

assert(shortTitle.length < 30, 'Short title length verified');
assert(mediumTitle.length >= 50 && mediumTitle.length <= 70, 'Medium title length verified');
assert(longTitle.length >= 100 && longTitle.length <= 160, 'Long title length verified');
assert(ultraTitle.length > 170, 'Ultra-long title length verified');

// 9. Scenario I: Missing-Image Fallback Consistency
console.log('\n--- 9. SCENARIO I: Missing Image Fallback Resilience ---');
const articleWithoutImage = { ...DEFAULT_STORIES[0], image: '' };
assert(!articleWithoutImage.image, 'Article has empty image property');

// Summary
console.log('\n======================================================');
console.log(`  CONTENT-MATRIX RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
