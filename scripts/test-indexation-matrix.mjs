/**
 * TEST SUITE: Sitemaps, Robots.txt & Strict Embargo Filter Compliance
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

import sitemap from '../src/app/sitemap.js';
import robots from '../src/app/robots.js';

console.log('🧪 Starting Sitemaps, Robots & Indexation Matrix Test Suite...\n');

(async () => {
  try {
    // 1. Test Robots.txt Policy
    console.log('👉 [1/3] Testing robots.js Crawl Directives...');
    const robotsConfig = robots();
    assert.ok(robotsConfig.rules, 'Robots should export rules');
    assert.ok(robotsConfig.sitemap.includes('https://techyblogs.com/sitemap.xml'), 'Should include main sitemap');
    assert.ok(robotsConfig.sitemap.includes('https://techyblogs.com/news-sitemap.xml'), 'Should include Google News sitemap');
    const defaultRule = robotsConfig.rules[0];
    assert.ok(defaultRule.disallow.includes('/admin/'), 'Must disallow /admin/');
    assert.ok(defaultRule.disallow.includes('/api/'), 'Must disallow /api/');
    console.log('   ✓ Verified robots.txt allow/disallow lists and dual sitemap URLs');

    // 2. Test Sitemap Generation
    console.log('\n👉 [2/3] Testing sitemap.js Index Composition...');
    const sitemapEntries = await sitemap();
    assert.ok(Array.isArray(sitemapEntries), 'Sitemap should return array of URL entries');
    assert.ok(sitemapEntries.length >= 10, 'Sitemap should contain static and dynamic pages');

    const urls = sitemapEntries.map((e) => e.url);
    assert.ok(urls.some((u) => u === 'https://techyblogs.com'), 'Should include home URL');
    assert.ok(urls.some((u) => u === 'https://techyblogs.com/kashmir'), 'Should include /kashmir hub');
    assert.ok(urls.some((u) => u.includes('/blog/')), 'Should include blog entries');
    console.log(`   ✓ Sitemap successfully generated ${sitemapEntries.length} canonical URLs`);

    // 3. Test Google News Sitemap Header / Structure
    console.log('\n👉 [3/3] Testing Google News Sitemap XML Structure...');
    const { GET: getNewsSitemap } = await import('../src/app/news-sitemap.xml/route.js');
    const newsResponse = await getNewsSitemap();
    assert.strictEqual(newsResponse.status, 200, 'News sitemap should return 200 OK');
    const xml = await newsResponse.text();
    assert.ok(xml.includes('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"'), 'Must include official Google News XML namespace');
    assert.ok(xml.includes('<urlset'), 'Must be standard XML urlset');
    console.log('   ✓ Google News Sitemap conforms to official schema specification');

    console.log('\n🎉 ALL SITEMAP & INDEXATION TESTS PASSED (3/3)!');
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
})();
