import connectToDatabase from '../../lib/db.js';
import Post, { getPublicPostFilter } from '../../lib/models/post.model.js';

const SITE_URL = 'https://techyblogs.com';

function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

export async function GET() {
  let newsArticles = [];
  try {
    await connectToDatabase();

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const filter = getPublicPostFilter({
      publishedAt: { $gte: twoDaysAgo },
      'seo.indexable': { $ne: false },
    });

    newsArticles = await Post.find(filter)
      .sort({ publishedAt: -1 })
      .select('title slug publishedAt language')
      .limit(1000)
      .lean();
  } catch (err) {
    console.warn('News sitemap generation error:', err.message);
  }

  const newsItems = newsArticles
    .map((article) => {
      const pubDate = new Date(article.publishedAt || Date.now()).toISOString();
      const title = escapeXml(article.title);
      const lang = escapeXml(article.language || 'en');

      return `
  <url>
    <loc>${SITE_URL}/blog/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>TechyBlogs</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  ${newsItems}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, s-maxage=1800',
    },
  });
}
