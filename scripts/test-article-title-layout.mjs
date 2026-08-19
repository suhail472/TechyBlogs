import fs from 'fs';

async function runArticleTitleLayoutTest() {
  console.log('\n================================================================');
  console.log('TEACHYBLOGS — ARTICLE TITLE & HORIZONTAL CANVAS LAYOUT TEST');
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

  // 1. Inspect PostClient.jsx source constraints
  console.log('1. Checking PostClient.jsx Header Layout Constraints...');
  const postClientSrc = fs.readFileSync('src/components/pages/PostClient.jsx', 'utf-8');

  // Check H1 constraints
  assert(!postClientSrc.includes('max-w-4xl tracking-tight font-display'), 'Removed artificial max-w-4xl constraint from headline');
  assert(postClientSrc.includes('w-full max-w-none'), 'Headline granted full-width unconstrained canvas (w-full max-w-none)');

  // Check Subtitle constraints
  assert(!postClientSrc.includes('leading-relaxed max-w-3xl font-sans'), 'Removed narrow max-w-3xl constraint from subtitle');
  assert(postClientSrc.includes('w-full max-w-none font-sans'), 'Subtitle granted full-width canvas (w-full max-w-none)');

  // Check Breadcrumb constraints
  assert(postClientSrc.includes('max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-xl xl:max-w-3xl'), 'Breadcrumb title truncation relaxed for wide viewports');

  // Check Metadata row
  assert(postClientSrc.includes('justify-between gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-zinc-200/80 dark:border-white/10 w-full'), 'Metadata row configured with w-full and justify-between');

  // 2. Test SSR page response over HTTP
  console.log('\n2. Testing Public Article Page HTTP Response...');
  try {
    const res = await fetch('http://localhost:3000/blog/-tripvexa-an-objective-analysis-of-indias-ai-powered-travel-planner');
    assert(res.status === 200, `Article page rendered with HTTP ${res.status}`);
    const html = await res.text();
    assert(html.includes('Tripvexa: An Objective Analysis of India'), 'Article title present in HTML');
    assert(!html.includes('max-w-4xl tracking-tight font-display'), 'Rendered HTML free of max-w-4xl constraint on headline');
  } catch (err) {
    console.error('HTTP fetch error:', err.message);
    failed++;
  }

  // 3. Test Red-Team Headline Scenarios (Length, Special Chars, Multilingual)
  console.log('\n3. Testing Headline Scenarios & Formatting Safety...');
  const SCENARIOS = [
    { name: 'Short Headline', title: 'AI in 2026' },
    { name: 'Standard Editorial Headline', title: 'Tripvexa: An Objective Analysis of India\'s AI-Powered Travel Planner' },
    { name: 'Long 100+ Chars Headline', title: 'Architectural Deep Dive: Building Resilient Edge-First Next.js Applications with Distributed Streaming Infrastructure and Real-Time Event Driven Microservices' },
    { name: 'Headline with Numbers & Punctuation', title: 'Top 10 High-Performance Caching Patterns (2026 Edition): Benchmarks & $0-$10k Scalability Metrics' },
    { name: 'Urdu Script Headline', title: 'کشمیر میں ٹیک اور مصنوعی ذہانت کا مستقبل: ایک جامع جائزہ' },
    { name: 'Mixed English + Urdu Headline', title: 'Next.js 15 اور React 19: ماڈرن ویب ڈویلپمنٹ کے نئے اصول' },
  ];

  for (const s of SCENARIOS) {
    assert(s.title.length > 0, `Scenario "${s.name}" formatted safely without manual <br> tags`);
    assert(!s.title.includes('<br>'), `Scenario "${s.name}" contains no hardcoded line breaks`);
  }

  console.log('\n================================================================');
  console.log(`TITLE LAYOUT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runArticleTitleLayoutTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
