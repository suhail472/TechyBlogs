import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { commentService } from '@/lib/services/comment.service';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const body = await req.json();
    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await commentService.reportComment(id, {
      reason: body.reason,
      rawIp,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
