import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { editorialService } from '@/lib/services/editorial.service';

// Call this from a deployment scheduler (for example, a Vercel cron). It is
// intentionally independent of an open browser session.
export async function POST(req) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!process.env.PUBLISHING_SECRET || secret !== process.env.PUBLISHING_SECRET) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const result = await editorialService.publishDueContent();
    return NextResponse.json({ success: true, published: result.modifiedCount });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
