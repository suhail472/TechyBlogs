import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import commentService from '@/lib/services/comment.service';
import { verifyAuth } from '@/lib/middlewares/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = await verifyAuth(req);

    const body = await req.json();
    const { status, action, note } = body;

    const modAction = action || status;
    if (!modAction) throw new Error('Missing moderation action or status value');

    const result = await commentService.moderateComment(id, modAction, user, note);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const status = error.message?.includes('authorized') || error.message?.includes('authorization') ? 401 : 400;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    
    let user = null;
    try {
      user = await verifyAuth(req);
    } catch (e) {
      user = null;
    }

    const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const result = await commentService.deleteComment(id, user, rawIp);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const isAuthErr = error.message?.includes('authorized') || error.message?.includes('authorization') || error.message?.includes('Authentication');
    const status = isAuthErr ? 403 : 400;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}
