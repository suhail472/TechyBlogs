import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';
import Taxonomy from '@/lib/models/taxonomy.model';
import Admin from '@/lib/models/admin.model';

const SITE_URL = 'https://teachyblogs.com';

export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/saved`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    await connectToDatabase();

    const [posts, sections, editions, topics, authors] = await Promise.all([
      Post.find({ status: 'published' })
        .select('slug updatedAt publishedAt')
        .sort({ publishedAt: -1 })
        .lean(),
      Taxonomy.find({ kind: 'section', active: true }).select('slug updatedAt').lean(),
      Taxonomy.find({ kind: 'edition', active: true }).select('slug updatedAt').lean(),
      Taxonomy.find({ kind: 'topic', active: true }).select('slug updatedAt').lean(),
      Admin.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    const blogEntries = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const sectionEntries = sections.map((sec) => ({
      url: `${SITE_URL}/section/${sec.slug}`,
      lastModified: sec.updatedAt || new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    }));

    const editionEntries = editions.map((ed) => ({
      url: `${SITE_URL}/edition/${ed.slug}`,
      lastModified: ed.updatedAt || new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    }));

    const topicEntries = topics.map((top) => ({
      url: `${SITE_URL}/topic/${top.slug}`,
      lastModified: top.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    }));

    const authorEntries = authors
      .filter((a) => a.slug)
      .map((author) => ({
        url: `${SITE_URL}/author/${author.slug}`,
        lastModified: author.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));

    return [...staticPages, ...editionEntries, ...sectionEntries, ...topicEntries, ...authorEntries, ...blogEntries];
  } catch (err) {
    console.warn('Sitemap generation using static fallback:', err.message);
    return staticPages;
  }
}
