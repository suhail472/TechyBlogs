import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectToDatabase();
    await verifyAuth(req);

    const body = await req.json();
    const result = await subscriberService.resolveAudience(body);

    return NextResponse.json({
      success: true,
      recipientCount: result.recipientCount,
      suppressedCount: result.suppressedCount,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
