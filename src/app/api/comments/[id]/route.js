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
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = await verifyAuth(req);

    const result = await commentService.moderateComment(id, 'deleted', user, 'Deleted by moderator');
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
