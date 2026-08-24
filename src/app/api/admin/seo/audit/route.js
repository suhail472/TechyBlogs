import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import seoService from '@/lib/services/seo.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await verifyAuth(req);
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
    const isAuthError = error.message?.includes('authorized') || error.message?.includes('Admin not found');
    return NextResponse.json(
      { success: false, message: error.message || 'SEO audit failed' },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
