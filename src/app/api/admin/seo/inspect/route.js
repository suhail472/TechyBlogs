import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import seoService from '@/lib/services/seo.service';
import { authenticateRequest } from '@/lib/middlewares/auth';

export async function POST(req) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const {
      title = '',
      content = '',
      excerpt = '',
      metaDescription = '',
      slug = '',
      primaryKeyword = '',
      secondaryKeywords = [],
      primaryTopicId = null,
      primaryRegionId = null,
    } = body;

    const analysis = seoService.analyzeContentSemantics({
      title,
      content,
      excerpt,
      metaDescription,
      slug,
      primaryKeyword,
      secondaryKeywords,
    });

    const linkOpportunities = await seoService.getInternalLinkOpportunities({
      content,
      currentSlug: slug,
      primaryTopicId,
      primaryRegionId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...analysis,
          linkOpportunities,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'SEO Inspection failed' },
      { status: 500 }
    );
  }
}
