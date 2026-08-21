/**
 * TEST SUITE: Local SEO & Kashmir Regional Hub Architecture
 */
import assert from 'assert';
import seoService from '../src/lib/services/seo.service.js';

console.log('🧪 Starting Local SEO & Kashmir Regional Architecture Test Suite...\n');

// 1. Test Local Kashmir Geo Signal Extraction
console.log('👉 [1/4] Testing Kashmir Geo Entity Extraction...');
const kashmirText = {
  title: 'Tech Startups Flourish in Srinagar as Kashmir University Launches Incubation Hub',
  content: 'Entrepreneurs across Srinagar and Baramulla are leveraging new cloud programs. From Hazratbal campus to Lal Chowk, local innovators are building AI applications.',
};
const localSignals = seoService.extractLocalGeoSignals(kashmirText);
assert.strictEqual(localSignals.isLocalStory, true, 'Should detect local Kashmir story');
assert.ok(localSignals.locations.some(l => l.name === 'Srinagar'), 'Should extract Srinagar');
assert.ok(localSignals.locations.some(l => l.name === 'Baramulla'), 'Should extract Baramulla');
console.log('   ✓ Detected local locations:', localSignals.locations.map(l => l.name).join(', '));

// 2. Test Non-Local Story
console.log('\n👉 [2/4] Testing Global Tech Story (No False Positive Local Signals)...');
const globalText = {
  title: 'Next.js 15 Server Actions and React 19 Compiler Deep Dive',
  content: 'Building scalable modern web apps with TypeScript, Tailwind CSS, and distributed databases across global regions.',
};
const nonLocal = seoService.extractLocalGeoSignals(globalText);
assert.strictEqual(nonLocal.isLocalStory, false, 'Global tech story should not be flagged as local Kashmir');
console.log('   ✓ Global story correctly identified as non-local');

// 3. Test Intent Detection for Local Stories
console.log('\n👉 [3/4] Testing Search Intent for Local Kashmir Story...');
const intent = seoService.classifySearchIntent(kashmirText);
assert.strictEqual(intent.primary, 'Local / Regional', 'Should classify search intent as Local / Regional');
console.log('   ✓ Intent classified:', intent.primary, `(${intent.confidence} confidence)`);

// 4. Test District Coverage Matrix
console.log('\n👉 [4/4] Testing Kashmir Districts List...');
const allDistricts = ['Srinagar', 'Baramulla', 'Anantnag', 'Pulwama', 'Budgam', 'Kupwara', 'Ganderbal', 'Bandipora', 'Shopian', 'Kulgam', 'Jammu'];
for (const dist of allDistricts) {
  const signal = seoService.extractLocalGeoSignals({ title: `Annual apple harvest updates in ${dist}`, content: `Farmers in ${dist} reporting yields.` });
  assert.ok(signal.isLocalStory, `Should detect ${dist}`);
}
console.log('   ✓ All 11 Kashmir/J&K districts verified successfully');

console.log('\n🎉 ALL LOCAL SEO TESTS PASSED (4/4)!');
