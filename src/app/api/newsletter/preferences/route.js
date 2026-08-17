import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Subscriber from '@/lib/models/subscriber.model';
import { subscriberService } from '@/lib/services/subscriber.service';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) throw new Error('Preference token required');

    const sub = await Subscriber.findOne({ unsubscribeToken: token })
      .select('email preferences status')
      .lean();

    if (!sub) throw new Error('Invalid or expired preference link');

    return NextResponse.json({ success: true, subscriber: sub }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { token, preferences } = body;

    const result = await subscriberService.updatePreferencesByToken(token, preferences);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
