import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Post from '@/lib/models/post.model';

const SITE_URL = 'https://teachyblogs.com';

export async function GET() {
  await connectToDatabase();

  const posts = await Post.find({ status: 'published' })
    .sort({ publishedAt: -1 })
    .select('title slug excerpt author publishedAt image')
    .lean();

  const rssItems = posts
    .map((post) => {
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date().toUTCString();
      const safeTitle = escapeXml(post.title);
      const safeExcerpt = escapeXml(post.excerpt || '');

      return `
    <item>
      <title>${safeTitle}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <description>${safeExcerpt}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author || 'Suheel Hilal')}</author>
      ${post.image ? `<enclosure url="${escapeXml(post.image)}" type="image/jpeg" />` : ''}
    </item>`;
    })
    .join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TeachyBlogs - Web Development &amp; Coding Blog</title>
    <link>${SITE_URL}</link>
    <description>Discover modern web design patterns, tutorials, frameworks, and insights into the future of software engineering by Suheel Hilal.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>TeachyBlogs</title>
      <link>${SITE_URL}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
