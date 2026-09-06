import connectToDatabase from '../db.js';
import Post from '../models/post.model.js';
import Taxonomy from '../models/taxonomy.model.js';
import Admin from '../models/admin.model.js';
import { extractHeadings } from '../../utils/markdownEngine.js';
import { sanitizeArticleText } from './safety.js';
import { DEFAULT_STORIES } from '../../data/defaultStories.js';

/**
 * Canonical Public Visibility Query Invariant
 * Strictly guarantees that drafts, scheduled stories, and embargoed content are NEVER exposed.
 */
export function getPublicPostFilter(extra = {}) {
  const now = new Date();
  return {
    ...extra,
    status: { $in: ['published', 'updated'] },
    publishedAt: { $lte: now },
    $or: [
      { embargoAt: null },
      { embargoAt: { $exists: false } },
      { embargoAt: { $lte: now } },
    ],
  };
}

/**
 * Public Projection Specification
 * Excludes all internal CMS metadata, revisions, and audit logs.
 */
const PUBLIC_ARTICLE_PROJECTION = {
  title: 1,
  slug: 1,
  subtitle: 1,
  excerpt: 1,
  content: 1,
  author: 1,
  image: 1,
  primarySection: 1,
  categories: 1,
  primaryTopic: 1,
  topics: 1,
  primaryRegion: 1,
  regions: 1,
  contentType: 1,
  publishedAt: 1,
  faqs: 1,
  sources: 1,
  reviewData: 1,
  tutorialData: 1,
  editorial: 1,
};

/**
 * Retrieve public article context for AI reader assistance
 */
export async function getPublicArticleContext(slug) {
  if (!slug || typeof slug !== 'string') return null;

  const cleanSlug = String(slug).toLowerCase().trim();
  let post = null;

  try {
    await connectToDatabase();
    const query = getPublicPostFilter({ slug: cleanSlug });

    post = await Post.findOne(query)
      .select(PUBLIC_ARTICLE_PROJECTION)
      .populate('primarySection', 'name slug')
      .populate('primaryTopic', 'name slug')
      .populate('primaryRegion', 'name slug')
      .lean();
  } catch (err) {
    console.warn('[AI Context] Database lookup issue, attempting fallback:', err.message);
  }

  // Fallback to DEFAULT_STORIES if not found in DB
  if (!post) {
    const fallback = DEFAULT_STORIES.find((s) => s.slug === cleanSlug);
    if (fallback) {
      post = {
        title: fallback.title,
        slug: fallback.slug,
        subtitle: fallback.subtitle || fallback.excerpt || '',
        excerpt: fallback.excerpt || fallback.subtitle || '',
        content: fallback.content || fallback.excerpt || '',
        author: fallback.author || 'Editorial Bureau',
        image: fallback.image || '',
        primarySection: fallback.primarySection || { name: fallback.category || 'General', slug: (fallback.category || 'general').toLowerCase() },
        primaryTopic: fallback.primaryTopic || null,
        primaryRegion: fallback.primaryRegion || null,
        categories: fallback.categories || (fallback.category ? [fallback.category] : ['General']),
        tags: fallback.tags || [],
        contentType: fallback.contentType || 'article',
        publishedAt: fallback.publishedAt || fallback.date || null,
        faqs: fallback.faqs || [],
        sources: fallback.sources || [],
        reviewData: fallback.reviewData || null,
        tutorialData: fallback.tutorialData || null,
      };
    }
  }

  if (!post) return null;

  // Extract structured headings
  const headings = extractHeadings(post.content || '');

  // Sanitize article body to bounded length (4,000 chars ~ 850 tokens for ultra-fast throughput)
  const cleanBody = sanitizeArticleText(post.content || '', 4000);

  // Retrieve related public stories
  const relatedStories = await getRelatedPublicStories(post);

  const totalWords = (post.content || '').split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(totalWords / 200));
  const rawTopics = [
    post.primarySection?.name,
    post.primaryTopic?.name,
    ...(post.categories || []),
    ...(post.tags || []),
  ].filter(Boolean);
  const uniqueTopics = [...new Set(rawTopics)].slice(0, 6);

  return {
    article: {
      title: post.title,
      slug: post.slug,
      subtitle: post.subtitle || post.excerpt || '',
      author: post.author || 'Editorial Bureau',
      section: post.primarySection?.name || post.categories?.[0] || 'General',
      topic: post.primaryTopic?.name || post.categories?.[1] || null,
      region: post.primaryRegion?.name || null,
      contentType: post.contentType || 'article',
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : null,
      headings: headings.map((h) => ({ text: h.text, level: h.level })),
      content: cleanBody,
      wordCount: totalWords,
      readTime: `${readTimeMin} min read`,
      topics: uniqueTopics,
      faqs: (post.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
      sources: (post.sources || []).map((s) => ({ name: s.name, url: s.url, type: s.type })),
      reviewData: post.reviewData?.rating ? post.reviewData : null,
      tutorialData: post.tutorialData?.difficulty ? post.tutorialData : null,
    },
    relatedStories,
  };
}

/**
 * Retrieve bounded related public stories based on category & topic overlap
 */
export async function getRelatedPublicStories(currentPost, limit = 3) {
  try {
    const category = currentPost.categories?.[0] || currentPost.primarySection?.name || 'Technology';
    const currentId = currentPost._id;

    let related = [];
    if (currentId) {
      const query = getPublicPostFilter({
        _id: { $ne: currentId },
        $or: [
          { primarySection: currentPost.primarySection?._id || currentPost.primarySection },
          { categories: category },
        ],
      });

      related = await Post.find(query)
        .select({
          title: 1,
          slug: 1,
          excerpt: 1,
          subtitle: 1,
          image: 1,
          author: 1,
          categories: 1,
          publishedAt: 1,
        })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .lean();
    }

    if (!related || related.length === 0) {
      const fallbackRelated = DEFAULT_STORIES.filter((s) => s.slug !== currentPost.slug).slice(0, limit);
      return fallbackRelated.map((r) => ({
        title: r.title,
        slug: r.slug,
        excerpt: r.subtitle || r.excerpt || '',
        image: r.image || '',
        category: r.category || r.categories?.[0] || 'General',
        publishedAt: r.publishedAt || r.date || '',
        url: `/blog/${r.slug}`,
      }));
    }

    return related.map((r) => ({
      title: r.title,
      slug: r.slug,
      excerpt: r.subtitle || r.excerpt || '',
      image: r.image || '',
      category: r.categories?.[0] || 'General',
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      url: `/blog/${r.slug}`,
    }));
  } catch (err) {
    return [];
  }
}
