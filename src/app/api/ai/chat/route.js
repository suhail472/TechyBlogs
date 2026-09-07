import { NextResponse } from 'next/server';
import { sanitizeUserMessage, sanitizeHistory } from '@/lib/ai/safety';
import { checkRateLimit, getClientFingerprint } from '@/lib/ai/rateLimit';
import { getPublicArticleContext } from '@/lib/ai/context';
import { streamEditorialResponse } from '@/lib/ai/provider';
import '@/lib/models/taxonomy.model';
import '@/lib/models/post.model';
import '@/lib/models/admin.model';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // 1. Rate Limiting Check
    const clientFingerprint = getClientFingerprint(req);
    const rateCheck = checkRateLimit(clientFingerprint);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Please wait ${rateCheck.resetInSeconds}s before sending another question.`,
        },
        { status: 429, headers: { 'Retry-After': String(rateCheck.resetInSeconds) } }
      );
    }

    // 2. Parse & Validate Payload
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const { message, articleSlug, history } = body || {};

    const validation = sanitizeUserMessage(message);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const cleanHistory = sanitizeHistory(history);

    // 3. Retrieve Public Article Context (Strict Public Invariant)
    let context = null;
    try {
      context = await getPublicArticleContext(articleSlug);
    } catch (err) {
      console.warn('[AI Chat API] Context fetch issue:', err.message);
    }

    // 4. Create Server-Sent Events (SSE) Stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Send initial metadata event with related public stories and article context
        if (context) {
          const metaEvent = `event: metadata\ndata: ${JSON.stringify({
            relatedStories: context.relatedStories || [],
            articleTitle: context.article?.title || '',
            articleSection: context.article?.section || '',
            articleAuthor: context.article?.author || '',
            articlePublishedAt: context.article?.publishedAt || '',
            articleHeadings: (context.article?.headings || []).slice(0, 10),
            articleSources: context.article?.sources || [],
            wordCount: context.article?.wordCount || 0,
            readTime: context.article?.readTime || '',
            topics: context.article?.topics || [],
          })}\n\n`;
          controller.enqueue(encoder.encode(metaEvent));
        }

        try {
          // Stream chunks from AI provider
          for await (const chunk of streamEditorialResponse({
            userMessage: validation.sanitized,
            articleContext: context,
            history: cleanHistory,
          })) {
            const dataEvent = `data: ${JSON.stringify({ chunk })}\n\n`;
            controller.enqueue(encoder.encode(dataEvent));
          }

          // Send stream completion event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errorEvent = `event: error\ndata: ${JSON.stringify({ error: err.message || 'TechyBlogs AI is temporarily unavailable.' })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'AI request failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'TechyBlogs AI Editorial Assistant API',
    status: 'operational',
    version: '1.0.0',
  });
}
