import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import seoService from '@/lib/services/seo.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export async function POST(req) {
  try {
    await verifyAuth(req);
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
    const isAuthError = error.message?.includes('authorized') || error.message?.includes('Admin not found');
    return NextResponse.json(
      { success: false, message: error.message || 'SEO Inspection failed' },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
