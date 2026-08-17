import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const metrics = await subscriberService.getAudienceMetrics();
    return NextResponse.json({ success: true, ...metrics }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
