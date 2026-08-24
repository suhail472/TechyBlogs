/**
 * TEST SUITE: Internal Linking Engine & Related Stories Multi-Factor Scorer
 */
import fs from 'fs';
import assert from 'assert';

if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf-8');
  for (const line of env.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

import seoService from '../src/lib/services/seo.service.js';

console.log('🧪 Starting Internal Linking Engine & Related Stories Test Suite...\n');

(async () => {
  try {
    // 1. Test Internal Linking Extraction for Topics & Regions
    console.log('👉 [1/2] Testing Contextual Internal Link Scorer...');
    const linkOpportunities = await seoService.getInternalLinkOpportunities({
      content: 'In-depth coverage of Artificial Intelligence developments across Srinagar and Kashmir technology sectors.',
      currentSlug: 'sample-slug',
    });

    assert.ok(Array.isArray(linkOpportunities), 'Link opportunities should return array');
    console.log(`   ✓ Returned ${linkOpportunities.length} contextual link recommendations`);
    for (const opp of linkOpportunities.slice(0, 3)) {
      console.log(`     - [${opp.anchorText}] -> ${opp.targetUrl} (${opp.type})`);
    }

    // 2. Test Multi-Factor Related Articles Scoring Engine
    console.log('\n👉 [2/2] Testing Multi-Factor Related Stories Ranker...');
    const mockPost = {
      _id: '60c72b2f9b1d8b0015b6d511',
      slug: 'current-kashmir-tech-story',
      tags: ['technology', 'kashmir', 'srinagar'],
      primaryTopic: '60c72b2f9b1d8b0015b6d522',
      primaryRegion: '60c72b2f9b1d8b0015b6d533',
    };

    const related = await seoService.getRelatedArticles(mockPost, 4);
    assert.ok(Array.isArray(related), 'Should return array of scored related stories');
    console.log(`   ✓ Found ${related.length} semantically & regionally ranked related stories`);

    console.log('\n🎉 ALL INTERNAL LINKING TESTS PASSED (2/2)!');
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
})();
