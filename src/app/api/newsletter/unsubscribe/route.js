import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { token, reason } = body;

    const result = await subscriberService.unsubscribeByToken(token, reason);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
