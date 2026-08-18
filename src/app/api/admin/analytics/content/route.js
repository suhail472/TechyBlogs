import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { analyticsService } from '@/lib/services/analytics.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const desk = searchParams.get('desk') || 'all';
    const sortBy = searchParams.get('sortBy') || 'views';
    const page = parseInt(searchParams.get('page'), 10) || 1;
    const limit = parseInt(searchParams.get('limit'), 10) || 10;

    const data = await analyticsService.getContentPerformance({ desk }, sortBy, page, limit);
    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
