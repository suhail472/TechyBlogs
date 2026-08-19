import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import commentService from '@/lib/services/comment.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = await verifyAuth(req);

    const body = await req.json().catch(() => ({}));
    const { reaction } = body;

    const result = await commentService.reactToComment(id, reaction, user);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const isAuthErr = error.message?.includes('authorized') || error.message?.includes('authorization') || error.message?.includes('Authentication');
    const status = isAuthErr ? 401 : 400;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}
