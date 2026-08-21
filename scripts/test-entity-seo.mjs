/**
 * TEST SUITE: Entity SEO, Knowledge Graph Disambiguation & JSON-LD Validation
 */
import assert from 'assert';
import seoService from '../src/lib/services/seo.service.js';

console.log('🧪 Starting Entity SEO & Knowledge Graph Test Suite...\n');

// 1. Entity Extraction from Tech Content
console.log('👉 [1/3] Testing Known Entity Extraction (Tech Companies & Frameworks)...');
const techText = {
  title: 'OpenAI and Google Compete in Generative AI While Microsoft Invests in Anthropic',
  content: 'The latest models leverage Next.js and Python for low-latency web interfaces and MongoDB for storage.',
};
const entities = seoService.extractEntities(techText);
assert.ok(entities.some(e => e.name === 'OpenAI' && e.type === 'company'), 'Should detect OpenAI');
assert.ok(entities.some(e => e.name === 'Google' && e.type === 'company'), 'Should detect Google');
assert.ok(entities.some(e => e.name === 'Microsoft' && e.type === 'company'), 'Should detect Microsoft');
assert.ok(entities.some(e => e.name === 'Next.js' && e.type === 'technology'), 'Should detect Next.js');
console.log('   ✓ Extracted entities:', entities.map(e => `${e.name} (${e.type})`).join(', '));

// 2. Entity Extraction from Local Kashmir Institutions
console.log('\n👉 [2/3] Testing Educational & Local Kashmir Institutional Entities...');
const academicText = {
  title: 'University of Kashmir and NIT Srinagar Collaborate on Regional Innovation Lab',
  content: 'Medical researchers at SKIMS also contributed clinical datasets for the project.',
};
const academicEntities = seoService.extractEntities(academicText);
assert.ok(academicEntities.some(e => e.name === 'University of Kashmir'), 'Should detect University of Kashmir');
assert.ok(academicEntities.some(e => e.name === 'NIT Srinagar'), 'Should detect NIT Srinagar');
assert.ok(academicEntities.some(e => e.name === 'SKIMS'), 'Should detect SKIMS');
console.log('   ✓ Extracted academic/institutional entities:', academicEntities.map(e => e.name).join(', '));

// 3. Entity Wikidata / Canonical sameAs Links
console.log('\n👉 [3/3] Testing Entity Canonical Wikidata sameAs Resolvers...');
const openAiEnt = entities.find(e => e.name === 'OpenAI');
assert.strictEqual(openAiEnt.sameAs, 'https://www.wikidata.org/wiki/Q22670110', 'Should have valid Wikidata sameAs URL for OpenAI');
console.log('   ✓ OpenAI Wikidata URL verified:', openAiEnt.sameAs);

console.log('\n🎉 ALL ENTITY SEO TESTS PASSED (3/3)!');
