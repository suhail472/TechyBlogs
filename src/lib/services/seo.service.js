import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Post, { getPublicPostFilter } from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import Admin from '@/lib/models/admin.model';

const KASHMIR_GEO_ENTITIES = [
  { name: 'Kashmir', slug: 'kashmir', type: 'region', aliases: ['kashmir valley', 'jammu and kashmir', 'j&k', 'jammu & kashmir'] },
  { name: 'Srinagar', slug: 'srinagar', type: 'city', aliases: ['summer capital', 'dal lake', 'lal chowk', 'downtown srinagar'] },
  { name: 'Baramulla', slug: 'baramulla', type: 'district', aliases: ['varmul', 'north kashmir'] },
  { name: 'Anantnag', slug: 'anantnag', type: 'district', aliases: ['islamabad', 'south kashmir'] },
  { name: 'Pulwama', slug: 'pulwama', type: 'district', aliases: ['saffron town', 'pampore', 'awantipora'] },
  { name: 'Budgam', slug: 'budgam', type: 'district', aliases: ['badgam', 'sheikh ul alam airport', 'charar-i-sharief'] },
  { name: 'Kupwara', slug: 'kupwara', type: 'district', aliases: ['frontier district', 'handwara', 'lolab'] },
  { name: 'Ganderbal', slug: 'ganderbal', type: 'district', aliases: ['sonamarg', 'manasbal', 'kangan'] },
  { name: 'Bandipora', slug: 'bandipora', type: 'district', aliases: ['bandipore', 'wular lake', 'gurez'] },
  { name: 'Shopian', slug: 'shopian', type: 'district', aliases: ['apple town', 'shupiyan'] },
  { name: 'Kulgam', slug: 'kulgam', type: 'district', aliases: ['rice bowl', 'aharbal'] },
  { name: 'Jammu', slug: 'jammu', type: 'region', aliases: ['winter capital', 'jammu city', 'tawi'] },
  { name: 'University of Kashmir', slug: 'university-of-kashmir', type: 'institution', aliases: ['kashmir university', 'ku', 'hazratbal campus'] },
  { name: 'NIT Srinagar', slug: 'nit-srinagar', type: 'institution', aliases: ['national institute of technology srinagar'] },
  { name: 'SKIMS', slug: 'skims', type: 'institution', aliases: ['sher-i-kashmir institute of medical sciences', 'soura'] },
  { name: 'SMHS Hospital', slug: 'smhs-hospital', type: 'institution', aliases: ['gmc srinagar', 'shri maharaja hari singh hospital'] },
  { name: 'IUST', slug: 'iust', type: 'institution', aliases: ['islamic university of science and technology', 'awantipora university'] },
];

const KNOWN_TECH_ENTITIES = [
  { name: 'OpenAI', slug: 'openai', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q22670110' },
  { name: 'Google', slug: 'google', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q95' },
  { name: 'Apple', slug: 'apple', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q312' },
  { name: 'Microsoft', slug: 'microsoft', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q2283' },
  { name: 'Meta', slug: 'meta', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q380' },
  { name: 'Amazon', slug: 'amazon', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q3884' },
  { name: 'Nvidia', slug: 'nvidia', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q182477' },
  { name: 'Anthropic', slug: 'anthropic', type: 'company', sameAs: 'https://www.wikidata.org/wiki/Q110759364' },
  { name: 'Next.js', slug: 'nextjs', type: 'technology', sameAs: 'https://nextjs.org' },
  { name: 'React', slug: 'react', type: 'technology', sameAs: 'https://react.dev' },
  { name: 'Python', slug: 'python', type: 'technology', sameAs: 'https://www.python.org' },
  { name: 'Node.js', slug: 'nodejs', type: 'technology', sameAs: 'https://nodejs.org' },
  { name: 'MongoDB', slug: 'mongodb', type: 'technology', sameAs: 'https://www.mongodb.com' },
];

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanMarkdownToPlainText(md = '') {
  if (!md) return '';
  return md
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links
    .replace(/#{1,6}\s+/g, '') // headings
    .replace(/[*_~]{1,3}/g, '') // bold/italic
    .replace(/>\s+/g, '') // blockquotes
    .replace(/[-*+]\s+/g, '') // list items
    .replace(/\n+/g, ' ') // newlines
    .replace(/\s+/g, ' ')
    .trim();
}

class SeoService {
  /**
   * 1. Word-Level Semantic Analyzer & Keyword Intelligence
   */
  analyzeContentSemantics({ title = '', content = '', excerpt = '', metaDescription = '', slug = '', primaryKeyword = '', secondaryKeywords = [] }) {
    const plainContent = cleanMarkdownToPlainText(content);
    const words = plainContent.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
    const totalWords = words.length;

    // Extract headings
    const headingMatches = [...content.matchAll(/^(#{1,6})\s+(.+)$/gm)];
    const headings = headingMatches.map((m) => ({
      level: m[1].length,
      text: m[2].trim(),
    }));

    const h1Count = headings.filter((h) => h.level === 1).length;
    const h2Count = headings.filter((h) => h.level === 2).length;
    const h3Count = headings.filter((h) => h.level === 3).length;

    // Heading structure validation
    const headingIssues = [];
    if (h1Count > 1) {
      headingIssues.push('Multiple H1 headings detected in markdown body (title serves as primary H1). Use H2 for major sections.');
    }
    for (let i = 0; i < headings.length - 1; i++) {
      if (headings[i + 1].level - headings[i].level > 1) {
        headingIssues.push(`Skipped heading level: H${headings[i].level} followed immediately by H${headings[i + 1].level}`);
      }
    }

    // Lead paragraph (First 100 words)
    const firstParagraph = plainContent.split(/\.\s+/)[0] || '';
    const leadWords = words.slice(0, 100).join(' ');

    // Primary Keyword Analysis
    let keywordAnalysis = null;
    const pk = (primaryKeyword || '').trim().toLowerCase();
    if (pk) {
      const pkEscaped = escapeRegex(pk);
      const pkRegex = new RegExp(`\\b${pkEscaped}\\b`, 'gi');
      const inTitle = new RegExp(`\\b${pkEscaped}\\b`, 'i').test(title);
      const inLead = new RegExp(`\\b${pkEscaped}\\b`, 'i').test(leadWords);
      const inMetaDesc = new RegExp(`\\b${pkEscaped}\\b`, 'i').test(metaDescription || excerpt);
      const inSlug = slug.toLowerCase().includes(pk.replace(/\s+/g, '-'));
      const inHeadings = headings.some((h) => new RegExp(`\\b${pkEscaped}\\b`, 'i').test(h.text));

      const count = (plainContent.match(pkRegex) || []).length;
      const density = totalWords > 0 ? ((count * pk.split(/\s+/).length) / totalWords) * 100 : 0;

      let densityStatus = 'good';
      if (count === 0) densityStatus = 'missing';
      else if (density > 3.0) densityStatus = 'overused';
      else if (density < 0.3 && totalWords > 300) densityStatus = 'low';

      keywordAnalysis = {
        keyword: primaryKeyword,
        count,
        density: Number(density.toFixed(2)),
        densityStatus,
        placements: {
          title: inTitle,
          lead: inLead,
          metaDescription: inMetaDesc,
          slug: inSlug,
          headings: inHeadings,
        },
      };
    }

    // Secondary Keywords Analysis
    const secondaryAnalysis = (secondaryKeywords || []).map((sk) => {
      const term = String(sk).trim().toLowerCase();
      if (!term) return null;
      const termRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
      const count = (plainContent.match(termRegex) || []).length;
      return {
        keyword: sk,
        count,
        found: count > 0,
      };
    }).filter(Boolean);

    // Search Intent Classifier
    const intent = this.classifySearchIntent({ title, content: plainContent });

    // Local Signals Classifier
    const localSignals = this.extractLocalGeoSignals({ title, content: plainContent });

    // Entity Recognition
    const recognizedEntities = this.extractEntities({ title, content: plainContent });

    // Transparent SEO Score Computation
    const scoreBreakdown = this.calculateSeoScore({
      title,
      metaDescription: metaDescription || excerpt,
      slug,
      totalWords,
      keywordAnalysis,
      headingIssues,
      h2Count,
      localSignals,
      recognizedEntities,
    });

    return {
      wordCount: totalWords,
      readingTimeMinutes: Math.ceil(totalWords / 200),
      headingStructure: {
        total: headings.length,
        h1Count,
        h2Count,
        h3Count,
        issues: headingIssues,
        headings,
      },
      searchIntent: intent,
      keywordAnalysis,
      secondaryKeywords: secondaryAnalysis,
      localSignals,
      recognizedEntities,
      score: scoreBreakdown,
    };
  }

  /**
   * 2. Search Intent Classification Engine
   */
  classifySearchIntent({ title = '', content = '' }) {
    const combined = `${title} ${content}`.toLowerCase();

    const patterns = {
      local: /\b(in kashmir|in srinagar|in baramulla|in anantnag|jammu|dal lake|lal chowk|kashmir valley|gulmarg|pahalgam|ku|kashmir university)\b/i,
      informational: /\b(what is|how to|why does|guide|tutorial|explained|architecture|introduction|overview|history of|definition|fundamentals)\b/i,
      commercial: /\b(best|review|vs|comparison|top \d+|pricing|features|specs|pros and cons|alternatives|worth it)\b/i,
      transactional: /\b(download|buy|register|apply|admission|enroll|subscribe|install|setup|coupon|discount)\b/i,
      news: /\b(announces|launches|unveils|breaking|reports|today|investigation|update|statement|confirmed|exclusive|crisis|deal|partnership)\b/i,
    };

    const scores = {
      Informational: 0,
      'News / Current Event': 0,
      'Local / Regional': 0,
      'Commercial Investigation': 0,
      Transactional: 0,
    };

    if (patterns.news.test(title)) scores['News / Current Event'] += 4;
    if (patterns.local.test(title)) scores['Local / Regional'] += 4;
    if (patterns.informational.test(title)) scores.Informational += 4;
    if (patterns.commercial.test(title)) scores['Commercial Investigation'] += 4;
    if (patterns.transactional.test(title)) scores.Transactional += 4;

    if (patterns.news.test(combined)) scores['News / Current Event'] += 2;
    if (patterns.local.test(combined)) scores['Local / Regional'] += 2;
    if (patterns.informational.test(combined)) scores.Informational += 2;
    if (patterns.commercial.test(combined)) scores['Commercial Investigation'] += 2;
    if (patterns.transactional.test(combined)) scores.Transactional += 2;

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primaryIntent = sorted[0][1] > 0 ? sorted[0][0] : 'Informational';

    return {
      primary: primaryIntent,
      confidence: sorted[0][1] >= 4 ? 'high' : 'moderate',
      scores,
    };
  }

  /**
   * 3. Local Kashmir Geo Signals Extractor
   */
  extractLocalGeoSignals({ title = '', content = '' }) {
    const combined = `${title} ${content}`.toLowerCase();
    const detected = [];

    for (const item of KASHMIR_GEO_ENTITIES) {
      const allNames = [item.name.toLowerCase(), ...(item.aliases || [])];
      for (const name of allNames) {
        const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i');
        if (regex.test(combined)) {
          const inTitle = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i').test(title);
          if (!detected.some((d) => d.slug === item.slug)) {
            detected.push({
              name: item.name,
              slug: item.slug,
              type: item.type,
              prominentInTitle: inTitle,
            });
          }
          break;
        }
      }
    }

    return {
      isLocalStory: detected.length > 0,
      primaryLocation: detected[0] || null,
      locations: detected,
    };
  }

  /**
   * 4. Entity Disambiguation & Extraction Engine
   */
  extractEntities({ title = '', content = '' }) {
    const combined = `${title} ${content}`;
    const detected = [];

    const allEntities = [...KNOWN_TECH_ENTITIES, ...KASHMIR_GEO_ENTITIES];
    for (const ent of allEntities) {
      const regex = new RegExp(`\\b${escapeRegex(ent.name)}\\b`, 'i');
      if (regex.test(combined)) {
        if (!detected.some((d) => d.slug === ent.slug)) {
          detected.push({
            name: ent.name,
            slug: ent.slug,
            type: ent.type,
            sameAs: ent.sameAs || null,
          });
        }
      }
    }

    return detected;
  }

  /**
   * 5. Transparent Multi-Factor SEO Scorecard
   */
  calculateSeoScore({ title, metaDescription, slug, totalWords, keywordAnalysis, headingIssues, h2Count, localSignals, recognizedEntities }) {
    const factors = [];

    // Factor 1: Headline
    if (title && title.length >= 30 && title.length <= 70) {
      factors.push({ name: 'Title Length', status: 'GOOD', points: 15, max: 15, note: `${title.length} chars (optimal 30–70)` });
    } else if (title && title.length > 0) {
      factors.push({ name: 'Title Length', status: 'NEEDS WORK', points: 8, max: 15, note: `${title.length} chars (recommended 30–70)` });
    } else {
      factors.push({ name: 'Title Length', status: 'MISSING', points: 0, max: 15, note: 'Headline is missing' });
    }

    // Factor 2: Meta Description
    const mdLen = (metaDescription || '').length;
    if (mdLen >= 120 && mdLen <= 160) {
      factors.push({ name: 'Meta Description', status: 'GOOD', points: 15, max: 15, note: `${mdLen} chars (optimal 120–160)` });
    } else if (mdLen > 0) {
      factors.push({ name: 'Meta Description', status: 'NEEDS WORK', points: 8, max: 15, note: `${mdLen} chars (recommended 120–160)` });
    } else {
      factors.push({ name: 'Meta Description', status: 'MISSING', points: 0, max: 15, note: 'Meta description is missing' });
    }

    // Factor 3: Content Depth
    if (totalWords >= 600) {
      factors.push({ name: 'Content Depth', status: 'GOOD', points: 20, max: 20, note: `${totalWords} words (comprehensive longform)` });
    } else if (totalWords >= 300) {
      factors.push({ name: 'Content Depth', status: 'GOOD', points: 15, max: 20, note: `${totalWords} words (standard length)` });
    } else if (totalWords >= 150) {
      factors.push({ name: 'Content Depth', status: 'NEEDS WORK', points: 8, max: 20, note: `${totalWords} words (short brief)` });
    } else {
      factors.push({ name: 'Content Depth', status: 'MISSING', points: 2, max: 20, note: `${totalWords} words (very thin content)` });
    }

    // Factor 4: Heading Hierarchy
    if (headingIssues.length === 0 && h2Count >= 2) {
      factors.push({ name: 'Heading Hierarchy', status: 'GOOD', points: 15, max: 15, note: `${h2Count} section subheadings with clean structure` });
    } else if (headingIssues.length === 0) {
      factors.push({ name: 'Heading Hierarchy', status: 'NEEDS WORK', points: 10, max: 15, note: 'Add at least 2 H2 section headings' });
    } else {
      factors.push({ name: 'Heading Hierarchy', status: 'NEEDS WORK', points: 5, max: 15, note: headingIssues[0] });
    }

    // Factor 5: Keyword & Semantic Placement (if defined)
    if (keywordAnalysis) {
      let kwPoints = 0;
      if (keywordAnalysis.placements.title) kwPoints += 5;
      if (keywordAnalysis.placements.lead) kwPoints += 5;
      if (keywordAnalysis.placements.metaDescription) kwPoints += 5;
      if (keywordAnalysis.placements.slug) kwPoints += 5;

      const kwStatus = kwPoints >= 15 ? 'GOOD' : kwPoints >= 5 ? 'NEEDS WORK' : 'MISSING';
      factors.push({
        name: 'Target Keyword Placement',
        status: kwStatus,
        points: kwPoints,
        max: 20,
        note: `In title: ${keywordAnalysis.placements.title ? '✓' : '✗'}, Lead: ${keywordAnalysis.placements.lead ? '✓' : '✗'}, Meta: ${keywordAnalysis.placements.metaDescription ? '✓' : '✗'}`,
      });
    } else {
      factors.push({
        name: 'Target Keyword',
        status: 'NEEDS WORK',
        points: 10,
        max: 20,
        note: 'Define a primary target keyword for focused analysis',
      });
    }

    // Factor 6: Entities & Canonical Slugs
    if (slug && slug.length >= 5) {
      factors.push({ name: 'URL Slug', status: 'GOOD', points: 15, max: 15, note: `/blog/${slug}` });
    } else {
      factors.push({ name: 'URL Slug', status: 'MISSING', points: 0, max: 15, note: 'Missing URL slug' });
    }

    const earned = factors.reduce((sum, f) => sum + f.points, 0);
    const totalMax = factors.reduce((sum, f) => sum + f.max, 0);
    const overallPercentage = Math.round((earned / totalMax) * 100);

    return {
      score: overallPercentage,
      rating: overallPercentage >= 85 ? 'EXCELLENT' : overallPercentage >= 65 ? 'GOOD' : overallPercentage >= 45 ? 'NEEDS WORK' : 'POOR',
      factors,
    };
  }

  /**
   * 6. Contextual Internal Linking Recommendation Engine
   */
  async getInternalLinkOpportunities({ content = '', currentSlug = '', primaryTopicId = null, primaryRegionId = null }) {
    await connectToDatabase();
    const suggestions = [];
    const plain = cleanMarkdownToPlainText(content).toLowerCase();

    // 1. Taxonomy Topics suggestions
    const topics = await Taxonomy.find({ kind: 'topic', active: true }).select('name slug kind description').lean();
    for (const t of topics) {
      const regex = new RegExp(`\\b${escapeRegex(t.name.toLowerCase())}\\b`, 'i');
      if (regex.test(plain)) {
        suggestions.push({
          type: 'topic',
          anchorText: t.name,
          targetUrl: `/topic/${t.slug}`,
          title: `Explore ${t.name} Topic Cluster`,
          relevance: t._id?.toString() === primaryTopicId?.toString() ? 'high' : 'medium',
        });
      }
    }

    // 2. Regional suggestions (Kashmir & Districts)
    const regions = await Taxonomy.find({ kind: 'region', active: true }).select('name slug isHub description').lean();
    for (const r of regions) {
      const regex = new RegExp(`\\b${escapeRegex(r.name.toLowerCase())}\\b`, 'i');
      if (regex.test(plain)) {
        suggestions.push({
          type: 'region',
          anchorText: r.name,
          targetUrl: r.slug === 'kashmir' ? '/kashmir' : `/region/${r.slug}`,
          title: `View ${r.name} Regional Bureau Coverage`,
          relevance: r._id?.toString() === primaryRegionId?.toString() ? 'high' : 'medium',
        });
      }
    }

    // 3. Relevant Public Articles Suggestions
    const relevantArticles = await Post.find(
      getPublicPostFilter({
        slug: { $ne: currentSlug },
      })
    )
      .sort({ publishedAt: -1 })
      .select('title slug excerpt primaryTopic primaryRegion')
      .limit(20)
      .lean();

    for (const art of relevantArticles) {
      const artWords = art.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      let matchCount = 0;
      for (const w of artWords) {
        if (plain.includes(w)) matchCount++;
      }
      if (matchCount >= 2) {
        suggestions.push({
          type: 'article',
          anchorText: art.title,
          targetUrl: `/blog/${art.slug}`,
          title: `Related Coverage: ${art.title}`,
          relevance: matchCount >= 3 ? 'high' : 'medium',
        });
      }
    }

    // Deduplicate suggestions by targetUrl
    const uniqueMap = new Map();
    for (const s of suggestions) {
      if (!uniqueMap.has(s.targetUrl)) {
        uniqueMap.set(s.targetUrl, s);
      }
    }

    return Array.from(uniqueMap.values()).slice(0, 10);
  }

  /**
   * 7. Multi-Factor Related Stories Ranking Engine
   */
  async getRelatedArticles(post, limit = 4) {
    if (!post) return [];
    await connectToDatabase();

    const excludeId = post._id;
    const currentSlug = post.slug;

    const topicIds = [post.primaryTopic?._id || post.primaryTopic, ...(post.topics || [])].filter(Boolean);
    const regionIds = [post.primaryRegion?._id || post.primaryRegion, ...(post.regions || [])].filter(Boolean);
    const entityIds = (post.entities || []).filter(Boolean);
    const postTags = (post.tags || []).map((t) => String(t).toLowerCase());

    const filter = getPublicPostFilter({
      _id: { $ne: excludeId },
      slug: { $ne: currentSlug },
    });

    const candidates = await Post.find(filter)
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .populate('primaryAuthor', 'name slug avatar')
      .sort({ publishedAt: -1 })
      .limit(30)
      .lean();

    const scored = candidates.map((cand) => {
      let score = 0;

      // 1. Topic Match (High Weight: +40)
      const candTopicIds = [cand.primaryTopic?._id, ...(cand.topics || [])].map((id) => id?.toString()).filter(Boolean);
      for (const tid of topicIds) {
        if (candTopicIds.includes(tid.toString())) {
          score += 40;
          break;
        }
      }

      // 2. Region Match (Weight: +30)
      const candRegionIds = [cand.primaryRegion?._id, ...(cand.regions || [])].map((id) => id?.toString()).filter(Boolean);
      for (const rid of regionIds) {
        if (candRegionIds.includes(rid.toString())) {
          score += 30;
          break;
        }
      }

      // 3. Entity Overlap (Weight: +25)
      const candEntities = (cand.entities || []).map((e) => e?.toString()).filter(Boolean);
      for (const eid of entityIds) {
        if (candEntities.includes(eid.toString())) {
          score += 25;
          break;
        }
      }

      // 4. Tag Overlap (Weight: +15 per tag, max 30)
      const candTags = (cand.tags || []).map((t) => String(t).toLowerCase());
      let tagOverlap = 0;
      for (const tag of postTags) {
        if (candTags.includes(tag)) tagOverlap++;
      }
      score += Math.min(tagOverlap * 15, 30);

      // 5. Recency Boost (Published within last 30 days: +10)
      if (cand.publishedAt && Date.now() - new Date(cand.publishedAt).getTime() < 30 * 24 * 3600 * 1000) {
        score += 10;
      }

      return {
        ...cand,
        relevanceScore: score,
      };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore || new Date(b.publishedAt) - new Date(a.publishedAt));
    return scored.slice(0, limit);
  }

  /**
   * 8. Site-Wide SEO Audit Scanner for Admin Dashboard
   */
  async runSiteAudit() {
    await connectToDatabase();
    const publicFilter = getPublicPostFilter();

    const [
      allPublicPosts,
      allTaxonomies,
      allAuthors,
    ] = await Promise.all([
      Post.find(publicFilter)
        .select('title slug excerpt metaDescription keywords seo image author primaryTopic primaryRegion tags publishedAt updatedAt')
        .populate('primaryTopic', 'name slug')
        .populate('primaryRegion', 'name slug')
        .lean(),
      Taxonomy.find({ active: true }).lean(),
      Admin.find({ status: 'active' }).select('name slug title bio seo').lean(),
    ]);

    const totalArticles = allPublicPosts.length;
    const missingMetaDesc = [];
    const missingSeoTitle = [];
    const missingSocialImage = [];
    const orphanArticles = [];
    const thinTaxonomies = [];
    const titleCounts = new Map();
    const duplicateTitles = [];

    // Analyze public articles
    for (const post of allPublicPosts) {
      const meta = (post.seo?.description || post.metaDescription || post.excerpt || '').trim();
      if (!meta) missingMetaDesc.push({ id: post._id, title: post.title, slug: post.slug });

      const title = (post.seo?.title || post.title || '').trim();
      if (!title || title.length < 20) missingSeoTitle.push({ id: post._id, title: post.title, slug: post.slug });

      const img = post.seo?.socialImage || post.image;
      if (!img) missingSocialImage.push({ id: post._id, title: post.title, slug: post.slug });

      // Check orphan status (no topic, no region, no tags)
      if (!post.primaryTopic && (!post.tags || post.tags.length === 0) && !post.primaryRegion) {
        orphanArticles.push({ id: post._id, title: post.title, slug: post.slug });
      }

      // Check duplicate titles
      const normalizedTitle = title.toLowerCase();
      titleCounts.set(normalizedTitle, (titleCounts.get(normalizedTitle) || 0) + 1);
    }

    for (const [t, count] of titleCounts.entries()) {
      if (count > 1) duplicateTitles.push({ title: t, occurrences: count });
    }

    // Analyze taxonomies for thin content
    for (const tax of allTaxonomies) {
      if (['topic', 'region', 'section'].includes(tax.kind)) {
        const query = getPublicPostFilter({
          $or: [
            { primaryTopic: tax._id },
            { topics: tax._id },
            { primaryRegion: tax._id },
            { regions: tax._id },
            { primarySection: tax._id },
            { categories: tax.name },
            { tags: tax.slug },
          ],
        });
        const count = await Post.countDocuments(query);
        if (count === 0) {
          thinTaxonomies.push({
            id: tax._id,
            name: tax.name,
            slug: tax.slug,
            kind: tax.kind,
            articlesCount: 0,
            indexable: tax.seo?.indexable !== false,
          });
        }
      }
    }

    // Kashmir district coverage gaps
    const kashmirDistricts = KASHMIR_GEO_ENTITIES.filter((e) => ['district', 'city'].includes(e.type));
    const districtCoverage = [];
    for (const dist of kashmirDistricts) {
      const query = getPublicPostFilter({
        $or: [
          { tags: dist.slug },
          { tags: new RegExp(`^${escapeRegex(dist.name)}$`, 'i') },
          { title: new RegExp(`\\b${escapeRegex(dist.name)}\\b`, 'i') },
          { excerpt: new RegExp(`\\b${escapeRegex(dist.name)}\\b`, 'i') },
        ],
      });
      const count = await Post.countDocuments(query);
      districtCoverage.push({
        district: dist.name,
        slug: dist.slug,
        articlesCount: count,
        status: count >= 5 ? 'Strong Coverage' : count >= 1 ? 'Developing' : 'Coverage Gap',
      });
    }

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalArticles,
        indexableArticles: allPublicPosts.filter((p) => p.seo?.indexable !== false).length,
        missingMetaDescriptionCount: missingMetaDesc.length,
        missingSeoTitleCount: missingSeoTitle.length,
        missingSocialImageCount: missingSocialImage.length,
        orphanArticlesCount: orphanArticles.length,
        thinTaxonomiesCount: thinTaxonomies.length,
        duplicateTitlesCount: duplicateTitles.length,
      },
      missingMetaDesc,
      missingSeoTitle,
      missingSocialImage,
      orphanArticles,
      thinTaxonomies,
      duplicateTitles,
      districtCoverage,
    };
  }
}

const seoService = new SeoService();
export default seoService;
