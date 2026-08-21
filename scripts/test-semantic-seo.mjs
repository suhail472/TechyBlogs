/**
 * TEST SUITE: Semantic Word-Level SEO, Intent Classification & Keyword Intelligence
 */
import assert from 'assert';
import seoService from '../src/lib/services/seo.service.js';

console.log('🧪 Starting Semantic Word-Level SEO Test Suite...\n');

// 1. Full Content Semantic Analysis
console.log('👉 [1/4] Testing Word-Level Content Analysis with Primary Keyword Placement...');
const sampleArticle = {
  title: 'Complete Guide to Next.js 15 App Router and React Server Components',
  content: `
Next.js 15 App Router revolutionizes full-stack React development by providing hybrid rendering out of the box.

## Architecture Overview
In this guide, we dive deep into how Next.js 15 handles asynchronous requests and server components.

## Practical Examples
Here are hands-on patterns for data fetching.

### Dynamic Routes
Nested layouts allow granular caching.
  `,
  excerpt: 'A comprehensive guide explaining the Next.js 15 App Router architecture and server components.',
  metaDescription: 'Explore the full guide to Next.js 15 App Router and React Server Components with practical examples.',
  slug: 'nextjs-15-app-router-guide',
  primaryKeyword: 'Next.js 15',
  secondaryKeywords: ['App Router', 'React Server Components', 'Tailwind CSS'],
};

const analysis = seoService.analyzeContentSemantics(sampleArticle);

assert.ok(analysis.wordCount > 30, 'Should calculate word count');
assert.strictEqual(analysis.headingStructure.h1Count, 0, 'No H1 in markdown body (title is H1)');
assert.strictEqual(analysis.headingStructure.h2Count, 2, 'Should detect 2 H2 headings');
assert.strictEqual(analysis.headingStructure.h3Count, 1, 'Should detect 1 H3 heading');
assert.strictEqual(analysis.headingStructure.issues.length, 0, 'Clean heading structure without level skipping');

assert.ok(analysis.keywordAnalysis, 'Should analyze primary keyword');
assert.strictEqual(analysis.keywordAnalysis.placements.title, true, 'Primary keyword in title');
assert.strictEqual(analysis.keywordAnalysis.placements.lead, true, 'Primary keyword in lead paragraph');
assert.strictEqual(analysis.keywordAnalysis.placements.metaDescription, true, 'Primary keyword in meta description');
assert.strictEqual(analysis.keywordAnalysis.placements.headings, true, 'Primary keyword in headings');
console.log('   ✓ Primary keyword placements:', analysis.keywordAnalysis.placements);
console.log('   ✓ Density:', `${analysis.keywordAnalysis.density}% (${analysis.keywordAnalysis.densityStatus})`);

// 2. Secondary Keywords Check
console.log('\n👉 [2/4] Testing Secondary Keywords Coverage...');
const foundSecondary = analysis.secondaryKeywords.filter(sk => sk.found);
assert.strictEqual(foundSecondary.length, 2, 'Should find 2 of the 3 secondary keywords');
console.log('   ✓ Found secondary keywords:', foundSecondary.map(s => s.keyword).join(', '));

// 3. Heading Hierarchy Violations Detector
console.log('\n👉 [3/4] Testing Heading Hierarchy Error Detection (Skipped Levels & Duplicate H1)...');
const badHeadingsArticle = {
  title: 'Bad Headings Article',
  content: `
# Duplicate H1 in body
Intro text.
### Skipped Level H3 without H2
More text.
# Another H1 in body
  `,
};
const badAnalysis = seoService.analyzeContentSemantics(badHeadingsArticle);
assert.ok(badAnalysis.headingStructure.issues.length >= 2, 'Should detect multiple H1s and skipped heading levels');
console.log('   ✓ Correctly flagged heading issues:', badAnalysis.headingStructure.issues);

// 4. Transparent SEO Score Card
console.log('\n👉 [4/4] Testing Transparent SEO Scorecard...');
assert.ok(analysis.score.score >= 70, 'Comprehensive article should earn high score');
assert.ok(['EXCELLENT', 'GOOD'].includes(analysis.score.rating), 'Rating should be GOOD or EXCELLENT');
console.log(`   ✓ Score: ${analysis.score.score}% (${analysis.score.rating}) with ${analysis.score.factors.length} verified factors`);

console.log('\n🎉 ALL SEMANTIC WORD-LEVEL SEO TESTS PASSED (4/4)!');
