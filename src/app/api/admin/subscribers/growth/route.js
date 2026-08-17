import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';

    const result = await subscriberService.getGrowthAnalytics(range);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
