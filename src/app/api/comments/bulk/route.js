import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { commentService } from '@/lib/services/comment.service';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectToDatabase();
    const user = await verifyAuth(req);

    const body = await req.json();
    const { commentIds, action } = body;

    const result = await commentService.bulkModerate(commentIds, action, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
