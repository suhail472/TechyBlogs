import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyAuth } from '@/lib/middlewares/auth';
import { commentService } from '@/lib/services/comment.service';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    await verifyAuth(req);

    const data = await commentService.getThreadContext(id);
    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
