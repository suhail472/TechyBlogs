import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import subscriberService from '@/lib/services/subscriber.service';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email } = body;
    if (!email) throw new Error('Email address is required');

    const result = await subscriberService.subscribe(email);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
