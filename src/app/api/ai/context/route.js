import { NextResponse } from 'next/server';
import { getPublicArticleContext } from '@/lib/ai/context';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 });
    }

    const context = await getPublicArticleContext(slug);

    if (!context || !context.article) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        title: context.article.title,
        slug: context.article.slug,
        subtitle: context.article.subtitle,
        author: context.article.author,
        section: context.article.section,
        topic: context.article.topic,
        region: context.article.region,
        contentType: context.article.contentType,
        publishedAt: context.article.publishedAt,
        wordCount: context.article.wordCount,
        readTime: context.article.readTime,
        topics: context.article.topics || [],
        headings: (context.article.headings || []).slice(0, 12),
        sources: context.article.sources || [],
        relatedStories: context.relatedStories || [],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
