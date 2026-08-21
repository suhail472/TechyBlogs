import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import seoService from '@/lib/services/seo.service';
import { authenticateRequest } from '@/lib/middlewares/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const auditData = await seoService.runSiteAudit();

    return NextResponse.json(
      {
        success: true,
        data: auditData,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'SEO audit failed' },
      { status: 500 }
    );
  }
}
